-- Storefront Phase 3: public store, leads, order drafts, visits and events.
-- This migration prepares the real multi-tenant model. It is versioned here,
-- but should be applied only when the release plan is ready.

create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  whatsapp text,
  instagram text,
  active boolean not null default false,
  theme_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint stores_owner_slug_unique unique (owner_id, slug),
  constraint stores_public_slug_unique unique (slug)
);

create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  order_index integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint store_categories_store_slug_unique unique (store_id, slug)
);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  erp_product_id text,
  title text not null,
  slug text not null,
  description text,
  price numeric(12,2) not null default 0,
  compare_price numeric(12,2),
  category_id uuid references public.store_categories(id) on delete set null,
  visible boolean not null default false,
  featured boolean not null default false,
  is_customizable boolean not null default false,
  estimated_production_time text,
  stock_mode text not null default 'unlimited',
  stock_quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint store_products_price_nonnegative check (price >= 0),
  constraint store_products_compare_nonnegative check (compare_price is null or compare_price >= 0),
  constraint store_products_stock_mode_valid check (stock_mode in ('unlimited', 'manual', 'erp_linked', 'unavailable')),
  constraint store_products_stock_quantity_valid check (stock_quantity is null or stock_quantity >= 0),
  constraint store_products_store_slug_unique unique (store_id, slug)
);

create table if not exists public.store_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  alt_text text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.store_cart_leads (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_name text,
  customer_phone text,
  customer_note text,
  items_json jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  whatsapp_message text,
  status text not null default 'novo',
  source text not null default 'storefront',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_cart_leads_status_valid check (status in ('novo', 'em_atendimento', 'convertido', 'perdido', 'arquivado')),
  constraint store_cart_leads_subtotal_nonnegative check (subtotal >= 0),
  constraint store_cart_leads_items_array check (jsonb_typeof(items_json) = 'array')
);

create table if not exists public.store_order_drafts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.store_cart_leads(id) on delete set null,
  customer_name text,
  customer_phone text,
  items_json jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  status text not null default 'rascunho',
  erp_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_order_drafts_status_valid check (status in ('rascunho', 'em_revisao', 'convertido', 'cancelado')),
  constraint store_order_drafts_items_array check (jsonb_typeof(items_json) = 'array'),
  constraint store_order_drafts_subtotal_nonnegative check (subtotal >= 0)
);

create table if not exists public.store_visits (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.store_products(id) on delete set null,
  event_type text not null,
  session_id text not null,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now(),
  constraint store_visits_event_type_valid check (event_type in ('store_view', 'product_view'))
);

