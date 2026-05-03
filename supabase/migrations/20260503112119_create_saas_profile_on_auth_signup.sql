-- Simplifica 3D: create SaaS profile rows immediately after Supabase Auth signup.
-- This fixes signups with e-mail confirmation enabled, where Auth creates the
-- user but does not return a session/JWT for the frontend to call RPCs.

create or replace function public.handle_new_saas_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(coalesce(new.email, '')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'Usuário'));
  v_business text := trim(coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), v_name, 'Minha empresa 3D'));
  v_phone text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_plan public.plans%rowtype;
  v_client_id uuid;
  v_client_code text;
  v_subscription_id uuid;
  v_trial_days integer := 7;
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
    last_access_at
  )
  values (
    public.next_s3d_client_code(),
    v_business,
    v_name,
    v_name,
    v_email,
    v_phone,
    'active',
    coalesce(v_plan.slug, 'free'),
    case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end,
    now(),
    now()
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
    new.id,
    v_client_id,
    v_name,
    v_email,
    'admin',
    'active',
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
    new.id,
    v_email,
    v_name,
    'admin',
    'active',
    v_client_id,
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
      client_id,
      plan_id,
      status,
      status_assinatura,
      started_at,
      expires_at,
      next_billing_at,
      proximo_vencimento
    )
    values (
      v_client_id,
      v_plan.id,
      case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end,
      case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then 'trialing' else 'active' end,
      now(),
      case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then now() + make_interval(days => v_trial_days) else null end,
      case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then now() + make_interval(days => v_trial_days) else now() end,
      case when coalesce(v_plan.kind, '') = 'trial' and v_trial_days > 0 then now() + make_interval(days => v_trial_days) else now() end
    )
    on conflict (client_id) do update
      set plan_id = coalesce(public.subscriptions.plan_id, excluded.plan_id),
          status = case when public.subscriptions.status in ('cancelled', 'blocked') then excluded.status else public.subscriptions.status end,
          status_assinatura = case when public.subscriptions.status_assinatura in ('cancelado', 'bloqueado') then excluded.status_assinatura else public.subscriptions.status_assinatura end,
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

revoke execute on function public.handle_new_saas_auth_user() from public, anon, authenticated;
