-- Generic rate limiter for public endpoints (login, sign-up, OTP, forms).
--
-- hit_rate_limit(bucket, limit, window) records one hit and returns true if
-- the bucket is still under `limit` hits in the last `window` seconds, or
-- false (without recording) if it is over. Buckets are strings such as
-- 'login:ip:1.2.3.4' or 'login:phone:+8801…'. Serialised per bucket.

create table if not exists public.rate_limit_hits (
  id          bigserial primary key,
  bucket      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_idx
  on public.rate_limit_hits(bucket, created_at desc);

alter table public.rate_limit_hits enable row level security;
grant select, insert, delete on public.rate_limit_hits to service_role;
grant usage, select on sequence public.rate_limit_hits_id_seq to service_role;

create or replace function public.hit_rate_limit(
  p_bucket text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext('rl:' || p_bucket));

  select count(*) into v_count
    from public.rate_limit_hits
   where bucket = p_bucket
     and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);

  -- Housekeeping: now and then drop hits older than a day.
  if random() < 0.02 then
    delete from public.rate_limit_hits where created_at < now() - interval '1 day';
  end if;

  return true;
end;
$$;

revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
