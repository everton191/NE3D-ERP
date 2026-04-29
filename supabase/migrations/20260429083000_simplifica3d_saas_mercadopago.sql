-- Simplifica 3D SaaS + Mercado Pago recurring billing layer.
-- Additive migration: keeps existing ERP data and previous SaaS tables.

create extension if not exists pgcrypto;

create sequence if not exists public.s3d_client_code_seq start 1;

create or replace function public.next_s3d_client_code()
returns text
language sql
security definer
set search_path = public
as $$
  select 'S3D-' || lpad(nextval('public.s3d_client_code_seq')::text, 6, '0');
$$;

alter table public.clients
  add column if not exists client_code text,
  add column if not exists plano_atual text not null default 'free',
  add column if not exists status_assinatura text not null default 'active',
  add column if not exists criado_em timestamptz,
  add column if not exists nome_responsavel text,
  add column if not exists deleted_at timestamptz;

update public.clients
set client_code = public.next_s3d_client_code()
where client_code is null or client_code = '';

update public.clients
set criado_em = coalesce(criado_em, created_at),
    nome_responsavel = coalesce(nome_responsavel, responsible_name),
    plano_atual = case
      when plano_atual in ('basic', 'básico') then 'free'
      when plano_atual is null or plano_atual = '' then 'free'
      else lower(plano_atual)
    end,
    status_assinatura = case
      when status_assinatura is null or status_assinatura = '' then status
      else status_assinatura
    end;

create unique index if not exists clients_client_code_unique_idx on public.clients(client_code);

alter table public.plans
  add column if not exists max_clients integer,
  add column if not exists max_calculator_uses integer,
  add column if not exists allow_pdf boolean not null default false,
  add column if not exists allow_reports boolean not null default false,
  add column if not exists allow_permissions boolean not null default false,
  add column if not exists sort_order integer not null default 100,
  add column if not exists kind text not null default 'paid';

alter table public.subscriptions
  add column if not exists mercado_pago_subscription_id text,
  add column if not exists status_assinatura text,
  add column if not exists ultimo_pagamento timestamptz,
  add column if not exists proximo_vencimento timestamptz,
  add column if not exists overdue_since timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists subscriptions_mp_subscription_unique_idx
  on public.subscriptions(mercado_pago_subscription_id)
  where mercado_pago_subscription_id is not null;

alter table public.payments
  add column if not exists mercado_pago_subscription_id text,
  add column if not exists preference_id text,
  add column if not exists plan_slug text,
  add column if not exists metodo_pagamento text,
  add column if not exists criado_em timestamptz,
  add column if not exists atualizado_em timestamptz;

update public.payments
set criado_em = coalesce(criado_em, created_at),
    atualizado_em = coalesce(atualizado_em, updated_at),
    metodo_pagamento = coalesce(metodo_pagamento, payment_method);

create index if not exists payments_preference_id_idx on public.payments(preference_id);
create index if not exists payments_mp_subscription_idx on public.payments(mercado_pago_subscription_id);
create index if not exists payments_plan_status_idx on public.payments(plan_slug, status);

