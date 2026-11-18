-- In-app notifications for investors, stewards and farmers.
-- `kind` + `params` are rendered by the app in the reader's language;
-- `href` is an unprefixed app path (the locale is added when shown).

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        text not null,
  params      jsonb not null default '{}'::jsonb,
  href        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;
grant select, insert, update, delete on public.notifications to service_role;
