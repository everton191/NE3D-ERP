alter table public.app_error_log_users
  add column if not exists updated_at timestamptz not null default now();

comment on column public.app_error_log_users.updated_at is
  'Timestamp maintained when a user occurrence is deduplicated.';
