-- Complete isolated schema only. Every identity, financial write and DDL rolls back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

do $acl$
declare
  v_role text;
  v_signature text;
begin
  foreach v_signature in array array[
    'private.s3d_provider_timestamp(text)',
    'private.s3d_project_payment_attempt(public.payments,uuid)'
  ] loop
    assert (select r.rolname = 'postgres' and not p.prosecdef
      and p.proconfig = array['search_path=pg_catalog']
      from pg_proc p join pg_roles r on r.oid = p.proowner
      where p.oid = v_signature::regprocedure), 'Private helpers need invoker, postgres owner and pinned search_path';
    foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
      assert not has_function_privilege(v_role, v_signature, 'execute'), 'No API role can call the private helpers';
    end loop;
  end loop;
  assert (select provolatile = 'i' from pg_proc
    where oid = 'private.s3d_provider_timestamp(text)'::regprocedure);
  assert (select r.rolname = 'postgres' and c.relrowsecurity
    from pg_class c join pg_roles r on r.oid = c.relowner
    where c.oid = 'private.payment_license_effects'::regclass);
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'SELECT');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'INSERT');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'UPDATE');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'DELETE');
  end loop;
  assert (select prosecdef and proconfig = array['search_path=pg_catalog'] from pg_proc
    where oid = 'private.s3d_apply_payment_to_subscription()'::regprocedure);
  assert not has_function_privilege('authenticated', 'private.s3d_apply_payment_to_subscription()', 'execute');
  assert private.s3d_provider_timestamp('2026-10-16T01:02:03Z') = '2026-10-16T01:02:03Z'::timestamptz;
  assert private.s3d_provider_timestamp(null) is null;
  assert private.s3d_provider_timestamp('2026-02-30T01:02:03Z') is null;
  assert private.s3d_provider_timestamp('infinity') is null;
  assert private.s3d_provider_timestamp('tomorrow') is null;
  assert private.s3d_provider_timestamp('2026-10-16T01:02:03') is null;
end;
$acl$;

create temporary table s3d_attempt_fixture as
select label, gen_random_uuid() as user_id from (values('immutable'), ('tie'), ('unknown'), ('checkout')) f(label);
insert into auth.users(id, email, raw_user_meta_data)
select user_id, 's3d-attempt-' || user_id || '@example.invalid',
  jsonb_build_object('name', 'Synthetic attempt ' || label,
    'business_name', 'Synthetic attempt ' || label || ' ' || user_id)
from s3d_attempt_fixture;
alter table s3d_attempt_fixture add column client_id uuid;
update s3d_attempt_fixture f set client_id = p.client_id from public.profiles p where p.user_id = f.user_id;
do $fixture$
begin
  assert (select count(*) = 4 and count(client_id) = 4 and count(distinct client_id) = 4 from s3d_attempt_fixture);
end;
$fixture$;

do $immutable$
declare
  v_user uuid;
  v_client uuid;
  v_payment uuid;
  v_payload jsonb;
  v_receipt jsonb;
  v_financial jsonb;
  v_subscription jsonb;
  v_until timestamptz;
  v_failed boolean := false;
