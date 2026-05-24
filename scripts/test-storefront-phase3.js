const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "supabase/migrations/20260522103000_storefront_phase3.sql",
  "src/storefront/services/storefront-public.service.ts",
  "src/storefront/services/storefront-admin.service.ts",
  "src/storefront/services/storefront-leads.service.ts",
  "src/storefront/services/storefront-analytics.service.ts",
  "src/storefront/adapters/product.adapter.ts",
  "src/storefront/adapters/cart.adapter.ts",
  "src/storefront/adapters/order.adapter.ts",
  "src/storefront/plans/storefrontPlanRules.ts",
  "src/storefront/stock/storefrontStockPolicy.ts",
];

const migration = fs.readFileSync(path.join(root, requiredFiles[0]), "utf8");
const requiredTables = [
  "stores",
  "store_categories",
  "store_products",
  "store_product_images",
  "store_cart_leads",
  "store_order_drafts",
  "store_visits",
  "store_events",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Arquivo obrigatório ausente: ${file}`);
  }
}

for (const table of requiredTables) {
  if (!migration.includes(`public.${table}`)) {
    throw new Error(`Tabela não preparada na migration: ${table}`);
  }
}

const requiredPolicies = [
  "public read active stores",
  "public read visible categories",
  "public read visible products",
  "public create cart leads for active stores",
  "owners manage own stores",
  "owners manage own products",
  "owners read update own cart leads",
  "owners manage own order drafts",
];

for (const policy of requiredPolicies) {
  if (!migration.includes(policy)) {
    throw new Error(`Policy RLS ausente: ${policy}`);
  }
}

console.log("OK: Storefront Fase 3 preparada com tabelas, RLS, services, adapters e regras de plano.");
