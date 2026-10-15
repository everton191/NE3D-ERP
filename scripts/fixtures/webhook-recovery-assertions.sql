-- Isolated local psql only, with ON_ERROR_STOP. All fixtures/DDL are rolled back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';

do $acl$
declare
  v_signature constant text := 'public.recover_billing_webhook_event(text,timestamptz,text,text,boolean)';
begin
  assert not has_function_privilege('anon', v_signature, 'execute');
  assert not has_function_privilege('authenticated', v_signature, 'execute');
  assert has_function_privilege('service_role', v_signature, 'execute');
  assert not (select prosecdef from pg_proc where oid = v_signature::regprocedure);
  assert (select proconfig = array['search_path=pg_catalog'] from pg_proc where oid = v_signature::regprocedure);
end;
$acl$;

select set_config('s3d.webhook_recovery_test_reference', gen_random_uuid()::text, true);
alter table public.audit_logs add constraint s3d_webhook_recovery_test_audit_failure
check (not (action = 'billing_webhook_recovered'
  and details->>'quiescence_reference' = current_setting('s3d.webhook_recovery_test_reference', true))) not valid;

set local role service_role;
do $atomicity$
declare
  v_reference text := current_setting('s3d.webhook_recovery_test_reference');
  v_key text := 'synthetic-rollback:' || v_reference;
  v_before public.billing_webhook_events%rowtype;
  v_after public.billing_webhook_events%rowtype;
  v_rejected boolean := false;
begin
  insert into public.billing_webhook_events(event_key, status, updated_at, payload)
  values(v_key, 'received', clock_timestamp() - interval '1 hour', '{"synthetic":true}')
  returning * into v_before;
  begin
    perform public.recover_billing_webhook_event(v_key, v_before.updated_at,
      'Audit failure must roll back reset', v_reference, true);
  exception when check_violation then
    v_rejected := true;
  end;
  assert v_rejected, 'Audit write failure must fail recovery';
  select * into v_after from public.billing_webhook_events where id = v_before.id;
  assert to_jsonb(v_after) = to_jsonb(v_before), 'Audit failure must leave the entire event unchanged';
  assert not exists (select 1 from public.audit_logs
    where action = 'billing_webhook_recovered' and details->>'event_key' = v_key);
end;
$atomicity$;
reset role;
select 'PASS recovery ACL, invoker/search_path and atomic rollback on audit failure';
rollback;
