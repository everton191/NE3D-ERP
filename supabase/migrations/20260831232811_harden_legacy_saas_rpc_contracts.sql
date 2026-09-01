-- Mantem a assinatura RPC para clientes instalados, mas elimina o cadastro em
-- planos legados premium_trial/premium. Novas contas sempre iniciam no Free.
do $contract$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.register_saas_client(text,text,text,text,text,integer)'::regprocedure)
  into function_sql;

  function_sql := replace(function_sql, $$p_plan_slug text DEFAULT 'premium_trial'::text$$, $$p_plan_slug text DEFAULT 'free'::text$$);
  function_sql := replace(function_sql, 'p_trial_days integer DEFAULT 7', 'p_trial_days integer DEFAULT 0');
  function_sql := replace(function_sql, 'v_trial_days integer := 7;', 'v_trial_days integer := 0;');
  function_sql := replace(function_sql, $$v_end timestamptz := now() + interval '7 days';$$, $$v_end timestamptz := null;$$);
  function_sql := replace(function_sql, $$where slug = 'premium_trial'$$, $$where slug = 'free'$$);
  function_sql := replace(function_sql, $$false, 'premium_first_month', v_start, v_end$$, $$false, 'free', v_start, v_end$$);
  function_sql := replace(
    function_sql,
    E'begin\n  if v_user_id is null then',
    $$begin
  if lower(coalesce(nullif(trim(p_plan_slug), ''), 'free')) <> 'free' then
    raise exception 'Plano inicial invalido';
  end if;

  if coalesce(p_trial_days, 0) <> 0 then
    raise exception 'Trial nao esta disponivel';
  end if;

  if v_user_id is null then$$
  );

  if position($$where slug = 'free'$$ in function_sql) = 0 then
    raise exception 'Nao foi possivel atualizar o contrato de register_saas_client';
  end if;

  execute function_sql;
end;
$contract$;

do $promo$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.redeem_promotional_token(text)'::regprocedure)
  into function_sql;
  function_sql := replace(
    function_sql,
    E'begin\n  raise exception',
    $$begin
  if nullif(trim(p_codigo), '') is null then
    raise exception 'Codigo promocional obrigatorio';
  end if;

  raise exception$$
  );
  execute function_sql;
end;
$promo$;
