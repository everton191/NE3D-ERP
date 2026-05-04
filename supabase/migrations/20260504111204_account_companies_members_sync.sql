-- Simplifica 3D: account/company structure for automatic SaaS signup.
-- Idempotent migration. It adds companies, company members and completes
-- post-login/signup sync without changing the simplified plan rules.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null default 'Minha empresa 3D',
  phone text,
  cnpj text,
  status text not null default 'active',
  setup_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_status_check check (status in ('active', 'blocked', 'inactive', 'cancelled'))
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_members_role_check check (
    role in ('owner', 'admin', 'attendant', 'production', 'finance', 'read_only')
  ),
  constraint company_members_status_check check (status in ('active', 'inactive', 'blocked'))
);

create unique index if not exists company_members_company_user_unique_idx
  on public.company_members(company_id, user_id);
create index if not exists companies_owner_user_id_idx on public.companies(owner_user_id);
create index if not exists companies_status_idx on public.companies(status);
create index if not exists company_members_user_idx on public.company_members(user_id, status);
create index if not exists company_members_company_idx on public.company_members(company_id, status);

alter table public.clients
  add column if not exists company_id uuid,
  add column if not exists cnpj text;

alter table public.profiles
  add column if not exists company_id uuid,
  add column if not exists phone text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 0;

alter table public.erp_profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 0;

alter table public.subscriptions
  add column if not exists company_id uuid;

create table if not exists public.sync_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  status text not null default 'idle',
  last_sync_at timestamptz,
  last_error text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sync_settings_status_check check (status in ('idle', 'synced', 'saving', 'offline', 'error'))
);

