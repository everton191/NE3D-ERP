alter table public.app_error_logs
  add column if not exists updated_at timestamptz not null default now();

update public.app_error_logs
set updated_at = coalesce(updated_at, last_seen_at, created_at, now())
where updated_at is null;

comment on column public.app_error_logs.updated_at is
  'Timestamp maintained by telemetry and diagnostics update triggers.';
