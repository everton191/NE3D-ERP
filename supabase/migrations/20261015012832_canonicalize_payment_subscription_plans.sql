begin;

-- Payment history remains unchanged. Accept the canonical variants used by
-- current writers alongside legacy values retained for financial traceability.
alter table public.payments drop constraint payments_billing_variant_check;
alter table public.payments add constraint payments_billing_variant_check
  check (billing_variant is null or billing_variant in
    ('premium_first_month', 'premium_monthly', 'start_monthly', 'pro_monthly'));

-- A browser session is not evidence of payment. Keep the existing authorized
-- superadmin policy and service-role ingestion; ordinary users retain reads.
drop policy if exists payments_insert_same_client on public.payments;

create or replace function private.s3d_apply_payment_to_subscription()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_status text := lower(coalesce(new.status, ''));
  v_plan text;
  v_subscription public.subscriptions%rowtype;
  v_plan_id uuid;
  v_price numeric(10,2);
  v_paid_at timestamptz := coalesce(new.paid_at, now());
  v_current_end timestamptz;
  v_base timestamptz;
  v_expires timestamptz;
begin
  if new.subscription_id is not null then
    select * into v_subscription from public.subscriptions
    where id = new.subscription_id for update;
    if v_subscription.id is null or v_subscription.client_id is distinct from new.client_id then
      raise exception 'Assinatura nao pertence ao cliente do pagamento' using errcode = '23503';
    end if;
  else
    select * into v_subscription from public.subscriptions
    where client_id = new.client_id order by created_at desc limit 1 for update;
  end if;

  -- Duplicate notifications must not extend the period a second time. Validate
  -- any supplied subscription reference before this early return.
  if TG_OP = 'UPDATE' and lower(coalesce(old.status, '')) = 'approved' and v_status = 'approved' then
    return new;
  end if;

  if v_status in ('pending', 'approved') then
    v_plan := case lower(replace(trim(coalesce(new.plan_slug, '')), '-', '_'))
      when 'start' then 'start' when 'starter' then 'start' when 'start_monthly' then 'start'
      when 'pro' then 'pro' when 'premium' then 'pro' when 'plus' then 'pro'
      when 'paid' then 'pro' when 'pago' then 'pro' when 'pro_monthly' then 'pro'
      when 'premium_monthly' then 'pro' when 'premium_first_month' then 'pro'
      else null end;
    -- Free/trial are not paid products. Unknown/missing metadata must not be
    -- silently interpreted as a paid plan. Historical rows are not rewritten.
    if v_plan is null then
      raise exception 'Plano de pagamento invalido' using errcode = '22023';
    end if;
    select id into v_plan_id from public.plans where slug = v_plan and active = true limit 1;
    if v_plan_id is null then
      raise exception 'Plano de pagamento indisponivel' using errcode = '22023';
    end if;
  end if;

  if v_subscription.id is null and new.client_id is not null then
    insert into public.subscriptions
      (client_id, user_id, plan_id, active_plan, plan_code, plan_status, status,
       status_assinatura, subscription_status, billing_variant)
    values (new.client_id, new.user_id,
      (select id from public.plans where slug = 'free' limit 1),
      'free', 'FREE', 'FREE', 'active', 'active', 'free', null)
    returning * into v_subscription;
  end if;
  if v_subscription.id is null then return new; end if;

  if v_status = 'pending' then
    update public.subscriptions
    set user_id = coalesce(user_id, new.user_id), pending_plan = v_plan, payment_status = 'pending',
        plan_status = case when plan_status = 'BLOCKED' then 'BLOCKED'
          when active_plan in ('start', 'pro') and coalesce(subscription_status, status) = 'active'
            and (coalesce(premium_until, plan_expires_at, current_period_end, expires_at) is null
              or coalesce(premium_until, plan_expires_at, current_period_end, expires_at) > now()) then 'ACTIVE'
          else 'PENDING' end,
        pending_started_at = coalesce(pending_started_at, new.created_at, now()), updated_at = now()
    where id = v_subscription.id;
  elsif v_status = 'approved' then
    v_price := coalesce(new.plan_price, new.amount, v_subscription.plan_price,
      (select price from public.plans where id = v_plan_id));
    v_current_end := coalesce(v_subscription.premium_until, v_subscription.plan_expires_at,
      v_subscription.current_period_end, v_subscription.expires_at);
    v_base := greatest(now(), v_paid_at, coalesce(v_current_end, '-infinity'::timestamptz));
    v_expires := v_base + interval '30 days';
    update public.subscriptions
    set user_id = coalesce(user_id, new.user_id), plan_id = v_plan_id, plan_code = upper(v_plan),
        plan_status = 'ACTIVE', subscription_active = true,
        manual_override = false, manual_override_reason = null,
        active_plan = v_plan, pending_plan = null, payment_status = 'approved',
        subscription_status = 'active', status = 'active', status_assinatura = 'active',
        is_trial_active = false, plan_price = v_price, price_locked = true,
        premium_until = v_expires, plan_expires_at = v_expires,
        current_period_start = case when v_current_end is null or v_current_end <= now()
          then v_paid_at else coalesce(current_period_start, now()) end,
        current_period_end = v_expires, expires_at = v_expires, next_billing_at = v_expires,
        proximo_vencimento = v_expires, pending_started_at = null, promo_used = true,
        billing_variant = v_plan || '_monthly', blocked_at = null, blocked_reason = null, updated_at = now()
    where id = v_subscription.id;

    -- Preserve the former approved-payment unblock behavior before mirroring.
    update public.clients
    set status = case when status = 'anonymized' then status else 'active' end,
        blocked_at = null, blocked_reason = null
    where id = v_subscription.client_id;
  elsif v_status in ('rejected', 'cancelled', 'refunded', 'charged_back') then
    update public.subscriptions
    set pending_plan = null,
        payment_status = case when v_status in ('refunded', 'charged_back') then 'cancelled' else v_status end,
        pending_started_at = null,
        plan_status = case when plan_status = 'BLOCKED' then 'BLOCKED'
          when active_plan in ('start', 'pro') and coalesce(subscription_status, status) = 'active'
            and (coalesce(premium_until, plan_expires_at, current_period_end, expires_at) is null
              or coalesce(premium_until, plan_expires_at, current_period_end, expires_at) > now()) then 'ACTIVE'
          else 'FREE' end,
        updated_at = now()
    where id = v_subscription.id;
  end if;

  perform private.s3d_reconcile_subscription_state(v_subscription.client_id, false);
  return new;
end;
$$;
revoke all on function private.s3d_apply_payment_to_subscription() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
