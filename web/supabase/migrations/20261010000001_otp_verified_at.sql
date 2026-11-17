-- Migration: otp_verified_at
-- Adds a marker so we can distinguish "OTP verified but not yet consumed"
-- from "OTP still awaiting verification". Used by the reset-password flow
-- to verify the code on step 1, then consume it on step 2.

alter table public.otp_codes
  add column if not exists verified_at timestamptz;