-- ERP financial worker orchestration foundation.
-- Adds safe distributed processing primitives without activating visible automation.

alter table public.operation_reconciliation_queue
  add column if not exists processing_started_at timestamptz,
  add column if not exists processing_timeout_at timestamptz,
  add column if not exists last_worker_heartbeat timestamptz,
  add column if not exists max_retry_limit integer not null default 5,
  add column if not exists worker_version text,
  add column if not exists worker_node text,
  add column if not exists processing_priority integer not null default 0,
  add column if not exists retry_strategy text not null default 'exponential',
  add column if not exists retry_backoff_level integer not null default 0;

update public.operation_reconciliation_queue
set max_retry_limit = greatest(max_retry_limit, max_retries)
where max_retry_limit < max_retries;

alter table public.operation_reconciliation_queue
  drop constraint if exists operation_reconciliation_retry_strategy_check;
alter table public.operation_reconciliation_queue
  add constraint operation_reconciliation_retry_strategy_check check (
    retry_strategy in ('fixed', 'exponential', 'manual')
  );

alter table public.operation_reconciliation_queue
  drop constraint if exists operation_reconciliation_worker_retry_check;
alter table public.operation_reconciliation_queue
  add constraint operation_reconciliation_worker_retry_check check (
    max_retry_limit >= 0
    and retry_backoff_level >= 0
    and processing_priority between -100 and 100
  );

create table if not exists public.dead_letter_operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  queue_id uuid references public.operation_reconciliation_queue(id) on delete set null,
  operation_id uuid references public.erp_financial_operations(id) on delete set null,
  operation_uuid uuid,
  operation_type text not null default 'financial_operation',
  failure_reason text not null,
  failure_category text not null default 'reconciliation',
  attempts integer not null default 0,
  payload_snapshot jsonb not null default '{}'::jsonb,
  error_context jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dead_letter_operations_status_check check (status in ('open', 'reviewing', 'resolved', 'ignored')),
  constraint dead_letter_operations_payload_object check (jsonb_typeof(payload_snapshot) = 'object'),
  constraint dead_letter_operations_context_object check (jsonb_typeof(error_context) = 'object')
);

create table if not exists public.financial_operation_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  operation_id uuid references public.erp_financial_operations(id) on delete set null,
  operation_uuid uuid,
  event_type text not null,
  event_source text not null default 'system',
  event_version text not null default 'financial-events-v1',
  event_payload jsonb not null default '{}'::jsonb,
  severity text not null default 'info',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint financial_operation_events_severity_check check (severity in ('debug', 'info', 'warning', 'error', 'critical')),
  constraint financial_operation_events_payload_object check (jsonb_typeof(event_payload) = 'object')
);

create table if not exists public.financial_operational_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_type text not null,
  metric_value numeric(14,4) not null default 0,
  metric_window text not null default 'instant',
  details_json jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint financial_operational_metrics_details_object check (jsonb_typeof(details_json) = 'object')
);

create index if not exists operation_reconciliation_worker_claim_idx
  on public.operation_reconciliation_queue (company_id, status, next_retry_at, processing_priority desc, created_at)
  where status in ('queued', 'retrying');
create index if not exists operation_reconciliation_lock_health_idx
  on public.operation_reconciliation_queue (company_id, locked_at, processing_timeout_at)
  where status = 'retrying';
create index if not exists dead_letter_operations_company_status_idx
  on public.dead_letter_operations (company_id, status, created_at desc);
create index if not exists dead_letter_operations_operation_idx
  on public.dead_letter_operations (company_id, operation_uuid, created_at desc)
  where operation_uuid is not null;
create index if not exists financial_operation_events_operation_idx
  on public.financial_operation_events (company_id, operation_id, created_at desc)
  where operation_id is not null;
create index if not exists financial_operation_events_type_idx
  on public.financial_operation_events (company_id, event_type, created_at desc);
create index if not exists financial_operational_metrics_type_idx
  on public.financial_operational_metrics (company_id, metric_type, recorded_at desc);

drop trigger if exists set_dead_letter_operations_updated_at on public.dead_letter_operations;
create trigger set_dead_letter_operations_updated_at
before update on public.dead_letter_operations
for each row execute function public.set_updated_at();

