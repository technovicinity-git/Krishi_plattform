-- Fund money the farmer received but did not spend comes back with the sale.
--
-- funds_returned = approved fund requests (other than animal purchase) minus
-- approved expenses, fixed when the steward confirms the sale (or closes the
-- batch as a total loss). The farmer sends sale_amount + funds_returned to
-- Krishi, and only the money actually spent counts against the investor.

alter table public.investment_sales
  add column if not exists funds_returned numeric(14,2) not null default 0
  check (funds_returned >= 0);
