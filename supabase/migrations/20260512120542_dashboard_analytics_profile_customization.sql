-- Simplifica 3D: dashboard analytics snapshots, premium profiles and app customization.
-- This migration is idempotent and does not alter existing ERP operational tables.

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid null,
  period_type text not null check (period_type in ('day', 'week', 'month', 'year')),
  period_reference date not null,
  total_sales numeric(14,2) not null default 0,
  total_profit numeric(14,2) not null default 0,
  total_orders integer not null default 0,
  material_cost numeric(14,2) not null default 0,
  energy_cost numeric(14,2) not null default 0,
  printer_hours numeric(12,2) not null default 0,
  cash_balance numeric(14,2) not null default 0,
  chart_series jsonb not null default '[]'::jsonb,
  insights jsonb not null default '[]'::jsonb,
  source text not null default 'client_snapshot',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, period_type, period_reference)
);

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid null,
  company_name text,
  company_logo text,
  custom_message text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, company_id)
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  profile_photo text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.app_customizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid null,
  theme_color text,
  secondary_color text,
  background_image text,
  login_background text,
  pdf_watermark text,
  company_logo text,
  profile_photo text,
  custom_message text,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, company_id)
);

create index if not exists analytics_snapshots_user_period_idx
  on public.analytics_snapshots(user_id, period_type, period_reference desc);

create index if not exists company_profiles_user_idx
  on public.company_profiles(user_id, company_id);

create index if not exists app_customizations_user_idx
  on public.app_customizations(user_id, company_id);

alter table public.analytics_snapshots enable row level security;
alter table public.company_profiles enable row level security;
alter table public.user_profiles enable row level security;
alter table public.app_customizations enable row level security;

grant select, insert, update, delete on public.analytics_snapshots to authenticated, service_role;
grant select, insert, update, delete on public.company_profiles to authenticated, service_role;
grant select, insert, update, delete on public.user_profiles to authenticated, service_role;
grant select, insert, update, delete on public.app_customizations to authenticated, service_role;

