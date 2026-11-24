-- Steward monthly pay.
--
-- Each plan has a monthly amount the steward earns for every batch they run.
-- A batch's months start when a farmer is assigned and run until the batch is
-- settled; at settlement the month in progress counts as a full month.
--
-- Month k of a batch covers [start + (k-1) months, start + k months), in
-- Bangladesh time. A month becomes due once it has ended. An admin sends due
-- months to the steward's wallet (type 'monthly_pay'); the steward withdraws
-- it like any wallet money.
--
-- At settlement, months not sent yet are sent automatically, then the
-- steward's 5% profit share is matched against the total monthly pay:
--   steward_topup = max(0, share - monthly total)   (credited at settlement)
--   platform_loss = max(0, monthly total - share)   (Krishi carries it)
-- Monthly pay is never taken back from the steward. The investor and the
-- farmer are not affected: monthly pay comes from Krishi, not the batch.
--
-- Batches already running when this ships start counting on 1 December 2026.

-- ─── Rates ───────────────────────────────────────────────────────────────────
alter table public.investment_plans
  add column if not exists steward_monthly_pay numeric not null default 0
    check (steward_monthly_pay >= 0);

-- The batch keeps its own rate (copied from the plan), so a plan change does
-- not change running batches. Null until the plan has a rate.
alter table public.investments
  add column if not exists monthly_pay_start timestamptz,
  add column if not exists steward_monthly_pay numeric
    check (steward_monthly_pay is null or steward_monthly_pay >= 0);

-- ─── Settlement figures ──────────────────────────────────────────────────────
-- Null on settlements made before monthly pay existed.
alter table public.investment_settlements
  add column if not exists steward_months int,
  add column if not exists steward_monthly_total numeric,
  add column if not exists steward_topup numeric,
  add column if not exists platform_loss numeric;

-- ─── Wallet type ─────────────────────────────────────────────────────────────
alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_type_check
  check (type in ('settlement_payout', 'settlement_share', 'withdrawal', 'withdrawal_reversal',
                  'adjustment', 'fund_release', 'monthly_pay'));

-- ─── Months sent ─────────────────────────────────────────────────────────────
create table if not exists public.steward_monthly_payments (
  id               uuid primary key default gen_random_uuid(),
  investment_id    uuid not null references public.investments(id) on delete cascade,
  steward_id       uuid not null references public.users(id),
  month_no         int not null check (month_no >= 1),
  period_start     timestamptz not null,
  period_end       timestamptz not null,
  amount           numeric not null check (amount > 0),
  status           text not null default 'sent' check (status in ('sent', 'reversed')),
  -- Sent automatically when the batch was settled.
  at_settlement    boolean not null default false,
  sent_by          uuid references public.users(id) on delete set null,
  sent_at          timestamptz not null default now(),
  wallet_tx_id     uuid references public.wallet_transactions(id) on delete set null,
  reversed_by      uuid references public.users(id) on delete set null,
  reversed_at      timestamptz,
  reversal_reason  text,
  reversal_tx_id   uuid references public.wallet_transactions(id) on delete set null
);

-- A month can be sent once (a reversed month can be sent again).
create unique index if not exists steward_monthly_payments_once
  on public.steward_monthly_payments(investment_id, month_no) where status = 'sent';
create index if not exists steward_monthly_payments_steward_idx
  on public.steward_monthly_payments(steward_id, sent_at desc);

alter table public.steward_monthly_payments enable row level security;
revoke all on public.steward_monthly_payments from anon, authenticated;
grant select, insert, update, delete on public.steward_monthly_payments to service_role;

-- ─── Month arithmetic ────────────────────────────────────────────────────────
-- Months of a batch at a moment: the months that have ended, plus the month in
-- progress when p_partial (used at settlement).
create or replace function public.pay_months(p_start timestamptz, p_at timestamptz, p_partial boolean)
returns int
language sql
stable
as $$
  select case
    when p_start is null or p_at <= p_start then 0
    else (
      select count(*)::int + case when p_partial and
               (p_start at time zone 'Asia/Dhaka') + count(*)::int * interval '1 month'
               < (p_at at time zone 'Asia/Dhaka') then 1 else 0 end
        from generate_series(
               1,
               (extract(year from age(p_at at time zone 'Asia/Dhaka', p_start at time zone 'Asia/Dhaka')) * 12
                + extract(month from age(p_at at time zone 'Asia/Dhaka', p_start at time zone 'Asia/Dhaka')))::int + 1
             ) as k(n)
       where (p_start at time zone 'Asia/Dhaka') + n * interval '1 month' <= (p_at at time zone 'Asia/Dhaka')
    )
  end
$$;

