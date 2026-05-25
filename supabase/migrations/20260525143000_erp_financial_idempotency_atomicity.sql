-- ERP financial idempotency and atomic operation foundation.
-- Keeps current UX unchanged while preparing safe PWA/offline retries.

alter table public.cash_sessions
  add column if not exists expected_cash_total numeric(14,2) not null default 0,
  add column if not exists counted_cash_total numeric(14,2),
  add column if not exists payments_summary_json jsonb not null default '{}'::jsonb,
  add column if not exists closing_snapshot_json jsonb not null default '{}'::jsonb;

update public.cash_sessions
set expected_cash_total = expected_balance
where expected_cash_total = 0
  and expected_balance <> 0;

alter table public.cash_sessions
  drop constraint if exists cash_sessions_status_check;
alter table public.cash_sessions
  add constraint cash_sessions_status_check check (status in ('open', 'closing', 'closed', 'cancelled'));

alter table public.cash_sessions
  drop constraint if exists cash_sessions_amounts_check;
alter table public.cash_sessions
  add constraint cash_sessions_amounts_check check (
    opening_balance >= 0
    and (closing_balance is null or closing_balance >= 0)
    and expected_balance >= 0
    and expected_cash_total >= 0
    and (counted_cash_total is null or counted_cash_total >= 0)
  );

create table if not exists public.erp_financial_operations (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  operation_uuid uuid not null,
  client_request_id text,
  request_hash text,
  created_from_device text,
  operation_type text not null default 'sale',
  status text not null default 'processing',
  sale_id text,
  session_id uuid references public.cash_sessions(id) on delete set null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_financial_operations_type_check check (
    operation_type in ('sale', 'cash_movement', 'payment', 'refund', 'close_session', 'adjustment')
  ),
  constraint erp_financial_operations_status_check check (
    status in ('processing', 'completed', 'failed', 'cancelled')
  ),
  constraint erp_financial_operations_payload_object check (jsonb_typeof(payload_json) = 'object'),
  constraint erp_financial_operations_result_object check (jsonb_typeof(result_json) = 'object')
);

create unique index if not exists erp_financial_operations_uuid_unique_idx
  on public.erp_financial_operations (empresa_id, operation_uuid);
create unique index if not exists erp_financial_operations_client_request_unique_idx
  on public.erp_financial_operations (empresa_id, client_request_id)
  where client_request_id is not null and client_request_id <> '';
create unique index if not exists erp_financial_operations_request_hash_unique_idx
  on public.erp_financial_operations (empresa_id, request_hash)
  where request_hash is not null and request_hash <> '';
create index if not exists erp_financial_operations_status_created_idx
  on public.erp_financial_operations (empresa_id, status, created_at desc);
create index if not exists erp_financial_operations_sale_idx
  on public.erp_financial_operations (empresa_id, sale_id, created_at desc)
  where sale_id is not null;

alter table public.cash_movements
  add column if not exists operation_uuid uuid,
  add column if not exists client_request_id text,
  add column if not exists request_hash text,
  add column if not exists created_from_device text,
  add column if not exists operation_id uuid references public.erp_financial_operations(id) on delete set null;

alter table public.sale_payments
  add column if not exists operation_uuid uuid,
  add column if not exists client_request_id text,
  add column if not exists request_hash text,
  add column if not exists created_from_device text,
  add column if not exists operation_id uuid references public.erp_financial_operations(id) on delete set null;

alter table public.erp_records
  add column if not exists operation_uuid uuid,
  add column if not exists client_request_id text,
  add column if not exists request_hash text,
  add column if not exists created_from_device text;

create unique index if not exists cash_movements_operation_unique_idx
  on public.cash_movements (empresa_id, operation_uuid, type, amount, coalesce(reference_collection, ''), coalesce(reference_id, ''))
  where operation_uuid is not null;
create index if not exists cash_movements_operation_id_idx
  on public.cash_movements (operation_id)
  where operation_id is not null;

create unique index if not exists sale_payments_operation_method_unique_idx
  on public.sale_payments (empresa_id, operation_uuid, sale_id, coalesce(payment_method_id, '00000000-0000-0000-0000-000000000000'::uuid), amount)
  where operation_uuid is not null;
create index if not exists sale_payments_operation_id_idx
  on public.sale_payments (operation_id)
  where operation_id is not null;

create unique index if not exists erp_records_client_request_unique_idx
  on public.erp_records (user_id, collection, client_request_id)
  where client_request_id is not null and client_request_id <> '';
