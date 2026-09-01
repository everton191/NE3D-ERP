-- Fase 3: telemetria publica minimizada e validacoes de privacidade.
-- Eventos nao carregam PII; o cliente envia somente event_type, ids publicos e source.

drop policy if exists "public create storefront events" on public.store_events;

create policy "public create storefront events"
on public.store_events
for insert
to anon, authenticated
with check (
  event_type in (
    'store_view',
    'product_view',
    'add_to_cart',
    'remove_from_cart',
    'whatsapp_click',
    'instagram_click',
    'tiktok_click',
    'share',
    'lead_created'
  )
  and jsonb_typeof(metadata_json) = 'object'
  and public.storefront_publication_allowed(store_id)
  and (
    product_id is null
    or exists (
      select 1
      from public.store_products product
      where product.id = store_events.product_id
        and product.store_id = store_events.store_id
        and product.visible = true
        and product.stock_mode <> 'unavailable'
    )
  )
);

drop policy if exists "public create cart leads for active stores" on public.store_cart_leads;

create policy "public create cart leads for active stores"
on public.store_cart_leads
for insert
to anon, authenticated
with check (
  status = 'novo'
  and jsonb_array_length(items_json) between 1 and 80
  and char_length(coalesce(customer_name, '')) <= 120
  and char_length(coalesce(customer_phone, '')) <= 24
  and char_length(coalesce(customer_note, '')) <= 1000
  and char_length(coalesce(whatsapp_message, '')) <= 4000
  and exists (
    select 1
    from public.stores store
    where store.id = store_cart_leads.store_id
      and store.owner_id = store_cart_leads.owner_id
      and public.storefront_publication_allowed(store.id)
  )
);
