-- Fase 5B: fundacao futura de IA, totalmente desativada.
-- Aditiva e idempotente. Nenhum provider real e nenhuma chave ficam no banco.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_ai_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  ai_enabled boolean not null default false,
  ai_provider text not null default 'disabled',
  ai_model text,
  monthly_limit integer not null default 0,
  used_this_month integer not null default 0,
  last_reset_at timestamptz,
  plan_required text default 'plus',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_ai_settings_provider_check check (ai_provider in ('disabled', 'openai', 'groq', 'gemini', 'anthropic', 'local')),
  constraint app_ai_settings_monthly_limit_check check (monthly_limit >= 0),
  constraint app_ai_settings_used_this_month_check check (used_this_month >= 0)
);

create table if not exists public.app_ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  user_id uuid,
  context_type text,
  action_type text,
  provider text not null default 'disabled',
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost numeric not null default 0,
  status text not null default 'blocked',
  blocked_reason text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint app_ai_usage_logs_provider_check check (provider in ('disabled', 'openai', 'groq', 'gemini', 'anthropic', 'local')),
  constraint app_ai_usage_logs_status_check check (status in ('blocked', 'success', 'error', 'skipped')),
  constraint app_ai_usage_logs_input_tokens_check check (input_tokens >= 0),
  constraint app_ai_usage_logs_output_tokens_check check (output_tokens >= 0),
  constraint app_ai_usage_logs_estimated_cost_check check (estimated_cost >= 0),
  constraint app_ai_usage_logs_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.app_ai_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  context_type text not null,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint app_ai_context_snapshots_summary_object_check check (jsonb_typeof(summary_json) = 'object')
);

create table if not exists public.app_ai_feature_flags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  feature_key text not null,
  enabled boolean not null default false,
  limit_value integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_ai_feature_flags_unique unique (owner_id, feature_key),
  constraint app_ai_feature_flags_key_check check (feature_key in (
    'ai_orders_summary',
    'ai_inventory_summary',
    'ai_cash_summary',
    'ai_pricing_helper',
    'ai_whatsapp_message_helper',
    'ai_client_analysis'
  )),
  constraint app_ai_feature_flags_limit_check check (limit_value is null or limit_value >= 0)
);

create index if not exists idx_app_ai_settings_owner_id on public.app_ai_settings(owner_id);
create unique index if not exists uniq_app_ai_settings_owner_id on public.app_ai_settings(owner_id);

create index if not exists idx_app_ai_usage_logs_owner_id on public.app_ai_usage_logs(owner_id);
create index if not exists idx_app_ai_usage_logs_user_id on public.app_ai_usage_logs(user_id);
create index if not exists idx_app_ai_usage_logs_created_at on public.app_ai_usage_logs(created_at desc);
create index if not exists idx_app_ai_usage_logs_context_type on public.app_ai_usage_logs(context_type);

create index if not exists idx_app_ai_context_snapshots_owner_id on public.app_ai_context_snapshots(owner_id);
create index if not exists idx_app_ai_context_snapshots_context_type on public.app_ai_context_snapshots(context_type);
create index if not exists idx_app_ai_context_snapshots_expires_at on public.app_ai_context_snapshots(expires_at);

create index if not exists idx_app_ai_feature_flags_owner_id on public.app_ai_feature_flags(owner_id);
create index if not exists idx_app_ai_feature_flags_feature_key on public.app_ai_feature_flags(feature_key);

drop trigger if exists app_ai_settings_set_updated_at on public.app_ai_settings;
create trigger app_ai_settings_set_updated_at
before update on public.app_ai_settings
for each row execute function public.set_updated_at();

drop trigger if exists app_ai_feature_flags_set_updated_at on public.app_ai_feature_flags;
create trigger app_ai_feature_flags_set_updated_at
before update on public.app_ai_feature_flags
for each row execute function public.set_updated_at();

alter table public.app_ai_settings enable row level security;
alter table public.app_ai_usage_logs enable row level security;
alter table public.app_ai_context_snapshots enable row level security;
alter table public.app_ai_feature_flags enable row level security;

drop policy if exists "app ai settings select owner or superadmin" on public.app_ai_settings;
create policy "app ai settings select owner or superadmin"
on public.app_ai_settings
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "app ai settings superadmin manage" on public.app_ai_settings;
create policy "app ai settings superadmin manage"
on public.app_ai_settings
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "app ai usage logs select own or superadmin" on public.app_ai_usage_logs;
create policy "app ai usage logs select own or superadmin"
on public.app_ai_usage_logs
for select
using (owner_id = auth.uid() or user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "app ai usage logs insert own blocked attempt" on public.app_ai_usage_logs;
create policy "app ai usage logs insert own blocked attempt"
on public.app_ai_usage_logs
for insert
with check (
  public.erp_is_superadmin()
  or (owner_id = auth.uid() and (user_id is null or user_id = auth.uid()) and status = 'blocked')
);

drop policy if exists "app ai context snapshots select owner or superadmin" on public.app_ai_context_snapshots;
create policy "app ai context snapshots select owner or superadmin"
on public.app_ai_context_snapshots
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "app ai context snapshots superadmin manage" on public.app_ai_context_snapshots;
create policy "app ai context snapshots superadmin manage"
on public.app_ai_context_snapshots
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "app ai feature flags select owner or superadmin" on public.app_ai_feature_flags;
create policy "app ai feature flags select owner or superadmin"
on public.app_ai_feature_flags
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "app ai feature flags superadmin manage" on public.app_ai_feature_flags;
create policy "app ai feature flags superadmin manage"
on public.app_ai_feature_flags
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());
