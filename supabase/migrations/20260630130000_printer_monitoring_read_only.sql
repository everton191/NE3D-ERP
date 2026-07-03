-- Simplifica 3D: printer monitoring foundation.
-- Automatic connectors are read-only. No remote-control command is exposed.

create extension if not exists pgcrypto;

create table if not exists public.printer_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.printer_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.printer_brands(id) on delete cascade,
  name text not null,
  slug text not null,
  printer_type text not null default 'fdm',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug),
  constraint printer_models_type_check check (printer_type in ('fdm', 'resin', 'cnc', 'laser', 'other'))
);

create table if not exists public.printer_connector_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  supports_monitoring boolean not null default false,
  supports_remote_control boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint printer_connector_key_check check (key in ('manual', 'octoprint', 'moonraker', 'prusalink', 'bambu', 'none')),
  constraint printer_connector_remote_control_disabled check (supports_remote_control is false)
);

create table if not exists public.printer_brand_connector_suggestions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.printer_brands(id) on delete cascade,
  connector_type_id uuid not null references public.printer_connector_types(id) on delete cascade,
  priority integer not null default 100,
  note text,
  created_at timestamptz not null default now(),
  unique (brand_id, connector_type_id)
);

create table if not exists public.printers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  name text not null,
  brand_id uuid references public.printer_brands(id) on delete set null,
  model_id uuid references public.printer_models(id) on delete set null,
  custom_brand text,
  custom_model text,
  printer_type text not null default 'fdm',
  status text not null default 'active',
  manual_status text not null default 'idle',
  location text,
  notes text,
  purchase_price numeric(12,2),
  purchase_date date,
  estimated_lifetime_months integer,
  power_watts numeric(10,2),
  hourly_cost numeric(12,2),
  monthly_maintenance_cost numeric(12,2),
  connector_type text not null default 'manual',
  connection_mode text not null default 'manual',
  host text,
  port integer,
  credential_ciphertext text,
  credential_hint text,
  connection_status text not null default 'not_configured',
  last_seen_at timestamptz,
  last_error text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint printers_type_check check (printer_type in ('fdm', 'resin', 'cnc', 'laser', 'other')),
  constraint printers_status_check check (status in ('active', 'maintenance', 'disabled')),
  constraint printers_manual_status_check check (manual_status in ('idle', 'printing', 'paused', 'finished', 'error', 'offline', 'unknown', 'maintenance')),
  constraint printers_connector_check check (connector_type in ('manual', 'octoprint', 'moonraker', 'prusalink', 'bambu', 'none')),
  constraint printers_connection_mode_check check (connection_mode in ('manual', 'browser_local', 'local_agent', 'cloud_supported')),
  constraint printers_connection_status_check check (connection_status in ('not_configured', 'connected', 'offline', 'unauthorized', 'timeout', 'error', 'unsupported')),
  constraint printers_port_check check (port is null or port between 1 and 65535),
  constraint printers_nonnegative_costs_check check (
    coalesce(purchase_price, 0) >= 0
    and coalesce(power_watts, 0) >= 0
    and coalesce(hourly_cost, 0) >= 0
    and coalesce(monthly_maintenance_cost, 0) >= 0
    and coalesce(estimated_lifetime_months, 0) >= 0
  )
);

create table if not exists public.printer_status_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  printer_id uuid not null references public.printers(id) on delete cascade,
  connector_type text,
  connection_mode text,
  state text,
  normalized_state text not null default 'unknown',
  progress_percent numeric(5,2),
  nozzle_temp numeric(8,2),
  nozzle_target_temp numeric(8,2),
  bed_temp numeric(8,2),
  bed_target_temp numeric(8,2),
  current_file text,
  elapsed_seconds integer,
  remaining_seconds integer,
  error_message text,
  raw_payload jsonb,
  source text not null default 'connector',
  created_at timestamptz not null default now(),
  constraint printer_snapshot_state_check check (normalized_state in ('idle', 'printing', 'paused', 'finished', 'error', 'offline', 'unknown', 'maintenance')),
  constraint printer_snapshot_progress_check check (progress_percent is null or progress_percent between 0 and 100),
  constraint printer_snapshot_source_check check (source in ('manual', 'connector', 'local_agent'))
);

create table if not exists public.printer_order_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  printer_id uuid not null references public.printers(id) on delete restrict,
  order_id text not null,
  production_id text,
  status text not null default 'linked',
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (printer_id, order_id),
  constraint printer_order_status_check check (status in ('linked', 'printing', 'finished', 'cancelled', 'unlinked'))
);

create table if not exists public.printer_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  printer_id uuid not null references public.printers(id) on delete cascade,
  event_type text not null,
  message text,
  order_id text,
  production_id text,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint printer_event_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.local_agents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  pairing_code_hash text,
  agent_token_hash text,
  status text not null default 'pending',
  last_seen_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_agents_status_check check (status in ('pending', 'active', 'offline', 'revoked'))
);

create table if not exists public.local_agent_printers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  agent_id uuid not null references public.local_agents(id) on delete cascade,
  printer_id uuid not null references public.printers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agent_id, printer_id)
);

