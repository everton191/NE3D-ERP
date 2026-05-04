create schema if not exists private;

create table if not exists public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  user_email text null,
  error_key text not null,
  error_message text null,
  screen_name text null,
  action_name text null,
  app_version text null,
  device_model text null,
  os_version text null,
  platform text null,
  occurrence_count integer not null default 1,
  affected_user_count integer not null default 1,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'new' check (status in ('new', 'reviewing', 'fixed', 'ignored')),
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_error_log_users (
  id uuid primary key default gen_random_uuid(),
  error_log_id uuid not null references public.app_error_logs(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  user_email text null,
  occurrence_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.app_feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  user_email text null,
  user_name text null,
  type text not null default 'sugestao' check (type in ('bug', 'sugestao', 'duvida', 'melhoria', 'reclamacao')),
  title text not null,
  description text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'fixed', 'ignored', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  app_version text null,
  device_model text null,
  os_version text null,
  platform text null,
  screen_name text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_error_logs_dedupe
on public.app_error_logs (error_key, screen_name, action_name, app_version, last_seen_at desc);

create index if not exists idx_app_error_logs_status
on public.app_error_logs (status, severity, last_seen_at desc);

create index if not exists idx_app_error_logs_user
on public.app_error_logs (user_id, last_seen_at desc);

create index if not exists idx_app_error_log_users_log
on public.app_error_log_users (error_log_id);

create index if not exists idx_app_error_log_users_user
on public.app_error_log_users (user_id, last_seen_at desc);

create index if not exists idx_app_error_log_users_email
on public.app_error_log_users (user_email, last_seen_at desc);

create index if not exists idx_app_feedback_reports_status
on public.app_feedback_reports (status, priority, created_at desc);

create index if not exists idx_app_feedback_reports_user
on public.app_feedback_reports (user_id, created_at desc);

create index if not exists idx_app_feedback_reports_type
on public.app_feedback_reports (type, created_at desc);

create or replace function private.telemetry_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_error_logs_updated_at on public.app_error_logs;
create trigger set_app_error_logs_updated_at
before update on public.app_error_logs
for each row execute function private.telemetry_set_updated_at();

drop trigger if exists set_app_feedback_reports_updated_at on public.app_feedback_reports;
create trigger set_app_feedback_reports_updated_at
before update on public.app_feedback_reports
for each row execute function private.telemetry_set_updated_at();

create or replace function private.telemetry_severity(
  p_error_key text,
  p_action_name text,
  p_screen_name text,
  p_error_message text,
  p_occurrence_count integer
)
returns text
language plpgsql
immutable
as $$
declare
  v_text text := concat_ws(' ', p_error_key, p_action_name, p_screen_name, p_error_message);
begin
  if v_text ~* '(login|sign.?in|cadastro|signup|salvar.?pedido|save.?order|payment|pagamento|rls|row.?level.?security)' then
    return 'critical';
  end if;

  if coalesce(p_occurrence_count, 0) >= 10 then
    return 'high';
  end if;

  if coalesce(p_occurrence_count, 0) >= 3 then
    return 'medium';
  end if;

  return 'low';
end;
$$;

create or replace function private.register_app_error_impl(
  p_error_key text,
  p_error_message text default null,
  p_screen_name text default null,
  p_action_name text default null,
  p_app_version text default null,
  p_device_model text default null,
  p_os_version text default null,
  p_platform text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_user_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_log_id uuid;
  v_user_log_id uuid;
  v_user_id uuid := auth.uid();
  v_user_email text := lower(nullif(trim(coalesce((auth.jwt() ->> 'email'), p_user_email, '')), ''));
  v_error_key text := left(coalesce(nullif(trim(p_error_key), ''), 'APP_ERROR'), 140);
  v_error_message text := left(coalesce(p_error_message, ''), 900);
  v_screen_name text := left(coalesce(nullif(trim(p_screen_name), ''), 'unknown'), 120);
  v_action_name text := left(coalesce(nullif(trim(p_action_name), ''), 'unknown'), 140);
  v_app_version text := left(coalesce(nullif(trim(p_app_version), ''), 'unknown'), 80);
  v_device_model text := left(coalesce(p_device_model, ''), 160);
  v_os_version text := left(coalesce(p_os_version, ''), 160);
  v_platform text := left(coalesce(p_platform, ''), 80);
  v_metadata jsonb := case
    when jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) = 'object' then coalesce(p_metadata, '{}'::jsonb)
    else jsonb_build_object('value', p_metadata)
  end;
  v_identity text;
  v_occurrences integer;
  v_affected integer;
  v_severity text;
  v_status text;
begin
  select id
  into v_log_id
  from public.app_error_logs
  where error_key = v_error_key
    and coalesce(screen_name, '') = coalesce(v_screen_name, '')
    and coalesce(action_name, '') = coalesce(v_action_name, '')
    and coalesce(app_version, '') = coalesce(v_app_version, '')
    and last_seen_at >= now() - interval '6 hours'
  order by last_seen_at desc
  limit 1
  for update;

  if v_log_id is null then
    insert into public.app_error_logs (
      user_id,
      user_email,
      error_key,
      error_message,
      screen_name,
      action_name,
      app_version,
      device_model,
      os_version,
      platform,
      occurrence_count,
      affected_user_count,
      severity,
      status,
      metadata
    )
    values (
      v_user_id,
      v_user_email,
      v_error_key,
      nullif(v_error_message, ''),
      v_screen_name,
      v_action_name,
      v_app_version,
      nullif(v_device_model, ''),
      nullif(v_os_version, ''),
      nullif(v_platform, ''),
      1,
      1,
      private.telemetry_severity(v_error_key, v_action_name, v_screen_name, v_error_message, 1),
      'new',
      v_metadata
    )
    returning id, occurrence_count, status
    into v_log_id, v_occurrences, v_status;
  else
    update public.app_error_logs
    set occurrence_count = occurrence_count + 1,
        error_message = coalesce(nullif(v_error_message, ''), error_message),
        device_model = coalesce(nullif(v_device_model, ''), device_model),
        os_version = coalesce(nullif(v_os_version, ''), os_version),
        platform = coalesce(nullif(v_platform, ''), platform),
        metadata = coalesce(metadata, '{}'::jsonb) || v_metadata,
        last_seen_at = now()
    where id = v_log_id
    returning occurrence_count, status
    into v_occurrences, v_status;
  end if;

  v_identity := coalesce(v_user_id::text, nullif(v_user_email, ''), 'anonymous');

  select id
  into v_user_log_id
  from public.app_error_log_users
  where error_log_id = v_log_id
    and coalesce(user_id::text, nullif(user_email, ''), 'anonymous') = v_identity
  limit 1
  for update;

  if v_user_log_id is null then
    insert into public.app_error_log_users (
      error_log_id,
      user_id,
      user_email,
      occurrence_count
    )
    values (
      v_log_id,
      v_user_id,
      v_user_email,
      1
    );
  else
    update public.app_error_log_users
    set occurrence_count = occurrence_count + 1,
        last_seen_at = now(),
        user_email = coalesce(v_user_email, user_email)
    where id = v_user_log_id;
  end if;

  select count(*)
  into v_affected
  from (
    select distinct coalesce(user_id::text, nullif(user_email, ''), 'anonymous') as identity_key
    from public.app_error_log_users
    where error_log_id = v_log_id
  ) affected_users;

  update public.app_error_logs
  set affected_user_count = greatest(1, coalesce(v_affected, 0)),
      severity = private.telemetry_severity(v_error_key, v_action_name, v_screen_name, v_error_message, v_occurrences),
      updated_at = now()
  where id = v_log_id
  returning occurrence_count, affected_user_count, severity, status
  into v_occurrences, v_affected, v_severity, v_status;

  return jsonb_build_object(
    'id', v_log_id,
    'occurrence_count', v_occurrences,
    'affected_user_count', v_affected,
    'severity', v_severity,
    'status', v_status
  );
end;
$$;

create or replace function public.register_app_error(
  p_error_key text,
  p_error_message text default null,
  p_screen_name text default null,
  p_action_name text default null,
  p_app_version text default null,
  p_device_model text default null,
  p_os_version text default null,
  p_platform text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_user_email text default null
)
returns jsonb
language sql
security invoker
set search_path = public, private
as $$
  select private.register_app_error_impl(
    p_error_key,
    p_error_message,
    p_screen_name,
    p_action_name,
    p_app_version,
    p_device_model,
    p_os_version,
    p_platform,
    p_metadata,
    p_user_email
  );
$$;

alter table public.app_error_logs enable row level security;
alter table public.app_error_log_users enable row level security;
alter table public.app_feedback_reports enable row level security;

drop policy if exists "app_error_logs_insert_any_user" on public.app_error_logs;
create policy "app_error_logs_insert_any_user"
on public.app_error_logs for insert
to anon, authenticated
with check (true);

drop policy if exists "app_error_logs_select_superadmin" on public.app_error_logs;
create policy "app_error_logs_select_superadmin"
on public.app_error_logs for select
to authenticated
using (public.erp_is_superadmin());

drop policy if exists "app_error_logs_update_superadmin" on public.app_error_logs;
create policy "app_error_logs_update_superadmin"
on public.app_error_logs for update
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "app_error_log_users_insert_any_user" on public.app_error_log_users;
create policy "app_error_log_users_insert_any_user"
on public.app_error_log_users for insert
to anon, authenticated
with check (true);

drop policy if exists "app_error_log_users_select_superadmin" on public.app_error_log_users;
create policy "app_error_log_users_select_superadmin"
on public.app_error_log_users for select
to authenticated
using (public.erp_is_superadmin());

drop policy if exists "app_error_log_users_update_superadmin" on public.app_error_log_users;
create policy "app_error_log_users_update_superadmin"
on public.app_error_log_users for update
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "app_feedback_reports_insert_any_user" on public.app_feedback_reports;
create policy "app_feedback_reports_insert_any_user"
on public.app_feedback_reports for insert
to anon, authenticated
with check (true);

drop policy if exists "app_feedback_reports_select_own_or_superadmin" on public.app_feedback_reports;
create policy "app_feedback_reports_select_own_or_superadmin"
on public.app_feedback_reports for select
to authenticated
using (public.erp_is_superadmin() or user_id = auth.uid());

drop policy if exists "app_feedback_reports_update_superadmin" on public.app_feedback_reports;
create policy "app_feedback_reports_update_superadmin"
on public.app_feedback_reports for update
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

grant usage on schema private to anon, authenticated, service_role;
revoke all on function private.telemetry_set_updated_at() from public, anon, authenticated;
revoke all on function private.telemetry_severity(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function private.register_app_error_impl(text, text, text, text, text, text, text, text, jsonb, text) from public;
grant execute on function private.register_app_error_impl(text, text, text, text, text, text, text, text, jsonb, text) to anon, authenticated, service_role;

revoke all on function public.register_app_error(text, text, text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.register_app_error(text, text, text, text, text, text, text, text, jsonb, text) to anon, authenticated, service_role;

grant insert on public.app_error_logs to anon, authenticated;
grant select, update on public.app_error_logs to authenticated;
grant insert on public.app_error_log_users to anon, authenticated;
grant select, update on public.app_error_log_users to authenticated;
grant insert on public.app_feedback_reports to anon, authenticated;
grant select, update on public.app_feedback_reports to authenticated;
