const assert = require("assert");
const F = require("../src/services/simplifica3dFinancialCore.js");

const companyId = "11111111-1111-4111-8111-111111111111";
const order = {
  id: 80,
  status: "aberto",
  total: 80,
  down_payment: 30,
  operation_uuid: "22222222-2222-4222-8222-222222222222",
  client_request_id: "order-80",
  criadoEm: "2026-08-14T10:00:00-03:00"
};
const event = F.buildOrderFinancialEvent({
  order,
  companyId,
  cashReceipt: { valor: 30, payment_method_type: "pix" },
  eventType: "create"
});
assert.strictEqual(event.totalCents, 8000);
assert.strictEqual(event.receivedCents, 3000);
assert.strictEqual(event.operationUuid, order.operation_uuid);
const cancelledEvent = F.buildOrderFinancialEvent({
  order: { ...order, status: "cancelado", deleted_at: "2026-08-14T12:00:00-03:00" },
  companyId,
  cashReceipt: { valor: 30, payment_method_type: "pix" },
  eventType: "cancel"
});
assert.notStrictEqual(cancelledEvent.operationUuid, event.operationUuid);
assert(F.isUuid(cancelledEvent.operationUuid));
assert.strictEqual(cancelledEvent.totalCents, 0);
assert.strictEqual(cancelledEvent.receivedCents, 0);
assert.strictEqual(cancelledEvent.refundCents, 3000);
assert(cancelledEvent.clientRequestId.startsWith("order_cancel:"));
assert.strictEqual(F.moneyToCents("1.234,56"), 123456);
assert.strictEqual(F.centsToMoney(15000), 150);
assert(F.isUuid(F.uuidFrom("legacy-operation-id")));

const operations = [
  { id: "op-10", sale_id: "10", status: "completed", created_at: "2026-08-14T09:00:00-03:00", payload_json: { total_amount: 10, metadata: { order_status: "aberto", event_type: "create", order_created_at: "2026-08-14T09:00:00-03:00" } } },
  { id: "op-80", sale_id: "80", status: "completed", created_at: "2026-08-14T10:00:00-03:00", payload_json: { total_amount: 80, metadata: { order_status: "aberto", event_type: "create", order_created_at: "2026-08-14T10:00:00-03:00" } } },
  { id: "op-150-old", sale_id: "150", status: "completed", created_at: "2026-08-14T10:30:00-03:00", payload_json: { total_amount: 120, metadata: { order_status: "aberto", event_type: "create", order_created_at: "2026-08-14T10:30:00-03:00" } } },
  { id: "op-150", sale_id: "150", status: "completed", created_at: "2026-08-14T11:00:00-03:00", payload_json: { total_amount: 150, metadata: { order_status: "producao", event_type: "update", order_created_at: "2026-08-14T10:30:00-03:00" } } },
  { id: "op-cancel", sale_id: "999", status: "completed", created_at: "2026-08-14T12:00:00-03:00", payload_json: { total_amount: 0, metadata: { order_status: "cancelado", event_type: "cancel" } } }
];
const movements = [
  { id: "m1", type: "sale", amount: 10, reference_id: "10", created_at: "2026-08-14T09:00:00-03:00" },
  { id: "m2", type: "sale", amount: 80, reference_id: "80", created_at: "2026-08-14T10:00:00-03:00" },
  { id: "m3", type: "sale", amount: 150, reference_id: "150", created_at: "2026-08-14T11:00:00-03:00" },
  { id: "m4", type: "retirada", amount: 20, created_at: "2026-08-14T12:00:00-03:00" }
];
const projection = F.projectFinancialState({
  operations,
  movements,
  from: "2026-08-14T00:00:00-03:00",
  to: "2026-08-15T00:00:00-03:00"
});
assert.strictEqual(projection.totalSalesCents, 24000);
assert.strictEqual(projection.totalOrders, 3);
assert.strictEqual(projection.entriesCents, 24000);
assert.strictEqual(projection.exitsCents, 2000);
assert.strictEqual(projection.cashBalanceCents, 22000);
assert.deepStrictEqual(projection.chartSeries, [{ date: "2026-08-14", valueCents: 24000, value: 240 }]);

const reconciliation = F.reconcileFinancialState({
  orders: [order, { id: 10, status: "aberto", total: 10, down_payment: 10 }],
  operations,
  movements
});
assert.deepStrictEqual(reconciliation.missingFinancialOperation, []);
assert.strictEqual(reconciliation.wrongAmount.length, 0);
assert(reconciliation.orphanMovement.includes("m3"));

console.log("Financial Core: centavos, criação/cancelamento idempotentes, projeção R$ 10/80/150 e reconciliação validados.");
