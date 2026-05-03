-- Simplifica 3D security layer: profiles, permissions and audit logs.

alter table public.erp_profiles
  add column if not exists phone text,
  add column if not exists company_id uuid,
  add column if not exists status text not null default 'active',
  add column if not exists must_change_password boolean not null default false,
  add column if not exists last_login_at timestamptz;

alter table public.erp_profiles
  drop constraint if exists erp_profiles_role_check;

alter table public.erp_profiles
  add constraint erp_profiles_role_check
  check (role in ('user', 'admin', 'superadmin', 'operador', 'visualizador'));

alter table public.erp_profiles
  drop constraint if exists erp_profiles_status_check;

alter table public.erp_profiles
  add constraint erp_profiles_status_check
  check (status in ('active', 'inactive', 'blocked'));

create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  result text not null default 'success',
  details text,
  device_id text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.security_logs enable row level security;

drop policy if exists "security_logs_select_own_or_superadmin" on public.security_logs;
create policy "security_logs_select_own_or_superadmin"
on public.security_logs for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "security_logs_insert_own" on public.security_logs;
create policy "security_logs_insert_own"
on public.security_logs for insert
with check (user_id = auth.uid() or user_id is null);

drop policy if exists "security_logs_superadmin_all" on public.security_logs;
create policy "security_logs_superadmin_all"
on public.security_logs for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

create index if not exists idx_security_logs_user_created on public.security_logs(user_id, created_at desc);
create index if not exists idx_security_logs_actor_created on public.security_logs(actor_email, created_at desc);

update public.erp_profiles
set role = 'superadmin',
    status = 'active'
where email = 'paessilvae@gmail.com';