-- Months that have ended and are not sent yet, for running batches.
create or replace view public.steward_monthly_pay_due
with (security_invoker = true) as
select i.id as investment_id,
       i.reference,
       o.steward_id,
       k.n as month_no,
       ((i.monthly_pay_start at time zone 'Asia/Dhaka') + (k.n - 1) * interval '1 month') at time zone 'Asia/Dhaka' as period_start,
       ((i.monthly_pay_start at time zone 'Asia/Dhaka') + k.n * interval '1 month') at time zone 'Asia/Dhaka' as period_end,
       i.steward_monthly_pay as amount
  from public.investments i
  join public.steward_plan_offerings o on o.id = i.offering_id
  cross join lateral generate_series(1, public.pay_months(i.monthly_pay_start, now(), false)) as k(n)
 where i.status = 'active'
   and coalesce(i.current_stage, '') <> 'settled'
   and i.monthly_pay_start is not null
   and coalesce(i.steward_monthly_pay, 0) > 0
   and not exists (
     select 1 from public.steward_monthly_payments p
      where p.investment_id = i.id and p.month_no = k.n and p.status = 'sent'
   );

revoke all on public.steward_monthly_pay_due from anon, authenticated;
grant select on public.steward_monthly_pay_due to service_role;

-- ─── Start the months when a farmer is assigned ──────────────────────────────
create or replace function public.start_monthly_pay()
returns trigger
language plpgsql
as $$
begin
  if new.farmer_id is not null and new.monthly_pay_start is null
     and (tg_op = 'INSERT' or old.farmer_id is null) then
    new.monthly_pay_start := now();
  end if;
  if new.monthly_pay_start is not null and new.steward_monthly_pay is null then
    select nullif(p.steward_monthly_pay, 0) into new.steward_monthly_pay
      from public.steward_plan_offerings o
      join public.investment_plans p on p.id = o.plan_id
     where o.id = new.offering_id;
  end if;
  return new;
end;
$$;

drop trigger if exists investments_start_monthly_pay on public.investments;
create trigger investments_start_monthly_pay
  before insert or update of farmer_id on public.investments
  for each row execute function public.start_monthly_pay();

-- A plan got a rate: running batches of that plan without one take it.
create or replace function public.apply_plan_monthly_pay(p_plan_id uuid)
returns int
language plpgsql
as $$
declare
  v_rate numeric;
  v_count int;
begin
  select steward_monthly_pay into v_rate from public.investment_plans where id = p_plan_id;
  if coalesce(v_rate, 0) <= 0 then
    return 0;
  end if;
  update public.investments i
     set steward_monthly_pay = v_rate
    from public.steward_plan_offerings o
   where o.id = i.offering_id
     and o.plan_id = p_plan_id
     and i.steward_monthly_pay is null
     and i.monthly_pay_start is not null
     and i.status = 'active'
     and coalesce(i.current_stage, '') <> 'settled';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ─── Send one due month ──────────────────────────────────────────────────────
create or replace function public.send_monthly_pay(p_investment_id uuid, p_month_no int, p_admin_id uuid)
returns uuid
language plpgsql
as $$
declare
  d record;
  v_status text;
  v_tx uuid;
  v_id uuid;
begin
  -- One sender at a time per batch.
  perform 1 from public.investments where id = p_investment_id for update;

  select * into d from public.steward_monthly_pay_due
   where investment_id = p_investment_id and month_no = p_month_no;
  if d.investment_id is null then
    raise exception 'NOT_DUE' using errcode = 'P0001';
  end if;

  select status into v_status from public.users where id = d.steward_id;
  if v_status is distinct from 'active' then
    raise exception 'STEWARD_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  insert into public.wallet_transactions (user_id, type, amount, description, investment_id)
  values (d.steward_id, 'monthly_pay', d.amount,
          'Monthly pay for ' || d.reference || ', month ' || p_month_no, p_investment_id)
  returning id into v_tx;

  insert into public.steward_monthly_payments
    (investment_id, steward_id, month_no, period_start, period_end, amount, sent_by, wallet_tx_id)
  values
    (p_investment_id, d.steward_id, p_month_no, d.period_start, d.period_end, d.amount, p_admin_id, v_tx)
  returning id into v_id;

  return v_id;
end;
$$;

-- ─── Reverse a month sent by mistake ─────────────────────────────────────────
-- Only before settlement (settlement already matched it against the share),
-- and only if the steward still has the money in their wallet.
create or replace function public.reverse_monthly_pay(p_payment_id uuid, p_admin_id uuid, p_reason text)
returns void
language plpgsql
as $$
declare
  p record;
  v_stage text;
  v_balance numeric;
  v_tx uuid;
