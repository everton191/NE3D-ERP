-- Simplifica 3D: definitive plans, ads state, roles and suggestions.
-- Idempotent migration for the Free / Trial / Paid model.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.superadmins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint superadmins_status_check check (status in ('active', 'inactive'))
);

drop trigger if exists set_superadmins_updated_at on public.superadmins;
create trigger set_superadmins_updated_at
before update on public.superadmins
for each row execute function public.set_updated_at();

alter table public.superadmins enable row level security;

create or replace function public.erp_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.superadmins sa
    where sa.user_id = auth.uid()
      and sa.status = 'active'
  )
  or exists (
    select 1
    from public.erp_profiles ep
    where ep.id = auth.uid()
      and ep.role = 'superadmin'
      and coalesce(ep.status, 'active') = 'active'
  );
$$;

revoke execute on function public.erp_is_superadmin() from public, anon;
grant execute on function public.erp_is_superadmin() to authenticated, service_role;

drop policy if exists "superadmins_select_superadmin" on public.superadmins;
create policy "superadmins_select_superadmin"
on public.superadmins for select
to authenticated
using (public.erp_is_superadmin());

drop policy if exists "superadmins_manage_superadmin" on public.superadmins;
create policy "superadmins_manage_superadmin"
on public.superadmins for all
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'superadmin', 'operador', 'visualizador'));

alter table public.erp_profiles drop constraint if exists erp_profiles_role_check;
alter table public.erp_profiles
  add constraint erp_profiles_role_check
  check (role in ('user', 'admin', 'superadmin', 'operador', 'visualizador'));

alter table public.company_members drop constraint if exists company_members_role_check;
alter table public.company_members
  add constraint company_members_role_check
  check (role in ('owner', 'user', 'admin', 'attendant', 'production', 'finance', 'read_only'));

alter table public.clients
  add column if not exists active_plan text not null default 'free',
  add column if not exists pending_plan text,
  add column if not exists payment_status text not null default 'none',
  add column if not exists subscription_status text not null default 'active',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_price numeric(10,2),
  add column if not exists price_locked boolean not null default false,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_expires_at timestamptz,
  add column if not exists is_trial_active boolean not null default false,
  add column if not exists last_ad_shown_at timestamptz;

alter table public.subscriptions
  add column if not exists active_plan text not null default 'free',
  add column if not exists pending_plan text,
  add column if not exists payment_status text not null default 'none',
  add column if not exists subscription_status text not null default 'active',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_price numeric(10,2),
  add column if not exists price_locked boolean not null default false,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_expires_at timestamptz,
  add column if not exists is_trial_active boolean not null default false,
  add column if not exists pending_started_at timestamptz;

alter table public.payments
  add column if not exists pending_expires_at timestamptz,
  add column if not exists plan_price numeric(10,2);

do $$
begin
  alter table public.clients drop constraint if exists clients_active_plan_check;
  alter table public.clients
    add constraint clients_active_plan_check
    check (active_plan in ('free', 'premium_trial', 'premium'));

  alter table public.clients drop constraint if exists clients_pending_plan_check;
  alter table public.clients
    add constraint clients_pending_plan_check
    check (pending_plan is null or pending_plan in ('free', 'premium_trial', 'premium'));

  alter table public.clients drop constraint if exists clients_payment_status_check;
  alter table public.clients
    add constraint clients_payment_status_check
    check (payment_status in ('none', 'pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'));

  alter table public.clients drop constraint if exists clients_subscription_status_definitive_check;
  alter table public.clients
    add constraint clients_subscription_status_definitive_check
    check (subscription_status in ('free', 'trialing', 'active', 'past_due', 'cancelled', 'expired'));

  alter table public.subscriptions drop constraint if exists subscriptions_active_plan_check;
  alter table public.subscriptions
    add constraint subscriptions_active_plan_check
    check (active_plan in ('free', 'premium_trial', 'premium'));

  alter table public.subscriptions drop constraint if exists subscriptions_pending_plan_check;
  alter table public.subscriptions
    add constraint subscriptions_pending_plan_check
    check (pending_plan is null or pending_plan in ('free', 'premium_trial', 'premium'));

  alter table public.subscriptions drop constraint if exists subscriptions_payment_status_check;
  alter table public.subscriptions
    add constraint subscriptions_payment_status_check
    check (payment_status in ('none', 'pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'));

  alter table public.subscriptions drop constraint if exists subscriptions_subscription_status_check;
  alter table public.subscriptions
    add constraint subscriptions_subscription_status_check
    check (subscription_status in ('free', 'trialing', 'active', 'past_due', 'cancelled', 'expired'));
end $$;

create index if not exists clients_active_plan_idx
  on public.clients(active_plan, subscription_status, created_at desc);

create index if not exists subscriptions_active_plan_idx
  on public.subscriptions(active_plan, subscription_status, created_at desc);

create index if not exists subscriptions_pending_plan_idx
  on public.subscriptions(pending_plan, payment_status, pending_started_at);

insert into public.plans (
  slug, name, price, max_users, max_orders, max_clients, max_calculator_uses,
  max_storage_mb, allow_pdf, allow_reports, allow_permissions, active, sort_order, kind
)
values
  ('free', 'Free', 0, 1, null, null, null, 25, false, false, false, true, 10, 'free'),
  ('premium_trial', 'Teste gratis', 0, 5, null, null, null, null, true, true, true, true, 20, 'trial'),
  ('premium', 'Pago', 29.90, 5, null, null, null, null, true, true, true, true, 30, 'paid')
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

create or replace function public.s3d_current_paid_price()
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_paid_clients integer := 0;
begin
  select count(distinct client_id)
  into v_paid_clients
  from public.subscriptions
  where active_plan = 'premium'
     or (price_locked is true and plan_price is not null and plan_price > 0);

  if v_paid_clients < 100 then
    return 19.90;
  elsif v_paid_clients < 200 then
    return 24.90;
  end if;

  return 29.90;
