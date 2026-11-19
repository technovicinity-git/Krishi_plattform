-- Lock the public API roles out of the database.
--
-- The app reaches Postgres only through the server, with the service_role key
-- (which bypasses row-level security). The Supabase URL and publishable key
-- are public, so anyone can call PostgREST directly as `anon`, or as
-- `authenticated` after signing up through Supabase Auth (which this app does
-- not use). Neither role should be able to read, write or execute anything.
--
-- Fixes:
--  * Old Supabase-Auth policies on users / kyc_profiles let an `authenticated`
--    user insert their own users row with role 'admin', after which the
--    "admin can do anything" policies exposed every user and KYC record.
--  * `authenticated` had INSERT/UPDATE on users and kyc_profiles.
--  * anon/authenticated had TRUNCATE/TRIGGER/REFERENCES on tables (default ACL).
--  * Security-definer cleanup functions were executable by anyone.
--
-- Row-level security stays enabled on every table with no policies for the
-- public roles: deny by default. Only service_role (the server) gets access.

-- 1. Policies for Supabase Auth users. Nothing in the app relies on them.
drop policy if exists users_admin_all     on public.users;
drop policy if exists users_insert_self   on public.users;
drop policy if exists users_select_self   on public.users;
drop policy if exists users_update_self   on public.users;
drop policy if exists kyc_admin_all       on public.kyc_profiles;
drop policy if exists kyc_insert_self     on public.kyc_profiles;
drop policy if exists kyc_select_self     on public.kyc_profiles;
drop policy if exists kyc_update_self     on public.kyc_profiles;

-- 2. No table, sequence or function rights for the public roles.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- 3. The server keeps full access (column defaults and RPCs need EXECUTE).
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- 4. Same for anything created later by migrations (they run as postgres).
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public grant all on tables    to service_role;
alter default privileges for role postgres in schema public grant all on sequences to service_role;
alter default privileges for role postgres in schema public grant execute on functions to service_role;

-- 5. Every table keeps row-level security on (deny by default).
do $$
declare t record;
begin
  for t in
    select c.oid::regclass as name
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  loop
    execute format('alter table %s enable row level security', t.name);
  end loop;
end $$;
