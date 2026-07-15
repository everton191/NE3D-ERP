-- Simplifica 3D: nucleo do estoque por rolos fisicos.
-- Local only until explicitly approved for remote application.

update public.app_feature_access_rules
set required_plan = 'start',
    partial_plan = null,
    updated_at = now()
where feature_key = 'spool_stock';

create or replace function public.erp_stock_rolls_enabled(p_client_id uuid default public.erp_current_client_id())
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.erp_is_superadmin()
    or exists (
      select 1
      from public.subscriptions s
      left join public.plans p on p.id = s.plan_id
      where s.client_id = p_client_id
        and lower(coalesce(s.active_plan, p.slug, 'free')) in ('start', 'pro', 'premium', 'premium_trial', 'pro_token')
        and lower(coalesce(s.status, 'active')) not in ('expired', 'inactive', 'blocked')
        and (coalesce(s.current_period_end, s.plan_expires_at) is null or coalesce(s.current_period_end, s.plan_expires_at) >= now())
    );
$$;

revoke all on function public.erp_stock_rolls_enabled(uuid) from public, anon;
grant execute on function public.erp_stock_rolls_enabled(uuid) to authenticated, service_role;

create table if not exists public.filament_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.clients(id) on delete cascade,
  brand text not null default '',
  product_line text not null default '',
  material_type text not null,
  commercial_color_name text not null default '',
  color_family text not null default '',
  color_reference text not null default '',
  finish_type text not null default '',
  color_mode text not null default 'single',
  diameter_mm numeric(5,2) not null default 1.75,
  nominal_net_weight_g numeric(12,3) not null default 1000,
  density_g_cm3 numeric(8,4),
  recommended_print_profile_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint filament_products_color_mode_check check (color_mode in ('single', 'dual', 'tri', 'gradient', 'rainbow')),
  constraint filament_products_weight_check check (nominal_net_weight_g > 0),
  constraint filament_products_diameter_check check (diameter_mm > 0),
  unique (id, company_id)
);

create table if not exists public.filament_product_colors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.clients(id) on delete cascade,
  filament_product_id uuid not null,
  color_name text not null,
  color_family text not null default '',
  color_reference text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint filament_product_colors_product_fk foreign key (filament_product_id, company_id)
    references public.filament_products(id, company_id) on delete cascade,
  unique (filament_product_id, display_order)
);

create table if not exists public.filament_rolls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.clients(id) on delete cascade,
  filament_product_id uuid not null,
  internal_code text not null,
  manufacturer_lot text not null default '',
  supplier_id text,
  location_id text,
  qr_code text,
  initial_net_weight_g numeric(12,3) not null,
  remaining_weight_g numeric(12,3) not null,
  reserved_weight_g numeric(12,3) not null default 0,
  spool_tare_weight_g numeric(12,3),
  purchase_cost numeric(12,2) not null default 0,
  received_at timestamptz,
  opened_at timestamptz,
  last_weighed_at timestamptz,
  status text not null default 'sealed',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint filament_rolls_product_fk foreign key (filament_product_id, company_id)
    references public.filament_products(id, company_id) on delete restrict,
  constraint filament_rolls_status_check check (status in ('sealed', 'open', 'reserved', 'in_use', 'exhausted', 'discarded')),
  constraint filament_rolls_initial_weight_check check (initial_net_weight_g > 0),
  constraint filament_rolls_remaining_weight_check check (remaining_weight_g >= 0 and remaining_weight_g <= initial_net_weight_g),
  constraint filament_rolls_reserved_weight_check check (reserved_weight_g >= 0 and reserved_weight_g <= remaining_weight_g),
  constraint filament_rolls_tare_check check (spool_tare_weight_g is null or spool_tare_weight_g >= 0),
  unique (company_id, internal_code),
  unique (id, company_id)
);

create table if not exists public.filament_roll_reservations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.clients(id) on delete cascade,
  roll_id uuid not null,
  order_id text not null,
  order_item_id text,
  planned_weight_g numeric(12,3) not null,
  reserved_weight_g numeric(12,3) not null,
  consumed_weight_g numeric(12,3) not null default 0,
  safety_margin_percent numeric(7,3) not null default 0,
  compatibility_level text not null default 'exact',
  status text not null default 'reserved',
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  released_at timestamptz,
  consumed_at timestamptz,
  constraint filament_roll_reservations_roll_fk foreign key (roll_id, company_id)
    references public.filament_rolls(id, company_id) on delete restrict,
  constraint filament_roll_reservations_status_check check (status in ('reserved', 'released', 'consumed', 'cancelled')),
  constraint filament_roll_reservations_compatibility_check check (compatibility_level in ('exact', 'compatible', 'free', 'manual_confirmation')),
  constraint filament_roll_reservations_weight_check check (planned_weight_g > 0 and reserved_weight_g > 0 and consumed_weight_g >= 0),
  unique (company_id, idempotency_key),
  unique (id, company_id)
);

