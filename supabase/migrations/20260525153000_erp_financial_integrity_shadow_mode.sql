-- ERP financial integrity checks, reversal metadata and shadow-mode tracking.
-- No fiscal/TEF activation; this prepares observability and safe rollback paths.

create table if not exists public.financial_integrity_checks (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  check_type text not null,
  severity text not null default 'info',
  status text not null default 'open',
  entity_type text,
  entity_id text,
  session_id uuid references public.cash_sessions(id) on delete set null,
  operation_id uuid references public.erp_financial_operations(id) on delete set null,
  detected_by text not null default 'database',
  details_json jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_integrity_checks_severity_check check (severity in ('info', 'warning', 'critical')),
  constraint financial_integrity_checks_status_check check (status in ('open', 'acknowledged', 'resolved', 'ignored')),
  constraint financial_integrity_checks_details_object check (jsonb_typeof(details_json) = 'object')
);

create index if not exists financial_integrity_checks_empresa_status_idx
  on public.financial_integrity_checks (empresa_id, status, created_at desc);
create index if not exists financial_integrity_checks_type_severity_idx
  on public.financial_integrity_checks (empresa_id, check_type, severity, created_at desc);
create index if not exists financial_integrity_checks_entity_idx
  on public.financial_integrity_checks (empresa_id, entity_type, entity_id, created_at desc)
  where entity_id is not null;

alter table public.cash_movements
  add column if not exists cancelled_at timestamptz,
  add column if not exists reversed_by uuid references auth.users(id) on delete set null,
  add column if not exists reversal_operation_id uuid references public.erp_financial_operations(id) on delete set null,
  add column if not exists reversal_reason text,
  add column if not exists financial_flow_version text not null default 'legacy',
  add column if not exists operation_source text not null default 'legacy',
  add column if not exists sync_version integer not null default 1,
  add column if not exists app_version text,
  add column if not exists pwa_version text,
  add column if not exists sync_source text,
  add column if not exists offline_created_at timestamptz,
  add column if not exists synced_at timestamptz,
  add column if not exists device_platform text;

alter table public.sale_payments
  add column if not exists cancelled_at timestamptz,
  add column if not exists reversed_by uuid references auth.users(id) on delete set null,
  add column if not exists reversal_operation_id uuid references public.erp_financial_operations(id) on delete set null,
  add column if not exists reversal_reason text,
  add column if not exists financial_flow_version text not null default 'legacy',
  add column if not exists operation_source text not null default 'legacy',
  add column if not exists sync_version integer not null default 1,
  add column if not exists app_version text,
  add column if not exists pwa_version text,
  add column if not exists sync_source text,
  add column if not exists offline_created_at timestamptz,
  add column if not exists synced_at timestamptz,
  add column if not exists device_platform text;

alter table public.erp_financial_operations
  add column if not exists financial_flow_version text not null default 'legacy',
  add column if not exists operation_source text not null default 'legacy',
  add column if not exists sync_version integer not null default 1,
  add column if not exists app_version text,
  add column if not exists pwa_version text,
  add column if not exists sync_source text,
  add column if not exists offline_created_at timestamptz,
  add column if not exists synced_at timestamptz,
  add column if not exists device_platform text,
  add column if not exists shadow_validation_json jsonb not null default '{}'::jsonb,
  add column if not exists rollback_operation_id uuid references public.erp_financial_operations(id) on delete set null;

alter table public.erp_records
  add column if not exists financial_flow_version text,
  add column if not exists operation_source text,
  add column if not exists sync_version integer,
  add column if not exists app_version text,
  add column if not exists pwa_version text,
  add column if not exists sync_source text,
  add column if not exists offline_created_at timestamptz,
  add column if not exists synced_at timestamptz,
  add column if not exists device_platform text,
  add column if not exists shadow_validation_json jsonb not null default '{}'::jsonb;

create index if not exists cash_movements_reversal_idx
  on public.cash_movements (empresa_id, cancelled_at, reversal_operation_id)
  where cancelled_at is not null;
create index if not exists sale_payments_reversal_idx
  on public.sale_payments (empresa_id, cancelled_at, reversal_operation_id)
  where cancelled_at is not null;
create index if not exists erp_financial_operations_flow_idx
  on public.erp_financial_operations (empresa_id, financial_flow_version, operation_source, created_at desc);
create index if not exists erp_records_financial_flow_idx
  on public.erp_records (collection, financial_flow_version, updated_at desc)
  where financial_flow_version is not null;

drop trigger if exists set_financial_integrity_checks_updated_at on public.financial_integrity_checks;
create trigger set_financial_integrity_checks_updated_at
before update on public.financial_integrity_checks
for each row execute function public.set_updated_at();

alter table public.financial_integrity_checks enable row level security;

drop policy if exists "company members read financial integrity checks" on public.financial_integrity_checks;
create policy "company members read financial integrity checks"
on public.financial_integrity_checks for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members insert financial integrity checks" on public.financial_integrity_checks;
create policy "company members insert financial integrity checks"
on public.financial_integrity_checks for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members update financial integrity checks" on public.financial_integrity_checks;
create policy "company members update financial integrity checks"
on public.financial_integrity_checks for update
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