begin
  select user_id, client_id into v_user, v_client from s3d_attempt_fixture where label = 'immutable';
  v_payload := jsonb_build_object('id', 'synthetic-attempt-immutable-' || v_user,
    'status', 'approved', 'transaction_amount', 59.9,
    'date_created', '2026-10-15T10:00:00Z', 'date_approved', '2026-10-15T10:01:00Z',
    'date_last_updated', '2026-10-15T10:02:00Z');
  perform public.apply_mercadopago_payment(v_client, v_user, 'pro', 'pro_monthly', v_payload);
  select id, to_jsonb(p) into v_payment, v_financial from public.payments p
    where mercado_pago_payment_id = v_payload->>'id';
  select to_jsonb(e) into v_receipt from private.payment_license_effects e where payment_id = v_payment;
  select to_jsonb(s), premium_until into v_subscription, v_until from public.subscriptions s where client_id = v_client;
  assert v_receipt->>'credit_origin' = 'payment_trigger';
  assert (v_receipt->>'source_created_at')::timestamptz = '2026-10-15T10:00:00Z'::timestamptz;
  assert (v_receipt->>'source_approved_at')::timestamptz = '2026-10-15T10:01:00Z'::timestamptz;
  assert v_receipt->>'source_plan' = 'pro' and (v_receipt->>'source_price')::numeric = 59.9;
  begin
    -- Include status in SET so the real financial trigger runs even though
    -- status stays approved. Its old early return must not bypass immutability.
    update public.payments set status = 'approved', amount = amount,
      metadata = jsonb_set(metadata, '{date_created}', '"2026-10-15T10:00:01Z"'::jsonb)
    where id = v_payment;
  exception when sqlstate '22023' then v_failed := true;
  end;
  assert v_failed, 'Approved -> approved must still reject mutation of the immutable attempt identity';
  assert (select to_jsonb(p) = v_financial from public.payments p where id = v_payment);
  assert (select to_jsonb(e) = v_receipt from private.payment_license_effects e where payment_id = v_payment);
  assert (select to_jsonb(s) = v_subscription from public.subscriptions s where client_id = v_client);

  -- A valid financial revision can change mutable financial fields, but cannot
  -- rewrite the original credit receipt or grant another 30 days.
  update public.payments set status = 'approved', amount = 69.9, plan_price = 69.9,
    paid_at = '2026-10-15T12:00:00Z' where id = v_payment;
  assert (select to_jsonb(e) = v_receipt from private.payment_license_effects e where payment_id = v_payment);
  assert (select premium_until = v_until and active_plan = 'pro' and plan_price = 59.9
    from public.subscriptions where client_id = v_client);
  update public.payments set status = 'refunded' where id = v_payment;
  update public.payments set status = 'approved' where id = v_payment;
  assert (select premium_until = v_until and active_plan = 'pro' and plan_price = 59.9
    from public.subscriptions where client_id = v_client), 'Refund/reapproval cannot revoke or repeat earned validity';
  assert (select credited_at = (v_receipt->>'credited_at')::timestamptz
    and source_created_at = (v_receipt->>'source_created_at')::timestamptz
    and source_approved_at = (v_receipt->>'source_approved_at')::timestamptz
    and source_plan = 'pro' and source_price = 59.9 and review_required_at is not null
    from private.payment_license_effects where payment_id = v_payment);
  assert (select count(*) = 1 from public.audit_logs where client_id = v_client
    and action = 'billing_payment_review_required' and details->>'payment_id' = v_payment::text);
end;
$immutable$;

