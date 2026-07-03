-- Simplifica 3D: email 2FA and delayed account deletion.

create table if not exists public.user_2fa_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  channel text not null default 'email',
  purpose text not null,
  provider text not null default 'supabase_auth',
  code_hash text,
  status text not null default 'pending',
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  used_at timestamptz,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now(),
  constraint user_2fa_challenges_channel_check check (channel = 'email'),
  constraint user_2fa_challenges_purpose_check check (purpose in ('login','enable_2fa','disable_2fa','account_deletion','cancel_deletion','sensitive_action')),
  constraint user_2fa_challenges_status_check check (status in ('pending','verified','failed','expired')),
  constraint user_2fa_challenges_attempts_check check (attempt_count between 0 and max_attempts and max_attempts = 5),
  constraint user_2fa_challenges_provider_check check (provider = 'supabase_auth' and code_hash is null)
);

create table if not exists public.user_2fa_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  auth_session_id uuid not null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_2fa_sessions_unique unique (user_id, auth_session_id)
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  status text not null default 'recorded',
  message text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint security_events_status_check check (status in ('recorded','success','failed','blocked')),
  constraint security_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

alter table public.account_security_settings
  add column if not exists trusted_devices_enabled boolean not null default false,
  add column if not exists last_2fa_enabled_at timestamptz,
  add column if not exists last_2fa_disabled_at timestamptz;

alter table public.account_security_settings drop constraint if exists account_security_settings_status_check;
alter table public.account_security_settings
  add constraint account_security_settings_status_check check (status in ('disabled','prepared','active','locked','error'));

alter table public.account_security_settings drop constraint if exists account_security_settings_disabled_guard;
alter table public.account_security_settings
  add constraint account_security_settings_disabled_guard check (
    status <> 'disabled'
    or (two_factor_enabled = false and web_pin_enabled = false and two_factor_channel = 'disabled')
  );

alter table public.account_deletion_requests
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists confirmation_channel text not null default 'email',
  add column if not exists confirmation_token_hash text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists reason text,
  add column if not exists ip_hash text,
  add column if not exists user_agent_hash text;

alter table public.companies
  add column if not exists deletion_status text not null default 'none',
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_at timestamptz,
  add column if not exists deletion_cancelled_at timestamptz,
  add column if not exists deletion_requested_by uuid references auth.users(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_system boolean not null default false;

alter table public.companies drop constraint if exists companies_deletion_status_check;
alter table public.companies
  add constraint companies_deletion_status_check check (deletion_status in ('none','pending_deletion','cancelled','completed'));

create index if not exists user_2fa_challenges_user_status_idx on public.user_2fa_challenges(user_id, status, created_at desc);
create index if not exists user_2fa_sessions_user_expiry_idx on public.user_2fa_sessions(user_id, expires_at desc);
create index if not exists security_events_company_created_idx on public.security_events(company_id, created_at desc);
create index if not exists companies_deletion_schedule_idx on public.companies(deletion_status, deletion_scheduled_at);

alter table public.user_2fa_challenges enable row level security;
alter table public.user_2fa_sessions enable row level security;
alter table public.security_events enable row level security;

drop policy if exists "users read own security events" on public.security_events;
create policy "users read own security events" on public.security_events for select to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "users read own security settings" on public.account_security_settings;
create policy "users read own security settings" on public.account_security_settings for select to authenticated
using (owner_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "users read own deletion requests" on public.account_deletion_requests;
create policy "users read own deletion requests" on public.account_deletion_requests for select to authenticated
using (requested_by = auth.uid() or owner_id = auth.uid() or public.erp_is_superadmin());

revoke all on public.user_2fa_challenges, public.user_2fa_sessions, public.security_events from public, anon, authenticated;
grant select on public.security_events to authenticated, service_role;
grant select, insert, update, delete on public.user_2fa_challenges, public.user_2fa_sessions, public.security_events to service_role;

create or replace function public.erp_mfa_session_allowed(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    not coalesce((select two_factor_enabled from public.account_security_settings where owner_id = p_user_id), false)
    or exists (
      select 1
      from public.user_2fa_sessions s
      where s.user_id = p_user_id
        and s.auth_session_id::text = coalesce(auth.jwt()->>'session_id', '')
        and s.revoked_at is null
        and s.expires_at > now()
    );
$$;

revoke all on function public.erp_mfa_session_allowed(uuid) from public, anon;
grant execute on function public.erp_mfa_session_allowed(uuid) to authenticated, service_role;

create or replace function public.process_due_account_deletions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_company record;
begin
  for v_company in
    select id, deletion_requested_by
    from public.companies
    where deletion_status = 'pending_deletion'
      and deletion_scheduled_at <= now()
    for update skip locked
  loop
    update public.companies
    set deletion_status = 'completed',
        status = 'inactive',
        deleted_at = now(),
        deleted_by_system = true,
        updated_at = now()
    where id = v_company.id and deletion_status = 'pending_deletion';

    update public.company_members set status = 'blocked', updated_at = now() where company_id = v_company.id;
    update public.account_deletion_requests
    set status = 'completed', completed_at = now(), updated_at = now()
    where company_id = v_company.id and status = 'confirmed';
    insert into public.security_events(company_id, user_id, event_type, status, message)
    values (v_company.id, v_company.deletion_requested_by, 'account_deletion_completed', 'success', 'Exclusão lógica concluída após carência de 15 dias.');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.process_due_account_deletions() from public, anon, authenticated;
grant execute on function public.process_due_account_deletions() to service_role;

do $$
declare
  v_job_id bigint;
begin
  if to_regnamespace('cron') is not null then
    select jobid into v_job_id from cron.job where jobname = 'simplifica-account-deletion-daily' limit 1;
    if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
    perform cron.schedule('simplifica-account-deletion-daily', '15 3 * * *', 'select public.process_due_account_deletions();');
  end if;
exception when others then
  raise notice 'Cron não configurado automaticamente: %', sqlerrm;
end $$;
