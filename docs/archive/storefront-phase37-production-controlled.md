# Storefront Phase 3.7 - Production Controlled Apply

Status: applied to production in controlled mode.

## Project Refs

- Production: `qsufnnivlgdidmjuaprb`
- Staging: `dcaqiatgftkjxyewlhgi`
- Current linked ref after this phase: `qsufnnivlgdidmjuaprb`

## Backup

`supabase db dump` could not run because Docker/pg_dump is not available in this Windows environment.

Fallback backup performed:

- Logical REST backup of all public tables using service role.
- Schema metadata exported from `information_schema`, `pg_policies` and `pg_indexes`.
- Backup folder: `backups/storefront-phase37/main-qsufnnivlgdidmjuaprb-2026-05-22T18-17-39-590Z-logical`
- Public tables exported: 29
- Rows exported: 1860
- Approximate exported bytes: 2216924

The backup directory is ignored by git.

## Migration

Applied only:

- `supabase/migrations/20260522103000_storefront_phase3.sql`

Not applied:

- staging seed;
- mock data;
- staging test users;
- fake stores/products.

## Internal Controlled Store

Created one production-internal test store:

- slug: `ne3d-internal-test`
- active: `false`
- owner: internal allowed admin user

Created three internal products with `visible=false`:

- Carimbo personalizado
- Cortador de docinhos
- Suporte de projetor

Because the store is inactive and products/categories are invisible, public RLS does not expose this store.

## Validation

Validated:

- Storefront tables exist in production.
- RLS is enabled on Storefront tables.
- Policies exist on Storefront tables.
- Internal store exists and remains `active=false`.
- Anonymous role cannot read the internal inactive store.
- Staging seed slugs `ne3d-teste` and `maker-teste` were not inserted into production.
- Feature flag remains off by default because `STORE_FRONT_ENABLED` is absent unless explicitly set.

## Tests

Executed:

- `npm run test:storefront-production-controlled`
- `npm run test:storefront-phase3`
- `npm run test:storefront-phase3-5`
- `npm run test:storefront-rls-simulation`
- `npm run test:auth-hotfix`
- `npm run test:auth-ui`
- `npm run build:web`
- `storefront-preview: npm run build`
- `storefront-preview: npm run lint`
- `node --check app.js`
- `git diff --check`

## Notes

- Public lead creation must use `Prefer: return=minimal`.
- Returning lead rows to public users would require public read access to private leads, which is intentionally blocked by RLS.
- The feature remains unavailable globally until a future beta flag/release path is enabled.

## Recommendation

Ready for a closed beta plan, but not for public release. Keep feature flag disabled in production until beta users, admin UI and operational rollback steps are finalized.
