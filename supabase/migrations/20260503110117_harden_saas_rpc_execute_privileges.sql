-- Simplifica 3D pre-launch hardening.
-- Keep SaaS RPCs callable only by signed-in users and remove direct public execution
-- from internal helper functions that do not need to be exposed through PostgREST.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.register_saas_client(text, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.register_saas_client(text, text, text, text, text, integer) to authenticated;

revoke execute on function public.get_saas_license() from public, anon, authenticated;
grant execute on function public.get_saas_license() to authenticated;

revoke execute on function public.redeem_promotional_token(text) from public, anon, authenticated;
grant execute on function public.redeem_promotional_token(text) to authenticated;

revoke execute on function public.register_saas_session(text, text) from public, anon, authenticated;
grant execute on function public.register_saas_session(text, text) to authenticated;

revoke execute on function public.touch_client_access() from public, anon, authenticated;
grant execute on function public.touch_client_access() to authenticated;

revoke execute on function public.mark_inactive_clients(integer) from public, anon, authenticated;
revoke execute on function public.next_s3d_client_code() from public, anon, authenticated;
revoke execute on function public.plan_slug_from_id(uuid) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