alter table public.dead_letter_operations enable row level security;
alter table public.financial_operation_events enable row level security;
alter table public.financial_operational_metrics enable row level security;

drop policy if exists "company members read dead letter operations" on public.dead_letter_operations;
create policy "company members read dead letter operations"
on public.dead_letter_operations for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members insert dead letter operations" on public.dead_letter_operations;
create policy "company members insert dead letter operations"
on public.dead_letter_operations for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members update dead letter operations" on public.dead_letter_operations;
create policy "company members update dead letter operations"
on public.dead_letter_operations for update
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members read financial operation events" on public.financial_operation_events;
create policy "company members read financial operation events"
on public.financial_operation_events for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members insert financial operation events" on public.financial_operation_events;
create policy "company members insert financial operation events"
on public.financial_operation_events for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members read financial operational metrics" on public.financial_operational_metrics;
create policy "company members read financial operational metrics"
on public.financial_operational_metrics for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

drop policy if exists "company members insert financial operational metrics" on public.financial_operational_metrics;
create policy "company members insert financial operational metrics"
on public.financial_operational_metrics for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_member(company_id));

create or replace function public.calculate_reconciliation_next_retry(
  p_retry_count integer,
  p_strategy text default 'exponential'
)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  v_retry integer := greatest(coalesce(p_retry_count, 0), 0);
  v_strategy text := coalesce(nullif(p_strategy, ''), 'exponential');
  v_delay interval;
begin
  if v_strategy = 'manual' then
    return null;
  end if;

  if v_strategy = 'fixed' then
    return now() + interval '5 minutes';
  end if;

  v_delay := case
    when v_retry <= 0 then interval '1 minute'
    when v_retry = 1 then interval '5 minutes'
    when v_retry = 2 then interval '15 minutes'
    when v_retry = 3 then interval '1 hour'
    else interval '6 hours'
  end;

  return now() + v_delay;
end;
$$;

