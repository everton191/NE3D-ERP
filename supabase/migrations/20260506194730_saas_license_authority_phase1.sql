-- Simplifica 3D SaaS authority phase 1.
-- Centralizes effective license decisions on subscriptions and exposes safe RPCs.

create extension if not exists pgcrypto;
create schema if not exists private;

alter table public.subscriptions
  add column if not exists plan_code text not null default 'FREE',
  add column if not exists plan_status text not null default 'FREE',
  add column if not exists subscription_active boolean not null default false,
  add column if not exists manual_override boolean not null default false,
  add column if not exists manual_override_reason text,
  add column if not exists manual_override_by uuid references auth.users(id) on delete set null,
  add column if not exists manual_override_at timestamptz,
  add column if not exists premium_until timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists archived_at timestamptz,
  add column if not exists anonymized_at timestamptz,
  add column if not exists trial_consumed_at timestamptz;

alter table public.clients
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists archived_at timestamptz,
  add column if not exists trial_consumed_at timestamptz;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_plan_code_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions drop constraint subscriptions_plan_code_check;
  end if;

  alter table public.subscriptions
    add constraint subscriptions_plan_code_check
    check (plan_code in ('FREE', 'PREMIUM'));

  if exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_plan_status_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions drop constraint subscriptions_plan_status_check;
  end if;

  alter table public.subscriptions
    add constraint subscriptions_plan_status_check
    check (plan_status in ('FREE', 'TRIAL', 'ACTIVE', 'PENDING', 'EXPIRED', 'BLOCKED'));
end $$;

update public.subscriptions s
set
  plan_code = case
    when lower(coalesce(s.active_plan, 'free')) in ('premium', 'premium_trial', 'pro', 'paid', 'pago') then 'PREMIUM'
    else 'FREE'
  end,
  plan_status = case
    when s.blocked_at is not null then 'BLOCKED'
    when lower(coalesce(s.active_plan, 'free')) = 'premium'
      and coalesce(s.subscription_status, s.status, '') in ('active', 'approved') then 'ACTIVE'
    when lower(coalesce(s.active_plan, 'free')) = 'premium_trial'
      and coalesce(s.trial_expires_at, s.plan_expires_at, s.current_period_end, s.expires_at) > now() then 'TRIAL'
    when coalesce(s.payment_status, '') = 'pending' or s.pending_plan is not null then 'PENDING'
    when lower(coalesce(s.active_plan, 'free')) in ('premium', 'premium_trial')
      and coalesce(s.plan_expires_at, s.trial_expires_at, s.current_period_end, s.expires_at) < now() then 'EXPIRED'
    else 'FREE'
  end,
  subscription_active = (
    lower(coalesce(s.active_plan, 'free')) = 'premium'
    and coalesce(s.subscription_status, s.status, '') in ('active', 'approved')
    and (s.plan_expires_at is null or s.plan_expires_at > now())
  ),
  premium_until = coalesce(s.premium_until, s.plan_expires_at, s.current_period_end, s.expires_at),
  trial_consumed_at = case
    when s.trial_consumed_at is not null then s.trial_consumed_at
    when coalesce(s.trial_started_at, s.current_period_start) is not null
      and lower(coalesce(s.active_plan, 'free')) = 'premium_trial' then coalesce(s.trial_started_at, s.current_period_start)
    else s.trial_consumed_at
  end,
  updated_at = now();

update public.clients c
set trial_consumed_at = coalesce(c.trial_consumed_at, s.trial_consumed_at),
    blocked_at = coalesce(c.blocked_at, s.blocked_at),
    blocked_reason = coalesce(c.blocked_reason, s.blocked_reason),
    archived_at = coalesce(c.archived_at, s.archived_at)
from public.subscriptions s
where s.client_id = c.id;

create index if not exists subscriptions_plan_authority_idx
  on public.subscriptions(client_id, plan_status, plan_code, updated_at desc);