end;
$$;

grant execute on function public.s3d_current_paid_price() to anon, authenticated, service_role;

create or replace function public.s3d_is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.erp_is_superadmin()
    or exists (
      select 1
      from public.company_members cm
      where cm.company_id = p_company_id
        and cm.user_id = auth.uid()
        and cm.role = 'admin'
        and cm.status = 'active'
    )
    or exists (
      select 1
      from public.profiles p
      where p.company_id = p_company_id
        and p.user_id = auth.uid()
        and p.role = 'admin'
        and p.status = 'active'
    )
    or exists (
      select 1
      from public.erp_profiles ep
      where ep.company_id = p_company_id
        and ep.id = auth.uid()
        and ep.role = 'admin'
        and ep.status = 'active'
    );
$$;

revoke execute on function public.s3d_is_company_admin(uuid) from public, anon;
grant execute on function public.s3d_is_company_admin(uuid) to authenticated, service_role;

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
      from public.profiles p
      where p.user_id = auth.uid()
        and p.client_id = p_client_id
        and p.role = 'admin'
        and p.status = 'active'
    )
    or exists (
      select 1
      from public.erp_profiles ep
      where ep.id = auth.uid()
        and ep.client_id = p_client_id
        and ep.role = 'admin'
        and ep.status = 'active'
    );
$$;

revoke execute on function public.erp_is_client_admin(uuid) from public, anon;
grant execute on function public.erp_is_client_admin(uuid) to authenticated, service_role;

create or replace function public.s3d_cleanup_subscription_state()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changed integer := 0;
  v_rows integer := 0;
begin
  update public.subscriptions s
  set pending_plan = null,
      payment_status = 'none',
      pending_started_at = null,
      updated_at = now()
  where s.payment_status = 'pending'
    and coalesce(s.pending_started_at, s.updated_at, s.created_at) < now() - interval '24 hours';
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  update public.subscriptions s
  set active_plan = 'free',
      plan_id = (select id from public.plans where slug = 'free' limit 1),
      status = 'active',
      status_assinatura = 'active',
      subscription_status = 'free',
      current_period_start = null,
      current_period_end = null,
      expires_at = null,
      next_billing_at = null,
      proximo_vencimento = null,
      plan_expires_at = null,
      is_trial_active = false,
      updated_at = now()
  where (
      s.active_plan = 'premium_trial'
      or (s.is_trial_active is true)
    )
    and coalesce(s.trial_expires_at, s.plan_expires_at, s.current_period_end, s.expires_at) < now();
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  update public.subscriptions s
  set active_plan = 'free',
      plan_id = (select id from public.plans where slug = 'free' limit 1),
      status = 'active',
      status_assinatura = 'active',
      subscription_status = 'free',
      current_period_start = null,
      current_period_end = null,
      expires_at = null,
      next_billing_at = null,
      proximo_vencimento = null,
      plan_expires_at = null,
      updated_at = now()
  where s.active_plan = 'premium'
    and s.subscription_status = 'active'
    and s.plan_expires_at is not null
    and s.plan_expires_at < now();
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  update public.clients c
  set active_plan = s.active_plan,
      pending_plan = s.pending_plan,
      payment_status = s.payment_status,
      subscription_status = s.subscription_status,
      plan_expires_at = s.plan_expires_at,
      plan_price = s.plan_price,
      price_locked = s.price_locked,
      trial_started_at = s.trial_started_at,
      trial_expires_at = s.trial_expires_at,
      is_trial_active = s.is_trial_active,
      plano_atual = s.active_plan,
      status_assinatura = s.status,
      status = case
        when c.status = 'blocked' then 'blocked'
        when s.subscription_status in ('past_due', 'cancelled', 'expired') then 'overdue'
        else 'active'
      end,
      updated_at = now()
  from public.subscriptions s
  where s.client_id = c.id;
  get diagnostics v_rows = row_count;
  v_changed := v_changed + v_rows;

  return v_changed;
end;
$$;

