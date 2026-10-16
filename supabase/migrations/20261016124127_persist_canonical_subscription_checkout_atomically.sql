begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- The Edge Function verifies Auth online. This service-only RPC rechecks the
-- persisted tenant relationship before both provider creation and persistence.
-- A null provider snapshot is a read-only preflight, not an entitlement grant.
create or replace function public.persist_mercadopago_checkout(
  p_client_id uuid,
  p_actor_user_id uuid,
  p_plan_slug text,
  p_billing_variant text,
  p_preapproval jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_client public.clients%rowtype;
  v_sub public.subscriptions%rowtype;
  v_superadmin boolean;
  v_linked_clients uuid[];
  v_linked_companies uuid[];
  v_plan_id uuid;
  v_contract text;
  v_checkout jsonb;
  v_written_client uuid;
begin
  if p_client_id is null or p_actor_user_id is null
    or p_plan_slug is null or p_plan_slug not in ('start', 'pro')
    or p_billing_variant is distinct from p_plan_slug || '_monthly' then
    raise exception 'Cliente, autor e plano canonico obrigatorios' using errcode = '22023';
  end if;
  select array_agg(distinct client_id) filter (where client_id is not null),
    array_agg(distinct company_id) filter (where company_id is not null)
  into v_linked_clients, v_linked_companies
  from (
    select client_id, company_id, role from public.profiles
      where user_id = p_actor_user_id and coalesce(status, 'active') = 'active'
    union all
    select client_id, company_id, role from public.erp_profiles
      where id = p_actor_user_id and coalesce(status, 'active') = 'active'
  ) profiles;
  -- Same effective authority as erp_is_superadmin, evaluated for the actor
  -- validated by Auth rather than the service-role transport's auth.uid().
  v_superadmin := exists(select 1 from public.superadmins
      where user_id = p_actor_user_id and status = 'active')
    or exists(select 1 from public.erp_profiles where id = p_actor_user_id
      and role = 'superadmin' and coalesce(status, 'active') = 'active');
  if coalesce(cardinality(v_linked_clients), 0) > 1
    or coalesce(cardinality(v_linked_companies), 0) > 1 then
    raise exception 'Vinculos de cliente conflitantes' using errcode = '42501';
  end if;
  if not v_superadmin and (cardinality(v_linked_clients) is distinct from 1
    or v_linked_clients[1] is distinct from p_client_id) then
    raise exception 'Cliente nao pertence ao usuario autenticado' using errcode = '42501';
  end if;

  -- Same lock order and mode as payment ingestion/license reconciliation.
  select * into v_client from public.clients
    where id = p_client_id for no key update;
  if not found or v_client.company_id is null then
    raise exception 'Cliente sem empresa autorizada' using errcode = '42501';
  end if;
  if not v_superadmin and cardinality(v_linked_companies) = 1
    and v_linked_companies[1] is distinct from v_client.company_id then
    raise exception 'Empresa nao pertence ao usuario autenticado' using errcode = '42501';
  end if;
  if not exists(select 1 from public.companies c where c.id = v_client.company_id
    and coalesce(c.status, 'active') <> 'inactive'
    and (v_superadmin or c.owner_user_id = p_actor_user_id
      or exists(select 1 from public.company_members cm where cm.company_id = c.id
        and cm.user_id = p_actor_user_id and cm.status = 'active'))) then
    raise exception 'Vinculo ativo com a empresa obrigatorio' using errcode = '42501';
  end if;
  select id into v_plan_id from public.plans where slug = p_plan_slug and active = true;
  if v_plan_id is null then
    raise exception 'Plano de assinatura indisponivel' using errcode = '22023';
  end if;
  select * into v_sub from public.subscriptions where client_id = p_client_id for no key update;
  if v_sub.company_id is not null and v_sub.company_id <> v_client.company_id then
    raise exception 'Assinatura vinculada a outra empresa' using errcode = '42501';
  end if;
  if p_preapproval is null then
    return jsonb_build_object('ready', nullif(v_sub.mercado_pago_subscription_id, '') is null,
      'reason', case when nullif(v_sub.mercado_pago_subscription_id, '') is not null
        then 'MERCADOPAGO_SUBSCRIPTION_ALREADY_LINKED' else null end,
      'client', jsonb_build_object('id', v_client.id, 'client_code', v_client.client_code,
        'email', v_client.email));
  end if;
  if jsonb_typeof(p_preapproval) is distinct from 'object'
    or p_preapproval->>'status' is distinct from 'pending'
    or nullif(trim(p_preapproval->>'id'), '') is null then
    raise exception 'Resposta de checkout pendente obrigatoria' using errcode = '22023';
  end if;
  v_contract := trim(p_preapproval->>'id');
  if nullif(v_sub.mercado_pago_subscription_id, '') is not null then
    if v_sub.mercado_pago_subscription_id = v_contract
      and v_sub.metadata->'checkout'->>'provider_id' = v_contract
      and v_sub.metadata->'checkout'->>'plan_slug' = p_plan_slug then
      return jsonb_build_object('persisted', true, 'subscription_id', v_sub.id, 'duplicate', true);
    end if;
    -- Concurrent checkouts cannot replace one another or an existing contract.
    raise exception 'Contrato mudou; reconciliacao do checkout obrigatoria' using errcode = '40001';
  end if;
  v_checkout := jsonb_build_object('provider_id', v_contract, 'actor_user_id', p_actor_user_id,
    'plan_slug', p_plan_slug, 'billing_variant', p_billing_variant,
    'created_at', clock_timestamp());
  if v_sub.id is null then
    insert into public.subscriptions (client_id, company_id, user_id, plan_id,
      active_plan, plan_code, plan_status, status, status_assinatura, subscription_status,
      payment_status, pending_plan, pending_started_at, billing_variant,
      mercado_pago_subscription_id, metadata)
    values(p_client_id, v_client.company_id, p_actor_user_id,
      (select id from public.plans where slug = 'free'),
      'free', 'FREE', 'PENDING', 'active', 'active', 'free', 'pending', p_plan_slug,
      clock_timestamp(), p_billing_variant, v_contract,
      jsonb_build_object('preapproval', p_preapproval, 'checkout', v_checkout))
    returning * into v_sub;
  else
    update public.subscriptions set mercado_pago_subscription_id = v_contract,
      pending_plan = p_plan_slug, pending_started_at = clock_timestamp(),
      payment_status = case when active_plan = 'free' and not coalesce(manual_override, false)
        then 'pending' else payment_status end,
      billing_variant = case when active_plan = 'free' and not coalesce(manual_override, false)
        then p_billing_variant else billing_variant end,
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object('preapproval', p_preapproval, 'checkout', v_checkout),
      updated_at = clock_timestamp()
    where id = v_sub.id returning * into v_sub;
  end if;
  if v_sub.id is null then
    raise exception 'Gravacao da assinatura nao confirmada' using errcode = 'P0002';
  end if;
  -- Checkout only records an intention; it never changes an existing plan,
  -- price, access status, validity, manual override, block or cancellation.
  update public.clients set pending_plan = v_sub.pending_plan,
    payment_status = v_sub.payment_status, updated_at = clock_timestamp()
    where id = p_client_id returning id into v_written_client;
  if not found or v_written_client is distinct from p_client_id then
    raise exception 'Gravacao do cliente nao confirmada' using errcode = 'P0002';
  end if;
  if not exists(select 1 from public.clients c where c.id = p_client_id
    and c.pending_plan is not distinct from v_sub.pending_plan
    and c.payment_status is not distinct from v_sub.payment_status) then
    raise exception 'Espelho do checkout nao confirmado' using errcode = 'P0002';
  end if;
  insert into public.audit_logs(user_id, client_id, action, details)
  values(p_actor_user_id, p_client_id, 'assinatura criada', jsonb_build_object(
    'provider', 'mercado_pago', 'plan', p_plan_slug,
    'subscription_id', v_contract, 'billing_variant', p_billing_variant,
    'access_changed', false));
  return jsonb_build_object('persisted', true, 'subscription_id', v_sub.id);
end;
$function$;

revoke all on function public.persist_mercadopago_checkout(uuid,uuid,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.persist_mercadopago_checkout(uuid,uuid,text,text,jsonb) to service_role;
-- Rollback: restore the previous Edge Function before dropping this RPC.
notify pgrst, 'reload schema';
commit;
