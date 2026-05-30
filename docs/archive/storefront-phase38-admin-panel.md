# Storefront Phase 3.8 - ERP Admin Panel

Status: implemented behind feature flag.

## Access

The ERP menu item `Loja Online` appears only when:

- `STORE_FRONT_ENABLED=true` or `localStorage.setItem("STORE_FRONT_ENABLED", "true")`;
- the user is an allowed internal tester or superadmin;
- plan rules allow the storefront.

With the flag disabled, the menu remains hidden and no storefront admin data is loaded.

## Tabs

The `Loja Online` screen now has:

- Visão geral
- Aparência
- Categorias
- Produtos da loja
- Leads/Pedidos
- QR Code e Link

## Implemented Admin Actions

- Edit public store name, slug, description, WhatsApp, Instagram, logo URL, banner URL and theme colors.
- Toggle store active/inactive status.
- Create, edit, hide and delete categories.
- Prevent deleting categories linked to products.
- Create/edit public products.
- Configure public title, slug, description, public price, promotional price, price mode, category, visibility, featured flag, customization flag, production time and stock mode.
- Add/remove product image previews with per-plan limits.
- List leads, update lead status, open WhatsApp and convert lead to local order draft.
- Copy public link and download QR Code.

## Data And Safety

- The panel uses local fallback storage so the ERP does not break when Supabase is offline or the user session is not ready.
- Remote sync is attempted only when a valid Supabase session exists.
- Public lead creation remains `return=minimal` to avoid exposing private lead rows.
- Internal cost, margin and profit fields are not exposed in the storefront admin UI.
- Product removal only removes the product from the storefront list; it does not delete ERP inventory or internal products.

## Schema Preparation

Prepared non-destructive migration:

- `supabase/migrations/20260522183000_storefront_phase38_admin_fields.sql`

It adds optional admin fields for category icons and product price display modes. It is versioned but should be applied through the same controlled process used in Phase 3.7 when ready.

## Remaining For Closed Beta

- Wire Supabase Storage bucket policy for final logo/banner/product image uploads.
- Replace local image previews with Storage URLs.
- Add full remote CRUD integration for all new optional Phase 3.8 fields after migration is applied.
- Add a controlled beta allowlist rather than broad internal tester checks.
