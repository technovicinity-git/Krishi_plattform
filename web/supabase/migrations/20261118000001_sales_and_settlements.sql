-- Sale, remittance and settlement of an investment batch.
--
-- Flow:
--   farmer records sale            -> investment_sales.status = pending_review   (stage sale_pending)
--   steward confirms / rejects     -> awaiting_remittance (stage sold) | rejected (stage growing_care)
--   farmer sends money to Krishi   -> remittance_submitted
--   admin confirms receipt+settles -> settled; investment_settlements row; investment completed/settled
--   admin rejects remittance       -> awaiting_remittance (with remit_rejection_reason)

create sequence if not exists public.investment_sale_ref_seq start 1;

create table if not exists public.investment_sales (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique
                         default ('KR-SALE-' || lpad(nextval('public.investment_sale_ref_seq')::text, 5, '0')),
  investment_id          uuid not null unique references public.investments(id) on delete cascade,
  farmer_id              uuid not null references public.users(id),

  -- Sale (recorded by the farmer, checked by the steward)
  animals_sold           int not null check (animals_sold > 0),
  sale_amount            numeric(14,2) not null check (sale_amount > 0),
  buyer_name             text,
  buyer_phone            text,
  sale_date              date not null,
  note                   text,
  photo_path             text,

  status                 text not null default 'pending_review'
                         check (status in (
                           'pending_review', 'rejected', 'awaiting_remittance',
                           'remittance_submitted', 'settled'
                         )),
  rejection_reason       text,
  reviewed_by            uuid references public.users(id),
  reviewed_at            timestamptz,

  -- Remittance (farmer sends the sale money to Krishi, admin confirms)
  remit_method           text check (remit_method in ('bank', 'mfs', 'cash')),
  remit_txn_id           text,
  remit_sender           text,
  remit_note             text,
  remit_proof_path       text,
  remitted_at            timestamptz,
  remit_rejection_reason text,
  received_by            uuid references public.users(id),
  received_at            timestamptz,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists investment_sales_status_idx on public.investment_sales(status);
create index if not exists investment_sales_farmer_idx on public.investment_sales(farmer_id);

drop trigger if exists investment_sales_touch on public.investment_sales;
create trigger investment_sales_touch
  before update on public.investment_sales
  for each row execute function public.touch_updated_at();

alter table public.investment_sales enable row level security;
grant select, insert, update, delete on public.investment_sales to service_role;

-- One settlement per investment: the final money breakdown.
create table if not exists public.investment_settlements (
  id               uuid primary key default gen_random_uuid(),
  investment_id    uuid not null unique references public.investments(id) on delete cascade,
  sale_id          uuid not null unique references public.investment_sales(id) on delete cascade,

  capital          numeric(14,2) not null,  -- what the investor put in
  funds_released   numeric(14,2) not null,  -- approved fund requests paid to the farmer
  sale_amount      numeric(14,2) not null,  -- money the farmer remitted
  total_return     numeric(14,2) not null,  -- sale_amount + (capital - funds_released)
  net_result       numeric(14,2) not null,  -- total_return - capital (negative = loss)
  outcome          text not null check (outcome in ('profit', 'loss', 'break_even')),

  investor_payout  numeric(14,2) not null,  -- capital back + investor share (or what is left on a loss)
  farmer_share     numeric(14,2) not null default 0,
  steward_share    numeric(14,2) not null default 0,
  platform_share   numeric(14,2) not null default 0,
  split            jsonb not null,          -- percentages used, e.g. {"farmer":60,"investor":30,...}

  note             text,
  settled_by       uuid not null references public.users(id),
  settled_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.investment_settlements enable row level security;
grant select, insert, update, delete on public.investment_settlements to service_role;

-- Atomic settlement: only settles a sale whose remittance is waiting for review.
-- Amounts are computed by the app (lib/investments/settlement.ts) and passed in.
create or replace function public.settle_investment_sale(
  p_sale_id uuid,
  p_admin_id uuid,
  p_capital numeric,
  p_funds_released numeric,
  p_sale_amount numeric,
  p_total_return numeric,
  p_net_result numeric,
  p_outcome text,
  p_investor_payout numeric,
  p_farmer_share numeric,
  p_steward_share numeric,
  p_platform_share numeric,
  p_split jsonb,
  p_note text
)
returns uuid
language plpgsql
as $$
declare
  v_investment_id uuid;
  v_settlement_id uuid;
begin
  update public.investment_sales
     set status = 'settled',
         received_by = p_admin_id,
         received_at = now(),
         remit_rejection_reason = null
   where id = p_sale_id
     and status = 'remittance_submitted'
  returning investment_id into v_investment_id;

  if v_investment_id is null then
    raise exception 'SALE_NOT_READY' using errcode = 'P0001';
  end if;

  insert into public.investment_settlements (
    investment_id, sale_id, capital, funds_released, sale_amount, total_return,
    net_result, outcome, investor_payout, farmer_share, steward_share,
    platform_share, split, note, settled_by
  ) values (
    v_investment_id, p_sale_id, p_capital, p_funds_released, p_sale_amount, p_total_return,
    p_net_result, p_outcome, p_investor_payout, p_farmer_share, p_steward_share,
    p_platform_share, p_split, p_note, p_admin_id
  )
  returning id into v_settlement_id;

  update public.investments
     set status = 'completed',
         current_stage = 'settled'
   where id = v_investment_id;

  return v_settlement_id;
end;
$$;

revoke all on function public.settle_investment_sale(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, text,
  numeric, numeric, numeric, numeric, jsonb, text
) from public, anon, authenticated;
grant execute on function public.settle_investment_sale(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, text,
  numeric, numeric, numeric, numeric, jsonb, text
) to service_role;

-- Sale updates on the timeline already use update_type 'sale'; add 'settlement'.
alter table public.investment_updates
  drop constraint if exists investment_updates_update_type_check;
alter table public.investment_updates
  add constraint investment_updates_update_type_check check (update_type in (
    'stage_change', 'photo_update', 'health_check', 'expense', 'fund_request',
    'fund_disbursed', 'purchase', 'note', 'sale', 'settlement'
  ));
