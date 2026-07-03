-- Simplifica 3D: account security and filament roll foundation.
-- Prepared for future use only. No 2FA, Google login, device enforcement,
-- account deletion workflow or automatic roll consumption is active in this phase.

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

create table if not exists public.app_account_feature_flags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_account_feature_flags_unique unique (owner_id, feature_key),
  constraint app_account_feature_flags_key_check check (feature_key in (
    'filament_rolls_enabled',
    'automatic_roll_consumption_enabled',
    'account_2fa_enabled',
    'google_login_enabled',
    'account_devices_enabled',
    'account_deletion_enabled'
  )),
  constraint app_account_feature_flags_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.inventory_rolls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  inventory_record_id text,
  material_id text,
  material_name text not null,
  material_type text not null default 'filament',
  color text,
  roll_label text,
  capacity_grams numeric not null default 1000,
  remaining_grams numeric not null default 0,
  opened_at timestamptz,
  closed_at timestamptz,
  status text not null default 'prepared',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_rolls_capacity_check check (capacity_grams > 0),
  constraint inventory_rolls_remaining_check check (remaining_grams >= 0 and remaining_grams <= capacity_grams),
  constraint inventory_rolls_status_check check (status in ('prepared', 'closed', 'open', 'empty', 'archived')),
  constraint inventory_rolls_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.inventory_roll_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  roll_id uuid references public.inventory_rolls(id) on delete set null,
  source_record_id text,
  event_type text not null default 'prepared',
  grams numeric not null default 0,
  status text not null default 'disabled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint inventory_roll_events_type_check check (event_type in ('prepared', 'open', 'consume', 'restock', 'adjust', 'close', 'archive')),
  constraint inventory_roll_events_status_check check (status in ('disabled', 'planned', 'applied', 'reverted', 'error')),
  constraint inventory_roll_events_grams_check check (grams >= 0),
  constraint inventory_roll_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.account_security_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  two_factor_enabled boolean not null default false,
  two_factor_channel text not null default 'disabled',
  google_login_enabled boolean not null default false,
  web_pin_enabled boolean not null default false,
  deletion_grace_days integer not null default 15,
  status text not null default 'disabled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_security_settings_channel_check check (two_factor_channel in ('disabled', 'email', 'totp', 'whatsapp')),
  constraint account_security_settings_grace_check check (deletion_grace_days = 15),
  constraint account_security_settings_status_check check (status in ('disabled', 'prepared', 'locked', 'error')),
  constraint account_security_settings_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint account_security_settings_disabled_guard check (
    status <> 'disabled'
    or (
      two_factor_enabled = false
      and google_login_enabled = false
      and web_pin_enabled = false
      and two_factor_channel = 'disabled'
    )
  )
);

create table if not exists public.account_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_label text,
  platform text,
  trusted boolean not null default false,
  status text not null default 'prepared',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_devices_unique unique (owner_id, device_id),
  constraint account_devices_device_length check (char_length(device_id) between 1 and 160),
  constraint account_devices_status_check check (status in ('prepared', 'active', 'revoked', 'blocked')),
  constraint account_devices_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.account_login_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  device_id text,
  event_type text not null default 'login',
  status text not null default 'recorded',
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint account_login_events_type_check check (event_type in ('login', 'logout', 'password_change', 'device_seen', 'security_check')),
  constraint account_login_events_status_check check (status in ('recorded', 'blocked', 'error', 'disabled')),
  constraint account_login_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  confirmation_email text,
  status text not null default 'prepared',
  requested_at timestamptz,
  scheduled_delete_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_deletion_requests_status_check check (status in ('prepared', 'requested', 'confirmed', 'cancelled', 'expired', 'completed')),
  constraint account_deletion_requests_schedule_check check (
    scheduled_delete_at is null
    or requested_at is null
    or scheduled_delete_at >= requested_at + interval '15 days'
  ),
  constraint account_deletion_requests_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_app_account_feature_flags_owner on public.app_account_feature_flags(owner_id, feature_key);
create index if not exists idx_inventory_rolls_owner_material on public.inventory_rolls(owner_id, material_id, status);
create index if not exists idx_inventory_rolls_inventory_record on public.inventory_rolls(owner_id, inventory_record_id);
create index if not exists idx_inventory_roll_events_owner_roll on public.inventory_roll_events(owner_id, roll_id, created_at desc);
create index if not exists idx_account_devices_owner_status on public.account_devices(owner_id, status);
create index if not exists idx_account_login_events_owner_created on public.account_login_events(owner_id, created_at desc);
create index if not exists idx_account_deletion_requests_owner_status on public.account_deletion_requests(owner_id, status, created_at desc);

