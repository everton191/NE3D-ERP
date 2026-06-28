-- PL-02 foundation: catalogo persistente de planos e preparo para cobranca escalavel.
-- Aditiva e segura: nao altera checkout, assinatura ativa, webhook atual ou acesso de clientes.

create extension if not exists pgcrypto;

alter table public.plans
  add column if not exists display_headline text,
  add column if not exists display_subtitle text,
  add column if not exists display_description text,
  add column if not exists display_badge text,
  add column if not exists display_cta text,
  add column if not exists display_tone text,
  add column if not exists storefront_product_limit integer,
  add column if not exists ads_enabled boolean,
  add column if not exists public_store_enabled boolean,
  add column if not exists share_link_enabled boolean,
  add column if not exists premium_themes_enabled boolean,
  add column if not exists capabilities jsonb not null default '{}'::jsonb;

create table if not exists public.plan_card_stats (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  stat_key text not null,
  label text not null,
  value text not null,
  icon text,
  sort_order integer not null default 100,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_card_stats_key_check check (stat_key ~ '^[a-z0-9_:-]+$')
);

create unique index if not exists plan_card_stats_plan_key_unique_idx
  on public.plan_card_stats(plan_id, stat_key);
create index if not exists plan_card_stats_plan_sort_idx
  on public.plan_card_stats(plan_id, active, sort_order);

create table if not exists public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_key text not null,
  label text not null,
  description text,
  included boolean not null default true,
  limit_value numeric,
  limit_unit text,
  sort_order integer not null default 100,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_features_key_check check (feature_key ~ '^[a-z0-9_:-]+$')
);

create unique index if not exists plan_features_plan_key_unique_idx
  on public.plan_features(plan_id, feature_key);
create index if not exists plan_features_plan_sort_idx
  on public.plan_features(plan_id, active, sort_order);

create table if not exists public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  price_key text not null,
  currency text not null default 'BRL',
  amount numeric(10,2) not null default 0,
  billing_period text not null default 'month',
  provider text not null default 'mercado_pago',
  provider_price_id text,
  provider_plan_id text,
  active boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_prices_amount_check check (amount >= 0),
  constraint plan_prices_period_check check (billing_period in ('day', 'week', 'month', 'year', 'one_time')),
  constraint plan_prices_provider_check check (provider in ('mercado_pago', 'manual', 'internal')),
  constraint plan_prices_range_check check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists plan_prices_plan_key_unique_idx
  on public.plan_prices(plan_id, price_key);
create index if not exists plan_prices_active_lookup_idx
  on public.plan_prices(plan_id, active, starts_at desc);
create index if not exists plan_prices_provider_plan_idx
  on public.plan_prices(provider, provider_plan_id)
  where provider_plan_id is not null;

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  plan_price_id uuid references public.plan_prices(id) on delete set null,
  provider text not null default 'mercado_pago',
  provider_session_id text,
  external_reference text,
  status text not null default 'created',
  amount numeric(10,2) not null default 0,
  currency text not null default 'BRL',
  checkout_url text,
  expires_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkout_sessions_provider_check check (provider in ('mercado_pago', 'manual', 'internal')),
  constraint checkout_sessions_status_check check (status in ('created', 'opened', 'pending', 'approved', 'abandoned', 'expired', 'cancelled', 'error')),
  constraint checkout_sessions_amount_check check (amount >= 0)
);

create index if not exists checkout_sessions_client_created_idx
  on public.checkout_sessions(client_id, created_at desc);
create index if not exists checkout_sessions_provider_session_idx
  on public.checkout_sessions(provider, provider_session_id)
  where provider_session_id is not null;
create index if not exists checkout_sessions_status_idx
  on public.checkout_sessions(status, created_at desc);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  checkout_session_id uuid references public.checkout_sessions(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  plan_price_id uuid references public.plan_prices(id) on delete set null,
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  provider_subscription_id text,
  external_reference text,
  status text not null default 'pending',
  amount numeric(10,2) not null default 0,
  currency text not null default 'BRL',
  paid_at timestamptz,
  refunded_at timestamptz,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_provider_check check (provider in ('mercado_pago', 'manual', 'internal')),
  constraint payment_transactions_status_check check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back', 'error')),
  constraint payment_transactions_amount_check check (amount >= 0)
);

create unique index if not exists payment_transactions_provider_payment_unique_idx
  on public.payment_transactions(provider, provider_payment_id)
  where provider_payment_id is not null;
