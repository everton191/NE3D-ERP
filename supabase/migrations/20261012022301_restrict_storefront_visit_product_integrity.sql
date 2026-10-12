-- Public visits may carry an optional product. Keep the store_view/null path,
-- but require a product to belong to the published store and public catalog.
-- No table constraint is added: historical visits and ON DELETE SET NULL remain intact.
drop policy if exists "public create storefront visits" on public.store_visits;

create policy "public create storefront visits"
on public.store_visits
for insert
to anon, authenticated
with check (
  event_type in ('store_view', 'product_view')
  and public.storefront_publication_allowed(store_id)
  and (
    product_id is null
    or exists (
      select 1
      from public.store_products product
      where product.id = store_visits.product_id
        and product.store_id = store_visits.store_id
        and product.visible = true
        and product.stock_mode <> 'unavailable'
    )
  )
);
