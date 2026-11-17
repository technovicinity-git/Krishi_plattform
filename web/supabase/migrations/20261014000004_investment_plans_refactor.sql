-- Migrate any existing (plan, steward) pairs into offerings.
insert into public.steward_plan_offerings
  (plan_id, steward_id, units_offered, units_funded, status, approved_by, approved_at)
select
  id, steward_id,
  coalesce(total_units, 1),
  coalesce(units_funded, 0),
  'approved',
  created_by,
  now()
from public.investment_plans
where steward_id is not null
on conflict (plan_id, steward_id) do nothing;

-- Drop legacy steward/capacity columns from plans.
alter table public.investment_plans drop column if exists steward_id;
alter table public.investment_plans drop column if exists total_units;
alter table public.investment_plans drop column if exists units_funded;