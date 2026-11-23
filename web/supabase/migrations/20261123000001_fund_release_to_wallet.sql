-- Approved fund requests reach the farmer through their wallet.
--
-- Before: a steward approving a fund request only changed its status; nothing
-- paid the farmer and the money wasn't withdrawable. Now approval credits the
-- farmer's wallet (type 'fund_release'), and the farmer withdraws it like any
-- wallet money (an admin pays the withdrawal). The spending rules are
-- unchanged: approved requests count as paid out of the batch's capital, and
-- unspent fund money still goes back to Krishi with the sale money.

alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_type_check
  check (type in ('settlement_payout', 'settlement_share', 'withdrawal', 'withdrawal_reversal', 'adjustment', 'fund_release'));

alter table public.wallet_transactions
  add column if not exists fund_request_id uuid references public.fund_requests(id) on delete set null;

-- One credit per fund request, whatever happens.
create unique index if not exists wallet_tx_fund_request_once
  on public.wallet_transactions(fund_request_id) where fund_request_id is not null;

-- Credit the farmer when a request becomes approved (or disbursed).
create or replace function public.credit_fund_release()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('approved', 'disbursed')
     and (tg_op = 'INSERT' or old.status not in ('approved', 'disbursed')) then
    insert into public.wallet_transactions (user_id, type, amount, description, investment_id, fund_request_id)
    select new.farmer_id, 'fund_release', new.amount,
           'Funds for ' || coalesce(i.reference, 'batch') || ' (' || replace(new.purpose, '_', ' ') || ')',
           new.investment_id, new.id
      from public.investments i
     where i.id = new.investment_id
    on conflict (fund_request_id) where fund_request_id is not null do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.credit_fund_release() from public, anon, authenticated;
grant execute on function public.credit_fund_release() to service_role;

drop trigger if exists fund_requests_credit_wallet on public.fund_requests;
create trigger fund_requests_credit_wallet
  after insert or update of status on public.fund_requests
  for each row execute function public.credit_fund_release();

-- Requests approved before this change, on batches that aren't settled yet:
-- credit them now. (On settled batches the money was handled outside the app.)
insert into public.wallet_transactions (user_id, type, amount, description, investment_id, fund_request_id, created_at)
select f.farmer_id, 'fund_release', f.amount,
       'Funds for ' || i.reference || ' (' || replace(f.purpose, '_', ' ') || ')',
       f.investment_id, f.id, coalesce(f.reviewed_at, f.created_at)
  from public.fund_requests f
  join public.investments i on i.id = f.investment_id
 where f.status in ('approved', 'disbursed')
   and i.current_stage <> 'settled'
   and not exists (select 1 from public.wallet_transactions w where w.fund_request_id = f.id);
