-- Baseline for tables that were created by hand in the Supabase dashboard
-- and never had a migration: platform_accounts, deposits, investments,
-- fund_requests, expenses, investment_updates; plus the storage buckets.
--
-- Copied from the live database (2026-11-18). Everything is "if not exists",
-- so on the existing database this changes nothing; on a new database it
-- creates the tables in the state the later migrations expect.

-- ─── Krishi's receiving accounts (shown on the deposit step) ────────────────
create table if not exists public.platform_accounts (
  id              uuid primary key default gen_random_uuid(),
  method          text not null check (method in ('bank', 'mfs')),
  provider        text,
  account_name    text not null,
  account_number  text not null,
  branch_name     text,
  routing_number  text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ─── Deposits (investor's transfer for an approved interest) ────────────────
create sequence if not exists public.deposit_ref_seq start 1;

create table if not exists public.deposits (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique
                    default ('KR-PAY-' || lpad(nextval('public.deposit_ref_seq')::text, 6, '0')),
  investor_id       uuid not null references public.users(id) on delete cascade,
  interest_id       uuid not null references public.investment_interests(id) on delete cascade,
  amount            numeric not null check (amount > 0),
  method            text not null,
  txn_id            text,
  proof_path        text,
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references public.users(id),
  sender_number     text,
  deposit_date      date,
  note              text,
  rejection_reason  text
);

-- ─── Investments (created when admin approves a deposit) ────────────────────
create sequence if not exists public.investment_ref_seq start 1;

create table if not exists public.investments (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique
                 default ('KR-INV-' || lpad(nextval('public.investment_ref_seq')::text, 6, '0')),
  interest_id    uuid not null references public.investment_interests(id),
  investor_id    uuid not null references public.users(id),
  offering_id    uuid not null references public.steward_plan_offerings(id),
  units          integer not null,
  amount         numeric not null,
  status         text not null default 'active'
                 check (status in ('active', 'completed', 'cancelled')),
  created_at     timestamptz not null default now(),
  farmer_id      uuid references public.users(id) on delete set null,
  -- awaiting_farmer → awaiting_purchase → growing_care → sale_pending → sold → settled
  current_stage  text default 'awaiting_farmer'
);

-- ─── Fund requests (farmer asks the steward for money) ──────────────────────
create sequence if not exists public.fund_request_ref_seq start 1;

create table if not exists public.fund_requests (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique
                    default ('KR-REQ-' || lpad(nextval('public.fund_request_ref_seq')::text, 5, '0')),
  investment_id     uuid not null references public.investments(id) on delete cascade,
  farmer_id         uuid not null references public.users(id),
  amount            numeric not null check (amount > 0),
  purpose           text not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'disbursed')),
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references public.users(id)
);

-- ─── Expenses (money the farmer spent, with receipt) ────────────────────────
create table if not exists public.expenses (
  id                uuid primary key default gen_random_uuid(),
  investment_id     uuid not null references public.investments(id) on delete cascade,
  fund_request_id   uuid references public.fund_requests(id) on delete set null,
  farmer_id         uuid not null references public.users(id),
  category          text not null,
  amount            numeric not null check (amount > 0),
  description       text,
  receipt_path      text,
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references public.users(id)
);

create index if not exists expenses_investment_idx
  on public.expenses (investment_id, created_at desc);

-- ─── Investment timeline ────────────────────────────────────────────────────
create table if not exists public.investment_updates (
  id             uuid primary key default gen_random_uuid(),
  investment_id  uuid not null references public.investments(id) on delete cascade,
  author_id      uuid references public.users(id) on delete set null,
  author_role    text check (author_role in ('farmer', 'steward', 'admin', 'system')),
  update_type    text not null,
  title          text not null,
  body           text,
  photo_path     text,
  amount         numeric,
  metadata       jsonb,
  created_at     timestamptz not null default now(),
  -- 'settlement' is added by 20261118000001_sales_and_settlements.sql
  constraint investment_updates_update_type_check check (update_type in (
    'stage_change', 'photo_update', 'health_check', 'expense', 'fund_request',
    'fund_disbursed', 'purchase', 'note', 'sale'
  ))
);

create index if not exists investment_updates_investment_idx
  on public.investment_updates (investment_id, created_at desc);

-- ─── Access: the app uses the service role only ─────────────────────────────
alter table public.platform_accounts  enable row level security;
alter table public.deposits           enable row level security;
alter table public.investments        enable row level security;
alter table public.fund_requests      enable row level security;
alter table public.expenses           enable row level security;
alter table public.investment_updates enable row level security;

grant select, insert, update, delete on
  public.platform_accounts, public.deposits, public.investments,
  public.fund_requests, public.expenses, public.investment_updates
  to service_role;
grant usage, select on sequence
  public.deposit_ref_seq, public.investment_ref_seq, public.fund_request_ref_seq
  to service_role;

-- ─── Storage buckets ────────────────────────────────────────────────────────
-- kyc-documents and deposit-proofs are private (signed URLs only);
-- plan-images is public. Uploads happen server-side with the service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('kyc-documents', 'kyc-documents', false, 5242880,
     array['image/jpeg', 'image/png', 'application/pdf']),
  ('plan-images', 'plan-images', true, 5242880,
     array['image/jpeg', 'image/png', 'image/webp']),
  ('deposit-proofs', 'deposit-proofs', false, 8388608,
     array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
