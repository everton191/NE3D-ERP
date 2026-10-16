-- Isolated local schema only. Synthetic identities and mutations roll back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
do $acl$
declare v_role text;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'SELECT');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'UPDATE');
    assert not has_table_privilege(v_role, 'private.manual_plan_projection_authority', 'SELECT');
    assert not has_table_privilege(v_role, 'private.manual_plan_projection_authority', 'INSERT');
    assert not has_table_privilege(v_role, 'private.manual_plan_projection_authority', 'UPDATE');
    assert not has_table_privilege(v_role, 'private.manual_plan_projection_authority', 'DELETE');
  end loop;
  assert (select relrowsecurity from pg_class where oid = 'private.payment_license_effects'::regclass);
  assert (select relrowsecurity from pg_class where oid = 'private.manual_plan_projection_authority'::regclass);
  assert (select prosecdef and proconfig = array['search_path=pg_catalog']
    from pg_proc where oid = 'private.s3d_apply_payment_to_subscription()'::regprocedure);
  assert not has_function_privilege('authenticated', 'private.s3d_apply_payment_to_subscription()', 'execute');
end;
$acl$;
create temporary table s3d_order_fixture as select gen_random_uuid() as user_id;
insert into auth.users(id, email, raw_user_meta_data)
select user_id, 's3d-order-' || user_id || '@example.invalid',
  jsonb_build_object('name', 'Synthetic ordered credit', 'business_name', 'Synthetic ordered credit')
from s3d_order_fixture;
select set_config('s3d.order_client', p.client_id::text, true),
  set_config('s3d.order_user', p.user_id::text, true)
from public.profiles p join s3d_order_fixture f on f.user_id = p.user_id;
do $receipts$
declare
  v_client uuid := current_setting('s3d.order_client')::uuid;
  v_user uuid := current_setting('s3d.order_user')::uuid;
  v_old uuid;
  v_new uuid;
  v_tie uuid;
  v_receipt jsonb;
  v_until timestamptz;
begin
  insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at)
  values(v_client, v_user, 'start', 29.9, 'approved', '2026-10-15T10:00:00Z') returning id into v_old;
  select to_jsonb(e) into v_receipt from private.payment_license_effects e where payment_id = v_old;
  assert v_receipt->>'source_plan' = 'start';
  assert (v_receipt->>'source_price')::numeric = 29.9;
  assert (v_receipt->>'source_approved_at')::timestamptz = '2026-10-15T10:00:00Z'::timestamptz;
  insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at)
  values(v_client, v_user, 'pro', 59.9, 'approved', '2026-10-15T11:00:00Z') returning id into v_new;
  select premium_until into v_until from public.subscriptions where client_id = v_client;
  -- A mutable financial revision must not rewrite the facts that credited it.
  update public.payments set amount = 69.9, plan_slug = 'pro', paid_at = '2026-10-15T12:00:00Z'
  where id = v_old;
  assert (select to_jsonb(e) = v_receipt from private.payment_license_effects e where payment_id = v_old);
  update public.payments set status = 'refunded' where id = v_old;
  update public.payments set status = 'approved' where id = v_old;
  assert (select active_plan = 'pro' and plan_price = 59.9 and premium_until = v_until
    from public.subscriptions where client_id = v_client);
  assert (select source_plan = 'start' and source_price = 29.9
    and source_approved_at = '2026-10-15T10:00:00Z'::timestamptz and review_required_at is not null
    from private.payment_license_effects where payment_id = v_old);
  insert into public.payments(client_id, user_id, plan_slug, amount, status)
  values(v_client, v_user, 'pro', 59.9, 'pending') returning id into v_tie;
  update public.payments set status = 'approved', paid_at = '2026-10-15T11:00:00Z' where id = v_tie;
  assert (select payment_status = 'approved' and pending_plan is null and pending_started_at is null
    and premium_until = v_until + interval '30 days' from public.subscriptions where client_id = v_client),
    'Equivalent approval must finish its own pending attempt';
  select premium_until into v_until from public.subscriptions where client_id = v_client;
  update public.subscriptions set archived_at = clock_timestamp(), plan_status = 'EXPIRED',
    status = 'expired', subscription_status = 'expired', subscription_active = false where client_id = v_client;
  insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at)
  values(v_client, v_user, 'start', 29.9, 'approved', '2026-10-15T08:00:00Z');
  assert (select archived_at is not null and subscription_status = 'expired' and not subscription_active
    and premium_until = v_until + interval '30 days' from public.subscriptions where client_id = v_client),
    'A subscription-only archive must prevent automatic reactivation';
  update public.subscriptions set archived_at = null, plan_status = 'ACTIVE', status = 'active',
    subscription_status = 'active', subscription_active = true where client_id = v_client;
  select premium_until into v_until from public.subscriptions where client_id = v_client;
  update public.subscriptions set plan_status = 'BLOCKED', blocked_at = clock_timestamp(), blocked_reason = 'synthetic block'
  where client_id = v_client;
  update public.clients set status = 'blocked', blocked_at = clock_timestamp(), blocked_reason = 'synthetic block'
  where id = v_client;
  insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at)
  values(v_client, v_user, 'start', 29.9, 'approved', '2026-10-15T09:00:00Z');
  assert (select plan_status = 'BLOCKED' and blocked_at is not null and premium_until = v_until + interval '30 days'
    from public.subscriptions where client_id = v_client), 'Late credit must not unblock a blocked subscription';
  assert (select status = 'blocked' and blocked_at is not null from public.clients where id = v_client);
  update public.subscriptions set plan_status = 'ACTIVE', blocked_at = null, blocked_reason = null where client_id = v_client;
  update public.clients set status = 'active', blocked_at = null, blocked_reason = null where id = v_client;
  select premium_until into v_until from public.subscriptions where client_id = v_client;
  -- Simulate the PRE-migration unknown receipt, without inventing source facts.
  update private.payment_license_effects set source_approved_at = null, source_plan = null, source_price = null
  where payment_id = v_old;
  insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at)
  values(v_client, v_user, 'start', 29.9, 'approved', '2026-10-15T13:00:00Z') returning id into v_old;
  assert (select active_plan = 'pro' and plan_price = 59.9 and premium_until = v_until + interval '30 days'
    from public.subscriptions where client_id = v_client);
  assert (select projection_review_reason = 'historical_approval_unknown' and credited_at is not null
    from private.payment_license_effects where payment_id = v_old);
  assert (select count(*) = 1 from public.audit_logs where client_id = v_client
    and action = 'billing_payment_projection_review_required' and details->>'payment_id' = v_old::text);
