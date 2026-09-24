(function attachCustomersSaasQuery(global) {
  "use strict";
  function matchesClient(client, filters = {}, deps = {}) {
    if (deps.normalizeEmail(client.email) === deps.bootstrapEmail()) return false;
    if (client.archivedAt) return false;
    const normalizeText = deps.normalizeText;
    const general = normalizeText(filters.busca || "");
    const name = String(filters.nome || "").toLowerCase();
    const email = String(filters.email || "").toLowerCase();
    const plan = String(filters.plano || "");
    const status = String(filters.status || "");
    const subscription = deps.subscription(client.id);
    const clientPlan = deps.plan(subscription?.activePlan || client.activePlan || subscription?.planSlug || client.planoAtual || "free");
    if (general) {
      const target = normalizeText([client.name, client.email, client.phone, client.whatsapp, client.clientCode, client.slug, clientPlan.name, clientPlan.slug].filter(Boolean).join(" "));
      if (!target.includes(general)) return false;
    }
    if (name && !normalizeText(client.name).includes(normalizeText(name))) return false;
    if (email && !normalizeText(client.email).includes(normalizeText(email))) return false;
    if (plan && clientPlan.slug !== plan) return false;
    return !status || client.status === status;
  }
  function filterClients(clients = [], filters = {}, deps = {}) {
    return clients.filter((client) => matchesClient(client, filters, deps));
  }
  function paginateClients(list = [], requestedPage = 1, pageSize = 20) {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, Number(requestedPage) || 1), totalPages);
    const start = (page - 1) * pageSize;
    return { page, total, totalPages, start, end: Math.min(start + pageSize, total), items: list.slice(start, start + pageSize) };
  }
  function companySummary(client = {}, deps = {}) {
    const subscription = deps.subscription(client.id);
    const users = deps.users(client.id);
    const registeredPlan = deps.plan(subscription?.activePlan || client.activePlan || subscription?.planSlug || client.planoAtual || "free");
    const payments = deps.payments().filter((payment) => payment.clientId === client.id);
    const approvedPayments = payments.filter((payment) => payment.status === "approved");
    const expiringPlan = ["start", "pro"].includes(registeredPlan.slug);
    const registeredExpiration = expiringPlan ? (subscription?.currentPeriodEnd || subscription?.planExpiresAt || subscription?.expiresAt || client.planExpiresAt || "") : "";
    const expired = expiringPlan && deps.timestamp(registeredExpiration) > 0 && deps.timestamp(registeredExpiration) <= deps.now();
    const plan = expired ? deps.plan("free") : registeredPlan;
    const activity = deps.activity(client, users);
    return { subscription, users, plan, registeredPlan, payments, approvedPayments, expiration: expired ? "" : registeredExpiration, expired, lastAccess: activity.lastSeenAt, planStatus: expired ? "Acesso encerrado" : deps.planStatus(client, subscription), online: activity.online, activity, test: !!client.isTestUser, responsible: users[0] || {} };
  }
  const api = Object.freeze({ matchesClient, filterClients, paginateClients, companySummary });
  global.SimplificaCustomersSaasQuery = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
