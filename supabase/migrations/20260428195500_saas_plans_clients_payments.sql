-- Simplifica 3D SaaS layer: clients, profiles, plans, subscriptions, payments and audit logs.
-- Safe to run more than once with: npx supabase db push

create extension if not exists pgcrypto;

alter table public.erp_profiles
  add column if not exists client_id uuid,
  add column if not exists accepted_terms_at timestamptz;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  responsible_name text,
  email text not null,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  last_access_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint clients_status_check check (status in ('active', 'overdue', 'blocked', 'inactive', 'cancelled'))
);

create unique index if not exists clients_email_unique_idx on public.clients (lower(email));

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price numeric(10,2) not null default 0,
  max_users integer not null default 1,
  max_orders integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_limits_check check (max_users > 0 and (max_orders is null or max_orders > 0))
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  email text not null,
  role text not null default 'admin',
  status text not null default 'active',
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('superadmin', 'admin', 'operador', 'visualizador')),
  constraint profiles_status_check check (status in ('active', 'inactive', 'blocked'))
);

create index if not exists profiles_client_id_idx on public.profiles(client_id);
create index if not exists profiles_email_idx on public.profiles(lower(email));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'erp_profiles_client_id_fkey'
      and conrelid = 'public.erp_profiles'::regclass
  ) then
    alter table public.erp_profiles
      add constraint erp_profiles_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete set null;
  end if;
end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  next_billing_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_status_check check (status in ('trialing', 'active', 'pending', 'overdue', 'blocked', 'cancelled'))
);

create index if not exists subscriptions_client_id_idx on public.subscriptions(client_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create unique index if not exists subscriptions_client_id_unique_idx on public.subscriptions(client_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  mercado_pago_payment_id text unique,
  amount numeric(10,2) not null default 0,
  status text not null default 'pending',
  payment_method text,
  external_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint payments_status_check check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'))
);

create index if not exists payments_client_id_created_idx on public.payments(client_id, created_at desc);
create index if not exists payments_subscription_id_idx on public.payments(subscription_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_client_created_idx on public.audit_logs(client_id, created_at desc);
create index if not exists audit_logs_user_created_idx on public.audit_logs(user_id, created_at desc);

create table if not exists public.erp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercado_pago',
  event_id text,
  event_type text,
  payment_id text,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists erp_webhook_events_created_idx on public.erp_webhook_events(created_at desc);
create index if not exists erp_webhook_events_payment_id_idx on public.erp_webhook_events(payment_id);

create table if not exists public.saas_retention_settings (
  id boolean primary key default true,
  inactive_days integer not null default 90,
  action text not null default 'mark_only',
  delete_after_days integer,
  updated_at timestamptz not null default now(),
  constraint saas_retention_settings_singleton check (id = true),
  constraint saas_retention_settings_action_check check (action in ('mark_only', 'suggest_delete', 'delete_after_days')),
  constraint saas_retention_settings_days_check check (inactive_days >= 1 and (delete_after_days is null or delete_after_days in (120, 180)))
);

insert into public.saas_retention_settings (id, inactive_days, action, delete_after_days)
values (true, 90, 'mark_only', null)
on conflict (id) do nothing;

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_saas_retention_settings_updated_at on public.saas_retention_settings;
create trigger set_saas_retention_settings_updated_at
before update on public.saas_retention_settings
for each row execute function public.set_updated_at();

insert into public.plans (slug, name, price, max_users, max_orders, active)
values
  ('basic', 'Básico', 19.90, 1, 50, true),
  ('pro', 'Pro', 39.90, 3, null, true)
on conflict (slug) do update
set name = excluded.name,
    price = excluded.price,
    max_users = excluded.max_users,
    max_orders = excluded.max_orders,
    active = true;

create or replace function public.erp_current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select client_id from public.erp_profiles where id = auth.uid() limit 1),
    (select client_id from public.profiles where user_id = auth.uid() limit 1)
  );
$$;