begin
  select mp.*, i.reference, i.current_stage
    into p
    from public.steward_monthly_payments mp
    join public.investments i on i.id = mp.investment_id
   where mp.id = p_payment_id
   for update of mp;
  if p.id is null or p.status <> 'sent' then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if p.at_settlement or coalesce(p.current_stage, '') = 'settled' then
    raise exception 'ALREADY_SETTLED' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('wallet:' || p.steward_id::text));
  select coalesce(sum(amount), 0) into v_balance from public.wallet_transactions where user_id = p.steward_id;
  if v_balance < p.amount then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  insert into public.wallet_transactions (user_id, type, amount, description, investment_id)
  values (p.steward_id, 'adjustment', -p.amount,
          'Monthly pay reversed: ' || p.reference || ', month ' || p.month_no
            || coalesce(' (' || nullif(trim(p_reason), '') || ')', ''),
          p.investment_id)
  returning id into v_tx;

  update public.steward_monthly_payments
     set status = 'reversed', reversed_by = p_admin_id, reversed_at = now(),
         reversal_reason = nullif(trim(p_reason), ''), reversal_tx_id = v_tx
   where id = p_payment_id;
end;
$$;

-- ─── What settlement would do (preview) ──────────────────────────────────────
create or replace function public.monthly_pay_preview(p_investment_id uuid)
returns table (months int, rate numeric, sent_months int, sent_total numeric, total numeric)
language plpgsql
stable
as $$
declare
  i record;
  m int := 0;
  unsent int := 0;
begin
  select inv.monthly_pay_start, inv.steward_monthly_pay
    into i
    from public.investments inv
   where inv.id = p_investment_id;

  select count(*)::int, coalesce(sum(amount), 0)
    into sent_months, sent_total
    from public.steward_monthly_payments
   where investment_id = p_investment_id and status = 'sent';

  rate := coalesce(i.steward_monthly_pay, 0);
  if i.monthly_pay_start is not null and rate > 0 then
    m := public.pay_months(i.monthly_pay_start, now(), true);
    select count(*)::int into unsent
      from generate_series(1, m) as k(n)
     where not exists (
       select 1 from public.steward_monthly_payments p
        where p.investment_id = p_investment_id and p.month_no = k.n and p.status = 'sent');
  end if;

  months := greatest(m, sent_months);
  total := sent_total + unsent * rate;
  return next;
end;
$$;

-- ─── At settlement ───────────────────────────────────────────────────────────
create or replace function public.settle_monthly_pay(p_investment_id uuid, p_settlement_id uuid, p_admin_id uuid)
returns void
language plpgsql
as $$
declare
  i record;
  m int := 0;
  k int;
  v_tx uuid;
  v_total numeric;
  v_count int;
  v_share numeric;
begin
  select inv.id, inv.reference, inv.monthly_pay_start, inv.steward_monthly_pay, o.steward_id
    into i
    from public.investments inv
    join public.steward_plan_offerings o on o.id = inv.offering_id
   where inv.id = p_investment_id;

  if i.monthly_pay_start is not null and coalesce(i.steward_monthly_pay, 0) > 0 then
    m := public.pay_months(i.monthly_pay_start, now(), true);
    for k in 1..m loop
      if not exists (select 1 from public.steward_monthly_payments
                      where investment_id = p_investment_id and month_no = k and status = 'sent') then
        insert into public.wallet_transactions (user_id, type, amount, description, investment_id)
        values (i.steward_id, 'monthly_pay', i.steward_monthly_pay,
                'Monthly pay for ' || i.reference || ', month ' || k || ' (at settlement)', p_investment_id)
        returning id into v_tx;
        insert into public.steward_monthly_payments
          (investment_id, steward_id, month_no, period_start, period_end, amount, at_settlement, sent_by, wallet_tx_id)
        values
          (p_investment_id, i.steward_id, k,
           ((i.monthly_pay_start at time zone 'Asia/Dhaka') + (k - 1) * interval '1 month') at time zone 'Asia/Dhaka',
           ((i.monthly_pay_start at time zone 'Asia/Dhaka') + k * interval '1 month') at time zone 'Asia/Dhaka',
           i.steward_monthly_pay, true, p_admin_id, v_tx);
      end if;
    end loop;
  end if;

  select coalesce(sum(amount), 0), count(*)::int
    into v_total, v_count
    from public.steward_monthly_payments
   where investment_id = p_investment_id and status = 'sent';
  select steward_share into v_share from public.investment_settlements where id = p_settlement_id;

  update public.investment_settlements
     set steward_months = v_count,
         steward_monthly_total = v_total,
         steward_topup = greatest(0, v_share - v_total),
         platform_loss = greatest(0, v_total - v_share)
   where id = p_settlement_id;
end;
$$;

-- The steward's settlement credit is the top-up (share minus monthly pay).
create or replace function public.credit_settlement(p_settlement_id uuid)
returns void
language plpgsql
as $$
declare
  s record;
  v_steward numeric;
