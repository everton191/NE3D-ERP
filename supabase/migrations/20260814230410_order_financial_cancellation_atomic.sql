-- Atomic cancellation bridge for the Simplifica 3D local-first order flow.
-- Additive: preserves the existing sale RPC and makes a full order cancellation
-- create one idempotent refund operation, one cash reversal and refreshed session totals.

create or replace function public.register_order_financial_cancellation(
  p_empresa_id uuid,
  p_sale_id text,
  p_refund_amount numeric,
  p_operation_uuid uuid,
  p_client_request_id text default null,
  p_request_hash text default null,
  p_created_from_device text default null,
  p_metadata_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.erp_financial_operations%rowtype;
  v_operation_id uuid;
  v_session_id uuid;
  v_movement_id uuid;
  v_movement_operation_uuid uuid;
  v_original_movement record;
  v_refund_piece numeric;
  v_refund_remaining numeric;
  v_session uuid;
  v_session_ids uuid[] := '{}';
  v_movement_ids uuid[] := '{}';
  v_result jsonb;
begin
  if p_empresa_id is null or nullif(p_sale_id, '') is null or p_operation_uuid is null then
    raise exception 'empresa_id, sale_id and operation_uuid are required';
  end if;
  if coalesce(p_refund_amount, 0) < 0 then
    raise exception 'refund amount must be nonnegative';
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
      empresa_id, operation_uuid, client_request_id, request_hash,
      created_from_device, operation_type, status, sale_id, payload_json, created_by
    ) values (
      p_empresa_id, p_operation_uuid, p_client_request_id, p_request_hash,
      p_created_from_device, 'refund', 'processing', p_sale_id,
      jsonb_build_object(
        'sale_id', p_sale_id,
        'total_amount', 0,
        'refund_amount', coalesce(p_refund_amount, 0),
        'metadata', coalesce(p_metadata_json, '{}'::jsonb) || jsonb_build_object('event_type', 'cancel')
      ),
      auth.uid()
    ) returning id into v_operation_id;
  end if;

  v_refund_remaining := coalesce(p_refund_amount, 0);
  if coalesce(p_refund_amount, 0) > 0 then
    for v_original_movement in
      select cm.id, cm.session_id, cm.payment_method_id, cm.amount
      from public.cash_movements cm
      where cm.empresa_id = p_empresa_id
        and cm.reference_collection = 'pedidos'
        and cm.reference_id = p_sale_id
        and cm.type = 'sale'
        and cm.cancelled_at is null
      order by cm.created_at asc, cm.id asc
    loop
      exit when v_refund_remaining <= 0;
      v_refund_piece := least(v_original_movement.amount, v_refund_remaining);
      v_movement_operation_uuid := md5(p_operation_uuid::text || ':' || v_original_movement.id::text)::uuid;
      v_movement_id := public.register_cash_movement(
        p_empresa_id,
        v_original_movement.session_id,
        'estorno',
        v_refund_piece,
        v_original_movement.payment_method_id,
        'Estorno pedido ' || p_sale_id,
        'pedidos',
        p_sale_id,
        coalesce(p_metadata_json, '{}'::jsonb) || jsonb_build_object(
          'event_type', 'cancel',
          'source_movement_id', v_original_movement.id
        ),
        v_movement_operation_uuid,
        coalesce(p_client_request_id, p_operation_uuid::text) || ':' || v_original_movement.id::text,
        md5(coalesce(p_request_hash, p_operation_uuid::text) || ':' || v_original_movement.id::text),
        p_created_from_device,
        v_operation_id
      );
      v_movement_ids := array_append(v_movement_ids, v_movement_id);
      if not (v_original_movement.session_id = any(v_session_ids)) then
        v_session_ids := array_append(v_session_ids, v_original_movement.session_id);
      end if;
      if v_session_id is null then
        v_session_id := v_original_movement.session_id;
      end if;
      v_refund_remaining := v_refund_remaining - v_refund_piece;
    end loop;

    if v_refund_remaining > 0.005 then
      raise exception 'refund amount exceeds registered sale cash movements for sale %', p_sale_id;
    end if;

    update public.sale_payments
    set payment_status = 'refunded',
        metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
          'refunded_by_operation_id', v_operation_id,
          'refunded_at', now()
        )
    where empresa_id = p_empresa_id
      and sale_id = p_sale_id
      and payment_status = 'approved';
  end if;

  foreach v_session in array v_session_ids
  loop
    update public.cash_sessions
    set expected_balance = opening_balance + coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        where cm.session_id = v_session
          and cm.type in ('sale', 'suprimento', 'adjustment', 'opening')
      ), 0) - coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        where cm.session_id = v_session
          and cm.type in ('sangria', 'retirada', 'estorno', 'closing')
      ), 0),
      expected_cash_total = opening_balance + coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        join public.payment_methods pm on pm.id = cm.payment_method_id
        where cm.session_id = v_session
          and cm.type in ('sale', 'suprimento', 'adjustment', 'opening')
          and pm.type = 'cash'
      ), 0) - coalesce((
        select sum(cm.amount)
        from public.cash_movements cm
        join public.payment_methods pm on pm.id = cm.payment_method_id
        where cm.session_id = v_session
          and cm.type in ('sangria', 'retirada', 'estorno', 'closing')
          and pm.type = 'cash'
      ), 0),
      payments_summary_json = coalesce((
        select jsonb_object_agg(coalesce(pm.type, 'other'), totals.total_amount)
        from (
          select payment_method_id, sum(amount) as total_amount
          from public.sale_payments
          where session_id = v_session and payment_status = 'approved'
          group by payment_method_id
        ) totals
        left join public.payment_methods pm on pm.id = totals.payment_method_id
      ), '{}'::jsonb)
    where id = v_session;
  end loop;

  v_result := jsonb_build_object(
    'operation_id', v_operation_id,
    'session_id', v_session_id,
    'sale_id', p_sale_id,
    'movement_ids', to_jsonb(v_movement_ids),
    'refund_amount', coalesce(p_refund_amount, 0)
  );

  update public.erp_financial_operations
  set status = 'completed', session_id = v_session_id, result_json = v_result, error_message = null
  where id = v_operation_id;

  return v_result;
end;
$$;

revoke execute on function public.register_order_financial_cancellation(uuid, text, numeric, uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.register_order_financial_cancellation(uuid, text, numeric, uuid, text, text, text, jsonb) to authenticated, service_role;

-- Existing SECURITY DEFINER finance entry points validate membership internally,
-- but they must not remain executable by anonymous/public roles.
revoke execute on function public.ensure_default_payment_methods(uuid) from public, anon;
revoke execute on function public.get_or_create_cash_session(uuid, uuid, numeric, text) from public, anon;
revoke execute on function public.register_cash_movement(uuid, uuid, text, numeric, uuid, text, text, text, jsonb, uuid, text, text, text, uuid) from public, anon;
revoke execute on function public.register_sale_financial_operation(uuid, text, numeric, jsonb, uuid, text, text, text, uuid, jsonb) from public, anon;

comment on function public.register_order_financial_cancellation(uuid, text, numeric, uuid, text, text, text, jsonb)
is 'Idempotent full order cancellation: canonical zero-sale state, cash reversal and refreshed session totals.';
