drop policy if exists "diagnostics feedback insert own" on public.app_feedback_reports;
drop policy if exists "diagnostics feedback insert superadmin" on public.app_feedback_reports;

create policy "diagnostics feedback insert own"
on public.app_feedback_reports
for insert
to anon, authenticated
with check (user_id is null or user_id = auth.uid());

create policy "diagnostics feedback insert superadmin"
on public.app_feedback_reports
for insert
to authenticated
with check (public.erp_is_superadmin());
