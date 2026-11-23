-- Custom notifications an admin sent from the console: who sent what, to
-- whom, and how many people received it. Each recipient also gets a normal
-- row in `notifications` (kind 'custom'), plus a push to their phones.

create table if not exists public.notification_broadcasts (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references public.users(id) on delete set null,
  audience     text not null check (audience in ('all', 'investor', 'steward', 'farmer', 'user')),
  -- Set when audience = 'user'.
  user_id      uuid references public.users(id) on delete set null,
  title_en     text not null,
  title_bn     text,
  body_en      text not null,
  body_bn      text,
  recipients   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists notification_broadcasts_created_idx
  on public.notification_broadcasts(created_at desc);

alter table public.notification_broadcasts enable row level security;
grant select, insert, update, delete on public.notification_broadcasts to service_role;