create index if not exists printers_company_active_idx on public.printers(company_id, active, updated_at desc);
create index if not exists printer_snapshots_printer_created_idx on public.printer_status_snapshots(printer_id, created_at desc);
create index if not exists printer_order_links_order_idx on public.printer_order_links(company_id, order_id, status);
create index if not exists printer_events_printer_created_idx on public.printer_events(printer_id, created_at desc);
create index if not exists local_agents_company_status_idx on public.local_agents(company_id, status);
create unique index if not exists local_agents_token_hash_unique_idx on public.local_agents(agent_token_hash) where agent_token_hash is not null;

drop trigger if exists printer_brands_set_updated_at on public.printer_brands;
create trigger printer_brands_set_updated_at before update on public.printer_brands
for each row execute function public.set_updated_at();
drop trigger if exists printer_models_set_updated_at on public.printer_models;
create trigger printer_models_set_updated_at before update on public.printer_models
for each row execute function public.set_updated_at();
drop trigger if exists printer_connector_types_set_updated_at on public.printer_connector_types;
create trigger printer_connector_types_set_updated_at before update on public.printer_connector_types
for each row execute function public.set_updated_at();
drop trigger if exists printers_set_updated_at on public.printers;
create trigger printers_set_updated_at before update on public.printers
for each row execute function public.set_updated_at();
drop trigger if exists printer_order_links_set_updated_at on public.printer_order_links;
create trigger printer_order_links_set_updated_at before update on public.printer_order_links
for each row execute function public.set_updated_at();
drop trigger if exists local_agents_set_updated_at on public.local_agents;
create trigger local_agents_set_updated_at before update on public.local_agents
for each row execute function public.set_updated_at();

alter table public.printer_brands enable row level security;
alter table public.printer_models enable row level security;
alter table public.printer_connector_types enable row level security;
alter table public.printer_brand_connector_suggestions enable row level security;
alter table public.printers enable row level security;
alter table public.printer_status_snapshots enable row level security;
alter table public.printer_order_links enable row level security;
alter table public.printer_events enable row level security;
alter table public.local_agents enable row level security;
alter table public.local_agent_printers enable row level security;

drop policy if exists "authenticated read printer brands" on public.printer_brands;
create policy "authenticated read printer brands" on public.printer_brands for select to authenticated
using (auth.uid() is not null or public.erp_is_superadmin());
drop policy if exists "authenticated read printer models" on public.printer_models;
create policy "authenticated read printer models" on public.printer_models for select to authenticated
using (auth.uid() is not null or public.erp_is_superadmin());
drop policy if exists "authenticated read printer connectors" on public.printer_connector_types;
create policy "authenticated read printer connectors" on public.printer_connector_types for select to authenticated
using (auth.uid() is not null or public.erp_is_superadmin());
drop policy if exists "authenticated read printer suggestions" on public.printer_brand_connector_suggestions;
create policy "authenticated read printer suggestions" on public.printer_brand_connector_suggestions for select to authenticated
using (auth.uid() is not null or public.erp_is_superadmin());

drop policy if exists "company members read printers" on public.printers;
create policy "company members read printers" on public.printers for select to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));
drop policy if exists "company members read printer snapshots" on public.printer_status_snapshots;
create policy "company members read printer snapshots" on public.printer_status_snapshots for select to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));
drop policy if exists "company members read printer order links" on public.printer_order_links;
create policy "company members read printer order links" on public.printer_order_links for select to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));
drop policy if exists "company members read printer events" on public.printer_events;
create policy "company members read printer events" on public.printer_events for select to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));
drop policy if exists "company admins read local agents" on public.local_agents;
create policy "company admins read local agents" on public.local_agents for select to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_admin(company_id));
drop policy if exists "company admins read local agent printers" on public.local_agent_printers;
create policy "company admins read local agent printers" on public.local_agent_printers for select to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_admin(company_id));

revoke all on public.printer_brands, public.printer_models, public.printer_connector_types, public.printer_brand_connector_suggestions from public, anon, authenticated;
revoke all on public.printers, public.printer_status_snapshots, public.printer_order_links, public.printer_events, public.local_agents, public.local_agent_printers from public, anon, authenticated;
grant select on public.printer_brands, public.printer_models, public.printer_connector_types, public.printer_brand_connector_suggestions to authenticated, service_role;
grant select on public.printers, public.printer_status_snapshots, public.printer_order_links, public.printer_events, public.local_agents, public.local_agent_printers to authenticated, service_role;
grant insert, update, delete on public.printer_brands, public.printer_models, public.printer_connector_types, public.printer_brand_connector_suggestions to service_role;
grant insert, update, delete on public.printers, public.printer_status_snapshots, public.printer_order_links, public.printer_events, public.local_agents, public.local_agent_printers to service_role;

