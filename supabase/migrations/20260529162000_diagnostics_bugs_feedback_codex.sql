create extension if not exists pgcrypto;

create table if not exists public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_error_logs
  add column if not exists user_email text,
  add column if not exists error_key text,
  add column if not exists error_stack_sanitized text,
  add column if not exists error_type text,
  add column if not exists screen text,
  add column if not exists screen_name text,
  add column if not exists action text,
  add column if not exists action_name text,
  add column if not exists app_version text,
  add column if not exists build_number text,
  add column if not exists platform text,
  add column if not exists device_model text,
  add column if not exists os text,
  add column if not exists os_version text,
  add column if not exists browser text,
  add column if not exists is_pwa boolean not null default false,
  add column if not exists is_apk boolean not null default false,
  add column if not exists route text,
  add column if not exists plan_at_time text,
  add column if not exists subscription_status_at_time text,
  add column if not exists payment_status_at_time text,
  add column if not exists fingerprint text,
  add column if not exists severity text not null default 'low',
  add column if not exists status text not null default 'new',
  add column if not exists occurrence_count integer not null default 1,
  add column if not exists affected_user_count integer not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists first_seen_at timestamptz not null default now(),
  add column if not exists last_seen_at timestamptz not null default now();

create table if not exists public.app_error_log_users (
  id uuid primary key default gen_random_uuid(),
  error_log_id uuid not null references public.app_error_logs(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  occurrence_count integer not null default 1,
  app_version text,
  platform text,
  device_model text,
  user_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  type text not null default 'suggestion',
  title text not null,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_feedback_reports
  add column if not exists user_email text,
  add column if not exists user_name text,
  add column if not exists message text,
  add column if not exists description text,
  add column if not exists screen text,
  add column if not exists screen_name text,
  add column if not exists action text,
  add column if not exists app_version text,
  add column if not exists platform text,
  add column if not exists device_model text,
  add column if not exists os_version text,
  add column if not exists plan_at_time text,
  add column if not exists status text not null default 'new',
  add column if not exists priority text not null default 'normal',
  add column if not exists admin_notes text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

create table if not exists public.app_diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  screen text,
  action text,
  app_version text,
  platform text,
  severity text not null default 'low',
  fingerprint text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_bug_clusters (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  title text,
  summary text,
  severity text not null default 'low',
  status text not null default 'new',
  occurrence_count integer not null default 1,
  affected_users_count integer not null default 0,
  affected_versions jsonb not null default '[]'::jsonb,
  affected_screens jsonb not null default '[]'::jsonb,
  affected_platforms jsonb not null default '[]'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  probable_cause text,
  probable_files jsonb not null default '[]'::jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_bug_reports_exports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid null references auth.users(id) on delete set null,
  report_title text not null,
  filters_json jsonb not null default '{}'::jsonb,
  summary text,
  technical_report text not null,
  related_error_ids jsonb not null default '[]'::jsonb,
  related_feedback_ids jsonb not null default '[]'::jsonb,
  related_cluster_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_ai_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null default 'blocked',
  input_filters_json jsonb not null default '{}'::jsonb,
  input_summary text,
  output_summary text,
  output_prompt text,
  model_provider text not null default 'disabled',
  model_name text,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text not null,
  source text,
  active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.app_error_logs drop constraint if exists app_error_logs_severity_check;
  alter table public.app_error_logs add constraint app_error_logs_severity_check check (severity in ('low', 'medium', 'high', 'critical'));
  alter table public.app_error_logs drop constraint if exists app_error_logs_status_check;
  alter table public.app_error_logs add constraint app_error_logs_status_check check (status in ('new', 'investigating', 'fixed', 'ignored', 'regression', 'reviewing'));
  alter table public.app_error_log_users drop constraint if exists app_error_log_users_occurrence_count_check;
  alter table public.app_error_log_users add constraint app_error_log_users_occurrence_count_check check (occurrence_count >= 0);
  alter table public.app_feedback_reports drop constraint if exists app_feedback_reports_type_check;
  alter table public.app_feedback_reports add constraint app_feedback_reports_type_check check (type in ('bug_report', 'suggestion', 'improvement', 'question', 'complaint', 'other', 'bug', 'sugestao', 'duvida', 'melhoria', 'reclamacao'));
  alter table public.app_feedback_reports drop constraint if exists app_feedback_reports_status_check;
  alter table public.app_feedback_reports add constraint app_feedback_reports_status_check check (status in ('new', 'reviewing', 'planned', 'in_progress', 'done', 'ignored', 'fixed', 'closed'));
  alter table public.app_feedback_reports drop constraint if exists app_feedback_reports_priority_check;
  alter table public.app_feedback_reports add constraint app_feedback_reports_priority_check check (priority in ('low', 'normal', 'medium', 'high', 'urgent', 'critical'));
  alter table public.app_diagnostic_events drop constraint if exists app_diagnostic_events_severity_check;
  alter table public.app_diagnostic_events add constraint app_diagnostic_events_severity_check check (severity in ('low', 'medium', 'high', 'critical'));
  alter table public.app_bug_clusters drop constraint if exists app_bug_clusters_severity_check;
  alter table public.app_bug_clusters add constraint app_bug_clusters_severity_check check (severity in ('low', 'medium', 'high', 'critical'));
  alter table public.app_bug_clusters drop constraint if exists app_bug_clusters_status_check;
  alter table public.app_bug_clusters add constraint app_bug_clusters_status_check check (status in ('new', 'investigating', 'fixed', 'ignored', 'regression'));
  alter table public.app_bug_reports_exports drop constraint if exists app_bug_reports_exports_status_check;
  alter table public.app_bug_reports_exports add constraint app_bug_reports_exports_status_check check (status in ('draft', 'generated', 'sent_to_codex', 'archived'));
  alter table public.app_ai_analysis_runs drop constraint if exists app_ai_analysis_runs_status_check;
  alter table public.app_ai_analysis_runs add constraint app_ai_analysis_runs_status_check check (status in ('blocked', 'queued', 'running', 'done', 'error', 'skipped'));
  alter table public.app_ai_analysis_runs drop constraint if exists app_ai_analysis_runs_provider_check;
  alter table public.app_ai_analysis_runs add constraint app_ai_analysis_runs_provider_check check (model_provider in ('disabled', 'openai', 'groq', 'gemini', 'anthropic', 'local'));
  alter table public.app_ai_knowledge_base drop constraint if exists app_ai_knowledge_base_category_check;
  alter table public.app_ai_knowledge_base add constraint app_ai_knowledge_base_category_check check (category in ('system_rules', 'billing_rules', 'storefront_rules', 'plans_rules', 'known_bugs', 'architecture_notes', 'codex_instructions'));
end $$;

create index if not exists idx_app_error_logs_fingerprint on public.app_error_logs(fingerprint);
create index if not exists idx_app_error_logs_status_severity on public.app_error_logs(status, severity, last_seen_at desc);
create index if not exists idx_app_error_log_users_log_user on public.app_error_log_users(error_log_id, user_id);
create index if not exists idx_app_feedback_reports_status_priority on public.app_feedback_reports(status, priority, created_at desc);
create index if not exists idx_app_diagnostic_events_type_created on public.app_diagnostic_events(event_type, created_at desc);
create index if not exists idx_app_diagnostic_events_fingerprint on public.app_diagnostic_events(fingerprint);
create unique index if not exists uniq_app_bug_clusters_fingerprint on public.app_bug_clusters(fingerprint);
create index if not exists idx_app_bug_clusters_status_severity on public.app_bug_clusters(status, severity, last_seen_at desc);
create index if not exists idx_app_bug_exports_created_by on public.app_bug_reports_exports(created_by, created_at desc);
create index if not exists idx_app_ai_runs_created_by on public.app_ai_analysis_runs(created_by, created_at desc);
create index if not exists idx_app_ai_kb_category on public.app_ai_knowledge_base(category, active);

create or replace function public.diagnostics_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_error_log_users_updated_at on public.app_error_log_users;
create trigger set_app_error_log_users_updated_at before update on public.app_error_log_users for each row execute function public.diagnostics_set_updated_at();
drop trigger if exists set_app_bug_clusters_updated_at on public.app_bug_clusters;
create trigger set_app_bug_clusters_updated_at before update on public.app_bug_clusters for each row execute function public.diagnostics_set_updated_at();
drop trigger if exists set_app_bug_reports_exports_updated_at on public.app_bug_reports_exports;
create trigger set_app_bug_reports_exports_updated_at before update on public.app_bug_reports_exports for each row execute function public.diagnostics_set_updated_at();
drop trigger if exists set_app_ai_analysis_runs_updated_at on public.app_ai_analysis_runs;
create trigger set_app_ai_analysis_runs_updated_at before update on public.app_ai_analysis_runs for each row execute function public.diagnostics_set_updated_at();
drop trigger if exists set_app_ai_knowledge_base_updated_at on public.app_ai_knowledge_base;
create trigger set_app_ai_knowledge_base_updated_at before update on public.app_ai_knowledge_base for each row execute function public.diagnostics_set_updated_at();

alter table public.app_error_logs enable row level security;
alter table public.app_error_log_users enable row level security;
alter table public.app_feedback_reports enable row level security;
alter table public.app_diagnostic_events enable row level security;
alter table public.app_bug_clusters enable row level security;
alter table public.app_bug_reports_exports enable row level security;
alter table public.app_ai_analysis_runs enable row level security;
alter table public.app_ai_knowledge_base enable row level security;

drop policy if exists "app_error_logs_insert_any_user" on public.app_error_logs;
drop policy if exists "app_error_log_users_insert_any_user" on public.app_error_log_users;
drop policy if exists "app_feedback_reports_insert_any_user" on public.app_feedback_reports;

drop policy if exists "diagnostics error insert own" on public.app_error_logs;
create policy "diagnostics error insert own" on public.app_error_logs for insert to anon, authenticated
with check (auth.uid() is null or user_id is null or user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics error select own or superadmin" on public.app_error_logs;
create policy "diagnostics error select own or superadmin" on public.app_error_logs for select to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics error update superadmin" on public.app_error_logs;
create policy "diagnostics error update superadmin" on public.app_error_logs for update to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

drop policy if exists "diagnostics affected users insert own" on public.app_error_log_users;
create policy "diagnostics affected users insert own" on public.app_error_log_users for insert to anon, authenticated
with check (auth.uid() is null or user_id is null or user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics affected users select own or superadmin" on public.app_error_log_users;
create policy "diagnostics affected users select own or superadmin" on public.app_error_log_users for select to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics affected users update superadmin" on public.app_error_log_users;
create policy "diagnostics affected users update superadmin" on public.app_error_log_users for update to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

drop policy if exists "diagnostics feedback insert own" on public.app_feedback_reports;
create policy "diagnostics feedback insert own" on public.app_feedback_reports for insert to anon, authenticated
with check (auth.uid() is null or user_id is null or user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics feedback select own or superadmin" on public.app_feedback_reports;
create policy "diagnostics feedback select own or superadmin" on public.app_feedback_reports for select to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics feedback update superadmin" on public.app_feedback_reports;
create policy "diagnostics feedback update superadmin" on public.app_feedback_reports for update to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

drop policy if exists "diagnostics events insert own" on public.app_diagnostic_events;
create policy "diagnostics events insert own" on public.app_diagnostic_events for insert to anon, authenticated
with check (auth.uid() is null or user_id is null or user_id = auth.uid() or public.erp_is_superadmin());
drop policy if exists "diagnostics events select own or superadmin" on public.app_diagnostic_events;
create policy "diagnostics events select own or superadmin" on public.app_diagnostic_events for select to authenticated
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "diagnostics clusters select superadmin" on public.app_bug_clusters;
create policy "diagnostics clusters select superadmin" on public.app_bug_clusters for select to authenticated
using (public.erp_is_superadmin());
drop policy if exists "diagnostics clusters manage superadmin" on public.app_bug_clusters;
create policy "diagnostics clusters manage superadmin" on public.app_bug_clusters for all to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

drop policy if exists "diagnostics exports select superadmin" on public.app_bug_reports_exports;
create policy "diagnostics exports select superadmin" on public.app_bug_reports_exports for select to authenticated
using (public.erp_is_superadmin());
drop policy if exists "diagnostics exports manage superadmin" on public.app_bug_reports_exports;
create policy "diagnostics exports manage superadmin" on public.app_bug_reports_exports for all to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

drop policy if exists "diagnostics ai runs select superadmin" on public.app_ai_analysis_runs;
create policy "diagnostics ai runs select superadmin" on public.app_ai_analysis_runs for select to authenticated
using (public.erp_is_superadmin());
drop policy if exists "diagnostics ai runs manage superadmin" on public.app_ai_analysis_runs;
create policy "diagnostics ai runs manage superadmin" on public.app_ai_analysis_runs for all to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

drop policy if exists "diagnostics ai kb select superadmin" on public.app_ai_knowledge_base;
create policy "diagnostics ai kb select superadmin" on public.app_ai_knowledge_base for select to authenticated
using (public.erp_is_superadmin());
drop policy if exists "diagnostics ai kb manage superadmin" on public.app_ai_knowledge_base;
create policy "diagnostics ai kb manage superadmin" on public.app_ai_knowledge_base for all to authenticated
using (public.erp_is_superadmin()) with check (public.erp_is_superadmin());

grant insert on public.app_error_logs, public.app_error_log_users, public.app_feedback_reports, public.app_diagnostic_events to anon, authenticated, service_role;
grant select, update on public.app_error_logs, public.app_error_log_users, public.app_feedback_reports to authenticated, service_role;
grant select, insert, update, delete on public.app_bug_clusters, public.app_bug_reports_exports, public.app_ai_analysis_runs, public.app_ai_knowledge_base to authenticated, service_role;
