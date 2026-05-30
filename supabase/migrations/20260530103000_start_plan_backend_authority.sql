-- Fase 5A.2: autoridade backend do plano Start.
-- Idempotente e segura: nao altera usuarios, assinaturas ativas ou cobrancas existentes.

create extension if not exists pgcrypto;

alter table public.plans
  add column if not exists max_clients integer,
  add column if not exists max_calculator_uses integer,
  add column if not exists max_storage_mb integer,
  add column if not exists allow_pdf boolean not null default false,
  add column if not exists allow_reports boolean not null default false,
  add column if not exists allow_permissions boolean not null default false,
  add column if not exists active boolean not null default true,
  add column if not exists sort_order integer,
  add column if not exists kind text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

insert into public.plans (
  slug, name, price, max_users, max_orders, max_clients, max_calculator_uses,
  max_storage_mb, allow_pdf, allow_reports, allow_permissions, active, sort_order, kind, metadata
)
values
  (
    'free', 'Free', 0, 1, 5, null, null,
    50, true, false, false, true, 10, 'free',
    '{"store_editable":true,"public_store":false,"share_link":false,"shows_ads":true}'::jsonb
  ),
  (
    'start', 'Start', 29.90, 2, null, null, null,
    256, true, true, false, true, 20, 'paid',
    '{"product_limit":300,"public_store":true,"share_link":true,"basic_customization":true,"premium_features":false,"ai_future":false,"google_future":false}'::jsonb
  ),
  (
    'pro', 'Pro', 59.90, 5, null, null, null,
    1024, true, true, true, true, 30, 'paid',
    '{"product_limit":null,"public_store":true,"share_link":true,"advanced_reports":true,"multiuser":true,"premium_features":true,"ai_future":false,"google_future":false}'::jsonb
  )
on conflict (slug) do update
set name = excluded.name,
    price = excluded.price,
    max_users = excluded.max_users,
    max_orders = excluded.max_orders,
    max_clients = excluded.max_clients,
    max_calculator_uses = excluded.max_calculator_uses,
    max_storage_mb = excluded.max_storage_mb,
    allow_pdf = excluded.allow_pdf,
    allow_reports = excluded.allow_reports,
    allow_permissions = excluded.allow_permissions,
    active = true,
    sort_order = excluded.sort_order,
    kind = excluded.kind,
    metadata = coalesce(public.plans.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();

create table if not exists public.app_billing_feature_flags (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_billing_feature_flags_key_check check (feature_key in (
    'start_plan_enabled',
    'mercado_pago_start_plan_id_configured',
    'mercado_pago_pro_plan_id_configured'
  ))
);

insert into public.app_billing_feature_flags (feature_key, enabled, metadata)
values
  ('start_plan_enabled', false, '{"env":"START_PLAN_ENABLED","default":"false"}'::jsonb),
  ('mercado_pago_start_plan_id_configured', false, '{"env":"MERCADO_PAGO_START_PLAN_ID","secret_location":"backend"}'::jsonb),
  ('mercado_pago_pro_plan_id_configured', false, '{"env":"MERCADO_PAGO_PRO_PLAN_ID","secret_location":"backend"}'::jsonb)
on conflict (feature_key) do update
set enabled = public.app_billing_feature_flags.enabled,
    metadata = public.app_billing_feature_flags.metadata || excluded.metadata,
    updated_at = now();

alter table public.app_billing_feature_flags enable row level security;
revoke all on public.app_billing_feature_flags from public, anon, authenticated;
grant all on public.app_billing_feature_flags to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'app_billing_feature_flags'
      and policyname = 'app_billing_feature_flags_service_role_all'
  ) then
    create policy app_billing_feature_flags_service_role_all
      on public.app_billing_feature_flags
      for all
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

create index if not exists app_billing_feature_flags_key_idx
  on public.app_billing_feature_flags(feature_key);