create unique index if not exists payment_transactions_idempotency_unique_idx
  on public.payment_transactions(provider, idempotency_key)
  where idempotency_key is not null;
create index if not exists payment_transactions_client_created_idx
  on public.payment_transactions(client_id, created_at desc);
create index if not exists payment_transactions_status_idx
  on public.payment_transactions(status, created_at desc);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercado_pago',
  event_key text not null,
  event_type text,
  external_id text,
  request_id text,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_provider_check check (provider in ('mercado_pago', 'internal')),
  constraint webhook_events_status_check check (status in ('received', 'processed', 'ignored', 'error'))
);

create unique index if not exists webhook_events_provider_key_unique_idx
  on public.webhook_events(provider, event_key);
create index if not exists webhook_events_external_idx
  on public.webhook_events(provider, external_id, created_at desc);

create table if not exists public.company_plan_overrides (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  override_type text not null default 'capability',
  override_key text not null,
  override_value jsonb not null default '{}'::jsonb,
  reason text,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_plan_overrides_owner_check check (client_id is not null or company_id is not null),
  constraint company_plan_overrides_type_check check (override_type in ('capability', 'limit', 'price', 'trial', 'support')),
  constraint company_plan_overrides_range_check check (ends_at is null or ends_at > starts_at)
);

create index if not exists company_plan_overrides_client_active_idx
  on public.company_plan_overrides(client_id, active, starts_at desc);
create index if not exists company_plan_overrides_company_active_idx
  on public.company_plan_overrides(company_id, active, starts_at desc);

create table if not exists public.plan_change_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  from_plan_id uuid references public.plans(id) on delete set null,
  to_plan_id uuid references public.plans(id) on delete set null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled',
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_change_schedules_owner_check check (client_id is not null or company_id is not null),
  constraint plan_change_schedules_status_check check (status in ('scheduled', 'processing', 'applied', 'cancelled', 'error'))
);

create index if not exists plan_change_schedules_due_idx
  on public.plan_change_schedules(status, scheduled_for);
create index if not exists plan_change_schedules_client_idx
  on public.plan_change_schedules(client_id, created_at desc);

create table if not exists public.company_plan_usage (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  usage_key text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  used_value numeric not null default 0,
  limit_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_plan_usage_owner_check check (client_id is not null or company_id is not null),
  constraint company_plan_usage_period_check check (period_end > period_start),
  constraint company_plan_usage_value_check check (used_value >= 0 and (limit_value is null or limit_value >= 0))
);

create unique index if not exists company_plan_usage_client_period_unique_idx
  on public.company_plan_usage(client_id, usage_key, period_start, period_end)
  where client_id is not null;
create unique index if not exists company_plan_usage_company_period_unique_idx
  on public.company_plan_usage(company_id, usage_key, period_start, period_end)
  where company_id is not null;
create index if not exists company_plan_usage_lookup_idx
  on public.company_plan_usage(usage_key, period_start desc);

insert into public.plan_prices (plan_id, price_key, amount, billing_period, provider, active, metadata)
select p.id, p.slug || '_monthly', p.price, 'month', 'mercado_pago', p.active, '{"foundation":"PL-02","checkout_connected":false}'::jsonb
from public.plans p
where p.slug in ('free', 'start', 'pro')
on conflict (plan_id, price_key) do update
set amount = excluded.amount,
    active = excluded.active,
    metadata = public.plan_prices.metadata || excluded.metadata,
    updated_at = now();

insert into public.plan_card_stats (plan_id, stat_key, label, value, icon, sort_order)
select p.id, stats.stat_key, stats.label, stats.value, stats.icon, stats.sort_order
from public.plans p
join (values
  ('free', 'orders_today', 'Pedidos hoje', '5/5', 'pedido', 10),
  ('free', 'cash', 'Caixa', 'R$ 0,00', 'caixa', 20),
  ('free', 'store', 'Loja', 'Em preparação', 'lojaOnline', 30),
  ('start', 'public_store', 'Loja virtual', 'Publicada', 'lojaOnline', 10),
  ('start', 'products', 'Produtos', 'Até 100', 'estoque', 20),
  ('start', 'share_link', 'Link', 'Para divulgar', 'share', 30),
  ('pro', 'revenue', 'Receita', '+142%', 'caixa', 10),
  ('pro', 'orders', 'Pedidos', '1.248', 'pedido', 20),
  ('pro', 'backup', 'Backup', 'Avançado', 'backup', 30)
) as stats(plan_slug, stat_key, label, value, icon, sort_order)
  on stats.plan_slug = p.slug
