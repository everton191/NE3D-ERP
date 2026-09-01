-- Compatibilidade de transporte: APKs antigos podem continuar enviando os
-- parametros premium/trial, mas a funcao sempre grava o estado comercial Free.
do $compatibility$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.register_saas_client(text,text,text,text,text,integer)'::regprocedure)
  into function_sql;

  function_sql := replace(
    function_sql,
    $$lower(coalesce(nullif(trim(p_plan_slug), ''), 'free')) <> 'free'$$,
    $$lower(coalesce(nullif(trim(p_plan_slug), ''), 'free')) not in ('free', 'premium', 'premium_trial')$$
  );
  function_sql := replace(
    function_sql,
    $$coalesce(p_trial_days, 0) <> 0$$,
    $$coalesce(p_trial_days, 0) not in (0, 7)$$
  );

  if position($$not in ('free', 'premium', 'premium_trial')$$ in function_sql) = 0
     or position($$not in (0, 7)$$ in function_sql) = 0 then
    raise exception 'Contrato de compatibilidade do cadastro nao foi atualizado';
  end if;

  execute function_sql;
end;
$compatibility$;
