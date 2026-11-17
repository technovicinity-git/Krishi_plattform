-- Migration: kyc_storage_paths
-- Add Supabase Storage path columns for KYC document files.
-- The `*_url` columns from the original schema are kept for compatibility
-- but we now store relative paths (bucket-relative) rather than public URLs.

alter table public.kyc_profiles
  add column if not exists nid_front_path     text,
  add column if not exists nid_back_path      text,
  add column if not exists profile_photo_path text;

-- Track submission context
alter table public.kyc_profiles
  add column if not exists submitted_by uuid references public.users(id) on delete set null;