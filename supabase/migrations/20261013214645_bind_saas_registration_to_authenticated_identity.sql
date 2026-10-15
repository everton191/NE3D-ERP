begin;

-- p_email is a compatibility argument, never proof of tenant ownership.
-- Read Auth's current identity rather than metadata or a stale JWT email claim.
do $identity$
declare
  v_definition text := pg_get_functiondef('public.register_saas_client(text,text,text,text,text,integer)'::regprocedure);
  v_anchor constant text := '  if v_email = '''' then';
  v_guard constant text := $guard$
  if not exists (
    select 1 from auth.users u
    where u.id = v_user_id
      and nullif(lower(trim(u.email)), '') = v_email
  ) then
    raise exception 'E-mail nao pertence ao usuario autenticado' using errcode = '42501';
  end if;

$guard$;
begin
  if (length(v_definition) - length(replace(v_definition, v_anchor, ''))) / length(v_anchor) <> 1 then
    raise exception 'Contrato de cadastro inesperado';
  end if;
  execute replace(v_definition, v_anchor, v_guard || v_anchor);
end;
$identity$;

-- Login and license resolution reuse persisted profile links. An authenticated
-- client must not be able to forge those links through a direct table write.
-- Invoker rights distinguish direct API writes from trusted definer provisioning.
create or replace function private.s3d_guard_profile_tenant_links()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if current_user = 'anon' then
    raise exception 'Perfil exige autenticacao' using errcode = '42501';
  end if;
  if current_user = 'authenticated' and not public.erp_is_superadmin() then
    if TG_OP = 'INSERT' then
      if new.client_id is not null or new.company_id is not null then
        raise exception 'Vinculos do perfil sao definidos pelo servidor' using errcode = '42501';
      end if;
    elsif new.client_id is distinct from old.client_id
      or new.company_id is distinct from old.company_id
      or (to_jsonb(new)->'id') is distinct from (to_jsonb(old)->'id')
      or (to_jsonb(new)->'user_id') is distinct from (to_jsonb(old)->'user_id') then
      raise exception 'Vinculos do perfil sao definidos pelo servidor' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
alter function private.s3d_guard_profile_tenant_links() owner to postgres;
revoke all on function private.s3d_guard_profile_tenant_links() from public, anon, authenticated, service_role;

create trigger s3d_guard_profile_tenant_links
before insert or update on public.profiles
for each row execute function private.s3d_guard_profile_tenant_links();

create trigger s3d_guard_profile_tenant_links
before insert or update on public.erp_profiles
for each row execute function private.s3d_guard_profile_tenant_links();

notify pgrst, 'reload schema';
commit;
