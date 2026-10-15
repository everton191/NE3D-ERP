-- Isolated local database only; all synthetic data and constraints are rolled back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';
do $acl$
declare v_sig text := 'public.apply_mercadopago_preapproval(uuid,uuid,text,text,jsonb,uuid)';
begin
  assert not has_function_privilege('anon', v_sig, 'execute');
  assert not has_function_privilege('authenticated', v_sig, 'execute');
  assert has_function_privilege('service_role', v_sig, 'execute');
  assert not (select prosecdef from pg_proc where oid = v_sig::regprocedure);
  assert (select proconfig = array['search_path=pg_catalog'] from pg_proc where oid = v_sig::regprocedure);
end;
$acl$;
create temporary table s3d_preapproval_fixture as select gen_random_uuid() as user_id;
insert into auth.users(id, email, raw_user_meta_data)
select user_id, 's3d-preapproval-' || user_id || '@example.invalid',
  jsonb_build_object('name', 'Synthetic preapproval rollback', 'business_name', 'Synthetic preapproval rollback')
from s3d_preapproval_fixture;
select set_config('s3d.preapproval_test_client', p.client_id::text, true)
from public.profiles p join s3d_preapproval_fixture f on f.user_id = p.user_id;
update public.subscriptions set mercado_pago_subscription_id = 'synthetic-preapproval-atomicity'
where client_id::text = current_setting('s3d.preapproval_test_client');
alter table public.clients add constraint s3d_preapproval_test_failure
check (not (id::text = current_setting('s3d.preapproval_test_client', true) and cancel_at_period_end)) not valid;
set local role service_role;
do $atomic$
declare
  v_client uuid := current_setting('s3d.preapproval_test_client')::uuid;
  v_sub public.subscriptions%rowtype;
  v_customer jsonb;
  v_failed boolean := false;
begin
  select * into v_sub from public.subscriptions where client_id = v_client;
  select to_jsonb(c) into v_customer from public.clients c where id = v_client;
  begin
    perform public.apply_mercadopago_preapproval(v_sub.id, v_client, 'synthetic-preapproval-atomicity',
      'cancelled', jsonb_build_object('status', 'cancelled', 'last_modified', clock_timestamp()), null);
  exception when check_violation then v_failed := true;
  end;
  assert v_failed, 'Client write failure must fail the entire preapproval operation';
  assert (select to_jsonb(s) = to_jsonb(v_sub) from public.subscriptions s where id = v_sub.id);
  assert (select to_jsonb(c) = v_customer from public.clients c where id = v_client);
  assert not exists(select 1 from public.audit_logs where client_id = v_client and action = 'assinatura cancelada');
end;
$atomic$;
reset role;
select 'PASS preapproval ACL and atomic rollback of subscription, client and audit';
rollback;
