const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260702103000_storefront_plan_publication_guard.sql"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includes(source, fragment, message = `Trecho obrigatorio ausente: ${fragment}`) {
  assert(source.includes(fragment), message);
}

[
  "STOREFRONT_PUBLICATION_STATUS",
  "getStorefrontPublicationAccess",
  "getStorefrontPublicationStatus",
  "isStorefrontPubliclyAccessible",
  "isStorefrontRemotePubliclyAccessible",
  "aplicarRegraPublicacaoLojaLocal",
  "storefrontIsPublicationSchemaMissing",
  "storefrontWithoutPublicationColumns",
].forEach((fragment) => includes(app, fragment));

includes(app, "canEdit: !!usuario", "Free/autenticado deve manter edicao interna da loja.");
includes(app, "const paidPlan = [\"start\", \"pro\"].includes(effectivePlan);", "Publicacao deve ficar limitada a Start/Pro.");
includes(app, "publishEnabled: entitlements.publicStore === true && publicationAccess.canPublish === true", "Botao de publicar precisa depender do plano ativo.");
includes(app, "shareEnabled: entitlements.shareLink === true && publicationAccess.canShare === true", "Compartilhamento precisa depender da publicacao liberada.");
includes(app, "Loja temporariamente indisponível", "Loja publica bloqueada precisa ter mensagem segura.");
includes(app, "status === STOREFRONT_PUBLICATION_STATUS.PUBLISHED", "Acesso publico remoto deve exigir status published.");

const publicationAccessBlock = app.match(/function getStorefrontPublicationAccess[\s\S]*?\r?\n}\r?\n\r?\nfunction getStorefrontPublicationStatus/);
assert(publicationAccessBlock, "Bloco getStorefrontPublicationAccess nao encontrado.");
const accessSource = publicationAccessBlock[0];
includes(accessSource, "accessState.isActive === true", "Cancelado dentro do periodo deve seguir a regra de acesso ativo.");
includes(accessSource, "PLAN_ACCESS_STATES.EXPIRED", "Assinatura vencida precisa suspender por pagamento.");
includes(accessSource, "STOREFRONT_PUBLICATION_STATUS.SUSPENDED_PAYMENT", "Suspensao por vencimento precisa existir.");
includes(accessSource, "STOREFRONT_PUBLICATION_STATUS.SUSPENDED_PLAN", "Suspensao por plano Free precisa existir.");

[
  "add column if not exists publication_status",
  "stores_publication_status_valid",
  "update public.stores",
  "storefront_publication_allowed",
  "from public.subscriptions sub",
  "left join public.plans plans on plans.id = sub.plan_id",
  "v_active_plan not in ('start', 'pro', 'premium', 'premium_trial')",
  "v_payment_status = 'pending'",
  "v_subscription_status in ('canceling', 'cancelled', 'canceled', 'cancelado')",
  "public.storefront_publication_allowed",
].forEach((fragment) => includes(migration.toLowerCase(), fragment.toLowerCase()));

assert(!/public\.saas_subscriptions/i.test(migration), "Migration nao deve apontar para tabela saas_subscriptions inexistente.");
assert(!/drop\s+table|truncate|delete\s+from/i.test(migration), "Migration nao deve conter comandos destrutivos.");

const scenarios = [
  { name: "free edita mas nao publica", plan: "free", active: true, state: "ACTIVE", canEdit: true, canPublish: false },
  { name: "start ativo publica", plan: "start", active: true, state: "ACTIVE", canEdit: true, canPublish: true },
  { name: "pro ativo publica", plan: "pro", active: true, state: "ACTIVE", canEdit: true, canPublish: true },
  { name: "start cancelado dentro do periodo publica", plan: "start", active: true, state: "CANCELING", canEdit: true, canPublish: true },
  { name: "pro vencido bloqueia publico", plan: "pro", active: false, state: "EXPIRED", canEdit: true, canPublish: false },
  { name: "start pendente bloqueia publico", plan: "start", active: false, state: "PENDING", canEdit: true, canPublish: false },
];

for (const scenario of scenarios) {
  const paidPlan = ["start", "pro"].includes(scenario.plan);
  const canPublish = paidPlan && scenario.active === true;
  assert(canPublish === scenario.canPublish, `Cenario invalido: ${scenario.name}`);
  assert(scenario.canEdit === true, `Cenario sem edicao interna: ${scenario.name}`);
}

console.log("OK: contrato de publicacao da Loja Online por plano validado.");
