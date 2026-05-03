-- Simplifica 3D: simplified plans, trial and billing variants.

alter table public.subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists promo_used boolean not null default false,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_variant text;

alter table public.payments
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists plan_id uuid references public.plans(id) on delete set null,
  add column if not exists billing_variant text;

alter table public.erp_payments
  add column if not exists billing_variant text;

insert into public.plans (
  slug, name, price, max_users, max_orders, max_clients, max_calculator_uses,
  max_storage_mb, allow_pdf, allow_reports, allow_permissions, active, sort_order, kind
)
values
  ('free', 'Free', 0, 1, 10, 10, 30, 25, false, false, false, true, 10, 'free'),
  ('premium_trial', 'Premium Trial', 0, 5, null, null, null, null, true, true, true, true, 20, 'trial'),
  ('premium', 'Premium', 29.90, 5, null, null, null, null, true, true, true, true, 30, 'paid')
on conflict (slug) do update
set name = excluded.name,
    price = excluded.price,
    max_users = excluded.max_users,
    max_orders = excluded.max_orders,
    max_clients = excluded.max_clients,
    max_calculator_uses = excluded.max_calculator_uses,
    max_storage_mb = excluded.max_storage_mb,
    allow_pdf = excluded.allow_pdf,
    allow_reports = excluded.allow_reports,
    allow_permissions = excluded.allow_permissions,
    active = true,
    sort_order = excluded.sort_order,
    kind = excluded.kind,
    updated_at = now();

update public.plans
set active = false,
    updated_at = now()
where slug not in ('free', 'premium_trial', 'premium');

alter table public.subscriptions drop constraint if exists subscriptions_status_check;

with plan_ids as (
  select
    (select id from public.plans where slug = 'free' limit 1) as free_id,
    (select id from public.plans where slug = 'premium_trial' limit 1) as trial_id,
    (select id from public.plans where slug = 'premium' limit 1) as premium_id
),
mapped as (
  select
    s.id,
    s.client_id,
    coalesce(
      s.user_id,
      (select p.user_id from public.profiles p where p.client_id = s.client_id order by p.created_at asc limit 1),
      (select ep.id from public.erp_profiles ep where ep.client_id = s.client_id order by ep.created_at asc limit 1)
    ) as new_user_id,
    lower(coalesce(p.slug, 'free')) as old_slug,
    lower(coalesce(s.status_assinatura, s.status, 'pending')) as old_status,
    coalesce(s.current_period_start, s.started_at, s.created_at, now()) as start_at,
    coalesce(s.current_period_end, s.expires_at, s.next_billing_at, s.proximo_vencimento) as end_at,
    s.promo_used,
    pi.free_id,
    pi.trial_id,
    pi.premium_id
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  cross join plan_ids pi
)
update public.subscriptions s
set user_id = mapped.new_user_id,
    plan_id = case
      when mapped.old_slug = 'premium_trial' and coalesce(mapped.end_at, now() - interval '1 second') >= now() then mapped.trial_id
      when mapped.old_slug in ('premium', 'pro') then mapped.premium_id
      else mapped.free_id
    end,
    status = case
      when mapped.old_slug = 'premium_trial' and coalesce(mapped.end_at, now() - interval '1 second') >= now() then 'trialing'
      when mapped.old_slug in ('premium', 'pro') and mapped.old_status in ('active', 'ativo', 'ativa', 'paid', 'pago', 'trialing') then 'active'
      when mapped.old_status in ('cancelled', 'canceled', 'cancelado') then 'cancelled'
      when mapped.old_status in ('expired', 'vencido', 'expirado') then 'expired'
      when mapped.old_status in ('overdue', 'blocked', 'bloqueado', 'atrasado', 'past_due') then 'past_due'
      when mapped.old_status in ('pending', 'pendente') then 'pending'
      else 'active'
    end,
    status_assinatura = case
      when mapped.old_slug = 'premium_trial' and coalesce(mapped.end_at, now() - interval '1 second') >= now() then 'trialing'
      when mapped.old_slug in ('premium', 'pro') and mapped.old_status in ('active', 'ativo', 'ativa', 'paid', 'pago', 'trialing') then 'active'
      when mapped.old_status in ('cancelled', 'canceled', 'cancelado') then 'cancelled'
      when mapped.old_status in ('expired', 'vencido', 'expirado') then 'expired'
      when mapped.old_status in ('overdue', 'blocked', 'bloqueado', 'atrasado', 'past_due') then 'past_due'
      when mapped.old_status in ('pending', 'pendente') then 'pending'
      else 'active'
    end,
    promo_used = case
      when mapped.old_slug in ('premium', 'pro') then true
      else coalesce(mapped.promo_used, false)
    end,
    billing_variant = case
      when mapped.old_slug in ('premium', 'pro') or coalesce(mapped.promo_used, false) then 'premium_monthly'
      else 'premium_first_month'
    end,
    current_period_start = case
      when mapped.old_slug in ('premium_trial', 'premium', 'pro') then mapped.start_at
      else null
    end,
    current_period_end = case
      when mapped.old_slug = 'premium_trial' and coalesce(mapped.end_at, now() - interval '1 second') >= now() then mapped.end_at
      when mapped.old_slug in ('premium', 'pro') then coalesce(mapped.end_at, now() + interval '30 days')
      else null
    end,
    expires_at = case
      when mapped.old_slug = 'premium_trial' and coalesce(mapped.end_at, now() - interval '1 second') >= now() then mapped.end_at
      when mapped.old_slug in ('premium', 'pro') then coalesce(mapped.end_at, now() + interval '30 days')
      else null
    end,
    next_billing_at = case
      when mapped.old_slug in ('premium_trial', 'premium', 'pro') then coalesce(mapped.end_at, now() + interval '30 days')
      else null
    end,
    proximo_vencimento = case
      when mapped.old_slug in ('premium_trial', 'premium', 'pro') then coalesce(mapped.end_at, now() + interval '30 days')
      else null
    end,
    updated_at = now()
