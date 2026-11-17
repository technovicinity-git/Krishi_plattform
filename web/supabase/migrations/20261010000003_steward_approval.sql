-- Migration: steward_approval
-- Separate approval status for stewards. Distinct from users.status
-- (which governs platform access). Steward approval is a manual admin action.

alter table public.users
  add column if not exists steward_approval_status text
  check (steward_approval_status in ('pending', 'approved', 'rejected'));

create index if not exists users_steward_approval_idx
  on public.users(steward_approval_status)
  where role = 'steward';