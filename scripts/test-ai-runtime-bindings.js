"use strict";

const assert = require("node:assert/strict");
require("../src/ai/action-registry.js");
const { create } = require("../src/ai/canonical-runtime-bindings.js");
const facade = {
  searchOrdersReadOnly: () => [{ id: "o-1", customerName: "Ana", status: "open" }], searchCustomers: () => [{ id: "c-1", name: "Ana" }],
  searchStock: () => [{ id: "m-1", name: "PLA preto", quantity: 2, unit: "kg" }], cashSummaryReadOnly: () => ({ period: "all", sales: 10, orders: 1, entradas: 10, saidas: 0, saldo: 10 }),
  calculatePrice: () => ({ unitPrice: 12, totalPrice: 24 }), productionSummaryReadOnly: () => ({ active: 1, total: 2 }), searchProductionJobsReadOnly: (status = "all") => status === "all" || status === "pending" ? [{ id: "j-1", itemName: "Suporte", status: "pending" }] : [], searchProductsReadOnly: () => [{ id: "p-1", title: "Suporte", price: 12 }], searchPrintersReadOnly: () => [{ id: "pr-1", name: "Ender", status: "idle" }]
};
const runtime = create({ readFacade: facade, prepareOrder: () => ({ status: "SUCCESS", operationId: "dry-op" }) });
assert.equal(runtime.execute("customers.search", { query: "Ana" }).status, "SUCCESS");
assert.equal(runtime.execute("inventory.search", { query: "PLA" }).items[0].id, "m-1");
assert.equal(runtime.execute("production.list_queue", { status: "pending" }).items[0].id, "j-1");
assert.equal(runtime.execute("production.list_queue", { status: "done" }).status, "NOT_FOUND");
assert.equal(create({ readFacade: { productionSummaryReadOnly: facade.productionSummaryReadOnly } }).execute("production.list_queue", {}).reason, "PRODUCTION_QUEUE_READ_UNAVAILABLE");
assert.equal(create({ readFacade: { searchProductionJobsReadOnly: () => null } }).execute("production.list_queue", {}).reason, "PRODUCTION_QUEUE_READ_INVALID");
assert.equal(runtime.execute("orders.prepare_create", { customer_id: "c-1", items: [{}] }).status, "SUCCESS");
assert.equal(runtime.execute("orders.commit_create", {}).reason, "WRITE_DISABLED");
assert.equal(runtime.execute("fiscal.invoice.search", {}).reason, "EXECUTION_BINDING_UNAVAILABLE");
assert.equal(runtime.execute("unknown.action", {}).reason, "UNKNOWN_ACTION");
assert(runtime.validate().missing.includes("orders.prepare_update"), "unwired exposed action remains visible to the contract audit");
console.log("Canonical runtime bindings: compact ReadFacade results and fail-closed gaps passed.");
