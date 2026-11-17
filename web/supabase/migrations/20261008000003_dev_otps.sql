-- Development-only OTP log.
-- The Send SMS Hook (Edge Function) writes generated OTPs here.
-- The frontend reads them in dev mode so testers don't need real SMS.
--
-- ⚠️ Security: RLS enabled with NO policies → invisible via the API.
-- Only the service-role key (server-side) can read/write.

create table if not exists public.dev_otps (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  otp         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists dev_otps_phone_created_idx
  on public.dev_otps(phone, created_at desc);

alter table public.dev_otps enable row level security;
-- No policies: intentionally unreachable via the public API.