drop trigger if exists app_account_feature_flags_set_updated_at on public.app_account_feature_flags;
create trigger app_account_feature_flags_set_updated_at
before update on public.app_account_feature_flags
for each row execute function public.set_updated_at();

drop trigger if exists inventory_rolls_set_updated_at on public.inventory_rolls;
create trigger inventory_rolls_set_updated_at
before update on public.inventory_rolls
for each row execute function public.set_updated_at();

drop trigger if exists account_security_settings_set_updated_at on public.account_security_settings;
create trigger account_security_settings_set_updated_at
before update on public.account_security_settings
for each row execute function public.set_updated_at();

drop trigger if exists account_devices_set_updated_at on public.account_devices;
create trigger account_devices_set_updated_at
before update on public.account_devices
for each row execute function public.set_updated_at();

drop trigger if exists account_deletion_requests_set_updated_at on public.account_deletion_requests;
create trigger account_deletion_requests_set_updated_at
before update on public.account_deletion_requests
for each row execute function public.set_updated_at();

alter table public.app_account_feature_flags enable row level security;
alter table public.inventory_rolls enable row level security;
alter table public.inventory_roll_events enable row level security;
alter table public.account_security_settings enable row level security;
alter table public.account_devices enable row level security;
alter table public.account_login_events enable row level security;
alter table public.account_deletion_requests enable row level security;

drop policy if exists "account feature flags select owner or superadmin" on public.app_account_feature_flags;
create policy "account feature flags select owner or superadmin"
on public.app_account_feature_flags for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "account feature flags superadmin manage" on public.app_account_feature_flags;
create policy "account feature flags superadmin manage"
on public.app_account_feature_flags for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "inventory rolls select owner or superadmin" on public.inventory_rolls;
create policy "inventory rolls select owner or superadmin"
on public.inventory_rolls for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "inventory rolls superadmin manage" on public.inventory_rolls;
create policy "inventory rolls superadmin manage"
on public.inventory_rolls for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "inventory roll events select owner or superadmin" on public.inventory_roll_events;
create policy "inventory roll events select owner or superadmin"
on public.inventory_roll_events for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "inventory roll events superadmin manage" on public.inventory_roll_events;
create policy "inventory roll events superadmin manage"
on public.inventory_roll_events for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "account security settings select owner or superadmin" on public.account_security_settings;
create policy "account security settings select owner or superadmin"
on public.account_security_settings for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "account security settings superadmin manage" on public.account_security_settings;
create policy "account security settings superadmin manage"
on public.account_security_settings for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "account devices select owner or superadmin" on public.account_devices;
create policy "account devices select owner or superadmin"
on public.account_devices for select
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "account devices superadmin manage" on public.account_devices;
create policy "account devices superadmin manage"
on public.account_devices for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "account login events select owner or superadmin" on public.account_login_events;
create policy "account login events select owner or superadmin"
on public.account_login_events for select
using (owner_id = auth.uid() or user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "account login events superadmin manage" on public.account_login_events;
create policy "account login events superadmin manage"
on public.account_login_events for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "account deletion requests select owner or superadmin" on public.account_deletion_requests;
create policy "account deletion requests select owner or superadmin"
on public.account_deletion_requests for select
using (owner_id = auth.uid() or requested_by = auth.uid() or public.erp_is_superadmin());

drop policy if exists "account deletion requests superadmin manage" on public.account_deletion_requests;
create policy "account deletion requests superadmin manage"
on public.account_deletion_requests for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

revoke all on public.app_account_feature_flags from public, anon, authenticated;
revoke all on public.inventory_rolls from public, anon, authenticated;
revoke all on public.inventory_roll_events from public, anon, authenticated;
revoke all on public.account_security_settings from public, anon, authenticated;
revoke all on public.account_devices from public, anon, authenticated;
revoke all on public.account_login_events from public, anon, authenticated;
revoke all on public.account_deletion_requests from public, anon, authenticated;

grant select on public.app_account_feature_flags to authenticated, service_role;
grant select on public.inventory_rolls, public.inventory_roll_events to authenticated, service_role;
grant select on public.account_security_settings, public.account_devices, public.account_login_events, public.account_deletion_requests to authenticated, service_role;

grant insert, update, delete on public.app_account_feature_flags to service_role;
grant insert, update, delete on public.inventory_rolls, public.inventory_roll_events to service_role;
grant insert, update, delete on public.account_security_settings, public.account_devices, public.account_login_events, public.account_deletion_requests to service_role;
