-- ERP cash concurrency, audit and payment hardening.
-- Additive/compatible layer over the cash fiscal foundation.

alter table public.cash_sessions
  add column if not exists session_scope text not null default 'company',
  add column if not exists closed_by uuid references auth.users(id) on delete set null,
  add column if not exists close_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cash_sessions_scope_check'
      and conrelid = 'public.cash_sessions'::regclass
  ) then
    alter table public.cash_sessions
      add constraint cash_sessions_scope_check check (session_scope in ('company', 'operator'));
  end if;
end $$;

update public.cash_sessions
set session_scope = case when mode = 'manual' then 'operator' else 'company' end
where session_scope is null
   or session_scope not in ('company', 'operator');

create unique index if not exists cash_sessions_open_company_simple_unique_idx
  on public.cash_sessions (empresa_id)
  where status = 'open' and session_scope = 'company';

create unique index if not exists cash_sessions_open_operator_scope_unique_idx
  on public.cash_sessions (empresa_id, usuario_id)
  where status = 'open' and session_scope = 'operator';

create index if not exists cash_sessions_empresa_opened_idx
  on public.cash_sessions (empresa_id, opened_at desc);

alter table public.sale_payments
  add column if not exists installments integer,
  add column if not exists transaction_id text,
  add column if not exists authorization_code text,
  add column if not exists nsu text,
  add column if not exists acquirer text,
  add column if not exists external_reference text,
  add column if not exists payment_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sale_payments_installments_check'
      and conrelid = 'public.sale_payments'::regclass
  ) then
    alter table public.sale_payments
      add constraint sale_payments_installments_check check (installments is null or installments > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'sale_payments_status_check'
      and conrelid = 'public.sale_payments'::regclass
  ) then
    alter table public.sale_payments
      add constraint sale_payments_status_check check (
        payment_status in ('pending', 'authorized', 'approved', 'cancelled', 'refunded', 'partially_refunded', 'failed')
      );
  end if;
end $$;

create index if not exists sale_payments_status_created_idx
  on public.sale_payments (empresa_id, payment_status, created_at desc);
create index if not exists sale_payments_transaction_idx
  on public.sale_payments (transaction_id)
  where transaction_id is not null and transaction_id <> '';
create index if not exists sale_payments_external_reference_idx
  on public.sale_payments (external_reference)
  where external_reference is not null and external_reference <> '';

create index if not exists cash_movements_created_idx
  on public.cash_movements (empresa_id, created_at desc);
create index if not exists cash_movements_payment_method_idx
  on public.cash_movements (payment_method_id, created_at desc)
  where payment_method_id is not null;

create index if not exists fiscal_documents_status_created_idx
  on public.fiscal_documents (empresa_id, status, created_at desc);
create index if not exists fiscal_documents_type_status_idx
  on public.fiscal_documents (empresa_id, document_type, status, created_at desc);

create or replace function public.s3d_cash_session_lock_key(p_empresa_id uuid, p_scope text)
returns bigint
language sql
stable
as $$
  select hashtextextended(coalesce(p_empresa_id::text, '') || ':cash-session:' || coalesce(p_scope, 'company'), 0);
$$;