from mapped
where s.id = mapped.id;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('active', 'trialing', 'pending', 'past_due', 'cancelled', 'expired'));

alter table public.subscriptions drop constraint if exists subscriptions_billing_variant_check;
alter table public.subscriptions
  add constraint subscriptions_billing_variant_check
  check (billing_variant is null or billing_variant in ('premium_first_month', 'premium_monthly'));

alter table public.payments drop constraint if exists payments_billing_variant_check;
alter table public.payments
  add constraint payments_billing_variant_check
  check (billing_variant is null or billing_variant in ('premium_first_month', 'premium_monthly'));

update public.clients c
set plano_atual = coalesce(p.slug, 'free'),
    status_assinatura = s.status,
    status = case when s.status in ('past_due', 'cancelled', 'expired') then 'overdue' else 'active' end,
    updated_at = now()
from public.subscriptions s
left join public.plans p on p.id = s.plan_id
where s.client_id = c.id;

update public.payments pay
set user_id = coalesce(
      pay.user_id,
      (select s.user_id from public.subscriptions s where s.id = pay.subscription_id limit 1),
      (select p.user_id from public.profiles p where p.client_id = pay.client_id order by p.created_at asc limit 1)
    ),
    plan_id = coalesce(
      pay.plan_id,
      (select id from public.plans where slug = case when lower(coalesce(pay.plan_slug, 'premium')) in ('premium', 'pro') then 'premium' else 'free' end limit 1)
    ),
    plan_slug = case when lower(coalesce(pay.plan_slug, 'premium')) in ('premium', 'pro') then 'premium' else 'free' end,
    billing_variant = coalesce(pay.billing_variant, pay.metadata->>'billing_variant', 'premium_monthly'),
    updated_at = now();