create table if not exists public.promotional_tokens (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  plano text not null default 'pro_token',
  usado boolean not null default false,
  usado_por uuid references public.clients(id) on delete set null,
  usado_em timestamptz,
  expira_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists promotional_tokens_usado_idx on public.promotional_tokens(usado, expira_em);

create table if not exists public.saas_campaign_settings (
  id boolean primary key default true,
  campanha_tokens_ativa boolean not null default true,
  campanha_inicio timestamptz not null default now(),
  campanha_fim timestamptz,
  updated_at timestamptz not null default now(),
  constraint saas_campaign_settings_singleton check (id = true)
);

insert into public.saas_campaign_settings (id, campanha_tokens_ativa, campanha_inicio, campanha_fim)
values (true, true, now(), now() + interval '30 days')
on conflict (id) do nothing;

create table if not exists public.saas_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  device_id text not null,
  ip text,
  user_agent text,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists saas_sessions_client_active_idx on public.saas_sessions(client_id, active, last_seen_at desc);
create unique index if not exists saas_sessions_device_active_idx
  on public.saas_sessions(client_id, device_id)
  where active;

create table if not exists public.erp_payments (
  id uuid primary key default gen_random_uuid(),
  payment_id text,
  subscription_id text,
  preference_id text,
  external_reference text,
  cliente_id uuid references public.clients(id) on delete set null,
  cliente_codigo text,
  plano text,
  valor numeric(10,2) not null default 0,
  status text not null default 'pending',
  metodo_pagamento text,
  payload jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists erp_payments_payment_id_unique_idx
  on public.erp_payments(payment_id)
  where payment_id is not null;

create index if not exists erp_payments_cliente_idx on public.erp_payments(cliente_id, criado_em desc);
create index if not exists erp_payments_status_idx on public.erp_payments(status);

insert into public.plans (slug, name, price, max_users, max_orders, max_clients, max_calculator_uses, allow_pdf, allow_reports, allow_permissions, active, sort_order, kind)
values
  ('free', 'Free', 0.00, 1, 10, 10, 30, false, false, false, true, 10, 'free'),
  ('pro', 'Pro', 29.90, 2, null, null, null, true, false, false, true, 20, 'paid'),
  ('premium', 'Premium', 54.90, 5, null, null, null, true, true, true, true, 30, 'paid'),
  ('pro_token', 'Pro Token', 0.00, 2, null, null, null, true, false, false, true, 40, 'token'),
  ('premium_trial', 'Premium Trial', 0.00, 5, null, null, null, true, true, true, true, 50, 'trial')
on conflict (slug) do update
set name = excluded.name,
    price = excluded.price,
    max_users = excluded.max_users,
    max_orders = excluded.max_orders,
    max_clients = excluded.max_clients,
    max_calculator_uses = excluded.max_calculator_uses,
    allow_pdf = excluded.allow_pdf,
    allow_reports = excluded.allow_reports,
    allow_permissions = excluded.allow_permissions,
    active = true,
    sort_order = excluded.sort_order,
    kind = excluded.kind;

update public.plans
set active = false
where slug = 'basic';

create or replace function public.plan_slug_from_id(p_plan_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select slug from public.plans where id = p_plan_id), 'free');
$$;

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
  v_trial_days integer := greatest(0, coalesce(p_trial_days, 7));
  v_slug text := lower(coalesce(nullif(p_plan_slug, ''), 'premium_trial'));
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if v_email = '' then
    raise exception 'E-mail obrigatório';
  end if;

  if v_slug = 'basic' then
    v_slug := 'free';
  end if;

  select * into v_plan
  from public.plans
  where slug = v_slug
    and active = true
  limit 1;

  if v_plan.id is null then
    select * into v_plan
    from public.plans
    where slug = 'premium_trial'
    limit 1;
  end if;

  if exists (
    select 1 from public.clients
    where lower(email) = v_email
      and id <> coalesce(public.erp_current_client_id(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'E-mail já cadastrado';
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
    case when v_plan.kind = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end,
    now(),
    now()
  )
  on conflict ((lower(email))) do update
    set name = excluded.name,
        responsible_name = excluded.responsible_name,
        nome_responsavel = excluded.nome_responsavel,
        phone = excluded.phone,
        status = case when public.clients.status = 'cancelled' then 'active' else public.clients.status end,
        plano_atual = excluded.plano_atual,
        status_assinatura = excluded.status_assinatura,
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
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at);

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

  insert into public.subscriptions (client_id, plan_id, status, status_assinatura, started_at, expires_at, next_billing_at, proximo_vencimento)
  values (
    v_client_id,
    v_plan.id,
    case when v_plan.kind = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end,
    case when v_plan.kind = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end,
    now(),
    case when v_plan.kind = 'trial' and v_trial_days > 0 then now() + make_interval(days => v_trial_days) else null end,
    case when v_plan.kind = 'trial' and v_trial_days > 0 then now() + make_interval(days => v_trial_days) else now() end,
    case when v_plan.kind = 'trial' and v_trial_days > 0 then now() + make_interval(days => v_trial_days) else now() end
  )
  on conflict (client_id) do update
    set plan_id = excluded.plan_id,
        status = excluded.status,
        status_assinatura = excluded.status_assinatura,
        expires_at = excluded.expires_at,
        next_billing_at = excluded.next_billing_at,
        proximo_vencimento = excluded.proximo_vencimento
  returning id into v_subscription_id;

  insert into public.audit_logs (user_id, client_id, action, details)
  values (v_user_id, v_client_id, 'cadastro', jsonb_build_object('source', 'register_saas_client', 'plan', v_plan.slug, 'client_code', v_client_code));

  return jsonb_build_object(
    'client_id', v_client_id,
    'clienteId', v_client_code,
    'client_code', v_client_code,
    'subscription_id', v_subscription_id,
    'plan', v_plan.slug,
    'status', case when v_plan.kind = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end
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
  v_days_overdue integer := 0;
  v_block_level text := 'none';
  v_status text := 'blocked';
begin
  if public.erp_is_superadmin() then
    return jsonb_build_object('status', 'active', 'block_level', 'none', 'plan', 'Super Admin', 'plan_slug', 'premium', 'max_users', null, 'max_orders', null);
  end if;

  if v_client_id is null then
    return jsonb_build_object('status', 'blocked', 'block_level', 'total', 'message', 'Cliente não vinculado');
  end if;

  select s.*, c.client_code, c.email as client_email, p.name as plan_name, p.slug as plan_slug, p.max_users, p.max_orders, p.max_clients, p.max_calculator_uses, p.allow_pdf, p.allow_reports, p.allow_permissions, p.kind
  into v_sub
  from public.subscriptions s
  left join public.clients c on c.id = s.client_id
  left join public.plans p on p.id = s.plan_id
  where s.client_id = v_client_id
  order by s.created_at desc
  limit 1;

  if v_sub.id is null then
    return jsonb_build_object('status', 'pending', 'block_level', 'partial', 'message', 'Pagamento pendente');
  end if;

  v_status := case lower(coalesce(v_sub.status_assinatura, v_sub.status, 'pending'))
    when 'ativo' then 'active'
    when 'ativa' then 'active'
    when 'pago' then 'active'
    when 'trial' then 'trialing'
    when 'pendente' then 'pending'
    when 'atrasado' then 'overdue'
    when 'vencido' then 'expired'
    when 'bloqueado' then 'blocked'
    when 'cancelado' then 'cancelled'
    else lower(coalesce(v_sub.status_assinatura, v_sub.status, 'pending'))
  end;

  if coalesce(v_sub.kind, '') in ('trial', 'token') and v_sub.expires_at is not null and v_sub.expires_at < now() then
    update public.subscriptions
    set status = 'cancelled',
        status_assinatura = 'vencido',
        plan_id = (select id from public.plans where slug = 'free' limit 1),
        updated_at = now()
    where id = v_sub.id;

    update public.clients
    set plano_atual = 'free',
        status_assinatura = 'vencido',
        status = 'active'
    where id = v_client_id;

    v_status := 'active';
    v_block_level := 'none';
    v_sub.plan_name := 'Free';
    v_sub.plan_slug := 'free';
    v_sub.kind := 'free';
  elsif v_status in ('active', 'trialing') and (v_sub.expires_at is null or v_sub.expires_at >= now()) then
    v_block_level := 'none';
  elsif v_status in ('pending', 'overdue', 'active', 'trialing') then
    v_days_overdue := greatest(0, floor(extract(epoch from (now() - coalesce(v_sub.expires_at, v_sub.next_billing_at, v_sub.proximo_vencimento, now()))) / 86400)::integer);
    if v_days_overdue <= 3 then
      v_status := 'pending';
      v_block_level := 'warning';
    elsif v_days_overdue <= 7 then
      v_status := 'overdue';
      v_block_level := 'partial';
    else
      v_status := 'active';
      v_block_level := 'none';

      update public.subscriptions
      set status = 'cancelled',
          status_assinatura = 'vencido',
          plan_id = (select id from public.plans where slug = 'free' limit 1),
          updated_at = now()
      where id = v_sub.id;

      update public.clients
      set plano_atual = 'free',
          status_assinatura = 'vencido',
          status = 'active'
      where id = v_client_id;

      v_sub.plan_name := 'Free';
      v_sub.plan_slug := 'free';
      v_sub.kind := 'free';
    end if;
  else
    v_block_level := 'total';
  end if;

  return jsonb_build_object(
    'client_id', v_client_id,
    'clienteId', v_sub.client_code,
    'client_code', v_sub.client_code,
    'subscription_id', v_sub.id,
    'mercado_pago_subscription_id', v_sub.mercado_pago_subscription_id,
    'status', v_status,
    'block_level', v_block_level,
    'days_overdue', v_days_overdue,
    'plan', coalesce(v_sub.plan_name, 'Free'),
    'plan_slug', coalesce(v_sub.plan_slug, 'free'),
    'max_users', v_sub.max_users,
    'max_orders', v_sub.max_orders,
    'max_clients', v_sub.max_clients,
    'max_calculator_uses', v_sub.max_calculator_uses,
    'allow_pdf', v_sub.allow_pdf,
    'allow_reports', v_sub.allow_reports,
    'allow_permissions', v_sub.allow_permissions,
    'started_at', v_sub.started_at,
    'expires_at', v_sub.expires_at,
    'next_billing_at', coalesce(v_sub.proximo_vencimento, v_sub.next_billing_at),
    'last_payment_at', v_sub.ultimo_pagamento
  );
end;
$$;

create or replace function public.redeem_promotional_token(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_client_id uuid := public.erp_current_client_id();
  v_token public.promotional_tokens%rowtype;
  v_plan public.plans%rowtype;
  v_until timestamptz := now() + interval '3 days';
begin
  if v_user_id is null or v_client_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if exists (select 1 from public.promotional_tokens where usado_por = v_client_id) then
    raise exception 'Este usuário já usou um token promocional';
  end if;

  if not exists (
    select 1 from public.saas_campaign_settings
    where id = true
      and campanha_tokens_ativa = true
      and campanha_inicio <= now()
      and (campanha_fim is null or campanha_fim >= now())
  ) then
    raise exception 'Campanha de tokens encerrada';
  end if;

  select * into v_token
  from public.promotional_tokens
  where upper(codigo) = upper(trim(p_codigo))
  for update;

  if v_token.id is null or v_token.usado or (v_token.expira_em is not null and v_token.expira_em < now()) then
    raise exception 'Token inválido ou expirado';
  end if;

  select * into v_plan from public.plans where slug = 'pro_token' limit 1;

  update public.promotional_tokens
  set usado = true,
      usado_por = v_client_id,
      usado_em = now()
  where id = v_token.id;

  insert into public.subscriptions (client_id, plan_id, status, status_assinatura, started_at, expires_at, next_billing_at, proximo_vencimento)
  values (v_client_id, v_plan.id, 'active', 'ativo', now(), v_until, v_until, v_until)
  on conflict (client_id) do update
    set plan_id = excluded.plan_id,
        status = 'active',
        status_assinatura = 'ativo',
        started_at = now(),
        expires_at = v_until,
        next_billing_at = v_until,
        proximo_vencimento = v_until,
        updated_at = now();

  update public.clients
  set plano_atual = 'pro_token',
      status_assinatura = 'ativo',
      status = 'active'
  where id = v_client_id;

  insert into public.audit_logs (user_id, client_id, action, details)
  values (v_user_id, v_client_id, 'uso de token', jsonb_build_object('codigo', v_token.codigo, 'expires_at', v_until));

  return jsonb_build_object('ok', true, 'plan', 'pro_token', 'expires_at', v_until);
end;
$$;

create or replace function public.register_saas_session(
  p_device_id text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_client_id uuid := public.erp_current_client_id();
  v_plan_slug text := 'free';
  v_limit integer := 1;
  v_session_id uuid;
  v_closed integer := 0;
begin
  if v_user_id is null or v_client_id is null or trim(coalesce(p_device_id, '')) = '' then
    return jsonb_build_object('ok', false, 'message', 'Sessão sem cliente');
  end if;

  select coalesce(p.slug, 'free') into v_plan_slug
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  where s.client_id = v_client_id
  limit 1;

  v_limit := case
    when v_plan_slug in ('premium', 'premium_trial') then 5
    when v_plan_slug in ('pro', 'pro_token') then 2
    else 1
  end;

  update public.saas_sessions
  set active = false,
      ended_at = now()
  where client_id = v_client_id
    and active = true
    and device_id <> p_device_id
    and id in (
      select id
      from public.saas_sessions
      where client_id = v_client_id
        and active = true
        and device_id <> p_device_id
      order by last_seen_at asc
      offset greatest(v_limit - 1, 0)
    );

  get diagnostics v_closed = row_count;

  insert into public.saas_sessions (user_id, client_id, device_id, user_agent)
  values (v_user_id, v_client_id, p_device_id, p_user_agent)
  on conflict (client_id, device_id) where active
  do update set last_seen_at = now(), user_agent = excluded.user_agent
  returning id into v_session_id;

  if v_closed > 0 then
    insert into public.audit_logs (user_id, client_id, action, details)
    values (v_user_id, v_client_id, 'múltiplos acessos', jsonb_build_object('closed_sessions', v_closed, 'limit', v_limit));
  end if;

  return jsonb_build_object('ok', true, 'session_id', v_session_id, 'closed_sessions', v_closed, 'limit', v_limit);
end;
$$;

alter table public.promotional_tokens enable row level security;
alter table public.saas_campaign_settings enable row level security;
alter table public.saas_sessions enable row level security;
alter table public.erp_payments enable row level security;

drop policy if exists "promotional_tokens_superadmin_all" on public.promotional_tokens;
create policy "promotional_tokens_superadmin_all"
on public.promotional_tokens for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "campaign_settings_superadmin_all" on public.saas_campaign_settings;
create policy "campaign_settings_superadmin_all"
on public.saas_campaign_settings for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "sessions_select_own_or_superadmin" on public.saas_sessions;
create policy "sessions_select_own_or_superadmin"
on public.saas_sessions for select
using (public.erp_is_superadmin() or client_id = public.erp_current_client_id());

drop policy if exists "payments_erp_select_own_or_superadmin" on public.erp_payments;
create policy "payments_erp_select_own_or_superadmin"
on public.erp_payments for select
using (public.erp_is_superadmin() or cliente_id = public.erp_current_client_id());

drop policy if exists "erp_payments_superadmin_all" on public.erp_payments;
create policy "erp_payments_superadmin_all"
on public.erp_payments for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());
