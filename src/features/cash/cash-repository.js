(function attachCashRepository(global) {
  "use strict";
  async function ensurePaymentMethods(companyId, deps = {}) {
    const state = deps.loadState();
    if (state.paymentMethods.some((method) => method?.id && method?.type)) return state.paymentMethods;
    await deps.request("/rest/v1/rpc/ensure_default_payment_methods", { method: "POST", body: JSON.stringify({ p_empresa_id: companyId }) });
    const methods = await deps.request(`/rest/v1/payment_methods?empresa_id=eq.${encodeURIComponent(companyId)}&active=is.true&select=id,name,type&order=name.asc`);
    deps.saveState({ ...state, paymentMethods: Array.isArray(methods) ? methods : [] });
    return Array.isArray(methods) ? methods : [];
  }
  async function refreshCanonicalFinancialCache(companyId, deps = {}) {
    const financialCore = deps.financialCore;
    if (!financialCore?.isUuid(companyId) || !deps.hasAccessToken() || !deps.isOnline()) return { status: "SKIPPED" };
    const filter = `empresa_id=eq.${encodeURIComponent(companyId)}`;
    const [operations, movements, paymentMethods] = await Promise.all([
      deps.request(`/rest/v1/erp_financial_operations?${filter}&select=id,operation_uuid,client_request_id,operation_type,status,sale_id,payload_json,result_json,created_at,updated_at&order=created_at.desc&limit=600`),
      deps.request(`/rest/v1/cash_movements?${filter}&select=id,session_id,type,amount,payment_method_id,description,reference_collection,reference_id,operation_uuid,client_request_id,metadata_json,cancelled_at,created_at&order=created_at.desc&limit=800`),
      deps.request(`/rest/v1/payment_methods?${filter}&select=id,name,type,active&order=name.asc`)
    ]);
    const state = deps.loadState();
    deps.saveState({ ...state, operations: Array.isArray(operations) ? operations : [], movements: Array.isArray(movements) ? movements : [], paymentMethods: Array.isArray(paymentMethods) ? paymentMethods : [], lastError: "" });
    return { status: "SUCCESS", operations: operations?.length || 0, movements: movements?.length || 0 };
  }
  const api = Object.freeze({ ensurePaymentMethods, refreshCanonicalFinancialCache });
  global.SimplificaCashRepository = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