create or replace function public.get_or_create_cash_session(
  p_empresa_id uuid,
  p_usuario_id uuid default auth.uid(),
  p_opening_balance numeric default 0,
  p_mode text default 'auto'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_scope text := case when coalesce(p_mode, 'auto') = 'manual' then 'operator' else 'company' end;
begin
  if p_empresa_id is null then
    raise exception 'empresa_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  perform pg_advisory_xact_lock(public.s3d_cash_session_lock_key(p_empresa_id, v_scope));

  if v_scope = 'company' then
    select id
      into v_session_id
    from public.cash_sessions
    where empresa_id = p_empresa_id
      and session_scope = 'company'
      and status = 'open'
    order by opened_at desc
    limit 1;
  else
    select id
      into v_session_id
    from public.cash_sessions
    where empresa_id = p_empresa_id
      and session_scope = 'operator'
      and usuario_id is not distinct from p_usuario_id
      and status = 'open'
    order by opened_at desc
    limit 1;
  end if;

  if v_session_id is not null then
    return v_session_id;
  end if;

  insert into public.cash_sessions (
    empresa_id,
    usuario_id,
    opening_balance,
    expected_balance,
    mode,
    session_scope
  )
  values (
    p_empresa_id,
    p_usuario_id,
    coalesce(p_opening_balance, 0),
    coalesce(p_opening_balance, 0),
    coalesce(nullif(p_mode, ''), 'auto'),
    v_scope
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.validate_cash_movement_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_company uuid;
  v_payment_company uuid;
begin
  select empresa_id into v_session_company
  from public.cash_sessions
  where id = new.session_id;

  if v_session_company is null then
    raise exception 'cash session not found';
  end if;

  if v_session_company <> new.empresa_id then
    raise exception 'cash movement company does not match session company';
  end if;

  if new.payment_method_id is not null then
    select empresa_id into v_payment_company
    from public.payment_methods
    where id = new.payment_method_id;

    if v_payment_company is null or v_payment_company <> new.empresa_id then
      raise exception 'payment method company does not match cash movement company';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_cash_movement_integrity_before_write on public.cash_movements;
create trigger validate_cash_movement_integrity_before_write
before insert or update on public.cash_movements
for each row execute function public.validate_cash_movement_integrity();

create or replace function public.validate_sale_payment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_company uuid;
  v_payment_company uuid;
begin
  if new.session_id is not null then
    select empresa_id into v_session_company
    from public.cash_sessions
    where id = new.session_id;

    if v_session_company is null or v_session_company <> new.empresa_id then
      raise exception 'sale payment company does not match session company';
    end if;
  end if;

  if new.payment_method_id is not null then
    select empresa_id into v_payment_company
    from public.payment_methods
    where id = new.payment_method_id;

    if v_payment_company is null or v_payment_company <> new.empresa_id then
      raise exception 'payment method company does not match sale payment company';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_sale_payment_integrity_before_write on public.sale_payments;
create trigger validate_sale_payment_integrity_before_write
before insert or update on public.sale_payments
for each row execute function public.validate_sale_payment_integrity();

create or replace function public.audit_cash_session_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'cash_session_opened';
  elsif tg_op = 'UPDATE' and old.status <> new.status and new.status = 'closed' then
    v_action := 'cash_session_closed';
  elsif tg_op = 'UPDATE' and old.status <> new.status and new.status = 'cancelled' then
    v_action := 'cash_session_cancelled';
  else
    v_action := 'cash_session_updated';
  end if;

  insert into public.erp_audit_events (
    empresa_id,
    user_id,
    entity_type,
    entity_id,
    action,
    before_json,
    after_json,
    metadata_json
  )
  values (
    new.empresa_id,
    auth.uid(),
    'cash_session',
    new.id::text,
    v_action,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new),
    jsonb_build_object('source', 'database_trigger')
  );

  return new;
end;
$$;

drop trigger if exists audit_cash_session_after_write on public.cash_sessions;
create trigger audit_cash_session_after_write
after insert or update on public.cash_sessions
for each row execute function public.audit_cash_session_changes();

create or replace function public.audit_cash_movement_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.erp_audit_events (
    empresa_id,
    user_id,
    entity_type,
    entity_id,
    action,
    after_json,
    metadata_json
  )
  values (
    new.empresa_id,
    auth.uid(),
    'cash_movement',
    new.id::text,
    'cash_movement_' || new.type,
    to_jsonb(new),
    jsonb_build_object('source', 'database_trigger', 'session_id', new.session_id)
  );

  return new;
end;
$$;

drop trigger if exists audit_cash_movement_after_insert on public.cash_movements;
create trigger audit_cash_movement_after_insert
after insert on public.cash_movements
for each row execute function public.audit_cash_movement_insert();

create or replace function public.audit_sale_payment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.erp_audit_events (
    empresa_id,
    user_id,
    entity_type,
    entity_id,
    action,
    before_json,
    after_json,
    metadata_json
  )
  values (
    new.empresa_id,
    auth.uid(),
    'sale_payment',
    new.id::text,
    case when tg_op = 'INSERT' then 'sale_payment_created' else 'sale_payment_updated' end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new),
    jsonb_build_object('source', 'database_trigger', 'sale_id', new.sale_id)
  );

  return new;
end;
$$;

drop trigger if exists audit_sale_payment_after_write on public.sale_payments;
create trigger audit_sale_payment_after_write
after insert or update on public.sale_payments
for each row execute function public.audit_sale_payment_changes();

create or replace function public.register_cash_movement(
  p_empresa_id uuid,
  p_session_id uuid,
  p_type text,
  p_amount numeric,
  p_payment_method_id uuid default null,
  p_description text default null,
  p_reference_collection text default null,
  p_reference_id text default null,
  p_metadata_json jsonb default '{}'::jsonb
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
    metadata_json
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
    coalesce(p_metadata_json, '{}'::jsonb)
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

grant execute on function public.s3d_cash_session_lock_key(uuid, text) to authenticated;
grant execute on function public.get_or_create_cash_session(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.register_cash_movement(uuid, uuid, text, numeric, uuid, text, text, text, jsonb) to authenticated;

comment on column public.cash_sessions.session_scope is 'company = simple single open session per company; operator = future individual operator sessions.';
comment on function public.get_or_create_cash_session(uuid, uuid, numeric, text) is 'Concurrency-safe auto/manual cash session creation using transaction advisory locks.';
comment on table public.erp_audit_events is 'Database-backed audit events for critical ERP finance operations; not dependent on frontend-only logs.';
