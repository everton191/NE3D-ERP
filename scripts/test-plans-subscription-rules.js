const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const billingCommands = fs.readFileSync(path.join(root, "src", "features", "account", "billing-commands.js"), "utf8");
const customersSaasQuery = fs.readFileSync(path.join(root, "src", "features", "customers", "customers-saas-query.js"), "utf8");
const securityAudit = fs.readFileSync(path.join(root, "src", "features", "security", "security-audit-commands.js"), "utf8");
const haystack = app + "\n" + billingCommands + "\n" + customersSaasQuery + "\n" + securityAudit;
const docs = fs.readFileSync(path.join(root, "docs", "plans-subscription-rules.md"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function bodyOfFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `funcao ausente: ${name}`);
  const paren = source.indexOf("(", start);
  let depth = 0, open = -1;
  for (let i = paren; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") { depth--; if (depth === 0) { open = source.indexOf("{", i); break; } }
  }
  assert(open >= 0, `corpo ausente: ${name}`);
  let braceDepth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") braceDepth += 1;
    if (source[i] === "}") braceDepth -= 1;
    if (braceDepth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`nao foi possivel ler funcao: ${name}`);
}

function bodyOf(name) {
  const idx = billingCommands.indexOf(`function ${name}`);
  if (idx !== -1) return bodyOfFunction(billingCommands, name);
  return bodyOfFunction(app, name);
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
].forEach((marker) => assert(haystack.includes(marker), `marcador de regra de plano ausente: ${marker}`));

const renderAssinatura = bodyOfFunction(app, "renderAssinatura");
assert(!renderAssinatura.includes("Voltar para Grátis"), "tela de planos nao deve oferecer voltar para Free");
assert(renderAssinatura.includes("MAIS POPULAR"), "Start ativo deve possuir destaque comercial");
assert(renderAssinatura.includes("Assinar Start"), "Start deve manter CTA comercial amigavel");
assert(renderAssinatura.includes("Assinar Pro"), "Free deve mostrar assinatura Pro");
assert(renderAssinatura.includes("Upgrade para Pro"), "Start deve permitir upgrade para Pro");
assert(renderAssinatura.includes("Cancelar renovação"), "plano pago deve permitir cancelar renovacao");
assert(renderAssinatura.includes("Renovação cancelada"), "cancelamento confirmado deve ter estado informativo");
assert(!renderAssinatura.includes("Reativar renovação"), "assinatura cancelada no provedor nao pode oferecer reativacao local");

const cancelar = bodyOf("cancelarAssinaturaCliente");
assert(!cancelar.includes("ativarPlanoClienteLocal(clientId, \"free\""), "cancelamento nao pode voltar para Free imediatamente");
assert(cancelar.includes("cancelAtPeriodEnd = true"), "cancelamento deve marcar cancelAtPeriodEnd");
assert(cancelar.includes("subscriptionStatus = \"canceling\""), "cancelamento deve marcar assinatura como canceling");
assert(cancelar.includes('code: "AUTH_REQUIRED"'), "cancelamento deve exigir sessao online valida");
assert(cancelar.includes('code: "REMOTE_CANCELLATION_FAILED"'), "falha remota deve interromper o cancelamento local");
assert(cancelar.indexOf('code: "REMOTE_CANCELLATION_FAILED"') < cancelar.indexOf("assinatura.cancelAtPeriodEnd = true"), "estado local so pode mudar depois da confirmacao remota");

assert(app.includes("status: \"checkout_opened\""), "checkout aberto deve ser transitorio");
assert(!app.includes("assinatura.paymentStatus = \"pending\""), "checkout aberto nao deve virar pagamento pendente na assinatura");
assert(!app.includes("billingConfig.paymentStatus = \"pending\""), "checkout aberto nao deve virar pagamento pendente global");

assert(app.includes("function reativarRenovacaoAssinaturaCliente"), "reativacao de renovacao deve existir");
const reativar = bodyOfFunction(app, "reativarRenovacaoAssinaturaCliente");
assert(reativar.includes("REACTIVATION_UNAVAILABLE"), "ponte de compatibilidade deve rejeitar reativacao impossivel");
assert(!reativar.includes("cancelAtPeriodEnd = false"), "ponte de compatibilidade nao pode reativar somente o cache local");
assert(haystack.includes("assinatura.premiumUntil || assinatura.premium_until || assinatura.planExpiresAt"), "validade manual premium_until deve alimentar o vencimento exibido");
assert(haystack.includes("const planoComVencimento") && haystack.includes("const vencimentoRegistrado") || haystack.includes("const expiringPlan") && haystack.includes("registeredExpiration"), "card pago deve consolidar a validade sem reaproveitar data antiga no Free");
assert(haystack.includes('const plano = acessoVencido ? getPlanoSaas("free") : planoRegistrado') || haystack.includes('const plan = expired ? deps.plan("free") : registeredPlan'), "plano vencido deve voltar ao Free na apresentacao atual");
assert(app.includes("O banco não confirmou a data final do acesso"), "liberacao manual deve exigir confirmacao remota do vencimento");
assert(app.includes("Pro liberado até"), "sucesso deve informar a validade confirmada pelo banco");
assert(app.includes("deveEspelharLicencaNoCadastro"), "acesso irrestrito do superadmin nao pode alterar o plano comercial exibido da empresa");
assert(app.includes("function mesclarAssinaturasPorCliente"), "assinatura remota deve substituir cache antigo pelo cliente");
assert(
  haystack.includes("saasSubscriptions = mesclarAssinaturasPorCliente")
    || haystack.includes("deps.setSaasSubscriptions(deps.mesclarAssinaturasPorCliente"),
  "sincronizacao deve evitar assinatura duplicada por empresa"
);
assert(app.includes("function getApresentacaoPlanoEmpresaSaas"), "card deve centralizar a apresentacao da validade do plano");
assert(app.includes("depois volta ao Free"), "card deve explicar o retorno ao Free no fim do acesso temporario");
assert(app.includes("async function ajustarDiasUsuario"), "atalho de dias do usuario deve salvar de forma assincrona no banco");
assert(app.includes('chamarSuperadminUpdateSubscription(clienteId, "ACTIVATE_PREMIUM_MANUAL"'), "atalho de dias deve usar a RPC protegida");
assert(app.includes("O banco não confirmou a nova data de vencimento"), "atalho de dias deve exigir confirmacao remota da validade");
assert(pkg.scripts && pkg.scripts["test:plans"], "package.json deve expor test:plans");

[
  "Plano, assinatura e pagamento",
  "Checkout abandonado",
  "Cancelamento ao fim do período",
  "Ações permitidas por plano"
].forEach((marker) => assert(docs.includes(marker), `documentacao de planos incompleta: ${marker}`));

console.log("Plans subscription rules tests OK");
