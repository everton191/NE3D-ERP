(function attachPlanNormalizers(global) {
  "use strict";
  const normalizarSlugPlano = (slug = "free") => {
    const value = String(slug || "free").toLowerCase().trim().replace(/-/g, "_");
    if (["basic", "basico", "básico", "gratis", "grátis", "free"].includes(value)) return "free";
    if (["trial", "premium_trial"].includes(value)) return "pro";
    if (["start", "starter", "premium_first_month", "start_monthly"].includes(value)) return "start";
    if (["pro", "premium", "premium_normal", "premium_monthly", "pro_monthly"].includes(value)) return "pro";
    return "free";
  };
  const normalizarBooleanoPlano = (value) => {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value === null || value === undefined) return false;
    return ["true", "1", "sim", "yes", "y"].includes(String(value).toLowerCase().trim());
  };
  const normalizarStatusPlano = (status = "pending") => {
    const value = String(status || "pending").toLowerCase().trim();
    const map = { ativo: "active", ativa: "active", pago: "active", paid: "active", trial: "active", trialing: "active", pendente: "pending", atrasado: "past_due", overdue: "past_due", blocked: "past_due", bloqueado: "past_due", cancelando: "canceling", cancelamento_agendado: "canceling", cancel_at_period_end: "canceling", cancelado: "cancelled", canceled: "cancelled", vencido: "expired", expirado: "expired" };
    const normalized = map[value] || value;
    return ["active", "pending", "canceling", "past_due", "cancelled", "expired"].includes(normalized) ? normalized : "pending";
  };
  const normalizarStatusPagamento = (status = "none") => {
    const value = String(status || "none").toLowerCase().trim();
    const map = { pago: "approved", aprovado: "approved", approved: "approved", pendente: "pending", pending: "pending", recusado: "rejected", rejected: "rejected", cancelado: "cancelled", cancelled: "cancelled", canceled: "cancelled" };
    const normalized = map[value] || value;
    return ["none", "pending", "approved", "rejected", "cancelled", "refunded", "charged_back"].includes(normalized) ? normalized : "none";
  };
  const normalizarStatusAssinaturaDefinitivo = (status = "free") => {
    const value = String(status || "free").toLowerCase().trim();
    const map = { ativo: "active", ativa: "active", pago: "active", paid: "active", trial: "active", trialing: "active", pendente: "free", pending: "free", gratis: "free", grátis: "free", free: "free", cancelando: "canceling", cancelamento_agendado: "canceling", cancel_at_period_end: "canceling", atrasado: "past_due", vencido: "expired", expirado: "expired", cancelado: "cancelled", canceled: "cancelled" };
    const normalized = map[value] || value;
    return ["free", "active", "canceling", "past_due", "cancelled", "expired"].includes(normalized) ? normalized : "free";
  };
  const normalizarBillingVariant = (value = "") => {
    const variant = String(value || "").toLowerCase().trim().replace(/-/g, "_");
    if (["start_monthly", "premium_first_month"].includes(variant)) return "start_monthly";
    if (["pro_monthly", "premium_monthly"].includes(variant)) return "pro_monthly";
    return "start_monthly";
  };
  const api = Object.freeze({ normalizarSlugPlano, normalizarBooleanoPlano, normalizarStatusPlano, normalizarStatusPagamento, normalizarStatusAssinaturaDefinitivo, normalizarBillingVariant });
  global.SimplificaPlanNormalizers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
