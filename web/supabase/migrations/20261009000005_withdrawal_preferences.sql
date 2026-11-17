-- Migration: withdrawal_preferences
-- Stores each user's preferred withdrawal method: mobile banking (bKash/Nagad/Rocket)
-- or bank transfer. One row per user (upsert on user_id).

create table if not exists public.withdrawal_preferences (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.users(id) on delete cascade,

  method                text not null check (method in ('mobile', 'bank')),

  -- Mobile banking fields (required when method = 'mobile')
  mfs_provider          text check (mfs_provider in ('bkash', 'nagad', 'rocket')),
  mobile_number         text,

  -- Bank transfer fields (required when method = 'bank')
  bank_name             text,
  bank_account_number   text,
  bank_branch           text,
  bank_routing_number   text,

  -- Common
  account_holder_name   text not null,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Enforce required fields per method
  constraint withdrawal_preferences_method_fields check (
    (method = 'mobile' and mfs_provider is not null and mobile_number is not null)
    or
    (method = 'bank' and bank_name is not null and bank_account_number is not null)
  )
);

create index if not exists withdrawal_preferences_user_idx
  on public.withdrawal_preferences(user_id);

-- RLS: only server-side (service_role) access
alter table public.withdrawal_preferences enable row level security;

grant select, insert, update, delete
  on public.withdrawal_preferences
  to service_role;

-- Auto-touch updated_at
drop trigger if exists withdrawal_preferences_touch on public.withdrawal_preferences;
create trigger withdrawal_preferences_touch
  before update on public.withdrawal_preferences
  for each row execute function public.touch_updated_at();