do $$
begin
  if to_regclass('public.promotional_tokens') is not null then
    update public.promotional_tokens
    set usado = true,
        expira_em = coalesce(expira_em, now()),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('disabled_by', '20260503165716_simplify_plans_billing')
    where usado = false;
  end if;

  if to_regclass('public.saas_campaign_settings') is not null then
    update public.saas_campaign_settings
    set campanha_tokens_ativa = false,
        campanha_fim = now(),
        updated_at = now();
  end if;
end $$;

create or replace function public.redeem_promotional_token(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Tokens promocionais foram desativados. Use o checkout Premium.';
end;
$$;

revoke execute on function public.redeem_promotional_token(text) from public, anon, authenticated;

create or replace function public.register_saas_client(
  p_name text,
  p_responsible_name text,
  p_email text,
  p_phone text default null,
  p_plan_slug text default 'premium_trial',
  p_trial_days integer default 7
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_client_id uuid;
  v_client_code text;
  v_plan public.plans%rowtype;
  v_subscription_id uuid;
  v_trial_days integer := 7;
  v_slug text := lower(replace(coalesce(nullif(p_plan_slug, ''), 'premium_trial'), '-', '_'));
  v_start timestamptz := now();
  v_end timestamptz;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if v_email = '' then
    raise exception 'E-mail obrigatorio';
  end if;

  if v_slug not in ('free', 'premium_trial', 'premium') then
    v_slug := 'premium_trial';
  end if;

  select * into v_plan
  from public.plans
  where slug = v_slug
    and active = true
  limit 1;

  if v_plan.id is null then
    select * into v_plan from public.plans where slug = 'premium_trial' limit 1;
  end if;

  v_trial_days := case when v_plan.slug = 'premium_trial' then 7 else 0 end;
  v_end := case
    when v_plan.slug = 'premium_trial' then v_start + interval '7 days'
    when v_plan.slug = 'premium' then v_start + interval '30 days'
    else null
  end;
  v_status := case when v_plan.slug = 'premium_trial' then 'trialing' else 'active' end;

  if exists (
    select 1 from public.clients
    where lower(email) = v_email
      and id <> coalesce(public.erp_current_client_id(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'E-mail ja cadastrado';
  end if;

  insert into public.clients (client_code, name, responsible_name, nome_responsavel, email, phone, status, plano_atual, status_assinatura, criado_em, last_access_at)
  values (
    public.next_s3d_client_code(),
    trim(p_name),
    trim(coalesce(p_responsible_name, p_name)),
    trim(coalesce(p_responsible_name, p_name)),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    'active',
    v_plan.slug,
    v_status,
    now(),
    now()
  )
  on conflict ((lower(email))) do update
    set name = excluded.name,
        responsible_name = excluded.responsible_name,
        nome_responsavel = excluded.nome_responsavel,
        phone = excluded.phone,
        status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
        plano_atual = coalesce(public.clients.plano_atual, excluded.plano_atual),
        status_assinatura = coalesce(public.clients.status_assinatura, excluded.status_assinatura),
        last_access_at = now()
  returning id, client_code into v_client_id, v_client_code;

  insert into public.profiles (user_id, client_id, name, email, role, status, accepted_terms_at)
  values (v_user_id, v_client_id, trim(coalesce(p_responsible_name, p_name)), v_email, 'admin', 'active', now())
  on conflict (user_id) do update
    set client_id = excluded.client_id,
        name = excluded.name,
        email = excluded.email,
        role = case when public.profiles.role = 'superadmin' then 'superadmin' else 'admin' end,
        status = 'active',
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = now();

  insert into public.erp_profiles (id, email, display_name, role, status, client_id, accepted_terms_at, last_login_at)
  values (v_user_id, v_email, trim(coalesce(p_responsible_name, p_name)), 'admin', 'active', v_client_id, now(), now())
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else 'admin' end,
        status = 'active',
        client_id = excluded.client_id,
        accepted_terms_at = coalesce(public.erp_profiles.accepted_terms_at, excluded.accepted_terms_at),
        last_login_at = now();

  insert into public.subscriptions (
    client_id, user_id, plan_id, status, status_assinatura, promo_used, billing_variant,
    started_at, expires_at, next_billing_at, proximo_vencimento, current_period_start, current_period_end
  )
  values (
    v_client_id, v_user_id, v_plan.id, v_status, v_status, false, 'premium_first_month',
    v_start, v_end, v_end, v_end, v_start, v_end
  )
  on conflict (client_id) do update
    set user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
        plan_id = coalesce(public.subscriptions.plan_id, excluded.plan_id),
        status = coalesce(public.subscriptions.status, excluded.status),
        status_assinatura = coalesce(public.subscriptions.status_assinatura, excluded.status_assinatura),
        promo_used = coalesce(public.subscriptions.promo_used, false),
        billing_variant = case when coalesce(public.subscriptions.promo_used, false) then 'premium_monthly' else 'premium_first_month' end,
        current_period_start = coalesce(public.subscriptions.current_period_start, excluded.current_period_start),
        current_period_end = coalesce(public.subscriptions.current_period_end, excluded.current_period_end),
        expires_at = coalesce(public.subscriptions.expires_at, excluded.expires_at),
        next_billing_at = coalesce(public.subscriptions.next_billing_at, excluded.next_billing_at),
        proximo_vencimento = coalesce(public.subscriptions.proximo_vencimento, excluded.proximo_vencimento),
        updated_at = now()
  returning id into v_subscription_id;

  insert into public.audit_logs (user_id, client_id, action, details)
  values (v_user_id, v_client_id, 'cadastro', jsonb_build_object('source', 'register_saas_client', 'plan', v_plan.slug, 'client_code', v_client_code));

  return jsonb_build_object(
    'client_id', v_client_id,
    'clienteId', v_client_code,
    'client_code', v_client_code,
    'subscription_id', v_subscription_id,
    'plan', v_plan.slug,
    'status', v_status,
    'promo_used', false,
    'billing_variant', 'premium_first_month',
    'current_period_start', v_start,
    'current_period_end', v_end
  );
end;
$$;

create or replace function public.get_saas_license()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid := public.erp_current_client_id();
  v_sub record;
  v_block_level text := 'none';
  v_status text := 'pending';
  v_end timestamptz;
begin
  if public.erp_is_superadmin() then
    return jsonb_build_object('status', 'active', 'block_level', 'none', 'plan', 'Super Admin', 'plan_slug', 'premium', 'max_users', null, 'max_orders', null, 'promo_used', true, 'billing_variant', 'premium_monthly');
  end if;

  if v_client_id is null then
    return jsonb_build_object('status', 'expired', 'block_level', 'total', 'message', 'Cliente nao vinculado');
  end if;

  select s.*, c.client_code, c.email as client_email, p.name as plan_name, p.slug as plan_slug,
         p.max_users, p.max_orders, p.max_clients, p.max_calculator_uses,
         p.allow_pdf, p.allow_reports, p.allow_permissions, p.kind
  into v_sub
  from public.subscriptions s
  left join public.clients c on c.id = s.client_id
  left join public.plans p on p.id = s.plan_id
  where s.client_id = v_client_id
  order by s.created_at desc
  limit 1;

  if v_sub.id is null then
    return jsonb_build_object('status', 'pending', 'block_level', 'total', 'message', 'Assinatura nao encontrada');
  end if;

  v_status := lower(coalesce(v_sub.status, 'pending'));
  v_end := coalesce(v_sub.current_period_end, v_sub.expires_at, v_sub.next_billing_at, v_sub.proximo_vencimento);

  if coalesce(v_sub.plan_slug, 'free') = 'premium_trial' and v_status = 'trialing' and v_end is not null and v_end < now() then
    update public.subscriptions
    set plan_id = (select id from public.plans where slug = 'free' limit 1),
        status = 'active',
        status_assinatura = 'active',
        current_period_start = null,
        current_period_end = null,
        expires_at = null,
        next_billing_at = null,
        proximo_vencimento = null,
        updated_at = now()
    where id = v_sub.id;

    update public.clients
    set plano_atual = 'free',
        status_assinatura = 'active',
        status = 'active',
        updated_at = now()
    where id = v_client_id;

    v_sub.plan_slug := 'free';
    v_sub.plan_name := 'Free';
    v_sub.kind := 'free';
    v_status := 'active';
    v_end := null;
  elsif coalesce(v_sub.plan_slug, 'free') = 'premium' and v_status = 'active' and v_end is not null and v_end < now() then
    update public.subscriptions
    set status = 'past_due',
        status_assinatura = 'past_due',
        overdue_since = coalesce(overdue_since, now()),
        updated_at = now()
    where id = v_sub.id;

    update public.clients
    set status_assinatura = 'past_due',
        status = 'overdue',
        updated_at = now()
    where id = v_client_id;

    v_status := 'past_due';
  end if;

  if coalesce(v_sub.plan_slug, 'free') = 'premium_trial' then
    v_block_level := case when v_status = 'trialing' and v_end is not null and v_end >= now() then 'none' else 'total' end;
  elsif coalesce(v_sub.plan_slug, 'free') = 'premium' then
    v_block_level := case when v_status = 'active' and v_end is not null and v_end >= now() then 'none' else 'total' end;
  elsif v_status in ('pending', 'past_due', 'cancelled', 'expired') then
    v_block_level := 'total';
  else
    v_block_level := 'none';
  end if;

  return jsonb_build_object(
    'client_id', v_client_id,
    'user_id', v_sub.user_id,
    'clienteId', v_sub.client_code,
    'client_code', v_sub.client_code,
    'subscription_id', v_sub.id,
    'mercado_pago_subscription_id', v_sub.mercado_pago_subscription_id,
    'status', v_status,
    'block_level', v_block_level,
    'plan', coalesce(v_sub.plan_name, 'Free'),
    'plan_slug', coalesce(v_sub.plan_slug, 'free'),
    'promo_used', coalesce(v_sub.promo_used, false),
    'billing_variant', coalesce(v_sub.billing_variant, 'premium_first_month'),
    'max_users', v_sub.max_users,
    'max_orders', v_sub.max_orders,
    'max_clients', v_sub.max_clients,
    'max_calculator_uses', v_sub.max_calculator_uses,
    'allow_pdf', v_sub.allow_pdf,
    'allow_reports', v_sub.allow_reports,
    'allow_permissions', v_sub.allow_permissions,
    'started_at', coalesce(v_sub.current_period_start, v_sub.started_at),
    'expires_at', v_end,
    'current_period_start', v_sub.current_period_start,
    'current_period_end', v_end,
    'next_billing_at', coalesce(v_sub.next_billing_at, v_sub.proximo_vencimento)
  );
end;
$$;

create or replace function public.handle_new_saas_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(coalesce(new.email, '')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'Usuario'));
  v_business text := trim(coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), v_name, 'Minha empresa 3D'));
  v_phone text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_plan public.plans%rowtype;
  v_client_id uuid;
  v_client_code text;
  v_subscription_id uuid;
  v_start timestamptz := now();
  v_end timestamptz := now() + interval '7 days';
begin
  if v_email = '' then
    return new;
  end if;

  select * into v_plan
  from public.plans
  where slug = 'premium_trial'
    and active = true
  limit 1;

  if v_plan.id is null then
    select * into v_plan from public.plans where slug = 'free' limit 1;
    v_end := null;
  end if;

  insert into public.clients (
    client_code, name, responsible_name, nome_responsavel, email, phone,
    status, plano_atual, status_assinatura, criado_em, last_access_at
  )
  values (
    public.next_s3d_client_code(), v_business, v_name, v_name, v_email, v_phone,
    'active', coalesce(v_plan.slug, 'free'),
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    now(), now()
  )
  on conflict ((lower(email))) do update
    set name = coalesce(nullif(excluded.name, ''), public.clients.name),
        responsible_name = coalesce(nullif(excluded.responsible_name, ''), public.clients.responsible_name),
        nome_responsavel = coalesce(nullif(excluded.nome_responsavel, ''), public.clients.nome_responsavel),
        phone = coalesce(excluded.phone, public.clients.phone),
        status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
        updated_at = now()
  returning id, client_code into v_client_id, v_client_code;

  insert into public.profiles (user_id, client_id, name, email, role, status, accepted_terms_at)
  values (
    new.id, v_client_id, v_name, v_email, 'admin', 'active',
    case when lower(coalesce(new.raw_user_meta_data->>'accepted_terms', 'false')) = 'true' then now() else null end
  )
  on conflict (user_id) do update
    set client_id = excluded.client_id,
        name = coalesce(nullif(excluded.name, ''), public.profiles.name),
        email = excluded.email,
        role = case when public.profiles.role = 'superadmin' then 'superadmin' else public.profiles.role end,
        status = 'active',
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = now();

  insert into public.erp_profiles (id, email, display_name, role, status, client_id, accepted_terms_at, last_login_at)
  values (
    new.id, v_email, v_name, 'admin', 'active', v_client_id,
    case when lower(coalesce(new.raw_user_meta_data->>'accepted_terms', 'false')) = 'true' then now() else null end,
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(excluded.display_name, ''), public.erp_profiles.display_name),
        role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else public.erp_profiles.role end,
        status = 'active',
        client_id = excluded.client_id,
        accepted_terms_at = coalesce(public.erp_profiles.accepted_terms_at, excluded.accepted_terms_at),
        last_login_at = now();

  if v_client_id is not null and v_plan.id is not null then
    insert into public.subscriptions (
      client_id, user_id, plan_id, status, status_assinatura, promo_used, billing_variant,
      started_at, expires_at, next_billing_at, proximo_vencimento, current_period_start, current_period_end
    )
    values (
      v_client_id, new.id, v_plan.id,
      case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
      case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
      false, 'premium_first_month',
      v_start, v_end, v_end, v_end, v_start, v_end
    )
    on conflict (client_id) do update
      set user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
          plan_id = coalesce(public.subscriptions.plan_id, excluded.plan_id),
          status = coalesce(public.subscriptions.status, excluded.status),
          status_assinatura = coalesce(public.subscriptions.status_assinatura, excluded.status_assinatura),
          promo_used = coalesce(public.subscriptions.promo_used, false),
          billing_variant = case when coalesce(public.subscriptions.promo_used, false) then 'premium_monthly' else 'premium_first_month' end,
          current_period_start = coalesce(public.subscriptions.current_period_start, excluded.current_period_start),
          current_period_end = coalesce(public.subscriptions.current_period_end, excluded.current_period_end),
          expires_at = coalesce(public.subscriptions.expires_at, excluded.expires_at),
          next_billing_at = coalesce(public.subscriptions.next_billing_at, excluded.next_billing_at),
          proximo_vencimento = coalesce(public.subscriptions.proximo_vencimento, excluded.proximo_vencimento),
          updated_at = now()
    returning id into v_subscription_id;
  end if;

  insert into public.audit_logs (user_id, client_id, action, details)
  values (
    new.id,
    v_client_id,
    'cadastro auth',
    jsonb_build_object('source', 'handle_new_saas_auth_user', 'client_code', v_client_code, 'subscription_id', v_subscription_id)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_saas_profile on auth.users;
create trigger on_auth_user_created_saas_profile
after insert on auth.users
for each row execute function public.handle_new_saas_auth_user();

revoke execute on function public.register_saas_client(text, text, text, text, text, integer) from public, anon;
grant execute on function public.register_saas_client(text, text, text, text, text, integer) to authenticated;
revoke execute on function public.get_saas_license() from public, anon;
grant execute on function public.get_saas_license() to authenticated;
revoke execute on function public.handle_new_saas_auth_user() from public, anon, authenticated;
