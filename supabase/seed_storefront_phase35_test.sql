-- Storefront Phase 3.6 staging seed.
-- Do not run in production.
-- The placeholders __USER_A_ID__ and __USER_B_ID__ are replaced by
-- scripts/apply-storefront-staging-seed.js after creating/finding staging auth users.

insert into public.stores (id, owner_id, slug, name, description, whatsapp, instagram, active, theme_config)
values
  ('00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'ne3d-teste', 'NE 3D Teste', 'Loja de teste para produtos de impressao 3D.', '5599999999999', 'ne3dteste', true, '{}'::jsonb),
  ('00000000-0000-4000-8000-0000000000b1', '__USER_B_ID__', 'maker-teste', 'Maker Teste', 'Segunda loja para validacao multiusuario.', '5588888888888', null, true, '{}'::jsonb)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  whatsapp = excluded.whatsapp,
  instagram = excluded.instagram,
  active = excluded.active,
  theme_config = excluded.theme_config;

insert into public.store_categories (id, store_id, owner_id, name, slug, order_index, visible)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'Personalizados', 'personalizados', 1, true),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'Cortadores', 'cortadores', 2, true),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'Carimbos', 'carimbos', 3, true),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'Suportes', 'suportes', 4, true),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'Brindes', 'brindes', 5, true),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', 'Sob encomenda', 'sob-encomenda', 6, true),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-0000000000b1', '__USER_B_ID__', 'Brindes', 'brindes', 1, true)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  slug = excluded.slug,
  order_index = excluded.order_index,
  visible = excluded.visible;

insert into public.store_products (
  id, store_id, owner_id, erp_product_id, title, slug, description, price, compare_price,
  category_id, visible, featured, is_customizable, estimated_production_time, stock_mode, stock_quantity
)
values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Carimbo personalizado', 'carimbo-personalizado', 'Carimbo com nome, marca ou arte simples.', 39.90, null, '00000000-0000-4000-8000-000000000103', true, true, true, '2 a 4 dias uteis', 'unlimited', null),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Cortador de docinhos', 'cortador-de-docinhos', 'Cortador para confeitaria e festas.', 24.90, null, '00000000-0000-4000-8000-000000000102', true, true, true, '1 a 3 dias uteis', 'manual', 12),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Ejetor de brigadeiro', 'ejetor-de-brigadeiro', 'Acessorio para padronizar brigadeiros e doces.', 32.90, null, '00000000-0000-4000-8000-000000000102', true, false, true, '2 a 4 dias uteis', 'manual', 8),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Topo de bolo', 'topo-de-bolo', 'Topo de bolo personalizado por nome e tema.', 44.90, null, '00000000-0000-4000-8000-000000000101', true, true, true, '3 a 5 dias uteis', 'unlimited', null),
  ('00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Suporte de projetor', 'suporte-de-projetor', 'Suporte sob medida para projetor compacto.', 79.90, 94.90, '00000000-0000-4000-8000-000000000104', true, true, false, '3 a 5 dias uteis', 'erp_linked', null),
  ('00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Chaveiro personalizado', 'chaveiro-personalizado', 'Chaveiro com nome, logo ou desenho simples.', 19.90, null, '00000000-0000-4000-8000-000000000105', true, true, true, '1 a 2 dias uteis', 'unlimited', null),
  ('00000000-0000-4000-8000-000000001007', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Peca sob encomenda', 'peca-sob-encomenda', 'Peca personalizada para reposicao, prototipo ou solucao especifica.', 59.90, null, '00000000-0000-4000-8000-000000000106', true, false, true, '4 a 7 dias uteis', 'unlimited', null),
  ('00000000-0000-4000-8000-000000001008', '00000000-0000-4000-8000-0000000000a1', '__USER_A_ID__', null, 'Brinde personalizado', 'brinde-personalizado', 'Brinde compacto para eventos, empresas e lembrancas.', 14.90, null, '00000000-0000-4000-8000-000000000105', true, false, true, '2 a 5 dias uteis', 'manual', 30),
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-0000000000b1', '__USER_B_ID__', null, 'Brinde maker teste', 'brinde-maker-teste', 'Produto da segunda loja para validar isolamento.', 18.90, null, '00000000-0000-4000-8000-000000000201', true, true, true, '2 a 4 dias uteis', 'unlimited', null)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  price = excluded.price,
  compare_price = excluded.compare_price,
  category_id = excluded.category_id,
  visible = excluded.visible,
  featured = excluded.featured,
  is_customizable = excluded.is_customizable,
  estimated_production_time = excluded.estimated_production_time,
  stock_mode = excluded.stock_mode,
  stock_quantity = excluded.stock_quantity;

insert into public.store_product_images (id, product_id, store_id, owner_id, image_url, alt_text, order_index)
select
  gen_random_uuid(),
  p.id,
  p.store_id,
  p.owner_id,
  'mock://storefront-staging/' || p.slug || '.jpg',
  p.title,
  0
from public.store_products p
where p.store_id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b1')
  and not exists (
    select 1 from public.store_product_images i
    where i.product_id = p.id and i.order_index = 0
  );

insert into public.store_cart_leads (
  id, store_id, owner_id, customer_name, customer_phone, customer_note, items_json,
  subtotal, whatsapp_message, status, source
)
values
  (
    '00000000-0000-4000-8000-00000000a901',
    '00000000-0000-4000-8000-0000000000a1',
    '__USER_A_ID__',
    'Cliente teste',
    null,
    'Lead criado pelo seed staging da Fase 3.6.',
    '[{"product_id":"00000000-0000-4000-8000-000000001001","title":"Carimbo personalizado","quantity":1,"unit_price":39.9,"subtotal":39.9}]'::jsonb,
    39.90,
    'Ola! Tenho interesse em 1x Carimbo personalizado.',
    'novo',
    'storefront-staging-seed'
  )
on conflict (id) do update set
  owner_id = excluded.owner_id,
  status = excluded.status,
  items_json = excluded.items_json,
  subtotal = excluded.subtotal,
  whatsapp_message = excluded.whatsapp_message;

insert into public.store_visits (id, store_id, product_id, event_type, session_id, user_agent, referrer)
values
  ('00000000-0000-4000-8000-00000000a801', '00000000-0000-4000-8000-0000000000a1', null, 'store_view', 'phase36-seed', 'phase36-seed', null),
  ('00000000-0000-4000-8000-00000000a802', '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000001001', 'product_view', 'phase36-seed', 'phase36-seed', null)
on conflict (id) do nothing;

insert into public.store_events (id, store_id, product_id, event_type, metadata_json)
values
  ('00000000-0000-4000-8000-00000000a701', '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000001001', 'add_to_cart', '{"source":"phase36-seed"}'::jsonb),
  ('00000000-0000-4000-8000-00000000a702', '00000000-0000-4000-8000-0000000000a1', null, 'whatsapp_click', '{"source":"phase36-seed"}'::jsonb),
  ('00000000-0000-4000-8000-00000000a703', '00000000-0000-4000-8000-0000000000a1', null, 'lead_created', '{"lead_id":"00000000-0000-4000-8000-00000000a901"}'::jsonb)
on conflict (id) do nothing;
