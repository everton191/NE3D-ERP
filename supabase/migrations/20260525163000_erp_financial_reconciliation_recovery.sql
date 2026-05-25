-- ERP operational reconciliation and recovery foundation.
-- Invisible to users; prepares safe retry/recovery for PWA/offline and future fiscal/financial expansion.

alter table public.erp_financial_operations
  drop constraint if exists erp_financial_operations_status_check;
alter table public.erp_financial_operations
  add constraint erp_financial_operations_status_check check (
    status in ('pending', 'processing', 'completed', 'partially_completed', 'failed', 'reversed', 'abandoned', 'cancelled')
  );

alter table public.erp_financial_operations
  add column if not exists sync_attempts integer not null default 0,
  add column if not exists last_sync_error text,
  add column if not exists recovery_source text,
  add column if not exists recovered_at timestamptz,
  add column if not exists reconciliation_version text not null default 'reconciliation-v1',
  add column if not exists processing_node text,
  add column if not exists abandoned_at timestamptz,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_retry_at timestamptz;

alter table public.cash_movements
  add column if not exists sync_attempts integer not null default 0,
  add column if not exists last_sync_error text,
  add column if not exists recovery_source text,
  add column if not exists recovered_at timestamptz,
  add column if not exists reconciliation_version text,
  add column if not exists processing_node text;

alter table public.sale_payments
  add column if not exists sync_attempts integer not null default 0,
  add column if not exists last_sync_error text,
  add column if not exists recovery_source text,
  add column if not exists recovered_at timestamptz,
  add column if not exists reconciliation_version text,
  add column if not exists processing_node text;

alter table public.erp_records
  add column if not exists sync_attempts integer,
  add column if not exists last_sync_error text,
  add column if not exists recovery_source text,
  add column if not exists recovered_at timestamptz,
  add column if not exists reconciliation_version text,
  add column if not exists processing_node text;

create table if not exists public.operation_reconciliation_queue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  operation_id uuid references public.erp_financial_operations(id) on delete set null,
  operation_uuid uuid,
  operation_type text not null default 'financial_operation',
  status text not null default 'queued',
  retry_count integer not null default 0,
  max_retries integer not null default 5,
  last_retry_at timestamptz,
  next_retry_at timestamptz not null default now(),
  reconciliation_reason text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  last_error text,
  locked_at timestamptz,
  locked_by text,
  recovered_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operation_reconciliation_status_check check (
    status in ('queued', 'retrying', 'recovered', 'failed', 'ignored', 'abandoned')
  ),
  constraint operation_reconciliation_retry_check check (retry_count >= 0 and max_retries >= 0),
  constraint operation_reconciliation_payload_object check (jsonb_typeof(payload_snapshot) = 'object')
);

create index if not exists operation_reconciliation_company_status_idx
  on public.operation_reconciliation_queue (company_id, status, next_retry_at, created_at desc);
create index if not exists operation_reconciliation_operation_uuid_idx
  on public.operation_reconciliation_queue (company_id, operation_uuid, created_at desc)
  where operation_uuid is not null;
create index if not exists operation_reconciliation_operation_id_idx
  on public.operation_reconciliation_queue (operation_id)
  where operation_id is not null;
create index if not exists erp_financial_operations_recovery_idx
  on public.erp_financial_operations (empresa_id, status, next_retry_at, created_at desc);
create index if not exists erp_financial_operations_reconciliation_idx
  on public.erp_financial_operations (empresa_id, reconciliation_version, sync_attempts, updated_at desc);

drop trigger if exists set_operation_reconciliation_queue_updated_at on public.operation_reconciliation_queue;
create trigger set_operation_reconciliation_queue_updated_at
before update on public.operation_reconciliation_queue
for each row execute function public.set_updated_at();

alter table public.operation_reconciliation_queue enable row level security;

drop policy if exists "company members read operation reconciliation queue" on public.operation_reconciliation_queue;
create policy "company members read operation reconciliation queue"
on public.operation_reconciliation_queue for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members insert operation reconciliation queue" on public.operation_reconciliation_queue;
create policy "company members insert operation reconciliation queue"
on public.operation_reconciliation_queue for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members update operation reconciliation queue" on public.operation_reconciliation_queue;
create policy "company members update operation reconciliation queue"
on public.operation_reconciliation_queue for update
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

