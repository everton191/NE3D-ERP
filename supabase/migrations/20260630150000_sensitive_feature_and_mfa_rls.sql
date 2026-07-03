-- Simplifica 3D: central sensitive access decision and MFA restrictive policies.

create or replace function public.can_access_sensitive_feature(
  p_feature_key text,
  p_company_id uuid,
  p_interface_mode text default 'simplifica'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
  v_role text;
  v_plan text := 'free';
  v_plan_active boolean := true;
  v_result jsonb;
begin
  select * into v_company from public.companies where id = p_company_id;
  if not found then return jsonb_build_object('allowed', false, 'state', 'disabled_by_status', 'message', 'Empresa não encontrada.'); end if;

  if v_company.owner_user_id = auth.uid() then
    v_role := 'owner';
  else
    select case role when 'attendant' then 'sales' when 'finance' then 'cashier' when 'read_only' then 'viewer' else role end
    into v_role
    from public.company_members
    where company_id = p_company_id and user_id = auth.uid() and status = 'active'
    limit 1;
  end if;
  if v_role is null and not public.erp_is_superadmin() then
    return jsonb_build_object('allowed', false, 'state', 'blocked_by_role', 'message', 'Seu usuário não tem acesso a esta empresa.');
  end if;

  select coalesce(p.slug, 'free'),
         lower(coalesce(s.status, 'active')) in ('active','trialing','paid','ativo')
  into v_plan, v_plan_active
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  where s.company_id = p_company_id
  order by s.created_at desc
  limit 1;

  v_result := public.can_access_app_feature(p_feature_key, coalesce(v_plan, 'free'), p_interface_mode, coalesce(v_role, 'owner'), coalesce(v_plan_active, true));

  if v_company.deletion_status = 'pending_deletion'
     and p_feature_key not in ('account_deletion','basic_account_security') then
    return v_result || jsonb_build_object('allowed', false, 'state', 'pending_deletion', 'message', 'Esta ação está bloqueada enquanto a conta aguarda exclusão.');
  end if;

  if not public.erp_mfa_session_allowed(auth.uid()) then
    return v_result || jsonb_build_object('allowed', false, 'state', 'requires_2fa', 'message', 'Confirme o código de segurança para continuar.');
  end if;
  return v_result;
end;
$$;

revoke all on function public.can_access_sensitive_feature(text, uuid, text) from public, anon;
grant execute on function public.can_access_sensitive_feature(text, uuid, text) to authenticated, service_role;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'account_security_settings',
    'account_deletion_requests',
    'security_events',
    'printers',
    'printer_status_snapshots',
    'local_agents'
  ]
  loop
    if to_regclass('public.' || v_table) is not null then
      execute format('drop policy if exists "mfa verified sensitive access" on public.%I', v_table);
      execute format(
        'create policy "mfa verified sensitive access" on public.%I as restrictive for all to authenticated using (public.erp_mfa_session_allowed(auth.uid())) with check (public.erp_mfa_session_allowed(auth.uid()))',
        v_table
      );
    end if;
  end loop;
end $$;