create or replace function public.erp_is_client_admin(p_client_id uuid default public.erp_current_client_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.erp_is_superadmin()
    or exists (
      select 1
      from public.profiles
      where user_id = auth.uid()
        and client_id = p_client_id
        and role in ('admin', 'superadmin')
        and status = 'active'
    )
    or exists (
      select 1
      from public.erp_profiles
      where id = auth.uid()
        and client_id = p_client_id
        and role in ('admin', 'superadmin')
        and status = 'active'
    );
$$;

alter table public.clients enable row level security;
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.erp_webhook_events enable row level security;
alter table public.saas_retention_settings enable row level security;

drop policy if exists "clients_select_own_or_superadmin" on public.clients;
create policy "clients_select_own_or_superadmin"
on public.clients for select
using (public.erp_is_superadmin() or id = public.erp_current_client_id());

drop policy if exists "clients_update_admin_or_superadmin" on public.clients;
create policy "clients_update_admin_or_superadmin"
on public.clients for update
using (public.erp_is_client_admin(id))
with check (public.erp_is_client_admin(id));

drop policy if exists "plans_select_active_or_superadmin" on public.plans;
create policy "plans_select_active_or_superadmin"
on public.plans for select
using (active or public.erp_is_superadmin());

drop policy if exists "plans_superadmin_all" on public.plans;
create policy "plans_superadmin_all"
on public.plans for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "profiles_select_same_client_or_superadmin" on public.profiles;
create policy "profiles_select_same_client_or_superadmin"
on public.profiles for select
using (
  public.erp_is_superadmin()
  or user_id = auth.uid()
  or client_id = public.erp_current_client_id()
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (user_id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
using (user_id = auth.uid() or public.erp_is_client_admin(client_id))
with check (user_id = auth.uid() or public.erp_is_client_admin(client_id));

drop policy if exists "subscriptions_select_same_client_or_superadmin" on public.subscriptions;
create policy "subscriptions_select_same_client_or_superadmin"
on public.subscriptions for select
using (public.erp_is_superadmin() or client_id = public.erp_current_client_id());

drop policy if exists "subscriptions_superadmin_all" on public.subscriptions;
create policy "subscriptions_superadmin_all"
on public.subscriptions for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "payments_select_same_client_or_superadmin" on public.payments;
create policy "payments_select_same_client_or_superadmin"
on public.payments for select
using (public.erp_is_superadmin() or client_id = public.erp_current_client_id());

drop policy if exists "payments_insert_same_client" on public.payments;
create policy "payments_insert_same_client"
on public.payments for insert
with check (client_id = public.erp_current_client_id() or public.erp_is_superadmin());

drop policy if exists "payments_superadmin_all" on public.payments;
create policy "payments_superadmin_all"
on public.payments for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "audit_logs_select_same_client_or_superadmin" on public.audit_logs;
create policy "audit_logs_select_same_client_or_superadmin"
on public.audit_logs for select
using (public.erp_is_superadmin() or client_id = public.erp_current_client_id() or user_id = auth.uid());

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
create policy "audit_logs_insert_own"
on public.audit_logs for insert
with check (user_id = auth.uid() or user_id is null);

drop policy if exists "audit_logs_superadmin_all" on public.audit_logs;
create policy "audit_logs_superadmin_all"
on public.audit_logs for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "webhook_events_superadmin_select" on public.erp_webhook_events;
create policy "webhook_events_superadmin_select"
on public.erp_webhook_events for select
using (public.erp_is_superadmin());

drop policy if exists "saas_retention_settings_superadmin_all" on public.saas_retention_settings;
create policy "saas_retention_settings_superadmin_all"
on public.saas_retention_settings for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

create or replace function public.register_saas_client(
  p_name text,
  p_responsible_name text,
  p_email text,
  p_phone text default null,
  p_plan_slug text default 'basic',
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
  v_plan public.plans%rowtype;
  v_subscription_id uuid;
  v_trial_days integer := greatest(0, coalesce(p_trial_days, 7));
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if v_email = '' then
    raise exception 'E-mail obrigatório';
  end if;

  select * into v_plan
  from public.plans
  where slug = coalesce(nullif(p_plan_slug, ''), 'basic')
    and active = true
  limit 1;

  if v_plan.id is null then
    select * into v_plan
    from public.plans
    where slug = 'basic'
    limit 1;
  end if;

  if exists (
    select 1 from public.clients
    where lower(email) = v_email
      and id <> coalesce(public.erp_current_client_id(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'E-mail já cadastrado';
  end if;

  insert into public.clients (name, responsible_name, email, phone, status, last_access_at)
  values (trim(p_name), trim(coalesce(p_responsible_name, p_name)), v_email, nullif(trim(coalesce(p_phone, '')), ''), 'active', now())
  on conflict ((lower(email))) do update
    set name = excluded.name,
        responsible_name = excluded.responsible_name,
        phone = excluded.phone,
        status = case when public.clients.status = 'cancelled' then 'active' else public.clients.status end,
        last_access_at = now()
  returning id into v_client_id;

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

  insert into public.subscriptions (client_id, plan_id, status, started_at, expires_at, next_billing_at)
  values (
    v_client_id,
    v_plan.id,
    case when v_trial_days > 0 then 'trialing' else 'pending' end,
    now(),
    case when v_trial_days > 0 then now() + make_interval(days => v_trial_days) else null end,
    case when v_trial_days > 0 then now() + make_interval(days => v_trial_days) else now() end
  )
  on conflict (client_id) do update
    set plan_id = excluded.plan_id,
        status = case when public.subscriptions.status in ('cancelled', 'blocked') then excluded.status else public.subscriptions.status end,
        expires_at = coalesce(public.subscriptions.expires_at, excluded.expires_at),
        next_billing_at = coalesce(public.subscriptions.next_billing_at, excluded.next_billing_at)
  returning id into v_subscription_id;

  insert into public.audit_logs (user_id, client_id, action, details)
  values (v_user_id, v_client_id, 'criação usuário', jsonb_build_object('source', 'register_saas_client', 'plan', v_plan.slug));

  return jsonb_build_object(
    'client_id', v_client_id,
    'subscription_id', v_subscription_id,
    'plan', v_plan.slug,
    'status', case when v_trial_days > 0 then 'trialing' else 'pending' end
  );
end;
$$;

create or replace function public.touch_client_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid := public.erp_current_client_id();
begin
  if v_client_id is null then
    return;
  end if;

  update public.clients
  set last_access_at = now(),
      status = case when status = 'inactive' then 'active' else status end
  where id = v_client_id;

  insert into public.audit_logs (user_id, client_id, action)
  values (auth.uid(), v_client_id, 'login');
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
    return jsonb_build_object('status', 'active', 'block_level', 'none', 'plan', 'Super Admin', 'max_users', null, 'max_orders', null);
  end if;

  if v_client_id is null then
    return jsonb_build_object('status', 'blocked', 'block_level', 'total', 'message', 'Cliente não vinculado');
  end if;

  select s.*, p.name as plan_name, p.slug as plan_slug, p.max_users, p.max_orders
  into v_sub
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  where s.client_id = v_client_id
  order by s.created_at desc
  limit 1;

  if v_sub.id is null then
    return jsonb_build_object('status', 'pending', 'block_level', 'partial', 'message', 'Pagamento pendente');
  end if;

  v_status := v_sub.status;

  if v_sub.status in ('active', 'trialing') and (v_sub.expires_at is null or v_sub.expires_at >= now()) then
    v_block_level := 'none';
  elsif v_sub.status in ('pending', 'overdue', 'active', 'trialing') then
    v_days_overdue := greatest(0, floor(extract(epoch from (now() - coalesce(v_sub.expires_at, v_sub.next_billing_at, now()))) / 86400)::integer);
    if v_days_overdue <= 3 then
      v_status := 'overdue';
      v_block_level := 'warning';
    elsif v_days_overdue <= 7 then
      v_status := 'overdue';
      v_block_level := 'partial';
    else
      v_status := 'blocked';
      v_block_level := 'total';
    end if;
  else
    v_block_level := 'total';
  end if;

  return jsonb_build_object(
    'client_id', v_client_id,
    'subscription_id', v_sub.id,
    'status', v_status,
    'block_level', v_block_level,
    'days_overdue', v_days_overdue,
    'plan', coalesce(v_sub.plan_name, 'Básico'),
    'plan_slug', coalesce(v_sub.plan_slug, 'basic'),
    'max_users', v_sub.max_users,
    'max_orders', v_sub.max_orders,
    'expires_at', v_sub.expires_at,
    'next_billing_at', v_sub.next_billing_at
  );
end;
$$;

create or replace function public.mark_inactive_clients(p_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if not public.erp_is_superadmin() then
    raise exception 'Acesso negado';
  end if;

  with marcados as (
    update public.clients c
    set status = 'inactive'
    where c.status = 'active'
      and c.last_access_at is not null
      and c.last_access_at < now() - make_interval(days => greatest(1, coalesce(p_days, 90)))
      and not exists (
        select 1 from public.payments p
        where p.client_id = c.id
          and p.status = 'approved'
          and p.created_at >= now() - interval '90 days'
      )
    returning c.id
  )
  insert into public.audit_logs (client_id, action, details)
  select id, 'marcado inativo', jsonb_build_object('days', p_days)
  from marcados;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
