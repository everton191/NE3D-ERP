"use strict";
const assert = require("node:assert/strict");
const service = require("../src/features/cash/cash-sync-service.js");

function baseState(events) {
  return { events, paymentMethods: [], operations: [], movements: [], lastError: "" };
}

function saleEvent(overrides = {}) {
  return {
    operationUuid: "op-1",
    eventType: "create",
    orderId: "order-1",
    totalAmount: 100,
    receivedCents: 10000,
    receivedAmount: 100,
    paymentType: "cash",
    clientRequestId: "req-1",
    requestHash: "hash-1",
    metadata: { source: "simplifica-3d" },
    syncStatus: "pending",
    ...overrides
  };
}

function cancelEvent(overrides = {}) {
  return saleEvent({ operationUuid: "op-2", eventType: "cancel", refundAmount: 50, receivedCents: 0, ...overrides });
}

(async () => {
  let state = baseState([saleEvent()]);
  const requests = [];
  const marked = [];
  const errors = [];
  let persists = 0;
  let renders = 0;
  let refreshes = 0;
  const orders = [{ id: "order-1" }];
  const deps = {
    financialCore: { isUuid: (value) => value === "company-1" },
    getCompanyId: () => "company-1",
    hasAuth: () => true,
    isOnline: () => true,
    loadState: () => state,
    saveState: (next) => { state = next; },
    request: async (url, options) => { requests.push({ url, options }); return { action: "registered" }; },
    getDeviceId: () => "device-a",
    ensurePaymentMethods: async () => [{ id: "m-cash", type: "cash" }],
    findOrder: (orderId) => orders.find((item) => String(item.id) === String(orderId)) || null,
    markOrder: (order, patch) => marked.push({ order, patch }),
    persist: () => { persists += 1; },
    refreshCache: async () => { refreshes += 1; },
    render: () => { renders += 1; },
    reportError: (key, error, action, meta) => errors.push({ key, error, action, meta })
  };

  const success = await service.syncPendingFinancialEvents(deps);
  assert.deepEqual(success, { status: "SUCCESS", synced: 1, pending: 0 });
  assert.equal(requests.length, 1, "deve disparar um RPC por evento pendente");
  assert.equal(requests[0].url, "/rest/v1/rpc/register_sale_financial_operation");
  const saleBody = JSON.parse(requests[0].options.body);
  assert.equal(saleBody.p_empresa_id, "company-1");
  assert.equal(saleBody.p_sale_id, "order-1");
  assert.equal(saleBody.p_total_amount, 100);
  assert.equal(saleBody.p_operation_uuid, "op-1");
  assert.equal(saleBody.p_client_request_id, "req-1");
  assert.equal(saleBody.p_request_hash, "hash-1");
  assert.equal(saleBody.p_created_from_device, "device-a");
  assert.equal(saleBody.p_session_id, null);
  assert.deepEqual(saleBody.p_payments_json, [{ payment_method_id: "m-cash", amount: 100, payment_status: "approved", external_reference: "req-1", metadata: { source: "simplifica-3d", order_id: "order-1", event_type: "create" } }]);
  assert.equal(state.events[0].syncStatus, "synced");
  assert.ok(state.events[0].syncedAt, "evento sincronizado deve receber carimbo de tempo");
  assert.equal(marked[0].patch.financial_operation_status, "synced");
  assert.ok(marked[0].patch.financial_synced_at);
  assert.equal(persists, 1);
  assert.equal(refreshes, 1);
  assert.equal(renders, 1);
  assert.equal(errors.length, 0);

  const rerun = await service.syncPendingFinancialEvents(deps);
  assert.deepEqual(rerun, { status: "SUCCESS", synced: 0, pending: 0 }, "rodada seguinte não deve reenviar evento já sincronizado");
  assert.equal(requests.length, 1, "idempotência por operationUuid deve evitar reenvio");

  state = baseState([cancelEvent()]);
  requests.length = 0;
  marked.length = 0;
  persists = 0;
  refreshes = 0;
  renders = 0;
  const cancelled = await service.syncPendingFinancialEvents(deps);
  assert.deepEqual(cancelled, { status: "SUCCESS", synced: 1, pending: 0 });
  assert.equal(requests[0].url, "/rest/v1/rpc/register_order_financial_cancellation");
  const cancelBody = JSON.parse(requests[0].options.body);
  assert.equal(cancelBody.p_refund_amount, 50);
  assert.equal(cancelBody.p_operation_uuid, "op-2");
  assert.equal(cancelBody.p_total_amount, undefined, "cancelamento não envia total da venda");
  assert.equal(cancelBody.p_payments_json, undefined, "cancelamento não envia payments");
  assert.equal(state.events[0].syncStatus, "synced");

  state = baseState([saleEvent({ operationUuid: "op-err" })]);
  requests.length = 0;
  marked.length = 0;
  errors.length = 0;
  const failing = {
    ...deps,
    request: async () => { const error = new Error("rpc falhou"); error.code = "RPC_FAIL"; throw error; }
  };
  const failed = await service.syncPendingFinancialEvents(failing);
  assert.deepEqual(failed, { status: "SUCCESS", synced: 0, pending: 1 });
  assert.equal(state.events[0].syncStatus, "error");
  assert.equal(state.events[0].syncAttempts, 1);
  assert.equal(state.events[0].lastError, "RPC_FAIL");
  assert.ok(state.lastError.includes("rpc falhou"));
  assert.equal(marked[0].patch.financial_operation_status, "error");
  assert.equal(marked[0].patch.financial_sync_error, "RPC_FAIL");
  assert.equal(errors.length, 1);
  assert.equal(errors[0].key, "financial_operation_sync");
  assert.deepEqual(errors[0].meta, { orderId: "order-1", operationUuid: "op-err" });

  state = baseState([saleEvent({ operationUuid: "op-3" }), cancelEvent({ operationUuid: "op-4", orderId: "order-2" })]);
  orders.push({ id: "order-2" });
  requests.length = 0;
  marked.length = 0;
  errors.length = 0;
  persists = 0;
  refreshes = 0;
  renders = 0;
  const mixed = await service.syncPendingFinancialEvents(deps);
  assert.deepEqual(mixed, { status: "SUCCESS", synced: 2, pending: 0 });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, "/rest/v1/rpc/register_sale_financial_operation");
  assert.equal(requests[1].url, "/rest/v1/rpc/register_order_financial_cancellation");
  assert.equal(state.events.every((item) => item.syncStatus === "synced"), true);
  assert.equal(persists, 1, "persistência acontece uma vez após a rodada");
  assert.equal(refreshes, 1);
  assert.equal(renders, 1);

  state = baseState([saleEvent({ operationUuid: "op-skip" })]);
  requests.length = 0;
  const skippedAuth = await service.syncPendingFinancialEvents({ ...deps, hasAuth: () => false });
  assert.deepEqual(skippedAuth, { status: "SKIPPED" });
  const skippedOffline = await service.syncPendingFinancialEvents({ ...deps, isOnline: () => false });
  assert.deepEqual(skippedOffline, { status: "SKIPPED" });
  const skippedCompany = await service.syncPendingFinancialEvents({ ...deps, financialCore: { isUuid: () => false } });
  assert.deepEqual(skippedCompany, { status: "SKIPPED" });
  assert.equal(requests.length, 0, "nenhuma chamada remota sem autenticação, conexão ou empresa válida");

  const manyEvents = Array.from({ length: 35 }, (_, index) => saleEvent({ operationUuid: `op-batch-${index}`, orderId: `order-batch-${index}` }));
  state = baseState(manyEvents);
  requests.length = 0;
  marked.length = 0;
  errors.length = 0;
  persists = 0;
  const batch = await service.syncPendingFinancialEvents(deps);
  assert.deepEqual(batch, { status: "SUCCESS", synced: 30, pending: 0 }, "fila deve processar no máximo 30 eventos por rodada");
  assert.equal(requests.length, 30);
  assert.equal(state.events.filter((item) => item.syncStatus !== "synced").length, 5, "eventos excedentes devem permanecer pendentes para a próxima rodada");

  let lockStarted = null;
  let releaseLock = null;
  state = baseState([saleEvent({ operationUuid: "op-lock" })]);
  requests.length = 0;
  const slow = {
    ...deps,
    request: (url, options) => new Promise((resolve) => {
      requests.push({ url, options });
      lockStarted = () => resolve({ action: "registered" });
      releaseLock = resolve;
    })
  };
  const first = service.syncPendingFinancialEvents(slow);
  const second = service.syncPendingFinancialEvents(slow);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(requests.length, 1, "lock local deve impedir rodadas paralelas");
  releaseLock({ action: "registered" });
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual(firstResult, { status: "SUCCESS", synced: 1, pending: 0 });
  assert.deepEqual(secondResult, firstResult, "chamadas concorrentes devem compartilhar o mesmo resultado de lock");

  let scheduledRuns = 0;
  const scheduled = [];
  state = baseState([saleEvent({ operationUuid: "op-sched" })]);
  requests.length = 0;
  service.scheduleSync(50, () => ({
    ...deps,
    request: async (url, options) => { requests.push({ url, options }); scheduledRuns += 1; return {}; }
  }));
  service.scheduleSync(60, () => ({
    ...deps,
    request: async (url, options) => { requests.push({ url, options }); scheduledRuns += 1; return {}; }
  }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(scheduledRuns, 1, "reagendamento deve debouncing para uma única execução");
  assert.equal(requests.length, 1);

  console.log("Cash sync service: sucesso, cancelamento, erro, idempotência, lock e agendamento preservados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
