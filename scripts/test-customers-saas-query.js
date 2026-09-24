"use strict";
const assert = require("node:assert/strict");
const query = require("../src/features/customers/customers-saas-query.js");
const deps = {
  normalizeEmail: (value) => String(value || "").toLowerCase().trim(),
  bootstrapEmail: () => "root@example.com",
  normalizeText: (value) => String(value || "").toLowerCase().trim(),
  subscription: () => ({ activePlan: "pro" }),
  plan: (slug) => ({ slug, name: slug === "pro" ? "Pro" : "Grátis" })
};
const clients = [{ id: 1, name: "Ana", email: "ana@example.com", status: "active" }, { id: 2, name: "Root", email: "root@example.com", status: "active" }, { id: 3, name: "Arquivado", email: "old@example.com", archivedAt: "x", status: "active" }];
assert.deepEqual(query.filterClients(clients, { busca: "ana" }, deps).map((item) => item.id), [1]);
assert.equal(query.matchesClient(clients[0], { plano: "pro", status: "active" }, deps), true);
assert.equal(query.matchesClient(clients[0], { plano: "free" }, deps), false);
assert.deepEqual(query.paginateClients([1, 2, 3], 9, 2), { page: 2, total: 3, totalPages: 2, start: 2, end: 3, items: [3] });
const summary = query.companySummary({ id: "c1", activePlan: "pro", planExpiresAt: "2026-01-01", isTestUser: true }, {
  subscription: () => ({ activePlan: "pro", currentPeriodEnd: "2026-01-01" }),
  users: () => [{ id: "u1" }],
  plan: (slug) => ({ slug, name: slug }),
  payments: () => [{ clientId: "c1", status: "approved" }, { clientId: "other", status: "approved" }],
  timestamp: () => 1,
  now: () => 2,
  activity: () => ({ lastSeenAt: "2025-12-31", online: false }),
  planStatus: () => "Ativo"
});
assert.equal(summary.plan.slug, "free");
assert.equal(summary.expired, true);
assert.equal(summary.approvedPayments.length, 1);
assert.equal(summary.responsible.id, "u1");
console.log("Customers SaaS query: filtros e exclusões preservados.");