grant execute on function public.s3d_cleanup_subscription_state() to authenticated, service_role;

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
      client_id, plan_id, active_plan, status, status_assinatura, subscription_status
    )
    values (
      new.client_id,
      (select id from public.plans where slug = 'free' limit 1),
      'free',
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
        pending_started_at = coalesce(pending_started_at, new.created_at, now()),
        updated_at = now()
    where id = v_subscription.id;
  elsif new.status = 'approved' then
    v_price := coalesce(new.plan_price, new.amount, v_subscription.plan_price, public.s3d_current_paid_price());
    v_expires := coalesce(v_subscription.plan_expires_at, v_subscription.current_period_end, now() + interval '30 days');

    update public.subscriptions
    set plan_id = (select id from public.plans where slug = v_plan limit 1),
        active_plan = v_plan,
        pending_plan = null,
        payment_status = 'approved',
        subscription_status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        status_assinatura = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        plan_price = case when v_plan = 'premium' then v_price else null end,
        price_locked = case when v_plan = 'premium' then true else false end,
        plan_expires_at = v_expires,
        current_period_start = coalesce(current_period_start, now()),
        current_period_end = v_expires,
        expires_at = v_expires,
        next_billing_at = v_expires,
        proximo_vencimento = v_expires,
        pending_started_at = null,
        updated_at = now()
    where id = v_subscription.id;
  elsif new.status in ('rejected', 'cancelled', 'refunded', 'charged_back') then
    update public.subscriptions
    set pending_plan = null,
        payment_status = case when new.status in ('refunded', 'charged_back') then 'cancelled' else new.status end,
        pending_started_at = null,
        updated_at = now()
    where id = v_subscription.id;
  end if;

  perform public.s3d_cleanup_subscription_state();
  return new;
end;
$$;

drop trigger if exists s3d_apply_payment_to_subscription on public.payments;
create trigger s3d_apply_payment_to_subscription
after insert or update of status, amount, plan_slug, plan_price on public.payments
for each row execute function private.s3d_apply_payment_to_subscription();

with mapped as (
  select
    s.id,
    coalesce(p.slug, s.active_plan, 'free') as plan_slug,
    lower(coalesce(s.status, s.status_assinatura, 'active')) as old_status,
    coalesce(s.current_period_start, s.started_at, s.created_at, now()) as start_at,
    coalesce(s.current_period_end, s.expires_at, s.next_billing_at, s.proximo_vencimento) as end_at,
    coalesce(
      s.plan_price,
      (select pay.amount from public.payments pay where pay.subscription_id = s.id and pay.status = 'approved' order by pay.created_at desc limit 1),
      case when coalesce(p.slug, '') = 'premium' then p.price else null end
    ) as locked_price
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
)
update public.subscriptions s
set active_plan = case
      when mapped.plan_slug = 'premium_trial' and mapped.end_at is not null and mapped.end_at >= now() then 'premium_trial'
      when mapped.plan_slug = 'premium' and mapped.old_status in ('active', 'paid', 'pago', 'ativo', 'trialing') and (mapped.end_at is null or mapped.end_at >= now()) then 'premium'
      else 'free'
    end,
    pending_plan = case when mapped.old_status = 'pending' then mapped.plan_slug else null end,
    payment_status = case when mapped.old_status = 'pending' then 'pending' else coalesce(nullif(s.payment_status, 'pending'), 'none') end,
    pending_started_at = case when mapped.old_status = 'pending' then coalesce(s.pending_started_at, s.updated_at, s.created_at) else null end,
    subscription_status = case
      when mapped.plan_slug = 'premium_trial' and mapped.end_at is not null and mapped.end_at >= now() then 'trialing'
      when mapped.plan_slug = 'premium' and mapped.old_status in ('active', 'paid', 'pago', 'ativo', 'trialing') and (mapped.end_at is null or mapped.end_at >= now()) then 'active'
      else 'free'
    end,
    status = case
      when mapped.plan_slug = 'premium_trial' and mapped.end_at is not null and mapped.end_at >= now() then 'trialing'
      else 'active'
    end,
    status_assinatura = case
      when mapped.plan_slug = 'premium_trial' and mapped.end_at is not null and mapped.end_at >= now() then 'trialing'
      else 'active'
    end,
    plan_expires_at = case when mapped.plan_slug in ('premium_trial', 'premium') and mapped.end_at >= now() then mapped.end_at else null end,
    trial_started_at = case when mapped.plan_slug = 'premium_trial' and mapped.end_at >= now() then mapped.start_at else null end,
    trial_expires_at = case when mapped.plan_slug = 'premium_trial' and mapped.end_at >= now() then mapped.end_at else null end,
    is_trial_active = mapped.plan_slug = 'premium_trial' and mapped.end_at >= now(),
    plan_price = case when mapped.plan_slug = 'premium' then mapped.locked_price else s.plan_price end,
    price_locked = case when mapped.plan_slug = 'premium' and mapped.locked_price is not null then true else s.price_locked end,
    updated_at = now()
from mapped
where s.id = mapped.id;

update public.subscriptions
set active_plan = 'free',
    pending_plan = null,
    payment_status = 'none',
    subscription_status = 'free',
    status = 'active',
    status_assinatura = 'active',
    plan_expires_at = null,
    current_period_start = null,
    current_period_end = null,
    expires_at = null,
    next_billing_at = null,
    proximo_vencimento = null,
    is_trial_active = false,
    updated_at = now()
where payment_status = 'pending'
  and coalesce(pending_started_at, updated_at, created_at) < now() - interval '24 hours';

update public.profiles
set role = 'user',
    updated_at = now()
where role = 'admin'
  and not exists (
    select 1
    from public.superadmins sa
    where sa.user_id = public.profiles.user_id
      and sa.status = 'active'
  )
  and not exists (
    select 1
    from public.erp_profiles ep
    where ep.id = public.profiles.user_id
      and ep.role = 'superadmin'
      and coalesce(ep.status, 'active') = 'active'
  );

update public.erp_profiles
set role = 'user',
    updated_at = now()
where role = 'admin'
  and not exists (
    select 1
    from public.superadmins sa
    where sa.user_id = public.erp_profiles.id
      and sa.status = 'active'
  );

update public.company_members
set role = 'user',
    updated_at = now()
where role = 'owner';

alter table public.company_members drop constraint if exists company_members_role_check;
alter table public.company_members
  add constraint company_members_role_check
  check (role in ('user', 'admin', 'attendant', 'production', 'finance', 'read_only'));

select public.s3d_cleanup_subscription_state();

create table if not exists public.app_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  client_id uuid null references public.clients(id) on delete set null,
  type text not null default 'suggestion',
  category text not null default 'geral',
  title text not null,
  description text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_suggestions_type_check check (type in ('suggestion', 'bug', 'feature')),
  constraint app_suggestions_status_check check (status in ('new', 'reviewing', 'planned', 'done', 'ignored', 'closed'))
);

create index if not exists app_suggestions_category_idx
  on public.app_suggestions(category, created_at desc);

create index if not exists app_suggestions_client_idx
  on public.app_suggestions(client_id, created_at desc);

drop trigger if exists set_app_suggestions_updated_at on public.app_suggestions;
create trigger set_app_suggestions_updated_at
before update on public.app_suggestions
for each row execute function public.set_updated_at();

alter table public.app_suggestions enable row level security;

drop policy if exists "app_suggestions_insert_anyone" on public.app_suggestions;
create policy "app_suggestions_insert_anyone"
on public.app_suggestions for insert
to anon, authenticated
with check (
  type in ('suggestion', 'bug', 'feature')
  and length(trim(title)) >= 3
  and (
    user_id is null
    or user_id = auth.uid()
    or public.erp_is_superadmin()
  )
);

