const assert = require("assert");

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
}
global.localStorage = memoryStorage();
const M = require("../src/services/monetizationLimits.js");
let now = 1000;
M.configure({ now: () => now, isPremiumResolver: () => false });
M.resetForTests();
const user = { email: "free@example.com", activePlan: "free" };

const receipt = M.registerAction(user, "criar_pedido");
assert.strictEqual(M.getRemainingFreeActions(user), 4);
const refund = M.refundRegisteredAction(user, "criar_pedido", receipt);
assert.strictEqual(refund.refunded, true);
assert.strictEqual(M.getRemainingFreeActions(user), 5);
assert.strictEqual(M.refundRegisteredAction(user, "criar_pedido", receipt).reason, "RECEIPT_STALE");

const first = M.registerAction(user, "criar_pedido");
now += 1;
M.registerAction(user, "criar_pedido");
assert.strictEqual(M.refundRegisteredAction(user, "criar_pedido", first).reason, "RECEIPT_STALE", "recibo antigo não pode remover crédito de outra ação");
assert.strictEqual(M.refundRegisteredAction(user, "abrir_dashboard", first).reason, "NOT_COUNTED");

console.log("Crédito Free: compensação por recibo exato e proteção contra recibo stale validadas.");
