const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");
const sandbox = read("scripts/mercadopago-sandbox-controlled.js");
const docs = read("docs/checkout-payment-states-sandbox.md");
const pkg = JSON.parse(read("package.json"));
const {
  assertControlledSandboxConfirm,
  getFixtureExpectations,
  getSandboxToken,
  normalizeSandboxPaymentStatus,
} = require("./mercadopago-sandbox-controlled");

[
  "function normalizarRetornoCheckoutMercadoPago",
  "function atualizarCheckoutLocalPorRetornoMercadoPago",
  "function limparParametrosRetornoMercadoPago",
  "function temTransacaoMercadoPagoReal",
  "checkout_returned_without_payment",
  "payment_failed",
  "checkout_abandoned",
  "payment-return",
].forEach((marker) => assert(app.includes(marker), `app.js sem marcador 5C: ${marker}`));

assert(app.includes('status: "checkout_opened"'), "checkout deve continuar transitorio");
assert(!app.includes('checkout.status = "approved"'), "URL de retorno nao pode aprovar checkout local");
assert(!app.includes('billingConfig.activePlan = "pro"'), "retorno de checkout nao pode ativar Pro diretamente");
assert(app.includes('returnStatus === "failed"'), "falha deve ser tratada separadamente");
assert(app.includes('reason: force ? "superseded_checkout" : "local_timeout"'), "abandono deve diferenciar timeout de substituicao");
assert(app.includes('String(pagamento.status || "") === "pending" && temTransacaoMercadoPagoReal(pagamento)'), "pending real nao pode expirar por limpeza local");
assert(sandbox.includes('REQUIRED_SANDBOX_TOKEN_PREFIX = "TEST-"'), "runner deve bloquear token produtivo");
assert(sandbox.includes("MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM"), "runner deve exigir confirmacao sandbox");
assert(!sandbox.includes("MERCADOPAGO_ACCESS_TOKEN"), "runner sandbox nao pode ler token produtivo");

for (const fixture of getFixtureExpectations()) {
  assert.equal(normalizeSandboxPaymentStatus(fixture.providerStatus), fixture.expected, `fixture sandbox incorreta: ${fixture.name}`);
}

const previousToken = process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN;
const previousConfirm = process.env.MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM;
process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN = "APP_USR-token-produtivo-bloqueado";
assert.throws(() => getSandboxToken(), /Somente token sandbox TEST-/);
delete process.env.MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM;
assert.throws(() => assertControlledSandboxConfirm(), /obrigatorio/);
if (previousToken === undefined) delete process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN;
else process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN = previousToken;
if (previousConfirm === undefined) delete process.env.MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM;
else process.env.MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM = previousConfirm;

assert.equal(pkg.scripts["test:checkout-payment-states"], "node scripts/test-checkout-payment-states.js");
assert.equal(pkg.scripts["mercadopago:sandbox:status"], "node scripts/mercadopago-sandbox-controlled.js status");
assert.equal(pkg.scripts["mercadopago:sandbox:fixtures"], "node scripts/mercadopago-sandbox-controlled.js fixtures");
assert(docs.includes("Nenhum teste sandbox real foi executado automaticamente"), "docs devem registrar limite da validacao local");

console.log("Checkout payment states tests OK");
