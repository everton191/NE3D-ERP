(function attachCashSyncService(global) {
  "use strict";
  let syncInFlight = null;
  let scheduleTimer = null;

  async function runSync(deps) {
    const financialCore = deps.financialCore;
    const companyId = deps.getCompanyId();
    if (!financialCore?.isUuid(companyId) || !deps.hasAuth() || !deps.isOnline()) return { status: "SKIPPED" };
    let estado = deps.loadState();
    const pendentes = (estado.events || []).filter((evento) => evento.syncStatus !== "synced").slice(0, 30);
    let synced = 0;
    for (const evento of pendentes) {
      try {
        let paymentMethodId = null;
        if (evento.eventType !== "cancel" && Number(evento.receivedCents) > 0) {
          const methods = await deps.ensurePaymentMethods(companyId);
          paymentMethodId = methods.find((method) => String(method.type || "").toLowerCase() === String(evento.paymentType || "").toLowerCase())?.id || null;
        }
        const payments = evento.eventType !== "cancel" && Number(evento.receivedCents) > 0 ? [{
          payment_method_id: paymentMethodId,
          amount: evento.receivedAmount,
          payment_status: "approved",
          external_reference: evento.clientRequestId,
          metadata: { source: "simplifica-3d", order_id: evento.orderId, event_type: evento.eventType }
        }] : [];
        const deviceId = deps.getDeviceId();
        const result = evento.eventType === "cancel"
          ? await deps.request("/rest/v1/rpc/register_order_financial_cancellation", {
              method: "POST",
              body: JSON.stringify({
                p_empresa_id: companyId,
                p_sale_id: evento.orderId,
                p_refund_amount: evento.refundAmount,
                p_operation_uuid: evento.operationUuid,
                p_client_request_id: evento.clientRequestId,
                p_request_hash: evento.requestHash,
                p_created_from_device: evento.createdFromDevice || deviceId,
                p_metadata_json: evento.metadata
              })
            })
          : await deps.request("/rest/v1/rpc/register_sale_financial_operation", {
              method: "POST",
              body: JSON.stringify({
                p_empresa_id: companyId,
                p_sale_id: evento.orderId,
                p_total_amount: evento.totalAmount,
                p_payments_json: payments,
                p_operation_uuid: evento.operationUuid,
                p_client_request_id: evento.clientRequestId,
                p_request_hash: evento.requestHash,
                p_created_from_device: evento.createdFromDevice || deviceId,
                p_session_id: null,
                p_metadata_json: evento.metadata
              })
            });
        estado = deps.loadState();
        estado.events = estado.events.map((item) => String(item.operationUuid) === String(evento.operationUuid)
          ? { ...item, syncStatus: "synced", syncedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), remoteResult: result, lastError: "" }
          : item);
        deps.saveState({ ...estado, lastError: "" });
        const pedido = deps.findOrder(evento.orderId);
        if (pedido) deps.markOrder(pedido, { financial_operation_status: "synced", financial_synced_at: new Date().toISOString(), financial_sync_error: "" });
        synced += 1;
      } catch (error) {
        estado = deps.loadState();
        estado.events = estado.events.map((item) => String(item.operationUuid) === String(evento.operationUuid)
          ? { ...item, syncStatus: "error", syncAttempts: (Number(item.syncAttempts) || 0) + 1, updatedAt: new Date().toISOString(), lastError: String(error?.code || error?.message || "SYNC_FAILED").slice(0, 180) }
          : item);
        deps.saveState({ ...estado, lastError: String(error?.message || error).slice(0, 180) });
        const pedido = deps.findOrder(evento.orderId);
        if (pedido) deps.markOrder(pedido, { financial_operation_status: "error", financial_sync_error: String(error?.code || "SYNC_FAILED") });
        deps.reportError("financial_operation_sync", error, "Sincronizar operação financeira", { orderId: evento.orderId, operationUuid: evento.operationUuid });
      }
    }
    if (synced) {
      deps.persist();
      await deps.refreshCache(companyId);
      deps.render();
    }
    return { status: "SUCCESS", synced, pending: Math.max(0, pendentes.length - synced) };
  }

  async function syncPendingFinancialEvents(deps = {}) {
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => runSync(deps))();
    try { return await syncInFlight; }
    finally { syncInFlight = null; }
  }

  function scheduleSync(delay = 900, getDeps) {
    clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(() => {
      let deps = {};
      try {
        deps = typeof getDeps === "function" ? getDeps() : (getDeps || {});
      } catch (error) {
        (deps.reportError || (() => {}))("financial_sync_schedule", error, "Agendar sincronização financeira");
        return;
      }
      syncPendingFinancialEvents(deps).catch((error) => (deps.reportError || (() => {}))("financial_sync_schedule", error, "Agendar sincronização financeira"));
    }, Math.max(50, Number(delay) || 900));
  }

  const api = Object.freeze({ syncPendingFinancialEvents, scheduleSync });
  global.SimplificaCashSyncService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
