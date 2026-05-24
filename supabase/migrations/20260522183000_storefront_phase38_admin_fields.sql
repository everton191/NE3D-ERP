-- Storefront Phase 3.8: admin panel public product/category fields.
-- Non-destructive and feature-flagged at application level.

alter table public.store_categories
  add column if not exists icon text;

alter table public.store_products
  add column if not exists price_mode text not null default 'fixed',
  add column if not exists show_price boolean not null default true,
  add column if not exists public_observations text;

alter table public.store_products
  drop constraint if exists store_products_price_mode_valid;

alter table public.store_products
  add constraint store_products_price_mode_valid
  check (price_mode in ('fixed', 'from', 'quote', 'promo'));

create index if not exists idx_store_products_price_mode on public.store_products(store_id, price_mode);
