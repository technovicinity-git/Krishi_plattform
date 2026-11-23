-- Ends every existing session of a user at once. Each session token carries
-- the user's session_version from when it was issued; the server rejects a
-- token whose version is older. Bumped when the password is changed or reset
-- and by "sign out of all devices".

alter table public.users
  add column if not exists session_version integer not null default 0;

create or replace function public.bump_session_version(p_user_id uuid)
returns integer
language sql
as $$
  update public.users
     set session_version = session_version + 1
   where id = p_user_id
  returning session_version;
$$;

revoke all on function public.bump_session_version(uuid) from public, anon, authenticated;
grant execute on function public.bump_session_version(uuid) to service_role;