drop policy if exists "analytics_snapshots_select_own_or_superadmin" on public.analytics_snapshots;
create policy "analytics_snapshots_select_own_or_superadmin"
on public.analytics_snapshots for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "analytics_snapshots_insert_own" on public.analytics_snapshots;
create policy "analytics_snapshots_insert_own"
on public.analytics_snapshots for insert
with check (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "analytics_snapshots_update_own_or_superadmin" on public.analytics_snapshots;
create policy "analytics_snapshots_update_own_or_superadmin"
on public.analytics_snapshots for update
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "analytics_snapshots_delete_superadmin" on public.analytics_snapshots;
create policy "analytics_snapshots_delete_superadmin"
on public.analytics_snapshots for delete
using (public.erp_is_superadmin());

drop policy if exists "company_profiles_select_own_or_superadmin" on public.company_profiles;
create policy "company_profiles_select_own_or_superadmin"
on public.company_profiles for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "company_profiles_write_own_or_superadmin" on public.company_profiles;
create policy "company_profiles_write_own_or_superadmin"
on public.company_profiles for all
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "user_profiles_select_own_or_superadmin" on public.user_profiles;
create policy "user_profiles_select_own_or_superadmin"
on public.user_profiles for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "user_profiles_write_own_or_superadmin" on public.user_profiles;
create policy "user_profiles_write_own_or_superadmin"
on public.user_profiles for all
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "app_customizations_select_own_or_superadmin" on public.app_customizations;
create policy "app_customizations_select_own_or_superadmin"
on public.app_customizations for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "app_customizations_write_own_or_superadmin" on public.app_customizations;
create policy "app_customizations_write_own_or_superadmin"
on public.app_customizations for all
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'simplifica-assets',
  'simplifica-assets',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "simplifica_assets_public_read" on storage.objects;
create policy "simplifica_assets_public_read"
on storage.objects for select
using (bucket_id = 'simplifica-assets');

drop policy if exists "simplifica_assets_user_insert" on storage.objects;
create policy "simplifica_assets_user_insert"
on storage.objects for insert
with check (
  bucket_id = 'simplifica-assets'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "simplifica_assets_user_update" on storage.objects;
create policy "simplifica_assets_user_update"
on storage.objects for update
using (
  bucket_id = 'simplifica-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.erp_is_superadmin())
)
with check (
  bucket_id = 'simplifica-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.erp_is_superadmin())
);

drop policy if exists "simplifica_assets_user_delete" on storage.objects;
create policy "simplifica_assets_user_delete"
on storage.objects for delete
using (
  bucket_id = 'simplifica-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.erp_is_superadmin())
);

create or replace function public.upsert_dashboard_analytics_snapshot(
  p_period_type text,
  p_period_reference date,
  p_company_id uuid default null,
  p_total_sales numeric default 0,
  p_total_profit numeric default 0,
  p_total_orders integer default 0,
  p_material_cost numeric default 0,
  p_energy_cost numeric default 0,
  p_printer_hours numeric default 0,
  p_cash_balance numeric default 0,
  p_chart_series jsonb default '[]'::jsonb,
  p_insights jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.analytics_snapshots%rowtype;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if p_period_type not in ('day', 'week', 'month', 'year') then
    raise exception 'INVALID_PERIOD_TYPE' using errcode = '22023';
  end if;

  insert into public.analytics_snapshots (
    user_id,
    company_id,
    period_type,
    period_reference,
    total_sales,
    total_profit,
    total_orders,
    material_cost,
    energy_cost,
    printer_hours,
    cash_balance,
    chart_series,
    insights,
    source,
    updated_at
  )
  values (
    v_user_id,
    p_company_id,
    p_period_type,
    p_period_reference,
    greatest(0, coalesce(p_total_sales, 0)),
    coalesce(p_total_profit, 0),
    greatest(0, coalesce(p_total_orders, 0)),
    greatest(0, coalesce(p_material_cost, 0)),
    greatest(0, coalesce(p_energy_cost, 0)),
    greatest(0, coalesce(p_printer_hours, 0)),
    coalesce(p_cash_balance, 0),
    coalesce(p_chart_series, '[]'::jsonb),
    coalesce(p_insights, '[]'::jsonb),
    'client_snapshot',
    now()
  )
  on conflict (user_id, period_type, period_reference)
  do update set
    company_id = excluded.company_id,
    total_sales = excluded.total_sales,
    total_profit = excluded.total_profit,
    total_orders = excluded.total_orders,
    material_cost = excluded.material_cost,
    energy_cost = excluded.energy_cost,
    printer_hours = excluded.printer_hours,
    cash_balance = excluded.cash_balance,
    chart_series = excluded.chart_series,
    insights = excluded.insights,
    source = excluded.source,
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'period_type', v_row.period_type,
    'period_reference', v_row.period_reference,
    'updated_at', v_row.updated_at
  );
end;
$$;

create or replace function public.get_dashboard_analytics(
  p_period_type text default 'day',
  p_period_reference date default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period_type text := lower(coalesce(p_period_type, 'day'));
  v_period_reference date := coalesce(p_period_reference, current_date);
  v_current public.analytics_snapshots%rowtype;
  v_previous public.analytics_snapshots%rowtype;
  v_previous_reference date;
  v_growth numeric := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if v_period_type not in ('day', 'week', 'month', 'year') then
    v_period_type := 'day';
  end if;

  v_period_reference := case
    when v_period_type = 'week' then date_trunc('week', v_period_reference)::date
    when v_period_type = 'month' then date_trunc('month', v_period_reference)::date
    when v_period_type = 'year' then date_trunc('year', v_period_reference)::date
    else v_period_reference
  end;

  v_previous_reference := case
    when v_period_type = 'week' then (v_period_reference - interval '7 days')::date
    when v_period_type = 'month' then (v_period_reference - interval '1 month')::date
    when v_period_type = 'year' then (v_period_reference - interval '1 year')::date
    else (v_period_reference - interval '1 day')::date
  end;

  select *
    into v_current
  from public.analytics_snapshots
  where user_id = v_user_id
    and period_type = v_period_type
    and period_reference = v_period_reference
  limit 1;

  select *
    into v_previous
  from public.analytics_snapshots
  where user_id = v_user_id
    and period_type = v_period_type
    and period_reference = v_previous_reference
  limit 1;

  if not found and v_current.id is null then
    return jsonb_build_object(
      'total_sales', 0,
      'total_profit', 0,
      'total_orders', 0,
      'material_cost', 0,
      'energy_cost', 0,
      'printer_hours', 0,
      'cash_balance', 0,
      'growth_percent', 0,
      'comparison_label', 'Sem periodo anterior',
      'chart_series', '[]'::jsonb,
      'insights', '[]'::jsonb,
      'period_type', v_period_type,
      'period_reference', v_period_reference,
      'source', 'empty'
    );
  end if;

  if coalesce(v_previous.total_sales, 0) > 0 then
    v_growth := round(((coalesce(v_current.total_sales, 0) - v_previous.total_sales) / v_previous.total_sales) * 100, 2);
  end if;

  return jsonb_build_object(
    'total_sales', coalesce(v_current.total_sales, 0),
    'total_profit', coalesce(v_current.total_profit, 0),
    'total_orders', coalesce(v_current.total_orders, 0),
    'material_cost', coalesce(v_current.material_cost, 0),
    'energy_cost', coalesce(v_current.energy_cost, 0),
    'printer_hours', coalesce(v_current.printer_hours, 0),
    'cash_balance', coalesce(v_current.cash_balance, 0),
    'growth_percent', coalesce(v_growth, 0),
    'comparison_label', case
      when v_period_type = 'day' then 'comparado ontem'
      when v_period_type = 'week' then 'comparado semana anterior'
      when v_period_type = 'month' then 'comparado mes anterior'
      else 'comparado ano anterior'
    end,
    'chart_series', coalesce(v_current.chart_series, '[]'::jsonb),
    'insights', coalesce(v_current.insights, '[]'::jsonb),
    'period_type', v_period_type,
    'period_reference', v_period_reference,
    'source', coalesce(v_current.source, 'analytics_snapshots'),
    'updated_at', v_current.updated_at
  );
end;
$$;

revoke execute on function public.upsert_dashboard_analytics_snapshot(text, date, uuid, numeric, numeric, integer, numeric, numeric, numeric, numeric, jsonb, jsonb) from public, anon;
revoke execute on function public.get_dashboard_analytics(text, date) from public, anon;
grant execute on function public.upsert_dashboard_analytics_snapshot(text, date, uuid, numeric, numeric, integer, numeric, numeric, numeric, numeric, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.get_dashboard_analytics(text, date) to authenticated, service_role;

do $$
begin
  begin
    alter table public.analytics_snapshots replica identity full;
    alter publication supabase_realtime add table public.analytics_snapshots;
  exception when others then
    null;
  end;
end $$;
