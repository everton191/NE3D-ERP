-- Ativa a matriz comercial canonica Free, Start e Pro.
-- Slugs legados permanecem no banco apenas para compatibilidade historica.

update public.plans
set active = case
      when slug in ('free', 'start', 'pro') then true
      else false
    end,
    updated_at = now()
where slug in ('free', 'start', 'pro', 'premium', 'premium_trial');

update public.app_billing_feature_flags
set enabled = true,
    metadata = coalesce(metadata, '{}'::jsonb)
      || '{"env":"START_PLAN_ENABLED","default":"true","commercial_status":"active"}'::jsonb,
    updated_at = now()
where feature_key = 'start_plan_enabled';

update public.app_billing_feature_flags
set enabled = true,
    updated_at = now()
where feature_key in (
  'mercado_pago_start_plan_id_configured',
  'mercado_pago_pro_plan_id_configured'
);
