const assert = require("node:assert/strict");
const BillingCommands = require("../src/features/account/billing-commands.js");

function createScenario({ accessToken = "session-token", remoteResult, remoteError } = {}) {
  const subscription = {
    id: "subscription-local",
    clientId: "client-a",
    activePlan: "pro",
    planSlug: "pro",
    status: "active",
    subscriptionStatus: "active",
    cancelAtPeriodEnd: false,
    mercadoPagoSubscriptionId: "mp-subscription-a",
    currentPeriodEnd: "2099-12-31T23:59:59.000Z",
    planExpiresAt: "2099-12-31T23:59:59.000Z",
  };
  const client = {
    id: "client-a",
    activePlan: "pro",
    subscriptionStatus: "active",
    cancelAtPeriodEnd: false,
  };
  const billing = {
    clientId: "client-a",
    activePlan: "pro",
    subscriptionStatus: "active",
    cancelAtPeriodEnd: false,
  };
  const calls = { alerts: [], diagnostics: [], events: [], remote: [], saved: 0, rendered: 0 };
  const deps = {
    getClientIdAtual: () => "client-a",
    getBillingConfig: () => billing,
    garantirAssinaturaClienteLocal: () => subscription,
    getPlanAccessState: () => ({
      isFree: false,
      isActive: true,
      isCancelingAtPeriodEnd: false,
      effectivePlan: "pro",
      accessEndsAt: subscription.currentPeriodEnd,
    }),
    getPlanoSaas: () => ({ name: "Pro" }),
    solicitarConfirmacaoAcao: async () => true,
    registrarEventoPlanoSeguro: (name, metadata) => calls.events.push({ name, metadata }),
    syncConfig: { supabaseAccessToken: accessToken },
    chamarFuncaoSaas: async (name, payload) => {
      calls.remote.push({ name, payload });
      if (remoteError) throw remoteError;
      return remoteResult;
    },
    registrarDiagnostico: (...args) => calls.diagnostics.push(args),
    alert: (message) => calls.alerts.push(message),
    getClienteSaasPorId: () => client,
    salvarDados: () => { calls.saved += 1; },
    registrarAuditoria: () => {},
    renderApp: () => { calls.rendered += 1; },
  };
  return { subscription, client, billing, calls, deps };
}

async function run() {
  const remoteFailure = createScenario({ remoteError: new Error("provider unavailable") });
  const remoteFailureBefore = JSON.stringify({
    subscription: remoteFailure.subscription,
    client: remoteFailure.client,
    billing: remoteFailure.billing,
  });
  const remoteFailureResult = await BillingCommands.cancelarAssinaturaCliente(remoteFailure.deps);
  assert.deepEqual(remoteFailureResult, { ok: false, code: "REMOTE_CANCELLATION_FAILED" });
  assert.equal(JSON.stringify({
    subscription: remoteFailure.subscription,
    client: remoteFailure.client,
    billing: remoteFailure.billing,
  }), remoteFailureBefore, "falha remota nao pode alterar assinatura, cliente ou configuracao local");
  assert.equal(remoteFailure.calls.saved, 0);
  assert.equal(remoteFailure.calls.rendered, 0);
  assert.match(remoteFailure.calls.alerts.at(-1), /Nenhuma alteração foi feita/);

  const invalidResponse = createScenario({ remoteResult: { ok: false } });
  const invalidResponseResult = await BillingCommands.cancelarAssinaturaCliente(invalidResponse.deps);
  assert.deepEqual(invalidResponseResult, { ok: false, code: "REMOTE_CANCELLATION_FAILED" });
  assert.equal(invalidResponse.subscription.cancelAtPeriodEnd, false);
  assert.equal(invalidResponse.calls.saved, 0);

  const missingSession = createScenario({ accessToken: "" });
  const missingSessionResult = await BillingCommands.cancelarAssinaturaCliente(missingSession.deps);
  assert.deepEqual(missingSessionResult, { ok: false, code: "AUTH_REQUIRED" });
  assert.equal(missingSession.calls.remote.length, 0);
  assert.equal(missingSession.subscription.cancelAtPeriodEnd, false);
  assert.equal(missingSession.calls.saved, 0);

  const success = createScenario({
    remoteResult: {
      ok: true,
      cancelAtPeriodEnd: true,
      accessEndsAt: "2099-11-30T23:59:59.000Z",
    },
  });
  const successResult = await BillingCommands.cancelarAssinaturaCliente(success.deps);
  assert.deepEqual(successResult, {
    ok: true,
    cancelAtPeriodEnd: true,
    accessEndsAt: "2099-11-30T23:59:59.000Z",
  });
  assert.equal(success.calls.remote.length, 1);
  assert.equal(success.calls.remote[0].name, "mercadopago-cancel-subscription");
  assert.deepEqual(success.calls.remote[0].payload, {
    clienteId: "client-a",
    subscriptionId: "mp-subscription-a",
  });
  assert.equal(success.subscription.cancelAtPeriodEnd, true);
  assert.equal(success.subscription.subscriptionStatus, "canceling");
  assert.equal(success.subscription.currentPeriodEnd, "2099-11-30T23:59:59.000Z");
  assert.equal(success.client.cancelAtPeriodEnd, true);
  assert.equal(success.billing.cancelAtPeriodEnd, true);
  assert.equal(success.calls.saved, 1);
  assert.equal(success.calls.rendered, 1);
  assert.match(success.calls.alerts.at(-1), /Renovação cancelada/);

  console.log("Plan cancellation flow: falhas remotas preservam estado e sucesso exige confirmacao backend.");
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
