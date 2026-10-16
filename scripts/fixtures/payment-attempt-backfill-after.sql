-- Paired with payment-attempt-backfill-before.sql; exact-ledger cleanup only.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
do $verify$
declare v_fixture record;
begin
  assert current_database() = 's3d_reconciliation_replay_20261014', 'Only the isolated replay clone is permitted';
  assert to_regclass('private.s3d_attempt_backfill_fixture') is not null, 'The committed synthetic before ledger is required';
  assert (select count(*) = 3 from private.s3d_attempt_backfill_fixture);
  assert exists(select 1 from pg_attribute where attrelid = 'private.payment_license_effects'::regclass
    and attname = 'source_created_at' and not attisdropped), 'Apply the attempt migration before this verification';
  for v_fixture in select * from private.s3d_attempt_backfill_fixture loop
    assert v_fixture.email = 's3d-attempt-backfill-' || v_fixture.user_id || '@example.invalid';
    assert v_fixture.company_name = 'Synthetic attempt backfill ' || v_fixture.user_id;
    assert (select to_jsonb(c) = v_fixture.client_snapshot from public.clients c where c.id = v_fixture.client_id),
      'Backfill cannot rewrite client state';
    assert (select to_jsonb(s) = v_fixture.subscription_snapshot from public.subscriptions s where s.client_id = v_fixture.client_id),
      'Backfill cannot rewrite licenses, paid validity or commercial projection';
    assert (select to_jsonb(p) = v_fixture.payment_snapshot from public.payments p where p.id = v_fixture.payment_id),
      'Backfill cannot repair or normalize financial history';
    assert (select to_jsonb(e) - array['source_created_at', 'attempt_review_at', 'attempt_review_reason'] = v_fixture.effect_snapshot
      from private.payment_license_effects e where e.payment_id = v_fixture.payment_id),
      'Existing immutable credit, paid-plan facts and refund reviews must remain identical';
    assert (select source_created_at is not distinct from case when v_fixture.label = 'valid'
      then '2026-10-15T10:00:00Z'::timestamptz end
      and attempt_review_at is null and attempt_review_reason is null
      from private.payment_license_effects where payment_id = v_fixture.payment_id),
      'Capture only valid raw provider creation dates; unknown history remains unknown without invented reviews';
    assert (select jsonb_agg(to_jsonb(a) order by id) is not distinct from v_fixture.audit_snapshot
      from public.audit_logs a where a.client_id = v_fixture.client_id);
    assert (select jsonb_agg(to_jsonb(e) order by id) is not distinct from v_fixture.erp_snapshot
      from public.erp_payments e where e.cliente_id = v_fixture.client_id);
    -- Validate complete ownership before deleting any synthetic tenant.
    assert (select email = v_fixture.email from auth.users where id = v_fixture.user_id);
    assert (select email = v_fixture.email and company_id = v_fixture.company_id from public.clients where id = v_fixture.client_id);
    assert (select name = v_fixture.company_name and owner_user_id is not distinct from v_fixture.company_owner
      from public.companies where id = v_fixture.company_id);
    assert v_fixture.company_owner is null or v_fixture.company_owner = v_fixture.user_id;
    assert not exists(select 1 from public.company_members m where m.company_id = v_fixture.company_id
      and m.user_id <> v_fixture.user_id), 'Foreign member blocks fixture cleanup';
    assert not exists(select 1 from public.clients c where c.company_id = v_fixture.company_id
      and c.id <> v_fixture.client_id), 'Foreign client blocks fixture cleanup';
    assert not exists(select 1 from auth.sessions where user_id = v_fixture.user_id), 'Fixture created no login sessions';
  end loop;
end;
$verify$;

delete from public.companies c using private.s3d_attempt_backfill_fixture f
where c.id = f.company_id and c.name = f.company_name and c.owner_user_id is not distinct from f.company_owner;
delete from public.clients c using private.s3d_attempt_backfill_fixture f
where c.id = f.client_id and c.email = f.email;
delete from auth.users u using private.s3d_attempt_backfill_fixture f
where u.id = f.user_id and u.email = f.email;
do $cleanup$
begin
  assert not exists(select 1 from auth.users u join private.s3d_attempt_backfill_fixture f on u.id = f.user_id);
  assert not exists(select 1 from public.clients c join private.s3d_attempt_backfill_fixture f on c.id = f.client_id);
  assert not exists(select 1 from public.companies c join private.s3d_attempt_backfill_fixture f on c.id = f.company_id);
  assert not exists(select 1 from public.payments p join private.s3d_attempt_backfill_fixture f on p.id = f.payment_id);
  assert not exists(select 1 from private.payment_license_effects e join private.s3d_attempt_backfill_fixture f on e.payment_id = f.payment_id);
end;
$cleanup$;
drop table private.s3d_attempt_backfill_fixture;
select 'PASS replay-clone backfill preserved financial/license/credit/review snapshots; only synthetic exact-ledger fixtures removed, audit retained';
commit;