end;
$receipts$;
-- A review/audit failure must roll back the credit and its new private facts too.
alter table public.audit_logs add constraint s3d_order_test_audit_failure
check (not (client_id::text = current_setting('s3d.order_client', true)
  and action = 'billing_payment_projection_review_required')) not valid;
do $atomic$
declare
  v_client uuid := current_setting('s3d.order_client')::uuid;
  v_id uuid := gen_random_uuid();
  v_before jsonb;
  v_failed boolean := false;
begin
  select to_jsonb(s) into v_before from public.subscriptions s where client_id = v_client;
  begin
    insert into public.payments(id, client_id, user_id, plan_slug, amount, status, paid_at)
    values(v_id, v_client, current_setting('s3d.order_user')::uuid, 'start', 29.9, 'approved', '2026-10-15T14:00:00Z');
  exception when check_violation then v_failed := true;
  end;
  assert v_failed;
  assert not exists(select 1 from public.payments where id = v_id);
  assert not exists(select 1 from private.payment_license_effects where payment_id = v_id);
  assert (select to_jsonb(s) = v_before from public.subscriptions s where client_id = v_client);
end;
$atomic$;
alter table public.audit_logs drop constraint s3d_order_test_audit_failure;
insert into public.superadmins(user_id, status) values(current_setting('s3d.order_user')::uuid, 'active');
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('s3d.order_user'),
  'role', 'authenticated')::text, true);
alter table private.manual_plan_projection_authority add constraint s3d_order_test_head_failure
check (client_id::text <> current_setting('s3d.order_client', true)) not valid;
set local role authenticated;
do $admin_atomic$
declare
  v_before jsonb;
  v_customer jsonb;
  v_failed boolean := false;
begin
  select to_jsonb(s) into v_before from public.subscriptions s where client_id::text = current_setting('s3d.order_client');
  select to_jsonb(c) into v_customer from public.clients c where id::text = current_setting('s3d.order_client');
  begin
    perform public.superadmin_update_subscription(current_setting('s3d.order_user'), 'SET_FREE', 'FREE', null, 'synthetic atomic head');
  exception when check_violation then v_failed := true;
  end;
  assert v_failed, 'Admin authority write failure must not report a saved plan';
  assert (select to_jsonb(s) = v_before from public.subscriptions s where client_id::text = current_setting('s3d.order_client'));
  assert (select to_jsonb(c) = v_customer from public.clients c where id::text = current_setting('s3d.order_client'));
end;
$admin_atomic$;
reset role;
alter table private.manual_plan_projection_authority drop constraint s3d_order_test_head_failure;
set local role authenticated;
select public.superadmin_update_subscription(current_setting('s3d.order_user'), 'SET_FREE', 'FREE', null, 'synthetic private head') is not null
  as manual_rpc_succeeded;
reset role;
do $admin_head$
declare v_client uuid := current_setting('s3d.order_client')::uuid;
begin
  assert (select plan_code = 'FREE' and client_id = v_client and actor_user_id = current_setting('s3d.order_user')::uuid
    from private.manual_plan_projection_authority where client_id = v_client);
  insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at)
  values(v_client, current_setting('s3d.order_user')::uuid, 'pro', 59.9, 'approved', '2026-10-15T15:00:00Z');
  assert (select active_plan = 'free' from public.subscriptions where client_id = v_client);
  assert exists(select 1 from private.payment_license_effects where client_id = v_client
    and projection_review_reason = 'newer_manual_override');
end;
$admin_head$;
select 'PASS immutable credit facts, legacy ambiguity, review atomicity and unchanged private ACL';
rollback;
