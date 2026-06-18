const {
  MAIN_PROJECT_REF,
  assertLinkedToMain,
  getCurrentLinkedProjectRef,
} = require("./storefront-production-utils");

async function runQuery(sql) {
  const { spawnSync } = require("node:child_process");
  const fs = require("node:fs");
  const path = require("node:path");
  const root = path.resolve(__dirname, "..");
  const tmpDir = path.join(root, "supabase/.temp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `production-test-query-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  fs.writeFileSync(filePath, sql, "utf8");
  const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npx";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npx.cmd", "supabase", "db", "query", "--linked", "-f", filePath, "-o", "json"]
    : ["supabase", "db", "query", "--linked", "-f", filePath, "-o", "json"];
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  try {
    fs.unlinkSync(filePath);
  } catch (_) {}
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Query falhou com codigo ${result.status}`);
  }
  const parsed = JSON.parse(result.stdout);
  return Array.isArray(parsed) ? parsed : parsed.rows || [];
}

async function main() {
  assertLinkedToMain();
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

  const tableRows = await runQuery(`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in (${expectedTables.map((item) => `'${item}'`).join(",")})
    order by table_name;
  `);
  const foundTables = new Set(tableRows.map((row) => row.table_name));
  for (const table of expectedTables) {
    if (!foundTables.has(table)) throw new Error(`Tabela Storefront ausente no principal: ${table}`);
  }

  const rlsRows = await runQuery(`
    select relname, relrowsecurity
    from pg_class
    where relname in (${expectedTables.map((item) => `'${item}'`).join(",")})
    order by relname;
  `);
  for (const row of rlsRows) {
    if (row.relrowsecurity !== true) throw new Error(`RLS desligado no principal: ${row.relname}`);
  }

  const policyRows = await runQuery(`
    select tablename, count(*)::int as policies
    from pg_policies
    where schemaname = 'public'
      and tablename in (${expectedTables.map((item) => `'${item}'`).join(",")})
    group by tablename;
  `);
  const policiesByTable = new Map(policyRows.map((row) => [row.tablename, Number(row.policies)]));
  for (const table of expectedTables) {
    if (!policiesByTable.get(table)) throw new Error(`Policies ausentes no principal: ${table}`);
  }

  const internalStoreRows = await runQuery(`
    select slug, active from public.stores
    where slug in ('ne3d-internal-test', 'ne3d')
    order by updated_at desc nulls last, created_at desc nulls last
    limit 1;
  `);
  if (internalStoreRows.length !== 1) throw new Error("Loja interna controlada nao encontrada no principal.");
  if (internalStoreRows[0].active !== false) throw new Error("Loja interna controlada nao pode estar publica/ativa.");
  const internalSlug = internalStoreRows[0].slug;

  const publicReadRows = await runQuery(`
    set local role anon;
    select slug from public.stores where slug = '${internalSlug}';
  `);
  if (publicReadRows.length > 0) throw new Error("Anon consegue ler loja interna desativada.");

  console.log("OK: Storefront principal validado em modo controlado.", {
    projectRef: MAIN_PROJECT_REF,
    linkedRef: getCurrentLinkedProjectRef(),
    tables: expectedTables.length,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
