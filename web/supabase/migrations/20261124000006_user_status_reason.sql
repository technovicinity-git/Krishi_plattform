-- Why and when an admin last suspended or restored an account (shown on the
-- person's page in the console; the full history is in the audit log).
alter table public.users
  add column if not exists status_reason text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references public.users(id) on delete set null;
