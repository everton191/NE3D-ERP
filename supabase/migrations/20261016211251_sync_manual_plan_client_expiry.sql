begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Change only the client mirror in the installed manual-plan function. Keeping
-- its current definition preserves the newer payment projection authority,
-- authorization, provider protection, audit, owner and EXECUTE privileges.
-- No existing client/subscription rows are rewritten on installation.
do $client_expiry$
declare
  v_definition text := replace(pg_get_functiondef(
    'private.superadmin_set_plan_v2(text,text,text,timestamptz,text)'::regprocedure), E'\r\n', E'\n');
  v_anchor constant text := E'    status_assinatura = ''active'',\n    blocked_at = c.blocked_at,';
  v_replacement constant text := E'    status_assinatura = ''active'',\n    plan_expires_at = case when v_plan = ''FREE'' then null else p_until end,\n    blocked_at = c.blocked_at,';
begin
  if (length(v_definition) - length(replace(v_definition, v_anchor, ''))) / length(v_anchor) <> 1
    or position('if not public.erp_is_superadmin() then' in v_definition) = 0
    or position('if v_provider_subscription is not null then' in v_definition) = 0
    or position('private.manual_plan_projection_authority' in v_definition) = 0 then
    raise exception 'Contrato da concessao manual inesperado; espelho de validade nao alterado';
  end if;
  execute replace(v_definition, v_anchor, v_replacement);
end;
$client_expiry$;

commit;
