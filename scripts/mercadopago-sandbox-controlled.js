const assert = require("node:assert");

const API_BASE = "https://api.mercadopago.com";
const REQUIRED_SANDBOX_TOKEN_PREFIX = "TEST-";
const CONTROLLED_CONFIRM_ENV = "MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM";

function getSandboxToken() {
  const token = String(process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN || "").trim();
  if (!token) throw new Error("MERCADOPAGO_SANDBOX_ACCESS_TOKEN ausente.");
  if (!token.toUpperCase().startsWith(REQUIRED_SANDBOX_TOKEN_PREFIX)) {
    throw new Error("Somente token sandbox TEST- e permitido neste runner.");
  }
  return token;
}

function assertControlledSandboxConfirm() {
  if (String(process.env[CONTROLLED_CONFIRM_ENV] || "").toLowerCase() !== "true") {
    throw new Error(`${CONTROLLED_CONFIRM_ENV}=true e obrigatorio para operacoes sandbox com rede.`);
  }
}

function normalizeSandboxPaymentStatus(status = "") {
  const value = String(status || "").toLowerCase().trim();
  if (value === "approved") return "approved";
  if (["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(value)) return "failed";
  return "pending";
}

function getFixtureExpectations() {
  return [
    { name: "approved", providerStatus: "approved", expected: "approved", grantsAccess: true },
    { name: "rejected", providerStatus: "rejected", expected: "failed", grantsAccess: false },
    { name: "pending", providerStatus: "pending", expected: "pending", grantsAccess: false },
    { name: "abandoned", providerStatus: "checkout_abandoned", expected: "pending", grantsAccess: false },
    { name: "cancelled", providerStatus: "cancelled", expected: "failed", grantsAccess: false },
  ];
}

function validateFixtures() {
  for (const fixture of getFixtureExpectations()) {
    assert.equal(normalizeSandboxPaymentStatus(fixture.providerStatus), fixture.expected, `fixture invalida: ${fixture.name}`);
    if (fixture.expected !== "approved") assert.equal(fixture.grantsAccess, false, `fixture nao pode liberar acesso: ${fixture.name}`);
  }
  console.log("mercadopago_sandbox_fixtures_ok");
}

function getStatus() {
  const token = String(process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN || "").trim();
  const tokenSafe = Boolean(token && token.toUpperCase().startsWith(REQUIRED_SANDBOX_TOKEN_PREFIX));
  const config = {
    tokenConfigured: Boolean(token),
    tokenIsSandbox: tokenSafe,
    controlledConfirm: String(process.env[CONTROLLED_CONFIRM_ENV] || "").toLowerCase() === "true",
    payerEmailConfigured: Boolean(String(process.env.MERCADOPAGO_SANDBOX_TEST_PAYER_EMAIL || "").trim()),
    publicUrlConfigured: Boolean(String(process.env.MERCADOPAGO_SANDBOX_PUBLIC_URL || "").trim()),
    webhookUrlConfigured: Boolean(String(process.env.MERCADOPAGO_SANDBOX_WEBHOOK_URL || "").trim()),
  };
  console.log(JSON.stringify(config, null, 2));
  return config;
}

async function mercadoPagoRequest(pathname, options = {}) {
  const token = getSandboxToken();
  const response = await fetch(`${API_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Mercado Pago sandbox respondeu HTTP ${response.status}: ${body.message || "erro controlado"}`);
  return body;
}

async function createPreference() {
  assertControlledSandboxConfirm();
  const payerEmail = String(process.env.MERCADOPAGO_SANDBOX_TEST_PAYER_EMAIL || "").trim();
  const publicUrl = String(process.env.MERCADOPAGO_SANDBOX_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const webhookUrl = String(process.env.MERCADOPAGO_SANDBOX_WEBHOOK_URL || "").trim();
  if (!payerEmail) throw new Error("MERCADOPAGO_SANDBOX_TEST_PAYER_EMAIL ausente.");
  if (!publicUrl) throw new Error("MERCADOPAGO_SANDBOX_PUBLIC_URL ausente.");
  if (!webhookUrl) throw new Error("MERCADOPAGO_SANDBOX_WEBHOOK_URL ausente.");
  const externalReference = `sandbox-controlled-${Date.now()}`;
  const body = await mercadoPagoRequest("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [{ id: "simplifica-pro-sandbox", title: "Simplifica 3D Pro Sandbox", quantity: 1, unit_price: 1, currency_id: "BRL" }],
      payer: { email: payerEmail },
      external_reference: externalReference,
      back_urls: {
        success: `${publicUrl}/?pagamento=sucesso`,
        pending: `${publicUrl}/?pagamento=pendente`,
        failure: `${publicUrl}/?pagamento=falha`,
      },
      notification_url: webhookUrl,
      auto_return: "approved",
    }),
  });
  console.log(JSON.stringify({ preferenceId: body.id || "", sandboxInitPoint: body.sandbox_init_point || "", externalReference }, null, 2));
}

async function inspectPayment(paymentId) {
  if (!paymentId) throw new Error("Informe o payment id sandbox.");
  const body = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
  console.log(JSON.stringify({ paymentId: String(body.id || paymentId), status: body.status || "", normalizedStatus: normalizeSandboxPaymentStatus(body.status) }, null, 2));
}

async function cancelPreapproval(preapprovalId) {
  assertControlledSandboxConfirm();
  if (!preapprovalId) throw new Error("Informe o preapproval id sandbox.");
  const body = await mercadoPagoRequest(`/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
  console.log(JSON.stringify({ preapprovalId: String(body.id || preapprovalId), status: body.status || "" }, null, 2));
}

async function main() {
  const command = process.argv[2] || "status";
  if (command === "status") return getStatus();
  if (command === "fixtures") return validateFixtures();
  if (command === "create-preference") return createPreference();
  if (command === "inspect-payment") return inspectPayment(process.argv[3]);
  if (command === "cancel-preapproval") return cancelPreapproval(process.argv[3]);
  throw new Error("Comando invalido. Use status, fixtures, create-preference, inspect-payment ou cancel-preapproval.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  assertControlledSandboxConfirm,
  cancelPreapproval,
  createPreference,
  getFixtureExpectations,
  getSandboxToken,
  getStatus,
  inspectPayment,
  normalizeSandboxPaymentStatus,
  validateFixtures,
};
