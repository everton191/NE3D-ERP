-- Keep the existing public RPC signatures, but use the current Free/Start/Pro
-- catalog. No customer rows are changed when this migration is installed.
begin;

create or replace function private.get_effective_license_impl(p_user_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $function$
declare
  v_actor uuid := auth.uid();
  v_target uuid := private.s3d_uuid_or_null(p_user_id);
  v_client uuid;
  v_sub record;
  v_plan text := 'FREE';
  v_status text := 'FREE';
  v_expires timestamptz;
  v_trial_start timestamptz;
  v_trial_end timestamptz;
  v_pending_start timestamptz;
  v_pending boolean := false;
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;
  if coalesce(trim(p_user_id), '') = '' then
    v_target := v_actor;
  elsif v_target is null then
    raise exception 'Identificador de usuario invalido' using errcode = '22023';
  elsif v_target <> v_actor and not public.erp_is_superadmin() then
    raise exception 'Apenas superadmin pode consultar outro usuario' using errcode = '42501';
  end if;

  if v_target = v_actor and public.erp_is_superadmin() and coalesce(trim(p_user_id), '') = '' then
    return jsonb_build_object(
      'user_id', v_actor, 'client_id', null, 'plan_code', 'PRO',
      'plan_slug', 'pro', 'active_plan', 'pro', 'effective_status', 'ACTIVE',
      'status', 'active', 'subscription_status', 'active',
      'is_premium', true, 'has_full_access', true, 'show_ads', false,
      'is_trial', false, 'is_pending', false, 'is_blocked', false,
      'remaining_trial_days', 0, 'premium_until', null,
      'source', 'superadmin', 'updated_at', v_now
    );
  end if;

  select coalesce(
    (select p.client_id from public.profiles p where p.user_id = v_target and p.client_id is not null limit 1),
    (select ep.client_id from public.erp_profiles ep where ep.id = v_target and ep.client_id is not null limit 1),
    (select s.client_id from public.subscriptions s where s.user_id = v_target order by s.updated_at desc nulls last, s.created_at desc limit 1),
    (select c.id from public.clients c where c.id = v_target limit 1)
  ) into v_client;
  if v_client is null then
    return jsonb_build_object('user_id', v_target, 'client_id', null,
      'plan_code', 'FREE', 'plan_slug', 'free', 'active_plan', 'free',
      'effective_status', 'FREE', 'status', 'active', 'subscription_status', 'free',
      'is_premium', false, 'has_full_access', false, 'show_ads', true,
      'is_trial', false, 'is_pending', false, 'is_blocked', false,
      'remaining_trial_days', 0, 'premium_until', null,
      'source', 'subscriptions:none', 'updated_at', v_now);
  end if;

  -- Keep the same lock order as manual plan changes before reconciling expiry.
  perform 1 from public.clients c where c.id = v_client for update;

  select s.*, c.status as client_status, c.blocked_at as client_blocked_at,
    c.blocked_reason as client_blocked_reason, c.archived_at as client_archived_at,
    c.anonymized_at as client_anonymized_at
  into v_sub
  from public.subscriptions s
  left join public.clients c on c.id = s.client_id
  where s.client_id = v_client
  order by s.updated_at desc nulls last, s.created_at desc
  limit 1 for update of s;
  if not found then
    return jsonb_build_object('user_id', v_target, 'client_id', v_client,
      'plan_code', 'FREE', 'plan_slug', 'free', 'active_plan', 'free',
      'effective_status', 'FREE', 'status', 'active', 'subscription_status', 'free',
      'is_premium', false, 'has_full_access', false, 'show_ads', true,
      'is_trial', false, 'is_pending', false, 'is_blocked', false,
      'remaining_trial_days', 0, 'premium_until', null,
      'source', 'subscriptions:none', 'updated_at', v_now);
  end if;

  -- Only a manual grant with a confirmed end date is reconciled here. A
  -- provider-backed contract and its payment history are never downgraded.
  v_expires := coalesce(v_sub.premium_until, v_sub.plan_expires_at,
    v_sub.current_period_end, v_sub.expires_at);
  if coalesce(v_sub.manual_override, false)
    and v_sub.mercado_pago_subscription_id is null
    and v_sub.active_plan in ('start', 'pro')
    and v_expires is not null and v_expires <= v_now then
    update public.subscriptions s set
      plan_id = (select id from public.plans where slug = 'free' limit 1),
      plan_code = 'FREE', plan_status = 'FREE', subscription_active = false,
      active_plan = 'free', billing_variant = null,
      status = 'active', status_assinatura = 'active', subscription_status = 'free',
      manual_override = false, manual_override_reason = null,
      manual_override_by = null, manual_override_at = null,
      premium_until = null, plan_expires_at = null, current_period_start = null,
      current_period_end = null, expires_at = null, next_billing_at = null,
      proximo_vencimento = null, is_trial_active = false, updated_at = v_now
    where s.id = v_sub.id and s.manual_override is true;
    update public.clients c set active_plan = 'free', plano_atual = 'free',
      subscription_status = 'free', status_assinatura = 'active',
      plan_expires_at = null, updated_at = v_now
    where c.id = v_client;
    insert into public.audit_logs (user_id, client_id, action, details)
    values (null, v_client, 'manual_plan_expired',
      jsonb_build_object('previous_plan', v_sub.active_plan, 'new_plan', 'free',
        'previous_until', v_expires, 'operated_at', v_now,
        'actor', 'automatic_expiry', 'triggered_by_user_id', v_actor));
    select s.*, c.status as client_status, c.blocked_at as client_blocked_at,
      c.blocked_reason as client_blocked_reason, c.archived_at as client_archived_at,
      c.anonymized_at as client_anonymized_at
    into v_sub from public.subscriptions s
    left join public.clients c on c.id = s.client_id where s.id = v_sub.id;
  end if;

  -- A legacy PREMIUM row maps to Pro only when its persisted plan and
  -- expiry/status also authorize access; the string alone never grants access.
  v_plan := case
    when lower(coalesce(v_sub.active_plan, '')) = 'start'
      and upper(coalesce(v_sub.plan_code, '')) = 'START' then 'START'
    when lower(coalesce(v_sub.active_plan, '')) in ('pro', 'premium', 'premium_trial')
      and upper(coalesce(v_sub.plan_code, '')) in ('PRO', 'PREMIUM') then 'PRO'
    else 'FREE'
  end;
  v_expires := coalesce(v_sub.premium_until, v_sub.plan_expires_at,
    v_sub.current_period_end, v_sub.expires_at);
  v_trial_start := coalesce(v_sub.trial_started_at, v_sub.current_period_start);
  v_trial_end := coalesce(v_sub.trial_expires_at, v_sub.plan_expires_at,
    v_sub.current_period_end, v_sub.expires_at);
  v_pending_start := coalesce(v_sub.pending_started_at, v_sub.updated_at, v_sub.created_at);
  v_pending := (coalesce(v_sub.payment_status, '') = 'pending' or v_sub.pending_plan is not null)
    and (v_pending_start is null or v_pending_start >= v_now - interval '24 hours');

  if coalesce(v_sub.plan_status, '') = 'BLOCKED' or v_sub.blocked_at is not null
    or v_sub.client_blocked_at is not null or coalesce(v_sub.client_status, '') = 'blocked' then
    v_status := 'BLOCKED';
  elsif v_plan = 'PRO' and lower(coalesce(v_sub.active_plan, '')) = 'premium_trial'
    and v_trial_end > v_now then
    v_status := 'TRIAL';
  elsif v_plan in ('START', 'PRO')
    and (coalesce(v_sub.subscription_status, v_sub.status, '') = 'active'
      or (coalesce(v_sub.subscription_status, '') = 'canceling' and v_expires is not null))
    and (not coalesce(v_sub.manual_override, false) or v_expires is not null)
    and (v_expires is null or v_expires > v_now) then
    v_status := 'ACTIVE';
  elsif v_plan in ('START', 'PRO') and v_expires is not null and v_expires <= v_now then
    v_status := 'EXPIRED';
  elsif v_pending then
    v_status := 'PENDING';
  elsif coalesce(v_sub.subscription_status, v_sub.status, '') in ('past_due', 'cancelled', 'expired') then
    v_status := 'EXPIRED';
  end if;

  return jsonb_build_object(
    'user_id', coalesce(v_sub.user_id, v_target), 'client_id', v_client,
    'subscription_id', v_sub.id, 'plan_code', v_plan,
    'plan_slug', case when v_status in ('ACTIVE', 'TRIAL') then lower(v_plan) else 'free' end,
    'active_plan', case when v_status in ('ACTIVE', 'TRIAL') then lower(v_plan) else 'free' end,
    'effective_status', v_status,
    'status', case when v_status = 'TRIAL' then 'trialing'
      when v_status = 'PENDING' then 'pending'
      when v_status = 'BLOCKED' then 'blocked'
      when v_status = 'EXPIRED' then 'expired' else 'active' end,
    'subscription_status', case when v_status = 'TRIAL' then 'trialing'
      when v_status = 'ACTIVE' then 'active' else 'free' end,
    'cancel_at_period_end', coalesce(v_sub.cancel_at_period_end, false),
    'payment_status', case when v_pending then 'pending' else coalesce(v_sub.payment_status, 'none') end,
    'pending_plan', case when v_pending then v_sub.pending_plan else null end,
    'is_premium', v_status in ('ACTIVE', 'TRIAL') and v_plan = 'PRO',
    'has_full_access', v_status in ('ACTIVE', 'TRIAL') and v_plan = 'PRO',
    'show_ads', v_status not in ('ACTIVE', 'TRIAL', 'BLOCKED'),
    'is_trial', v_status = 'TRIAL', 'is_trial_active', v_status = 'TRIAL',
    'is_pending', v_status = 'PENDING', 'is_blocked', v_status = 'BLOCKED',
    'remaining_trial_days', case when v_status = 'TRIAL' then
      greatest(0, ceil(extract(epoch from (v_trial_end - v_now)) / 86400.0)::integer) else 0 end,
    'trial_start_at', v_trial_start, 'trial_started_at', v_trial_start,
    'trial_end_at', v_trial_end, 'trial_expires_at', v_trial_end,
    'trial_consumed_at', coalesce(v_sub.trial_consumed_at, v_trial_start),
    'premium_until', case when v_status = 'ACTIVE' then v_expires else null end,
    'expires_at', case when v_status = 'TRIAL' then v_trial_end
      when v_status = 'ACTIVE' then v_expires else null end,
    'current_period_end', case when v_status = 'TRIAL' then v_trial_end
      when v_status = 'ACTIVE' then v_expires else null end,
    'blocked_at', coalesce(v_sub.blocked_at, v_sub.client_blocked_at),
    'blocked_reason', coalesce(v_sub.blocked_reason, v_sub.client_blocked_reason),
    'archived_at', coalesce(v_sub.archived_at, v_sub.client_archived_at),
    'anonymized_at', coalesce(v_sub.anonymized_at, v_sub.client_anonymized_at),
    'manual_override', coalesce(v_sub.manual_override, false),
    'manual_override_reason', v_sub.manual_override_reason,
    'manual_override_at', v_sub.manual_override_at,
    'source', 'subscriptions',
    'updated_at', greatest(coalesce(v_sub.updated_at, v_sub.created_at),
      coalesce(v_sub.manual_override_at, v_sub.created_at), coalesce(v_sub.blocked_at, v_sub.created_at))
  );
end;
$function$;

create or replace function private.superadmin_set_plan_v2(
  target_user_id text, action text, plan_code text, p_until timestamptz, reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $function$
declare
  v_actor uuid := auth.uid();
  v_target uuid := private.s3d_uuid_or_null(target_user_id);
  v_target_user uuid;
  v_client uuid;
  v_subscription uuid;
  v_old_plan text;
  v_old_until timestamptz;
  v_provider_subscription text;
  v_blocked boolean;
  v_plan text := case upper(trim(coalesce(plan_code, '')))
    when 'START' then 'START'
    when 'PRO' then 'PRO'
    when 'PREMIUM' then 'PRO'
    when 'PAID' then 'PRO'
    when 'PAGO' then 'PRO'
    when 'FREE' then 'FREE'
    else null end;
  v_plan_id uuid;
  v_action text := upper(trim(coalesce(action, '')));
begin
  if v_actor is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;
  if not public.erp_is_superadmin() then
    raise exception 'Apenas superadmin pode alterar planos' using errcode = '42501';
  end if;
  if v_target is null then
    raise exception 'Cliente alvo invalido' using errcode = '22023';
  end if;
  if v_action = 'SET_FREE' then
    v_plan := 'FREE';
  elsif v_action not in ('ACTIVATE_PREMIUM_MANUAL', 'SET_PLAN_MANUAL') then
    raise exception 'Acao de plano invalida' using errcode = '22023';
  elsif v_plan not in ('START', 'PRO') then
    raise exception 'Plano manual invalido' using errcode = '22023';
  end if;
  if v_plan in ('START', 'PRO') and (p_until is null or p_until <= now()) then
    raise exception 'A liberacao manual exige uma data de vencimento futura' using errcode = '22023';
  end if;
  select id into v_plan_id from public.plans where slug = lower(v_plan) and active is true limit 1;
  if v_plan_id is null then
    raise exception 'Plano nao encontrado ou inativo: %', v_plan using errcode = 'P0002';
  end if;
  select coalesce(
    (select p.client_id from public.profiles p where p.user_id = v_target and p.client_id is not null limit 1),
    (select ep.client_id from public.erp_profiles ep where ep.id = v_target and ep.client_id is not null limit 1),
    (select s.client_id from public.subscriptions s where s.user_id = v_target order by s.updated_at desc nulls last, s.created_at desc limit 1),
    (select c.id from public.clients c where c.id = v_target limit 1)
  ) into v_client;
  if v_client is null then
    raise exception 'Cliente alvo nao encontrado' using errcode = 'P0002';
  end if;
  -- Serialize manual changes for the same company before checking/inserting its
  -- subscription. The live schema also has a unique client_id constraint.
  perform 1 from public.clients c where c.id = v_client for update;
  if not found then
    raise exception 'Cliente alvo nao encontrado' using errcode = 'P0002';
  end if;
  select u.id into v_target_user from auth.users u where u.id = v_target;
  if v_plan <> 'FREE' and exists (select 1 from public.clients c
    where c.id = v_client and (c.status = 'blocked' or c.blocked_at is not null)) then
    raise exception 'Cliente bloqueado; desbloqueie antes de conceder acesso' using errcode = '42501';
  end if;
  select s.id, s.active_plan, coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at),
    s.mercado_pago_subscription_id,
    (s.blocked_at is not null or s.plan_status = 'BLOCKED' or c.status = 'blocked' or c.blocked_at is not null)
    into v_subscription, v_old_plan, v_old_until, v_provider_subscription, v_blocked
  from public.subscriptions s join public.clients c on c.id = s.client_id
  where s.client_id = v_client
  order by s.updated_at desc nulls last, s.created_at desc limit 1 for update;
  if v_subscription is null then
    insert into public.subscriptions (client_id, user_id, plan_id, active_plan,
      plan_code, plan_status, status, status_assinatura, subscription_status)
    values (v_client, v_target_user, (select id from public.plans where slug = 'free' limit 1),
      'free', 'FREE', 'FREE', 'active', 'active', 'free')
    on conflict (client_id) do nothing
    returning id into v_subscription;
    if v_subscription is null then
      select s.id, s.active_plan,
        coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at),
        s.mercado_pago_subscription_id,
        (s.blocked_at is not null or s.plan_status = 'BLOCKED'
          or c.status = 'blocked' or c.blocked_at is not null)
        into v_subscription, v_old_plan, v_old_until, v_provider_subscription, v_blocked
      from public.subscriptions s join public.clients c on c.id = s.client_id
      where s.client_id = v_client for update of s;
    else
      v_old_plan := 'free';
    end if;
  end if;
  if v_subscription is null then
    raise exception 'Assinatura nao encontrada apos criacao' using errcode = 'P0002';
  end if;
  if v_provider_subscription is not null then
    raise exception 'Assinatura vinculada ao Mercado Pago; altere o contrato pelo fluxo de cobranca' using errcode = '42501';
  end if;
  if v_plan <> 'FREE' and v_blocked then
    raise exception 'Cliente bloqueado; desbloqueie antes de conceder acesso' using errcode = '42501';
  end if;

  update public.subscriptions s
  set plan_id = v_plan_id, plan_code = v_plan,
    plan_status = case when v_plan = 'FREE' then 'FREE' else 'ACTIVE' end,
    subscription_active = v_plan <> 'FREE', active_plan = lower(v_plan),
    billing_variant = case v_plan when 'START' then 'start_monthly'
      when 'PRO' then 'pro_monthly' else null end,
    status = 'active', status_assinatura = 'active',
    subscription_status = case when v_plan = 'FREE' then 'free' else 'active' end,
    payment_status = 'none', pending_plan = null, pending_started_at = null,
    manual_override = v_plan <> 'FREE',
    manual_override_reason = case when v_plan = 'FREE' then null else nullif(trim(reason), '') end,
    manual_override_by = case when v_plan = 'FREE' then null else v_actor end,
    manual_override_at = case when v_plan = 'FREE' then null else now() end,
    premium_until = case when v_plan = 'FREE' then null else p_until end,
    plan_expires_at = case when v_plan = 'FREE' then null else p_until end,
    current_period_start = case when v_plan = 'FREE' then null else coalesce(s.current_period_start, now()) end,
    current_period_end = case when v_plan = 'FREE' then null else p_until end,
    expires_at = case when v_plan = 'FREE' then null else p_until end,
    next_billing_at = case when v_plan = 'FREE' then null else p_until end,
    proximo_vencimento = case when v_plan = 'FREE' then null else p_until end,
    is_trial_active = false,
    blocked_at = s.blocked_at,
    blocked_reason = s.blocked_reason,
    updated_at = now()
  where s.id = v_subscription;
  if not found then
    raise exception 'Assinatura nao atualizada' using errcode = 'P0002';
  end if;
  update public.clients c set status = case when c.status = 'blocked' then 'blocked' else 'active' end,
    active_plan = lower(v_plan),
    plano_atual = lower(v_plan), subscription_status = case when v_plan = 'FREE' then 'free' else 'active' end,
    status_assinatura = 'active',
    blocked_at = c.blocked_at,
    blocked_reason = c.blocked_reason,
    updated_at = now()
  where c.id = v_client;
  if not found then
    raise exception 'Cliente nao atualizado' using errcode = 'P0002';
  end if;
  insert into public.audit_logs (user_id, client_id, action, details)
  values (v_actor, v_client, 'superadmin_update_subscription',
    jsonb_build_object('action', v_action, 'previous_plan', coalesce(v_old_plan, 'free'),
      'new_plan', lower(v_plan), 'previous_until', v_old_until,
      'new_until', case when v_plan = 'FREE' then null else p_until end,
      'reason', reason, 'operated_at', now(), 'actor_user_id', v_actor));
  return private.get_effective_license_impl(v_client::text);