drop policy if exists "app_suggestions_select_own_or_superadmin" on public.app_suggestions;
create policy "app_suggestions_select_own_or_superadmin"
on public.app_suggestions for select
to authenticated
using (
  public.erp_is_superadmin()
  or user_id = auth.uid()
  or client_id = public.erp_current_client_id()
);

drop policy if exists "app_suggestions_update_superadmin" on public.app_suggestions;
create policy "app_suggestions_update_superadmin"
on public.app_suggestions for update
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "profiles_select_same_client_or_superadmin" on public.profiles;
create policy "profiles_select_same_client_or_superadmin"
on public.profiles for select
to authenticated
using (
  public.erp_is_superadmin()
  or user_id = auth.uid()
  or public.erp_is_client_admin(client_id)
);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using (
  public.erp_is_superadmin()
  or public.erp_is_client_admin(client_id)
  or user_id = auth.uid()
)
with check (
  public.erp_is_superadmin()
  or public.erp_is_client_admin(client_id)
  or (
    user_id = auth.uid()
    and role = 'user'
  )
);

drop policy if exists "company_members_select_company_or_superadmin" on public.company_members;
create policy "company_members_select_company_or_superadmin"
on public.company_members for select
to authenticated
using (
  public.erp_is_superadmin()
  or user_id = auth.uid()
  or public.s3d_is_company_admin(company_id)
);

drop policy if exists "company_members_insert_owner_or_superadmin" on public.company_members;
drop policy if exists "company_members_insert_admin_or_superadmin" on public.company_members;
create policy "company_members_insert_admin_or_superadmin"
on public.company_members for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_admin(company_id));

drop policy if exists "company_members_update_owner_or_superadmin" on public.company_members;
drop policy if exists "company_members_update_admin_or_superadmin" on public.company_members;
create policy "company_members_update_admin_or_superadmin"
on public.company_members for update
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_admin(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_admin(company_id));

drop policy if exists "company_members_delete_owner_or_superadmin" on public.company_members;
drop policy if exists "company_members_delete_admin_or_superadmin" on public.company_members;
create policy "company_members_delete_admin_or_superadmin"
on public.company_members for delete
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_admin(company_id));

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
  v_company_id uuid;
  v_plan public.plans%rowtype;
  v_subscription_id uuid;
  v_trial_days integer := 7;
  v_start timestamptz := now();
  v_end timestamptz := now() + interval '7 days';
  v_role text := 'user';
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if v_email = '' then
    raise exception 'E-mail obrigatorio';
  end if;

  select * into v_plan
  from public.plans
  where slug = 'premium_trial'
    and active = true
  limit 1;

  if v_plan.id is null then
    select * into v_plan from public.plans where slug = 'free' limit 1;
    v_end := null;
    v_trial_days := 0;
  end if;

  if public.erp_is_superadmin() then
    v_role := 'superadmin';
  end if;

  select c.id, c.client_code, c.company_id
  into v_client_id, v_client_code, v_company_id
  from public.clients c
  where lower(c.email) = v_email
  limit 1;

  if v_company_id is null then
    insert into public.companies (owner_user_id, name, phone, status, setup_completed)
    values (null, trim(p_name), nullif(trim(coalesce(p_phone, '')), ''), 'active', false)
    returning id into v_company_id;
  end if;

  insert into public.clients (
    client_code, company_id, name, responsible_name, nome_responsavel, email, phone,
    status, plano_atual, status_assinatura, active_plan, subscription_status,
    trial_started_at, trial_expires_at, is_trial_active, criado_em, last_access_at
  )
  values (
    public.next_s3d_client_code(), v_company_id, trim(p_name), trim(coalesce(p_responsible_name, p_name)),
    trim(coalesce(p_responsible_name, p_name)), v_email, nullif(trim(coalesce(p_phone, '')), ''),
    'active', coalesce(v_plan.slug, 'free'), case when v_trial_days > 0 then 'trialing' else 'active' end,
    coalesce(v_plan.slug, 'free'), case when v_trial_days > 0 then 'trialing' else 'free' end,
    case when v_trial_days > 0 then v_start else null end,
    case when v_trial_days > 0 then v_end else null end,
    v_trial_days > 0,
    now(), now()
  )
  on conflict ((lower(email))) do update
    set company_id = coalesce(public.clients.company_id, excluded.company_id),
        name = excluded.name,
        responsible_name = excluded.responsible_name,
        nome_responsavel = excluded.nome_responsavel,
        phone = excluded.phone,
        status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
        last_access_at = now(),
        updated_at = now()
  returning id, client_code, company_id into v_client_id, v_client_code, v_company_id;

  insert into public.company_members (company_id, user_id, role, status)
  values (v_company_id, v_user_id, 'user', 'active')
  on conflict (company_id, user_id) do update
    set role = case when public.company_members.role = 'admin' then 'admin' else 'user' end,
        status = 'active',
        updated_at = now();

  insert into public.profiles (
    user_id, client_id, company_id, name, email, phone, role, status, accepted_terms_at
  )
  values (v_user_id, v_client_id, v_company_id, trim(coalesce(p_responsible_name, p_name)), v_email, nullif(trim(coalesce(p_phone, '')), ''), v_role, 'active', now())
  on conflict (user_id) do update
    set client_id = excluded.client_id,
        company_id = coalesce(public.profiles.company_id, excluded.company_id),
        name = excluded.name,
        email = excluded.email,
        phone = coalesce(excluded.phone, public.profiles.phone),
        role = case when public.profiles.role = 'superadmin' then 'superadmin' else public.profiles.role end,
        status = 'active',
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = now();

  insert into public.erp_profiles (
    id, email, display_name, phone, role, status, client_id, company_id, accepted_terms_at, last_login_at
  )
  values (v_user_id, v_email, trim(coalesce(p_responsible_name, p_name)), nullif(trim(coalesce(p_phone, '')), ''), v_role, 'active', v_client_id, v_company_id, now(), now())
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        phone = coalesce(excluded.phone, public.erp_profiles.phone),
        role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else public.erp_profiles.role end,
        status = 'active',
        client_id = excluded.client_id,
        company_id = coalesce(public.erp_profiles.company_id, excluded.company_id),
        accepted_terms_at = coalesce(public.erp_profiles.accepted_terms_at, excluded.accepted_terms_at),
        last_login_at = now();

  insert into public.subscriptions (
    client_id, company_id, user_id, plan_id, status, status_assinatura, active_plan,
    subscription_status, promo_used, billing_variant, started_at, expires_at,
    next_billing_at, proximo_vencimento, current_period_start, current_period_end,
    trial_started_at, trial_expires_at, is_trial_active
  )
  values (
    v_client_id, v_company_id, v_user_id, v_plan.id,
    case when v_trial_days > 0 then 'trialing' else 'active' end,
    case when v_trial_days > 0 then 'trialing' else 'active' end,
    coalesce(v_plan.slug, 'free'),
    case when v_trial_days > 0 then 'trialing' else 'free' end,
    false, 'premium_first_month', v_start, v_end, v_end, v_end, v_start, v_end,
    case when v_trial_days > 0 then v_start else null end,
    case when v_trial_days > 0 then v_end else null end,
    v_trial_days > 0
  )
  on conflict (client_id) do update
    set company_id = coalesce(public.subscriptions.company_id, excluded.company_id),
        user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
        updated_at = now()
  returning id into v_subscription_id;

  perform public.s3d_cleanup_subscription_state();

  return jsonb_build_object(
    'client_id', v_client_id,
    'company_id', v_company_id,
    'clienteId', v_client_code,
    'client_code', v_client_code,
    'subscription_id', v_subscription_id,
    'active_plan', coalesce(v_plan.slug, 'free'),
    'plan_slug', coalesce(v_plan.slug, 'free'),
    'status', case when v_trial_days > 0 then 'trialing' else 'active' end,
    'trial_started_at', case when v_trial_days > 0 then v_start else null end,
    'trial_expires_at', case when v_trial_days > 0 then v_end else null end,
    'is_trial_active', v_trial_days > 0,
    'member_role', 'user'
  );
