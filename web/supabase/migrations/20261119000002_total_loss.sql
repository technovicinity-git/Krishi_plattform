-- Closing a batch as a total loss (every animal died).
--
-- A total loss is an investment_sales row with kind = 'total_loss',
-- no animals and no money. The steward creates it (status goes straight to
-- 'remittance_submitted', since there is no money to send), and the admin
-- settles it like any sale: the investor gets back the unspent capital and
-- nobody gets a share. If the admin sends it back, it becomes 'rejected'
-- and the batch returns to growing_care.

alter table public.investment_sales
  add column if not exists kind text not null default 'sale'
  check (kind in ('sale', 'total_loss'));

alter table public.investment_sales drop constraint if exists investment_sales_animals_sold_check;
alter table public.investment_sales drop constraint if exists investment_sales_sale_amount_check;
alter table public.investment_sales drop constraint if exists investment_sales_kind_amounts_check;
alter table public.investment_sales
  add constraint investment_sales_kind_amounts_check check (
    (kind = 'sale' and animals_sold > 0 and sale_amount > 0)
    or (kind = 'total_loss' and animals_sold = 0 and sale_amount = 0)
  );