create index if not exists subscriptions_user_authority_idx
  on public.subscriptions(user_id, updated_at desc);

create index if not exists subscriptions_archived_idx
  on public.subscriptions(archived_at)
  where archived_at is not null;

create or replace function private.s3d_uuid_or_null(p_value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p_value is null or trim(p_value) = '' then
    return null;
  end if;
  return trim(p_value)::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function private.s3d_plan_code_from_slug(p_value text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(p_value, 'free')) in ('premium', 'premium_trial', 'pro', 'paid', 'pago') then 'PREMIUM'
    else 'FREE'
  end;
$$;

create or replace function private.s3d_slug_from_plan_code(p_value text, p_trial boolean default false)
returns text
language sql
immutable
as $$
  select case
    when upper(coalesce(p_value, 'FREE')) = 'PREMIUM' and p_trial then 'premium_trial'
    when upper(coalesce(p_value, 'FREE')) = 'PREMIUM' then 'premium'
    else 'free'
  end;
$$;

create or replace function private.s3d_guard_trial_consumption()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_client_consumed_at timestamptz;
  v_is_trial boolean;
  v_was_trial boolean := false;
begin
  v_is_trial := (
    lower(coalesce(new.active_plan, 'free')) = 'premium_trial'
    or coalesce(new.subscription_status, '') = 'trialing'
    or coalesce(new.status, '') = 'trialing'
    or coalesce(new.is_trial_active, false) is true
  );

  if tg_op = 'UPDATE' then
    v_was_trial := (
      lower(coalesce(old.active_plan, 'free')) = 'premium_trial'
      or coalesce(old.subscription_status, '') = 'trialing'
      or coalesce(old.status, '') = 'trialing'
      or coalesce(old.is_trial_active, false) is true
    );
  end if;

  if not v_is_trial then
    return new;
  end if;

  select c.trial_consumed_at
  into v_client_consumed_at
  from public.clients c
  where c.id = new.client_id
  for update;

  if v_client_consumed_at is not null and not v_was_trial then
    new.plan_code := 'FREE';
    new.plan_status := 'FREE';
    new.subscription_active := false;
    new.active_plan := 'free';
    new.plan_id := (select id from public.plans where slug = 'free' limit 1);
    new.status := 'active';
    new.status_assinatura := 'active';
    new.subscription_status := 'free';
    new.trial_started_at := null;
    new.trial_expires_at := null;
    new.is_trial_active := false;
    new.current_period_start := null;
    new.current_period_end := null;
    new.expires_at := null;
    new.next_billing_at := null;
    new.proximo_vencimento := null;
    new.plan_expires_at := null;
    return new;
  end if;

  new.trial_consumed_at := coalesce(new.trial_consumed_at, v_client_consumed_at, new.trial_started_at, now());
  new.trial_started_at := coalesce(new.trial_started_at, new.current_period_start, new.trial_consumed_at, now());
  new.trial_expires_at := coalesce(new.trial_expires_at, new.current_period_end, new.expires_at, new.trial_started_at + interval '7 days');
  new.plan_code := 'PREMIUM';
  new.plan_status := 'TRIAL';
  new.subscription_active := false;
  new.is_trial_active := true;

  update public.clients c
  set trial_consumed_at = coalesce(c.trial_consumed_at, new.trial_consumed_at),
      updated_at = now()
  where c.id = new.client_id;

  return new;
end;
$$;

drop trigger if exists s3d_guard_trial_consumption on public.subscriptions;
create trigger s3d_guard_trial_consumption
before insert or update of active_plan, status, subscription_status, is_trial_active, trial_started_at, trial_expires_at
on public.subscriptions
for each row execute function private.s3d_guard_trial_consumption();

create or replace function private.s3d_apply_payment_to_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_plan text := case
    when lower(coalesce(new.plan_slug, 'premium')) in ('premium', 'pro', 'paid', 'pago') then 'premium'
    when lower(coalesce(new.plan_slug, '')) in ('premium_trial', 'trial') then 'premium_trial'
    else 'premium'
  end;
  v_subscription public.subscriptions%rowtype;
  v_price numeric(10,2);
  v_expires timestamptz;
begin
  if new.subscription_id is not null then
    select * into v_subscription
    from public.subscriptions
    where id = new.subscription_id
    for update;
  end if;

  if v_subscription.id is null and new.client_id is not null then
    select * into v_subscription
    from public.subscriptions
    where client_id = new.client_id
    order by created_at desc
    limit 1
    for update;
  end if;

  if v_subscription.id is null and new.client_id is not null then
    insert into public.subscriptions (
      client_id, plan_id, active_plan, plan_code, plan_status, status, status_assinatura, subscription_status
    )
    values (
      new.client_id,
      (select id from public.plans where slug = 'free' limit 1),
      'free',
      'FREE',
      'FREE',
      'active',
      'active',
      'free'
    )
    returning * into v_subscription;
  end if;

  if v_subscription.id is null then
    return new;
  end if;

  if new.status = 'pending' then
    update public.subscriptions
    set pending_plan = v_plan,
        payment_status = 'pending',
        plan_status = case
          when plan_status = 'BLOCKED' then 'BLOCKED'
          when active_plan = 'premium_trial'
            and coalesce(trial_expires_at, plan_expires_at, current_period_end, expires_at) > now() then 'TRIAL'
          when active_plan = 'premium'
            and coalesce(subscription_status, status) = 'active' then 'ACTIVE'
          else 'PENDING'
        end,
        pending_started_at = coalesce(pending_started_at, new.created_at, now()),
        updated_at = now()
    where id = v_subscription.id;
  elsif new.status = 'approved' then
    v_price := coalesce(new.plan_price, new.amount, v_subscription.plan_price, public.s3d_current_paid_price());
    v_expires := coalesce(new.paid_at, now()) + interval '30 days';

    update public.subscriptions
    set plan_id = (select id from public.plans where slug = v_plan limit 1),
        plan_code = 'PREMIUM',
        plan_status = case when v_plan = 'premium_trial' then 'TRIAL' else 'ACTIVE' end,
        subscription_active = case when v_plan = 'premium' then true else false end,
        active_plan = v_plan,
        pending_plan = null,
        payment_status = 'approved',
        subscription_status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        status_assinatura = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        plan_price = case when v_plan = 'premium' then v_price else null end,
        price_locked = case when v_plan = 'premium' then true else false end,
        premium_until = case when v_plan = 'premium' then v_expires else null end,
        plan_expires_at = v_expires,
        current_period_start = coalesce(current_period_start, now()),
        current_period_end = v_expires,
        expires_at = v_expires,
        next_billing_at = v_expires,
        proximo_vencimento = v_expires,
        pending_started_at = null,
        blocked_at = null,
        blocked_reason = null,
        updated_at = now()
    where id = v_subscription.id;
  elsif new.status in ('rejected', 'cancelled', 'refunded', 'charged_back') then
    update public.subscriptions
    set pending_plan = null,
        payment_status = case when new.status in ('refunded', 'charged_back') then 'cancelled' else new.status end,
        pending_started_at = null,
        plan_status = case
          when plan_status = 'BLOCKED' then 'BLOCKED'
          when active_plan = 'premium_trial'
            and coalesce(trial_expires_at, plan_expires_at, current_period_end, expires_at) > now() then 'TRIAL'
          when active_plan = 'premium'
            and coalesce(subscription_status, status) = 'active'
            and (plan_expires_at is null or plan_expires_at > now()) then 'ACTIVE'
          else 'FREE'
        end,
        updated_at = now()
    where id = v_subscription.id;
  end if;

  perform public.s3d_cleanup_subscription_state();
  return new;
end;
$$;

create or replace function private.get_effective_license_impl(p_user_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_is_superadmin boolean := false;
  v_target_uuid uuid := private.s3d_uuid_or_null(p_user_id);
  v_client_id uuid;
  v_sub record;
  v_now timestamptz := now();
  v_plan_code text := 'FREE';
  v_plan_slug text := 'free';
  v_effective_status text := 'FREE';
  v_trial_start timestamptz;
  v_trial_end timestamptz;
  v_premium_until timestamptz;
  v_pending_started timestamptz;
  v_pending boolean := false;
  v_remaining_trial_days integer := 0;
begin
  if v_actor is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;

  v_is_superadmin := public.erp_is_superadmin();
  if v_target_uuid is null and coalesce(trim(p_user_id), '') = '' then
    v_target_uuid := v_actor;
  end if;

  if coalesce(trim(p_user_id), '') <> '' and not v_is_superadmin and v_target_uuid is distinct from v_actor then
    raise exception 'Erro de permissao: apenas superadmin pode consultar outro usuario.' using errcode = '42501';
  end if;

  if v_is_superadmin and (p_user_id is null or trim(p_user_id) = '') then
    return jsonb_build_object(
      'user_id', v_actor,
      'client_id', null,
      'plan_code', 'PREMIUM',
      'effective_status', 'ACTIVE',
      'is_premium', true,
      'is_trial', false,
      'is_pending', false,
      'is_blocked', false,
      'remaining_trial_days', 0,
      'trial_start_at', null,
      'trial_end_at', null,
      'premium_until', null,
      'blocked_at', null,
      'blocked_reason', null,
      'source', 'superadmin',
      'updated_at', v_now
    );
  end if;

  perform public.s3d_cleanup_subscription_state();

  select coalesce(
    (select p.client_id from public.profiles p where p.user_id = v_target_uuid and p.client_id is not null limit 1),
    (select ep.client_id from public.erp_profiles ep where ep.id = v_target_uuid and ep.client_id is not null limit 1),
    (select s.client_id from public.subscriptions s where s.user_id = v_target_uuid order by s.updated_at desc nulls last, s.created_at desc limit 1),
    (select c.id from public.clients c where c.id = v_target_uuid limit 1)
  ) into v_client_id;

  if v_client_id is null then
    return jsonb_build_object(
      'user_id', v_target_uuid,
      'client_id', null,
      'plan_code', 'FREE',
      'effective_status', 'FREE',
      'is_premium', false,
      'is_trial', false,
      'is_pending', false,
      'is_blocked', false,
      'remaining_trial_days', 0,
      'trial_start_at', null,
      'trial_end_at', null,
      'premium_until', null,
      'blocked_at', null,
      'blocked_reason', null,
      'source', 'subscriptions:none',
      'updated_at', v_now
    );
  end if;

  select
    s.*,
    c.status as client_status,
    c.blocked_at as client_blocked_at,
    c.blocked_reason as client_blocked_reason,
    c.archived_at as client_archived_at,
    c.anonymized_at as client_anonymized_at
  into v_sub
  from public.subscriptions s
  left join public.clients c on c.id = s.client_id
  where s.client_id = v_client_id
  order by s.updated_at desc nulls last, s.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'user_id', v_target_uuid,
      'client_id', v_client_id,
      'plan_code', 'FREE',
      'effective_status', 'FREE',
      'is_premium', false,
      'is_trial', false,
      'is_pending', false,
      'is_blocked', false,
      'remaining_trial_days', 0,
      'trial_start_at', null,
      'trial_end_at', null,
      'premium_until', null,
      'blocked_at', null,
      'blocked_reason', null,
      'source', 'subscriptions:none',
      'updated_at', v_now
    );
  end if;

  v_trial_start := coalesce(v_sub.trial_started_at, v_sub.current_period_start);
  v_trial_end := coalesce(v_sub.trial_expires_at, v_sub.plan_expires_at, v_sub.current_period_end, v_sub.expires_at);
  v_premium_until := coalesce(v_sub.premium_until, v_sub.plan_expires_at, v_sub.current_period_end, v_sub.expires_at);
  v_pending_started := coalesce(v_sub.pending_started_at, v_sub.updated_at, v_sub.created_at);
  v_plan_code := coalesce(v_sub.plan_code, private.s3d_plan_code_from_slug(coalesce(v_sub.active_plan, 'free')));
  v_plan_slug := coalesce(v_sub.active_plan, private.s3d_slug_from_plan_code(v_plan_code, false), 'free');
  v_pending := (
    (coalesce(v_sub.payment_status, '') = 'pending' or v_sub.pending_plan is not null)
    and (v_pending_started is null or v_pending_started >= v_now - interval '24 hours')
  );

  if coalesce(v_sub.plan_status, '') = 'BLOCKED'
     or v_sub.blocked_at is not null
     or v_sub.client_blocked_at is not null
     or coalesce(v_sub.client_status, '') = 'blocked' then
    v_effective_status := 'BLOCKED';
  elsif coalesce(v_sub.manual_override, false) is true
     and v_plan_code = 'PREMIUM'
     and (v_premium_until is null or v_premium_until > v_now) then
    v_effective_status := 'ACTIVE';
  elsif v_plan_code = 'PREMIUM'
     and lower(coalesce(v_plan_slug, '')) = 'premium'
     and coalesce(v_sub.subscription_status, v_sub.status, '') = 'active'
     and (v_premium_until is null or v_premium_until > v_now) then
    v_effective_status := 'ACTIVE';
  elsif v_plan_code = 'PREMIUM'
     and lower(coalesce(v_plan_slug, '')) = 'premium_trial'
     and v_trial_end is not null
     and v_trial_end > v_now then
    v_effective_status := 'TRIAL';
  elsif v_pending then
    v_effective_status := 'PENDING';
  elsif (
    lower(coalesce(v_plan_slug, '')) in ('premium', 'premium_trial')
    and coalesce(v_trial_end, v_premium_until) is not null
    and coalesce(v_trial_end, v_premium_until) <= v_now
  ) or coalesce(v_sub.subscription_status, v_sub.status, '') in ('past_due', 'cancelled', 'expired') then
    v_effective_status := 'EXPIRED';
  else
    v_effective_status := 'FREE';
  end if;

  if v_effective_status = 'TRIAL' and v_trial_end is not null then
    v_remaining_trial_days := greatest(0, ceil(extract(epoch from (v_trial_end - v_now)) / 86400.0)::integer);
  end if;

  return jsonb_build_object(
    'user_id', coalesce(v_sub.user_id, v_target_uuid),
    'client_id', v_sub.client_id,
    'subscription_id', v_sub.id,
    'plan_code', case when v_effective_status = 'TRIAL' then 'PREMIUM' else v_plan_code end,
    'plan_slug', case
      when v_effective_status = 'TRIAL' then 'premium_trial'
      when v_effective_status = 'ACTIVE' then 'premium'
      else 'free'
    end,
    'active_plan', case
      when v_effective_status = 'TRIAL' then 'premium_trial'
      when v_effective_status = 'ACTIVE' then 'premium'
      else 'free'
    end,
    'effective_status', v_effective_status,
    'status', case
      when v_effective_status = 'TRIAL' then 'trialing'
      when v_effective_status = 'ACTIVE' then 'active'
      when v_effective_status = 'PENDING' then 'pending'
      when v_effective_status = 'BLOCKED' then 'blocked'
      when v_effective_status = 'EXPIRED' then 'expired'
      else 'active'
    end,
    'subscription_status', case
      when v_effective_status = 'TRIAL' then 'trialing'
      when v_effective_status = 'ACTIVE' then 'active'
      else 'free'
    end,
    'payment_status', case when v_pending then 'pending' else coalesce(v_sub.payment_status, 'none') end,
    'pending_plan', case when v_pending then v_sub.pending_plan else null end,
    'is_premium', v_effective_status in ('TRIAL', 'ACTIVE'),
    'has_full_access', v_effective_status in ('TRIAL', 'ACTIVE'),
    'show_ads', v_effective_status not in ('TRIAL', 'ACTIVE', 'BLOCKED'),
    'is_trial', v_effective_status = 'TRIAL',
    'is_trial_active', v_effective_status = 'TRIAL',
    'is_pending', v_pending,
    'is_blocked', v_effective_status = 'BLOCKED',
    'remaining_trial_days', v_remaining_trial_days,
    'trial_start_at', v_trial_start,
    'trial_started_at', v_trial_start,
    'trial_end_at', v_trial_end,
    'trial_expires_at', v_trial_end,
    'trial_consumed_at', coalesce(v_sub.trial_consumed_at, v_trial_start),
    'premium_until', case when v_effective_status = 'ACTIVE' then v_premium_until else null end,
    'expires_at', case
      when v_effective_status = 'TRIAL' then v_trial_end
      when v_effective_status = 'ACTIVE' then v_premium_until
      else null
    end,
    'current_period_end', case
      when v_effective_status = 'TRIAL' then v_trial_end
      when v_effective_status = 'ACTIVE' then v_premium_until
      else null
    end,
    'blocked_at', coalesce(v_sub.blocked_at, v_sub.client_blocked_at),
    'blocked_reason', coalesce(v_sub.blocked_reason, v_sub.client_blocked_reason),
    'archived_at', coalesce(v_sub.archived_at, v_sub.client_archived_at),
    'anonymized_at', coalesce(v_sub.anonymized_at, v_sub.client_anonymized_at),
    'manual_override', coalesce(v_sub.manual_override, false),
    'manual_override_reason', v_sub.manual_override_reason,
    'manual_override_at', v_sub.manual_override_at,
    'source', 'subscriptions',
    'updated_at', greatest(coalesce(v_sub.updated_at, v_sub.created_at), coalesce(v_sub.manual_override_at, v_sub.created_at), coalesce(v_sub.blocked_at, v_sub.created_at))
  );
end;
$$;

create or replace function public.get_effective_license(p_user_id text default null)
returns jsonb
language sql
security invoker
set search_path = public, private
as $$
  select private.get_effective_license_impl(p_user_id);
$$;

create or replace function public.get_saas_license()
returns jsonb
language sql
security invoker
set search_path = public, private
as $$
  select private.get_effective_license_impl(null);
$$;

create or replace function private.superadmin_update_subscription_impl(
  target_user_id text,
  action text,
  plan_code text default null,
  premium_until timestamptz default null,
  reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_target_uuid uuid := private.s3d_uuid_or_null(target_user_id);
  v_client_id uuid;
  v_subscription_id uuid;
  v_action text := upper(trim(coalesce(action, '')));
  v_plan_code text := case
    when upper(trim(coalesce(plan_code, 'PREMIUM'))) in ('PREMIUM', 'PAID', 'PAGO', 'PRO') then 'PREMIUM'
    else 'FREE'
  end;
  v_premium_until timestamptz := premium_until;
  v_reason text := nullif(trim(coalesce(reason, '')), '');
  v_anonymous_email text;
begin
  if v_actor is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;

  if not public.erp_is_superadmin() then
    raise exception 'Erro de permissao: apenas superadmin pode executar esta acao.' using errcode = '42501';
  end if;

  select coalesce(
    (select p.client_id from public.profiles p where p.user_id = v_target_uuid and p.client_id is not null limit 1),
    (select ep.client_id from public.erp_profiles ep where ep.id = v_target_uuid and ep.client_id is not null limit 1),
    (select s.client_id from public.subscriptions s where s.user_id = v_target_uuid order by s.updated_at desc nulls last, s.created_at desc limit 1),
    (select c.id from public.clients c where c.id = v_target_uuid limit 1)
  ) into v_client_id;

  if v_client_id is null then
    raise exception 'Cliente alvo nao encontrado.' using errcode = 'P0002';
  end if;

  select s.id
  into v_subscription_id
  from public.subscriptions s
  where s.client_id = v_client_id
  order by s.updated_at desc nulls last, s.created_at desc
  limit 1
  for update;

  if v_subscription_id is null then
    insert into public.subscriptions (
      client_id, user_id, plan_id, active_plan, plan_code, plan_status,
      status, status_assinatura, subscription_status
    )
    values (
      v_client_id,
      v_target_uuid,
      (select id from public.plans where slug = 'free' limit 1),
      'free',
      'FREE',
      'FREE',
      'active',
      'active',
      'free'
    )
    returning id into v_subscription_id;
  end if;

  if v_action = 'ACTIVATE_PREMIUM_MANUAL' then
    update public.subscriptions
    set plan_id = (select id from public.plans where slug = 'premium' limit 1),
        plan_code = 'PREMIUM',
        plan_status = 'ACTIVE',
        subscription_active = true,
        active_plan = 'premium',
        status = 'active',
        status_assinatura = 'active',
        subscription_status = 'active',
        payment_status = 'none',
        pending_plan = null,
        pending_started_at = null,
        manual_override = true,
        manual_override_reason = v_reason,
        manual_override_by = v_actor,
        manual_override_at = now(),
        premium_until = v_premium_until,
        plan_expires_at = v_premium_until,
        current_period_start = coalesce(current_period_start, now()),
        current_period_end = v_premium_until,
        expires_at = v_premium_until,
        next_billing_at = v_premium_until,
        proximo_vencimento = v_premium_until,
        is_trial_active = false,
        blocked_at = null,
        blocked_reason = null,
        updated_at = now()
    where id = v_subscription_id;

    update public.clients
    set status = 'active',
        active_plan = 'premium',
        plano_atual = 'premium',
        subscription_status = 'active',
        status_assinatura = 'active',
        blocked_at = null,
        blocked_reason = null,
        updated_at = now()
    where id = v_client_id;

  elsif v_action = 'SET_FREE' then
    update public.subscriptions
    set plan_id = (select id from public.plans where slug = 'free' limit 1),
        plan_code = 'FREE',
        plan_status = 'FREE',
        subscription_active = false,
        active_plan = 'free',
        status = 'active',
        status_assinatura = 'active',
        subscription_status = 'free',
        payment_status = 'none',
        pending_plan = null,
        pending_started_at = null,
        manual_override = false,
        manual_override_reason = null,
        manual_override_by = null,
        manual_override_at = null,
        premium_until = null,
        plan_expires_at = null,
        current_period_start = null,
        current_period_end = null,
        expires_at = null,
        next_billing_at = null,
        proximo_vencimento = null,
        is_trial_active = false,
        updated_at = now()
    where id = v_subscription_id;

    update public.clients
    set status = case when status = 'blocked' then 'blocked' else 'active' end,
        active_plan = 'free',
        plano_atual = 'free',
        subscription_status = 'free',
        status_assinatura = 'active',
        updated_at = now()
    where id = v_client_id;

  elsif v_action = 'BLOCK' then
    update public.subscriptions
    set plan_status = 'BLOCKED',
        subscription_active = false,
        blocked_at = now(),
        blocked_reason = v_reason,
        updated_at = now()
    where id = v_subscription_id;

    update public.clients
    set status = 'blocked',
        blocked_at = now(),
        blocked_reason = v_reason,
        updated_at = now()
    where id = v_client_id;

    update public.profiles
    set status = 'blocked',
        updated_at = now()
    where client_id = v_client_id;

    update public.erp_profiles
    set status = 'blocked',
        updated_at = now()
    where client_id = v_client_id;

  elsif v_action = 'UNBLOCK' then
    update public.subscriptions
    set plan_status = case
          when active_plan = 'premium' and (plan_expires_at is null or plan_expires_at > now()) then 'ACTIVE'
          when active_plan = 'premium_trial' and coalesce(trial_expires_at, plan_expires_at, current_period_end, expires_at) > now() then 'TRIAL'
          else 'FREE'
        end,
        subscription_active = case when active_plan = 'premium' and (plan_expires_at is null or plan_expires_at > now()) then true else false end,
        blocked_at = null,
        blocked_reason = null,
        updated_at = now()
    where id = v_subscription_id;

    update public.clients
    set status = 'active',
        blocked_at = null,
        blocked_reason = null,
        updated_at = now()
    where id = v_client_id;

    update public.profiles
    set status = 'active',
        updated_at = now()
    where client_id = v_client_id and status = 'blocked';

    update public.erp_profiles
    set status = 'active',
        updated_at = now()
    where client_id = v_client_id and status = 'blocked';

  elsif v_action = 'ARCHIVE' then
    update public.subscriptions
    set archived_at = now(),
        updated_at = now()
    where id = v_subscription_id;

    update public.clients
    set archived_at = now(),
        updated_at = now()
    where id = v_client_id;

  elsif v_action = 'ANONYMIZE' then
    v_anonymous_email := 'anon-' || replace(v_client_id::text, '-', '') || '@anon.local';

    update public.clients
    set name = 'Cliente anonimizado',
        responsible_name = null,
        nome_responsavel = null,
        email = v_anonymous_email,
        phone = null,
        status = 'anonymized',
        anonymized_at = now(),
        updated_at = now()
    where id = v_client_id;

    update public.subscriptions
    set anonymized_at = now(),
        updated_at = now()
    where id = v_subscription_id;

    update public.profiles
    set name = 'Usuario anonimizado',
        email = v_anonymous_email,
        phone = null,
        status = 'inactive',
        updated_at = now()
    where client_id = v_client_id;

    update public.erp_profiles
    set display_name = 'Usuario anonimizado',
        email = v_anonymous_email,
        phone = null,
        status = 'inactive',
        updated_at = now()
    where client_id = v_client_id;
  else
    raise exception 'Acao invalida: %', v_action using errcode = '22023';
  end if;

  insert into public.audit_logs (user_id, client_id, action, details)
  values (
    v_actor,
    v_client_id,
    'superadmin_update_subscription',
    jsonb_build_object('action', v_action, 'plan_code', v_plan_code, 'premium_until', v_premium_until, 'reason', v_reason)
  );

  return private.get_effective_license_impl(v_client_id::text);
end;
$$;

create or replace function public.superadmin_update_subscription(
  target_user_id text,
  action text,
  plan_code text default null,
  premium_until timestamptz default null,
  reason text default null
)
returns jsonb
language sql
security invoker
set search_path = public, private
as $$
  select private.superadmin_update_subscription_impl(target_user_id, action, plan_code, premium_until, reason);
$$;

revoke execute on function private.get_effective_license_impl(text) from public, anon;
revoke execute on function private.superadmin_update_subscription_impl(text, text, text, timestamptz, text) from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.get_effective_license_impl(text) to authenticated, service_role;
grant execute on function private.superadmin_update_subscription_impl(text, text, text, timestamptz, text) to authenticated, service_role;

revoke execute on function public.get_effective_license(text) from public, anon;
revoke execute on function public.get_saas_license() from public, anon;
revoke execute on function public.superadmin_update_subscription(text, text, text, timestamptz, text) from public, anon;
grant execute on function public.get_effective_license(text) to authenticated, service_role;
grant execute on function public.get_saas_license() to authenticated, service_role;
grant execute on function public.superadmin_update_subscription(text, text, text, timestamptz, text) to authenticated, service_role;
