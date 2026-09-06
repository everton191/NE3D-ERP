-- DRAFT ONLY: do not apply before migrating the admin profile PATCH flows to guarded RPCs.
-- Phase 2: identity/tenant/role writes belong to trusted provisioning RPCs.
-- Additive migration: do not rewrite previously applied migration history.
begin;

revoke insert, update, delete on public.profiles, public.erp_profiles
  from public, anon, authenticated;

-- Remove any prior column grants as well: table-level REVOKE alone is not enough.
do $$
declare
  v_table text;
  v_columns text;
begin
  foreach v_table in array array['profiles', 'erp_profiles'] loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
      into v_columns
      from information_schema.columns
      where table_schema = 'public' and table_name = v_table;
    execute format('revoke insert (%s), update (%s) on public.%I from public, anon, authenticated',
      v_columns, v_columns, v_table);
  end loop;
end $$;

-- RLS still decides whose row may be edited. These columns carry no tenant/role authority.
grant update (name, phone, updated_at, onboarding_completed, onboarding_step)
  on public.profiles to authenticated;
grant update (display_name, phone, updated_at, onboarding_completed, onboarding_step)
  on public.erp_profiles to authenticated;

-- Preserve the existing password-change acknowledgement flow; it is not tenant authority.
-- Server-side enforcement of password-change acknowledgement is a separate review item.
grant update (must_change_password) on public.erp_profiles to authenticated;

-- Auth provisioning and existing SECURITY DEFINER administration retain their privileges.
grant select, insert, update, delete on public.profiles, public.erp_profiles to service_role;

commit;
