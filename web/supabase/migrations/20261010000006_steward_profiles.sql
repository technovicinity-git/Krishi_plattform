-- Migration: steward_profiles
-- Stores steward application details submitted during registration.

create table if not exists public.steward_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.users(id) on delete cascade,

  steward_type    text not null check (steward_type in ('individual', 'organization')),

  division_id     uuid not null references public.divisions(id) on delete restrict,
  district_id     uuid not null references public.districts(id) on delete restrict,
  upazila         text,

  categories      text[] not null default '{}',

  experience      text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists steward_profiles_user_idx on public.steward_profiles(user_id);

drop trigger if exists steward_profiles_touch on public.steward_profiles;
create trigger steward_profiles_touch
  before update on public.steward_profiles
  for each row execute function public.touch_updated_at();

alter table public.steward_profiles enable row level security;
grant select, insert, update, delete on public.steward_profiles to service_role;