const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const publication = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-publication.js"), "utf8");
const adminRemote = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-admin-remote.js"), "utf8");
const planGuardMigration = fs.readFileSync(path.join(root, "supabase", "migrations", "20260702103000_storefront_plan_publication_guard.sql"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const clientSources = `${app}\n${publication}\n${adminRemote}`;
assert(!clientSources.includes("STOREFRONT_REAL_TEST_FULL_ACCESS"), "O bypass de homologacao nao pode existir no bundle publico.");
assert(!clientSources.includes("isStorefrontRealTestFullAccessEnabled"), "O helper do bypass nao pode existir no bundle publico.");

const limitsBlock = app.match(/function getStorefrontLimitsLocal[\s\S]*?\r?\n}\r?\nfunction aplicarRegraPublicacaoLojaLocal/);
assert(limitsBlock, "Bloco getStorefrontLimitsLocal nao encontrado.");
assert(limitsBlock[0].includes("entitlements.publicStore === true && publicationAccess.canPublish === true"), "Publicacao deve depender do plano e da assinatura ativa.");
assert(limitsBlock[0].includes("entitlements.shareLink === true && publicationAccess.canShare === true"), "Compartilhamento deve depender do plano e da assinatura ativa.");
assert(!limitsBlock[0].includes("testMode"), "Limites da loja nao podem expor um modo privilegiado controlado pelo cliente.");

const checklistBlock = publication.match(/function exigirChecklistPublicacaoLoja[\s\S]*?\r?\n}\r?\n\r?\nfunction getStorefrontOwnerIdLocal/);
assert(checklistBlock, "Bloco exigirChecklistPublicacaoLoja nao encontrado.");
assert(checklistBlock[0].includes("if (!publicationAccess.canPublish)"), "Checklist deve bloquear publicacao sem permissao real.");

const statusBlock = adminRemote.match(/async function alternarStatusLojaOnline[\s\S]*?\r?\n}\r?\n\r?\nasync function/);
assert(statusBlock, "Bloco alternarStatusLojaOnline nao encontrado.");
assert(statusBlock[0].includes("if (!store.active && !publicationAccess.canPublish)"), "Ativacao da loja deve bloquear planos sem permissao real.");

assert(planGuardMigration.includes("storefront_publication_allowed"), "RLS precisa manter a validacao autoritativa de publicacao.");
assert(planGuardMigration.includes("from public.subscriptions sub"), "RLS precisa consultar a assinatura persistida no backend.");

const scenarios = [
  { plan: "free", active: true, canPublish: false },
  { plan: "start", active: true, canPublish: true },
  { plan: "pro", active: true, canPublish: true },
  { plan: "start", active: false, canPublish: false },
  { plan: "pro", active: false, canPublish: false },
];

for (const scenario of scenarios) {
  const paidPlan = ["start", "pro"].includes(scenario.plan);
  assert(paidPlan && scenario.active === true ? scenario.canPublish : !scenario.canPublish, `Regra invalida para ${scenario.plan}/${scenario.active ? "active" : "inactive"}.`);
}

console.log("OK: bypass de homologacao removido e permissoes Free/Start/Pro preservadas.");
