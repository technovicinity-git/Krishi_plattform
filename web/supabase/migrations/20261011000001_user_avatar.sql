-- Migration: user_avatar
-- Reserves a column for user avatar uploads (used in the header).
-- Actual upload UI is added in a later batch.

alter table public.users
  add column if not exists avatar_path text;