-- Simplifica 3D: repair post-login SaaS synchronization and erp_profiles RLS.
-- Safe/idempotent migration. It preserves existing users, clients, profiles,
-- erp_profiles, subscriptions and only fills missing links.

create extension if not exists pgcrypto;

drop policy if exists "profiles_select_own_or_superadmin" on public.erp_profiles;
create policy "profiles_select_own_or_superadmin"
on public.erp_profiles for select
to authenticated
using (id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "profiles_insert_own_user" on public.erp_profiles;
create policy "profiles_insert_own_user"
on public.erp_profiles for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('user', 'admin', 'operador', 'visualizador')
  and client_id is null
);

drop policy if exists "profiles_update_own_user" on public.erp_profiles;
create policy "profiles_update_own_user"
on public.erp_profiles for update
to authenticated
using (
  id = auth.uid()
  and role in ('user', 'admin', 'operador', 'visualizador')
)
with check (
  id = auth.uid()
  and role in ('user', 'admin', 'operador', 'visualizador')
  and (
    client_id is null
    or client_id = public.erp_current_client_id()
  )
);

drop policy if exists "profiles_superadmin_all" on public.erp_profiles;
create policy "profiles_superadmin_all"
on public.erp_profiles for all
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

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
  v_client_id uuid;
  v_client_code text;
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
    nullif(v_auth_user.raw_user_meta_data->>'name', ''),
    nullif(v_auth_user.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(v_email, '@', 1), ''),
    'Usuario'
  ));

  v_business := trim(coalesce(
    nullif(p_business_name, ''),
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

  if v_client_id is null then
    insert into public.clients (
      client_code, name, responsible_name, nome_responsavel, email, phone,
      status, plano_atual, status_assinatura, criado_em, last_access_at
    )
    values (
      public.next_s3d_client_code(), v_business, v_name, v_name, v_email, v_phone,
      'active', coalesce(v_plan.slug, 'free'), v_subscription_status, now(), now()
    )
    on conflict ((lower(email))) do update
      set name = coalesce(nullif(public.clients.name, ''), excluded.name),
          responsible_name = coalesce(nullif(public.clients.responsible_name, ''), excluded.responsible_name),
          nome_responsavel = coalesce(nullif(public.clients.nome_responsavel, ''), excluded.nome_responsavel),
          phone = coalesce(public.clients.phone, excluded.phone),
          status = case when public.clients.status in ('cancelled', 'inactive') then 'active' else public.clients.status end,
          updated_at = now()
    returning id, client_code into v_client_id, v_client_code;
  else
    update public.clients
    set name = coalesce(nullif(name, ''), v_business),
        responsible_name = coalesce(nullif(responsible_name, ''), v_name),
        nome_responsavel = coalesce(nullif(nome_responsavel, ''), v_name),
        phone = coalesce(phone, v_phone),
        last_access_at = now(),
        updated_at = now()
    where id = v_client_id
    returning client_code into v_client_code;
  end if;

  if v_client_id is null then
    raise exception 'Cliente SaaS nao criado para usuario %', v_user_id
      using errcode = 'P0001';
  end if;

  insert into public.profiles (user_id, client_id, name, email, role, status, accepted_terms_at)
  values (v_user_id, v_client_id, v_name, v_email, v_profile_role, 'active', now())
  on conflict (user_id) do update
    set client_id = excluded.client_id,
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        email = excluded.email,
        role = case when public.profiles.role = 'superadmin' then 'superadmin' else coalesce(nullif(public.profiles.role, ''), excluded.role) end,
        status = 'active',
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = now();

  insert into public.erp_profiles (
    id, email, display_name, phone, role, status, client_id, accepted_terms_at, last_login_at
  )
  values (
    v_user_id, v_email, v_name, v_phone, v_profile_role, 'active', v_client_id, now(), now()
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(public.erp_profiles.display_name, ''), excluded.display_name),
        phone = coalesce(public.erp_profiles.phone, excluded.phone),
        role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else coalesce(nullif(public.erp_profiles.role, ''), excluded.role) end,
        status = 'active',
        client_id = coalesce(public.erp_profiles.client_id, excluded.client_id),
        accepted_terms_at = coalesce(public.erp_profiles.accepted_terms_at, excluded.accepted_terms_at),
        last_login_at = now();

  if v_plan.id is not null then
    insert into public.subscriptions (
      client_id, user_id, plan_id, status, status_assinatura, promo_used, billing_variant,
      started_at, expires_at, next_billing_at, proximo_vencimento, current_period_start, current_period_end
    )
    values (
      v_client_id, v_user_id, v_plan.id, v_subscription_status, v_subscription_status, false, 'premium_first_month',
      v_start, v_end, v_end, v_end, v_start, v_end
    )
    on conflict (client_id) do update
      set user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
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

  insert into public.audit_logs (user_id, client_id, action, details)
  values (
    v_user_id,
    v_client_id,
    'sincronização pós-login',
    jsonb_build_object('source', 'sync_saas_user_after_login', 'client_code', v_client_code)
  );

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'client_id', v_client_id,
    'client_code', v_client_code,
    'subscription_id', v_subscription_id,
    'plan_slug', coalesce(v_plan.slug, 'free'),
    'status', coalesce(v_subscription_status, 'active'),
    'erp_profile_id', v_user_id
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
  v_profiles bigint;
  v_erp_profiles bigint;
  v_subscriptions bigint;
begin
  select count(*) into v_auth_users from auth.users where email is not null and trim(email) <> '';
  select count(*) into v_clients from public.clients;
  select count(*) into v_profiles from public.profiles;
  select count(*) into v_erp_profiles from public.erp_profiles;
  select count(*) into v_subscriptions from public.subscriptions;

  raise notice
    'Simplifica 3D post-login sync migration: auth.users=%, clients=%, profiles=%, erp_profiles=%, subscriptions=%',
    v_auth_users, v_clients, v_profiles, v_erp_profiles, v_subscriptions;
end $$;
