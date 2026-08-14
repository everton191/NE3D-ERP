-- Normalize array initializers reported by plpgsql_check in the two financial
-- RPCs used by the Simplifica 3D order flow. The function bodies are preserved;
-- only the declaration expressions are made explicit.
do $migration$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.register_sale_financial_operation(uuid,text,numeric,jsonb,uuid,text,text,text,uuid,jsonb)'::regprocedure::oid
  ) into v_definition;
  v_definition := replace(v_definition, 'v_payment_ids uuid[] := ''{}''', 'v_payment_ids uuid[] := ARRAY[]::uuid[]');
  v_definition := replace(v_definition, 'v_movement_ids uuid[] := ''{}''', 'v_movement_ids uuid[] := ARRAY[]::uuid[]');
  if position('ARRAY[]::uuid[]' in v_definition) = 0 then
    raise exception 'sale financial function array initializer was not found';
  end if;
  execute v_definition;

  select pg_get_functiondef(
    'public.register_order_financial_cancellation(uuid,text,numeric,uuid,text,text,text,jsonb)'::regprocedure::oid
  ) into v_definition;
  v_definition := replace(v_definition, 'v_session_ids uuid[] := ''{}''', 'v_session_ids uuid[] := ARRAY[]::uuid[]');
  v_definition := replace(v_definition, 'v_movement_ids uuid[] := ''{}''', 'v_movement_ids uuid[] := ARRAY[]::uuid[]');
  if position('ARRAY[]::uuid[]' in v_definition) = 0 then
    raise exception 'cancellation financial function array initializer was not found';
  end if;
  execute v_definition;

  revoke execute on function public.register_sale_financial_operation(uuid, text, numeric, jsonb, uuid, text, text, text, uuid, jsonb) from public, anon;
  revoke execute on function public.register_order_financial_cancellation(uuid, text, numeric, uuid, text, text, text, jsonb) from public, anon;
  grant execute on function public.register_sale_financial_operation(uuid, text, numeric, jsonb, uuid, text, text, text, uuid, jsonb) to authenticated, service_role;
  grant execute on function public.register_order_financial_cancellation(uuid, text, numeric, uuid, text, text, text, jsonb) to authenticated, service_role;
end
$migration$;
