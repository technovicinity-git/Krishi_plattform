-- Farmers report an animal's death; the steward confirms or rejects it.
--
-- A farmer's death report puts the animal in 'death_reported' and leaves the
-- death record 'pending'. The steward confirms (animal -> dead) or rejects
-- it with a reason (animal -> active again). A death the steward records
-- themselves is confirmed straight away.

alter table public.animals drop constraint if exists animals_status_check;
alter table public.animals
  add constraint animals_status_check
  check (status in ('active', 'death_reported', 'sold', 'dead'));

alter table public.animals
  add column if not exists death_cause text
  check (death_cause is null or death_cause in ('disease', 'accident', 'calving', 'unknown', 'other'));

alter table public.animal_records
  add column if not exists review_status text
    check (review_status is null or review_status in ('pending', 'approved', 'rejected')),
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists document_path text;   -- vet certificate photo

-- Deaths recorded before reviews existed were final.
update public.animal_records set review_status = 'approved'
 where kind = 'death' and review_status is null;

-- At most one open death report per animal.
create unique index if not exists animal_records_one_pending_death
  on public.animal_records(animal_id)
  where kind = 'death' and review_status = 'pending';
