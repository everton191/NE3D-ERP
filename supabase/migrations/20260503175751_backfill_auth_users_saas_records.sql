-- Simplifica 3D: idempotent SaaS backfill for existing Auth users.
-- Completes clients, profiles, erp_profiles and subscriptions for auth.users
-- that were created before the SaaS trigger/RPC flow was stabilized.

create extension if not exists pgcrypto;

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
    'Simplifica 3D SaaS backfill BEFORE: auth.users=%, clients=%, profiles=%, erp_profiles=%, subscriptions=%',
    v_auth_users, v_clients, v_profiles, v_erp_profiles, v_subscriptions;
end $$;

create temp table s3d_backfill_auth_users on commit drop as
select distinct on (lower(trim(u.email)))
  u.id as user_id,
  lower(trim(u.email)) as email,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(split_part(u.email, '@', 1)), ''),
    'Usuario'
  ) as display_name,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'business_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'company'), ''),
    nullif(trim(u.raw_user_meta_data->>'negocio'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(trim(split_part(u.email, '@', 1)), ''),
    'Minha empresa 3D'
  ) as business_name,
  nullif(trim(coalesce(u.raw_user_meta_data->>'phone', u.phone, '')), '') as phone,
  u.created_at as auth_created_at,
  null::uuid as client_id
from auth.users u
where u.email is not null
  and trim(u.email) <> ''
order by lower(trim(u.email)), u.created_at asc;

with default_plan as (
  select id, slug
  from (
    select id, slug, 1 as priority
    from public.plans
    where slug = 'premium_trial'
      and active = true
    union all
    select id, slug, 2 as priority
    from public.plans
    where slug = 'free'
  ) plans_priority
  order by priority
  limit 1
)
insert into public.clients (
  client_code,
  name,
  responsible_name,
  nome_responsavel,
  email,
  phone,
  status,
  plano_atual,
  status_assinatura,
  criado_em,
  last_access_at,
  created_at,
  updated_at
)
select
  public.next_s3d_client_code(),
  b.business_name,
  b.display_name,
  b.display_name,
  b.email,
  b.phone,
  'active',
  coalesce(dp.slug, 'free'),
  case when coalesce(dp.slug, 'free') = 'premium_trial' then 'trialing' else 'active' end,
  coalesce(b.auth_created_at, now()),
  coalesce(b.auth_created_at, now()),
  coalesce(b.auth_created_at, now()),
  now()
from s3d_backfill_auth_users b
cross join default_plan dp
where not exists (
    select 1
    from public.clients c
    where lower(c.email) = b.email
  )
  and not exists (
    select 1
    from public.profiles p
    where p.user_id = b.user_id
      and p.client_id is not null
  )
  and not exists (
    select 1
    from public.erp_profiles ep
    where ep.id = b.user_id
      and ep.client_id is not null
  );

update public.clients
set client_code = public.next_s3d_client_code(),
    updated_at = now()
where client_code is null
   or trim(client_code) = '';

update s3d_backfill_auth_users b
set client_id = coalesce(
  (select p.client_id from public.profiles p where p.user_id = b.user_id and p.client_id is not null limit 1),
  (select ep.client_id from public.erp_profiles ep where ep.id = b.user_id and ep.client_id is not null limit 1),
  (select c.id from public.clients c where lower(c.email) = b.email limit 1)
);

insert into public.profiles (
  user_id,
  client_id,
  name,
  email,
  role,
  status,
  accepted_terms_at,
  created_at,
  updated_at
)
select
  b.user_id,
  b.client_id,
  b.display_name,
  b.email,
  'admin',
  'active',
  null,
  coalesce(b.auth_created_at, now()),
  now()
from s3d_backfill_auth_users b
where b.client_id is not null
on conflict (user_id) do update
set client_id = coalesce(public.profiles.client_id, excluded.client_id),
    name = coalesce(nullif(public.profiles.name, ''), excluded.name),
    email = coalesce(nullif(public.profiles.email, ''), excluded.email),
    status = coalesce(nullif(public.profiles.status, ''), 'active'),
    updated_at = now();

insert into public.erp_profiles (
  id,
  email,
  display_name,
  role,
  status,
  client_id,
  accepted_terms_at,
  last_login_at
)
select
  b.user_id,
  b.email,
  b.display_name,
  'admin',
  'active',
  b.client_id,
  null,
  coalesce(b.auth_created_at, now())
from s3d_backfill_auth_users b
where b.client_id is not null
on conflict (id) do update
set client_id = coalesce(public.erp_profiles.client_id, excluded.client_id),
    email = coalesce(nullif(public.erp_profiles.email, ''), excluded.email),
    display_name = coalesce(nullif(public.erp_profiles.display_name, ''), excluded.display_name),
    role = case when public.erp_profiles.role = 'superadmin' then 'superadmin' else public.erp_profiles.role end,
    status = coalesce(nullif(public.erp_profiles.status, ''), 'active'),
    last_login_at = coalesce(public.erp_profiles.last_login_at, excluded.last_login_at);

with default_plan as (
  select id, slug
  from (
    select id, slug, 1 as priority
    from public.plans
    where slug = 'premium_trial'
      and active = true
    union all
    select id, slug, 2 as priority
    from public.plans
    where slug = 'free'
  ) plans_priority
  order by priority
  limit 1
),
subscription_defaults as (
  select
    b.user_id,
    b.client_id,
    dp.id as plan_id,
    dp.slug as plan_slug,
    coalesce(b.auth_created_at, now()) as period_start,
    case when dp.slug = 'premium_trial' then coalesce(b.auth_created_at, now()) + interval '7 days' else null end as period_end,
    case when dp.slug = 'premium_trial' then 'trialing' else 'active' end as default_status
  from s3d_backfill_auth_users b
  cross join default_plan dp
  where b.client_id is not null
)
insert into public.subscriptions (
  client_id,
  user_id,
  plan_id,
  status,
  status_assinatura,
  promo_used,
  billing_variant,
  started_at,
  expires_at,
  next_billing_at,
  proximo_vencimento,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
select
  sd.client_id,
  sd.user_id,
  sd.plan_id,
  sd.default_status,
  sd.default_status,
  false,
  'premium_first_month',
  sd.period_start,
  sd.period_end,
  sd.period_end,
  sd.period_end,
  sd.period_start,
  sd.period_end,
  sd.period_start,
  now()
from subscription_defaults sd
on conflict (client_id) do update
set user_id = coalesce(public.subscriptions.user_id, excluded.user_id),
    plan_id = coalesce(public.subscriptions.plan_id, excluded.plan_id),
    status = coalesce(nullif(public.subscriptions.status, ''), excluded.status),
    status_assinatura = coalesce(nullif(public.subscriptions.status_assinatura, ''), excluded.status_assinatura),
    promo_used = coalesce(public.subscriptions.promo_used, false),
    billing_variant = coalesce(
      nullif(public.subscriptions.billing_variant, ''),
      case when coalesce(public.subscriptions.promo_used, false) then 'premium_monthly' else excluded.billing_variant end
    ),
    current_period_start = coalesce(public.subscriptions.current_period_start, excluded.current_period_start),
    current_period_end = coalesce(public.subscriptions.current_period_end, excluded.current_period_end),
    expires_at = coalesce(public.subscriptions.expires_at, excluded.expires_at),
    next_billing_at = coalesce(public.subscriptions.next_billing_at, excluded.next_billing_at),
    proximo_vencimento = coalesce(public.subscriptions.proximo_vencimento, excluded.proximo_vencimento),
    updated_at = now();

update public.clients c
set plano_atual = coalesce(nullif(c.plano_atual, ''), p.slug, 'free'),
    status_assinatura = coalesce(nullif(c.status_assinatura, ''), s.status, 'active'),
    updated_at = now()
from public.subscriptions s
left join public.plans p on p.id = s.plan_id
where s.client_id = c.id
  and (
    c.plano_atual is null
    or trim(c.plano_atual) = ''
    or c.status_assinatura is null
    or trim(c.status_assinatura) = ''
  );

insert into public.audit_logs (user_id, client_id, action, details)
select
  b.user_id,
  b.client_id,
  'backfill usuários auth SaaS',
  jsonb_build_object('source', '20260503175751_backfill_auth_users_saas_records')
from s3d_backfill_auth_users b
where b.client_id is not null
  and not exists (
    select 1
    from public.audit_logs al
    where al.user_id = b.user_id
      and al.client_id = b.client_id
      and al.action = 'backfill usuários auth SaaS'
  );

do $$
declare
  v_auth_users bigint;
  v_clients bigint;
  v_profiles bigint;
  v_erp_profiles bigint;
  v_subscriptions bigint;
  v_missing_clients bigint;
  v_missing_profiles bigint;
  v_missing_erp_profiles bigint;
  v_missing_subscriptions bigint;
begin
  select count(*) into v_auth_users from auth.users where email is not null and trim(email) <> '';
  select count(*) into v_clients from public.clients;
  select count(*) into v_profiles from public.profiles;
  select count(*) into v_erp_profiles from public.erp_profiles;
  select count(*) into v_subscriptions from public.subscriptions;

  select count(*) into v_missing_clients
  from auth.users u
  where u.email is not null
    and trim(u.email) <> ''
    and not exists (select 1 from public.clients c where lower(c.email) = lower(trim(u.email)))
    and not exists (select 1 from public.profiles p where p.user_id = u.id and p.client_id is not null)
    and not exists (select 1 from public.erp_profiles ep where ep.id = u.id and ep.client_id is not null);

  select count(*) into v_missing_profiles
  from auth.users u
  where u.email is not null
    and trim(u.email) <> ''
    and not exists (select 1 from public.profiles p where p.user_id = u.id);

  select count(*) into v_missing_erp_profiles
  from auth.users u
  where u.email is not null
    and trim(u.email) <> ''
    and not exists (select 1 from public.erp_profiles ep where ep.id = u.id);

  select count(*) into v_missing_subscriptions
  from auth.users u
  where u.email is not null
    and trim(u.email) <> ''
    and not exists (
      select 1
      from public.profiles p
      join public.subscriptions s on s.client_id = p.client_id
      where p.user_id = u.id
    )
    and not exists (
      select 1
      from public.erp_profiles ep
      join public.subscriptions s on s.client_id = ep.client_id
      where ep.id = u.id
    );

  raise notice
    'Simplifica 3D SaaS backfill AFTER: auth.users=%, clients=%, profiles=%, erp_profiles=%, subscriptions=%, missing_clients=%, missing_profiles=%, missing_erp_profiles=%, missing_subscriptions=%',
    v_auth_users, v_clients, v_profiles, v_erp_profiles, v_subscriptions,
    v_missing_clients, v_missing_profiles, v_missing_erp_profiles, v_missing_subscriptions;
end $$;
