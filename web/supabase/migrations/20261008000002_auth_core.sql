-- Migration: auth_core
-- Creates public.users + public.kyc_profiles, the trigger that links new
-- auth.users rows to public.users, and all Row Level Security policies.

-- =========================================================================
-- 1. USERS (profile anchor linked to auth.users)
-- =========================================================================

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('investor', 'steward', 'farmer', 'admin')),
  full_name   text,
  phone       text,
  email       text,
  status      text not null default 'active'
              check (status in ('pending_activation', 'active', 'suspended', 'deleted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists users_role_idx  on public.users(role);
create index if not exists users_phone_idx on public.users(phone);
create index if not exists users_email_idx on public.users(email);

-- =========================================================================
-- 2. KYC PROFILES
-- =========================================================================

create table if not exists public.kyc_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.users(id) on delete cascade,
  status              text not null default 'not_started'
                      check (status in ('not_started', 'pending', 'under_review', 'verified', 'rejected', 'requires_update')),
  full_name           text,
  nid_number          text,
  present_address     text,
  permanent_address   text,
  nid_front_url       text,
  nid_back_url        text,
  profile_photo_url   text,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid references public.users(id) on delete set null,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists kyc_profiles_user_idx   on public.kyc_profiles(user_id);
create index if not exists kyc_profiles_status_idx on public.kyc_profiles(status);

-- =========================================================================
-- 3. HELPER FUNCTIONS
-- =========================================================================

create or replace function public.current_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.current_user_status()
returns text
language sql stable security definer
set search_path = public
as $$
  select status from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.users where id = auth.uid()) = 'admin',
    false
  )
$$;

-- =========================================================================
-- 4. AUTO-CREATE public.users ON auth.users INSERT
-- =========================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'investor');
  v_full_name := new.raw_user_meta_data->>'full_name';

  if v_role not in ('investor', 'steward', 'farmer', 'admin') then
    v_role := 'investor';
  end if;

  insert into public.users (id, role, full_name, phone, email)
  values (new.id, v_role, v_full_name, new.phone, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =========================================================================
-- 5. UPDATED_AT TOUCH TRIGGER
-- =========================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

drop trigger if exists kyc_touch_updated_at on public.kyc_profiles;
create trigger kyc_touch_updated_at
  before update on public.kyc_profiles
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- 6. ROW LEVEL SECURITY
-- =========================================================================

alter table public.users         enable row level security;
alter table public.kyc_profiles  enable row level security;
alter table public._migrations   enable row level security;
-- _migrations has no policies → no API access (only the migration script
-- running as the postgres superuser can write to it).

-- USERS --------------------------------------------------------------

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role   = public.current_user_role()
    and status = public.current_user_status()
  );

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- KYC PROFILES -------------------------------------------------------

drop policy if exists kyc_select_self on public.kyc_profiles;
create policy kyc_select_self on public.kyc_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists kyc_insert_self on public.kyc_profiles;
create policy kyc_insert_self on public.kyc_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and status in ('not_started', 'pending'));

drop policy if exists kyc_update_self on public.kyc_profiles;
create policy kyc_update_self on public.kyc_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('not_started', 'pending'));

drop policy if exists kyc_admin_all on public.kyc_profiles;
create policy kyc_admin_all on public.kyc_profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());