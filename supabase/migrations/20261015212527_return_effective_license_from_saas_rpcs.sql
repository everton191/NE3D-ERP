begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Keep installed-client signatures, identity fields, provisioning and grants.
-- The Free catalog row is for INSERT only, never the existing tenant's license.
-- Reuse the canonical resolver with an explicit authenticated identity so that
-- a superadmin's unrestricted UI access does not replace its commercial plan.
do $response$
declare
  v_signature text;
  v_definition text;
  v_tail text;
  v_anchor constant text := '  return jsonb_build_object(';
  v_suffix constant text := E'\n  ) || (public.get_effective_license(v_user_id::text)\n    - array[''user_id'', ''client_id'', ''subscription_id'']);';
begin
  foreach v_signature in array array[
    'public.register_saas_client(text,text,text,text,text,integer)',
    'public.sync_saas_user_after_login(text,text,text)'
  ] loop
    v_definition := replace(pg_get_functiondef(v_signature::regprocedure), E'\r\n', E'\n');
    if position(v_suffix in v_definition) > 0 then continue; end if;
    if (length(v_definition) - length(replace(v_definition, v_anchor, ''))) / length(v_anchor) <> 1
      or position('perform private.s3d_reconcile_subscription_state(v_client_id, false);' in v_definition) = 0 then
      raise exception 'Contrato de resposta SaaS inesperado: %', v_signature;
    end if;
    v_tail := substr(v_definition, position(v_anchor in v_definition));
    if position('''active_plan'', coalesce(v_plan.slug, ''free'')' in v_tail) = 0
      or (length(v_tail) - length(replace(v_tail, E'\n  );', ''))) / length(E'\n  );') <> 1 then
      raise exception 'Retorno SaaS inesperado: %', v_signature;
    end if;
    execute replace(v_definition, v_tail, replace(v_tail, E'\n  );', v_suffix));
  end loop;
end;
$response$;

-- This installation changes no customer rows, policies, function signatures,
-- grants or gateway contracts. Expiry reconciliation occurs on authenticated
-- calls using the already deployed get_effective_license authority.
notify pgrst, 'reload schema';
commit;
