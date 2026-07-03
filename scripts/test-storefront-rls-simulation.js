const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migrationPath = path.join(root, "supabase/migrations/20260522103000_storefront_phase3.sql");
const migration = fs.readFileSync(migrationPath, "utf8");

const expectedTables = [
  "stores",
  "store_categories",
  "store_products",
  "store_product_images",
  "store_cart_leads",
  "store_order_drafts",
  "store_visits",
  "store_events",
];

const expectedColumns = {
  stores: ["owner_id", "slug", "name", "active", "theme_config", "created_at", "updated_at"],
  store_categories: ["store_id", "owner_id", "name", "slug", "order_index", "visible"],
  store_products: [
    "store_id",
    "owner_id",
    "erp_product_id",
    "title",
    "slug",
    "price",
    "category_id",
    "visible",
    "featured",
    "is_customizable",
    "stock_mode",
    "stock_quantity",
  ],
  store_product_images: ["product_id", "store_id", "owner_id", "image_url", "order_index"],
  store_cart_leads: ["store_id", "owner_id", "items_json", "subtotal", "whatsapp_message", "status", "source"],
  store_order_drafts: ["store_id", "owner_id", "lead_id", "items_json", "subtotal", "status", "erp_order_id"],
  store_visits: ["store_id", "product_id", "event_type", "session_id"],
  store_events: ["store_id", "product_id", "event_type", "metadata_json"],
};

function tableBlock(table) {
  const match = migration.match(new RegExp(`create table if not exists public\\.${table} \\([\\s\\S]*?\\n\\);`, "i"));
  if (!match) throw new Error(`Tabela ausente na migration: ${table}`);
  return match[0];
}

for (const table of expectedTables) {
  const block = tableBlock(table);
  for (const column of expectedColumns[table]) {
    if (!new RegExp(`\\b${column}\\b`, "i").test(block)) {
      throw new Error(`Coluna ausente em ${table}: ${column}`);
    }
  }
}

const requiredFragments = [
  "enable row level security",
  "jsonb not null default '{}'::jsonb",
  "jsonb not null default '[]'::jsonb",
  "references auth.users(id) on delete cascade",
  "references public.stores(id) on delete cascade",
  "public read active stores",
  "owners manage own stores",
  "public read visible categories",
  "owners manage own categories",
  "public read visible products",
  "owners manage own products",
  "public create cart leads for active stores",
  "owners read update own cart leads",
  "public create storefront visits",
  "public create storefront events",
];

