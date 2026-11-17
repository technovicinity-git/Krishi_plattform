-- Migration: farmer_accounts
-- Adds creation/assignment columns for farmers created by stewards.
-- Farmers activate their own password via OTP after the steward creates the account.

alter table public.users
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists assigned_steward_id uuid references public.users(id) on delete set null;

create index if not exists users_assigned_steward_idx
  on public.users(assigned_steward_id)
  where role = 'farmer';

create index if not exists users_created_by_idx
  on public.users(created_by);