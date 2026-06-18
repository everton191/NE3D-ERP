alter function public.set_updated_at() set search_path = public, pg_catalog;
alter function private.telemetry_severity(text, text, text, text, integer) set search_path = pg_catalog;
alter function private.s3d_uuid_or_null(text) set search_path = pg_catalog;
alter function private.s3d_plan_code_from_slug(text) set search_path = pg_catalog;
alter function private.s3d_slug_from_plan_code(text, boolean) set search_path = pg_catalog;
alter function private.s3d_backup_payload_has_operational_data(jsonb) set search_path = pg_catalog;
alter function public.set_storefront_updated_at() set search_path = public, pg_catalog;
alter function public.storefront_owner_matches_store() set search_path = public, pg_catalog;
alter function public.storefront_image_owner_matches_product() set search_path = public, pg_catalog;
alter function public.diagnostics_severity_rank(text) set search_path = pg_catalog;

revoke all on function public.diagnostics_set_updated_at() from public, anon, authenticated;
grant execute on function public.diagnostics_set_updated_at() to service_role;

revoke all on function public.refresh_app_bug_cluster_from_error() from public, anon, authenticated;
grant execute on function public.refresh_app_bug_cluster_from_error() to service_role;

revoke all on function public.s3d_cleanup_subscription_state() from public, anon, authenticated;
grant execute on function public.s3d_cleanup_subscription_state() to service_role;

drop policy if exists "simplifica_assets_public_read" on storage.objects;
