# Storefront Phase 3.5 Validation Report

Status: prepared locally, not applied to production.

## Environment

- Linked Supabase project found: `qsufnnivlgdidmjuaprb`.
- No separate staging project was configured in this workspace.
- Because there is no explicit staging target and no explicit approval to apply production migrations, the migration was **not applied remotely**.
- No `supabase db push`, linked migration apply, production seed, or remote schema mutation was executed in this validation.

## Migration Reviewed

- `supabase/migrations/20260522103000_storefront_phase3.sql`

Prepared tables:

- `stores`
- `store_categories`
- `store_products`
- `store_product_images`
- `store_cart_leads`
- `store_order_drafts`
- `store_visits`
- `store_events`

Reviewed protections:

- Owner-scoped records through `owner_id`.
- Public reads only for active stores and visible products/categories.
- Public inserts only for leads, visits and events.
- Private management restricted by `owner_id = auth.uid()`.
- Guards to prevent mismatched `store_id` and `owner_id`.
- Static guard checks reject `drop table`, `drop schema`, `truncate`, `delete from` and `alter table public.*` outside the Storefront module.

## RLS Simulation

Validated locally through:

- `scripts/test-storefront-rls-simulation.js`
- `scripts/test-storefront-phase35.js`

- User A sees only private data from Store A.
- User B sees only private data from Store B.
- Public sees only active stores.
- Public sees only visible products.
- Public sees only visible categories.
- Public cannot edit products.
- Public cannot list private leads.
- Public can create a limited lead only for an active store.
- Public can create limited visit/event records for an active store.
- Stock rules were simulated for `unlimited`, `manual`, `erp_linked` and `unavailable`.

Simulated users:

- `user-a`: owner of `ne3d-teste`
- `user-b`: owner of `maker-teste`
- `anon`: public visitor

## Test Data Plan

Staging slug:

- `ne3d-teste`

Products:

- Carimbo personalizado
- Cortador de docinhos
- Ejetor de brigadeiro
- Topo de bolo
- Suporte de projetor
- Chaveiro personalizado
- Peça sob encomenda
- Brinde personalizado

Categories:

- Personalizados
- Cortadores
- Carimbos
- Suportes
- Brindes
- Sob encomenda

No optical/eyewear products are part of the test dataset.

Local/mock seed:

- `src/storefront/mock/storefrontPhase35Seed.ts`
- `supabase/seed_storefront_phase35_test.sql` is only a staging template and was not executed.

## ERP Panel

Prepared behind a local feature flag:

- `localStorage.setItem("STORE_FRONT_ENABLED", "true")`

The ERP menu shows `Loja Online` only when:

- feature flag is enabled;
- user is superadmin or an allowed test user;
- current plan is eligible.

With the flag disabled or absent, the menu entry is not shown and the current ERP navigation remains unchanged.

## Public Preview

Validated locally with mock data:

- `/loja/ne3d-teste`
- banner, categories, product grid and cart render correctly;
- product detail route opens;
- adding to cart opens the drawer;
- quantity change and item removal work;
- WhatsApp message generation is wired through the local best-effort integration;
- local lead registration is best-effort and must not block WhatsApp.

## Builds

Executed successfully:

- `npm run test:storefront-phase3`
- `npm run test:storefront-phase3-5`
- `npm run test:storefront-rls-simulation`
- `npm run build:web`
- `storefront-preview: npm run build`
- `storefront-preview: npm run lint`

## Recommendation

Do not advance to Phase 4 yet. Next step is creating a real staging Supabase project or approving a controlled production test window.
