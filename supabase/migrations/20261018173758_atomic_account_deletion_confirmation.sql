begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Do not let a direct Data API update substitute for verified email consent.
-- Ordinary company fields and existing server provisioning remain unchanged.
create schema if not exists private;
create or replace function private.guard_company_deletion_fields()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if current_user in ('anon', 'authenticated') then
    if TG_OP = 'INSERT' then
      if new.deletion_status is distinct from 'none'
        or new.deleted_by_system is distinct from false or new.deleted_at is not null
        or new.deletion_requested_at is not null or new.deletion_scheduled_at is not null
        or new.deletion_cancelled_at is not null or new.deletion_requested_by is not null then
        raise exception 'ACCOUNT_SECURITY_REQUIRED' using errcode = '42501';
      end if;
    elsif row(new.deletion_status, new.deletion_requested_at, new.deletion_scheduled_at,
      new.deletion_cancelled_at, new.deletion_requested_by, new.deleted_at, new.deleted_by_system)
      is distinct from row(old.deletion_status, old.deletion_requested_at, old.deletion_scheduled_at,
        old.deletion_cancelled_at, old.deletion_requested_by, old.deleted_at, old.deleted_by_system) then
      raise exception 'ACCOUNT_SECURITY_REQUIRED' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_company_deletion_fields() from public, anon, authenticated, service_role;
create trigger guard_company_deletion_fields before insert or update on public.companies
for each row execute function private.guard_company_deletion_fields();

-- Called only by the trusted Edge handler AFTER Auth verifies the email OTP.
-- UUIDs, email and verified-session ID are server-derived, never browser proof.
create function public.apply_account_deletion_action(
  p_actor_user_id uuid, p_company_id uuid, p_challenge_id uuid, p_action text,
  p_verified_session_id uuid, p_ip_hash text default null,
  p_user_agent_hash text default null, p_reason text default '',
  p_confirmation_email text default null
) returns jsonb language plpgsql security invoker set search_path = pg_catalog as $function$
declare
  v_company public.companies%rowtype;
  v_challenge public.user_2fa_challenges%rowtype;
  v_request public.account_deletion_requests%rowtype;
  v_active_count integer;
  v_purpose text;
  v_now timestamptz;
  v_scheduled timestamptz;
  v_written uuid;
