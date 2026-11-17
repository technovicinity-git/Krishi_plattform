create table if not exists public.steward_plan_offerings (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.investment_plans(id) on delete cascade,
  steward_id      uuid not null references public.users(id) on delete restrict,
  thana_id        uuid references public.thanas(id) on delete set null,
  units_offered   int not null check (units_offered > 0),
  units_funded    int not null default 0 check (units_funded >= 0),
  status          text not null default 'pending_approval'
                  check (status in ('pending_approval','approved','paused','closed','rejected')),
  approved_by     uuid references public.users(id) on delete set null,
  approved_at     timestamptz,
  rejection_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint units_funded_lte_offered check (units_funded <= units_offered),
  unique (plan_id, steward_id)
);

create index if not exists offerings_status_idx on public.steward_plan_offerings(status);
create index if not exists offerings_steward_idx on public.steward_plan_offerings(steward_id);
create index if not exists offerings_plan_idx on public.steward_plan_offerings(plan_id);

drop trigger if exists offerings_touch on public.steward_plan_offerings;
create trigger offerings_touch
  before update on public.steward_plan_offerings
  for each row execute function public.touch_updated_at();

alter table public.steward_plan_offerings enable row level security;
grant select, insert, update, delete on public.steward_plan_offerings to service_role;