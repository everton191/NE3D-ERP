const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const docs = fs.readFileSync(path.join(root, "docs", "plans-subscription-rules.md"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function bodyOfFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `funcao ausente: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`nao foi possivel ler funcao: ${name}`);
}

[
  "function getPlanAccessState",
  "currentPlan",
  "effectivePlan",
  "isCancelingAtPeriodEnd",
  "canCancelRenewal",
  "shouldShowPendingPayment",
  "cancelAtPeriodEnd",
  "currentPeriodEnd",
  "temPagamentoPendenteReal"
].forEach((marker) => assert(app.includes(marker), `marcador de regra de plano ausente: ${marker}`));

const renderAssinatura = bodyOfFunction(app, "renderAssinatura");
assert(!renderAssinatura.includes("Voltar para Grátis"), "tela de planos nao deve oferecer voltar para Free");
assert(renderAssinatura.includes("EM BREVE"), "Start deve aparecer como indisponivel ate autoridade backend propria");
assert(renderAssinatura.includes("Indisponível no momento"), "Start nao deve expor CTA funcional");
assert(renderAssinatura.includes("Assinar Pro"), "Free deve mostrar assinatura Pro");
assert(renderAssinatura.includes("Upgrade para Pro"), "Start deve permitir upgrade para Pro");
assert(renderAssinatura.includes("Cancelar renovação"), "plano pago deve permitir cancelar renovacao");
assert(renderAssinatura.includes("Reativar renovação"), "cancelamento agendado deve permitir reativacao");

const cancelar = bodyOfFunction(app, "cancelarAssinaturaCliente");
assert(!cancelar.includes("ativarPlanoClienteLocal(clientId, \"free\""), "cancelamento nao pode voltar para Free imediatamente");
assert(cancelar.includes("cancelAtPeriodEnd = true"), "cancelamento deve marcar cancelAtPeriodEnd");
assert(cancelar.includes("subscriptionStatus = \"canceling\""), "cancelamento deve marcar assinatura como canceling");

assert(app.includes("status: \"checkout_opened\""), "checkout aberto deve ser transitorio");
assert(!app.includes("assinatura.paymentStatus = \"pending\""), "checkout aberto nao deve virar pagamento pendente na assinatura");
assert(!app.includes("billingConfig.paymentStatus = \"pending\""), "checkout aberto nao deve virar pagamento pendente global");

assert(app.includes("function reativarRenovacaoAssinaturaCliente"), "reativacao de renovacao deve existir");
assert(pkg.scripts && pkg.scripts["test:plans"], "package.json deve expor test:plans");

[
  "Plano, assinatura e pagamento",
  "Checkout abandonado",
  "Cancelamento ao fim do período",
  "Ações permitidas por plano"
].forEach((marker) => assert(docs.includes(marker), `documentacao de planos incompleta: ${marker}`));

console.log("Plans subscription rules tests OK");
