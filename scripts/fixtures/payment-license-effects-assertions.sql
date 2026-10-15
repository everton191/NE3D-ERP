-- Isolated local database only; synthetic fixtures and DDL are rolled back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';

do $acl$
declare v_role text;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'SELECT');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'INSERT');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'UPDATE');
    assert not has_table_privilege(v_role, 'private.payment_license_effects', 'DELETE');
  end loop;
  assert (select relrowsecurity from pg_class where oid = 'private.payment_license_effects'::regclass);
end;
$acl$;

create temporary table s3d_payment_effect_fixture as select gen_random_uuid() as user_id;
insert into auth.users(id, email, raw_user_meta_data)
select user_id, 's3d-effect-' || user_id || '@example.invalid',
  jsonb_build_object('name', 'Synthetic effect rollback', 'business_name', 'Synthetic effect rollback')
from s3d_payment_effect_fixture;
select set_config('s3d.payment_effect_client', p.client_id::text, true)
from public.profiles p join s3d_payment_effect_fixture f on f.user_id = p.user_id;

-- Inject a failure after the private claim but before the license update commits.
alter table public.subscriptions add constraint s3d_payment_effect_test_failure
check (not (client_id::text = current_setting('s3d.payment_effect_client', true) and active_plan = 'pro')) not valid;
do $atomicity$
declare
  v_id uuid := gen_random_uuid();
  v_client uuid := current_setting('s3d.payment_effect_client')::uuid;
  v_user uuid := (select user_id from s3d_payment_effect_fixture);
  v_failed boolean := false;
begin
  begin
    insert into public.payments(id, client_id, user_id, amount, plan_slug, status)
    values(v_id, v_client, v_user, 59.9, 'pro', 'approved');
  exception when check_violation then v_failed := true;
  end;
  assert v_failed;
  assert not exists(select 1 from public.payments where id = v_id);
  assert not exists(select 1 from private.payment_license_effects where payment_id = v_id),
    'Failed license update must not consume the credit marker';
end;
$atomicity$;
alter table public.subscriptions drop constraint s3d_payment_effect_test_failure;

do $review$
declare
  v_id uuid := gen_random_uuid();
  v_client uuid := current_setting('s3d.payment_effect_client')::uuid;
  v_user uuid := (select user_id from s3d_payment_effect_fixture);
  v_until timestamptz;
  v_mark timestamptz;
begin
  insert into public.payments(id, client_id, user_id, amount, plan_slug, status)
  values(v_id, v_client, v_user, 59.9, 'pro', 'approved');
  select premium_until into v_until from public.subscriptions where client_id = v_client;
  select credited_at into v_mark from private.payment_license_effects where payment_id = v_id;
  assert v_mark is not null;
  update public.payments set status = 'refunded' where id = v_id;
  update public.payments set status = 'charged_back' where id = v_id;
  update public.payments set status = 'approved' where id = v_id;
  assert (select credited_at = v_mark and review_required_at is not null
    from private.payment_license_effects where payment_id = v_id);
  assert (select premium_until = v_until from public.subscriptions where client_id = v_client);
  assert (select count(*) = 1 from public.audit_logs where action = 'billing_payment_review_required'
    and details->>'payment_id' = v_id::text);
end;
$review$;
select 'PASS private credit ACL, atomic rollback and refund review without additional days';
rollback;
