begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Prevent a concurrent approval from landing between the baseline and the
-- trigger replacement. Existing customer/license/payment rows are untouched.
lock table public.payments in share row exclusive mode;
create table private.payment_license_effects (
  payment_id uuid primary key references public.payments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  credited_at timestamptz,
  credit_origin text check (credit_origin in ('legacy_approved_snapshot', 'payment_trigger')),
  review_required_at timestamptz,
  review_reason text check (review_reason in ('refunded', 'charged_back')),
  constraint payment_license_effects_credit_check check ((credited_at is null) = (credit_origin is null)),
  constraint payment_license_effects_review_check check ((review_required_at is null) = (review_reason is null))
);
alter table private.payment_license_effects owner to postgres;
alter table private.payment_license_effects enable row level security;
revoke all on private.payment_license_effects from public, anon, authenticated, service_role;

-- An already approved payment must never be credited again by this migration.
-- This is a baseline marker, not a reconstruction of historical credit dates.
insert into private.payment_license_effects(payment_id, client_id, subscription_id, credited_at, credit_origin)
select p.id, p.client_id, coalesce(p.subscription_id, s.id),
  coalesce(p.paid_at, p.updated_at, p.created_at), 'legacy_approved_snapshot'
from public.payments p
left join public.subscriptions s on s.client_id = p.client_id
where lower(p.status) = 'approved';

do $credit$
declare
  v_definition text := replace(pg_get_functiondef('private.s3d_apply_payment_to_subscription()'::regprocedure), E'\r\n', E'\n');
  v_approved constant text := E'  elsif v_status = ''approved'' then\n';
  v_negative constant text := E'  elsif v_status in (''rejected'', ''cancelled'', ''refunded'', ''charged_back'') then\n';
  v_credit constant text := $claim$
    insert into private.payment_license_effects(payment_id, client_id, subscription_id, credited_at, credit_origin)
    values(new.id, new.client_id, v_subscription.id, now(), 'payment_trigger')
    on conflict(payment_id) do update set credited_at = excluded.credited_at,
      credit_origin = excluded.credit_origin, subscription_id = excluded.subscription_id
    where private.payment_license_effects.credited_at is null;
    if not found then
      -- The financial record may change, but its paid period is applied once.
      update public.subscriptions set payment_status = 'approved', pending_plan = null,
        pending_started_at = null, updated_at = now()
      where id = v_subscription.id and not exists (
        select 1 from public.payments p where p.client_id = new.client_id
          and p.id <> new.id and p.status = 'pending'
          and p.created_at >= now() - interval '24 hours');
      perform private.s3d_reconcile_subscription_state(v_subscription.client_id, false);
      return new;
    end if;
$claim$;
  v_review constant text := $review$
    if v_status in ('refunded', 'charged_back') then
      insert into private.payment_license_effects(payment_id, client_id, subscription_id, review_required_at, review_reason)
      values(new.id, new.client_id, v_subscription.id, now(), v_status)
      on conflict(payment_id) do update set review_required_at = excluded.review_required_at,
        review_reason = excluded.review_reason
      where private.payment_license_effects.review_required_at is null;
      if found then
        insert into public.audit_logs(client_id, action, details)
        values(new.client_id, 'billing_payment_review_required', jsonb_build_object(
          'provider', 'mercado_pago', 'payment_id', new.id,
          'mercado_pago_payment_id', new.mercado_pago_payment_id,
          'status', v_status, 'review_required', true,
          'policy', 'preserve_existing_validity', 'operated_at', now()));
      end if;
    end if;
$review$;
begin
  if (length(v_definition) - length(replace(v_definition, v_approved, ''))) / length(v_approved) <> 1
    or (length(v_definition) - length(replace(v_definition, v_negative, ''))) / length(v_negative) <> 1
    or position(E'begin\n  if new.subscription_id is not null then' in v_definition) = 0
    or position('where id = new.subscription_id for update;' in v_definition) = 0 then
    raise exception 'Contrato do trigger de pagamentos inesperado';
  end if;
  -- Client -> subscription order, using NO KEY UPDATE to coexist with the
  -- KEY SHARE locks already taken by payment foreign-key checks on INSERT.
  v_definition := replace(v_definition, E'begin\n  if new.subscription_id is not null then',
    E'begin\n  perform 1 from public.clients where id = new.client_id for no key update;\n  if new.subscription_id is not null then');
  v_definition := replace(v_definition, 'where id = new.subscription_id for update;',
    'where id = new.subscription_id and client_id = new.client_id for no key update;');
  v_definition := replace(v_definition, 'where client_id = new.client_id order by created_at desc limit 1 for update;',
    'where client_id = new.client_id order by created_at desc limit 1 for no key update;');
  execute replace(replace(v_definition, v_approved, v_approved || v_credit), v_negative, v_negative || v_review);
end;
$credit$;

-- Paid validity remains unchanged on refund/chargeback, per the owner's policy.
-- No reviews or refunds are inferred for non-approved historical rows.
-- Rollback requires restoring the previous trigger body before dropping the
-- private table; losing this marker would remove cross-status idempotency.
notify pgrst, 'reload schema';
commit;
