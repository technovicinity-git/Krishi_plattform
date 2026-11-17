-- Migration: custom_auth_user_id
-- The `users.id` column was originally a FK to auth.users (from when we
-- planned to use Supabase Auth). We now manage auth ourselves, so:
--   1. Drop the FK to auth.users.
--   2. Give `id` a default so inserts don't need to provide it.

alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();