create unique index if not exists erp_records_operation_unique_idx
  on public.erp_records (user_id, collection, operation_uuid)
  where operation_uuid is not null;

update public.sale_payments
set payment_status = 'approved'
where payment_status = 'authorized';

update public.sale_payments
set payment_status = 'partial_refund'
where payment_status = 'partially_refunded';

update public.sale_payments
set payment_status = 'failed'
where payment_status = 'cancelled';

alter table public.sale_payments
  drop constraint if exists sale_payments_status_check;
alter table public.sale_payments
  add constraint sale_payments_status_check check (
    payment_status in ('pending', 'approved', 'failed', 'refunded', 'partial_refund')
  );

drop trigger if exists set_erp_financial_operations_updated_at on public.erp_financial_operations;
create trigger set_erp_financial_operations_updated_at
before update on public.erp_financial_operations
for each row execute function public.set_updated_at();

alter table public.erp_financial_operations enable row level security;

drop policy if exists "company members read financial operations" on public.erp_financial_operations;
create policy "company members read financial operations"
on public.erp_financial_operations for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members insert financial operations" on public.erp_financial_operations;
create policy "company members insert financial operations"
on public.erp_financial_operations for insert
to authenticated
with check (
  public.erp_is_superadmin()
  or (public.s3d_is_company_member(empresa_id) and (created_by is null or created_by = auth.uid()))
);

drop policy if exists "company members update own financial operations" on public.erp_financial_operations;
create policy "company members update own financial operations"
on public.erp_financial_operations for update
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

create or replace function public.s3d_financial_operation_lock_key(p_empresa_id uuid, p_operation_uuid uuid)
returns bigint
language sql
stable
as $$
  select hashtextextended(coalesce(p_empresa_id::text, '') || ':financial-operation:' || coalesce(p_operation_uuid::text, ''), 0);
$$;

drop function if exists public.register_cash_movement(uuid, uuid, text, numeric, uuid, text, text, text, jsonb);

