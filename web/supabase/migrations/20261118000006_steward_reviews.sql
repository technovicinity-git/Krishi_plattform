-- Investor reviews of stewards.
--
-- An investor can rate the steward (1–5 stars + optional comment) once an
-- investment is settled: one review per investment, editable by its author.
-- Admin can hide a review (it then no longer counts or shows publicly).

create table if not exists public.steward_reviews (
  id             uuid primary key default gen_random_uuid(),
  investment_id  uuid not null unique references public.investments(id) on delete cascade,
  investor_id    uuid not null references public.users(id) on delete cascade,
  steward_id     uuid not null references public.users(id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  comment        text check (comment is null or char_length(comment) <= 1000),
  status         text not null default 'published' check (status in ('published', 'hidden')),
  hidden_reason  text,
  hidden_by      uuid references public.users(id),
  hidden_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists steward_reviews_steward_idx
  on public.steward_reviews(steward_id, created_at desc) where status = 'published';

drop trigger if exists steward_reviews_touch on public.steward_reviews;
create trigger steward_reviews_touch
  before update on public.steward_reviews
  for each row execute function public.touch_updated_at();

alter table public.steward_reviews enable row level security;
grant select, insert, update, delete on public.steward_reviews to service_role;
