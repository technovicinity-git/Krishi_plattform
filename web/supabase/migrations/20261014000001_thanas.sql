create table if not exists public.thanas (
  id           uuid primary key default gen_random_uuid(),
  district_id  uuid not null references public.districts(id) on delete cascade,
  slug         text not null unique,
  name_en      text not null,
  name_bn      text not null,
  sort_order   int not null default 0
);

create index if not exists thanas_district_idx on public.thanas(district_id);
create index if not exists thanas_sort_idx on public.thanas(sort_order);

alter table public.thanas enable row level security;
grant select, insert, update, delete on public.thanas to service_role;