-- Migration: custom_auth
-- Adds password-based authentication and OTP storage.
-- Bypasses Supabase Auth (GoTrue) which has known bugs with phone OTP.

-- =========================================================================
-- 1. EXTEND public.users
-- =========================================================================

alter table public.users
  add column if not exists password_hash      text,
  add column if not exists phone_verified_at  timestamptz;

-- Unique constraint on phone (partial — allow NULL email-only users)
create unique index if not exists users_phone_unique_idx
  on public.users(phone)
  where phone is not null;

-- =========================================================================
-- 2. OTP CODES TABLE
-- =========================================================================

create table if not exists public.otp_codes (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null,
  code_hash    text not null,
  purpose      text not null check (purpose in ('signup', 'login', 'reset')),
  expires_at   timestamptz not null,
  attempts     int not null default 0,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists otp_codes_lookup_idx
  on public.otp_codes(phone, purpose, created_at desc);

-- =========================================================================
-- 3. DEV OTPS (plaintext, dev only — never populated in production)
-- =========================================================================

-- The existing dev_otps table (from a previous migration) is unchanged.
-- It's populated only when DEV_SHOW_OTP=true on the server.

-- =========================================================================
-- 4. CLEANUP FUNCTION
-- =========================================================================

create or replace function public.cleanup_expired_otps()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.otp_codes
  where created_at < now() - interval '24 hours';
$$;

-- =========================================================================
-- 5. RLS
-- =========================================================================

alter table public.otp_codes enable row level security;
-- No policies: intentionally unreachable via the public API.
-- All OTP operations go through server-side routes using the service-role key.