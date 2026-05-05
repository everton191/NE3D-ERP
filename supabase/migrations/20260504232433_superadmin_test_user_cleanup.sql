-- Simplifica 3D: Superadmin test-user cleanup.
-- Safe/idempotent migration. Adds an explicit test-user flag and an audited
-- superadmin-only RPC for deleting test accounts without exposing service_role
-- in the frontend.

create extension if not exists pgcrypto;
create schema if not exists private;

alter table public.clients
  add column if not exists is_test_user boolean not null default false,
  add column if not exists anonymized_at timestamptz;

alter table public.profiles
  add column if not exists is_test_user boolean not null default false;

alter table public.erp_profiles
  add column if not exists is_test_user boolean not null default false;

create index if not exists clients_is_test_user_idx
  on public.clients(is_test_user, created_at desc);

create index if not exists profiles_is_test_user_idx
  on public.profiles(is_test_user, client_id);

create index if not exists erp_profiles_is_test_user_idx
  on public.erp_profiles(is_test_user, client_id);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'clients_status_check'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients drop constraint clients_status_check;
  end if;

  alter table public.clients
    add constraint clients_status_check
    check (status in ('active', 'overdue', 'blocked', 'inactive', 'cancelled', 'anonymized'));
end $$;

create table if not exists public.deleted_test_user_audit (
  id uuid primary key default gen_random_uuid(),
  deleted_user_id uuid null,
  deleted_user_email text null,
  deleted_by uuid null references auth.users(id) on delete set null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists deleted_test_user_audit_deleted_user_idx
  on public.deleted_test_user_audit(deleted_user_id, created_at desc);

create index if not exists deleted_test_user_audit_deleted_by_idx
  on public.deleted_test_user_audit(deleted_by, created_at desc);

alter table public.deleted_test_user_audit enable row level security;

drop policy if exists "deleted_test_user_audit_select_superadmin" on public.deleted_test_user_audit;
create policy "deleted_test_user_audit_select_superadmin"
on public.deleted_test_user_audit for select
to authenticated
using (public.erp_is_superadmin());

drop policy if exists "deleted_test_user_audit_insert_superadmin" on public.deleted_test_user_audit;
create policy "deleted_test_user_audit_insert_superadmin"
on public.deleted_test_user_audit for insert
to authenticated
with check (public.erp_is_superadmin());

create or replace function private.delete_test_user_client_impl(
  p_client_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_client public.clients%rowtype;
  v_email text;
  v_company_id uuid;
  v_user_ids uuid[] := array[]::uuid[];
  v_primary_user_id uuid;
  v_orders_count integer := 0;
  v_linked_clients_count integer := 0;
  v_feedback_count integer := 0;
  v_logs_count integer := 0;
  v_related_count integer := 0;
  v_deleted_feedback integer := 0;
  v_deleted_log_users integer := 0;
  v_anonymized_error_logs integer := 0;
  v_deleted_records integer := 0;
  v_deleted_backups integer := 0;
  v_deleted_sync_settings integer := 0;
  v_deleted_security_logs integer := 0;
  v_deleted_saas_sessions integer := 0;
  v_deleted_payments integer := 0;
  v_deleted_erp_payments integer := 0;
  v_deleted_webhook_events integer := 0;
  v_deleted_subscriptions integer := 0;
  v_deleted_audit_logs integer := 0;
  v_deleted_members integer := 0;
  v_deleted_companies integer := 0;
  v_deleted_profiles integer := 0;
  v_deleted_erp_profiles integer := 0;
  v_deleted_clients integer := 0;
  v_deleted_auth_users integer := 0;
  v_auth_delete_error text := null;
  v_summary jsonb;
begin
  if v_actor is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;

  if not public.erp_is_superadmin() then
    raise exception 'Erro de permissao: apenas superadmin pode executar esta acao.'
      using errcode = '42501';
  end if;

  if coalesce(trim(p_confirmation), '') <> 'EXCLUIR TESTE' then
    raise exception 'Confirmacao invalida para exclusao de usuario de teste.'
      using errcode = '22023';
  end if;

  select *
  into v_client
  from public.clients
  where id = p_client_id
  for update;

  if v_client.id is null then
    raise exception 'Cliente nao encontrado.' using errcode = 'P0002';
  end if;

  if coalesce(v_client.is_test_user, false) is not true then
    raise exception 'Exclusao bloqueada: cliente nao esta marcado como usuario de teste.'
      using errcode = '42501';
  end if;

  v_email := lower(nullif(trim(v_client.email), ''));
  v_company_id := v_client.company_id;

  select coalesce(array_agg(distinct user_id), array[]::uuid[])
  into v_user_ids
  from (
    select p.user_id
    from public.profiles p
    where p.client_id = p_client_id
       or lower(p.email) = v_email
    union
    select ep.id as user_id
    from public.erp_profiles ep
    where ep.client_id = p_client_id
       or lower(ep.email) = v_email
    union
    select s.user_id
    from public.subscriptions s
    where s.client_id = p_client_id
       and s.user_id is not null
    union
    select cm.user_id
    from public.company_members cm
    where cm.company_id = v_company_id
  ) users_to_delete
  where user_id is not null;

  v_primary_user_id := case when array_length(v_user_ids, 1) > 0 then v_user_ids[1] else null end;

  select count(*) into v_orders_count
  from public.erp_records r
  where r.collection = 'pedidos'
    and (
      r.user_id = any(v_user_ids)
      or r.owner_id in (p_client_id::text, coalesce(v_email, ''))
    );

  select count(*) into v_linked_clients_count
  from public.erp_records r
  where r.collection = 'clientes'
    and (
      r.user_id = any(v_user_ids)
      or r.owner_id in (p_client_id::text, coalesce(v_email, ''))
    );

  select count(*) into v_feedback_count
  from public.app_feedback_reports f
  where f.user_id = any(v_user_ids)
     or lower(coalesce(f.user_email, '')) = coalesce(v_email, '');

  select count(*) into v_logs_count
  from public.app_error_log_users elu
  where elu.user_id = any(v_user_ids)
     or lower(coalesce(elu.user_email, '')) = coalesce(v_email, '');

  select count(*) into v_related_count
  from public.erp_records r
  where r.user_id = any(v_user_ids)
     or r.owner_id in (p_client_id::text, coalesce(v_email, ''));

  delete from public.app_feedback_reports f
  where f.user_id = any(v_user_ids)
     or lower(coalesce(f.user_email, '')) = coalesce(v_email, '');
  get diagnostics v_deleted_feedback = row_count;

  delete from public.app_error_log_users elu
  where elu.user_id = any(v_user_ids)
     or lower(coalesce(elu.user_email, '')) = coalesce(v_email, '');
  get diagnostics v_deleted_log_users = row_count;

  update public.app_error_logs el
  set user_id = null,
      user_email = null,
      metadata = coalesce(el.metadata, '{}'::jsonb) || jsonb_build_object('test_user_removed', true)
  where el.user_id = any(v_user_ids)
     or lower(coalesce(el.user_email, '')) = coalesce(v_email, '');
  get diagnostics v_anonymized_error_logs = row_count;

  delete from public.erp_records r
  where r.user_id = any(v_user_ids)
     or r.owner_id in (p_client_id::text, coalesce(v_email, ''));
  get diagnostics v_deleted_records = row_count;

  delete from public.erp_backups b
  where b.user_id = any(v_user_ids)
     or b.owner_id in (p_client_id::text, coalesce(v_email, ''));
  get diagnostics v_deleted_backups = row_count;

  delete from public.sync_settings ss
  where ss.user_id = any(v_user_ids)
     or ss.company_id = v_company_id;
  get diagnostics v_deleted_sync_settings = row_count;

  delete from public.security_logs sl
  where sl.user_id = any(v_user_ids)
     or lower(coalesce(sl.actor_email, '')) = coalesce(v_email, '');
  get diagnostics v_deleted_security_logs = row_count;

  delete from public.saas_sessions ss
  where ss.client_id = p_client_id
     or ss.user_id = any(v_user_ids);
  get diagnostics v_deleted_saas_sessions = row_count;

  delete from public.payments p
  where p.client_id = p_client_id;
  get diagnostics v_deleted_payments = row_count;

  delete from public.erp_payments ep
  where ep.cliente_id = p_client_id
     or lower(coalesce(ep.external_reference, '')) = coalesce(v_email, '')
     or lower(coalesce(ep.cliente_codigo, '')) = lower(coalesce(v_client.client_code, ''));
  get diagnostics v_deleted_erp_payments = row_count;

  delete from public.erp_webhook_events ewe
  where ewe.client_id = p_client_id;
  get diagnostics v_deleted_webhook_events = row_count;

  delete from public.subscriptions s
  where s.client_id = p_client_id
     or s.user_id = any(v_user_ids);
  get diagnostics v_deleted_subscriptions = row_count;

  delete from public.audit_logs al
  where al.client_id = p_client_id
     or al.user_id = any(v_user_ids);
  get diagnostics v_deleted_audit_logs = row_count;

  delete from public.company_members cm
  where cm.company_id = v_company_id
     or cm.user_id = any(v_user_ids);
  get diagnostics v_deleted_members = row_count;

  delete from public.profiles p
  where p.client_id = p_client_id
     or p.user_id = any(v_user_ids)
     or lower(p.email) = coalesce(v_email, '');
  get diagnostics v_deleted_profiles = row_count;

  delete from public.erp_profiles ep
  where ep.client_id = p_client_id
     or ep.id = any(v_user_ids)
     or lower(ep.email) = coalesce(v_email, '');
  get diagnostics v_deleted_erp_profiles = row_count;

  delete from public.clients c
  where c.id = p_client_id
    and coalesce(c.is_test_user, false) is true;
  get diagnostics v_deleted_clients = row_count;

  if v_company_id is not null then
    delete from public.companies c
    where c.id = v_company_id
      and not exists (
        select 1 from public.company_members cm where cm.company_id = c.id
      )
      and not exists (
        select 1 from public.clients cl where cl.company_id = c.id
      );
    get diagnostics v_deleted_companies = row_count;
  end if;

  begin
    delete from auth.users au
    where au.id = any(v_user_ids);
    get diagnostics v_deleted_auth_users = row_count;
  exception
    when others then
      v_auth_delete_error := sqlerrm;
      v_deleted_auth_users := 0;
  end;

  v_summary := jsonb_build_object(
    'before', jsonb_build_object(
      'orders', v_orders_count,
      'linked_clients', v_linked_clients_count,
      'feedback_reports', v_feedback_count,
      'telemetry_users', v_logs_count,
      'related_records', v_related_count
    ),
    'deleted', jsonb_build_object(
      'feedback_reports', v_deleted_feedback,
      'telemetry_users', v_deleted_log_users,
      'telemetry_logs_anonymized', v_anonymized_error_logs,
      'erp_records', v_deleted_records,
      'erp_backups', v_deleted_backups,
      'sync_settings', v_deleted_sync_settings,
      'security_logs', v_deleted_security_logs,
      'saas_sessions', v_deleted_saas_sessions,
      'payments', v_deleted_payments,
      'erp_payments', v_deleted_erp_payments,
      'webhook_events', v_deleted_webhook_events,
      'subscriptions', v_deleted_subscriptions,
      'audit_logs', v_deleted_audit_logs,
      'company_members', v_deleted_members,
      'companies', v_deleted_companies,
      'profiles', v_deleted_profiles,
      'erp_profiles', v_deleted_erp_profiles,
      'clients', v_deleted_clients,
      'auth_users', v_deleted_auth_users
    ),
    'auth_delete_error', v_auth_delete_error
  );

  insert into public.deleted_test_user_audit (
    deleted_user_id,
    deleted_user_email,
    deleted_by,
    summary
  )
  values (
    v_primary_user_id,
    v_email,
    v_actor,
    v_summary
  );

  return jsonb_build_object(
    'ok', true,
    'client_id', p_client_id,
    'deleted_user_id', v_primary_user_id,
    'deleted_user_email', v_email,
    'auth_deleted', v_deleted_auth_users > 0,
    'auth_delete_error', v_auth_delete_error,
    'summary', v_summary
  );
end;
$$;

create or replace function public.delete_test_user_client(
  p_client_id uuid,
  p_confirmation text
)
returns jsonb
language sql
security invoker
set search_path = public, private
as $$
  select private.delete_test_user_client_impl(p_client_id, p_confirmation);
$$;

grant usage on schema private to authenticated, service_role;

revoke all on function private.delete_test_user_client_impl(uuid, text) from public, anon, authenticated;
grant execute on function private.delete_test_user_client_impl(uuid, text) to authenticated, service_role;

revoke all on function public.delete_test_user_client(uuid, text) from public, anon;
grant execute on function public.delete_test_user_client(uuid, text) to authenticated, service_role;

grant select, update on public.clients to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.erp_profiles to authenticated;
grant select on public.deleted_test_user_audit to authenticated;
