-- Migration: investment_plans
-- Admin-created investment opportunities. A plan ties a livestock category,
-- a district-level location, financial parameters, and (optionally) a steward.

create table if not exists public.investment_plans (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,

  -- Titles and descriptions (bilingual)
  name_en             text not null,
  name_bn             text not null,
  description_en      text,
  description_bn      text,

  -- Reference data
  category_id         uuid not null references public.livestock_categories(id) on delete restrict,
  division_id         uuid not null references public.divisions(id) on delete restrict,
  district_id         uuid not null references public.districts(id) on delete restrict,

  -- Financial
  duration_months     int not null check (duration_months > 0 and duration_months <= 60),
  unit_price          numeric(12,2) not null check (unit_price > 0),
  animal_allocation   numeric(12,2) not null check (animal_allocation >= 0),
  care_allocation     numeric(12,2) not null check (care_allocation >= 0),
  estimated_roi_min   numeric(5,2) not null check (estimated_roi_min >= 0),
  estimated_roi_max   numeric(5,2) not null check (estimated_roi_max >= estimated_roi_min),

  -- Capacity
  total_units         int check (total_units is null or total_units > 0),
  units_funded        int not null default 0 check (units_funded >= 0),

  -- Risk
  risk_information    text,

  -- Media
  image_path          text,

  -- Lifecycle
  status              text not null default 'draft'
                      check (status in ('draft', 'open', 'coming_soon', 'fully_funded', 'closed')),

  -- Steward (optional for V1)
  steward_id          uuid references public.users(id) on delete set null,
  created_by          uuid references public.users(id) on delete set null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint units_funded_check check (
    total_units is null or units_funded <= total_units
  ),
  constraint allocations_match_price check (
    animal_allocation + care_allocation = unit_price
  )
);

create index if not exists investment_plans_status_idx   on public.investment_plans(status);
create index if not exists investment_plans_category_idx on public.investment_plans(category_id);
create index if not exists investment_plans_district_idx on public.investment_plans(district_id);
create index if not exists investment_plans_created_idx  on public.investment_plans(created_at desc);

drop trigger if exists investment_plans_touch on public.investment_plans;
create trigger investment_plans_touch
  before update on public.investment_plans
  for each row execute function public.touch_updated_at();

alter table public.investment_plans enable row level security;

grant select, insert, update, delete
  on public.investment_plans
  to service_role;