insert into public.printer_connector_types (key, name, description, supports_monitoring, supports_remote_control)
values
  ('manual', 'Manual', 'Status atualizado por um usuário autorizado.', false, false),
  ('octoprint', 'OctoPrint', 'Leitura de estado, trabalho e temperaturas pelo OctoPrint.', true, false),
  ('moonraker', 'Klipper / Moonraker', 'Leitura de objetos de status do Moonraker.', true, false),
  ('prusalink', 'PrusaLink', 'Leitura de status e trabalho pelo PrusaLink.', true, false),
  ('bambu', 'Bambu Lab', 'Leitura por método compatível e autorizado.', true, false),
  ('none', 'Sem conector', 'Cadastro de ativo sem monitoramento.', false, false)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    supports_monitoring = excluded.supports_monitoring,
    supports_remote_control = false,
    is_active = true,
    updated_at = now();

insert into public.printer_brands (name, slug)
values
  ('Creality', 'creality'),
  ('Bambu Lab', 'bambu-lab'),
  ('Prusa', 'prusa'),
  ('Voron', 'voron'),
  ('Anycubic', 'anycubic'),
  ('Elegoo', 'elegoo'),
  ('Outra', 'outra')
on conflict (slug) do update set name = excluded.name, is_active = true, updated_at = now();

insert into public.printer_models (brand_id, name, slug, printer_type)
select b.id, v.name, v.slug, v.printer_type
from (
  values
    ('creality', 'Ender 3', 'ender-3', 'fdm'),
    ('creality', 'Ender 3 S1', 'ender-3-s1', 'fdm'),
    ('creality', 'K1', 'k1', 'fdm'),
    ('bambu-lab', 'A1', 'a1', 'fdm'),
    ('bambu-lab', 'P1P', 'p1p', 'fdm'),
    ('bambu-lab', 'X1 Carbon', 'x1-carbon', 'fdm'),
    ('prusa', 'MK4', 'mk4', 'fdm'),
    ('prusa', 'MK3S+', 'mk3s-plus', 'fdm'),
    ('voron', '2.4', '2-4', 'fdm'),
    ('anycubic', 'Photon', 'photon', 'resin'),
    ('elegoo', 'Mars', 'mars', 'resin')
) as v(brand_slug, name, slug, printer_type)
join public.printer_brands b on b.slug = v.brand_slug
on conflict (brand_id, slug) do update
set name = excluded.name, printer_type = excluded.printer_type, is_active = true, updated_at = now();

insert into public.printer_brand_connector_suggestions (brand_id, connector_type_id, priority, note)
select b.id, c.id, v.priority, v.note
from (
  values
    ('creality', 'manual', 10, 'Compatível com qualquer configuração'),
    ('creality', 'octoprint', 20, 'Use quando a impressora estiver ligada ao OctoPrint'),
    ('creality', 'moonraker', 30, 'Use em instalações Klipper'),
    ('bambu-lab', 'manual', 10, 'Sempre disponível'),
    ('bambu-lab', 'bambu', 20, 'Somente método autorizado'),
    ('prusa', 'manual', 10, 'Sempre disponível'),
    ('prusa', 'prusalink', 20, 'Preferencial em modelos compatíveis'),
    ('prusa', 'octoprint', 30, 'Alternativa quando configurado'),
    ('voron', 'manual', 10, 'Sempre disponível'),
    ('voron', 'moonraker', 20, 'Preferencial para Klipper'),
    ('outra', 'manual', 10, 'Sempre disponível'),
    ('outra', 'octoprint', 20, 'Quando houver OctoPrint'),
    ('outra', 'moonraker', 30, 'Quando houver Klipper')
) as v(brand_slug, connector_key, priority, note)
join public.printer_brands b on b.slug = v.brand_slug
join public.printer_connector_types c on c.key = v.connector_key
on conflict (brand_id, connector_type_id) do update
set priority = excluded.priority, note = excluded.note;

insert into public.app_feature_access_rules (
  feature_key, visible_name, required_plan, partial_plan, allowed_modes, allowed_roles,
  requires_active_plan, requires_strong_confirmation, future_only, metadata
)
values
  ('printer_registry', 'Cadastro de impressoras', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','production','sales','viewer'], false, false, false, '{"freeLimit":1,"startLimit":3,"automaticPlan":"pro"}'::jsonb),
  ('printer_monitoring', 'Monitoramento de impressoras', 'pro', null, array['simplifica','profissional'], array['owner','admin','manager','production','sales','viewer'], true, false, false, '{"readOnly":true}'::jsonb),
  ('printer_remote_control', 'Controle remoto de impressoras', 'pro', null, array['profissional'], array['owner','admin'], true, true, true, '{"enabled":false,"reason":"not_in_this_phase"}'::jsonb)
on conflict (feature_key) do update
set visible_name = excluded.visible_name,
    required_plan = excluded.required_plan,
    partial_plan = excluded.partial_plan,
    allowed_modes = excluded.allowed_modes,
    allowed_roles = excluded.allowed_roles,
    requires_active_plan = excluded.requires_active_plan,
    requires_strong_confirmation = excluded.requires_strong_confirmation,
    future_only = excluded.future_only,
    metadata = excluded.metadata,
    updated_at = now();