end;
$function$;

create or replace function private.superadmin_reconcile_unblock_v2(p_client uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $function$
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;
  if not public.erp_is_superadmin() then
    raise exception 'Apenas superadmin pode desbloquear planos' using errcode = '42501';
  end if;
  update public.subscriptions s set
    plan_status = case
      when s.plan_code in ('START', 'PRO')
        and (coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at) is null
          or coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at) > now())
        then 'ACTIVE' else 'FREE' end,
    subscription_active = s.plan_code in ('START', 'PRO')
      and (coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at) is null
        or coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at) > now()),
    updated_at = now()
  where s.client_id = p_client;
end;
$function$;

create or replace function public.superadmin_update_subscription(
  target_user_id text, action text, plan_code text default null,
  premium_until timestamptz default null, reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $function$
declare
  v_result jsonb;
begin
  if upper(trim(coalesce(action, ''))) in ('SET_FREE', 'SET_PLAN_MANUAL', 'ACTIVATE_PREMIUM_MANUAL') then
    return private.superadmin_set_plan_v2(target_user_id, action, plan_code, premium_until, reason);
  end if;
  -- Preserve the existing non-plan administrative actions and their contracts.
  v_result := private.superadmin_update_subscription_impl(target_user_id, action, plan_code, premium_until, reason);
  if upper(trim(coalesce(action, ''))) = 'UNBLOCK' and v_result->>'client_id' is not null then
    perform private.superadmin_reconcile_unblock_v2(private.s3d_uuid_or_null(v_result->>'client_id'));
  end if;
  return private.get_effective_license_impl(coalesce(v_result->>'client_id', target_user_id));
end;
$function$;

revoke all on function private.superadmin_set_plan_v2(text, text, text, timestamptz, text) from public, anon;
grant execute on function private.superadmin_set_plan_v2(text, text, text, timestamptz, text) to authenticated, service_role;
revoke all on function private.superadmin_reconcile_unblock_v2(uuid) from public, anon;
grant execute on function private.superadmin_reconcile_unblock_v2(uuid) to authenticated, service_role;
revoke all on function public.superadmin_update_subscription(text, text, text, timestamptz, text) from public, anon;
grant execute on function public.superadmin_update_subscription(text, text, text, timestamptz, text) to authenticated, service_role;

commit;