create table if not exists public.filament_roll_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.clients(id) on delete cascade,
  roll_id uuid not null,
  reservation_id uuid,
  movement_type text not null,
  quantity_g numeric(12,3) not null,
  balance_before_g numeric(12,3) not null,
  balance_after_g numeric(12,3) not null,
  order_id text,
  order_item_id text,
  reason text not null default '',
  idempotency_key text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint filament_roll_movements_roll_fk foreign key (roll_id, company_id)
    references public.filament_rolls(id, company_id) on delete restrict,
  constraint filament_roll_movements_reservation_fk foreign key (reservation_id, company_id)
    references public.filament_roll_reservations(id, company_id) on delete restrict,
  constraint filament_roll_movements_type_check check (movement_type in ('entry', 'reservation', 'release', 'consumption', 'loss', 'return', 'adjustment')),
  constraint filament_roll_movements_quantity_check check (quantity_g > 0),
  constraint filament_roll_movements_balance_check check (balance_before_g >= 0 and balance_after_g >= 0),
  unique (company_id, idempotency_key)
);

create index if not exists filament_products_company_active_idx on public.filament_products(company_id, is_active, material_type);
create index if not exists filament_rolls_company_product_status_idx on public.filament_rolls(company_id, filament_product_id, status);
create index if not exists filament_rolls_company_remaining_idx on public.filament_rolls(company_id, remaining_weight_g);
create index if not exists filament_roll_reservations_order_idx on public.filament_roll_reservations(company_id, order_id, status);
create index if not exists filament_roll_movements_roll_created_idx on public.filament_roll_movements(company_id, roll_id, created_at desc);

drop trigger if exists filament_products_set_updated_at on public.filament_products;
create trigger filament_products_set_updated_at before update on public.filament_products
for each row execute function public.set_updated_at();
drop trigger if exists filament_rolls_set_updated_at on public.filament_rolls;
create trigger filament_rolls_set_updated_at before update on public.filament_rolls
for each row execute function public.set_updated_at();
drop trigger if exists filament_roll_reservations_set_updated_at on public.filament_roll_reservations;
create trigger filament_roll_reservations_set_updated_at before update on public.filament_roll_reservations
for each row execute function public.set_updated_at();

alter table public.filament_products enable row level security;
alter table public.filament_product_colors enable row level security;
alter table public.filament_rolls enable row level security;
alter table public.filament_roll_reservations enable row level security;
alter table public.filament_roll_movements enable row level security;

revoke all on public.filament_products, public.filament_product_colors, public.filament_rolls,
  public.filament_roll_reservations, public.filament_roll_movements from public, anon, authenticated;
grant select, insert, update, delete on public.filament_products, public.filament_product_colors, public.filament_rolls,
  public.filament_roll_reservations to authenticated, service_role;
grant select, insert on public.filament_roll_movements to authenticated, service_role;

create policy "filament products paid company read" on public.filament_products for select to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());
create policy "filament products paid company insert" on public.filament_products for insert to authenticated
with check (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());
create policy "filament products paid company update" on public.filament_products for update to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin())
with check (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());
create policy "filament products paid company delete" on public.filament_products for delete to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());

create policy "filament colors paid company all" on public.filament_product_colors for all to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin())
with check (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());

create policy "filament rolls paid company all" on public.filament_rolls for all to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin())
with check (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());

create policy "filament reservations company read" on public.filament_roll_reservations for select to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());
create policy "filament reservations paid company insert" on public.filament_roll_reservations for insert to authenticated
with check (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());
create policy "filament reservations company resolve" on public.filament_roll_reservations for update to authenticated
using (company_id = public.erp_current_client_id() or public.erp_is_superadmin())
with check ((company_id = public.erp_current_client_id() and (public.erp_stock_rolls_enabled(company_id) or status in ('released', 'cancelled'))) or public.erp_is_superadmin());
create policy "filament reservations paid company delete" on public.filament_roll_reservations for delete to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());

create policy "filament movements paid company read" on public.filament_roll_movements for select to authenticated
using (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) or public.erp_is_superadmin());
create policy "filament movements paid company insert" on public.filament_roll_movements for insert to authenticated
with check (company_id = public.erp_current_client_id() and public.erp_stock_rolls_enabled(company_id) and created_by = auth.uid() or public.erp_is_superadmin());