on conflict (plan_id, stat_key) do update
set label = excluded.label,
    value = excluded.value,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.plan_features (plan_id, feature_key, label, included, sort_order)
select p.id, features.feature_key, features.label, true, features.sort_order
from public.plans p
join (values
  ('free', 'daily_orders_5', 'Até 5 pedidos por dia', 10),
  ('free', 'basic_stock', 'Estoque básico', 20),
  ('free', 'ads_enabled', 'Anúncios para liberar ações extras', 30),
  ('start', 'public_store', 'Loja virtual publicada', 10),
  ('start', 'store_products_100', 'Até 100 produtos na loja', 20),
  ('start', 'ad_free', 'Sem anúncios', 30),
  ('pro', 'full_reports', 'Relatórios completos', 10),
  ('pro', 'employees_permissions', 'Funcionários e permissões', 20),
  ('pro', 'advanced_backup', 'Backup maior', 30)
) as features(plan_slug, feature_key, label, sort_order)
  on features.plan_slug = p.slug
on conflict (plan_id, feature_key) do update
set label = excluded.label,
    included = excluded.included,
    sort_order = excluded.sort_order,
    updated_at = now();

alter table public.plan_card_stats enable row level security;
alter table public.plan_features enable row level security;
alter table public.plan_prices enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.company_plan_overrides enable row level security;
alter table public.plan_change_schedules enable row level security;
alter table public.company_plan_usage enable row level security;

revoke all on public.plan_card_stats from public, anon, authenticated;
revoke all on public.plan_features from public, anon, authenticated;
revoke all on public.plan_prices from public, anon, authenticated;
revoke all on public.checkout_sessions from public, anon, authenticated;
revoke all on public.payment_transactions from public, anon, authenticated;
revoke all on public.webhook_events from public, anon, authenticated;
revoke all on public.company_plan_overrides from public, anon, authenticated;
revoke all on public.plan_change_schedules from public, anon, authenticated;
revoke all on public.company_plan_usage from public, anon, authenticated;

grant select, insert, update, delete on public.plan_card_stats to service_role;
grant select, insert, update, delete on public.plan_features to service_role;
grant select, insert, update, delete on public.plan_prices to service_role;
grant select, insert, update, delete on public.checkout_sessions to service_role;
grant select, insert, update, delete on public.payment_transactions to service_role;
grant select, insert, update, delete on public.webhook_events to service_role;
grant select, insert, update, delete on public.company_plan_overrides to service_role;
grant select, insert, update, delete on public.plan_change_schedules to service_role;
grant select, insert, update, delete on public.company_plan_usage to service_role;

drop trigger if exists set_plan_card_stats_updated_at on public.plan_card_stats;
create trigger set_plan_card_stats_updated_at
before update on public.plan_card_stats
for each row execute function public.set_updated_at();

drop trigger if exists set_plan_features_updated_at on public.plan_features;
create trigger set_plan_features_updated_at
before update on public.plan_features
for each row execute function public.set_updated_at();

drop trigger if exists set_plan_prices_updated_at on public.plan_prices;
create trigger set_plan_prices_updated_at
before update on public.plan_prices
for each row execute function public.set_updated_at();

drop trigger if exists set_checkout_sessions_updated_at on public.checkout_sessions;
create trigger set_checkout_sessions_updated_at
before update on public.checkout_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_transactions_updated_at on public.payment_transactions;
create trigger set_payment_transactions_updated_at
before update on public.payment_transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_webhook_events_updated_at on public.webhook_events;
create trigger set_webhook_events_updated_at
before update on public.webhook_events
for each row execute function public.set_updated_at();

drop trigger if exists set_company_plan_overrides_updated_at on public.company_plan_overrides;
create trigger set_company_plan_overrides_updated_at
before update on public.company_plan_overrides
for each row execute function public.set_updated_at();

drop trigger if exists set_plan_change_schedules_updated_at on public.plan_change_schedules;
create trigger set_plan_change_schedules_updated_at
before update on public.plan_change_schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_company_plan_usage_updated_at on public.company_plan_usage;
create trigger set_company_plan_usage_updated_at
before update on public.company_plan_usage
for each row execute function public.set_updated_at();
