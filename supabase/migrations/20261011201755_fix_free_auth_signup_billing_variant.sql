-- The legacy signup trigger still writes premium_first_month on a Free row.
-- The current subscriptions check only permits start_monthly/pro_monthly.
-- Replace this one stale literal without rewriting the signup contract.
begin;

do $migration$
declare
  v_definition text;
  v_needle text := quote_literal('premium_first_month');
  v_occurrences integer;
begin
  select pg_get_functiondef('public.handle_new_saas_auth_user()'::regprocedure)
    into v_definition;
  v_occurrences := (length(v_definition) - length(replace(v_definition, v_needle, '')))
    / length(v_needle);
  if v_occurrences <> 1 then
    raise exception 'Cadastro Auth inesperado: esperado um billing_variant legado, encontrado %',
      v_occurrences;
  end if;
  execute replace(v_definition, v_needle, 'null');
end;
$migration$;

alter function public.handle_new_saas_auth_user()
  set search_path = pg_catalog, public, auth;
revoke execute on function public.handle_new_saas_auth_user()
  from public, anon, authenticated;

commit;
