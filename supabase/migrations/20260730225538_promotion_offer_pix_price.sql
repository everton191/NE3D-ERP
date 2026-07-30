alter table public.promotion_offer_state
  add column if not exists pix_price numeric(12,2)
  check (pix_price is null or pix_price > 0);