end;
$$;

revoke execute on function public.register_saas_client(text, text, text, text, text, integer) from public, anon;
grant execute on function public.register_saas_client(text, text, text, text, text, integer) to authenticated, service_role;

create or replace function public.handle_new_saas_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(coalesce(new.email, '')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'owner_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'Usuario'));
  v_business text := trim(coalesce(
    nullif(new.raw_user_meta_data->>'company_name', ''),
    nullif(new.raw_user_meta_data->>'business_name', ''),
    nullif(new.raw_user_meta_data->>'company', ''),
    nullif(new.raw_user_meta_data->>'negocio', ''),
    v_name,
    'Minha empresa 3D'
  ));
  v_phone text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_cnpj text := nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'cnpj', ''), '\D', '', 'g'), '');
  v_plan public.plans%rowtype;
  v_client_id uuid;
  v_client_code text;
  v_company_id uuid;
  v_subscription_id uuid;
  v_start timestamptz := now();
  v_end timestamptz := now() + interval '7 days';
  v_profile_role text := 'user';
begin
  if v_email = '' then
    return new;
  end if;

  select * into v_plan from public.plans where slug = 'premium_trial' and active = true limit 1;
  if v_plan.id is null then
    select * into v_plan from public.plans where slug = 'free' limit 1;
    v_end := null;
  end if;

  if exists (select 1 from public.superadmins where user_id = new.id and status = 'active') then
    v_profile_role := 'superadmin';
  end if;

  select c.id, c.client_code, c.company_id
  into v_client_id, v_client_code, v_company_id
  from public.clients c
  where lower(c.email) = v_email
  limit 1;

  if v_company_id is null then
    insert into public.companies (owner_user_id, name, phone, cnpj, status, setup_completed)
    values (null, v_business, v_phone, v_cnpj, 'active', false)
    returning id into v_company_id;
  end if;

  insert into public.clients (
    client_code, company_id, name, responsible_name, nome_responsavel, email, phone, cnpj,
    status, plano_atual, status_assinatura, active_plan, subscription_status,
    trial_started_at, trial_expires_at, is_trial_active, criado_em, last_access_at
  )
  values (
    public.next_s3d_client_code(), v_company_id, v_business, v_name, v_name, v_email, v_phone, v_cnpj,
    'active', coalesce(v_plan.slug, 'free'), case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    coalesce(v_plan.slug, 'free'), case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'free' end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_start else null end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_end else null end,
    coalesce(v_plan.slug, 'free') = 'premium_trial',
    now(), now()
  )
  on conflict ((lower(email))) do update
    set company_id = coalesce(public.clients.company_id, excluded.company_id),
        name = coalesce(nullif(excluded.name, ''), public.clients.name),
        responsible_name = coalesce(nullif(excluded.responsible_name, ''), public.clients.responsible_name),
        nome_responsavel = coalesce(nullif(excluded.nome_responsavel, ''), public.clients.nome_responsavel),
        phone = coalesce(excluded.phone, public.clients.phone),
        cnpj = coalesce(excluded.cnpj, public.clients.cnpj),
        status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
        last_access_at = now(),
        updated_at = now()
  returning id, client_code, company_id into v_client_id, v_client_code, v_company_id;

  insert into public.company_members (company_id, user_id, role, status)
  values (v_company_id, new.id, 'user', 'active')
  on conflict (company_id, user_id) do update
    set role = case when public.company_members.role = 'admin' then 'admin' else 'user' end,
        status = 'active',
        updated_at = now();

  insert into public.profiles (
    user_id, client_id, company_id, name, email, phone, role, status,
    accepted_terms_at, onboarding_completed, onboarding_step
  )
  values (
    new.id, v_client_id, v_company_id, v_name, v_email, v_phone, v_profile_role, 'active',
    case when lower(coalesce(new.raw_user_meta_data->>'accepted_terms', 'false')) = 'true' then now() else null end,
    false, 0
  )
  on conflict (user_id) do update
    set client_id = excluded.client_id,
        company_id = coalesce(public.profiles.company_id, excluded.company_id),
        name = coalesce(nullif(excluded.name, ''), public.profiles.name),
        email = excluded.email,
        phone = coalesce(excluded.phone, public.profiles.phone),
        role = case when public.profiles.role = 'superadmin' then 'superadmin' else public.profiles.role end,
        status = 'active',
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = now();

  insert into public.erp_profiles (
    id, email, display_name, phone, role, status, client_id, company_id,
    accepted_terms_at, last_login_at, onboarding_completed, onboarding_step
  )
  values (
    new.id, v_email, v_name, v_phone, v_profile_role, 'active', v_client_id, v_company_id,
    case when lower(coalesce(new.raw_user_meta_data->>'accepted_terms', 'false')) = 'true' then now() else null end,
    now(), false, 0
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(excluded.display_name, ''), public.erp_profiles.display_name),
        phone = coalesce(excluded.phone, public.erp_profiles.phone),
        role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else public.erp_profiles.role end,
        status = 'active',
        client_id = excluded.client_id,
        company_id = coalesce(public.erp_profiles.company_id, excluded.company_id),
        accepted_terms_at = coalesce(public.erp_profiles.accepted_terms_at, excluded.accepted_terms_at),
        last_login_at = now();

  insert into public.subscriptions (
    client_id, company_id, user_id, plan_id, status, status_assinatura, active_plan,
    subscription_status, promo_used, billing_variant, started_at, expires_at,
    next_billing_at, proximo_vencimento, current_period_start, current_period_end,
    trial_started_at, trial_expires_at, is_trial_active
  )
  values (
    v_client_id, v_company_id, new.id, v_plan.id,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    coalesce(v_plan.slug, 'free'),
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'free' end,
    false, 'premium_first_month', v_start, v_end, v_end, v_end, v_start, v_end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_start else null end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_end else null end,
    coalesce(v_plan.slug, 'free') = 'premium_trial'
  )
  on conflict (client_id) do update
    set company_id = coalesce(public.subscriptions.company_id, excluded.company_id),
        user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
        updated_at = now()
  returning id into v_subscription_id;

  insert into public.sync_settings (user_id, company_id, status, settings)
  values (new.id, v_company_id, 'idle', jsonb_build_object('auto_sync', true))
  on conflict (user_id) do update
    set company_id = coalesce(public.sync_settings.company_id, excluded.company_id),
        settings = public.sync_settings.settings || excluded.settings,
        updated_at = now();

  insert into public.audit_logs (user_id, client_id, action, details)
  values (
    new.id, v_client_id, 'cadastro auth',
    jsonb_build_object('source', 'handle_new_saas_auth_user', 'client_code', v_client_code, 'company_id', v_company_id, 'subscription_id', v_subscription_id, 'member_role', 'user')
  );

  perform public.s3d_cleanup_subscription_state();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_saas_profile on auth.users;
