-- Restore Data API table privileges expected by the web/mobile app.
-- RLS remains the authority for row visibility and mutations.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.plans to anon, authenticated, service_role;

-- Anonymous probes should receive empty RLS-filtered result sets, not 401.
grant select on public.profiles to anon;
grant select on public.clients to anon;

grant select, insert, update on public.profiles to authenticated, service_role;
grant select, insert, update on public.erp_profiles to authenticated, service_role;
grant select, insert, update on public.clients to authenticated, service_role;
grant select, insert, update on public.subscriptions to authenticated, service_role;
grant select, insert, update on public.payments to authenticated, service_role;

grant select, insert, update on public.companies to authenticated, service_role;
grant select, insert, update, delete on public.company_members to authenticated, service_role;
grant select, insert, update on public.sync_settings to authenticated, service_role;
grant select, insert, update on public.erp_backups to authenticated, service_role;

grant insert on public.app_suggestions to anon, authenticated, service_role;
grant select, update on public.app_suggestions to authenticated, service_role;

grant insert on public.app_error_logs to anon, authenticated, service_role;
grant select, update on public.app_error_logs to authenticated, service_role;
grant insert on public.app_error_log_users to anon, authenticated, service_role;
grant select, update on public.app_error_log_users to authenticated, service_role;
grant insert on public.app_feedback_reports to anon, authenticated, service_role;
grant select, update on public.app_feedback_reports to authenticated, service_role;

grant insert on public.security_logs to authenticated, service_role;
grant insert on public.audit_logs to authenticated, service_role;
