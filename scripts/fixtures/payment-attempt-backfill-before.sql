-- Run ONLY on the named full-schema local replay clone, before the attempt migration.
-- This committed synthetic fixture is paired with payment-attempt-backfill-after.sql.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
do $precondition$
begin
  assert current_database() = 's3d_reconciliation_replay_20261014', 'Only the isolated replay clone is permitted';
  assert to_regclass('private.s3d_attempt_backfill_fixture') is null, 'Do not overwrite a previous fixture ledger';
  assert not exists(select 1 from pg_attribute where attrelid = 'private.payment_license_effects'::regclass
    and attname = 'source_created_at' and not attisdropped), 'This fixture must precede the attempt migration';
end;
$precondition$;
create table private.s3d_attempt_backfill_fixture (
  label text primary key,
  user_id uuid not null unique,
  email text not null unique,
  client_id uuid,
  company_id uuid,
  company_name text,
  company_owner uuid,
  payment_id uuid,
  client_snapshot jsonb,
  subscription_snapshot jsonb,
  payment_snapshot jsonb,
  effect_snapshot jsonb,
  audit_snapshot jsonb,
  erp_snapshot jsonb
);
alter table private.s3d_attempt_backfill_fixture owner to postgres;
alter table private.s3d_attempt_backfill_fixture enable row level security;
revoke all on private.s3d_attempt_backfill_fixture from public, anon, authenticated, service_role;
insert into private.s3d_attempt_backfill_fixture(label, user_id, email)
select label, user_id, 's3d-attempt-backfill-' || user_id || '@example.invalid'
from (select label, gen_random_uuid() as user_id from (values('valid'), ('invalid'), ('missing')) f(label)) f;
insert into auth.users(id, email, raw_user_meta_data)
select user_id, email, jsonb_build_object('name', 'Synthetic attempt backfill ' || label,
  'business_name', 'Synthetic attempt backfill ' || user_id)
from private.s3d_attempt_backfill_fixture;
update private.s3d_attempt_backfill_fixture f set client_id = p.client_id from public.profiles p where p.user_id = f.user_id;
update private.s3d_attempt_backfill_fixture f set company_id = c.company_id from public.clients c where c.id = f.client_id;
update private.s3d_attempt_backfill_fixture f set company_name = c.name, company_owner = c.owner_user_id
from public.companies c where c.id = f.company_id;
do $identity$
begin
  assert (select count(*) = 3 and count(client_id) = 3 and count(distinct client_id) = 3
    and count(company_id) = 3 and count(distinct company_id) = 3 from private.s3d_attempt_backfill_fixture);
  assert not exists(select 1 from private.s3d_attempt_backfill_fixture where company_name is distinct from 'Synthetic attempt backfill ' || user_id);
end;
$identity$;
insert into public.payments(client_id, user_id, plan_slug, amount, status, paid_at, mercado_pago_payment_id, metadata)
select client_id, user_id, 'pro', 59.9, 'approved', '2026-10-15T10:01:00Z',
  'synthetic-attempt-backfill-' || label || '-' || user_id,
  case label when 'valid' then jsonb_build_object('date_created', '2026-10-15T10:00:00Z')
    when 'invalid' then jsonb_build_object('date_created', 'not-a-timestamp') else '{}'::jsonb end
from private.s3d_attempt_backfill_fixture;
update private.s3d_attempt_backfill_fixture f set payment_id = p.id from public.payments p
where p.client_id = f.client_id and p.user_id = f.user_id
  and p.mercado_pago_payment_id = 'synthetic-attempt-backfill-' || f.label || '-' || f.user_id;
-- An existing credited receipt with a refund review must survive the backfill.
update public.payments p set status = 'refunded' from private.s3d_attempt_backfill_fixture f
where p.id = f.payment_id and f.label = 'valid';
update private.s3d_attempt_backfill_fixture f set
  client_snapshot = (select to_jsonb(c) from public.clients c where c.id = f.client_id),
  subscription_snapshot = (select to_jsonb(s) from public.subscriptions s where s.client_id = f.client_id),
  payment_snapshot = (select to_jsonb(p) from public.payments p where p.id = f.payment_id),
  effect_snapshot = (select to_jsonb(e) from private.payment_license_effects e where e.payment_id = f.payment_id),
  audit_snapshot = (select jsonb_agg(to_jsonb(a) order by id) from public.audit_logs a where a.client_id = f.client_id),
  erp_snapshot = (select jsonb_agg(to_jsonb(e) order by id) from public.erp_payments e where e.cliente_id = f.client_id);
do $baseline$
begin
  assert not exists(select 1 from private.s3d_attempt_backfill_fixture where payment_id is null
    or client_snapshot is null or subscription_snapshot is null or payment_snapshot is null or effect_snapshot is null);
  assert not exists(select 1 from private.s3d_attempt_backfill_fixture where effect_snapshot->>'credited_at' is null
    or effect_snapshot->>'credit_origin' <> 'payment_trigger' or effect_snapshot->>'source_plan' <> 'pro');
  assert (select effect_snapshot->>'review_required_at' is not null
    and effect_snapshot->>'review_reason' = 'refunded' from private.s3d_attempt_backfill_fixture where label = 'valid');
end;
$baseline$;
select 'PASS pre-migration synthetic backfill ledger committed; apply only the attempt migration, then run the paired after fixture';
commit;