create or replace function public.enqueue_operation_reconciliation(
  p_company_id uuid,
  p_operation_id uuid default null,
  p_operation_uuid uuid default null,
  p_operation_type text default 'financial_operation',
  p_reason text default 'manual_check',
  p_payload_snapshot jsonb default '{}'::jsonb,
  p_next_retry_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue_id uuid;
begin
  if p_company_id is null then
    raise exception 'company_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_company_id)) then
    raise exception 'not allowed for this company';
  end if;

  insert into public.operation_reconciliation_queue (
    company_id,
    operation_id,
    operation_uuid,
    operation_type,
    reconciliation_reason,
    payload_snapshot,
    next_retry_at
  )
  values (
    p_company_id,
    p_operation_id,
    p_operation_uuid,
    coalesce(nullif(p_operation_type, ''), 'financial_operation'),
    coalesce(nullif(p_reason, ''), 'manual_check'),
    coalesce(p_payload_snapshot, '{}'::jsonb),
    coalesce(p_next_retry_at, now())
  )
  returning id into v_queue_id;

  return v_queue_id;
end;
$$;

create or replace function public.mark_abandoned_financial_operations(
  p_company_id uuid,
  p_timeout interval default interval '30 minutes'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if p_company_id is null then
    raise exception 'company_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_company_id)) then
    raise exception 'not allowed for this company';
  end if;

  update public.erp_financial_operations op
  set status = 'abandoned',
      abandoned_at = now(),
      last_sync_error = coalesce(last_sync_error, 'Operation exceeded processing timeout'),
      next_retry_at = coalesce(next_retry_at, now()),
      updated_at = now()
  where op.empresa_id = p_company_id
    and op.status in ('pending', 'processing')
    and op.created_at < now() - coalesce(p_timeout, interval '30 minutes');

  get diagnostics v_count = row_count;

  insert into public.operation_reconciliation_queue (
    company_id,
    operation_id,
    operation_uuid,
    operation_type,
    status,
    reconciliation_reason,
    payload_snapshot,
    next_retry_at
  )
  select
    op.empresa_id,
    op.id,
    op.operation_uuid,
    op.operation_type,
    'queued',
    'operation_abandoned_timeout',
    jsonb_build_object(
      'status', op.status,
      'sale_id', op.sale_id,
      'session_id', op.session_id,
      'sync_attempts', op.sync_attempts,
      'created_at', op.created_at
    ),
    now()
  from public.erp_financial_operations op
  where op.empresa_id = p_company_id
    and op.status = 'abandoned'
    and op.abandoned_at >= now() - interval '1 minute'
    and not exists (
      select 1
      from public.operation_reconciliation_queue q
      where q.company_id = op.empresa_id
        and q.operation_id = op.id
        and q.reconciliation_reason = 'operation_abandoned_timeout'
        and q.status in ('queued', 'retrying', 'recovered')
    );

  return jsonb_build_object('ok', true, 'abandoned_operations', v_count);
end;
$$;

create or replace function public.run_operation_reconciliation(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_marked jsonb;
  v_checks jsonb;
  v_enqueued integer := 0;
begin
  if p_company_id is null then
    raise exception 'company_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_company_id)) then
    raise exception 'not allowed for this company';
  end if;

  v_marked := public.mark_abandoned_financial_operations(p_company_id);
  v_checks := public.run_financial_integrity_checks(p_company_id);

  insert into public.operation_reconciliation_queue (
    company_id,
    operation_id,
    operation_uuid,
    operation_type,
    status,
    reconciliation_reason,
    payload_snapshot,
    next_retry_at
  )
  select
    fic.empresa_id,
    fic.operation_id,
    op.operation_uuid,
    coalesce(op.operation_type, fic.entity_type, 'integrity_check'),
    'queued',
    fic.check_type,
    jsonb_build_object(
      'integrity_check_id', fic.id,
      'severity', fic.severity,
      'entity_type', fic.entity_type,
      'entity_id', fic.entity_id,
      'details', fic.details_json
    ),
    now()
  from public.financial_integrity_checks fic
  left join public.erp_financial_operations op on op.id = fic.operation_id
  where fic.empresa_id = p_company_id
    and fic.status = 'open'
    and fic.created_at >= now() - interval '5 minutes'
    and fic.severity in ('warning', 'critical')
    and not exists (
      select 1
      from public.operation_reconciliation_queue q
      where q.company_id = fic.empresa_id
        and q.reconciliation_reason = fic.check_type
        and q.payload_snapshot ->> 'integrity_check_id' = fic.id::text
    );

  get diagnostics v_enqueued = row_count;

  return jsonb_build_object(
    'ok', true,
    'abandoned', v_marked,
    'integrity_checks', v_checks,
    'queued_from_checks', v_enqueued
  );
end;
$$;

create or replace function public.validate_reconciliation_tracking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sync_attempts < 0 then
    new.sync_attempts := 0;
  end if;
  if nullif(new.reconciliation_version, '') is null then
    new.reconciliation_version := 'reconciliation-v1';
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_erp_financial_operations_reconciliation_tracking on public.erp_financial_operations;
create trigger normalize_erp_financial_operations_reconciliation_tracking
before insert or update on public.erp_financial_operations
for each row execute function public.validate_reconciliation_tracking();

grant select, insert, update on public.operation_reconciliation_queue to authenticated;
grant execute on function public.enqueue_operation_reconciliation(uuid, uuid, uuid, text, text, jsonb, timestamptz) to authenticated;
grant execute on function public.mark_abandoned_financial_operations(uuid, interval) to authenticated;
grant execute on function public.run_operation_reconciliation(uuid) to authenticated;

comment on table public.operation_reconciliation_queue is 'Operational queue for safe financial reconciliation, retries and recovery without changing current UX.';
comment on function public.run_operation_reconciliation(uuid) is 'Runs lightweight reconciliation checks and queues recovery work for future service processing.';
comment on column public.erp_financial_operations.reconciliation_version is 'Version marker for gradual operational reconciliation rollout.';
