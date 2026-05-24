const {
  assertLinkedToStaging,
  assertNotMainProject,
  assertStagingConfirmed,
  getCurrentLinkedProjectRef,
  getStagingProjectRef,
  loadStagingEnv,
  run,
  supabaseArgs,
} = require("./storefront-staging-utils");

async function main() {
  const command = process.argv[2] || "status";
  const env = loadStagingEnv();
  const stagingRef = getStagingProjectRef(env);

  if (command === "status") {
    console.log({
      stagingRef: stagingRef || null,
      linkedRef: getCurrentLinkedProjectRef() || null,
      storeFrontEnabled: env.STORE_FRONT_ENABLED || null,
      stagingConfirmed: String(env.STAGING_CONFIRM || "").toLowerCase() === "true",
    });
    return;
  }

  if (command === "create") {
    assertStagingConfirmed(env);
    const orgId = String(env.SUPABASE_STAGING_ORG_ID || "").trim();
    const name = String(env.SUPABASE_STAGING_PROJECT_NAME || "simplifica3d-staging").trim();
    const region = String(env.SUPABASE_STAGING_REGION || "sa-east-1").trim();
    const password = String(env.SUPABASE_STAGING_DB_PASSWORD || "").trim();
    if (!orgId) throw new Error("SUPABASE_STAGING_ORG_ID nao configurado.");
    if (!password) throw new Error("SUPABASE_STAGING_DB_PASSWORD nao configurado. Use uma senha exclusiva do staging.");
    await run("npx", supabaseArgs(["projects", "create", name, "--org-id", orgId, "--region", region, "--db-password", password]));
    console.log("Projeto staging solicitado. Copie o project ref para SUPABASE_STAGING_PROJECT_REF antes de link/push.");
    return;
  }

  assertNotMainProject(stagingRef);
  assertStagingConfirmed(env);

  if (command === "link") {
    console.warn(`Linkando workspace ao Supabase staging ${stagingRef}. Projeto principal bloqueado por guarda.`);
    await run("npx", supabaseArgs(["link", "--project-ref", stagingRef]));
    return;
  }

  if (command === "push") {
    assertLinkedToStaging(env);
    console.warn(`Executando apenas no staging ${stagingRef}. Aplicando somente a migration Storefront Fase 3.`);
    await run("npx", supabaseArgs(["db", "query", "--linked", "-f", "supabase/migrations/20260522103000_storefront_phase3.sql"]));
    return;
  }

  if (command === "apply-admin") {
    assertLinkedToStaging(env);
    console.warn(`Executando apenas no staging ${stagingRef}. Aplicando migrations Storefront Fase 3.8 e 3.9.`);
    await run("npx", supabaseArgs(["db", "query", "--linked", "-f", "supabase/migrations/20260522183000_storefront_phase38_admin_fields.sql"]));
    await run("npx", supabaseArgs(["db", "query", "--linked", "-f", "supabase/migrations/20260522203000_storefront_phase39_hardening_storage.sql"]));
    return;
  }

  if (command === "seed") {
    assertLinkedToStaging(env);
    console.warn(`Aplicando seed somente no staging ${stagingRef}.`);
    await run("node", ["scripts/apply-storefront-staging-seed.js"]);
    return;
  }

  throw new Error(`Comando desconhecido: ${command}. Use status, create, link, push, apply-admin ou seed.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
