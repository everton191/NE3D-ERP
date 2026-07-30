-- Simplifica 3D: close PLAN-AUTH-002 for employee management.
-- The client never supplies plan, role or active status as authorization facts.

create or replace function public.erp_authorize_company_feature(
  p_company_id uuid,
  p_feature_key text,
  p_requested_action text default 'read'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_plan text := 'free';
  v_status text := 'inactive';
  v_period_end timestamptz;
  v_decision jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'authorized', false,
      'feature', p_feature_key,
      'action', p_requested_action,
      'reason', 'authentication_required'
    );
  end if;

  if public.erp_is_superadmin() then
    return jsonb_build_object(
      'authorized', true,
      'feature', p_feature_key,
      'action', p_requested_action,
      'plan', 'pro',
      'role', 'superadmin',
      'reason', 'superadmin'
    );
  end if;

  select case
      when c.owner_user_id = auth.uid() then 'owner'
      when cm.role = 'attendant' then 'sales'
      when cm.role = 'finance' then 'cashier'
      when cm.role = 'read_only' then 'viewer'
      else cm.role
    end
  into v_role
  from public.companies c
  left join public.company_members cm
    on cm.company_id = c.id
   and cm.user_id = auth.uid()
   and cm.status = 'active'
  where c.id = p_company_id
  limit 1;

  if v_role is null then
    return jsonb_build_object(
      'authorized', false,
      'feature', p_feature_key,
      'action', p_requested_action,
      'reason', 'not_company_member'
    );
  end if;

  select
    lower(coalesce(nullif(s.active_plan, ''), p.slug, 'free')),
    lower(coalesce(nullif(s.subscription_status, ''), nullif(s.status, ''), 'inactive')),
    coalesce(s.current_period_end, s.plan_expires_at)
  into v_plan, v_status, v_period_end
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  where s.company_id = p_company_id
     or s.client_id = p_company_id
  order by
    case when lower(coalesce(s.subscription_status, s.status, '')) in ('active', 'approved', 'paid', 'trialing', 'ativo') then 0 else 1 end,
    coalesce(s.updated_at, s.created_at) desc
  limit 1;

  v_decision := public.can_access_app_feature(
    p_feature_key,
    coalesce(v_plan, 'free'),
    'profissional',
    v_role,
    coalesce(v_status in ('active', 'approved', 'paid', 'trialing', 'ativo')
      and (v_period_end is null or v_period_end >= now()), false)
  );

  return jsonb_build_object(
    'authorized', coalesce((v_decision ->> 'allowed')::boolean, false),
    'feature', p_feature_key,
    'action', lower(coalesce(nullif(trim(p_requested_action), ''), 'read')),
    'plan', coalesce(v_plan, 'free'),
    'role', v_role,
    'status', coalesce(v_status, 'inactive'),
    'periodEnd', v_period_end,
    'reason', coalesce(v_decision ->> 'state', 'denied')
  );
end;
$$;

revoke all on function public.erp_authorize_company_feature(uuid, text, text) from public, anon;
grant execute on function public.erp_authorize_company_feature(uuid, text, text) to authenticated, service_role;

drop policy if exists "company_members_insert_owner_or_superadmin" on public.company_members;
drop policy if exists "company_members_insert_admin_or_superadmin" on public.company_members;
drop policy if exists "company_members_update_owner_or_superadmin" on public.company_members;
drop policy if exists "company_members_update_admin_or_superadmin" on public.company_members;
drop policy if exists "company_members_delete_owner_or_superadmin" on public.company_members;
drop policy if exists "company_members_delete_admin_or_superadmin" on public.company_members;
drop policy if exists "company_members_insert_entitled_admin" on public.company_members;
drop policy if exists "company_members_update_entitled_admin" on public.company_members;
drop policy if exists "company_members_delete_entitled_admin" on public.company_members;

create policy "company_members_insert_entitled_admin"
on public.company_members for insert to authenticated
with check (
  coalesce((public.erp_authorize_company_feature(company_id, 'employees_management', 'insert') ->> 'authorized')::boolean, false)
);

create policy "company_members_update_entitled_admin"
on public.company_members for update to authenticated
using (
  coalesce((public.erp_authorize_company_feature(company_id, 'employees_management', 'update') ->> 'authorized')::boolean, false)
)
with check (
  coalesce((public.erp_authorize_company_feature(company_id, 'employees_management', 'update') ->> 'authorized')::boolean, false)
);

create policy "company_members_delete_entitled_admin"
on public.company_members for delete to authenticated
using (
  coalesce((public.erp_authorize_company_feature(company_id, 'employees_management', 'delete') ->> 'authorized')::boolean, false)
);

comment on function public.erp_authorize_company_feature(uuid, text, text)
is 'Server-derived feature authorization. It never trusts client-provided plan, role or active status.';
