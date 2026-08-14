const assert = require("assert");
const E = require("../src/ai-3d/order-create-executor.js");

const clone = (value) => JSON.parse(JSON.stringify(value));
const normalize = (state) => ({
  orders: state.orders.map(({ createdAt, ...order }) => order),
  cash: state.cash.map(({ createdAt, ...entry }) => entry),
  stock: state.stock.map(({ updatedAt, ...item }) => item)
});
const scenarios = [
  { name: "sem caixa", downPayment: 0, quantity: 1, materials: 1 },
  { name: "com entrada", downPayment: 4, quantity: 2, materials: 1 },
  { name: "múltiplos materiais", downPayment: 7, quantity: 3, materials: 2 },
  { name: "quantidade alta", downPayment: 0, quantity: 120, materials: 1 }
];

function initial() { return { orders: [], cash: [], stock: [{ id: "m1", quantity: 1000 }, { id: "m2", quantity: 1000 }] }; }
function applyStock(state, order) { order.materials.forEach((usage) => { state.stock.find((item) => item.id === usage.id).quantity -= usage.quantity; }); }
function legacy(state, order) {
  applyStock(state, order);
  state.orders.push(order);
  if (order.downPayment > 0) state.cash.push({ orderId: order.id, value: order.downPayment });
  return state;
}

(async () => {
  for (const scenario of scenarios) {
    const order = { id: `order-${scenario.name}`, client_request_id: `request-${scenario.name}`, quantity: scenario.quantity, downPayment: scenario.downPayment, materials: Array.from({ length: scenario.materials }, (_, index) => ({ id: `m${index + 1}`, quantity: scenario.quantity * (index + 1) })) };
    const expected = legacy(initial(), clone(order));
    const actual = initial();
    const executor = new E.OrderCreateTransactionExecutor({
      captureState: () => clone(actual),
      restoreState: (snapshot) => Object.assign(actual, snapshot),
      applyStock: (value) => { applyStock(actual, value); return true; },
      commitOrder: (value) => actual.orders.push(value),
      createCashReceipt: (value) => value.downPayment > 0 ? { orderId: value.id, value: value.downPayment } : null,
      commitCashReceipt: (entry) => actual.cash.push(entry),
      persist: () => true,
      isCommitted: (key) => actual.orders.some((item) => item.client_request_id === key)
    });
    assert.strictEqual((await executor.execute({ order, transactionKey: order.client_request_id })).status, E.STATUS.COMMITTED);
    assert.deepStrictEqual(normalize(actual), normalize(expected), scenario.name);
  }
  console.log(`ORDER.CREATE sandbox parity: ${scenarios.length}/${scenarios.length} estados equivalentes, sem storage real.`);
})().catch((error) => { console.error(error); process.exit(1); });
