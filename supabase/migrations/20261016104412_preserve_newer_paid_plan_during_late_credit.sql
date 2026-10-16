begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
lock table public.payments in share row exclusive mode;

-- Freeze facts of a NEW credit, not mutable payment revisions. Historical
-- receipts are deliberately left unknown; do not invent original plan/prices.
alter table private.payment_license_effects
  add column source_approved_at timestamptz,
  add column source_plan text check (source_plan in ('start', 'pro')),
  add column source_price numeric(10,2),
  add column projection_review_at timestamptz,
  add column projection_review_reason text check (projection_review_reason in
    ('ambiguous_approval_time', 'newer_manual_override', 'historical_approval_unknown')),
  add constraint payment_projection_review_pair check
    ((projection_review_at is null) = (projection_review_reason is null));
create index payment_effects_subscription_source_idx
  on private.payment_license_effects(client_id, subscription_id, source_approved_at)
  where credited_at is not null;

-- General audit_logs accepts client-originated diagnostics and is NOT proof of
-- admin authority. Only the already-authorized manual-plan RPC writes this head.
create table private.manual_plan_projection_authority (
  subscription_id uuid primary key references public.subscriptions(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  plan_code text not null check (plan_code in ('FREE', 'START', 'PRO')),
  operated_at timestamptz not null
);
alter table private.manual_plan_projection_authority owner to postgres;
alter table private.manual_plan_projection_authority enable row level security;
revoke all on private.manual_plan_projection_authority from public, anon, authenticated, service_role;
do $admin_authority$
declare
  v_definition text := replace(pg_get_functiondef('private.superadmin_set_plan_v2(text,text,text,timestamptz,text)'::regprocedure), E'\r\n', E'\n');
  v_anchor constant text := E'  insert into public.audit_logs (user_id, client_id, action, details)\n';
begin
  if (length(v_definition) - length(replace(v_definition, v_anchor, ''))) / length(v_anchor) <> 1
    or position('if not public.erp_is_superadmin() then' in v_definition) = 0
    or position('private.manual_plan_projection_authority' in v_definition) <> 0 then
    raise exception 'Contrato da concessao manual inesperado';
  end if;
  execute replace(v_definition, v_anchor, $head$
  insert into private.manual_plan_projection_authority(subscription_id, client_id, actor_user_id, plan_code, operated_at)
  values(v_subscription, v_client, v_actor, v_plan, clock_timestamp())
  on conflict(subscription_id) do update set actor_user_id = excluded.actor_user_id,
    plan_code = excluded.plan_code, operated_at = excluded.operated_at;
$head$ || v_anchor);
end;
$admin_authority$;

do $projection$
declare
  v_definition text := replace(pg_get_functiondef('private.s3d_apply_payment_to_subscription()'::regprocedure), E'\r\n', E'\n');
  v_declarations constant text := E'  v_expires timestamptz;\n';
  v_approved constant text := E'  elsif v_status = ''approved'' then\n';
  v_insert constant text := E'    insert into private.payment_license_effects(payment_id, client_id, subscription_id, credited_at, credit_origin)\n    values(new.id, new.client_id, v_subscription.id, now(), ''payment_trigger'')';
  v_conflict constant text := E'      credit_origin = excluded.credit_origin, subscription_id = excluded.subscription_id\n    where private.payment_license_effects.credited_at is null;';
  v_repeat constant text := E'    if not found then\n      -- The financial record may change, but its paid period is applied once.';
  v_before_update constant text := E'    v_expires := v_base + interval ''30 days'';\n';
  v_prepare constant text := $prepare$
    select * into v_receipt from private.payment_license_effects where payment_id = new.id;
    v_source_at := case when v_receipt.credited_at is not null then v_receipt.source_approved_at else new.paid_at end;
    v_source_plan := coalesce(v_receipt.source_plan, v_plan);
    v_source_price := coalesce(v_receipt.source_price, new.plan_price, new.amount, v_subscription.plan_price,
      (select price from public.plans where id = v_plan_id));
    select max(e.source_approved_at), bool_or(e.source_approved_at is null)
      into v_latest_approval, v_unknown_history
    from private.payment_license_effects e
    where e.client_id = new.client_id and e.subscription_id = v_subscription.id
      and e.payment_id <> new.id and e.credited_at is not null;
    v_manual_at := greatest(case when v_subscription.manual_override then v_subscription.manual_override_at end,
      (select h.operated_at from private.manual_plan_projection_authority h
        where h.subscription_id = v_subscription.id and h.client_id = new.client_id));
    -- Privileged legacy writers that do not supply a paid_at retain their
    -- existing behavior. The provider RPC requires a real date_approved.
    if v_source_at is not null then
      if v_manual_at >= v_source_at then
        v_preserve_projection := true;
        v_review_reason := 'newer_manual_override';
      elsif v_latest_approval > v_source_at then
        v_preserve_projection := true;
      elsif v_latest_approval = v_source_at then
        v_preserve_projection := true;
        if exists(select 1 from private.payment_license_effects e
          where e.client_id = new.client_id and e.subscription_id = v_subscription.id
            and e.payment_id <> new.id and e.credited_at is not null and e.source_approved_at = v_source_at
            and (e.source_plan is distinct from v_source_plan or e.source_price is distinct from v_source_price)) then
          v_review_reason := 'ambiguous_approval_time';
        end if;
      elsif coalesce(v_unknown_history, false)
        and (v_subscription.active_plan is distinct from v_source_plan or v_subscription.plan_price is distinct from v_source_price) then
        v_preserve_projection := true;
        v_review_reason := 'historical_approval_unknown';
      end if;
      v_keep_pending := v_subscription.payment_status = 'pending' and exists (
        select 1 from public.payments p where p.client_id = new.client_id and p.id <> new.id
          and p.status = 'pending' and p.criado_em > coalesce(new.criado_em, new.created_at));
    end if;
    if v_review_reason is not null then
      insert into private.payment_license_effects(payment_id, client_id, subscription_id, projection_review_at, projection_review_reason)
      values(new.id, new.client_id, v_subscription.id, now(), v_review_reason)
      on conflict(payment_id) do update set projection_review_at = excluded.projection_review_at,
        projection_review_reason = excluded.projection_review_reason
      where private.payment_license_effects.projection_review_at is null;
      if found then
        insert into public.audit_logs(client_id, action, details)
        values(new.client_id, 'billing_payment_projection_review_required', jsonb_build_object(
          'provider', 'mercado_pago', 'payment_id', new.id, 'mercado_pago_payment_id', new.mercado_pago_payment_id,
          'reason', v_review_reason, 'source_approved_at', v_source_at, 'latest_approved_at', v_latest_approval,
          'current_plan', v_subscription.active_plan, 'current_price', v_subscription.plan_price,
          'payment_plan', v_source_plan, 'payment_price', v_source_price,
          'policy', 'preserve_current_plan_credit_once', 'operated_at', now()));
      end if;
    end if;
$prepare$;
  v_extend_only constant text := $extend$
    if v_preserve_projection then
      -- A late, tied or ambiguous receipt still earns its ONE paid period,
      -- but cannot replace the commercial tuple, admin grant, block or pending.
      update public.subscriptions set premium_until = v_expires, plan_expires_at = v_expires,
        current_period_end = v_expires, expires_at = v_expires, next_billing_at = v_expires,
        proximo_vencimento = v_expires, updated_at = now()
      where id = v_subscription.id;
      if v_review_reason is null and not v_keep_pending and v_subscription.payment_status = 'pending' then
        -- Preserving a commercial tuple must not leave this payment's own
        -- resolved attempt pending. Another later checkout remains protected.
        update public.subscriptions set pending_plan = null, pending_started_at = null,
          payment_status = 'approved' where id = v_subscription.id;
      end if;
      if v_review_reason is null and v_subscription.active_plan in ('start', 'pro')
        and v_subscription.plan_status <> 'BLOCKED' and v_subscription.blocked_at is null
        and v_subscription.archived_at is null and v_subscription.anonymized_at is null
        and not exists(select 1 from public.clients c where c.id = new.client_id
          and (c.status in ('blocked', 'anonymized') or c.blocked_at is not null
            or c.archived_at is not null or c.anonymized_at is not null)) then
        -- New earned validity reactivates the CURRENT paid tuple, not the old
        -- receipt's product. Never undo a block or an administrative review.
        update public.subscriptions set plan_status = 'ACTIVE', subscription_active = true,
          subscription_status = 'active', status = 'active',
          status_assinatura = case when cancel_at_period_end then 'canceling' else 'active' end,
          is_trial_active = false, current_period_start = case when v_current_end is null or v_current_end <= now()
            then v_paid_at else coalesce(current_period_start, now()) end
        where id = v_subscription.id;
      end if;
      perform private.s3d_reconcile_subscription_state(v_subscription.client_id, false);
      return new;
    end if;
$extend$;
  v_anchor text;
begin
  foreach v_anchor in array array[v_declarations, v_approved, v_insert, v_conflict, v_repeat, v_before_update,
    'active_plan = v_plan, pending_plan = null, payment_status = ''approved'',',
    'proximo_vencimento = v_expires, pending_started_at = null, promo_used = true,'] loop
    if (length(v_definition) - length(replace(v_definition, v_anchor, ''))) / length(v_anchor) <> 1 then
      raise exception 'Contrato do trigger de pagamentos inesperado: %', left(v_anchor, 80);
    end if;
  end loop;
  v_definition := replace(v_definition, v_declarations, v_declarations || E'  v_receipt private.payment_license_effects%rowtype;\n  v_source_at timestamptz;\n  v_source_plan text;\n  v_source_price numeric(10,2);\n  v_latest_approval timestamptz;\n  v_manual_at timestamptz;\n  v_unknown_history boolean;\n  v_preserve_projection boolean := false;\n  v_keep_pending boolean := false;\n  v_review_reason text;\n');
  v_definition := replace(v_definition, v_approved, v_approved || v_prepare);
  v_definition := replace(v_definition, v_insert,
    E'    insert into private.payment_license_effects(payment_id, client_id, subscription_id, credited_at, credit_origin, source_approved_at, source_plan, source_price)\n    values(new.id, new.client_id, v_subscription.id, now(), ''payment_trigger'', v_source_at, v_source_plan, v_source_price)');
  v_definition := replace(v_definition, v_conflict,
    E'      credit_origin = excluded.credit_origin, subscription_id = excluded.subscription_id,\n      source_approved_at = excluded.source_approved_at, source_plan = excluded.source_plan, source_price = excluded.source_price\n    where private.payment_license_effects.credited_at is null;');
  v_definition := replace(v_definition, v_repeat,
    E'    if not found then\n      if v_preserve_projection or v_keep_pending then\n        perform private.s3d_reconcile_subscription_state(v_subscription.client_id, false);\n        return new;\n      end if;\n      -- The financial record may change, but its paid period is applied once.');
  v_definition := replace(v_definition, v_before_update, v_before_update || v_extend_only);
  v_definition := replace(v_definition, 'active_plan = v_plan, pending_plan = null, payment_status = ''approved'',',
    E'active_plan = v_plan, pending_plan = case when v_keep_pending then v_subscription.pending_plan end,\n        payment_status = case when v_keep_pending then v_subscription.payment_status else ''approved'' end,');
  v_definition := replace(v_definition, 'proximo_vencimento = v_expires, pending_started_at = null, promo_used = true,',
    'proximo_vencimento = v_expires, pending_started_at = case when v_keep_pending then v_subscription.pending_started_at end, promo_used = true,');
  execute v_definition;
end;
$projection$;

-- Existing RLS, private-table ACLs and the definer trigger's pinned search_path
-- are unchanged. No financial/subscription/customer history is rewritten.
-- Rollback: restore the pre-migration trigger body before dropping new columns;
-- retain the original credit markers and review evidence throughout.
notify pgrst, 'reload schema';
commit;