create trigger on_auth_user_created_saas_profile
after insert on auth.users
for each row execute function public.handle_new_saas_auth_user();

revoke execute on function public.handle_new_saas_auth_user() from public, anon, authenticated;

create or replace function public.sync_saas_user_after_login(
  p_name text default null,
  p_business_name text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_auth_user auth.users%rowtype;
  v_email text;
  v_name text;
  v_business text;
  v_phone text;
  v_cnpj text;
  v_client_id uuid;
  v_client_code text;
  v_company_id uuid;
  v_plan public.plans%rowtype;
  v_subscription_id uuid;
  v_start timestamptz := now();
  v_end timestamptz;
  v_existing_erp_role text;
  v_profile_role text := 'user';
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;

  select * into v_auth_user from auth.users where id = v_user_id;
  if v_auth_user.id is null then
    raise exception 'Usuario auth nao encontrado' using errcode = 'P0002';
  end if;

  v_email := lower(trim(coalesce(v_auth_user.email, '')));
  if v_email = '' then
    raise exception 'E-mail auth obrigatorio' using errcode = '23502';
  end if;

  v_name := trim(coalesce(
    nullif(p_name, ''),
    nullif(v_auth_user.raw_user_meta_data->>'owner_name', ''),
    nullif(v_auth_user.raw_user_meta_data->>'name', ''),
    nullif(v_auth_user.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(v_email, '@', 1), ''),
    'Usuario'
  ));

  v_business := trim(coalesce(
    nullif(p_business_name, ''),
    nullif(v_auth_user.raw_user_meta_data->>'company_name', ''),
    nullif(v_auth_user.raw_user_meta_data->>'business_name', ''),
    nullif(v_auth_user.raw_user_meta_data->>'company', ''),
    nullif(v_auth_user.raw_user_meta_data->>'negocio', ''),
    nullif(v_name, ''),
    'Minha empresa 3D'
  ));

  v_phone := nullif(trim(coalesce(p_phone, v_auth_user.raw_user_meta_data->>'phone', v_auth_user.phone, '')), '');
  v_cnpj := nullif(regexp_replace(coalesce(v_auth_user.raw_user_meta_data->>'cnpj', ''), '\D', '', 'g'), '');

  select ep.role into v_existing_erp_role from public.erp_profiles ep where ep.id = v_user_id;
  if v_existing_erp_role = 'superadmin' or exists (select 1 from public.superadmins where user_id = v_user_id and status = 'active') then
    v_profile_role := 'superadmin';
  end if;

  select coalesce(
    (select p.client_id from public.profiles p where p.user_id = v_user_id and p.client_id is not null limit 1),
    (select ep.client_id from public.erp_profiles ep where ep.id = v_user_id and ep.client_id is not null limit 1),
    (select c.id from public.clients c where lower(c.email) = v_email limit 1)
  ) into v_client_id;

  select coalesce(
    (select p.company_id from public.profiles p where p.user_id = v_user_id and p.company_id is not null limit 1),
    (select ep.company_id from public.erp_profiles ep where ep.id = v_user_id and ep.company_id is not null limit 1),
    (select c.company_id from public.clients c where c.id = v_client_id and c.company_id is not null limit 1),
    (select cm.company_id from public.company_members cm where cm.user_id = v_user_id and cm.status = 'active' order by case when cm.role = 'admin' then 0 else 1 end, cm.created_at asc limit 1)
  ) into v_company_id;

  select * into v_plan from public.plans where slug = 'premium_trial' and active = true limit 1;
  if v_plan.id is null then
    select * into v_plan from public.plans where slug = 'free' limit 1;
  end if;
  v_end := case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_start + interval '7 days' else null end;

  if v_company_id is null then
    insert into public.companies (owner_user_id, name, phone, cnpj, status, setup_completed)
    values (null, v_business, v_phone, v_cnpj, 'active', false)
    returning id into v_company_id;
  end if;

  if v_client_id is null then
    insert into public.clients (
      client_code, company_id, name, responsible_name, nome_responsavel,
      email, phone, cnpj, status, plano_atual, status_assinatura, active_plan,
      subscription_status, trial_started_at, trial_expires_at, is_trial_active,
      criado_em, last_access_at
    )
    values (
      public.next_s3d_client_code(), v_company_id, v_business, v_name, v_name,
      v_email, v_phone, v_cnpj, 'active', coalesce(v_plan.slug, 'free'),
      case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
      coalesce(v_plan.slug, 'free'),
      case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'free' end,
      case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_start else null end,
      case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_end else null end,
      coalesce(v_plan.slug, 'free') = 'premium_trial',
      now(), now()
    )
    on conflict ((lower(email))) do update
      set company_id = coalesce(public.clients.company_id, excluded.company_id),
          name = coalesce(nullif(public.clients.name, ''), excluded.name),
          responsible_name = coalesce(nullif(public.clients.responsible_name, ''), excluded.responsible_name),
          nome_responsavel = coalesce(nullif(public.clients.nome_responsavel, ''), excluded.nome_responsavel),
          phone = coalesce(public.clients.phone, excluded.phone),
          cnpj = coalesce(public.clients.cnpj, excluded.cnpj),
          status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
          last_access_at = now(),
          updated_at = now()
    returning id, client_code, company_id into v_client_id, v_client_code, v_company_id;
  else
    update public.clients
    set company_id = coalesce(company_id, v_company_id),
        name = coalesce(nullif(name, ''), v_business),
        responsible_name = coalesce(nullif(responsible_name, ''), v_name),
        nome_responsavel = coalesce(nullif(nome_responsavel, ''), v_name),
        phone = coalesce(phone, v_phone),
        cnpj = coalesce(cnpj, v_cnpj),
        last_access_at = now(),
        updated_at = now()
    where id = v_client_id
    returning client_code, company_id into v_client_code, v_company_id;
  end if;

  insert into public.company_members (company_id, user_id, role, status)
  values (v_company_id, v_user_id, 'user', 'active')
  on conflict (company_id, user_id) do update
    set role = case when public.company_members.role = 'admin' then 'admin' else 'user' end,
        status = 'active',
        updated_at = now();

  insert into public.profiles (
    user_id, client_id, company_id, name, email, phone, role, status,
    accepted_terms_at, onboarding_completed, onboarding_step
  )
  values (v_user_id, v_client_id, v_company_id, v_name, v_email, v_phone, v_profile_role, 'active', now(), false, 0)
  on conflict (user_id) do update
    set client_id = excluded.client_id,
        company_id = coalesce(public.profiles.company_id, excluded.company_id),
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        email = excluded.email,
        phone = coalesce(public.profiles.phone, excluded.phone),
        role = case when public.profiles.role = 'superadmin' then 'superadmin' else coalesce(nullif(public.profiles.role, ''), excluded.role) end,
        status = 'active',
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = now();

  insert into public.erp_profiles (
    id, email, display_name, phone, role, status, client_id, company_id,
    accepted_terms_at, last_login_at, onboarding_completed, onboarding_step
  )
  values (v_user_id, v_email, v_name, v_phone, v_profile_role, 'active', v_client_id, v_company_id, now(), now(), false, 0)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(public.erp_profiles.display_name, ''), excluded.display_name),
        phone = coalesce(public.erp_profiles.phone, excluded.phone),
        role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else coalesce(nullif(public.erp_profiles.role, ''), excluded.role) end,
        status = 'active',
        client_id = coalesce(public.erp_profiles.client_id, excluded.client_id),
        company_id = coalesce(public.erp_profiles.company_id, excluded.company_id),
        accepted_terms_at = coalesce(public.erp_profiles.accepted_terms_at, excluded.accepted_terms_at),
        last_login_at = now();

  insert into public.subscriptions (
    client_id, company_id, user_id, plan_id, status, status_assinatura, active_plan,
    subscription_status, promo_used, billing_variant, started_at, expires_at,
    next_billing_at, proximo_vencimento, current_period_start, current_period_end,
    trial_started_at, trial_expires_at, is_trial_active
  )
  values (
    v_client_id, v_company_id, v_user_id, v_plan.id,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    coalesce(v_plan.slug, 'free'),
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'free' end,
    false, 'premium_first_month', v_start, v_end, v_end, v_end, v_start, v_end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_start else null end,
    case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_end else null end,
    coalesce(v_plan.slug, 'free') = 'premium_trial'
  )
  on conflict (client_id) do update
    set company_id = coalesce(public.subscriptions.company_id, excluded.company_id),
        user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
        updated_at = now()
  returning id into v_subscription_id;

  insert into public.sync_settings (user_id, company_id, status, settings)
  values (v_user_id, v_company_id, 'idle', jsonb_build_object('auto_sync', true))
  on conflict (user_id) do update
    set company_id = coalesce(public.sync_settings.company_id, excluded.company_id),
        settings = public.sync_settings.settings || excluded.settings,
        updated_at = now();

  insert into public.audit_logs (user_id, client_id, action, details)
  values (
    v_user_id,
    v_client_id,
    'sincronizacao pos-login',
    jsonb_build_object('source', 'sync_saas_user_after_login', 'client_code', v_client_code, 'company_id', v_company_id, 'member_role', 'user')
  );

  perform public.s3d_cleanup_subscription_state();

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'client_id', v_client_id,
    'company_id', v_company_id,
    'client_code', v_client_code,
    'subscription_id', v_subscription_id,
    'active_plan', coalesce(v_plan.slug, 'free'),
    'plan_slug', coalesce(v_plan.slug, 'free'),
    'status', case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
    'erp_profile_id', v_user_id,
    'member_role', 'user'
  );
