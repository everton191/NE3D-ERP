-- Local isolated database only. All synthetic rows/constraints roll back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';
do $acl$
declare v_sig text := 'public.persist_mercadopago_checkout(uuid,uuid,text,text,jsonb)';
begin
  assert not has_function_privilege('anon', v_sig, 'execute');
  assert not has_function_privilege('authenticated', v_sig, 'execute');
  assert has_function_privilege('service_role', v_sig, 'execute');
  assert not (select prosecdef from pg_proc where oid = v_sig::regprocedure);
  assert (select proconfig = array['search_path=pg_catalog'] from pg_proc where oid = v_sig::regprocedure);
end;
$acl$;
create temporary table s3d_checkout_fixture as select gen_random_uuid() as user_id;
insert into auth.users(id, email, raw_user_meta_data)
select user_id, 's3d-checkout-' || user_id || '@example.invalid',
  jsonb_build_object('name', 'Synthetic checkout rollback', 'business_name', 'Synthetic checkout rollback')
from s3d_checkout_fixture;
select set_config('s3d.checkout_test_actor', p.user_id::text, true),
  set_config('s3d.checkout_test_client', p.client_id::text, true)
from public.profiles p join s3d_checkout_fixture f on f.user_id = p.user_id;
alter table public.audit_logs add constraint s3d_checkout_test_failure
check (not (client_id::text = current_setting('s3d.checkout_test_client', true)
  and action = 'assinatura criada')) not valid;
set local role service_role;
do $atomic$
declare
  v_actor uuid := current_setting('s3d.checkout_test_actor')::uuid;
  v_client uuid := current_setting('s3d.checkout_test_client')::uuid;
  v_sub jsonb;
  v_customer jsonb;
  v_failed boolean := false;
begin
  select to_jsonb(s) into v_sub from public.subscriptions s where client_id = v_client;
  select to_jsonb(c) into v_customer from public.clients c where id = v_client;
  assert (public.persist_mercadopago_checkout(v_client, v_actor, 'pro', 'pro_monthly', null)->>'ready')::boolean;
  begin
    perform public.persist_mercadopago_checkout(v_client, v_actor, 'pro', 'pro_monthly',
      jsonb_build_object('id', 'synthetic-checkout-rollback', 'status', 'pending'));
  exception when check_violation then v_failed := true;
  end;
  assert v_failed, 'Audit failure must abort the checkout transaction';
  assert (select to_jsonb(s) = v_sub from public.subscriptions s where client_id = v_client);
  assert (select to_jsonb(c) = v_customer from public.clients c where id = v_client);
  assert not exists(select 1 from public.audit_logs where client_id = v_client and action = 'assinatura criada');
end;
$atomic$;
reset role;
alter table public.audit_logs drop constraint s3d_checkout_test_failure;
create function pg_temp.s3d_suppress_checkout_client_update() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if new.id::text = current_setting('s3d.checkout_test_client', true) then return null; end if;
  return new;
end;
$$;
create trigger s3d_checkout_suppress_update before update on public.clients
for each row execute function pg_temp.s3d_suppress_checkout_client_update();
set local role service_role;
do $zero_rows$
declare
  v_actor uuid := current_setting('s3d.checkout_test_actor')::uuid;
  v_client uuid := current_setting('s3d.checkout_test_client')::uuid;
  v_sub jsonb;
  v_customer jsonb;
  v_failed boolean := false;
begin
  select to_jsonb(s) into v_sub from public.subscriptions s where client_id = v_client;
  select to_jsonb(c) into v_customer from public.clients c where id = v_client;
  begin
    perform public.persist_mercadopago_checkout(v_client, v_actor, 'start', 'start_monthly',
      jsonb_build_object('id', 'synthetic-checkout-zero-rows', 'status', 'pending'));
  exception when no_data_found then v_failed := true;
  end;
  assert v_failed, 'Suppressed client update must not be reported as persisted';
  assert (select to_jsonb(s) = v_sub from public.subscriptions s where client_id = v_client);
  assert (select to_jsonb(c) = v_customer from public.clients c where id = v_client);
  assert not exists(select 1 from public.audit_logs where client_id = v_client and action = 'assinatura criada');
end;
$zero_rows$;
reset role;
select 'PASS checkout service-only ACL, invoker, pinned search_path and rollback on audit failure/zero-row client write';
rollback;
