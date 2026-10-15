-- Local isolated schema only. Synthetic users, injected constraints and writes
-- are all rolled back. Exercise the RPC with the actual service_role privileges.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
do $acl$
declare v_sig text := 'public.apply_mercadopago_payment(uuid,uuid,text,text,jsonb)';
begin
  assert not has_function_privilege('anon', v_sig, 'execute');
  assert not has_function_privilege('authenticated', v_sig, 'execute');
  assert has_function_privilege('service_role', v_sig, 'execute');
  assert not (select prosecdef from pg_proc where oid = v_sig::regprocedure);
  assert (select proconfig = array['search_path=pg_catalog'] from pg_proc where oid = v_sig::regprocedure);
end;
$acl$;
create temporary table s3d_snapshot_fixture as select gen_random_uuid() as user_id;
insert into auth.users(id, email, raw_user_meta_data)
select user_id, 's3d-snapshot-' || user_id || '@example.invalid',
  jsonb_build_object('name', 'Synthetic snapshot rollback', 'business_name', 'Synthetic snapshot rollback')
from s3d_snapshot_fixture;
select set_config('s3d.snapshot_client', p.client_id::text, true),
  set_config('s3d.snapshot_user', p.user_id::text, true)
from public.profiles p join s3d_snapshot_fixture f on f.user_id = p.user_id;
alter table public.payments add constraint s3d_snapshot_test_payment
check (not (client_id::text = current_setting('s3d.snapshot_client', true)
  and current_setting('s3d.snapshot_failure', true) = 'payments')) not valid;
alter table public.subscriptions add constraint s3d_snapshot_test_subscription
check (not (client_id::text = current_setting('s3d.snapshot_client', true)
  and current_setting('s3d.snapshot_failure', true) = 'subscriptions')) not valid;
alter table public.clients add constraint s3d_snapshot_test_client
check (not (id::text = current_setting('s3d.snapshot_client', true)
  and current_setting('s3d.snapshot_failure', true) = 'clients')) not valid;
alter table public.erp_payments add constraint s3d_snapshot_test_erp
check (not (cliente_id::text = current_setting('s3d.snapshot_client', true)
  and current_setting('s3d.snapshot_failure', true) = 'erp_payments')) not valid;
alter table public.audit_logs add constraint s3d_snapshot_test_audit
check (not (client_id::text = current_setting('s3d.snapshot_client', true)
  and current_setting('s3d.snapshot_failure', true) = 'audit_logs')) not valid;
create function private.s3d_snapshot_test_suppress_update() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if new.id::text = current_setting('s3d.snapshot_client', true)
    and current_setting('s3d.snapshot_failure', true) = 'client_zero_rows' then return null; end if;
  return new;
end;
$$;
create trigger s3d_snapshot_test_zero_rows before update on public.clients
for each row execute function private.s3d_snapshot_test_suppress_update();
set local role service_role;
do $atomic$
declare
  v_client uuid := current_setting('s3d.snapshot_client')::uuid;
  v_user uuid := current_setting('s3d.snapshot_user')::uuid;
  v_sub jsonb;
  v_customer jsonb;
  v_audits jsonb;
  v_table text;
  v_failed boolean;
  v_payload jsonb := jsonb_build_object('id', 'synthetic-snapshot-atomicity',
    'status', 'approved', 'transaction_amount', 59.9,
    'date_created', '2026-10-15T11:00:00Z', 'date_approved', '2026-10-15T11:01:00Z',
    'date_last_updated', '2026-10-15T11:02:00Z');
  v_until timestamptz;
begin
  select to_jsonb(s) into v_sub from public.subscriptions s where client_id = v_client;
  select to_jsonb(c) into v_customer from public.clients c where id = v_client;
  select jsonb_agg(to_jsonb(a) order by id) into v_audits from public.audit_logs a where client_id = v_client;
  v_failed := false;
  begin
    update public.plans set active = false where slug = 'pro';
    perform public.apply_mercadopago_payment(v_client, v_user, 'premium', 'premium_monthly', v_payload);
  exception when invalid_parameter_value then v_failed := true;
  end;
  assert v_failed, 'Missing active plan must fail closed';
  assert (select active from public.plans where slug = 'pro'), 'Failed operation restores the plan fixture';
  foreach v_table in array array['payments', 'subscriptions', 'clients', 'erp_payments', 'audit_logs', 'client_zero_rows'] loop
    perform set_config('s3d.snapshot_failure', v_table, true);
    v_failed := false;
    begin
      perform public.apply_mercadopago_payment(v_client, v_user, 'premium', 'premium_monthly', v_payload);
    exception when check_violation or no_data_found then v_failed := true;
    end;
    assert v_failed, 'Injected failure must reach ' || v_table;
    assert (select to_jsonb(s) = v_sub from public.subscriptions s where client_id = v_client);
    assert (select to_jsonb(c) = v_customer from public.clients c where id = v_client);
    assert not exists(select 1 from public.payments where client_id = v_client);
    assert not exists(select 1 from public.erp_payments where cliente_id = v_client);
    assert (select jsonb_agg(to_jsonb(a) order by id) is not distinct from v_audits
      from public.audit_logs a where client_id = v_client);
  end loop;
  perform set_config('s3d.snapshot_failure', '', true);
  assert (public.apply_mercadopago_payment(v_client, v_user, 'premium', 'premium_monthly', v_payload)->>'applied')::boolean;
  select premium_until into v_until from public.subscriptions where client_id = v_client;
  delete from public.erp_payments where cliente_id = v_client;
  assert not (public.apply_mercadopago_payment(v_client, v_user, 'premium', 'premium_monthly', v_payload)->>'applied')::boolean;
  assert exists(select 1 from public.erp_payments where cliente_id = v_client);
  assert (select count(*) = 1 from public.audit_logs where client_id = v_client and action = 'pagamento aprovado');
  assert (select premium_until = v_until from public.subscriptions where client_id = v_client);
  -- Older writers could leave these optional identity links empty. Bind them
  -- once, but never replace a non-null owner/subscription on a later revision.
  insert into public.payments(client_id, plan_slug, billing_variant, status, mercado_pago_payment_id)
  values(v_client, 'premium', 'premium_monthly', 'pending', 'synthetic-snapshot-legacy-links');
  perform public.apply_mercadopago_payment(v_client, v_user, 'premium', 'premium_monthly',
    v_payload || jsonb_build_object('id', 'synthetic-snapshot-legacy-links'));
  assert (select user_id = v_user and subscription_id is not null from public.payments
    where mercado_pago_payment_id = 'synthetic-snapshot-legacy-links');
  assert (select premium_until = v_until + interval '30 days' from public.subscriptions where client_id = v_client);
  update public.clients set status = 'blocked', blocked_at = clock_timestamp(), blocked_reason = 'synthetic block'
  where id = v_client;
  perform public.apply_mercadopago_payment(v_client, v_user, 'premium', 'premium_monthly',
    v_payload || jsonb_build_object('id', 'synthetic-snapshot-blocked-pending', 'status', 'pending', 'date_approved', null));
  assert (select status = 'blocked' and blocked_at is not null and blocked_reason = 'synthetic block'
    from public.clients where id = v_client), 'Pending payment must not erase a client-only block';
end;
$atomic$;
reset role;
do $marker$
begin
  assert (select count(*) = 2 from private.payment_license_effects
    where client_id::text = current_setting('s3d.snapshot_client') and credited_at is not null);
end;
$marker$;
select 'PASS snapshot ACL, rollback of all five writes, ERP repair and credit/audit idempotency';
rollback;
