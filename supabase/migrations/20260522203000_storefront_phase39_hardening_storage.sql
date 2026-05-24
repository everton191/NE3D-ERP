-- Simplifica 3D Storefront Fase 3.9
-- Beta fechado, hardening de acesso administrativo e Storage para imagens.

create or replace function public.storefront_is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result boolean := false;
begin
  if to_regprocedure('public.erp_is_superadmin()') is not null then
    execute 'select public.erp_is_superadmin()' into v_result;
    return coalesce(v_result, false);
  end if;
  return false;
exception
  when undefined_function then
    return false;
end;
$$;

revoke all on function public.storefront_is_admin() from public, anon;
grant execute on function public.storefront_is_admin() to authenticated, service_role;

create table if not exists public.storefront_beta_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefront_beta_users_identity_check check (user_id is not null or nullif(trim(email), '') is not null)
);

create unique index if not exists idx_storefront_beta_users_user_id
on public.storefront_beta_users(user_id)
where user_id is not null;

create unique index if not exists idx_storefront_beta_users_email
on public.storefront_beta_users(lower(email))
where email is not null;

create index if not exists idx_storefront_beta_users_enabled
on public.storefront_beta_users(enabled, created_at desc);

drop trigger if exists trg_storefront_beta_users_updated_at on public.storefront_beta_users;
create trigger trg_storefront_beta_users_updated_at
before update on public.storefront_beta_users
for each row execute function public.set_storefront_updated_at();

alter table public.storefront_beta_users enable row level security;

drop policy if exists "storefront beta users read own access" on public.storefront_beta_users;
create policy "storefront beta users read own access"
on public.storefront_beta_users
for select
using (
  enabled = true
  and auth.uid() is not null
  and (
    user_id = auth.uid()
    or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.storefront_is_admin()
  )
);

drop policy if exists "storefront beta users superadmin manage" on public.storefront_beta_users;
create policy "storefront beta users superadmin manage"
on public.storefront_beta_users
for all
using (public.storefront_is_admin())
with check (public.storefront_is_admin());

grant select on public.storefront_beta_users to authenticated;
grant all on public.storefront_beta_users to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'storefront-assets',
  'storefront-assets',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storefront_assets_public_read_published" on storage.objects;
create policy "storefront_assets_public_read_published"
on storage.objects
for select
using (
  bucket_id = 'storefront-assets'
  and (
    exists (
      select 1
      from public.stores s
      where s.id::text = (storage.foldername(name))[2]
        and s.owner_id::text = (storage.foldername(name))[1]
        and s.active = true
        and (storage.foldername(name))[3] in ('logo', 'banner')
    )
    or exists (
      select 1
      from public.store_products p
      join public.stores s on s.id = p.store_id
      where p.id::text = (storage.foldername(name))[4]
        and p.store_id::text = (storage.foldername(name))[2]
        and p.owner_id::text = (storage.foldername(name))[1]
        and s.active = true
        and p.visible = true
        and (storage.foldername(name))[3] = 'products'
    )
  )
);

drop policy if exists "storefront_assets_owner_read" on storage.objects;
create policy "storefront_assets_owner_read"
on storage.objects
for select
using (
  bucket_id = 'storefront-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.storefront_is_admin())
);

drop policy if exists "storefront_assets_owner_insert" on storage.objects;
create policy "storefront_assets_owner_insert"
on storage.objects
for insert
with check (
  bucket_id = 'storefront-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.storefront_is_admin())
  and lower(name) ~ '\.(jpg|jpeg|png|webp)$'
);

drop policy if exists "storefront_assets_owner_update" on storage.objects;
create policy "storefront_assets_owner_update"
on storage.objects
for update
using (
  bucket_id = 'storefront-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.storefront_is_admin())
)
with check (
  bucket_id = 'storefront-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.storefront_is_admin())
  and lower(name) ~ '\.(jpg|jpeg|png|webp)$'
);

drop policy if exists "storefront_assets_owner_delete" on storage.objects;
create policy "storefront_assets_owner_delete"
on storage.objects
for delete
using (
  bucket_id = 'storefront-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1] = auth.uid()::text or public.storefront_is_admin())
);
