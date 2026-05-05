-- Keep anon REST access from evaluating authenticated-only superadmin helpers.

drop policy if exists "plans_select_active_or_superadmin" on public.plans;
drop policy if exists "plans_superadmin_all" on public.plans;

create policy "plans_select_active_anon"
on public.plans for select
to anon
using (active = true);

create policy "plans_select_active_or_superadmin"
on public.plans for select
to authenticated
using (active = true or public.erp_is_superadmin());

create policy "plans_superadmin_all"
on public.plans for all
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "clients_select_own_or_superadmin" on public.clients;
drop policy if exists "clients_update_admin_or_superadmin" on public.clients;

create policy "clients_select_none_anon"
on public.clients for select
to anon
using (false);

create policy "clients_select_own_or_superadmin"
on public.clients for select
to authenticated
using (public.erp_is_superadmin() or id = public.erp_current_client_id());

create policy "clients_update_admin_or_superadmin"
on public.clients for update
to authenticated
using (public.erp_is_client_admin(id))
with check (public.erp_is_client_admin(id));