-- Baselines for two independent ambiguity paths. Raw provider timestamps exist
-- only for the tie; the legacy row has no trustworthy source date to fabricate.
insert into public.payments(client_id, user_id, plan_slug, amount, status, criado_em, metadata)
select client_id, user_id, 'start', 29.9, 'pending', now() - interval '1 hour',
  case when label = 'tie' then jsonb_build_object('date_created',
    to_char((now() - interval '1 hour') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) else '{}'::jsonb end
from s3d_attempt_fixture where label in ('tie', 'unknown');
select set_config('s3d.attempt_tie', (select client_id::text from s3d_attempt_fixture where label = 'tie'), true),
  set_config('s3d.attempt_unknown', (select client_id::text from s3d_attempt_fixture where label = 'unknown'), true);
alter table public.audit_logs add constraint s3d_attempt_test_audit_failure
check (not (client_id::text in (current_setting('s3d.attempt_tie', true), current_setting('s3d.attempt_unknown', true))
  and action = 'billing_payment_attempt_review_required')) not valid;

do $review_atomic$
declare
  v_fixture record;
  v_payload jsonb;
  v_before jsonb;
  v_client_before jsonb;
  v_effects_before jsonb;
  v_audits_before jsonb;
  v_failed boolean;
  v_constraint text;
begin
  for v_fixture in select * from s3d_attempt_fixture where label in ('tie', 'unknown') loop
    v_payload := jsonb_build_object('id', 'synthetic-attempt-review-' || v_fixture.user_id,
      'status', 'approved', 'transaction_amount', 59.9,
      'date_created', to_char((now() - case when v_fixture.label = 'tie' then interval '1 hour' else interval '30 minutes' end)
        at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'date_approved', to_char((now() - interval '20 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'date_last_updated', to_char((now() - interval '10 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
    select to_jsonb(s) into v_before from public.subscriptions s where client_id = v_fixture.client_id;
    select to_jsonb(c) into v_client_before from public.clients c where id = v_fixture.client_id;
    select jsonb_agg(to_jsonb(e) order by payment_id) into v_effects_before
      from private.payment_license_effects e where client_id = v_fixture.client_id;
    select jsonb_agg(to_jsonb(a) order by id) into v_audits_before from public.audit_logs a where client_id = v_fixture.client_id;
    v_failed := false;
    begin
      perform public.apply_mercadopago_payment(v_fixture.client_id, v_fixture.user_id, 'pro', 'pro_monthly', v_payload);
    exception when check_violation then
      get stacked diagnostics v_constraint = constraint_name;
      assert v_constraint = 's3d_attempt_test_audit_failure', 'Only the deliberately failed review audit proves rollback';
      v_failed := true;
    end;
    assert v_failed, 'Both tie and unknown attempt reviews must be mandatory transactional writes';
    assert not exists(select 1 from public.payments where mercado_pago_payment_id = v_payload->>'id');
    assert not exists(select 1 from public.erp_payments where payment_id = v_payload->>'id');
    assert (select to_jsonb(s) = v_before from public.subscriptions s where client_id = v_fixture.client_id);
    assert (select to_jsonb(c) = v_client_before from public.clients c where id = v_fixture.client_id);
    assert (select jsonb_agg(to_jsonb(e) order by payment_id) is not distinct from v_effects_before
      from private.payment_license_effects e where client_id = v_fixture.client_id), 'Attempt facts and credits roll back with failed audit';
    assert (select jsonb_agg(to_jsonb(a) order by id) is not distinct from v_audits_before
      from public.audit_logs a where client_id = v_fixture.client_id);
  end loop;
end;
$review_atomic$;
alter table public.audit_logs drop constraint s3d_attempt_test_audit_failure;

do $review_persistence$
declare
  v_fixture record;
  v_payload jsonb;
  v_payment uuid;
  v_receipt jsonb;
  v_until timestamptz;
  v_pending text;
  v_status text;
  v_result jsonb;
begin
  for v_fixture in select * from s3d_attempt_fixture where label in ('tie', 'unknown') loop
    select pending_plan, payment_status into v_pending, v_status from public.subscriptions where client_id = v_fixture.client_id;
    v_payload := jsonb_build_object('id', 'synthetic-attempt-review-' || v_fixture.user_id,
      'status', 'approved', 'transaction_amount', 59.9,
      'date_created', to_char((now() - case when v_fixture.label = 'tie' then interval '1 hour' else interval '30 minutes' end)
        at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'date_approved', to_char((now() - interval '20 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'date_last_updated', to_char((now() - interval '10 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
    perform public.apply_mercadopago_payment(v_fixture.client_id, v_fixture.user_id, 'pro', 'pro_monthly', v_payload);
    select id into v_payment from public.payments where mercado_pago_payment_id = v_payload->>'id';
    select to_jsonb(e) into v_receipt from private.payment_license_effects e where payment_id = v_payment;
    select premium_until into v_until from public.subscriptions where client_id = v_fixture.client_id;
    assert v_until = now() + interval '30 days';
    assert v_receipt->>'credit_origin' = 'payment_trigger' and v_receipt->>'credited_at' is not null;
    assert v_receipt->>'attempt_review_at' is not null;
    assert v_receipt->>'attempt_review_reason' = case when v_fixture.label = 'tie'
      then 'ambiguous_attempt_time' else 'historical_attempt_unknown' end;
    assert (select pending_plan is not distinct from v_pending and payment_status is not distinct from v_status
      from public.subscriptions where client_id = v_fixture.client_id),
      'Paid credit does not override ambiguous attempt status';
    assert (select count(*) = 1 from public.audit_logs where client_id = v_fixture.client_id
      and action = 'billing_payment_attempt_review_required' and details->>'payment_id' = v_payment::text);
    v_result := public.apply_mercadopago_payment(v_fixture.client_id, v_fixture.user_id, 'pro', 'pro_monthly', v_payload);
    assert v_result->>'applied' = 'false';
    assert (select to_jsonb(e) = v_receipt from private.payment_license_effects e where payment_id = v_payment);
    assert (select premium_until = v_until from public.subscriptions where client_id = v_fixture.client_id);
    -- A genuinely newer revision still cannot rewrite the original source,
    -- duplicate the review or credit, or revoke the already-earned paid time.
    v_payload := v_payload || jsonb_build_object('status', 'refunded', 'date_last_updated',
      to_char((now() - interval '5 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
    perform public.apply_mercadopago_payment(v_fixture.client_id, v_fixture.user_id, 'pro', 'pro_monthly', v_payload);
    assert (select credited_at = (v_receipt->>'credited_at')::timestamptz
      and source_created_at = (v_receipt->>'source_created_at')::timestamptz
      and source_approved_at = (v_receipt->>'source_approved_at')::timestamptz
      and attempt_review_at = (v_receipt->>'attempt_review_at')::timestamptz
      and attempt_review_reason = v_receipt->>'attempt_review_reason'
      and review_required_at is not null from private.payment_license_effects where payment_id = v_payment);
    assert (select premium_until = v_until and pending_plan is not distinct from v_pending and payment_status is not distinct from v_status
      from public.subscriptions where client_id = v_fixture.client_id);
    assert (select count(*) = 1 from public.audit_logs where client_id = v_fixture.client_id
      and action = 'billing_payment_attempt_review_required' and details->>'payment_id' = v_payment::text);
    if v_fixture.label = 'unknown' then
      assert exists(select 1 from private.payment_license_effects e join public.payments p on p.id = e.payment_id
        where e.client_id = v_fixture.client_id and p.mercado_pago_payment_id is null and e.source_created_at is null),
        'The trusted new snapshot must not manufacture a creation date for legacy history';
    end if;
  end loop;
end;
$review_persistence$;

do $checkout_intention$
declare
  v_user uuid;
  v_client uuid;
  v_sub uuid;
  v_old_contract text;
  v_new_contract text;
  v_paid jsonb;
  v_late jsonb;
  v_checkout_paid jsonb;
  v_original_payment uuid;
  v_original_receipt jsonb;
  v_until timestamptz;
  v_pending_at timestamptz;
begin
  select user_id, client_id into v_user, v_client from s3d_attempt_fixture where label = 'checkout';
  v_old_contract := 'synthetic-attempt-contract-a-' || v_user;
  v_new_contract := 'synthetic-attempt-contract-b-' || v_user;
  v_paid := jsonb_build_object('id', 'synthetic-attempt-checkout-paid-' || v_user,
    'preapproval_id', v_old_contract, 'status', 'approved', 'transaction_amount', 59.9,
    'date_created', to_char((now() - interval '1 hour') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'date_approved', to_char((now() - interval '59 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'date_last_updated', to_char((now() - interval '58 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
  perform public.apply_mercadopago_payment(v_client, v_user, 'pro', 'pro_monthly', v_paid);
  select id into v_original_payment from public.payments where mercado_pago_payment_id = v_paid->>'id';
  select to_jsonb(e) into v_original_receipt from private.payment_license_effects e where payment_id = v_original_payment;
  select id, premium_until into v_sub, v_until from public.subscriptions where client_id = v_client;

  -- Server-persisted state of a confirmed recurring checkout before its FIRST
  -- payment. No dependency on the separately introduced checkout RPC is needed.
  -- Existing paid access keeps payment_status=approved while pending_plan is set.
  v_pending_at := now();
  update public.subscriptions set mercado_pago_subscription_id = v_new_contract,
    pending_plan = 'start', pending_started_at = v_pending_at,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('checkout',
      jsonb_build_object('provider_id', v_new_contract, 'plan_slug', 'start',
        'billing_variant', 'start_monthly', 'actor_user_id', v_user, 'created_at', now()))
  where id = v_sub;
  update public.clients set pending_plan = 'start' where id = v_client;
  assert (select payment_status = 'approved' and pending_plan = 'start' from public.subscriptions where id = v_sub),
    'Paid checkout intention is not required to change global payment_status to pending';

  v_paid := v_paid || jsonb_build_object('status', 'refunded', 'date_last_updated',
    to_char((now() - interval '40 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
  perform public.apply_mercadopago_payment(v_client, v_user, 'pro', 'pro_monthly', v_paid);
  assert (select pending_plan = 'start' and pending_started_at = v_pending_at and payment_status = 'approved'
    and mercado_pago_subscription_id = v_new_contract and premium_until = v_until
    and active_plan = 'pro' and plan_price = 59.9 from public.subscriptions where id = v_sub),
    'Old-contract refund cannot erase an unpaid checkout intention or revoke existing validity';
  assert (select pending_plan = 'start' and payment_status = 'approved' and plan_expires_at = v_until
    from public.clients where id = v_client);
  assert (select review_reason = 'refunded' and review_required_at is not null
    and credited_at = (v_original_receipt->>'credited_at')::timestamptz
    and source_created_at = (v_original_receipt->>'source_created_at')::timestamptz
    from private.payment_license_effects where payment_id = v_original_payment);
  assert (select count(*) = 1 from public.audit_logs where client_id = v_client
    and action = 'billing_payment_review_required' and details->>'payment_id' = v_original_payment::text);

  v_paid := v_paid || jsonb_build_object('status', 'approved', 'date_last_updated',
    to_char((now() - interval '30 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
  perform public.apply_mercadopago_payment(v_client, v_user, 'pro', 'pro_monthly', v_paid);
  assert (select pending_plan = 'start' and pending_started_at = v_pending_at and payment_status = 'approved'
    and mercado_pago_subscription_id = v_new_contract and premium_until = v_until from public.subscriptions where id = v_sub),
    'Reapproval of already-credited old payment cannot resolve the new checkout or add days';

  -- Its first observed approval is newer than other known payment facts, but
  -- has no contract ID. It earns its own credit, not the right to resolve B.
  v_late := jsonb_build_object('id', 'synthetic-attempt-checkout-late-' || v_user,
    'status', 'approved', 'transaction_amount', 59.9,
    'date_created', to_char((now() - interval '20 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'date_approved', to_char((now() - interval '19 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'date_last_updated', to_char((now() - interval '18 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
  perform public.apply_mercadopago_payment(v_client, v_user, 'pro', 'pro_monthly', v_late);
  v_until := v_until + interval '30 days';
  assert (select pending_plan = 'start' and pending_started_at = v_pending_at and payment_status = 'approved'
    and mercado_pago_subscription_id = v_new_contract and premium_until = v_until
    and active_plan = 'pro' and plan_price = 59.9 from public.subscriptions where id = v_sub),
    'An unrelated new first credit without contract ID must preserve the confirmed checkout intention';
  assert (select pending_plan = 'start' and payment_status = 'approved' and plan_expires_at = v_until
    from public.clients where id = v_client);

  v_checkout_paid := jsonb_build_object('id', 'synthetic-attempt-checkout-b-first-' || v_user,
    'preapproval_id', v_new_contract, 'status', 'approved', 'transaction_amount', 29.9,
    'date_created', to_char((now() - interval '10 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'date_approved', to_char((now() - interval '9 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'date_last_updated', to_char((now() - interval '8 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
  perform public.apply_mercadopago_payment(v_client, v_user, 'start', 'start_monthly', v_checkout_paid);
  v_until := v_until + interval '30 days';
  assert (select pending_plan is null and pending_started_at is null and payment_status = 'approved'
    and mercado_pago_subscription_id = v_new_contract and premium_until = v_until
    and active_plan = 'start' and plan_code = 'START' and plan_price = 29.9 and plan_status = 'ACTIVE'
    from public.subscriptions where id = v_sub), 'B first payment must resolve its own checkout and credit exactly once';
  assert (select pending_plan is null and payment_status = 'approved' and plan_expires_at = v_until
    and active_plan = 'start' from public.clients where id = v_client);
  assert (select count(*) = 3 from private.payment_license_effects where client_id = v_client and credited_at is not null);
  assert not exists(select 1 from private.payment_license_effects where client_id = v_client and attempt_review_at is not null),
    'Distinct trustworthy source dates and confirmed contract need no ambiguity review';
end;
$checkout_intention$;

select 'PASS attempt helper ACL, immutable source, tie/unknown rollback, single credit and unpaid recurring checkout protection';
rollback;