exception
  when others then
    raise exception 'sync_saas_user_after_login falhou: %', sqlerrm
      using errcode = 'P0001';
end;
$$;

revoke execute on function public.sync_saas_user_after_login(text, text, text) from public, anon;
grant execute on function public.sync_saas_user_after_login(text, text, text) to authenticated, service_role;

create or replace function public.get_saas_license()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid := public.erp_current_client_id();
  v_sub record;
  v_full_access boolean := false;
  v_show_ads boolean := true;
  v_pending_warning text := null;
begin
  perform public.s3d_cleanup_subscription_state();

  if public.erp_is_superadmin() then
    return jsonb_build_object(
      'status', 'active',
      'block_level', 'none',
      'active_plan', 'premium',
      'plan_slug', 'premium',
      'plan', 'Super Admin',
      'has_full_access', true,
      'show_ads', false
    );
  end if;

  if v_client_id is null then
    return jsonb_build_object(
      'status', 'active',
      'block_level', 'none',
      'active_plan', 'free',
      'plan_slug', 'free',
      'plan', 'Free',
      'has_full_access', false,
      'show_ads', true,
      'message', 'Cliente nao vinculado'
    );
  end if;

  select
    s.*,
    c.client_code,
    c.email as client_email,
    c.status as client_status,
    p.name as plan_name,
    p.slug as plan_slug,
    p.max_users,
    p.max_orders,
    p.max_clients,
    p.max_calculator_uses,
    p.allow_pdf,
    p.allow_reports,
    p.allow_permissions,
    p.kind
  into v_sub
  from public.subscriptions s
  left join public.clients c on c.id = s.client_id
  left join public.plans p on p.slug = s.active_plan
  where s.client_id = v_client_id
  order by s.created_at desc
  limit 1;

  if v_sub.id is null then
    return jsonb_build_object(
      'client_id', v_client_id,
      'status', 'active',
      'block_level', 'none',
      'active_plan', 'free',
      'plan_slug', 'free',
      'plan', 'Free',
      'has_full_access', false,
      'show_ads', true
    );
  end if;

  if v_sub.payment_status = 'pending' and v_sub.pending_plan is not null then
    v_pending_warning := 'Pagamento pendente. O plano atual continua ativo ate a confirmacao.';
  end if;

  v_full_access := (
    (v_sub.active_plan = 'premium' and v_sub.subscription_status = 'active')
    or (v_sub.active_plan = 'premium_trial' and v_sub.subscription_status = 'trialing' and coalesce(v_sub.trial_expires_at, v_sub.plan_expires_at, v_sub.current_period_end) >= now())
  );
  v_show_ads := not v_full_access;

  return jsonb_build_object(
    'client_id', v_client_id,
    'company_id', v_sub.company_id,
    'user_id', v_sub.user_id,
    'clienteId', v_sub.client_code,
    'client_code', v_sub.client_code,
    'subscription_id', v_sub.id,
    'mercado_pago_subscription_id', v_sub.mercado_pago_subscription_id,
    'status', case when v_sub.active_plan = 'free' then 'active' else v_sub.status end,
    'subscription_status', v_sub.subscription_status,
    'payment_status', v_sub.payment_status,
    'block_level', case when v_sub.client_status = 'blocked' then 'total' else 'none' end,
    'active_plan', v_sub.active_plan,
    'pending_plan', v_sub.pending_plan,
    'pending_warning', v_pending_warning,
    'plan', coalesce(v_sub.plan_name, 'Free'),
    'plan_slug', v_sub.active_plan,
    'plan_price', v_sub.plan_price,
    'price_locked', coalesce(v_sub.price_locked, false),
    'current_paid_price', public.s3d_current_paid_price(),
    'has_full_access', v_full_access,
    'show_ads', v_show_ads,
    'is_trial_active', coalesce(v_sub.is_trial_active, false),
    'trial_started_at', v_sub.trial_started_at,
    'trial_expires_at', v_sub.trial_expires_at,
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
    'expires_at', coalesce(v_sub.plan_expires_at, v_sub.current_period_end, v_sub.expires_at),
    'current_period_start', v_sub.current_period_start,
    'current_period_end', coalesce(v_sub.plan_expires_at, v_sub.current_period_end),
    'next_billing_at', coalesce(v_sub.next_billing_at, v_sub.proximo_vencimento)
  );
end;
$$;

revoke execute on function public.get_saas_license() from public, anon;
grant execute on function public.get_saas_license() to authenticated, service_role;

do $$
declare
  v_clients bigint;
  v_subscriptions bigint;
  v_suggestions bigint;
begin
  select count(*) into v_clients from public.clients;
  select count(*) into v_subscriptions from public.subscriptions;
  select count(*) into v_suggestions from public.app_suggestions;
  raise notice 'Simplifica 3D definitive plans migration: clients=%, subscriptions=%, suggestions=%',
    v_clients, v_subscriptions, v_suggestions;
end $$;
