-- Online payments through SSLCommerz (investor deposits).
--
-- One row per payment attempt. The app creates it (initiated), sends the
-- investor to SSLCommerz, then validates the result with SSLCommerz's
-- validation API before marking it paid. A paid payment creates a deposit,
-- which is approved automatically (or left pending for admin if, say, the
-- offering ran out of units meanwhile).

create sequence if not exists public.online_payment_ref_seq start 1;

create table if not exists public.online_payments (
  id               uuid primary key default gen_random_uuid(),
  tran_id          text not null unique
                   default ('KR-TXN-' || lpad(nextval('public.online_payment_ref_seq')::text, 7, '0')),
  provider         text not null default 'sslcommerz' check (provider in ('sslcommerz')),
  interest_id      uuid not null references public.investment_interests(id) on delete cascade,
  investor_id      uuid not null references public.users(id) on delete cascade,
  amount           numeric(14,2) not null check (amount > 0),
  currency         text not null default 'BDT',
  status           text not null default 'initiated'
                   check (status in ('initiated', 'paid', 'failed', 'cancelled', 'invalid')),
  locale           text not null default 'bn' check (locale in ('bn', 'en')),
  session_key      text,
  val_id           text,
  bank_tran_id     text,
  card_type        text,
  card_brand       text,
  gateway_status   text,
  failure_reason   text,
  validation       jsonb,               -- SSLCommerz validation API response
  deposit_id       uuid references public.deposits(id) on delete set null,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists online_payments_interest_idx on public.online_payments(interest_id);
create index if not exists online_payments_status_idx on public.online_payments(status);

drop trigger if exists online_payments_touch on public.online_payments;
create trigger online_payments_touch
  before update on public.online_payments
  for each row execute function public.touch_updated_at();

alter table public.online_payments enable row level security;
grant select, insert, update, delete on public.online_payments to service_role;
grant usage, select on sequence public.online_payment_ref_seq to service_role;

-- Deposits can now also come from the payment gateway.
comment on column public.deposits.method is 'bank | mfs (manual transfer) | online (SSLCommerz)';
