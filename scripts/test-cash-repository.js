"use strict";
const assert = require("node:assert/strict");
const repository = require("../src/features/cash/cash-repository.js");

(async () => {
  let state = { paymentMethods: [], operations: [], movements: [] };
  const requests = [];
  const deps = { request: async (url, options) => { requests.push({ url, options }); return url.includes("payment_methods?") ? [{ id: "pix", type: "instant" }] : []; }, loadState: () => state, saveState: (next) => { state = next; } };
  const methods = await repository.ensurePaymentMethods("company-1", deps);
  assert.deepEqual(methods, [{ id: "pix", type: "instant" }]);
  assert.equal(requests.length, 2, "Métodos ausentes devem passar pelo RPC e pela consulta canônica.");
  requests.length = 0;
  assert.deepEqual(await repository.ensurePaymentMethods("company-1", deps), methods);
  assert.equal(requests.length, 0, "Cache válido não deve chamar Supabase novamente.");
  state = { paymentMethods: [], operations: [], movements: [] };
  const result = await repository.refreshCanonicalFinancialCache("company-1", { financialCore: { isUuid: (value) => value === "company-1" }, hasAccessToken: () => true, isOnline: () => true, request: async (url) => url.includes("erp_financial_operations") ? [{ id: "op" }] : url.includes("cash_movements") ? [{ id: "move" }] : [{ id: "cash", type: "cash" }], loadState: () => state, saveState: (next) => { state = next; } });
  assert.deepEqual(result, { status: "SUCCESS", operations: 1, movements: 1 });
  assert.equal(state.paymentMethods[0].id, "cash");
  assert.deepEqual(await repository.refreshCanonicalFinancialCache("bad", { financialCore: { isUuid: () => false }, hasAccessToken: () => true, isOnline: () => true, request: async () => { throw new Error("não deve chamar"); }, loadState: () => state, saveState: () => {} }), { status: "SKIPPED" });
  console.log("Cash repository: cache, RPC e guardas de acesso preservados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
