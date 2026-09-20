(function attachOrdersRepository(global) {
  "use strict";
  function getPedidosPersistidosNoEscopoAtual(deps = {}) {
    const scope = deps.getEscopoDadosAtual?.() || "";
    if (scope) return deps.lerCacheDadosUsuario?.(scope)?.data?.pedidos || [];
    const raw = deps.storage?.getItem("pedidos") || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }
  function salvarPedidoComVerificacaoLocal(order, deps = {}) {
    if (deps.getFault?.() === "BEFORE_LOCAL_PERSIST") throw new Error("FAULT_BEFORE_LOCAL_PERSIST");
    deps.salvarDados?.();
    if (deps.getFault?.() === "AFTER_LOCAL_PERSIST") throw new Error("FAULT_AFTER_LOCAL_PERSIST");
    const transactionKey = String(order?.client_request_id || order?.clientRequestId || "");
    const persisted = getPedidosPersistidosNoEscopoAtual(deps);
    const found = persisted.some((item) => String(item.client_request_id || item.clientRequestId || "") === transactionKey);
    if (!transactionKey || !found) throw new Error("ORDER_LOCAL_PERSISTENCE_NOT_VERIFIED");
    return true;
  }
  const api = Object.freeze({ getPedidosPersistidosNoEscopoAtual, salvarPedidoComVerificacaoLocal });
  global.SimplificaOrdersRepository = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
