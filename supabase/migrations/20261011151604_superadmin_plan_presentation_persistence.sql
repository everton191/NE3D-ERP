-- Visual presentation only: never changes plans.price, plan_prices, billing,
-- capabilities, plan_features, checkout IDs or existing subscriptions.
begin;

create or replace function private.superadmin_update_plan_presentation_impl(
  p_slug text, p_changes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $function$
declare
  v_actor uuid := auth.uid();
  v_slug text := lower(trim(coalesce(p_slug, '')));
  v_key text;
  v_value jsonb;
  v_clean jsonb := '{}'::jsonb;
  v_old jsonb;
  v_saved jsonb;
  v_updated_at timestamptz;
  v_text_limit integer;
begin
  if v_actor is null then
    raise exception 'Usuario nao autenticado' using errcode = '28000';
  end if;
  if not public.erp_is_superadmin() then
    raise exception 'Apenas superadmin pode editar a apresentacao dos planos' using errcode = '42501';
  end if;
  if v_slug not in ('free', 'start', 'pro') then
    raise exception 'Plano invalido' using errcode = '22023';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' or p_changes = '{}'::jsonb then
    raise exception 'Alteracoes invalidas' using errcode = '22023';
  end if;

  for v_key, v_value in select key, value from jsonb_each(p_changes) loop
    if v_key not in ('name', 'headline', 'description', 'badge', 'ctaLabel', 'priceLabel', 'features') then
      raise exception 'Campo de apresentacao invalido: %', v_key using errcode = '22023';
    end if;
    if v_key = 'features' then
      if jsonb_typeof(v_value) <> 'array' or jsonb_array_length(v_value) > 16
        or exists (select 1 from jsonb_array_elements(v_value) as elements(item)
          where jsonb_typeof(item) <> 'string' or length(trim(item #>> '{}')) > 180
            or trim(item #>> '{}') = '') then
        raise exception 'Lista de beneficios invalida' using errcode = '22023';
      end if;
      select coalesce(jsonb_agg(to_jsonb(trim(value))), '[]'::jsonb)
        into v_value from jsonb_array_elements_text(v_value) as benefits(value);
      v_clean := v_clean || jsonb_build_object(v_key, v_value);
    else
      v_text_limit := case when v_key = 'description' then 600
        when v_key = 'headline' then 120 else 80 end;
      if jsonb_typeof(v_value) <> 'string' or length(trim(v_value #>> '{}')) > v_text_limit then
        raise exception 'Texto de apresentacao invalido: %', v_key using errcode = '22023';
      end if;
      if v_key in ('name', 'headline', 'description', 'priceLabel') and trim(v_value #>> '{}') = '' then
        raise exception 'Campo de apresentacao obrigatorio: %', v_key using errcode = '22023';
      end if;
      v_clean := v_clean || jsonb_build_object(v_key, trim(v_value #>> '{}'));
    end if;
  end loop;

  select case when jsonb_typeof(p.metadata->'presentation') = 'object'
    then p.metadata->'presentation' else '{}'::jsonb end
    into v_old from public.plans p where p.slug = v_slug for update;
  if not found then
    raise exception 'Plano nao encontrado' using errcode = 'P0002';
  end if;
  update public.plans p
  set metadata = jsonb_set(coalesce(p.metadata, '{}'::jsonb), '{presentation}',
      v_old || v_clean, true), updated_at = now()
  where p.slug = v_slug
  returning p.metadata->'presentation', p.updated_at into v_saved, v_updated_at;
  if not found then
    raise exception 'Apresentacao nao persistida' using errcode = 'P0002';
  end if;
  insert into public.audit_logs (user_id, client_id, action, details)
  values (v_actor, null, 'superadmin_update_plan_presentation',
    jsonb_build_object('slug', v_slug, 'previous', v_old, 'saved', v_saved,
      'actor_user_id', v_actor, 'operated_at', now()));
  return jsonb_build_object('slug', v_slug, 'presentation', v_saved,
    'updated_at', v_updated_at);
end;
$function$;

create or replace function public.superadmin_update_plan_presentation(
  p_slug text, p_changes jsonb
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.superadmin_update_plan_presentation_impl(p_slug, p_changes);
$function$;

revoke all on function private.superadmin_update_plan_presentation_impl(text, jsonb) from public, anon;
grant execute on function private.superadmin_update_plan_presentation_impl(text, jsonb) to authenticated, service_role;
revoke all on function public.superadmin_update_plan_presentation(text, jsonb) from public, anon;
grant execute on function public.superadmin_update_plan_presentation(text, jsonb) to authenticated, service_role;

commit;
