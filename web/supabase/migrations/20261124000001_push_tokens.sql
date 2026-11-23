-- Phones that receive push notifications (Firebase Cloud Messaging).
-- One row per app install. The app registers its token after sign-in and
-- removes it on sign-out; a token moves to whoever signed in last on that
-- phone. `locale` is the app language, so pushes arrive in it.

create table if not exists public.push_tokens (
  token        text primary key,
  user_id      uuid not null references public.users(id) on delete cascade,
  platform     text not null check (platform in ('android', 'ios')),
  locale       text not null default 'bn' check (locale in ('bn', 'en')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;
grant select, insert, update, delete on public.push_tokens to service_role;
