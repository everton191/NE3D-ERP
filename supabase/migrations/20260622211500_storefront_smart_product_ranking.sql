create index if not exists idx_store_events_product_created_at
  on public.store_events (store_id, product_id, created_at desc)
  where product_id is not null;

create or replace function public.get_storefront_product_ranking(p_store_id uuid)
returns table (
  product_id uuid,
  view_count bigint,
  click_count bigint,
  cart_count bigint,
  lead_count bigint,
  smart_score numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    e.product_id,
    count(*) filter (where e.event_type = 'product_view') as view_count,
    count(*) filter (where e.event_type = 'whatsapp_click') as click_count,
    count(*) filter (where e.event_type = 'add_to_cart') as cart_count,
    count(*) filter (where e.event_type = 'lead_created') as lead_count,
    greatest(0, sum(case e.event_type
      when 'product_view' then 1
      when 'whatsapp_click' then 3
      when 'add_to_cart' then 5
      when 'lead_created' then 9
      when 'remove_from_cart' then -2
      else 0
    end))::numeric as smart_score
  from public.store_events e
  inner join public.stores s on s.id = e.store_id
  where e.store_id = p_store_id
    and e.product_id is not null
    and e.created_at >= now() - interval '90 days'
    and (s.active = true or s.owner_id = auth.uid())
  group by e.product_id
  order by smart_score desc, e.product_id;
$$;

revoke all on function public.get_storefront_product_ranking(uuid) from public;
grant execute on function public.get_storefront_product_ranking(uuid) to anon, authenticated;
