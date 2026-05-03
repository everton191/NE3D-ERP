-- Simplifica 3D online sync.
-- Run with: npx supabase link --project-ref qsufnnivlgdidmjuaprb && npx supabase db push

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.erp_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_id text not null,
  device_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.erp_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_id text not null,
  collection text not null check (collection in ('pedidos', 'estoque', 'caixa', 'clientes', 'configuracoes', 'usuarios', 'planos', 'orcamentos')),
  record_id text not null,
  data jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, collection, record_id)
);

drop trigger if exists set_erp_profiles_updated_at on public.erp_profiles;
create trigger set_erp_profiles_updated_at
before update on public.erp_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_erp_backups_updated_at on public.erp_backups;
create trigger set_erp_backups_updated_at
before update on public.erp_backups
for each row execute function public.set_updated_at();

drop trigger if exists set_erp_records_updated_at on public.erp_records;
create trigger set_erp_records_updated_at
before update on public.erp_records
for each row execute function public.set_updated_at();

alter table public.erp_profiles enable row level security;
alter table public.erp_backups enable row level security;
alter table public.erp_records enable row level security;

create or replace function public.erp_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.erp_profiles
    where id = auth.uid()
      and role = 'superadmin'
  );
$$;

drop policy if exists "profiles_select_own_or_superadmin" on public.erp_profiles;
create policy "profiles_select_own_or_superadmin"
on public.erp_profiles for select
using (id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "profiles_insert_own_user" on public.erp_profiles;
create policy "profiles_insert_own_user"
on public.erp_profiles for insert
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_update_own_user" on public.erp_profiles;
create policy "profiles_update_own_user"
on public.erp_profiles for update
using (id = auth.uid() and role = 'user')
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_superadmin_all" on public.erp_profiles;
create policy "profiles_superadmin_all"
on public.erp_profiles for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "backups_select_own_or_superadmin" on public.erp_backups;
create policy "backups_select_own_or_superadmin"
on public.erp_backups for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "backups_insert_own" on public.erp_backups;
create policy "backups_insert_own"
on public.erp_backups for insert
with check (user_id = auth.uid());

drop policy if exists "backups_update_own_or_superadmin" on public.erp_backups;
create policy "backups_update_own_or_superadmin"
on public.erp_backups for update
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "records_select_own_or_superadmin" on public.erp_records;
create policy "records_select_own_or_superadmin"
on public.erp_records for select
using (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "records_insert_own" on public.erp_records;
create policy "records_insert_own"
on public.erp_records for insert
with check (user_id = auth.uid());

drop policy if exists "records_update_own_or_superadmin" on public.erp_records;
create policy "records_update_own_or_superadmin"
on public.erp_records for update
using (user_id = auth.uid() or public.erp_is_superadmin())
with check (user_id = auth.uid() or public.erp_is_superadmin());

drop policy if exists "records_delete_own_or_superadmin" on public.erp_records;
create policy "records_delete_own_or_superadmin"
on public.erp_records for delete
using (user_id = auth.uid() or public.erp_is_superadmin());

create index if not exists idx_erp_backups_user_id on public.erp_backups(user_id);
create index if not exists idx_erp_records_user_collection on public.erp_records(user_id, collection);
create index if not exists idx_erp_records_owner_collection on public.erp_records(owner_id, collection);
