-- Simplifica 3D: manual production queue.
-- No printer command, connector, file upload or remote-control capability is exposed.

create extension if not exists pgcrypto;

create table if not exists public.production_printers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  printer_type text not null default 'fdm',
  nozzle_size text,
  bed_size_x numeric(10,2),
  bed_size_y numeric(10,2),
  bed_size_z numeric(10,2),
  supported_materials text[] not null default '{}',
  status text not null default 'disponivel',
  is_active boolean not null default true,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_printers_type_check check (printer_type in ('fdm', 'resina', 'outro')),
  constraint production_printers_status_check check (status in ('disponivel', 'ocupada', 'manutencao', 'pausada', 'inativa'))
);

create table if not exists public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id text not null,
  item_index integer not null default 0,
  item_name text not null,
  quantity numeric(12,3) not null default 1,
  production_code text not null,
  status text not null default 'novo_pedido',
  printer_id uuid references public.production_printers(id) on delete set null,
  parent_job_id uuid references public.production_jobs(id) on delete set null,
  material text,
  color text,
  filament_weight_grams numeric(12,3),
  estimated_print_time_minutes integer,
  actual_print_time_minutes integer,
  priority text not null default 'normal',
  priority_reason text,
  blocked_reason text,
  queue_position integer,
  due_date date,
  production_notes text,
  released_at timestamptz,
  assigned_at timestamptz,
  started_at timestamptz,
  paused_at timestamptz,
  finished_at timestamptz,
  failed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_jobs_code_company_unique unique (company_id, production_code),
  constraint production_jobs_status_check check (status in (
    'novo_pedido', 'em_analise', 'pendente', 'liberado_para_producao',
    'na_fila', 'proximo', 'aguardando_impressora', 'em_impressao',
    'pausado', 'falhou', 'reimpressao_necessaria', 'pos_processamento',
    'controle_qualidade', 'pronto_para_entrega', 'entregue', 'cancelado'
  )),
  constraint production_jobs_priority_check check (priority in ('normal', 'alta', 'urgente')),
  constraint production_jobs_priority_reason_check check (priority = 'normal' or nullif(trim(priority_reason), '') is not null),
  constraint production_jobs_quantity_check check (quantity > 0),
  constraint production_jobs_queue_position_check check (queue_position is null or queue_position > 0),
  constraint production_jobs_printing_printer_check check (status <> 'em_impressao' or printer_id is not null)
);

create table if not exists public.production_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  production_job_id uuid not null references public.production_jobs(id) on delete cascade,
  order_id text,
  event_type text not null,
  old_status text,
  new_status text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists production_printers_company_status_idx
  on public.production_printers(company_id, is_active, status, updated_at desc);
create index if not exists production_jobs_company_queue_idx
  on public.production_jobs(company_id, status, queue_position, due_date, released_at);
create index if not exists production_jobs_order_idx
  on public.production_jobs(company_id, order_id, item_index);
create index if not exists production_events_job_created_idx
  on public.production_events(production_job_id, created_at desc);

drop trigger if exists production_printers_set_updated_at on public.production_printers;
create trigger production_printers_set_updated_at before update on public.production_printers
for each row execute function public.set_updated_at();

drop trigger if exists production_jobs_set_updated_at on public.production_jobs;
create trigger production_jobs_set_updated_at before update on public.production_jobs
for each row execute function public.set_updated_at();

alter table public.production_printers enable row level security;
alter table public.production_jobs enable row level security;
alter table public.production_events enable row level security;

drop policy if exists "company members manage production printers" on public.production_printers;
create policy "company members manage production printers" on public.production_printers
for all to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members manage production jobs" on public.production_jobs;
create policy "company members manage production jobs" on public.production_jobs
for all to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members manage production events" on public.production_events;
create policy "company members manage production events" on public.production_events
for all to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

comment on table public.production_printers is 'Manual production resources only; no remote printer control.';
comment on table public.production_jobs is 'Per-order-item manual production queue.';
comment on table public.production_events is 'Immutable operational history for manual production jobs.';
