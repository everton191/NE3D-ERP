-- Fase 3: remove execução anônima herdada de RPCs internas e fixa o
-- search_path das funções apontadas pelo Security Advisor. As duas RPCs da
-- vitrine pública permanecem acessíveis porque as policies/RLS dependem delas.

revoke execute on function public.audit_cash_movement_insert() from public, anon;
revoke execute on function public.audit_cash_session_changes() from public, anon;
revoke execute on function public.audit_sale_payment_changes() from public, anon;
revoke execute on function public.claim_operation_reconciliation_batch(uuid, text, text, integer, interval) from public, anon;
revoke execute on function public.enqueue_operation_reconciliation(uuid, uuid, uuid, text, text, jsonb, timestamptz) from public, anon;
revoke execute on function public.erp_current_client_id() from public, anon;
revoke execute on function public.mark_abandoned_financial_operations(uuid, interval) from public, anon;
revoke execute on function public.record_financial_integrity_check(uuid, text, text, text, text, uuid, uuid, jsonb) from public, anon;
revoke execute on function public.record_financial_operation_event(uuid, uuid, uuid, text, text, jsonb, text) from public, anon;
revoke execute on function public.register_erp_audit_event(uuid, text, text, text, jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.release_operation_reconciliation_item(uuid, text, text, jsonb) from public, anon;
revoke execute on function public.run_financial_integrity_checks(uuid) from public, anon;
revoke execute on function public.run_operation_reconciliation(uuid) from public, anon;
revoke execute on function public.run_reconciliation_health_checks(uuid) from public, anon;
revoke execute on function public.s3d_current_paid_price() from public, anon;
revoke execute on function public.validate_cash_movement_integrity() from public, anon;
revoke execute on function public.validate_financial_operation_tracking() from public, anon;
revoke execute on function public.validate_reconciliation_tracking() from public, anon;
revoke execute on function public.validate_sale_payment_integrity() from public, anon;

grant execute on function public.audit_cash_movement_insert() to authenticated, service_role;
grant execute on function public.audit_cash_session_changes() to authenticated, service_role;
grant execute on function public.audit_sale_payment_changes() to authenticated, service_role;
grant execute on function public.claim_operation_reconciliation_batch(uuid, text, text, integer, interval) to authenticated, service_role;
grant execute on function public.enqueue_operation_reconciliation(uuid, uuid, uuid, text, text, jsonb, timestamptz) to authenticated, service_role;
grant execute on function public.erp_current_client_id() to authenticated, service_role;
grant execute on function public.mark_abandoned_financial_operations(uuid, interval) to authenticated, service_role;
grant execute on function public.record_financial_integrity_check(uuid, text, text, text, text, uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.record_financial_operation_event(uuid, uuid, uuid, text, text, jsonb, text) to authenticated, service_role;
grant execute on function public.register_erp_audit_event(uuid, text, text, text, jsonb, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.release_operation_reconciliation_item(uuid, text, text, jsonb) to authenticated, service_role;
grant execute on function public.run_financial_integrity_checks(uuid) to authenticated, service_role;
grant execute on function public.run_operation_reconciliation(uuid) to authenticated, service_role;
grant execute on function public.run_reconciliation_health_checks(uuid) to authenticated, service_role;
grant execute on function public.s3d_current_paid_price() to authenticated, service_role;
grant execute on function public.validate_cash_movement_integrity() to authenticated, service_role;
grant execute on function public.validate_financial_operation_tracking() to authenticated, service_role;
grant execute on function public.validate_reconciliation_tracking() to authenticated, service_role;
grant execute on function public.validate_sale_payment_integrity() to authenticated, service_role;

-- O gate era invocável mas continha uma referência obsoleta a
-- subscriptions.plan_slug. A coluna canônica é active_plan; plans.slug é o
-- fallback para registros legados.
create or replace function public.storefront_publication_allowed(p_store_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
declare
  v_owner_id uuid;
  v_active boolean;
  v_publication_status text;
  v_client_id uuid;
  v_active_plan text;
  v_subscription_status text;
  v_payment_status text;
  v_cancel_at_period_end boolean;
  v_period_end timestamptz;
begin
  select s.owner_id, s.active, coalesce(s.publication_status, 'draft')
    into v_owner_id, v_active, v_publication_status
  from public.stores s
  where s.id = p_store_id;

  if v_owner_id is null or v_active is not true or v_publication_status <> 'published' then
    return false;
  end if;

  select p.client_id into v_client_id
  from public.profiles p
  where p.user_id = v_owner_id
  limit 1;

  select
    lower(coalesce(sub.active_plan, plans.slug, 'free')),
    lower(coalesce(sub.subscription_status, sub.status_assinatura, sub.status, 'free')),
    lower(coalesce(sub.payment_status, 'none')),
    coalesce(sub.cancel_at_period_end, false),
    coalesce(sub.current_period_end, sub.plan_expires_at, sub.expires_at, sub.next_billing_at, sub.proximo_vencimento)
    into v_active_plan, v_subscription_status, v_payment_status, v_cancel_at_period_end, v_period_end
  from public.subscriptions sub
  left join public.plans plans on plans.id = sub.plan_id
  where (v_client_id is not null and sub.client_id = v_client_id)
     or sub.user_id = v_owner_id
  order by coalesce(sub.updated_at, sub.created_at, now()) desc
  limit 1;

  if v_active_plan not in ('start', 'pro', 'premium', 'premium_trial') or v_payment_status = 'pending' then
    return false;
  end if;

  if v_subscription_status in ('active', 'trialing', 'paid', 'pago') then
    return v_period_end is null or v_period_end > now();
  end if;

  if v_subscription_status in ('canceling', 'cancelled', 'canceled', 'cancelado') or v_cancel_at_period_end is true then
    return v_period_end is not null and v_period_end > now();
  end if;

  return false;
end;
$$;

alter function public.get_storefront_product_ranking(uuid) set search_path = pg_catalog;
alter function public.storefront_publication_allowed(uuid) set search_path = pg_catalog;
alter function public.set_updated_at() set search_path = pg_catalog;
alter function public.set_storefront_updated_at() set search_path = pg_catalog;
alter function public.storefront_owner_matches_store() set search_path = pg_catalog;
alter function public.storefront_image_owner_matches_product() set search_path = pg_catalog;
alter function public.s3d_cash_session_lock_key(uuid, text) set search_path = pg_catalog;
alter function public.s3d_financial_operation_lock_key(uuid, uuid) set search_path = pg_catalog;
