const assert = require("node:assert/strict");
const AccountSecurity = require("../src/features/account/account-security.js");

const companyId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const deletionAction = "confirm_account_deletion";
const cancellationAction = "confirm_cancel_deletion";

function confirmed(action = deletionAction) {
  return {
    persisted: true, action, company_id: companyId, request_id: requestId,
    ...(action === deletionAction
      ? { scheduled_for: new Date(Date.now() + 15 * 86400000).toISOString() }
      : { cancelled: true }),
    session: { access_token: "synthetic-verified-access", refresh_token: "synthetic-verified-refresh" }
  };
}

function fixture(options = {}) {
  const calls = { requests: [], saved: [], closed: 0, loaded: 0, rendered: 0, toasts: [] };
  const button = { disabled: false };
  const form = { querySelector: () => button };
  const event = { currentTarget: form, preventDefault() {} };
  const context = {
    document: { getElementById: () => ({ value: options.code ?? "123456" }) },
    syncConfig: { supabaseAccessToken: options.accessToken ?? "synthetic-session",
      supabaseEmail: "synthetic@example.invalid", supabaseUrl: "http://127.0.0.1:1",
      supabaseAnonKey: "synthetic-anon" },
    normalizarUrlSupabase: (url) => url,
    fetch: async (url, init) => {
      assert.equal(url, "http://127.0.0.1:1/functions/v1/account-security");
      calls.requests.push(JSON.parse(init.body));
      if (options.fetch) return options.fetch();
      if (options.networkError) throw new Error("Synthetic connection failure");
      return Response.json(options.response ?? { ok: true, data: confirmed(options.action) },
        { status: options.status ?? 200 });
    },
    salvarSessaoSupabase: (...args) => calls.saved.push(args),
    fecharPopup: () => { calls.closed++; },
    carregarSegurancaConta: async () => {
      calls.loaded++;
      if (options.refreshError) throw new Error("Synthetic refresh failure");
    },
    getUsuarioAtual: () => ({ email: "synthetic@example.invalid" }),
    renderApp: () => { calls.rendered++; },
    mostrarToast: (message, type) => calls.toasts.push({ message, type })
  };
  return { calls, button, form, event, context,
    submit: () => AccountSecurity.confirmarAcaoSegurancaConta(event,
      { action: options.action ?? deletionAction, challengeId: "synthetic-challenge" }, context) };
}

function noSuccess(scenario) {
  assert.equal(scenario.calls.saved.length, 0, "unconfirmed response must not replace the session");
  assert.equal(scenario.calls.closed, 0, "unconfirmed response must not close the dialog");
  assert.equal(scenario.calls.loaded, 0);
  assert.equal(scenario.calls.rendered, 0);
  assert(!scenario.calls.toasts.some((toast) => toast.type === "sucesso"));
  assert.equal(scenario.button.disabled, false, "failed request must allow another attempt");
}

