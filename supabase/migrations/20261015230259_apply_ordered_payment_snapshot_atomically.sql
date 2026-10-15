begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Fail during installation, not at the first real payment, if the required
-- earlier ON CONFLICT fix was omitted from a manually restored environment.
do $dependency$
begin
  if not exists(select 1 from pg_index i join pg_attribute a
    on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.erp_payments'::regclass and i.indisunique and i.indisvalid
      and i.indpred is null and i.indnkeyatts = 1 and a.attname = 'payment_id') then
    raise exception 'Aplicar antes 20261015152405_support_erp_payment_upsert.sql' using errcode = '55000';
  end if;
end;
$dependency$;

-- Only the trusted provider reader may ingest a financial snapshot. Keep the
-- existing payment trigger as the single authority for credit and refund review.
create function public.apply_mercadopago_payment(
  p_client_id uuid, p_user_id uuid, p_plan_slug text,
  p_billing_variant text, p_payment jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_id text := nullif(trim(p_payment->>'id'), '');
  v_version timestamptz;
  v_previous_version timestamptz;
  v_created timestamptz;
  v_paid timestamptz;
  v_previous_paid timestamptz;
  v_timestamp text;
  v_status text;
  v_plan text;
  v_plan_id uuid;
  v_amount numeric;
  v_method text := nullif(coalesce(p_payment->>'payment_method_id', p_payment->>'payment_type_id'), '');
  v_contract text := nullif(coalesce(p_payment->>'preapproval_id', p_payment->>'subscription_id',
    p_payment->'metadata'->>'mercado_pago_subscription_id'), '');
  v_preference text := nullif(coalesce(p_payment->>'preference_id', p_payment->'metadata'->>'preference_id'), '');
  v_existing public.payments%rowtype;
  v_sub public.subscriptions%rowtype;
  v_client public.clients%rowtype;
  v_erp public.erp_payments%rowtype;
  v_payment_id uuid;
  v_apply boolean := true;
begin
  if p_client_id is null or p_user_id is null or v_id is null
    or jsonb_typeof(p_payment) is distinct from 'object' then
    raise exception 'Identidade do pagamento obrigatoria' using errcode = '22023';
  end if;
  -- Provider timestamps, never delivery/worker time, order revisions of ONE
  -- payment. Reject relative/infinite/unzoned timestamps instead of guessing.
  foreach v_timestamp in array array[p_payment->>'date_last_updated',
    p_payment->>'date_created', p_payment->>'date_approved'] loop
    if v_timestamp is not null and v_timestamp !~
      '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then
      raise exception 'Data do provedor invalida' using errcode = '22023';
    end if;
  end loop;
  begin
    v_version := (p_payment->>'date_last_updated')::timestamptz;
    v_created := coalesce((p_payment->>'date_created')::timestamptz, v_version);
    v_paid := (p_payment->>'date_approved')::timestamptz;
  exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'Data do provedor invalida' using errcode = '22023';
  end;
  if v_version is null then
    raise exception 'date_last_updated do provedor obrigatoria' using errcode = '22023';
  end if;
  v_status := case lower(p_payment->>'status')
    when 'approved' then 'approved' when 'cancelled' then 'cancelled' when 'canceled' then 'cancelled'
    when 'refunded' then 'refunded' when 'charged_back' then 'charged_back'
    when 'rejected' then 'rejected' else 'pending' end;
  if v_status = 'approved' and v_paid is null then
    raise exception 'date_approved obrigatoria para pagamento aprovado' using errcode = '22023';
  end if;
  v_amount := coalesce((p_payment->>'transaction_amount')::numeric,
    (p_payment->>'total_paid_amount')::numeric, 0);
  if v_amount < 0 or v_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Valor do pagamento invalido' using errcode = '22023';
  end if;
  v_plan := case p_plan_slug when 'start' then 'start' when 'pro' then 'pro' when 'premium' then 'pro' end;
  if v_plan is null or p_billing_variant is null
    or (v_plan = 'start' and p_billing_variant <> 'start_monthly')
    or (v_plan = 'pro' and p_billing_variant not in ('pro_monthly', 'premium_monthly', 'premium_first_month')) then
    raise exception 'Plano ou variante invalida' using errcode = '22023';
  end if;
  select id into v_plan_id from public.plans where slug = v_plan and active = true;
  if v_plan_id is null then raise exception 'Plano indisponivel' using errcode = '22023'; end if;

  -- Serialize payment -> trigger -> mirror as one client-scoped transaction.
  -- NO KEY UPDATE coexists with the FK KEY SHARE acquired by payment inserts.
  select * into v_client from public.clients where id = p_client_id for no key update;
  if v_client.id is null then raise exception 'Cliente inexistente' using errcode = '23503'; end if;
  -- These identities come from the server-authorized checkout metadata read
  -- back from the provider, NOT a browser RPC. A superadmin may have created
  -- that checkout for another client; current profile linkage is not proof of
  -- historical ownership. Ordinary/frontend-admin sessions cannot call this RPC.
  select * into v_sub from public.subscriptions where client_id = p_client_id for no key update;
  select * into v_existing from public.payments where mercado_pago_payment_id = v_id for no key update;
  select * into v_erp from public.erp_payments where payment_id = v_id for no key update;
  if (v_existing.id is not null and (v_existing.client_id is distinct from p_client_id
      or (v_existing.user_id is not null and v_existing.user_id is distinct from p_user_id)
      or (v_existing.subscription_id is not null and v_existing.subscription_id is distinct from v_sub.id)))
    or (v_erp.id is not null and v_erp.cliente_id is distinct from p_client_id) then
    raise exception 'Identidade persistida do pagamento conflitante' using errcode = '23503';
  end if;
  if v_existing.id is not null then
    -- Read a legacy provider version without rewriting historical financial rows.
    v_timestamp := v_existing.metadata->>'date_last_updated';
    if v_timestamp is not null then
      if v_timestamp !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then
        raise exception 'Versao historica invalida exige revisao' using errcode = '22023';
      end if;
      v_previous_version := v_timestamp::timestamptz;
    end if;
    if v_version < v_previous_version then
      return jsonb_build_object('applied', false, 'reason', 'older_provider_version');
    end if;
    if v_version = v_previous_version then
      v_previous_paid := coalesce((v_existing.metadata->>'date_approved')::timestamptz, v_existing.paid_at);
      -- Compare financial meaning, not incidental provider metadata/JSON order.
      if v_existing.status is distinct from v_status or v_existing.amount is distinct from v_amount
        or (case v_existing.plan_slug when 'premium' then 'pro' else v_existing.plan_slug end) is distinct from v_plan
        or v_existing.billing_variant is distinct from p_billing_variant
        or v_existing.mercado_pago_subscription_id is distinct from v_contract
        or v_previous_paid is distinct from v_paid then
        raise exception 'Mesma versao com dados financeiros conflitantes exige nova consulta' using errcode = '22023';
      end if;
      v_apply := false;
      if v_erp.id is not null and v_erp.status = v_status and v_erp.valor = v_amount
        and (case v_erp.plano when 'premium' then 'pro' else v_erp.plano end) = v_plan
        and v_erp.billing_variant = p_billing_variant
        and v_erp.subscription_id is not distinct from v_contract
        and v_erp.payload->>'date_last_updated' = p_payment->>'date_last_updated' then
        return jsonb_build_object('applied', false, 'reason', 'same_provider_version');
      end if;
    end if;
  end if;

  if v_sub.id is null then
    insert into public.subscriptions(client_id, user_id, plan_id, active_plan, plan_code,
      plan_status, status, status_assinatura, subscription_status, billing_variant)
    values(p_client_id, p_user_id, (select id from public.plans where slug = 'free'),
      'free', 'FREE', 'FREE', 'active', 'active', 'free', null) returning * into v_sub;
  end if;
  if v_apply then
    insert into public.payments as target(client_id, user_id, subscription_id, plan_id,
      mercado_pago_payment_id, mercado_pago_subscription_id, preference_id, amount, plan_price,
      status, payment_method, metodo_pagamento, external_reference, plan_slug, billing_variant,
      paid_at, criado_em, atualizado_em, metadata)
    values(p_client_id, p_user_id, v_sub.id, v_plan_id, v_id, v_contract, v_preference,
      v_amount, v_amount, v_status, v_method, v_method, coalesce(p_payment->>'external_reference', ''),
      p_plan_slug, p_billing_variant, v_paid, v_created, clock_timestamp(),
      p_payment || jsonb_build_object('user_id', p_user_id, 'plan_id', p_plan_slug, 'billing_variant', p_billing_variant))
    on conflict(mercado_pago_payment_id) do update set
      user_id = coalesce(target.user_id, excluded.user_id),
      subscription_id = coalesce(target.subscription_id, excluded.subscription_id),
      plan_id = excluded.plan_id, mercado_pago_subscription_id = excluded.mercado_pago_subscription_id,
      preference_id = excluded.preference_id, amount = excluded.amount, plan_price = excluded.plan_price,
      status = excluded.status, payment_method = excluded.payment_method, metodo_pagamento = excluded.metodo_pagamento,
      external_reference = excluded.external_reference, plan_slug = excluded.plan_slug,
      billing_variant = excluded.billing_variant, paid_at = excluded.paid_at, criado_em = excluded.criado_em,
      atualizado_em = excluded.atualizado_em, metadata = excluded.metadata
    -- A simultaneous FIRST insertion from another tenant must never reassign it.
    where target.client_id = excluded.client_id and (target.user_id is null or target.user_id = excluded.user_id)
      and (target.subscription_id is null or target.subscription_id = excluded.subscription_id)
    returning id into v_payment_id;
    if v_payment_id is null then raise exception 'Pagamento ja pertence a outro escopo' using errcode = '23503'; end if;
  end if;

  -- An identical retry may repair a legacy missing ERP mirror, without firing
  -- the credit trigger again or duplicating the financial audit.
  insert into public.erp_payments as target(payment_id, subscription_id, preference_id,
    external_reference, cliente_id, cliente_codigo, plano, billing_variant, valor, status, metodo_pagamento, payload, atualizado_em)
  values(v_id, v_contract, v_preference, coalesce(p_payment->>'external_reference', ''),
    p_client_id, v_client.client_code, p_plan_slug, p_billing_variant, v_amount, v_status, v_method, p_payment, clock_timestamp())
  on conflict(payment_id) do update set subscription_id = excluded.subscription_id,
    preference_id = excluded.preference_id, external_reference = excluded.external_reference,
    cliente_codigo = excluded.cliente_codigo, plano = excluded.plano, billing_variant = excluded.billing_variant,
    valor = excluded.valor, status = excluded.status, metodo_pagamento = excluded.metodo_pagamento,
    payload = excluded.payload, atualizado_em = excluded.atualizado_em
  where target.cliente_id = excluded.cliente_id
  returning * into v_erp;
  if v_erp.id is null then raise exception 'Espelho financeiro pertence a outro escopo' using errcode = '23503'; end if;

  select * into strict v_sub from public.subscriptions where id = v_sub.id;
  update public.clients set active_plan = v_sub.active_plan, plano_atual = v_sub.active_plan,
    pending_plan = v_sub.pending_plan, cancel_at_period_end = v_sub.cancel_at_period_end,
    payment_status = v_sub.payment_status, subscription_status = v_sub.subscription_status,
    status_assinatura = case when v_sub.cancel_at_period_end then 'canceling' else v_sub.subscription_status end,
    plan_price = v_sub.plan_price, price_locked = v_sub.price_locked,
    plan_expires_at = coalesce(v_sub.premium_until, v_sub.plan_expires_at, v_sub.current_period_end),
    blocked_at = coalesce(v_sub.blocked_at, blocked_at),
    blocked_reason = coalesce(v_sub.blocked_reason, blocked_reason),
    status = case when status = 'anonymized' then status
      when status = 'blocked' or v_sub.plan_status = 'BLOCKED' then 'blocked' else 'active' end,
    updated_at = clock_timestamp()
  where id = p_client_id;
  if not found then raise exception 'Cliente nao atualizado' using errcode = 'P0002'; end if;
  if v_apply then
    insert into public.audit_logs(user_id, client_id, action, details)
    values(p_user_id, p_client_id, case v_status when 'approved' then 'pagamento aprovado'
      when 'pending' then 'pagamento pendente' else 'pagamento recusado' end,
      jsonb_build_object('provider', 'mercado_pago', 'status', v_status, 'payment_id', v_id,
        'amount', v_amount, 'plan', p_plan_slug, 'effective_status', v_sub.plan_status,
        'premium_until', coalesce(v_sub.premium_until, v_sub.plan_expires_at), 'provider_last_updated', v_version));
  end if;
  return jsonb_build_object('applied', v_apply, 'reason', case when v_apply then 'updated' else 'same_provider_version' end);
end;
$function$;
revoke all on function public.apply_mercadopago_payment(uuid,uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.apply_mercadopago_payment(uuid,uuid,text,text,jsonb) to service_role;
-- No historical rows are rewritten. Roll back the caller before dropping the RPC.
notify pgrst, 'reload schema';
commit;
