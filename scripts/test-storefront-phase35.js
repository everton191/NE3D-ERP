const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migrationPath = path.join(root, "supabase/migrations/20260522103000_storefront_phase3.sql");
const migration = fs.readFileSync(migrationPath, "utf8");

const requiredIndexes = [
  "idx_stores_owner_id",
  "idx_stores_slug_active",
  "idx_store_categories_store_visible",
  "idx_store_products_store_visible",
  "idx_store_product_images_product_order",
  "idx_store_cart_leads_owner_status",
  "idx_store_order_drafts_owner_status",
  "idx_store_visits_store_created_at",
  "idx_store_events_store_type_created_at",
];

for (const indexName of requiredIndexes) {
  if (!migration.includes(indexName)) throw new Error(`Index ausente: ${indexName}`);
}

const requiredConstraints = [
  "stores_slug_format",
  "store_categories_slug_format",
  "store_products_price_nonnegative",
  "store_products_stock_mode_valid",
  "store_cart_leads_status_valid",
  "store_order_drafts_status_valid",
  "store_visits_event_type_valid",
  "store_events_event_type_valid",
];

for (const constraintName of requiredConstraints) {
  if (!migration.includes(constraintName)) throw new Error(`Constraint ausente: ${constraintName}`);
}

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

for (const tableName of requiredTables) {
  const expression = new RegExp(`create table if not exists public\\.${tableName}\\b`, "i");
  if (!expression.test(migration)) throw new Error(`Tabela ausente: ${tableName}`);
}

const forbiddenPatterns = [
  /\bdrop\s+table\b/i,
  /\bdrop\s+schema\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i,
  /\balter\s+table\s+public\.(?!store)/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(migration)) {
    throw new Error(`Comando destrutivo ou fora do modulo Storefront encontrado: ${pattern}`);
  }
}

require("./test-storefront-rls-simulation");

console.log("OK: Storefront Fase 3.5 validada localmente com migration estatica, RLS simulada e sem comandos remotos.");