create or replace function public.register_cash_movement(
  p_empresa_id uuid,
  p_session_id uuid,
  p_type text,
  p_amount numeric,
  p_payment_method_id uuid default null,
  p_description text default null,
  p_reference_collection text default null,
  p_reference_id text default null,
  p_metadata_json jsonb default '{}'::jsonb,
  p_operation_uuid uuid default null,
  p_client_request_id text default null,
  p_request_hash text default null,
  p_created_from_device text default null,
  p_operation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movement_id uuid;
begin
  if p_empresa_id is null or p_session_id is null or nullif(p_type, '') is null then
    raise exception 'empresa_id, session_id and type are required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  if p_operation_uuid is not null then
    select id into v_movement_id
    from public.cash_movements
    where empresa_id = p_empresa_id
      and operation_uuid = p_operation_uuid
      and type = p_type
      and amount = coalesce(p_amount, 0)
      and coalesce(reference_collection, '') = coalesce(p_reference_collection, '')
      and coalesce(reference_id, '') = coalesce(p_reference_id, '')
    order by created_at asc
    limit 1;

    if v_movement_id is not null then
      return v_movement_id;
    end if;
  end if;

  insert into public.cash_movements (
    empresa_id,
    session_id,
    type,
    amount,
    payment_method_id,
    description,
    reference_collection,
    reference_id,
    created_by,
    metadata_json,
    operation_uuid,
    client_request_id,
    request_hash,
    created_from_device,
    operation_id
  )
  values (
    p_empresa_id,
    p_session_id,
    p_type,
    coalesce(p_amount, 0),
    p_payment_method_id,
    p_description,
    p_reference_collection,
    p_reference_id,
    auth.uid(),
    coalesce(p_metadata_json, '{}'::jsonb),
    p_operation_uuid,
    p_client_request_id,
    p_request_hash,
    p_created_from_device,
    p_operation_id
  )
  on conflict do nothing
  returning id into v_movement_id;

  if v_movement_id is null and p_operation_uuid is not null then
    select id into v_movement_id
    from public.cash_movements
    where empresa_id = p_empresa_id
      and operation_uuid = p_operation_uuid
      and type = p_type
      and amount = coalesce(p_amount, 0)
      and coalesce(reference_collection, '') = coalesce(p_reference_collection, '')
      and coalesce(reference_id, '') = coalesce(p_reference_id, '')
    order by created_at asc
    limit 1;
  end if;

  if v_movement_id is null then
    raise exception 'cash movement could not be registered';
  end if;

  return v_movement_id;
end;
$$;

create or replace function public.register_sale_financial_operation(
  p_empresa_id uuid,
  p_sale_id text,
  p_total_amount numeric,
  p_payments_json jsonb,
  p_operation_uuid uuid,
  p_client_request_id text default null,
  p_request_hash text default null,
  p_created_from_device text default null,
  p_session_id uuid default null,
  p_metadata_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation_id uuid;
  v_existing public.erp_financial_operations%rowtype;
  v_session_id uuid;
  v_payment jsonb;
  v_payment_id uuid;
  v_movement_id uuid;
  v_payment_method_id uuid;
  v_payment_amount numeric;
  v_payment_status text;
  v_payment_ids uuid[] := '{}';
  v_movement_ids uuid[] := '{}';
begin
  if p_empresa_id is null or nullif(p_sale_id, '') is null or p_operation_uuid is null then
    raise exception 'empresa_id, sale_id and operation_uuid are required';
  end if;

  if coalesce(p_total_amount, 0) < 0 then
    raise exception 'total amount must be nonnegative';
  end if;

  if p_payments_json is null or jsonb_typeof(p_payments_json) <> 'array' then
    raise exception 'payments_json must be an array';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  perform pg_advisory_xact_lock(public.s3d_financial_operation_lock_key(p_empresa_id, p_operation_uuid));

  select * into v_existing
  from public.erp_financial_operations
  where empresa_id = p_empresa_id
    and (
      operation_uuid = p_operation_uuid
      or (p_client_request_id is not null and client_request_id = p_client_request_id)
      or (p_request_hash is not null and request_hash = p_request_hash)
    )
  order by created_at asc
  limit 1;

  if v_existing.id is not null and v_existing.status = 'completed' then
    return v_existing.result_json;
  elsif v_existing.id is not null then
    v_operation_id := v_existing.id;
  else
    insert into public.erp_financial_operations (
      empresa_id,
      operation_uuid,
      client_request_id,
      request_hash,
      created_from_device,
      operation_type,
      status,
      sale_id,
      payload_json,
      created_by
    )
    values (
      p_empresa_id,
      p_operation_uuid,
      p_client_request_id,
      p_request_hash,
      p_created_from_device,
      'sale',
      'processing',
      p_sale_id,
      jsonb_build_object(
        'sale_id', p_sale_id,
        'total_amount', p_total_amount,
        'payments', p_payments_json,
        'metadata', coalesce(p_metadata_json, '{}'::jsonb)
      ),
      auth.uid()
    )
    returning id into v_operation_id;
  end if;

  v_session_id := coalesce(p_session_id, public.get_or_create_cash_session(p_empresa_id, auth.uid(), 0, 'auto'));

  for v_payment in select value from jsonb_array_elements(p_payments_json)
  loop
    v_payment_method_id := nullif(v_payment ->> 'payment_method_id', '')::uuid;
    v_payment_amount := coalesce(nullif(v_payment ->> 'amount', '')::numeric, 0);
    v_payment_status := coalesce(nullif(v_payment ->> 'payment_status', ''), 'approved');

    if v_payment_amount <= 0 then
      raise exception 'payment amount must be positive';
    end if;

    if v_payment_status not in ('pending', 'approved', 'failed', 'refunded', 'partial_refund') then
      raise exception 'invalid payment_status: %', v_payment_status;
    end if;

    insert into public.sale_payments (
      sale_id,
      empresa_id,
      session_id,
      payment_method_id,
      amount,
      created_by,
      metadata_json,
      installments,
      transaction_id,
      authorization_code,
      nsu,
      acquirer,
      external_reference,
      payment_status,
      operation_uuid,
      client_request_id,
      request_hash,
      created_from_device,
      operation_id
    )
    values (
      p_sale_id,
      p_empresa_id,
      v_session_id,
      v_payment_method_id,
      v_payment_amount,
      auth.uid(),
      coalesce(v_payment -> 'metadata', '{}'::jsonb),
      nullif(v_payment ->> 'installments', '')::integer,
      nullif(v_payment ->> 'transaction_id', ''),
      nullif(v_payment ->> 'authorization_code', ''),
      nullif(v_payment ->> 'nsu', ''),
      nullif(v_payment ->> 'acquirer', ''),
      coalesce(nullif(v_payment ->> 'external_reference', ''), p_client_request_id),
      v_payment_status,
      p_operation_uuid,
      p_client_request_id,
      p_request_hash,
      p_created_from_device,
      v_operation_id
    )
    on conflict do nothing
    returning id into v_payment_id;

    if v_payment_id is null then
      select id into v_payment_id
      from public.sale_payments
      where empresa_id = p_empresa_id
        and operation_uuid = p_operation_uuid
        and sale_id = p_sale_id
        and amount = v_payment_amount
        and payment_method_id is not distinct from v_payment_method_id
      order by created_at asc
      limit 1;
    end if;

    if v_payment_id is null then
      raise exception 'sale payment could not be registered';
    end if;

    v_payment_ids := array_append(v_payment_ids, v_payment_id);

    if v_payment_status = 'approved' then
      v_movement_id := public.register_cash_movement(
        p_empresa_id,
        v_session_id,
        'sale',
        v_payment_amount,
        v_payment_method_id,
        'Venda ' || p_sale_id,
        'pedidos',
        p_sale_id,
        jsonb_build_object('sale_payment_id', v_payment_id),
        p_operation_uuid,
        p_client_request_id,
        p_request_hash,
        p_created_from_device,
        v_operation_id
      );
      v_movement_ids := array_append(v_movement_ids, v_movement_id);
    end if;
  end loop;

  update public.cash_sessions
  set expected_balance = opening_balance + coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        where cm.session_id = v_session_id
          and cm.type in ('sale', 'suprimento', 'adjustment', 'opening')
      ), 0) - coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        where cm.session_id = v_session_id
          and cm.type in ('sangria', 'retirada', 'estorno', 'closing')
      ), 0),
      expected_cash_total = opening_balance + coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        join public.payment_methods pm on pm.id = cm.payment_method_id
        where cm.session_id = v_session_id
          and cm.type in ('sale', 'suprimento', 'adjustment', 'opening')
          and pm.type = 'cash'
      ), 0) - coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        join public.payment_methods pm on pm.id = cm.payment_method_id
        where cm.session_id = v_session_id
          and cm.type in ('sangria', 'retirada', 'estorno', 'closing')
          and pm.type = 'cash'
      ), 0),
      payments_summary_json = coalesce((
        select jsonb_object_agg(coalesce(pm.type, 'other'), total_amount)
        from (
          select payment_method_id, sum(amount) as total_amount
          from public.sale_payments
          where session_id = v_session_id
            and payment_status = 'approved'
          group by payment_method_id
        ) totals
        left join public.payment_methods pm on pm.id = totals.payment_method_id
      ), '{}'::jsonb)
  where id = v_session_id;

  update public.erp_financial_operations
  set status = 'completed',
      session_id = v_session_id,
      result_json = jsonb_build_object(
        'operation_id', v_operation_id,
        'session_id', v_session_id,
        'sale_id', p_sale_id,
        'payment_ids', to_jsonb(v_payment_ids),
        'movement_ids', to_jsonb(v_movement_ids)
      ),
      error_message = null
  where id = v_operation_id;

  select result_json into v_payment
  from public.erp_financial_operations
  where id = v_operation_id;

  return v_payment;
