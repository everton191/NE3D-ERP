alter table public.app_error_logs
  add column if not exists admin_notes text,
  add column if not exists affected_users_count integer not null default 1;

create or replace function public.diagnostics_severity_rank(p_severity text)
returns integer
language sql
immutable
as $$
  select case p_severity
    when 'critical' then 4
    when 'high' then 3
    when 'medium' then 2
    when 'low' then 1
    else 0
  end;
$$;

create or replace function public.refresh_app_bug_cluster_from_error()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fingerprint text := coalesce(nullif(new.fingerprint, ''), nullif(new.error_key, ''), new.id::text);
  v_title text := left(coalesce(nullif(new.error_key, ''), nullif(new.error_type, ''), nullif(new.fingerprint, ''), 'Erro do app'), 180);
  v_summary text := left(coalesce(nullif(new.error_message, ''), nullif(new.action, ''), nullif(new.action_name, ''), 'Erro coletado automaticamente'), 900);
  v_occurrences integer := 0;
  v_users integer := 0;
  v_versions jsonb := '[]'::jsonb;
  v_screens jsonb := '[]'::jsonb;
  v_platforms jsonb := '[]'::jsonb;
  v_severity text := coalesce(new.severity, 'low');
begin
  select coalesce(sum(coalesce(occurrence_count, 1)), 0)
  into v_occurrences
  from public.app_error_logs
  where coalesce(nullif(fingerprint, ''), nullif(error_key, ''), id::text) = v_fingerprint;

  select greatest(
    coalesce(count(distinct coalesce(elu.user_id::text, nullif(elu.user_email, ''), 'anonymous')), 0),
    coalesce(max(coalesce(el.affected_user_count, el.affected_users_count, 0)), 0),
    1
  )
  into v_users
  from public.app_error_logs el
  left join public.app_error_log_users elu on elu.error_log_id = el.id
  where coalesce(nullif(el.fingerprint, ''), nullif(el.error_key, ''), el.id::text) = v_fingerprint;

  select coalesce(jsonb_agg(distinct value) filter (where value is not null and value <> ''), '[]'::jsonb)
  into v_versions
  from (
    select app_version as value
    from public.app_error_logs
    where coalesce(nullif(fingerprint, ''), nullif(error_key, ''), id::text) = v_fingerprint
  ) items;

  select coalesce(jsonb_agg(distinct value) filter (where value is not null and value <> ''), '[]'::jsonb)
  into v_screens
  from (
    select coalesce(screen, screen_name) as value
    from public.app_error_logs
    where coalesce(nullif(fingerprint, ''), nullif(error_key, ''), id::text) = v_fingerprint
  ) items;

  select coalesce(jsonb_agg(distinct value) filter (where value is not null and value <> ''), '[]'::jsonb)
  into v_platforms
  from (
    select platform as value
    from public.app_error_logs
    where coalesce(nullif(fingerprint, ''), nullif(error_key, ''), id::text) = v_fingerprint
  ) items;

  select severity
  into v_severity
  from public.app_error_logs
  where coalesce(nullif(fingerprint, ''), nullif(error_key, ''), id::text) = v_fingerprint
  order by public.diagnostics_severity_rank(severity) desc, last_seen_at desc
  limit 1;

  insert into public.app_bug_clusters (
    fingerprint,
    title,
    summary,
    severity,
    status,
    occurrence_count,
    affected_users_count,
    affected_versions,
    affected_screens,
    affected_platforms,
    first_seen_at,
    last_seen_at
  )
  values (
    v_fingerprint,
    v_title,
    v_summary,
    coalesce(v_severity, 'low'),
    'new',
    greatest(v_occurrences, 1),
    greatest(v_users, 1),
    v_versions,
    v_screens,
    v_platforms,
    coalesce(new.first_seen_at, now()),
    coalesce(new.last_seen_at, now())
  )
  on conflict (fingerprint) do update
  set title = coalesce(public.app_bug_clusters.title, excluded.title),
      summary = coalesce(excluded.summary, public.app_bug_clusters.summary),
      severity = case
        when public.diagnostics_severity_rank(excluded.severity) > public.diagnostics_severity_rank(public.app_bug_clusters.severity) then excluded.severity
        else public.app_bug_clusters.severity
      end,
      status = case
        when public.app_bug_clusters.status in ('fixed', 'ignored') and excluded.last_seen_at > public.app_bug_clusters.last_seen_at then 'regression'
        else public.app_bug_clusters.status
      end,
      occurrence_count = greatest(excluded.occurrence_count, public.app_bug_clusters.occurrence_count),
      affected_users_count = greatest(excluded.affected_users_count, public.app_bug_clusters.affected_users_count),
      affected_versions = excluded.affected_versions,
      affected_screens = excluded.affected_screens,
      affected_platforms = excluded.affected_platforms,
      last_seen_at = greatest(excluded.last_seen_at, public.app_bug_clusters.last_seen_at),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists refresh_app_bug_cluster_after_error on public.app_error_logs;
create trigger refresh_app_bug_cluster_after_error
after insert or update of fingerprint, error_key, error_message, screen, screen_name, action, action_name, app_version, platform, severity, status, occurrence_count, affected_user_count, affected_users_count, first_seen_at, last_seen_at
on public.app_error_logs
for each row
execute function public.refresh_app_bug_cluster_from_error();

update public.app_error_logs
set updated_at = now()
where created_at >= now() - interval '90 days';

grant execute on function public.diagnostics_severity_rank(text) to authenticated, service_role;
grant execute on function public.refresh_app_bug_cluster_from_error() to authenticated, service_role;