create or replace function public.record_financial_integrity_check(
  p_empresa_id uuid,
  p_check_type text,
  p_severity text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_session_id uuid default null,
  p_operation_id uuid default null,
  p_details_json jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_id uuid;
begin
  if p_empresa_id is null or nullif(p_check_type, '') is null then
    raise exception 'empresa_id and check_type are required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  insert into public.financial_integrity_checks (
    empresa_id,
    check_type,
    severity,
    entity_type,
    entity_id,
    session_id,
    operation_id,
    details_json
  )
  values (
    p_empresa_id,
    p_check_type,
    coalesce(nullif(p_severity, ''), 'info'),
    p_entity_type,
    p_entity_id,
    p_session_id,
    p_operation_id,
    coalesce(p_details_json, '{}'::jsonb)
  )
  returning id into v_check_id;

  return v_check_id;
end;
$$;

create or replace function public.run_financial_integrity_checks(p_empresa_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_last_count integer := 0;
begin
  if p_empresa_id is null then
    raise exception 'empresa_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  insert into public.financial_integrity_checks (
    empresa_id,
    check_type,
    severity,
    entity_type,
    entity_id,
    session_id,
    details_json
  )
  select
    p_empresa_id,
    'payment_without_movement',
    'warning',
    'sale_payment',
    sp.id::text,
    sp.session_id,
    jsonb_build_object('sale_id', sp.sale_id, 'amount', sp.amount, 'operation_uuid', sp.operation_uuid)
  from public.sale_payments sp
  where sp.empresa_id = p_empresa_id
    and sp.payment_status = 'approved'
    and sp.cancelled_at is null
    and not exists (
      select 1
      from public.cash_movements cm
      where cm.empresa_id = sp.empresa_id
        and cm.session_id is not distinct from sp.session_id
        and cm.reference_collection = 'pedidos'
        and cm.reference_id = sp.sale_id
        and cm.amount = sp.amount
        and cm.cancelled_at is null
    );
  get diagnostics v_last_count = row_count;
  v_count := v_count + v_last_count;

  insert into public.financial_integrity_checks (
    empresa_id,
    check_type,
    severity,
    entity_type,
    entity_id,
    session_id,
    details_json
  )
  select
    p_empresa_id,
    'movement_without_session',
    'critical',
    'cash_movement',
    cm.id::text,
    cm.session_id,
    jsonb_build_object('amount', cm.amount, 'type', cm.type)
  from public.cash_movements cm
  left join public.cash_sessions cs on cs.id = cm.session_id
  where cm.empresa_id = p_empresa_id
    and cs.id is null;
  get diagnostics v_last_count = row_count;
  v_count := v_count + v_last_count;

  insert into public.financial_integrity_checks (
    empresa_id,
    check_type,
    severity,
    entity_type,
    entity_id,
    session_id,
    details_json
  )
  select
    p_empresa_id,
    'orphan_open_session',
    'warning',
    'cash_session',
    cs.id::text,
    cs.id,
    jsonb_build_object('opened_at', cs.opened_at, 'usuario_id', cs.usuario_id)
  from public.cash_sessions cs
  where cs.empresa_id = p_empresa_id
    and cs.status = 'open'
    and cs.opened_at < now() - interval '36 hours';
  get diagnostics v_last_count = row_count;
  v_count := v_count + v_last_count;

  insert into public.financial_integrity_checks (
    empresa_id,
    check_type,
    severity,
    entity_type,
    entity_id,
    session_id,
    operation_id,
    details_json
  )
  select
    p_empresa_id,
    'partial_operation',
    'critical',
    'financial_operation',
    op.id::text,
    op.session_id,
    op.id,
    jsonb_build_object('status', op.status, 'operation_uuid', op.operation_uuid, 'created_at', op.created_at)
  from public.erp_financial_operations op
  where op.empresa_id = p_empresa_id
    and op.status = 'processing'
    and op.created_at < now() - interval '15 minutes';
  get diagnostics v_last_count = row_count;
  v_count := v_count + v_last_count;

  return jsonb_build_object('ok', true, 'inserted_checks', v_count);
end;
$$;

create or replace function public.validate_financial_operation_tracking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.operation_uuid is not null and coalesce(new.financial_flow_version, '') = 'legacy' then
    new.financial_flow_version := 'shadow-v1';
  end if;
  if new.operation_uuid is not null and coalesce(new.operation_source, '') = 'legacy' then
    new.operation_source := 'pwa';
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_cash_movements_financial_tracking on public.cash_movements;
create trigger normalize_cash_movements_financial_tracking
before insert or update on public.cash_movements
for each row execute function public.validate_financial_operation_tracking();

drop trigger if exists normalize_sale_payments_financial_tracking on public.sale_payments;
create trigger normalize_sale_payments_financial_tracking
before insert or update on public.sale_payments
for each row execute function public.validate_financial_operation_tracking();

grant select, insert, update on public.financial_integrity_checks to authenticated;
grant execute on function public.record_financial_integrity_check(uuid, text, text, text, text, uuid, uuid, jsonb) to authenticated;
grant execute on function public.run_financial_integrity_checks(uuid) to authenticated;

comment on table public.financial_integrity_checks is 'Preventive financial integrity findings for payments, movements, sessions and idempotent operations.';
comment on function public.run_financial_integrity_checks(uuid) is 'Detects common financial inconsistencies without changing existing UX.';
comment on column public.erp_records.shadow_validation_json is 'Silent dual-validation metadata comparing legacy and atomic financial flows.';
