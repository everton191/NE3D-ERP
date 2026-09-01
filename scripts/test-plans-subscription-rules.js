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
assert(renderAssinatura.includes("MAIS POPULAR"), "Start ativo deve possuir destaque comercial");
assert(renderAssinatura.includes("Assinar Start"), "Start deve manter CTA comercial amigavel");
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
assert(app.includes("assinatura.premiumUntil || assinatura.premium_until || assinatura.planExpiresAt"), "validade manual premium_until deve alimentar o vencimento exibido");
assert(app.includes("const planoComVencimento") && app.includes("const vencimentoRegistrado = planoComVencimento"), "card pago deve consolidar a validade sem reaproveitar data antiga no Free");
assert(app.includes('const plano = acessoVencido ? getPlanoSaas("free") : planoRegistrado'), "plano vencido deve voltar ao Free na apresentacao atual");
assert(app.includes("O banco não confirmou a data final do acesso"), "liberacao manual deve exigir confirmacao remota do vencimento");
assert(app.includes("Pro liberado até"), "sucesso deve informar a validade confirmada pelo banco");
assert(app.includes("deveEspelharLicencaNoCadastro"), "acesso irrestrito do superadmin nao pode alterar o plano comercial exibido da empresa");
assert(app.includes("function mesclarAssinaturasPorCliente"), "assinatura remota deve substituir cache antigo pelo cliente");
assert(app.includes("saasSubscriptions = mesclarAssinaturasPorCliente"), "sincronizacao deve evitar assinatura duplicada por empresa");
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
