-- One row per animal, plus a log of weight/health records.
--
-- Animals are created when the farmer confirms the purchase (one per animal
-- bought). The farmer (or steward) adds weight and health records while
-- raising them. When a sale is confirmed, the animals chosen in the sale are
-- marked sold with an equal share of the sale price.

create sequence if not exists public.animal_ref_seq start 1;

create table if not exists public.animals (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique
                      default ('KR-ANM-' || lpad(nextval('public.animal_ref_seq')::text, 6, '0')),
  investment_id       uuid not null references public.investments(id) on delete cascade,
  tag                 text not null,              -- short label within the batch: A01, A02…
  ear_tag             text,                       -- physical ear tag number, if any
  breed               text,
  sex                 text check (sex in ('male', 'female')),
  purchase_price      numeric(14,2),
  purchase_weight_kg  numeric(8,2) check (purchase_weight_kg is null or purchase_weight_kg > 0),
  current_weight_kg   numeric(8,2) check (current_weight_kg is null or current_weight_kg > 0),
  purchased_at        date,
  status              text not null default 'active'
                      check (status in ('active', 'sold', 'dead')),
  sale_price          numeric(14,2),
  sold_at             date,
  died_at             date,
  notes               text,
  photo_path          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (investment_id, tag)
);

create index if not exists animals_investment_idx on public.animals(investment_id);
create index if not exists animals_status_idx on public.animals(status);

drop trigger if exists animals_touch on public.animals;
create trigger animals_touch
  before update on public.animals
  for each row execute function public.touch_updated_at();

create table if not exists public.animal_records (
  id           uuid primary key default gen_random_uuid(),
  animal_id    uuid not null references public.animals(id) on delete cascade,
  author_id    uuid references public.users(id) on delete set null,
  author_role  text check (author_role in ('farmer', 'steward', 'admin', 'system')),
  kind         text not null check (kind in (
                 'weight', 'health', 'vaccination', 'treatment', 'note', 'death'
               )),
  weight_kg    numeric(8,2) check (weight_kg is null or weight_kg > 0),
  note         text,
  photo_path   text,
  recorded_on  date not null default current_date,
  created_at   timestamptz not null default now()
);

create index if not exists animal_records_animal_idx
  on public.animal_records(animal_id, recorded_on desc, created_at desc);

-- Which animals a sale covers (chosen by the farmer when recording it).
alter table public.investment_sales
  add column if not exists animal_ids uuid[];

alter table public.animals enable row level security;
alter table public.animal_records enable row level security;
grant select, insert, update, delete on public.animals, public.animal_records to service_role;
grant usage, select on sequence public.animal_ref_seq to service_role;

-- Batches bought before animals were tracked: create one row per unit
-- (or per animal count recorded on the purchase update), price split evenly.
do $$
declare
  inv record;
  n int;
  cost numeric;
  bought date;
begin
  for inv in
    select i.id, i.units, i.current_stage
      from public.investments i
     where i.current_stage in ('growing_care', 'sale_pending', 'sold', 'settled')
       and not exists (select 1 from public.animals a where a.investment_id = i.id)
  loop
    select coalesce((u.metadata->>'animals')::int, inv.units), u.amount, u.created_at::date
      into n, cost, bought
      from public.investment_updates u
     where u.investment_id = inv.id and u.update_type = 'purchase'
     order by u.created_at
     limit 1;
    n := coalesce(n, inv.units);
    for k in 1..greatest(n, 1) loop
      insert into public.animals (investment_id, tag, purchase_price, purchased_at, status)
      values (
        inv.id,
        'A' || lpad(k::text, 2, '0'),
        case when cost is not null then round(cost / greatest(n, 1), 2) end,
        bought,
        case when inv.current_stage = 'settled' then 'sold' else 'active' end
      );
    end loop;
  end loop;
end $$;
