-- Phase 2A: investment interests + agreement acceptances

create table public.investment_interests (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  offering_id     uuid not null references public.steward_plan_offerings(id) on delete cascade,
  investor_id     uuid references public.users(id) on delete set null,

  guest_name      text,
  guest_phone     text,
  guest_email     text,

  requested_units int not null check (requested_units > 0),
  message         text,

  status          text not null default 'submitted'
                  check (status in (
                    'submitted', 'under_review', 'approved', 'not_approved',
                    'onboarding', 'converted', 'expired', 'cancelled'
                  )),

  reviewed_by     uuid references public.users(id) on delete set null,
  reviewed_at     timestamptz,
  rejection_reason text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint interests_identity_check check (
    (investor_id is not null and guest_phone is null) or
    (investor_id is null and guest_phone is not null)
  )
);

create sequence if not exists public.investment_interest_ref_seq start 1;

create or replace function public.generate_interest_reference()
returns text
language plpgsql
as $$
begin
  return 'KR-INT-' || lpad(nextval('public.investment_interest_ref_seq')::text, 6, '0');
end;
$$;

alter table public.investment_interests
  alter column reference set default public.generate_interest_reference();

create index if not exists interests_offering_idx
  on public.investment_interests(offering_id);
create index if not exists interests_investor_idx
  on public.investment_interests(investor_id)
  where investor_id is not null;
create index if not exists interests_status_idx
  on public.investment_interests(status);

create unique index if not exists interests_active_investor_idx
  on public.investment_interests(offering_id, investor_id)
  where status in ('submitted','under_review','approved','onboarding')
    and investor_id is not null;

create unique index if not exists interests_active_guest_idx
  on public.investment_interests(offering_id, guest_phone)
  where status in ('submitted','under_review','approved','onboarding')
    and guest_phone is not null;

drop trigger if exists interests_touch on public.investment_interests;
create trigger interests_touch
  before update on public.investment_interests
  for each row execute function public.touch_updated_at();

alter table public.investment_interests enable row level security;
grant select, insert, update, delete on public.investment_interests to service_role;

create table public.agreement_acceptances (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete set null,
  interest_id      uuid references public.investment_interests(id) on delete cascade,
  document_type    text not null check (document_type in (
    'terms_of_investment',
    'risk_disclosure',
    'privacy_policy',
    'interest_acknowledgement'
  )),
  document_version text not null default '1.0',
  accepted_at      timestamptz not null default now(),
  ip_address       text
);

create index if not exists agreement_interest_idx
  on public.agreement_acceptances(interest_id);
create index if not exists agreement_user_idx
  on public.agreement_acceptances(user_id)
  where user_id is not null;

alter table public.agreement_acceptances enable row level security;
grant select, insert, update, delete on public.agreement_acceptances to service_role;