-- How a console notification was delivered, and how many phones the push reached.
alter table public.notification_broadcasts
  add column if not exists channels text not null default 'both'
    check (channels in ('both', 'inapp', 'push')),
  add column if not exists pushed integer not null default 0;
