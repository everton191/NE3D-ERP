-- Preserve the short public description edited in Storefront V3.
alter table public.store_products
  add column if not exists short_description text;

comment on column public.store_products.short_description is
  'Short public description shown in product cards and editor previews.';
