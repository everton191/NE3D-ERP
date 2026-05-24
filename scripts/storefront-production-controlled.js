const fs = require("node:fs");
const path = require("node:path");
const {
  MAIN_PROJECT_REF,
  ROOT,
  assertControlledProductionConfirm,
  assertLinkedToMain,
  getCurrentLinkedProjectRef,
  run,
  supabaseArgs,
} = require("./storefront-production-utils");

const migrationPath = "supabase/migrations/20260522103000_storefront_phase3.sql";
const adminMigrationPaths = [
  "supabase/migrations/20260522183000_storefront_phase38_admin_fields.sql",
  "supabase/migrations/20260522203000_storefront_phase39_hardening_storage.sql",
];
const backupDir = path.join(ROOT, "backups/storefront-phase37");

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function validateMigration(targetPath = migrationPath, expectedTables = ["stores", "store_categories", "store_products", "store_product_images", "store_cart_leads", "store_order_drafts", "store_visits", "store_events"]) {
  const sql = fs.readFileSync(path.join(ROOT, targetPath), "utf8");
  const forbidden = [
    /\bdrop\s+table\b/i,
    /\bdrop\s+schema\b/i,
    /\btruncate\b/i,
    /\bdelete\s+from\b/i,
    /\balter\s+table\s+public\.(?!store)/i,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(sql)) throw new Error(`Migration bloqueada por padrao perigoso: ${pattern}`);
  }
  for (const table of expectedTables) {
    if (!new RegExp(`(create table if not exists|alter table) public\\.${table}\\b`, "i").test(sql)) {
      throw new Error(`Tabela esperada ausente na migration: ${table}`);
    }
  }
}

async function backup() {
  assertControlledProductionConfirm();
  assertLinkedToMain();
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = timestamp();
  const schemaFile = path.join(backupDir, `main-${MAIN_PROJECT_REF}-${stamp}-schema.sql`);
  const dataFile = path.join(backupDir, `main-${MAIN_PROJECT_REF}-${stamp}-data.sql`);
  console.warn("APLICANDO NO PRINCIPAL — MODO CONTROLADO");
  console.warn(`Gerando backup do principal ${MAIN_PROJECT_REF}.`);
  await run("npx", supabaseArgs(["db", "dump", "--linked", "-f", schemaFile]));
  await run("npx", supabaseArgs(["db", "dump", "--linked", "--data-only", "--use-copy", "-f", dataFile]));
  for (const file of [schemaFile, dataFile]) {
    const stats = fs.statSync(file);
    if (!stats.size) throw new Error(`Backup vazio: ${file}`);
  }
  const manifest = path.join(backupDir, `main-${MAIN_PROJECT_REF}-${stamp}-manifest.json`);
  fs.writeFileSync(manifest, JSON.stringify({
    projectRef: MAIN_PROJECT_REF,
    linkedRef: getCurrentLinkedProjectRef(),
    createdAt: new Date().toISOString(),
    schemaFile,
    dataFile,
    schemaBytes: fs.statSync(schemaFile).size,
    dataBytes: fs.statSync(dataFile).size,
  }, null, 2));
  console.log(`Backup confirmado: ${manifest}`);
}

async function applyMigration() {
  assertControlledProductionConfirm();
  assertLinkedToMain();
  validateMigration();
  console.warn("APLICANDO NO PRINCIPAL — MODO CONTROLADO");
  console.warn(`Aplicando somente ${migrationPath} no principal ${MAIN_PROJECT_REF}.`);
  await run("npx", supabaseArgs(["db", "query", "--linked", "-f", migrationPath]));
}

async function applyAdminMigrations() {
  assertControlledProductionConfirm();
  assertLinkedToMain();
  validateMigration(adminMigrationPaths[0], ["store_products", "store_categories"]);
  validateMigration(adminMigrationPaths[1], ["storefront_beta_users"]);
  console.warn("APLICANDO NO PRINCIPAL — MODO CONTROLADO");
  console.warn(`Aplicando somente migrations administrativas Storefront no principal ${MAIN_PROJECT_REF}.`);
  for (const targetPath of adminMigrationPaths) {
    await run("npx", supabaseArgs(["db", "query", "--linked", "-f", targetPath]));
  }
}

async function main() {
  const command = process.argv[2] || "status";
  if (command === "status") {
    console.log({ mainRef: MAIN_PROJECT_REF, linkedRef: getCurrentLinkedProjectRef() || null });
    return;
  }
  if (command === "backup") {
    await backup();
    return;
  }
  if (command === "apply") {
    await applyMigration();
    return;
  }
  if (command === "apply-admin") {
    await applyAdminMigrations();
    return;
  }
  throw new Error(`Comando desconhecido: ${command}. Use status, backup, apply ou apply-admin.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