begin
  select st.id, st.investment_id, st.investor_payout, st.farmer_share, st.steward_share, st.steward_topup,
         i.investor_id, i.farmer_id, i.reference, o.steward_id
    into s
    from public.investment_settlements st
    join public.investments i on i.id = st.investment_id
    join public.steward_plan_offerings o on o.id = i.offering_id
   where st.id = p_settlement_id;

  if s.id is null then
    raise exception 'SETTLEMENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if s.investor_payout > 0 then
    insert into public.wallet_transactions (user_id, type, amount, description, investment_id, settlement_id)
    values (s.investor_id, 'settlement_payout', s.investor_payout, 'Payout for ' || s.reference, s.investment_id, s.id)
    on conflict do nothing;
  end if;
  if s.farmer_share > 0 and s.farmer_id is not null then
    insert into public.wallet_transactions (user_id, type, amount, description, investment_id, settlement_id)
    values (s.farmer_id, 'settlement_share', s.farmer_share, 'Profit share for ' || s.reference, s.investment_id, s.id)
    on conflict do nothing;
  end if;
  v_steward := coalesce(s.steward_topup, s.steward_share);
  if v_steward > 0 then
    insert into public.wallet_transactions (user_id, type, amount, description, investment_id, settlement_id)
    values (s.steward_id, 'settlement_share', v_steward,
            case when s.steward_topup is not null and s.steward_topup < s.steward_share
                 then 'Profit share for ' || s.reference || ' (after monthly pay)'
                 else 'Profit share for ' || s.reference end,
            s.investment_id, s.id)
    on conflict do nothing;
  end if;
end;
$$;

-- Settle: same as before, plus monthly pay before the wallet credits.
create or replace function public.settle_investment_sale(
  p_sale_id uuid,
  p_admin_id uuid,
  p_capital numeric,
  p_funds_released numeric,
  p_sale_amount numeric,
  p_total_return numeric,
  p_net_result numeric,
  p_outcome text,
  p_investor_payout numeric,
  p_farmer_share numeric,
  p_steward_share numeric,
  p_platform_share numeric,
  p_split jsonb,
  p_note text
)
returns uuid
language plpgsql
as $$
declare
  v_investment_id uuid;
  v_settlement_id uuid;
begin
  update public.investment_sales
     set status = 'settled',
         received_by = p_admin_id,
         received_at = now(),
         remit_rejection_reason = null
   where id = p_sale_id
     and status = 'remittance_submitted'
  returning investment_id into v_investment_id;

  if v_investment_id is null then
    raise exception 'SALE_NOT_READY' using errcode = 'P0001';
  end if;

  -- No monthly pay is sent for this batch while it settles.
  perform 1 from public.investments where id = v_investment_id for update;

  insert into public.investment_settlements (
    investment_id, sale_id, capital, funds_released, sale_amount, total_return,
    net_result, outcome, investor_payout, farmer_share, steward_share,
    platform_share, split, note, settled_by
  ) values (
    v_investment_id, p_sale_id, p_capital, p_funds_released, p_sale_amount, p_total_return,
    p_net_result, p_outcome, p_investor_payout, p_farmer_share, p_steward_share,
    p_platform_share, p_split, p_note, p_admin_id
  )
  returning id into v_settlement_id;

  update public.investments
     set status = 'completed',
         current_stage = 'settled'
   where id = v_investment_id;

  perform public.settle_monthly_pay(v_investment_id, v_settlement_id, p_admin_id);
  perform public.credit_settlement(v_settlement_id);

  return v_settlement_id;
end;
$$;

revoke all on function public.pay_months(timestamptz, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.start_monthly_pay() from public, anon, authenticated;
revoke all on function public.apply_plan_monthly_pay(uuid) from public, anon, authenticated;
revoke all on function public.send_monthly_pay(uuid, int, uuid) from public, anon, authenticated;
revoke all on function public.reverse_monthly_pay(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.monthly_pay_preview(uuid) from public, anon, authenticated;
revoke all on function public.settle_monthly_pay(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.pay_months(timestamptz, timestamptz, boolean) to service_role;
grant execute on function public.apply_plan_monthly_pay(uuid) to service_role;
grant execute on function public.send_monthly_pay(uuid, int, uuid) to service_role;
grant execute on function public.reverse_monthly_pay(uuid, uuid, text) to service_role;
grant execute on function public.monthly_pay_preview(uuid) to service_role;
grant execute on function public.settle_monthly_pay(uuid, uuid, uuid) to service_role;

-- ─── Batches already running: start on 1 December 2026 (Bangladesh time) ────
update public.investments
   set monthly_pay_start = timestamptz '2026-12-01 00:00:00+06'
 where farmer_id is not null
   and monthly_pay_start is null
   and status = 'active'
   and coalesce(current_stage, '') <> 'settled';
