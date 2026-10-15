begin;

-- Keep the existing cleanup rules in one implementation. Only the server-only
-- maintenance wrapper may request all clients; ordinary callers supply one ID.
create or replace function private.s3d_reconcile_subscription_state(p_client_id uuid, p_all_clients boolean)
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_changed integer := 0;
  v_rows integer := 0;
begin
  if p_all_clients is null or (p_all_clients and p_client_id is not null)
    or (not p_all_clients and p_client_id is null) then
    raise exception 'Escopo de reconciliacao invalido' using errcode = '22023';
  end if;

  update public.subscriptions s
  set pending_plan = null, payment_status = 'none', pending_started_at = null, updated_at = now()
  where (p_all_clients or s.client_id = p_client_id)
    and s.payment_status = 'pending'
    and coalesce(s.pending_started_at, s.updated_at, s.created_at) < now() - interval '24 hours';
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  update public.subscriptions s
  set active_plan = 'free',
      plan_id = (select id from public.plans where slug = 'free' limit 1),
      status = 'active', status_assinatura = 'active', subscription_status = 'free',
      current_period_start = null, current_period_end = null, expires_at = null,
      next_billing_at = null, proximo_vencimento = null, plan_expires_at = null,
      is_trial_active = false, updated_at = now()
  where (p_all_clients or s.client_id = p_client_id)
    and (s.active_plan = 'premium_trial' or s.is_trial_active is true)
    and coalesce(s.trial_expires_at, s.plan_expires_at, s.current_period_end, s.expires_at) < now();
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  update public.subscriptions s
  set active_plan = 'free',
      plan_id = (select id from public.plans where slug = 'free' limit 1),
      status = 'active', status_assinatura = 'active', subscription_status = 'free',
      current_period_start = null, current_period_end = null, expires_at = null,
      next_billing_at = null, proximo_vencimento = null, plan_expires_at = null, updated_at = now()
  where (p_all_clients or s.client_id = p_client_id)
    and s.active_plan = 'premium' and s.subscription_status = 'active'
    and s.plan_expires_at is not null and s.plan_expires_at < now();
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  update public.clients c
  set active_plan = s.active_plan, pending_plan = s.pending_plan,
      payment_status = s.payment_status, subscription_status = s.subscription_status,
      plan_expires_at = s.plan_expires_at, plan_price = s.plan_price, price_locked = s.price_locked,
      trial_started_at = s.trial_started_at, trial_expires_at = s.trial_expires_at,
      is_trial_active = s.is_trial_active, plano_atual = s.active_plan, status_assinatura = s.status,
      status = case when c.status = 'blocked' then 'blocked'
        when s.subscription_status in ('past_due', 'cancelled', 'expired') then 'overdue'
        else 'active' end,
      updated_at = now()
  from public.subscriptions s
  where s.client_id = c.id and (p_all_clients or c.id = p_client_id);
  get diagnostics v_rows = row_count;
  return v_changed + v_rows;
end;
$$;

alter function private.s3d_reconcile_subscription_state(uuid, boolean) owner to postgres;
revoke all on function private.s3d_reconcile_subscription_state(uuid, boolean) from public, anon, authenticated, service_role;

create or replace function public.s3d_cleanup_subscription_state()
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  return private.s3d_reconcile_subscription_state(null, true);
end;
$$;
revoke all on function public.s3d_cleanup_subscription_state() from public, anon, authenticated;
grant execute on function public.s3d_cleanup_subscription_state() to service_role;

-- Preserve signatures, bodies and existing grants. Abort on an unexpected
-- deployed definition instead of silently leaving a global call reachable.
do $scope$
declare
  v_target record;
  v_definition text;
  v_old constant text := 'perform public.s3d_cleanup_subscription_state();';
  v_new text;
begin
  for v_target in select * from (values
    ('public.register_saas_client(text,text,text,text,text,integer)', 'v_client_id'),
    ('public.handle_new_saas_auth_user()', 'v_client_id'),
    ('public.sync_saas_user_after_login(text,text,text)', 'v_client_id'),
    ('private.s3d_apply_payment_to_subscription()', 'v_subscription.client_id')
  ) as targets(signature, client_expression)
  loop
    v_definition := pg_get_functiondef(v_target.signature::regprocedure);
    v_new := format('perform private.s3d_reconcile_subscription_state(%s, false);', v_target.client_expression);
    if position(v_old in v_definition) = 0 and
      (length(v_definition) - length(replace(v_definition, v_new, ''))) / length(v_new) = 1 then
      continue;
    end if;
    if (length(v_definition) - length(replace(v_definition, v_old, ''))) / length(v_old) <> 1 then
      raise exception 'Chamada de reconciliacao inesperada: %', v_target.signature;
    end if;
    execute replace(v_definition, v_old, v_new);
  end loop;
end;
$scope$;

-- Registration and post-login only insert Free subscriptions. Free has no
-- recurring billing variant (NULL). Both 'free' and the removed legacy variant
-- violate the current CHECK even on the ON CONFLICT path for an existing user.
do $login$
declare
  v_signature text;
  v_definition text;
  v_old text;
  v_new constant text := 'false, null, v_start, v_end';
begin
  foreach v_signature in array array[
    'public.register_saas_client(text,text,text,text,text,integer)',
    'public.sync_saas_user_after_login(text,text,text)'
  ] loop
    v_definition := pg_get_functiondef(v_signature::regprocedure);
    if position(v_new in v_definition) > 0 then continue; end if;
    v_old := case when position('false, ''premium_first_month'', v_start, v_end' in v_definition) > 0
      then 'false, ''premium_first_month'', v_start, v_end'
      else 'false, ''free'', v_start, v_end' end;
    if (length(v_definition) - length(replace(v_definition, v_old, ''))) / length(v_old) <> 1 then
      raise exception 'Variante de cadastro inesperada: %', v_signature;
    end if;
    execute replace(v_definition, v_old, v_new);
  end loop;
end;
$login$;

notify pgrst, 'reload schema';
commit;
