# Storefront Phase 3.6 - Supabase Staging

Status: staging validated with real remote migration, seed, RLS, lead and order draft.

## Production Safety

- Main project ref: `qsufnnivlgdidmjuaprb`.
- Current workspace link points to staging after this phase: `dcaqiatgftkjxyewlhgi`.
- All staging scripts block `SUPABASE_STAGING_PROJECT_REF=qsufnnivlgdidmjuaprb`.
- `STAGING_CONFIRM=true` is required for remote staging actions.
- No `supabase db push` was executed against the main project.
- The Storefront migration was applied through a guarded staging-only SQL execution, not against production.

## Environment

Create a real `.env.staging` from `.env.staging.example`:

```env
SUPABASE_STAGING_PROJECT_REF=
SUPABASE_STAGING_ORG_ID=
SUPABASE_STAGING_REGION=sa-east-1
SUPABASE_STAGING_PROJECT_NAME=simplifica3d-staging
SUPABASE_STAGING_DB_PASSWORD=

VITE_SUPABASE_URL_STAGING=
VITE_SUPABASE_ANON_KEY_STAGING=
SUPABASE_SERVICE_ROLE_STAGING=

STORE_FRONT_ENABLED=true
STAGING_CONFIRM=true
```

`.env.staging` is ignored by git. `.env.staging.example` is versioned.

## Scripts

- `npm run supabase:staging:status`
- `npm run supabase:staging:create`
- `npm run supabase:staging:link`
- `npm run supabase:staging:push`
- `npm run supabase:staging:seed`
- `npm run test:storefront-staging`

## Expected Remote Sequence

1. Create or confirm a dedicated Supabase project named `simplifica3d-staging`.
2. Fill `.env.staging` with the staging ref, URL, anon key and service role.
3. Set `STAGING_CONFIRM=true`.
4. Run `npm run supabase:staging:link`.
5. Confirm the linked ref is staging with `npm run supabase:staging:status`.
6. Run `npm run supabase:staging:push`.
7. Run `npm run supabase:staging:seed`.
8. Run `npm run test:storefront-staging`.

This sequence was executed against project ref `dcaqiatgftkjxyewlhgi`.

## Real RLS Tests Covered

When staging credentials are configured, `test:storefront-staging` validates:

- public reads active store `ne3d-teste`;
- public reads visible products;
- public cannot list private leads;
- public creates a limited lead;
- public creates visit/event records;
- `user-a` lists only own leads;
- `user-b` cannot see `user-a` leads;
- `user-b` cannot update `user-a` product;
- `user-a` converts a lead into `store_order_drafts`.

## Seed Data

The staging seed uses only Simplifica 3D examples:

- Carimbo personalizado
- Cortador de docinhos
- Ejetor de brigadeiro
- Topo de bolo
- Suporte de projetor
- Chaveiro personalizado
- Peca sob encomenda
- Brinde personalizado

No unrelated business examples are included.

## Current Result

Validated staging project:

- project ref: `dcaqiatgftkjxyewlhgi`;
- URL: `https://dcaqiatgftkjxyewlhgi.supabase.co`;
- migration applied on staging;
- seed applied on staging;
- `user-a` and `user-b` created/found in staging auth;
- public store `ne3d-teste` loaded;
- public visible products loaded;
- public lead insert works with `return=minimal`;
- public lead list stays private;
- owner can list own lead;
- another owner cannot list or mutate owner data;
- lead conversion created `store_order_drafts`;
- production project `qsufnnivlgdidmjuaprb` was not modified.

Important implementation note:

- Public lead creation must use `Prefer: return=minimal`. Returning the inserted lead would require public read access to private leads, which is intentionally blocked by RLS.
