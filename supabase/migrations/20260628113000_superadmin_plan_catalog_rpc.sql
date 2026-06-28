-- PL-02B inicial: leitura segura do catalogo persistido de planos para Superadmin.
-- Nao altera checkout, webhook ou assinatura real.

create or replace function public.get_superadmin_plan_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.erp_is_superadmin() then
    raise exception 'Acesso restrito ao Superadmin';
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'checkout_connected', false,
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'slug', p.slug,
          'name', p.name,
          'price', p.price,
          'active', p.active,
          'sort_order', p.sort_order,
          'kind', p.kind,
          'display_headline', p.display_headline,
          'display_subtitle', p.display_subtitle,
          'display_description', p.display_description,
          'display_badge', p.display_badge,
          'display_cta', p.display_cta,
          'display_tone', p.display_tone,
          'storefront_product_limit', p.storefront_product_limit,
          'ads_enabled', p.ads_enabled,
          'public_store_enabled', p.public_store_enabled,
          'share_link_enabled', p.share_link_enabled,
          'premium_themes_enabled', p.premium_themes_enabled,
          'capabilities', coalesce(p.capabilities, '{}'::jsonb),
          'metadata', coalesce(p.metadata, '{}'::jsonb),
          'prices', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', pp.id,
                'price_key', pp.price_key,
                'currency', pp.currency,
                'amount', pp.amount,
                'billing_period', pp.billing_period,
                'provider', pp.provider,
                'provider_price_id', pp.provider_price_id,
                'provider_plan_id', pp.provider_plan_id,
                'active', pp.active,
                'starts_at', pp.starts_at,
                'ends_at', pp.ends_at,
                'metadata', coalesce(pp.metadata, '{}'::jsonb)
              )
              order by pp.active desc, pp.starts_at desc, pp.created_at desc
            )
            from public.plan_prices pp
            where pp.plan_id = p.id
          ), '[]'::jsonb),
          'features', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', pf.id,
                'feature_key', pf.feature_key,
                'label', pf.label,
                'description', pf.description,
                'included', pf.included,
                'limit_value', pf.limit_value,
                'limit_unit', pf.limit_unit,
                'sort_order', pf.sort_order,
                'active', pf.active,
                'metadata', coalesce(pf.metadata, '{}'::jsonb)
              )
              order by pf.sort_order, pf.label
            )
            from public.plan_features pf
            where pf.plan_id = p.id
          ), '[]'::jsonb),
          'card_stats', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', ps.id,
                'stat_key', ps.stat_key,
                'label', ps.label,
                'value', ps.value,
                'icon', ps.icon,
                'sort_order', ps.sort_order,
                'active', ps.active,
                'metadata', coalesce(ps.metadata, '{}'::jsonb)
              )
              order by ps.sort_order, ps.label
            )
            from public.plan_card_stats ps
            where ps.plan_id = p.id
          ), '[]'::jsonb)
        )
        order by p.sort_order nulls last, p.price, p.slug
      )
      from public.plans p
      where p.slug in ('free', 'start', 'pro')
    ), '[]'::jsonb),
    'metrics', jsonb_build_object(
      'checkout_sessions', coalesce((select count(*) from public.checkout_sessions), 0),
      'payment_transactions', coalesce((select count(*) from public.payment_transactions), 0),
      'webhook_events', coalesce((select count(*) from public.webhook_events), 0),
      'company_overrides', coalesce((select count(*) from public.company_plan_overrides where active is true), 0),
      'scheduled_changes', coalesce((select count(*) from public.plan_change_schedules where status = 'scheduled'), 0),
      'usage_rows', coalesce((select count(*) from public.company_plan_usage), 0)
    )
  );
end;
$$;

revoke all on function public.get_superadmin_plan_catalog() from public, anon;
grant execute on function public.get_superadmin_plan_catalog() to authenticated;
