-- Refunds for paid online payments that can't become an investment
-- (units sold out, payment held as risky, deposit couldn't be recorded).
--
-- gateway: Krishi asks SSLCommerz to refund; the payment is 'refund_pending'
--          until SSLCommerz reports it refunded.
-- manual:  the money was returned another way (bKash, bank); 'refunded' at once.
-- Either way the deposit becomes 'refunded' and the interest is cancelled
-- (or reopened for payment if the admin allows a retry).

alter table public.online_payments drop constraint if exists online_payments_status_check;
alter table public.online_payments
  add constraint online_payments_status_check
  check (status in ('initiated', 'paid', 'failed', 'cancelled', 'invalid', 'refund_pending', 'refunded'));

alter table public.online_payments
  add column if not exists refund_method       text check (refund_method is null or refund_method in ('gateway', 'manual')),
  add column if not exists refund_amount       numeric(14,2) check (refund_amount is null or refund_amount > 0),
  add column if not exists refund_reason       text,
  add column if not exists refund_reference    text,          -- manual: the transfer's ID / note
  add column if not exists refund_ref_id       text,          -- gateway: SSLCommerz refund_ref_id
  add column if not exists refund_response     jsonb,         -- last SSLCommerz refund API answer
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refunded_at         timestamptz,
  add column if not exists refunded_by         uuid references public.users(id) on delete set null;

alter table public.deposits drop constraint if exists deposits_status_check;
alter table public.deposits
  add constraint deposits_status_check
  check (status in ('pending', 'approved', 'rejected', 'refunded'));