async function main() {
  const tests = [];
  const test = (name, run) => tests.push({ name, run });
  test("invalid code does not request confirmation", async () => {
    const scenario = fixture({ code: "12345" });
    await scenario.submit();
    assert.equal(scenario.calls.requests.length, 0);
    noSuccess(scenario);
  });
  for (const options of [
    { accessToken: "" }, { networkError: true },
    { response: { ok: false, error: "OWNER_REQUIRED" }, status: 403 },
    { response: { ok: false, error: "ACCOUNT_DELETION_UNAVAILABLE" } }
  ]) test(`failure remains retryable: ${JSON.stringify(options)}`, async () => {
    const scenario = fixture(options);
    await scenario.submit();
    noSuccess(scenario);
    assert.equal(scenario.calls.toasts.at(-1).type, "erro");
  });
  const invalidResponses = [
    undefined, null, {}, { persisted: true },
    { ...confirmed(), persisted: false },
    { ...confirmed(), action: cancellationAction },
    { ...confirmed(), company_id: "company-from-client" },
    { ...confirmed(), request_id: null },
    { ...confirmed(), scheduled_for: null },
    { ...confirmed(), scheduled_for: "not-a-date" },
    { ...confirmed(), scheduled_for: "2099-12-31" },
    { ...confirmed(), scheduled_for: "2020-01-01T00:00:00.000Z" },
    { ...confirmed(), session: {} }, { ...confirmed(), session: null },
    { ...confirmed(), session: false }, { ...confirmed(), session: "synthetic-token" }
  ];
  for (const [index, data] of invalidResponses.entries()) {
    test(`malformed deletion response ${index} cannot imply persistence`, async () => {
      const scenario = fixture({ response: { ok: true, data } });
      await scenario.submit();
      noSuccess(scenario);
      assert.equal(scenario.calls.toasts.at(-1).type, "erro");
    });
  }
  for (const data of [
    { ...confirmed(cancellationAction), cancelled: false },
    { ...confirmed(cancellationAction), cancelled: undefined },
    { ...confirmed(cancellationAction), persisted: "true" },
    { ...confirmed(cancellationAction), action: deletionAction }
  ]) test("cancellation requires its own persisted contract", async () => {
    const scenario = fixture({ action: cancellationAction, response: { ok: true, data } });
    await scenario.submit();
    noSuccess(scenario);
  });
  for (const action of [deletionAction, cancellationAction]) {
    test(`${action} confirmed by backend`, async () => {
      const scenario = fixture({ action });
      await scenario.submit();
      assert.equal(scenario.calls.requests.length, 1);
      assert.equal(scenario.calls.requests[0].action, action);
      assert.equal(scenario.calls.saved.length, 1);
      assert.equal(scenario.calls.closed, 1);
      assert.equal(scenario.calls.loaded, 1);
      assert.equal(scenario.calls.rendered, 1);
      assert.equal(scenario.calls.toasts.at(-1).type, "sucesso");
    });
    test(`${action} permits an optional absent session`, async () => {
      const data = confirmed(action);
      delete data.session;
      const scenario = fixture({ action, response: { ok: true, data } });
      await scenario.submit();
      assert.equal(scenario.calls.saved.length, 0);
      assert.equal(scenario.calls.toasts.at(-1).type, "sucesso");
    });
    test(`${action} refresh failure does not invite repeating the committed operation`, async () => {
      const scenario = fixture({ action, refreshError: true });
      await scenario.submit();
      assert.equal(scenario.calls.saved.length, 1);
      assert.equal(scenario.calls.closed, 1);
      assert.equal(scenario.calls.loaded, 1);
      assert.equal(scenario.calls.rendered, 0);
      assert.equal(scenario.calls.toasts.at(-1).type, "aviso");
      assert.match(scenario.calls.toasts.at(-1).message, /confirmad[ao].*servidor/i);
      assert.match(scenario.calls.toasts.at(-1).message, /atualiza/i);
      assert(!scenario.calls.toasts.some((toast) => toast.type === "erro"));
      await scenario.submit();
      assert.equal(scenario.calls.requests.length, 1, "committed operation must not be repeated");
    });
  }
  test("concurrent submissions for the same form send only one request", async () => {
    let release;
    const response = new Promise((resolve) => { release = resolve; });
    const scenario = fixture({ fetch: () => response });
    const first = scenario.submit();
    const second = scenario.submit();
    assert.equal(scenario.calls.requests.length, 1);
    release(Response.json({ ok: true, data: confirmed() }));
    await Promise.all([first, second]);
    assert.equal(scenario.calls.saved.length, 1);
    assert.equal(scenario.calls.toasts.filter((toast) => toast.type === "sucesso").length, 1);
  });
  test("failed request releases the form for a retry", async () => {
    let first = true;
    const scenario = fixture({ fetch: async () => {
      if (first) { first = false; throw new Error("Synthetic failure"); }
      return Response.json({ ok: true, data: confirmed() });
    } });
    await scenario.submit();
    noSuccess(scenario);
    await scenario.submit();
    assert.equal(scenario.calls.requests.length, 2);
    assert.equal(scenario.calls.toasts.at(-1).type, "sucesso");
  });
  test("existing email 2FA confirmation contract stays compatible", async () => {
    const scenario = fixture({ action: "verify_2fa",
      response: { ok: true, data: { purpose: "disable_2fa", session: confirmed().session } } });
    await scenario.submit();
    assert.equal(scenario.calls.saved.length, 1);
    assert.equal(scenario.calls.toasts.at(-1).type, "sucesso");
    assert.match(scenario.calls.toasts.at(-1).message, /desativada/);
  });
  const failures = [];
  for (const { name, run } of tests) {
    try { await run(); } catch (error) { failures.push(`${name}: ${error.message}`); }
  }
  assert.equal(failures.length, 0, failures.join("\n"));
  console.log(`PASS account deletion frontend: ${tests.length} behavioral scenarios, offline mocked I/O only.`);
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
