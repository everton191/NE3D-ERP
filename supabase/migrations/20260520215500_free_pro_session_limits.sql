-- Align SaaS session limits with the simplified FREE/PRO plan policy.
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
  v_limit integer := 2;
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
  order by s.created_at desc nulls last
  limit 1;

  v_limit := case
    when v_plan_slug in ('premium', 'premium_trial', 'pro', 'pro_token') then 4
    else 2
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

revoke execute on function public.register_saas_session(text, text) from public, anon;
grant execute on function public.register_saas_session(text, text) to authenticated;
