-- Storefront publication guard by plan/subscription.
-- Keeps store data intact and only controls public publication/read access.

alter table public.stores
  add column if not exists publication_status text not null default 'draft',
  add column if not exists publication_suspended_reason text,
  add column if not exists publication_suspended_at timestamptz;

alter table public.stores
  drop constraint if exists stores_publication_status_valid;

alter table public.stores
  add constraint stores_publication_status_valid
  check (publication_status in ('draft', 'published', 'unpublished', 'suspended_plan', 'suspended_payment', 'archived'));

create index if not exists idx_stores_slug_publication_status
  on public.stores(slug, active, publication_status);

update public.stores
set publication_status = 'published',
    updated_at = now()
where active is true
  and publication_status = 'draft';

create or replace function public.storefront_publication_allowed(p_store_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_active boolean;
  v_publication_status text;
  v_client_id uuid;
  v_active_plan text;
  v_subscription_status text;
  v_payment_status text;
  v_cancel_at_period_end boolean;
  v_period_end timestamptz;
begin
  select s.owner_id, s.active, coalesce(s.publication_status, 'draft')
    into v_owner_id, v_active, v_publication_status
  from public.stores s
  where s.id = p_store_id;

  if v_owner_id is null or v_active is not true or v_publication_status <> 'published' then
    return false;
  end if;

  select p.client_id
    into v_client_id
  from public.profiles p
  where p.user_id = v_owner_id
  limit 1;

  select
    lower(coalesce(sub.active_plan, sub.plan_slug, plans.slug, 'free')),
    lower(coalesce(sub.subscription_status, sub.status_assinatura, sub.status, 'free')),
    lower(coalesce(sub.payment_status, 'none')),
    coalesce(sub.cancel_at_period_end, false),
    coalesce(sub.current_period_end, sub.plan_expires_at, sub.expires_at, sub.next_billing_at, sub.proximo_vencimento)
    into v_active_plan, v_subscription_status, v_payment_status, v_cancel_at_period_end, v_period_end
  from public.subscriptions sub
  left join public.plans plans on plans.id = sub.plan_id
  where (v_client_id is not null and sub.client_id = v_client_id)
     or sub.user_id = v_owner_id
  order by coalesce(sub.updated_at, sub.created_at, now()) desc
  limit 1;

  if v_active_plan not in ('start', 'pro', 'premium', 'premium_trial') then
    return false;
  end if;

  if v_payment_status = 'pending' then
    return false;
  end if;

  if v_subscription_status in ('active', 'trialing', 'paid', 'pago') then
    return v_period_end is null or v_period_end > now();
  end if;

  if v_subscription_status in ('canceling', 'cancelled', 'canceled', 'cancelado') or v_cancel_at_period_end is true then
    return v_period_end is not null and v_period_end > now();
  end if;

  return false;
end;
$$;

drop policy if exists "public read active stores" on public.stores;
create policy "public read active stores"
on public.stores
for select
to anon, authenticated
using (public.storefront_publication_allowed(id));

drop policy if exists "public read visible categories" on public.store_categories;
create policy "public read visible categories"
on public.store_categories
for select
to anon, authenticated
using (
  visible = true
  and exists (
    select 1 from public.stores s
    where s.id = store_categories.store_id
      and public.storefront_publication_allowed(s.id)
  )
);

drop policy if exists "public read visible products" on public.store_products;
create policy "public read visible products"
on public.store_products
for select
to anon, authenticated
using (
  visible = true
  and stock_mode <> 'unavailable'
  and exists (
    select 1 from public.stores s
    where s.id = store_products.store_id
      and public.storefront_publication_allowed(s.id)
  )
);

drop policy if exists "public read visible product images" on public.store_product_images;
create policy "public read visible product images"
on public.store_product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.store_products p
    join public.stores s on s.id = p.store_id
    where p.id = store_product_images.product_id
      and p.visible = true
      and p.stock_mode <> 'unavailable'
      and public.storefront_publication_allowed(s.id)
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
  and exists (
    select 1 from public.stores s
    where s.id = store_cart_leads.store_id
      and s.owner_id = store_cart_leads.owner_id
      and public.storefront_publication_allowed(s.id)
  )
);

drop policy if exists "public create storefront visits" on public.store_visits;
create policy "public create storefront visits"
on public.store_visits
for insert
to anon, authenticated
with check (
  event_type in ('store_view', 'product_view')
  and public.storefront_publication_allowed(store_id)
);

drop policy if exists "public create storefront events" on public.store_events;
create policy "public create storefront events"
on public.store_events
for insert
to anon, authenticated
with check (
  event_type in ('store_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'whatsapp_click', 'lead_created')
  and public.storefront_publication_allowed(store_id)
);