create table if not exists public.store_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.store_products(id) on delete set null,
  event_type text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint store_events_event_type_valid check (event_type in ('store_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'whatsapp_click', 'lead_created')),
  constraint store_events_metadata_object check (jsonb_typeof(metadata_json) = 'object')
);

create index if not exists idx_stores_owner_id on public.stores(owner_id);
create index if not exists idx_stores_slug_active on public.stores(slug, active);
create index if not exists idx_store_categories_store_visible on public.store_categories(store_id, visible, order_index);
create index if not exists idx_store_categories_owner_id on public.store_categories(owner_id);
create index if not exists idx_store_products_store_visible on public.store_products(store_id, visible, featured);
create index if not exists idx_store_products_owner_id on public.store_products(owner_id);
create index if not exists idx_store_products_category_id on public.store_products(category_id);
create index if not exists idx_store_products_erp_product_id on public.store_products(owner_id, erp_product_id);
create index if not exists idx_store_product_images_product_order on public.store_product_images(product_id, order_index);
create index if not exists idx_store_cart_leads_owner_status on public.store_cart_leads(owner_id, status, created_at desc);
create index if not exists idx_store_order_drafts_owner_status on public.store_order_drafts(owner_id, status, created_at desc);
create index if not exists idx_store_visits_store_created_at on public.store_visits(store_id, created_at desc);
create index if not exists idx_store_events_store_type_created_at on public.store_events(store_id, event_type, created_at desc);

create or replace function public.set_storefront_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at
before update on public.stores
for each row execute function public.set_storefront_updated_at();

drop trigger if exists trg_store_categories_updated_at on public.store_categories;
create trigger trg_store_categories_updated_at
before update on public.store_categories
for each row execute function public.set_storefront_updated_at();

drop trigger if exists trg_store_products_updated_at on public.store_products;
create trigger trg_store_products_updated_at
before update on public.store_products
for each row execute function public.set_storefront_updated_at();

drop trigger if exists trg_store_cart_leads_updated_at on public.store_cart_leads;
create trigger trg_store_cart_leads_updated_at
before update on public.store_cart_leads
for each row execute function public.set_storefront_updated_at();

drop trigger if exists trg_store_order_drafts_updated_at on public.store_order_drafts;
create trigger trg_store_order_drafts_updated_at
before update on public.store_order_drafts
for each row execute function public.set_storefront_updated_at();

create or replace function public.storefront_owner_matches_store()
returns trigger
language plpgsql
as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.stores where id = new.store_id;
  if v_owner_id is null or v_owner_id <> new.owner_id then
    raise exception 'store owner mismatch';
  end if;
  return new;
end;
$$;

create or replace function public.storefront_image_owner_matches_product()
returns trigger
language plpgsql
as $$
declare
  v_store_id uuid;
  v_owner_id uuid;
begin
  select store_id, owner_id into v_store_id, v_owner_id
  from public.store_products
  where id = new.product_id;
  if v_store_id is null or v_owner_id is null or v_store_id <> new.store_id or v_owner_id <> new.owner_id then
    raise exception 'product owner mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_store_categories_owner_guard on public.store_categories;
create trigger trg_store_categories_owner_guard
before insert or update on public.store_categories
for each row execute function public.storefront_owner_matches_store();

drop trigger if exists trg_store_products_owner_guard on public.store_products;
create trigger trg_store_products_owner_guard
before insert or update on public.store_products
for each row execute function public.storefront_owner_matches_store();

drop trigger if exists trg_store_product_images_owner_guard on public.store_product_images;
create trigger trg_store_product_images_owner_guard
before insert or update on public.store_product_images
for each row execute function public.storefront_image_owner_matches_product();

alter table public.stores enable row level security;
alter table public.store_categories enable row level security;
alter table public.store_products enable row level security;
alter table public.store_product_images enable row level security;
alter table public.store_cart_leads enable row level security;
alter table public.store_order_drafts enable row level security;
alter table public.store_visits enable row level security;
alter table public.store_events enable row level security;

drop policy if exists "public read active stores" on public.stores;
create policy "public read active stores"
on public.stores
for select
to anon, authenticated
using (active = true);

drop policy if exists "owners manage own stores" on public.stores;
create policy "owners manage own stores"
on public.stores
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "public read visible categories" on public.store_categories;
create policy "public read visible categories"
on public.store_categories
for select
to anon, authenticated
using (
  visible = true
  and exists (
    select 1 from public.stores s
    where s.id = store_categories.store_id and s.active = true
  )
);

drop policy if exists "owners manage own categories" on public.store_categories;
create policy "owners manage own categories"
on public.store_categories
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

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
    where s.id = store_products.store_id and s.active = true
  )
);

drop policy if exists "owners manage own products" on public.store_products;
create policy "owners manage own products"
on public.store_products
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

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
      and s.active = true
  )
);

drop policy if exists "owners manage own product images" on public.store_product_images;
create policy "owners manage own product images"
on public.store_product_images
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

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
      and s.active = true
  )
);

drop policy if exists "owners read update own cart leads" on public.store_cart_leads;
create policy "owners read update own cart leads"
on public.store_cart_leads
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owners manage own order drafts" on public.store_order_drafts;
create policy "owners manage own order drafts"
on public.store_order_drafts
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "public create storefront visits" on public.store_visits;
create policy "public create storefront visits"
on public.store_visits
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.stores s
    where s.id = store_visits.store_id and s.active = true
  )
);

drop policy if exists "owners read own storefront visits" on public.store_visits;
create policy "owners read own storefront visits"
on public.store_visits
for select
to authenticated
using (
  exists (
    select 1 from public.stores s
    where s.id = store_visits.store_id and s.owner_id = auth.uid()
  )
);

drop policy if exists "public create storefront events" on public.store_events;
create policy "public create storefront events"
on public.store_events
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.stores s
    where s.id = store_events.store_id and s.active = true
  )
);

drop policy if exists "owners read own storefront events" on public.store_events;
create policy "owners read own storefront events"
on public.store_events
for select
to authenticated
using (
  exists (
    select 1 from public.stores s
    where s.id = store_events.store_id and s.owner_id = auth.uid()
  )
);

grant select on public.stores, public.store_categories, public.store_products, public.store_product_images to anon, authenticated;
grant insert on public.store_cart_leads, public.store_visits, public.store_events to anon, authenticated;
grant all on public.stores, public.store_categories, public.store_products, public.store_product_images, public.store_cart_leads, public.store_order_drafts to authenticated;
grant select on public.store_visits, public.store_events to authenticated;
