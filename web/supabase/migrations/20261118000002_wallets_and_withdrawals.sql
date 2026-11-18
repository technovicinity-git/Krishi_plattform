-- Wallets and withdrawals.
--
-- Every money movement for a user is one row in wallet_transactions
-- (positive = money in, negative = money out); the balance is their sum.
-- Settling a sale credits the investor, farmer and steward.
-- A withdrawal request holds its amount immediately (a negative row) so the
-- same money can't be requested twice; rejecting or cancelling it adds the
-- amount back. Admin pays it outside the app and marks it paid.

create sequence if not exists public.withdrawal_ref_seq start 1;

create table if not exists public.withdrawal_requests (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique
                        default ('KR-WD-' || lpad(nextval('public.withdrawal_ref_seq')::text, 6, '0')),
  user_id               uuid not null references public.users(id),
  amount                numeric(14,2) not null check (amount > 0),

  -- Where to send it, copied from withdrawal_preferences at request time
  method                text not null check (method in ('mobile', 'bank')),
  account_holder_name   text not null,
  mfs_provider          text,
  mobile_number         text,
  bank_name             text,
  bank_account_number   text,
  bank_branch           text,
  bank_routing_number   text,

  status                text not null default 'pending'
                        check (status in ('pending', 'paid', 'rejected', 'cancelled')),
  payout_txn_id         text,
  admin_note            text,
  rejection_reason      text,
  reviewed_by           uuid references public.users(id),
  reviewed_at           timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists withdrawal_requests_user_idx on public.withdrawal_requests(user_id);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests(status);

drop trigger if exists withdrawal_requests_touch on public.withdrawal_requests;
create trigger withdrawal_requests_touch
  before update on public.withdrawal_requests
  for each row execute function public.touch_updated_at();

alter table public.withdrawal_requests enable row level security;
grant select, insert, update, delete on public.withdrawal_requests to service_role;

create table if not exists public.wallet_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id),
  type             text not null check (type in (
                     'settlement_payout',     -- investor: capital back + profit share
                     'settlement_share',      -- farmer / steward profit share
                     'withdrawal',            -- money held / paid out (negative)
                     'withdrawal_reversal',   -- rejected or cancelled withdrawal (positive)
                     'adjustment'             -- manual correction by admin
                   )),
  amount           numeric(14,2) not null check (amount <> 0),
  description      text,
  investment_id    uuid references public.investments(id) on delete set null,
  settlement_id    uuid references public.investment_settlements(id) on delete set null,
  withdrawal_id    uuid references public.withdrawal_requests(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx
  on public.wallet_transactions(user_id, created_at desc);

-- A settlement credits each person once; a withdrawal is held and reversed at most once.
create unique index if not exists wallet_tx_settlement_once
  on public.wallet_transactions(settlement_id, user_id, type) where settlement_id is not null;
create unique index if not exists wallet_tx_withdrawal_once
  on public.wallet_transactions(withdrawal_id, type) where withdrawal_id is not null;

alter table public.wallet_transactions enable row level security;
grant select, insert, update, delete on public.wallet_transactions to service_role;

-- ─── Credits from a settlement ───────────────────────────────────────────────
create or replace function public.credit_settlement(p_settlement_id uuid)
returns void
language plpgsql
as $$
declare
  s record;
begin
  select st.id, st.investment_id, st.investor_payout, st.farmer_share, st.steward_share,
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
  if s.steward_share > 0 then
    insert into public.wallet_transactions (user_id, type, amount, description, investment_id, settlement_id)
    values (s.steward_id, 'settlement_share', s.steward_share, 'Profit share for ' || s.reference, s.investment_id, s.id)
    on conflict do nothing;
  end if;
end;
$$;

-- Settle now also credits the wallets, in the same transaction.
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

  perform public.credit_settlement(v_settlement_id);

  return v_settlement_id;
end;
$$;

-- Credit any settlement made before wallets existed.
do $$
declare r record;
begin
  for r in select id from public.investment_settlements loop
    perform public.credit_settlement(r.id);
  end loop;
end $$;

-- ─── Withdrawals ─────────────────────────────────────────────────────────────

-- Create a request and hold the money. Serialised per user so two requests
-- at once can't both pass the balance check.
create or replace function public.request_withdrawal(
  p_user_id uuid,
  p_amount numeric,
  p_min_amount numeric
)
returns uuid
language plpgsql
as $$
declare
  v_balance numeric;
  v_pref record;
  v_id uuid;
  v_ref text;
begin
  perform pg_advisory_xact_lock(hashtext('wallet:' || p_user_id::text));

  if p_amount < p_min_amount then
    raise exception 'BELOW_MINIMUM' using errcode = 'P0001';
  end if;

  select coalesce(sum(amount), 0) into v_balance
    from public.wallet_transactions where user_id = p_user_id;
  if p_amount > v_balance then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  select * into v_pref from public.withdrawal_preferences where user_id = p_user_id;
  if v_pref.user_id is null then
    raise exception 'NO_PAYOUT_ACCOUNT' using errcode = 'P0001';
  end if;

  insert into public.withdrawal_requests (
    user_id, amount, method, account_holder_name, mfs_provider, mobile_number,
    bank_name, bank_account_number, bank_branch, bank_routing_number
  ) values (
    p_user_id, p_amount, v_pref.method, v_pref.account_holder_name, v_pref.mfs_provider,
    v_pref.mobile_number, v_pref.bank_name, v_pref.bank_account_number,
    v_pref.bank_branch, v_pref.bank_routing_number
  )
  returning id, reference into v_id, v_ref;

  insert into public.wallet_transactions (user_id, type, amount, description, withdrawal_id)
  values (p_user_id, 'withdrawal', -p_amount, 'Withdrawal ' || v_ref, v_id);

  return v_id;
end;
$$;

-- Close a pending request: 'paid' keeps the hold, 'rejected'/'cancelled' return the money.
create or replace function public.close_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_reviewer_id uuid,
  p_payout_txn_id text,
  p_note text,
  p_reason text
)
returns void
language plpgsql
as $$
declare
  w record;
begin
  if p_status not in ('paid', 'rejected', 'cancelled') then
    raise exception 'BAD_STATUS' using errcode = 'P0001';
  end if;

  update public.withdrawal_requests
     set status = p_status,
         reviewed_by = p_reviewer_id,
         reviewed_at = now(),
         payout_txn_id = case when p_status = 'paid' then p_payout_txn_id else payout_txn_id end,
         admin_note = coalesce(p_note, admin_note),
         rejection_reason = case when p_status = 'rejected' then p_reason else rejection_reason end
   where id = p_withdrawal_id
     and status = 'pending'
  returning id, user_id, amount, reference into w;

  if w.id is null then
    raise exception 'NOT_PENDING' using errcode = 'P0001';
  end if;

  if p_status <> 'paid' then
    insert into public.wallet_transactions (user_id, type, amount, description, withdrawal_id)
    values (w.user_id, 'withdrawal_reversal', w.amount,
            case when p_status = 'rejected' then 'Withdrawal ' || w.reference || ' rejected'
                 else 'Withdrawal ' || w.reference || ' cancelled' end,
            w.id);
  end if;
end;
$$;

revoke all on function public.credit_settlement(uuid) from public, anon, authenticated;
revoke all on function public.request_withdrawal(uuid, numeric, numeric) from public, anon, authenticated;
revoke all on function public.close_withdrawal(uuid, text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.credit_settlement(uuid) to service_role;
grant execute on function public.request_withdrawal(uuid, numeric, numeric) to service_role;
grant execute on function public.close_withdrawal(uuid, text, uuid, text, text, text) to service_role;