create unique index if not exists sync_settings_user_unique_idx on public.sync_settings(user_id);
create index if not exists sync_settings_company_idx on public.sync_settings(company_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_company_id_fkey'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_company_id_fkey
      foreign key (company_id) references public.companies(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_company_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_company_id_fkey
      foreign key (company_id) references public.companies(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'erp_profiles_company_id_fkey'
      and conrelid = 'public.erp_profiles'::regclass
  ) then
    alter table public.erp_profiles
      add constraint erp_profiles_company_id_fkey
      foreign key (company_id) references public.companies(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_company_id_fkey'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_company_id_fkey
      foreign key (company_id) references public.companies(id) on delete set null;
  end if;
end $$;

create index if not exists clients_company_id_idx on public.clients(company_id);
create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists erp_profiles_company_id_idx on public.erp_profiles(company_id);
create index if not exists subscriptions_company_id_idx on public.subscriptions(company_id);

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_company_members_updated_at on public.company_members;
create trigger set_company_members_updated_at
before update on public.company_members
for each row execute function public.set_updated_at();

drop trigger if exists set_sync_settings_updated_at on public.sync_settings;
create trigger set_sync_settings_updated_at
before update on public.sync_settings
for each row execute function public.set_updated_at();

create or replace function public.s3d_is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_company_id is not null
    and exists (
      select 1
      from public.company_members cm
      where cm.company_id = p_company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    );
$$;

create or replace function public.s3d_is_company_owner(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_company_id is not null
    and (
      exists (
        select 1
        from public.companies c
        where c.id = p_company_id
          and c.owner_user_id = auth.uid()
          and c.status <> 'cancelled'
      )
      or exists (
        select 1
        from public.company_members cm
        where cm.company_id = p_company_id
          and cm.user_id = auth.uid()
          and cm.role = 'owner'
          and cm.status = 'active'
      )
    );
$$;

create or replace function public.s3d_current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.company_id from public.profiles p where p.user_id = auth.uid() and p.company_id is not null limit 1),
    (select ep.company_id from public.erp_profiles ep where ep.id = auth.uid() and ep.company_id is not null limit 1),
    (select cm.company_id from public.company_members cm where cm.user_id = auth.uid() and cm.status = 'active' order by case when cm.role = 'owner' then 0 else 1 end, cm.created_at asc limit 1)
  );
$$;

revoke execute on function public.s3d_is_company_member(uuid) from public, anon;
revoke execute on function public.s3d_is_company_owner(uuid) from public, anon;
revoke execute on function public.s3d_current_company_id() from public, anon;
grant execute on function public.s3d_is_company_member(uuid) to authenticated, service_role;
grant execute on function public.s3d_is_company_owner(uuid) to authenticated, service_role;
grant execute on function public.s3d_current_company_id() to authenticated, service_role;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.sync_settings enable row level security;

drop policy if exists "companies_select_member_or_superadmin" on public.companies;
create policy "companies_select_member_or_superadmin"
on public.companies for select
to authenticated
using (
  public.erp_is_superadmin()
  or owner_user_id = auth.uid()
  or public.s3d_is_company_member(id)
);

drop policy if exists "companies_insert_owner_or_superadmin" on public.companies;
create policy "companies_insert_owner_or_superadmin"
on public.companies for insert
to authenticated
with check (public.erp_is_superadmin() or owner_user_id = auth.uid());

drop policy if exists "companies_update_owner_or_superadmin" on public.companies;
create policy "companies_update_owner_or_superadmin"
on public.companies for update
to authenticated
using (public.erp_is_superadmin() or owner_user_id = auth.uid() or public.s3d_is_company_owner(id))
with check (public.erp_is_superadmin() or owner_user_id = auth.uid() or public.s3d_is_company_owner(id));

drop policy if exists "companies_delete_superadmin" on public.companies;
create policy "companies_delete_superadmin"
on public.companies for delete
to authenticated
using (public.erp_is_superadmin());

drop policy if exists "company_members_select_company_or_superadmin" on public.company_members;
create policy "company_members_select_company_or_superadmin"
on public.company_members for select
to authenticated
using (
  public.erp_is_superadmin()
  or user_id = auth.uid()
  or public.s3d_is_company_member(company_id)
);

drop policy if exists "company_members_insert_owner_or_superadmin" on public.company_members;
create policy "company_members_insert_owner_or_superadmin"
on public.company_members for insert
to authenticated
with check (public.erp_is_superadmin() or public.s3d_is_company_owner(company_id));

drop policy if exists "company_members_update_owner_or_superadmin" on public.company_members;
create policy "company_members_update_owner_or_superadmin"
on public.company_members for update
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_owner(company_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_owner(company_id));

drop policy if exists "company_members_delete_owner_or_superadmin" on public.company_members;
create policy "company_members_delete_owner_or_superadmin"
on public.company_members for delete
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_owner(company_id));

drop policy if exists "sync_settings_select_own_or_superadmin" on public.sync_settings;
create policy "sync_settings_select_own_or_superadmin"
on public.sync_settings for select
to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "sync_settings_insert_own" on public.sync_settings;
create policy "sync_settings_insert_own"
on public.sync_settings for insert
to authenticated
with check (user_id = auth.uid() and (company_id is null or public.s3d_is_company_member(company_id)));

drop policy if exists "sync_settings_update_own_or_superadmin" on public.sync_settings;
create policy "sync_settings_update_own_or_superadmin"
on public.sync_settings for update
to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

do $$
declare
  r record;
  v_company_id uuid;
  v_owner_user_id uuid;
  v_company_name text;
  v_company_status text;
begin
  for r in select * from public.clients loop
    select coalesce(
      (select p.user_id from public.profiles p where p.client_id = r.id and p.role <> 'superadmin' order by p.created_at asc limit 1),
      (select s.user_id from public.subscriptions s where s.client_id = r.id and s.user_id is not null order by s.created_at asc limit 1),
      (select ep.id from public.erp_profiles ep where ep.client_id = r.id and ep.role <> 'superadmin' order by ep.created_at asc limit 1),
      (select au.id from auth.users au where lower(au.email) = lower(r.email) limit 1),
      (select p.user_id from public.profiles p where p.client_id = r.id order by p.created_at asc limit 1),
      (select ep.id from public.erp_profiles ep where ep.client_id = r.id order by ep.created_at asc limit 1)
    ) into v_owner_user_id;

    v_company_name := coalesce(nullif(r.name, ''), nullif(r.responsible_name, ''), 'Minha empresa 3D');
    v_company_status := case
      when r.status = 'blocked' then 'blocked'
      when r.status in ('inactive', 'cancelled') then r.status
      else 'active'
    end;

    if r.company_id is null then
      insert into public.companies (owner_user_id, name, phone, cnpj, status, setup_completed)
      values (v_owner_user_id, v_company_name, r.phone, r.cnpj, v_company_status, false)
      returning id into v_company_id;

      update public.clients
      set company_id = v_company_id,
          updated_at = now()
      where id = r.id;
    else
      v_company_id := r.company_id;

      update public.companies
      set owner_user_id = coalesce(owner_user_id, v_owner_user_id),
          name = coalesce(nullif(name, ''), v_company_name),
          phone = coalesce(phone, r.phone),
          cnpj = coalesce(cnpj, r.cnpj),
          status = case when status = 'active' and v_company_status = 'blocked' then 'blocked' else status end,
          updated_at = now()
      where id = v_company_id;
    end if;

    if v_company_id is not null and v_owner_user_id is not null then
      insert into public.company_members (company_id, user_id, role, status)
      values (v_company_id, v_owner_user_id, 'owner', 'active')
      on conflict (company_id, user_id) do update
        set role = 'owner',
            status = 'active',
            updated_at = now();
    end if;
  end loop;

  update public.profiles p
  set company_id = c.company_id,
      phone = coalesce(p.phone, c.phone),
      updated_at = now()
  from public.clients c
  where p.client_id = c.id
    and c.company_id is not null
    and (p.company_id is null or p.company_id <> c.company_id);

  update public.erp_profiles ep
  set company_id = c.company_id,
      updated_at = now()
  from public.clients c
  where ep.client_id = c.id
    and c.company_id is not null
    and (ep.company_id is null or ep.company_id <> c.company_id);

  update public.subscriptions s
  set company_id = c.company_id,
      updated_at = now()
  from public.clients c
  where s.client_id = c.id
    and c.company_id is not null
    and (s.company_id is null or s.company_id <> c.company_id);

  insert into public.company_members (company_id, user_id, role, status)
  select distinct
    p.company_id,
    p.user_id,
    case
      when c.owner_user_id = p.user_id then 'owner'
      when p.role = 'visualizador' then 'read_only'
      when p.role = 'operador' then 'production'
      else 'admin'
    end,
    case when p.status = 'blocked' then 'blocked' else 'active' end
  from public.profiles p
  join public.companies c on c.id = p.company_id
  where p.company_id is not null
    and p.user_id is not null
  on conflict (company_id, user_id) do update
    set role = case
          when public.company_members.role = 'owner' then 'owner'
          else excluded.role
        end,
        status = excluded.status,
        updated_at = now();

  insert into public.company_members (company_id, user_id, role, status)
  select distinct
    ep.company_id,
    ep.id,
    case
      when c.owner_user_id = ep.id then 'owner'
      when ep.role = 'visualizador' then 'read_only'
      when ep.role = 'operador' then 'production'
      else 'admin'
    end,
    case when ep.status = 'blocked' then 'blocked' else 'active' end
  from public.erp_profiles ep
  join public.companies c on c.id = ep.company_id
  where ep.company_id is not null
    and ep.id is not null
  on conflict (company_id, user_id) do update
    set role = case
          when public.company_members.role = 'owner' then 'owner'
          else excluded.role
        end,
        status = excluded.status,
        updated_at = now();

  insert into public.sync_settings (user_id, company_id, status, settings)
  select distinct
    p.user_id,
    p.company_id,
    'idle',
    jsonb_build_object('auto_sync', true, 'source', 'migration')
  from public.profiles p
  where p.user_id is not null
  on conflict (user_id) do update
    set company_id = coalesce(public.sync_settings.company_id, excluded.company_id),
        settings = public.sync_settings.settings || jsonb_build_object('auto_sync', true),
        updated_at = now();
end $$;

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
  v_trial_days integer := 7;
  v_status text;
  v_period_start timestamptz := now();
  v_period_end timestamptz;
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
    select * into v_plan
    from public.plans
    where slug = 'free'
    limit 1;
    v_trial_days := 0;
  end if;

  v_status := case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end;
  v_period_end := case when v_status = 'trialing' then v_period_start + make_interval(days => v_trial_days) else null end;

  select c.id, c.client_code, c.company_id
    into v_client_id, v_client_code, v_company_id
  from public.clients c
  where lower(c.email) = v_email
  limit 1;

  if v_company_id is null then
    insert into public.companies (owner_user_id, name, phone, cnpj, status, setup_completed)
    values (new.id, v_business, v_phone, v_cnpj, 'active', false)
    returning id into v_company_id;
  else
    update public.companies
    set owner_user_id = coalesce(owner_user_id, new.id),
        name = coalesce(nullif(name, ''), v_business),
        phone = coalesce(phone, v_phone),
        cnpj = coalesce(cnpj, v_cnpj),
        status = case when status in ('inactive', 'cancelled') then 'active' else status end,
        updated_at = now()
    where id = v_company_id;
  end if;

  insert into public.clients (
    client_code,
    company_id,
    name,
    responsible_name,
    nome_responsavel,
    email,
    phone,
    cnpj,
    status,
    plano_atual,
    status_assinatura,
    criado_em,
    last_access_at
  )
  values (
    public.next_s3d_client_code(),
    v_company_id,
    v_business,
    v_name,
    v_name,
    v_email,
    v_phone,
    v_cnpj,
    'active',
    coalesce(v_plan.slug, 'free'),
    v_status,
    now(),
    now()
  )
  on conflict ((lower(email))) do update
    set company_id = coalesce(public.clients.company_id, excluded.company_id),
        name = coalesce(nullif(excluded.name, ''), public.clients.name),
        responsible_name = coalesce(nullif(excluded.responsible_name, ''), public.clients.responsible_name),
        nome_responsavel = coalesce(nullif(excluded.nome_responsavel, ''), public.clients.nome_responsavel),
        phone = coalesce(excluded.phone, public.clients.phone),
        cnpj = coalesce(excluded.cnpj, public.clients.cnpj),
        status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
        updated_at = now()
  returning id, client_code, company_id into v_client_id, v_client_code, v_company_id;

  update public.companies
  set owner_user_id = coalesce(owner_user_id, new.id),
      updated_at = now()
  where id = v_company_id;

  insert into public.company_members (company_id, user_id, role, status)
  values (v_company_id, new.id, 'owner', 'active')
  on conflict (company_id, user_id) do update
    set role = 'owner',
        status = 'active',
        updated_at = now();

  insert into public.profiles (
    user_id, client_id, company_id, name, email, phone, role, status,
    accepted_terms_at, onboarding_completed, onboarding_step
  )
  values (
    new.id,
    v_client_id,
    v_company_id,
    v_name,
    v_email,
    v_phone,
    'admin',
    'active',
    case when lower(coalesce(new.raw_user_meta_data->>'accepted_terms', 'false')) = 'true' then now() else null end,
    false,
    0
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
    new.id,
    v_email,
    v_name,
    v_phone,
    'admin',
    'active',
    v_client_id,
    v_company_id,
    case when lower(coalesce(new.raw_user_meta_data->>'accepted_terms', 'false')) = 'true' then now() else null end,
    now(),
    false,
    0
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

  if v_client_id is not null and v_plan.id is not null then
    insert into public.subscriptions (
      client_id, company_id, user_id, plan_id, status, status_assinatura, promo_used,
      billing_variant, started_at, expires_at, next_billing_at, proximo_vencimento,
      current_period_start, current_period_end
    )
    values (
      v_client_id, v_company_id, new.id, v_plan.id, v_status, v_status, false,
      'premium_first_month', v_period_start, v_period_end, v_period_end, v_period_end,
      v_period_start, v_period_end
    )
    on conflict (client_id) do update
      set company_id = coalesce(public.subscriptions.company_id, excluded.company_id),
          user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
          plan_id = coalesce(public.subscriptions.plan_id, excluded.plan_id),
          status = case when public.subscriptions.status in ('cancelled', 'blocked') then excluded.status else public.subscriptions.status end,
          status_assinatura = case when public.subscriptions.status_assinatura in ('cancelado', 'bloqueado') then excluded.status_assinatura else public.subscriptions.status_assinatura end,
          promo_used = coalesce(public.subscriptions.promo_used, false),
          billing_variant = coalesce(public.subscriptions.billing_variant, excluded.billing_variant),
          current_period_start = coalesce(public.subscriptions.current_period_start, excluded.current_period_start),
          current_period_end = coalesce(public.subscriptions.current_period_end, excluded.current_period_end),
          expires_at = coalesce(public.subscriptions.expires_at, excluded.expires_at),
          next_billing_at = coalesce(public.subscriptions.next_billing_at, excluded.next_billing_at),
          proximo_vencimento = coalesce(public.subscriptions.proximo_vencimento, excluded.proximo_vencimento),
          updated_at = now()
    returning id into v_subscription_id;
  end if;

  insert into public.sync_settings (user_id, company_id, status, settings)
  values (new.id, v_company_id, 'idle', jsonb_build_object('auto_sync', true))
  on conflict (user_id) do update
    set company_id = coalesce(public.sync_settings.company_id, excluded.company_id),
        settings = public.sync_settings.settings || excluded.settings,
        updated_at = now();

  insert into public.audit_logs (user_id, client_id, action, details)
  values (
    new.id,
    v_client_id,
    'cadastro auth',
    jsonb_build_object(
      'source', 'handle_new_saas_auth_user',
      'client_code', v_client_code,
      'company_id', v_company_id,
      'subscription_id', v_subscription_id
    )
  );

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
  v_subscription_status text;
  v_start timestamptz := now();
  v_end timestamptz;
  v_existing_erp_role text;
  v_profile_role text;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado'
      using errcode = '28000';
  end if;

  select * into v_auth_user
  from auth.users
  where id = v_user_id;

  if v_auth_user.id is null then
    raise exception 'Usuario auth nao encontrado'
      using errcode = 'P0002';
  end if;

  v_email := lower(trim(coalesce(v_auth_user.email, '')));
  if v_email = '' then
    raise exception 'E-mail auth obrigatorio'
      using errcode = '23502';
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

  v_phone := nullif(trim(coalesce(
    p_phone,
    v_auth_user.raw_user_meta_data->>'phone',
    v_auth_user.phone,
    ''
  )), '');

  v_cnpj := nullif(regexp_replace(coalesce(v_auth_user.raw_user_meta_data->>'cnpj', ''), '\D', '', 'g'), '');

  select ep.role into v_existing_erp_role
  from public.erp_profiles ep
  where ep.id = v_user_id;

  v_profile_role := case
    when v_existing_erp_role = 'superadmin' then 'superadmin'
    else 'admin'
  end;

  select coalesce(
    (select p.client_id from public.profiles p where p.user_id = v_user_id and p.client_id is not null limit 1),
    (select ep.client_id from public.erp_profiles ep where ep.id = v_user_id and ep.client_id is not null limit 1),
    (select c.id from public.clients c where lower(c.email) = v_email limit 1)
  ) into v_client_id;

  select coalesce(
    (select p.company_id from public.profiles p where p.user_id = v_user_id and p.company_id is not null limit 1),
    (select ep.company_id from public.erp_profiles ep where ep.id = v_user_id and ep.company_id is not null limit 1),
    (select c.company_id from public.clients c where c.id = v_client_id and c.company_id is not null limit 1),
    (select cm.company_id from public.company_members cm where cm.user_id = v_user_id and cm.status = 'active' order by case when cm.role = 'owner' then 0 else 1 end, cm.created_at asc limit 1)
  ) into v_company_id;

  select * into v_plan
  from public.plans
  where slug = 'premium_trial'
    and active = true
  limit 1;

  if v_plan.id is null then
    select * into v_plan
    from public.plans
    where slug = 'free'
    limit 1;
  end if;

  v_end := case when coalesce(v_plan.slug, 'free') = 'premium_trial' then v_start + interval '7 days' else null end;
  v_subscription_status := case when coalesce(v_plan.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end;

  if v_company_id is null then
    insert into public.companies (owner_user_id, name, phone, cnpj, status, setup_completed)
    values (v_user_id, v_business, v_phone, v_cnpj, 'active', false)
    returning id into v_company_id;
  else
    update public.companies
    set owner_user_id = coalesce(owner_user_id, v_user_id),
        name = coalesce(nullif(name, ''), v_business),
        phone = coalesce(phone, v_phone),
        cnpj = coalesce(cnpj, v_cnpj),
        status = case when status in ('inactive', 'cancelled') then 'active' else status end,
        updated_at = now()
    where id = v_company_id;
  end if;

  if v_client_id is null then
    insert into public.clients (
      client_code, company_id, name, responsible_name, nome_responsavel,
      email, phone, cnpj, status, plano_atual, status_assinatura, criado_em, last_access_at
    )
    values (
      public.next_s3d_client_code(), v_company_id, v_business, v_name, v_name,
      v_email, v_phone, v_cnpj, 'active', coalesce(v_plan.slug, 'free'), v_subscription_status, now(), now()
    )
    on conflict ((lower(email))) do update
      set company_id = coalesce(public.clients.company_id, excluded.company_id),
          name = coalesce(nullif(public.clients.name, ''), excluded.name),
          responsible_name = coalesce(nullif(public.clients.responsible_name, ''), excluded.responsible_name),
          nome_responsavel = coalesce(nullif(public.clients.nome_responsavel, ''), excluded.nome_responsavel),
          phone = coalesce(public.clients.phone, excluded.phone),
          cnpj = coalesce(public.clients.cnpj, excluded.cnpj),
          status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
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

  if v_client_id is null then
    raise exception 'Cliente SaaS nao criado para usuario %', v_user_id
      using errcode = 'P0001';
  end if;

  update public.companies
  set owner_user_id = coalesce(owner_user_id, v_user_id),
      updated_at = now()
  where id = v_company_id;

  insert into public.company_members (company_id, user_id, role, status)
  values (v_company_id, v_user_id, 'owner', 'active')
  on conflict (company_id, user_id) do update
    set role = case when public.company_members.role = 'owner' then 'owner' else excluded.role end,
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

  if v_plan.id is not null then
    insert into public.subscriptions (
      client_id, company_id, user_id, plan_id, status, status_assinatura, promo_used,
      billing_variant, started_at, expires_at, next_billing_at, proximo_vencimento,
      current_period_start, current_period_end
    )
    values (
      v_client_id, v_company_id, v_user_id, v_plan.id, v_subscription_status, v_subscription_status, false,
      'premium_first_month', v_start, v_end, v_end, v_end, v_start, v_end
    )
    on conflict (client_id) do update
      set company_id = coalesce(public.subscriptions.company_id, excluded.company_id),
          user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
          plan_id = coalesce(public.subscriptions.plan_id, excluded.plan_id),
          status = coalesce(nullif(public.subscriptions.status, ''), excluded.status),
          status_assinatura = coalesce(nullif(public.subscriptions.status_assinatura, ''), excluded.status_assinatura),
          promo_used = coalesce(public.subscriptions.promo_used, false),
          billing_variant = coalesce(public.subscriptions.billing_variant, excluded.billing_variant),
          current_period_start = coalesce(public.subscriptions.current_period_start, excluded.current_period_start),
          current_period_end = coalesce(public.subscriptions.current_period_end, excluded.current_period_end),
          expires_at = coalesce(public.subscriptions.expires_at, excluded.expires_at),
          next_billing_at = coalesce(public.subscriptions.next_billing_at, excluded.next_billing_at),
          proximo_vencimento = coalesce(public.subscriptions.proximo_vencimento, excluded.proximo_vencimento),
          updated_at = now()
    returning id, status into v_subscription_id, v_subscription_status;
  end if;

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
    jsonb_build_object('source', 'sync_saas_user_after_login', 'client_code', v_client_code, 'company_id', v_company_id)
  );

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'client_id', v_client_id,
    'company_id', v_company_id,
    'client_code', v_client_code,
    'subscription_id', v_subscription_id,
    'plan_slug', coalesce(v_plan.slug, 'free'),
    'status', coalesce(v_subscription_status, 'active'),
    'erp_profile_id', v_user_id,
    'member_role', 'owner'
  );
exception
  when others then
    raise exception 'sync_saas_user_after_login falhou: %', sqlerrm
      using errcode = 'P0001';
end;
$$;

revoke execute on function public.sync_saas_user_after_login(text, text, text) from public, anon;
grant execute on function public.sync_saas_user_after_login(text, text, text) to authenticated;
grant execute on function public.sync_saas_user_after_login(text, text, text) to service_role;

do $$
declare
  v_auth_users bigint;
  v_clients bigint;
  v_companies bigint;
  v_company_members bigint;
  v_profiles bigint;
  v_erp_profiles bigint;
  v_subscriptions bigint;
  v_sync_settings bigint;
begin
  select count(*) into v_auth_users from auth.users where email is not null and trim(email) <> '';
  select count(*) into v_clients from public.clients;
  select count(*) into v_companies from public.companies;
  select count(*) into v_company_members from public.company_members;
  select count(*) into v_profiles from public.profiles;
  select count(*) into v_erp_profiles from public.erp_profiles;
  select count(*) into v_subscriptions from public.subscriptions;
  select count(*) into v_sync_settings from public.sync_settings;

  raise notice
    'Simplifica 3D account sync: auth.users=%, clients=%, companies=%, company_members=%, profiles=%, erp_profiles=%, subscriptions=%, sync_settings=%',
    v_auth_users, v_clients, v_companies, v_company_members, v_profiles, v_erp_profiles, v_subscriptions, v_sync_settings;
end $$;
