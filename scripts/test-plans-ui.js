const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const docs = fs.readFileSync(path.join(root, "docs", "plans-premium-ui.md"), "utf8");

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

const render = bodyOfFunction(app, "renderAssinatura");
const modernOption = bodyOfFunction(app, "renderModernPlanOption");
const checkout = bodyOfFunction(app, "abrirLinkMercadoPago");
const cancel = bodyOfFunction(app, "cancelarAssinaturaCliente");
const reactivate = bodyOfFunction(app, "reativarRenovacaoAssinaturaCliente");
const access = bodyOfFunction(app, "getPlanAccessState");

assert(!render.includes("Voltar para Grátis"), "Free nao pode oferecer voltar para Gratis");
assert(!render.includes("Cancelar plano Free"), "Free nao pode oferecer cancelamento");
assert(app.includes("const START_PLAN_ENABLED = false"), "Start deve permanecer desligado por flag");
assert(render.includes('badge: isStartCurrent ? "PLANO ATUAL" : startEnabled ? "MAIS POPULAR" : "EM BREVE"'), "Start bloqueado deve mostrar Em breve");
assert(render.includes('cta: isStartCurrent ? "Plano atual" : isProCurrent ? "Incluído no Pro" : "Assinar Start"'), "Start deve manter CTA comercial mesmo quando a contratacao estiver protegida");
assert(render.includes('action: startEnabled ? "start" : "start-unavailable"'), "Start bloqueado deve usar acao segura sem checkout");
assert(app.includes("plan-start-unavailable"), "acao Start indisponivel deve ser observavel sem cobrar");
assert(!render.includes('data-action=\\"open-payment\\" data-slug=\\"start\\"'), "tela moderna nao pode abrir checkout Start");
assert(render.includes('"Assinar Pro"'), "Pro deve possuir CTA funcional");
assert(render.includes('data-action=\\"open-payment\\" data-slug=\\"pro\\"'), "resumo Free deve direcionar para Pro");
assert(render.includes("isProCurrent"), "Pro ativo deve ser derivado do helper central");
assert(render.includes("renderPlanPaymentNotice(accessState, checkoutState)"), "estado visual de pagamento deve depender do helper");
assert(app.includes("canReactivateRenewal"), "helper central deve expor reativacao valida");
assert(app.includes("shouldShowPendingPayment: estado.pending === true && realPendingPayment"), "pending visual exige transacao real");
assert(app.includes('plano.slug === "start" && !isStartPlanCommerciallyEnabled()'), "checkout deve bloquear Start de forma controlada");
assert(app.includes("Você será direcionado ao pagamento seguro do Mercado Pago"), "checkout Pro deve confirmar redirecionamento seguro");
assert(cancel.includes("Seu plano"), "cancelamento deve explicar permanencia do plano");
assert(cancel.includes("Depois disso, sua conta voltará ao plano Free"), "cancelamento deve explicar retorno futuro ao Free");
assert(reactivate.includes("Deseja reativar a renovação automática do seu plano Pro?"), "reativacao deve possuir confirmacao clara");

[
  "plans_screen_opened",
  "plan_card_viewed",
  "plan_checkout_clicked",
  "plan_start_unavailable_clicked",
  "payment_pending_real_viewed",
  "subscription_cancel_requested",
  "subscription_cancel_at_period_end",
  "subscription_reactivated"
].forEach((eventType) => assert(app.includes(eventType), `diagnostico de planos ausente: ${eventType}`));

assert(css.includes(".plans-modern-screen.plans-pricing-screen"), "workspace de planos deve possuir container dedicado");
assert(css.includes("width:min(100%, 1280px)"), "workspace deve limitar largura ultrawide");
assert(css.includes("repeat(auto-fit, minmax(min(100%, 300px), 1fr))"), "grid deve ser responsivo sem cards estreitos");
assert(css.includes("@media (min-width:1024px)"), "desktop deve possuir breakpoint oficial");
assert(css.includes("@media (max-width:767px)"), "mobile deve possuir breakpoint oficial");
assert(css.includes("body.theme-light .plans-state-notice"), "avisos devem permanecer legiveis no tema claro");
assert(css.includes(".plan-tier-button.is-unavailable"), "CTA Start indisponivel deve possuir estilo controlado");

[
  "Sem produtos na loja online",
  "Não publica loja",
  "Não gera link público",
  "Não permite compartilhar loja",
  "Sem personalização avançada",
  "Indisponível no momento",
  "entitlement",
  "feature flag",
  "billing state",
  "plano_real",
  "loja_real",
  "Editar loja real"
].forEach((label) => assert(!render.includes(label), `card de planos nao deve exibir termo tecnico ou negativo: ${label}`));

[
  "Start bloqueado",
  "Pro produtivo",
  "Pagamento pendente real",
  "Checkout abandonado",
  "Tema claro e escuro",
  "Responsividade"
].forEach((marker) => assert(docs.includes(marker), `documentacao de UI de planos incompleta: ${marker}`));

console.log("Plans premium UI tests OK");
