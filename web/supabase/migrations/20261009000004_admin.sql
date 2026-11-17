-- Migration: admin
-- Admin audit log, login rate limiting, and email uniqueness.

-- =========================================================================
-- 1. EMAIL UNIQUENESS (for admin accounts)
-- =========================================================================

create unique index if not exists users_email_unique_idx
  on public.users(email)
  where email is not null;

-- =========================================================================
-- 2. AUDIT LOG
-- =========================================================================

create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references public.users(id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    text,
  metadata     jsonb,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_log_admin_idx
  on public.admin_audit_log(admin_id, created_at desc);
create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log(action, created_at desc);
create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log(target_type, target_id, created_at desc);

-- =========================================================================
-- 3. LOGIN ATTEMPTS (rate limiting)
-- =========================================================================

create table if not exists public.admin_login_attempts (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  ip_address   text,
  succeeded    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists admin_login_attempts_lookup_idx
  on public.admin_login_attempts(email, created_at desc);

-- =========================================================================
-- 4. PERMISSIONS
-- =========================================================================

alter table public.admin_audit_log      enable row level security;
alter table public.admin_login_attempts enable row level security;
-- No policies — no API access; used only by server-side routes.

grant select, insert, update, delete
  on public.admin_audit_log, public.admin_login_attempts
  to service_role;

-- =========================================================================
-- 5. CLEANUP (delete old rate-limit rows)
-- =========================================================================

create or replace function public.cleanup_old_login_attempts()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.admin_login_attempts
  where created_at < now() - interval '24 hours';
$$;