begin
  if p_action is null or p_action not in ('confirm_account_deletion', 'confirm_cancel_deletion') then
    raise exception 'ACTION_NOT_ALLOWED' using errcode = '22023';
  end if;
  if p_actor_user_id is null or p_company_id is null or p_challenge_id is null then
    raise exception 'COMPANY_REQUIRED' using errcode = '22023';
  end if;
  if p_verified_session_id is null then
    raise exception 'INVALID_VERIFIED_SESSION' using errcode = '22023';
  end if;
  if length(coalesce(p_reason, '')) > 500 or length(coalesce(p_confirmation_email, '')) > 320
    or length(coalesce(p_ip_hash, '')) > 200 or length(coalesce(p_user_agent_hash, '')) > 500 then
    raise exception 'ACTION_NOT_ALLOWED' using errcode = '22023';
  end if;

  -- Same first lock as process_due_account_deletions: never resurrect completed.
  select * into v_company from public.companies where id = p_company_id for update;
  if not found then raise exception 'COMPANY_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_company.owner_user_id is distinct from p_actor_user_id then
    raise exception 'OWNER_REQUIRED' using errcode = '42501';
  end if;
  if v_company.deletion_status = 'completed' or v_company.deleted_at is not null
    or v_company.deleted_by_system then
    raise exception 'DELETION_COMPLETED' using errcode = '55000';
  end if;
  if v_company.status is distinct from 'active' then
    raise exception 'COMPANY_INACTIVE' using errcode = '55000';
  end if;

  v_purpose := case p_action when 'confirm_account_deletion' then 'account_deletion' else 'cancel_deletion' end;
  select * into v_challenge from public.user_2fa_challenges
    where id = p_challenge_id and user_id = p_actor_user_id and company_id = p_company_id for update;
  if not found then raise exception 'CHALLENGE_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_challenge.purpose is distinct from v_purpose then
    raise exception 'INVALID_CHALLENGE_PURPOSE' using errcode = '42501';
  end if;
  if v_challenge.status is distinct from 'pending' or v_challenge.used_at is not null then
    raise exception 'CHALLENGE_ALREADY_USED' using errcode = '55000';
  end if;
  if v_challenge.expires_at <= clock_timestamp() then
    raise exception 'CODE_EXPIRED' using errcode = '55000';
  end if;
  if v_challenge.attempt_count >= v_challenge.max_attempts then
    raise exception 'TOO_MANY_ATTEMPTS' using errcode = '55000';
  end if;

  perform id from public.account_deletion_requests
    where company_id = p_company_id and status in ('requested', 'confirmed') order by id for update;
  get diagnostics v_active_count = row_count;
  v_now := clock_timestamp();
  if v_challenge.expires_at <= v_now then
    raise exception 'CODE_EXPIRED' using errcode = '55000';
  end if;
  if p_action = 'confirm_account_deletion' then
    if v_company.deletion_status = 'pending_deletion' then
      raise exception 'PENDING_DELETION' using errcode = '55000';
    end if;
    if v_active_count <> 0 then
      raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000';
    end if;
    v_scheduled := v_now + interval '15 days';
    insert into public.account_deletion_requests(owner_id, requested_by, company_id,
      confirmation_email, status, requested_at, scheduled_delete_at, confirmed_at, reason, ip_hash, user_agent_hash)
    values(p_actor_user_id, p_actor_user_id, p_company_id, nullif(trim(p_confirmation_email), ''),
      'confirmed', v_now, v_scheduled, v_now, coalesce(p_reason, ''), p_ip_hash, p_user_agent_hash)
    returning * into v_request;
    if not found then raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000'; end if;
    update public.companies set deletion_status = 'pending_deletion', deletion_requested_at = v_now,
      deletion_scheduled_at = v_scheduled, deletion_requested_by = p_actor_user_id,
      deletion_cancelled_at = null, updated_at = v_now where id = p_company_id returning id into v_written;
  else
    if v_company.deletion_status is distinct from 'pending_deletion' then
      raise exception 'DELETION_NOT_PENDING' using errcode = '55000';
    end if;
    if v_active_count <> 1 then
      raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000';
    end if;
    select * into v_request from public.account_deletion_requests
      where company_id = p_company_id and status in ('requested', 'confirmed');
    if v_request.status is distinct from 'confirmed'
      or v_request.owner_id is distinct from p_actor_user_id
      or v_request.requested_by is distinct from p_actor_user_id
      or v_company.deletion_requested_by is distinct from p_actor_user_id
      or v_request.scheduled_delete_at is null
      or v_request.scheduled_delete_at is distinct from v_company.deletion_scheduled_at
      or v_request.requested_at is distinct from v_company.deletion_requested_at then
      raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000';
    end if;
    update public.account_deletion_requests set status = 'cancelled', cancelled_at = v_now, updated_at = v_now
      where id = v_request.id and status = 'confirmed' returning id into v_written;
    if not found then raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000'; end if;
    update public.companies set deletion_status = 'cancelled', deletion_cancelled_at = v_now,
      deletion_scheduled_at = null, updated_at = v_now where id = p_company_id returning id into v_written;
  end if;
  if not found or v_written is distinct from p_company_id then
    raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000';
  end if;

  insert into public.user_2fa_sessions(user_id, company_id, auth_session_id, verified_at, expires_at, revoked_at)
  values(p_actor_user_id, p_company_id, p_verified_session_id, v_now, v_now + interval '12 hours', null)
  on conflict(user_id, auth_session_id) do update set company_id = excluded.company_id,
    verified_at = excluded.verified_at, expires_at = excluded.expires_at, revoked_at = null
  returning id into v_written;
  if not found then raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000'; end if;
  update public.user_2fa_challenges set status = 'verified', used_at = v_now
    where id = p_challenge_id and status = 'pending' returning id into v_written;
  if not found then raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000'; end if;
  insert into public.security_events(company_id, user_id, event_type, status, message, ip_hash, user_agent_hash, metadata)
  values(p_company_id, p_actor_user_id,
    case p_action when 'confirm_account_deletion' then 'account_deletion_requested' else 'account_deletion_cancelled' end,
    'success', case p_action when 'confirm_account_deletion'
      then 'Solicitação confirmada com carência de 15 dias.' else 'Exclusão da conta cancelada.' end,
    p_ip_hash, p_user_agent_hash, jsonb_build_object('challenge_id', p_challenge_id, 'request_id', v_request.id))
  returning id into v_written;
  if not found then raise exception 'DELETION_STATE_CONFLICT' using errcode = '55000'; end if;

  return jsonb_build_object('persisted', true, 'action', p_action, 'company_id', p_company_id,
    'request_id', v_request.id) || case p_action when 'confirm_account_deletion'
      then jsonb_build_object('scheduled_for', v_scheduled) else jsonb_build_object('cancelled', true) end;
end;
$function$;
revoke all on function public.apply_account_deletion_action(uuid,uuid,uuid,text,uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.apply_account_deletion_action(uuid,uuid,uuid,text,uuid,text,text,text,text) to service_role;

-- Rollback: restore the Edge caller first, then drop this RPC/guard trigger.
-- No historical requests/companies, cron, retention, licenses or data are rewritten.
notify pgrst, 'reload schema';
commit;