create or replace function public.record_financial_operation_event(
  p_company_id uuid,
  p_operation_id uuid default null,
  p_operation_uuid uuid default null,
  p_event_type text default 'operation_event',
  p_event_source text default 'system',
  p_event_payload jsonb default '{}'::jsonb,
  p_severity text default 'info'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if p_company_id is null or nullif(p_event_type, '') is null then
    raise exception 'company_id and event_type are required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_company_id)) then
    raise exception 'not allowed for this company';
  end if;

  insert into public.financial_operation_events (
    company_id,
    operation_id,
    operation_uuid,
    event_type,
    event_source,
    event_payload,
    severity
  )
  values (
    p_company_id,
    p_operation_id,
    p_operation_uuid,
    p_event_type,
    coalesce(nullif(p_event_source, ''), 'system'),
    coalesce(p_event_payload, '{}'::jsonb),
    coalesce(nullif(p_severity, ''), 'info')
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.claim_operation_reconciliation_batch(
  p_company_id uuid,
  p_worker_node text,
  p_worker_version text default 'worker-v1',
  p_limit integer default 10,
  p_lock_timeout interval default interval '5 minutes'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed jsonb;
begin
  if p_company_id is null or nullif(p_worker_node, '') is null then
    raise exception 'company_id and worker_node are required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_company_id)) then
    raise exception 'not allowed for this company';
  end if;

  with candidates as (
    select id
    from public.operation_reconciliation_queue
    where company_id = p_company_id
      and status in ('queued', 'retrying')
      and next_retry_at <= now()
      and (
        locked_at is null
        or processing_timeout_at is null
        or processing_timeout_at < now()
      )
      and retry_count < greatest(max_retries, max_retry_limit)
    order by processing_priority desc, next_retry_at asc, created_at asc
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    for update skip locked
  ),
  claimed as (
    update public.operation_reconciliation_queue q
    set status = 'retrying',
        locked_by = p_worker_node,
        locked_at = now(),
        worker_node = p_worker_node,
        worker_version = coalesce(nullif(p_worker_version, ''), 'worker-v1'),
        processing_started_at = now(),
        processing_timeout_at = now() + coalesce(p_lock_timeout, interval '5 minutes'),
        last_worker_heartbeat = now(),
        updated_at = now()
    from candidates
    where q.id = candidates.id
    returning q.*
  )
  select coalesce(jsonb_agg(to_jsonb(claimed)), '[]'::jsonb)
  into v_claimed
  from claimed;

  insert into public.financial_operational_metrics (company_id, metric_type, metric_value, details_json)
  values (
    p_company_id,
    'reconciliation_claimed_count',
    jsonb_array_length(v_claimed),
    jsonb_build_object('worker_node', p_worker_node, 'worker_version', p_worker_version)
  );

  return jsonb_build_object('ok', true, 'claimed', v_claimed);
end;
$$;

create or replace function public.release_operation_reconciliation_item(
  p_queue_id uuid,
  p_status text,
  p_error text default null,
  p_result_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue public.operation_reconciliation_queue%rowtype;
  v_next_status text := coalesce(nullif(p_status, ''), 'failed');
  v_next_retry timestamptz;
  v_retry_count integer;
begin
  select *
    into v_queue
  from public.operation_reconciliation_queue
  where id = p_queue_id
  for update;

  if v_queue.id is null then
    raise exception 'queue item not found';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(v_queue.company_id)) then
    raise exception 'not allowed for this company';
  end if;

  if v_next_status = 'recovered' then
    update public.operation_reconciliation_queue
    set status = 'recovered',
        recovered_at = now(),
        last_error = null,
        locked_at = null,
        locked_by = null,
        processing_started_at = null,
        processing_timeout_at = null,
        last_worker_heartbeat = now(),
        payload_snapshot = payload_snapshot || coalesce(p_result_payload, '{}'::jsonb),
        updated_at = now()
    where id = p_queue_id;

    perform public.record_financial_operation_event(
      v_queue.company_id,
      v_queue.operation_id,
      v_queue.operation_uuid,
      'reconciliation_completed',
      'worker',
      coalesce(p_result_payload, '{}'::jsonb),
      'info'
    );

    return jsonb_build_object('ok', true, 'status', 'recovered');
  end if;

  v_retry_count := v_queue.retry_count + 1;
  v_next_retry := public.calculate_reconciliation_next_retry(v_retry_count, v_queue.retry_strategy);

  if v_retry_count >= greatest(v_queue.max_retries, v_queue.max_retry_limit) or v_next_status = 'abandoned' then
    update public.operation_reconciliation_queue
    set status = case when v_next_status = 'abandoned' then 'abandoned' else 'failed' end,
        retry_count = v_retry_count,
        retry_backoff_level = v_retry_count,
        last_retry_at = now(),
        next_retry_at = coalesce(v_next_retry, now() + interval '6 hours'),
        last_error = p_error,
        locked_at = null,
        locked_by = null,
        processing_started_at = null,
        processing_timeout_at = null,
        updated_at = now()
    where id = p_queue_id;

    insert into public.dead_letter_operations (
      company_id,
      queue_id,
      operation_id,
      operation_uuid,
      operation_type,
      failure_reason,
      attempts,
      payload_snapshot,
      error_context
    )
    values (
      v_queue.company_id,
      v_queue.id,
      v_queue.operation_id,
      v_queue.operation_uuid,
      v_queue.operation_type,
      coalesce(nullif(p_error, ''), 'reconciliation retry limit reached'),
      v_retry_count,
      v_queue.payload_snapshot,
      jsonb_build_object('status', v_next_status, 'result', coalesce(p_result_payload, '{}'::jsonb))
    );

    perform public.record_financial_operation_event(
      v_queue.company_id,
      v_queue.operation_id,
      v_queue.operation_uuid,
      'reconciliation_dead_lettered',
      'worker',
      jsonb_build_object('error', p_error, 'attempts', v_retry_count),
      'error'
    );

    return jsonb_build_object('ok', true, 'status', 'dead_lettered', 'attempts', v_retry_count);
  end if;

  update public.operation_reconciliation_queue
  set status = 'queued',
      retry_count = v_retry_count,
      retry_backoff_level = v_retry_count,
      last_retry_at = now(),
      next_retry_at = coalesce(v_next_retry, now() + interval '5 minutes'),
      last_error = p_error,
      locked_at = null,
      locked_by = null,
      processing_started_at = null,
      processing_timeout_at = null,
      updated_at = now()
  where id = p_queue_id;

  perform public.record_financial_operation_event(
    v_queue.company_id,
    v_queue.operation_id,
    v_queue.operation_uuid,
    'reconciliation_retry_scheduled',
    'worker',
    jsonb_build_object('error', p_error, 'attempts', v_retry_count, 'next_retry_at', v_next_retry),
    'warning'
  );

  return jsonb_build_object('ok', true, 'status', 'queued', 'attempts', v_retry_count, 'next_retry_at', v_next_retry);
end;
$$;

create or replace function public.run_reconciliation_health_checks(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stale_locks integer := 0;
  v_excessive_retries integer := 0;
  v_queue_depth integer := 0;
begin
  if p_company_id is null then
    raise exception 'company_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_company_id)) then
    raise exception 'not allowed for this company';
  end if;

  update public.operation_reconciliation_queue
  set status = 'queued',
      locked_at = null,
      locked_by = null,
      processing_started_at = null,
      processing_timeout_at = null,
      last_error = coalesce(last_error, 'stale worker lock released by health check'),
      updated_at = now()
  where company_id = p_company_id
    and status = 'retrying'
    and processing_timeout_at < now();
  get diagnostics v_stale_locks = row_count;

  insert into public.dead_letter_operations (
    company_id,
    queue_id,
    operation_id,
    operation_uuid,
    operation_type,
    failure_reason,
    attempts,
    payload_snapshot,
    error_context
  )
  select
    q.company_id,
    q.id,
    q.operation_id,
    q.operation_uuid,
    q.operation_type,
    'excessive reconciliation retries',
    q.retry_count,
    q.payload_snapshot,
    jsonb_build_object('retry_count', q.retry_count, 'max_retry_limit', q.max_retry_limit)
  from public.operation_reconciliation_queue q
  where q.company_id = p_company_id
    and q.status in ('queued', 'retrying')
    and q.retry_count >= greatest(q.max_retries, q.max_retry_limit)
    and not exists (
      select 1
      from public.dead_letter_operations dlq
      where dlq.company_id = q.company_id
        and dlq.queue_id = q.id
        and dlq.status in ('open', 'reviewing')
    );
  get diagnostics v_excessive_retries = row_count;

  update public.operation_reconciliation_queue q
  set status = 'failed',
      updated_at = now()
  where q.company_id = p_company_id
    and q.status in ('queued', 'retrying')
    and q.retry_count >= greatest(q.max_retries, q.max_retry_limit);

  select count(*)
    into v_queue_depth
  from public.operation_reconciliation_queue
  where company_id = p_company_id
    and status in ('queued', 'retrying');

  insert into public.financial_operational_metrics (company_id, metric_type, metric_value, details_json)
  values
    (p_company_id, 'stale_worker_locks_released', v_stale_locks, '{}'::jsonb),
    (p_company_id, 'excessive_retries_dead_lettered', v_excessive_retries, '{}'::jsonb),
    (p_company_id, 'reconciliation_queue_depth', v_queue_depth, '{}'::jsonb);

  return jsonb_build_object(
    'ok', true,
    'stale_locks_released', v_stale_locks,
    'excessive_retries_dead_lettered', v_excessive_retries,
    'queue_depth', v_queue_depth
  );
end;
$$;

grant select, insert, update on public.dead_letter_operations to authenticated;
grant select, insert on public.financial_operation_events to authenticated;
grant select, insert on public.financial_operational_metrics to authenticated;
grant execute on function public.calculate_reconciliation_next_retry(integer, text) to authenticated;
grant execute on function public.record_financial_operation_event(uuid, uuid, uuid, text, text, jsonb, text) to authenticated;
grant execute on function public.claim_operation_reconciliation_batch(uuid, text, text, integer, interval) to authenticated;
grant execute on function public.release_operation_reconciliation_item(uuid, text, text, jsonb) to authenticated;
grant execute on function public.run_reconciliation_health_checks(uuid) to authenticated;

comment on table public.dead_letter_operations is 'Dead-letter queue for financial operations that cannot be recovered automatically.';
comment on table public.financial_operation_events is 'Append-only operational event stream for financial operation observability and future audit.';
comment on table public.financial_operational_metrics is 'Lightweight internal operational metrics for reconciliation health without dashboards.';
