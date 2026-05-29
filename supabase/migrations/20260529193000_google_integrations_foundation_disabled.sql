-- Google integrations foundation.
-- Prepared for future use only. No OAuth provider, SDK, token or real sync is active in this phase.

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

create table if not exists public.external_integrations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  provider text not null default 'google',
  integration_key text not null,
  status text not null default 'disabled',
  enabled boolean not null default false,
  scopes text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_integrations_provider_check check (provider in ('google')),
  constraint external_integrations_status_check check (status in ('disabled', 'prepared', 'revoked', 'error')),
  constraint external_integrations_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint external_integrations_unique_key unique (owner_id, provider, integration_key)
);

create table if not exists public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  integration_id uuid references public.external_integrations(id) on delete cascade,
  provider text not null default 'google',
  token_type text not null,
  encrypted_token_placeholder text not null default 'not_configured',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_tokens_provider_check check (provider in ('google')),
  constraint integration_tokens_type_check check (token_type in ('access_token', 'refresh_token', 'id_token', 'scope_grant', 'placeholder')),
  constraint integration_tokens_placeholder_check check (encrypted_token_placeholder = 'not_configured' or encrypted_token_placeholder like 'placeholder:%')
);

create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  integration_id uuid references public.external_integrations(id) on delete set null,
  provider text not null default 'google',
  job_type text not null,
  status text not null default 'disabled',
  attempts integer not null default 0,
  last_error text,
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_sync_jobs_provider_check check (provider in ('google')),
  constraint integration_sync_jobs_type_check check (job_type in ('google_calendar_sync', 'google_drive_backup', 'google_gmail_send', 'google_sheets_sync')),
  constraint integration_sync_jobs_status_check check (status in ('disabled', 'queued', 'running', 'success', 'error', 'skipped')),
  constraint integration_sync_jobs_attempts_check check (attempts >= 0)
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  integration_id uuid references public.external_integrations(id) on delete set null,
  provider text not null default 'google',
  action text not null,
  status text not null default 'disabled',
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint integration_logs_provider_check check (provider in ('google')),
  constraint integration_logs_status_check check (status in ('disabled', 'blocked', 'success', 'error', 'skipped')),
  constraint integration_logs_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.app_integration_feature_flags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  provider text not null default 'google',
  feature_key text not null,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_integration_feature_flags_unique unique (owner_id, provider, feature_key),
  constraint app_integration_feature_flags_provider_check check (provider in ('google')),
  constraint app_integration_feature_flags_key_check check (feature_key in (
    'google_integrations_enabled',
    'google_auth_enabled',
    'google_calendar_enabled',
    'google_drive_enabled',
    'google_gmail_enabled',
    'google_sheets_enabled'
  )),
  constraint app_integration_feature_flags_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_external_integrations_owner_provider on public.external_integrations(owner_id, provider);
create index if not exists idx_external_integrations_status on public.external_integrations(status);
create index if not exists idx_integration_tokens_owner_provider on public.integration_tokens(owner_id, provider);
create index if not exists idx_integration_tokens_integration_id on public.integration_tokens(integration_id);
create index if not exists idx_integration_sync_jobs_owner_provider on public.integration_sync_jobs(owner_id, provider);
create index if not exists idx_integration_sync_jobs_status on public.integration_sync_jobs(status, scheduled_at);
create index if not exists idx_integration_logs_owner_provider on public.integration_logs(owner_id, provider, created_at desc);
create index if not exists idx_app_integration_feature_flags_owner_provider on public.app_integration_feature_flags(owner_id, provider);

drop trigger if exists external_integrations_set_updated_at on public.external_integrations;
create trigger external_integrations_set_updated_at
before update on public.external_integrations
for each row execute function public.set_updated_at();

drop trigger if exists integration_tokens_set_updated_at on public.integration_tokens;
create trigger integration_tokens_set_updated_at
before update on public.integration_tokens
for each row execute function public.set_updated_at();

drop trigger if exists integration_sync_jobs_set_updated_at on public.integration_sync_jobs;
create trigger integration_sync_jobs_set_updated_at
before update on public.integration_sync_jobs
for each row execute function public.set_updated_at();

drop trigger if exists app_integration_feature_flags_set_updated_at on public.app_integration_feature_flags;
create trigger app_integration_feature_flags_set_updated_at
before update on public.app_integration_feature_flags
for each row execute function public.set_updated_at();

alter table public.external_integrations enable row level security;
alter table public.integration_tokens enable row level security;
alter table public.integration_sync_jobs enable row level security;
alter table public.integration_logs enable row level security;
alter table public.app_integration_feature_flags enable row level security;

drop policy if exists "external integrations select owner or superadmin" on public.external_integrations;
create policy "external integrations select owner or superadmin"
on public.external_integrations
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "external integrations insert disabled owner" on public.external_integrations;
create policy "external integrations insert disabled owner"
on public.external_integrations
for insert
with check (
  owner_id = auth.uid()
  and provider = 'google'
  and enabled = false
  and status = 'disabled'
);

drop policy if exists "external integrations superadmin manage" on public.external_integrations;
create policy "external integrations superadmin manage"
on public.external_integrations
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "integration tokens superadmin manage" on public.integration_tokens;
-- Tokens are intentionally not exposed to authenticated frontend users.
-- Future real tokens must be created/read only by secure backend code or service role.

drop policy if exists "integration sync jobs select owner or superadmin" on public.integration_sync_jobs;
create policy "integration sync jobs select owner or superadmin"
on public.integration_sync_jobs
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "integration sync jobs superadmin manage" on public.integration_sync_jobs;
create policy "integration sync jobs superadmin manage"
on public.integration_sync_jobs
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "integration logs insert owner" on public.integration_logs;
create policy "integration logs insert owner"
on public.integration_logs
for insert
with check (owner_id = auth.uid() and provider = 'google');

drop policy if exists "integration logs select owner or superadmin" on public.integration_logs;
create policy "integration logs select owner or superadmin"
on public.integration_logs
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "integration logs superadmin manage" on public.integration_logs;
create policy "integration logs superadmin manage"
on public.integration_logs
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "integration feature flags select owner or superadmin" on public.app_integration_feature_flags;
create policy "integration feature flags select owner or superadmin"
on public.app_integration_feature_flags
for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "integration feature flags superadmin manage" on public.app_integration_feature_flags;
create policy "integration feature flags superadmin manage"
on public.app_integration_feature_flags
for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

grant select, insert on public.external_integrations to authenticated, service_role;
grant select on public.integration_sync_jobs, public.app_integration_feature_flags to authenticated, service_role;
grant select, insert, update, delete on public.integration_tokens to service_role;
grant insert, select on public.integration_logs to authenticated, service_role;
grant insert, update, delete on public.integration_tokens, public.integration_sync_jobs, public.app_integration_feature_flags to service_role;
grant update, delete on public.external_integrations, public.integration_logs to service_role;
