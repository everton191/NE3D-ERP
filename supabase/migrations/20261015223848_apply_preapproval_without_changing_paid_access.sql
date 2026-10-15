begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function public.apply_mercadopago_preapproval(
  p_subscription_id uuid,
  p_client_id uuid,
  p_mercado_pago_subscription_id text,
  p_status text,
  p_preapproval jsonb,
  p_actor_user_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_sub public.subscriptions%rowtype;
  v_new_version timestamptz;
  v_old_version timestamptz;
  v_cancel_version timestamptz;
  v_old_payload jsonb;
  v_old_status text;
  v_cancel boolean;
  v_reason text;
  v_until timestamptz;
begin
  if p_subscription_id is null or p_client_id is null
    or nullif(trim(p_mercado_pago_subscription_id), '') is null
    or p_status is null or p_status not in ('active', 'pending', 'cancelled')
    or jsonb_typeof(p_preapproval) is distinct from 'object' then
    raise exception 'Assinatura e estado do provedor obrigatorios' using errcode = '22023';
  end if;
  -- Match the client -> subscription lock order used by license resolution.
  perform 1 from public.clients where id = p_client_id for no key update;
  select * into v_sub from public.subscriptions
  where id = p_subscription_id and client_id = p_client_id for no key update;
  if not found then
    raise exception 'Assinatura nao pertence ao cliente' using errcode = '23503';
  end if;
  if nullif(v_sub.mercado_pago_subscription_id, '') is not null
    and v_sub.mercado_pago_subscription_id <> p_mercado_pago_subscription_id then
    v_reason := 'different_contract';
  elsif nullif(v_sub.mercado_pago_subscription_id, '') is null and (p_status = 'cancelled' or v_sub.manual_override) then
    v_reason := 'unlinked_contract';
  end if;
  if v_reason is not null then
    insert into public.audit_logs(user_id, client_id, action, details)
    values(p_actor_user_id, p_client_id, 'billing_preapproval_ignored', jsonb_build_object(
      'reason', v_reason, 'subscription_id', p_mercado_pago_subscription_id,
      'current_subscription_id', v_sub.mercado_pago_subscription_id));
    return jsonb_build_object('applied', false, 'reason', v_reason);
  end if;

  -- The provider version is authoritative for ordering, not delivery time.
  begin
    v_new_version := nullif(p_preapproval->>'last_modified', '')::timestamptz;
  exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'Versao de assinatura invalida' using errcode = '22023';
  end;
  begin
    v_old_version := nullif(v_sub.metadata->'preapproval'->>'last_modified', '')::timestamptz;
    v_cancel_version := nullif(v_sub.metadata->'cancel'->>'last_modified', '')::timestamptz;
    v_old_payload := case when v_cancel_version > coalesce(v_old_version, '-infinity'::timestamptz)
      then v_sub.metadata->'cancel' else v_sub.metadata->'preapproval' end;
    v_old_version := greatest(v_old_version, v_cancel_version);
  exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'Versao persistida exige revisao' using errcode = '22023';
  end;
  if v_old_version is not null and v_new_version is null then
    raise exception 'Versao do provedor obrigatoria para atualizar assinatura versionada' using errcode = '22023';
  end if;
  if v_new_version < v_old_version then
    return jsonb_build_object('applied', false, 'reason', 'older_provider_version');
  end if;
  v_old_status := case lower(v_old_payload->>'status')
    when 'authorized' then 'active' when 'active' then 'active'
    when 'cancelled' then 'cancelled' when 'canceled' then 'cancelled' else 'pending' end;
  if v_new_version = v_old_version and p_status <> v_old_status then
    raise exception 'Mesma versao com estados conflitantes exige nova consulta' using errcode = '22023';
  end if;

  v_cancel := v_sub.cancel_at_period_end;
  if p_status = 'cancelled' then
    v_cancel := true;
  elsif p_status = 'active' and v_cancel and v_new_version is not null
    and v_new_version > coalesce(v_old_version, v_sub.cancelled_at, 'infinity'::timestamptz) then
    -- A newer provider confirmation may reactivate; unversioned/stale events cannot.
    v_cancel := false;
  end if;
  v_until := coalesce(v_sub.premium_until, v_sub.plan_expires_at,
    v_sub.current_period_end, v_sub.expires_at);
  update public.subscriptions set
    mercado_pago_subscription_id = p_mercado_pago_subscription_id,
    cancel_at_period_end = v_cancel,
    cancelled_at = case when v_cancel then coalesce(cancelled_at, clock_timestamp()) else null end,
    status_assinatura = case when v_cancel then 'canceling'
      when status_assinatura = 'canceling' then subscription_status else status_assinatura end,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('preapproval', p_preapproval),
    updated_at = clock_timestamp()
  where id = v_sub.id;
  update public.clients set cancel_at_period_end = v_cancel,
    status_assinatura = case when v_cancel then 'canceling'
      when status_assinatura = 'canceling' then v_sub.subscription_status else status_assinatura end,
    plan_expires_at = v_until, updated_at = clock_timestamp()
  where id = p_client_id;
  insert into public.audit_logs(user_id, client_id, action, details)
  values(p_actor_user_id, p_client_id,
    case when p_status = 'cancelled' then 'assinatura cancelada' else 'webhook assinatura' end,
    jsonb_build_object('provider', 'mercado_pago', 'status', p_status,
      'subscription_id', p_mercado_pago_subscription_id, 'cancel_at_period_end', v_cancel,
      'access_ends_at', v_until, 'provider_last_modified', v_new_version));
  return jsonb_build_object('applied', true, 'cancel_at_period_end', v_cancel, 'access_ends_at', v_until);
end;
$function$;

revoke all on function public.apply_mercadopago_preapproval(uuid,uuid,text,text,jsonb,uuid)
  from public, anon, authenticated;
grant execute on function public.apply_mercadopago_preapproval(uuid,uuid,text,text,jsonb,uuid) to service_role;
-- Calendar/plans/prices/access status are not changed by provider notifications.
-- Rollback: restore dependent function deployments before dropping this RPC.
notify pgrst, 'reload schema';
commit;