for (const fragment of requiredFragments) {
  if (!migration.toLowerCase().includes(fragment.toLowerCase())) {
    throw new Error(`Fragmento obrigatorio ausente na migration: ${fragment}`);
  }
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

const users = {
  a: "user-a",
  b: "user-b",
  anon: null,
};

const stores = [
  { id: "store-a", owner_id: users.a, slug: "ne3d-teste", active: true, publication_status: "published" },
  { id: "store-b", owner_id: users.b, slug: "maker-teste", active: true, publication_status: "published" },
  { id: "store-a-hidden", owner_id: users.a, slug: "ne3d-inativa", active: false, publication_status: "unpublished" },
  { id: "store-a-suspended", owner_id: users.a, slug: "ne3d-suspensa", active: true, publication_status: "suspended_payment" },
];

const categories = [
  { id: "cat-a-visible", store_id: "store-a", owner_id: users.a, slug: "carimbos", visible: true },
  { id: "cat-a-hidden", store_id: "store-a", owner_id: users.a, slug: "interno", visible: false },
  { id: "cat-b-visible", store_id: "store-b", owner_id: users.b, slug: "brindes", visible: true },
];

const products = [
  {
    id: "product-a-visible",
    store_id: "store-a",
    owner_id: users.a,
    category_id: "cat-a-visible",
    visible: true,
    stock_mode: "unlimited",
    title: "Carimbo personalizado",
  },
  {
    id: "product-a-hidden",
    store_id: "store-a",
    owner_id: users.a,
    category_id: "cat-a-hidden",
    visible: false,
    stock_mode: "unlimited",
    title: "Produto interno",
  },
  {
    id: "product-a-unavailable",
    store_id: "store-a",
    owner_id: users.a,
    category_id: "cat-a-visible",
    visible: true,
    stock_mode: "unavailable",
    title: "Peca indisponivel",
  },
  {
    id: "product-b-visible",
    store_id: "store-b",
    owner_id: users.b,
    category_id: "cat-b-visible",
    visible: true,
    stock_mode: "manual",
    stock_quantity: 4,
    title: "Brinde personalizado",
  },
];

const leads = [
  { id: "lead-a", store_id: "store-a", owner_id: users.a, status: "novo", items_json: [{ product_id: "product-a-visible", quantity: 1 }] },
  { id: "lead-b", store_id: "store-b", owner_id: users.b, status: "novo", items_json: [{ product_id: "product-b-visible", quantity: 2 }] },
];

const storeById = new Map(stores.map((store) => [store.id, store]));

function ownerCanRead(record, userId) {
  return Boolean(userId && record.owner_id === userId);
}

function publicCanReadStore(store) {
  return store.active === true && store.publication_status === "published";
}

function publicCanReadCategory(category) {
  const store = storeById.get(category.store_id);
  return category.visible === true && store?.active === true;
}

function publicCanReadProduct(product) {
  const store = storeById.get(product.store_id);
  return product.visible === true && product.stock_mode !== "unavailable" && store?.active === true;
}

function publicCanCreateLead(lead) {
  const store = storeById.get(lead.store_id);
  return store?.active === true
    && store.owner_id === lead.owner_id
    && lead.status === "novo"
    && Array.isArray(lead.items_json)
    && lead.items_json.length >= 1
    && lead.items_json.length <= 80;
}

function publicCanCreateVisitOrEvent(event) {
  const store = storeById.get(event.store_id);
  return store?.active === true && typeof event.event_type === "string" && event.event_type.length > 0;
}

function canEditProduct(product, userId) {
  return ownerCanRead(product, userId);
}

function canListPrivateLeadsForStore(storeId, userId) {
  return leads.filter((lead) => lead.store_id === storeId && ownerCanRead(lead, userId));
}

function resolveStock(product) {
  if (product.stock_mode === "unavailable") return { available: false };
  if (product.stock_mode === "manual") return { available: Number(product.stock_quantity || 0) > 0 };
  if (product.stock_mode === "erp_linked") return { available: true, reason: "confirmar_no_erp" };
  return { available: true };
}

const assertions = [
  ["usuario A ve propria loja", ownerCanRead(stores[0], users.a) === true],
  ["usuario A nao ve loja B privada", ownerCanRead(stores[1], users.a) === false],
  ["usuario B ve propria loja", ownerCanRead(stores[1], users.b) === true],
  ["usuario B nao ve loja A privada", ownerCanRead(stores[0], users.b) === false],
  ["publico ve loja ativa", publicCanReadStore(stores[0]) === true],
  ["publico nao ve loja inativa", publicCanReadStore(stores[2]) === false],
  ["publico nao ve loja suspensa por plano", publicCanReadStore(stores[3]) === false],
  ["publico ve categoria visivel", publicCanReadCategory(categories[0]) === true],
  ["publico nao ve categoria invisivel", publicCanReadCategory(categories[1]) === false],
  ["publico ve produto visivel", publicCanReadProduct(products[0]) === true],
  ["publico nao ve produto invisivel", publicCanReadProduct(products[1]) === false],
  ["publico nao ve produto indisponivel", publicCanReadProduct(products[2]) === false],
  ["publico nao edita produtos", canEditProduct(products[0], users.anon) === false],
  ["publico nao lista leads privados", canListPrivateLeadsForStore("store-a", users.anon).length === 0],
  ["usuario A lista leads A", canListPrivateLeadsForStore("store-a", users.a).length === 1],
  ["usuario A nao lista leads B", canListPrivateLeadsForStore("store-b", users.a).length === 0],
  [
    "publico cria lead limitado",
    publicCanCreateLead({
      store_id: "store-a",
      owner_id: users.a,
      status: "novo",
      items_json: [{ product_id: "product-a-visible", quantity: 1 }],
    }) === true,
  ],
  [
    "publico nao cria lead sem item",
    publicCanCreateLead({ store_id: "store-a", owner_id: users.a, status: "novo", items_json: [] }) === false,
  ],
  [
    "publico registra visita limitada",
    publicCanCreateVisitOrEvent({ store_id: "store-a", event_type: "store_view" }) === true,
  ],
  [
    "publico nao registra evento em loja inativa",
    publicCanCreateVisitOrEvent({ store_id: "store-a-hidden", event_type: "store_view" }) === false,
  ],
  ["stock unlimited libera", resolveStock(products[0]).available === true],
  ["stock manual usa quantidade mock", resolveStock(products[3]).available === true],
  ["stock unavailable bloqueia", resolveStock(products[2]).available === false],
  ["stock erp_linked fica preparado", resolveStock({ stock_mode: "erp_linked" }).available === true],
];

const failures = assertions.filter(([, ok]) => !ok);
if (failures.length) {
  throw new Error(`Falhas na simulacao Storefront/RLS: ${failures.map(([name]) => name).join(", ")}`);
}

console.log("OK: RLS Storefront simulada com user-a, user-b, publico, leads, eventos e estoque mockado.");