exception
  when others then
    if v_operation_id is not null then
      update public.erp_financial_operations
      set status = 'failed',
          error_message = sqlerrm,
          result_json = jsonb_build_object('error', sqlerrm)
      where id = v_operation_id;
    end if;
    raise;
end;
$$;

grant select, insert, update on public.erp_financial_operations to authenticated;
grant execute on function public.s3d_financial_operation_lock_key(uuid, uuid) to authenticated;
grant execute on function public.register_cash_movement(uuid, uuid, text, numeric, uuid, text, text, text, jsonb, uuid, text, text, text, uuid) to authenticated;
grant execute on function public.register_sale_financial_operation(uuid, text, numeric, jsonb, uuid, text, text, text, uuid, jsonb) to authenticated;

comment on table public.erp_financial_operations is 'Idempotency ledger for atomic financial operations from PWA/offline retries.';
comment on function public.register_sale_financial_operation(uuid, text, numeric, jsonb, uuid, text, text, text, uuid, jsonb) is 'Atomic sale financial registration: payments, cash movements, session totals and audit in one database transaction.';
comment on column public.cash_movements.operation_uuid is 'Idempotency key propagated from the client/device operation.';
comment on column public.sale_payments.operation_uuid is 'Idempotency key propagated from the client/device operation.';
