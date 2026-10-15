-- Run with psql ON_ERROR_STOP on an isolated local database only.
-- Global maintenance is exercised inside a rolled-back transaction.
begin;
do $assert$
declare
  v_signature text;
  v_definition text;
  v_rejected boolean := false;
begin
  foreach v_signature in array array[
    'public.register_saas_client(text,text,text,text,text,integer)',
    'public.handle_new_saas_auth_user()',
    'public.sync_saas_user_after_login(text,text,text)',
    'private.s3d_apply_payment_to_subscription()'
  ] loop
    v_definition := pg_get_functiondef(v_signature::regprocedure);
    assert position('perform public.s3d_cleanup_subscription_state();' in v_definition) = 0,
      'Global cleanup still reachable from ordinary flow';
    assert position('perform private.s3d_reconcile_subscription_state(' in v_definition) > 0,
      'Missing client-scoped cleanup';
  end loop;
  assert not has_function_privilege('authenticated', 'private.s3d_reconcile_subscription_state(uuid,boolean)', 'EXECUTE');
  assert not has_function_privilege('anon', 'private.s3d_reconcile_subscription_state(uuid,boolean)', 'EXECUTE');
  assert not has_function_privilege('service_role', 'private.s3d_reconcile_subscription_state(uuid,boolean)', 'EXECUTE');
  assert not has_function_privilege('authenticated', 'public.s3d_cleanup_subscription_state()', 'EXECUTE');
  assert not has_function_privilege('anon', 'public.s3d_cleanup_subscription_state()', 'EXECUTE');
  assert has_function_privilege('service_role', 'public.s3d_cleanup_subscription_state()', 'EXECUTE');
  assert not (select prosecdef from pg_proc where oid = 'private.s3d_reconcile_subscription_state(uuid,boolean)'::regprocedure);
  assert not (select prosecdef from pg_proc where oid = 'private.s3d_guard_profile_tenant_links()'::regprocedure);
  assert (select proconfig = array['search_path=pg_catalog'] from pg_proc
    where oid = 'private.s3d_reconcile_subscription_state(uuid,boolean)'::regprocedure);
  assert (select proconfig = array['search_path=pg_catalog'] from pg_proc
    where oid = 'private.s3d_guard_profile_tenant_links()'::regprocedure);
  begin
    perform private.s3d_reconcile_subscription_state(null, false);
  exception when invalid_parameter_value then v_rejected := true;
  end;
  assert v_rejected, 'NULL client must not become global scope';
  v_rejected := false;
  begin
    perform private.s3d_reconcile_subscription_state(null, null);
  exception when invalid_parameter_value then v_rejected := true;
  end;
  assert v_rejected, 'NULL mode must fail closed';
  assert private.s3d_reconcile_subscription_state('00000000-0000-0000-0000-000000000000', false) = 0,
    'Unknown client must not touch existing clients';
  assert (select count(*) = 2 from pg_trigger where tgname = 's3d_guard_profile_tenant_links'
    and tgrelid in ('public.profiles'::regclass, 'public.erp_profiles'::regclass) and tgenabled = 'O');
end;
$assert$;
set local role service_role;
select public.s3d_cleanup_subscription_state() as server_only_maintenance_rolled_back;
reset role;
rollback;
