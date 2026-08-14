"use strict";
const assert = require("assert");
const O = require("../src/ai-3d/canonical-order.js");
const scenarios = [
  { customerName: "José", items: [{ description: "Chaveiro", quantity: 1, unitPrice: 7 }] },
  { customerName: "Natali", customerPhone: "", items: [{ productId: "p1", description: "Chaveiro", quantity: 100, unitPrice: 4 }, { description: "Sacola", quantity: 2, unitPrice: 1.25 }] },
  { customerId: "c1", customerName: "Cliente", items: [{ description: "Peça", quantity: 999, unitPrice: 4.739, weightGrams: 10, materials: [{ materialId: "m1", materialType: "PETG", color: "preto", quantity: 0.01, unit: "kg" }, { materialId: "m2", materialType: "PLA", color: "branco", quantity: 2, unit: "g" }] }], discounts: [{ type: "fixed", value: 3, amount: 3 }], notes: "Urgente", metadata: { channel: "ai" } },
  { customerName: "Sem peso", items: [{ description: "Personalizado", quantity: 3, unitPrice: 2.5 }], desconto: 0 }
];
const adapter = new O.OrderCreateAdapter();
for (const input of scenarios) {
  const canonical = O.createCanonicalOrder(input); const manualShape = adapter.map(canonical);
  assert.deepStrictEqual(O.normalizeForParity(manualShape), O.normalizeForParity(canonical));
}
const a = { customerName: "X", items: [{ description: "Y", quantity: 120, unitPrice: 7 }], metadata: { b: 2, a: 1 } };
const b = { metadata: { a: 1, b: 2 }, items: [{ unitPrice: 7, quantity: 120, description: "Y" }], customerName: "X" };
assert.strictEqual(O.canonicalHash(a), O.canonicalHash(b));
assert.match(O.canonicalHash(a), /^[a-f0-9]{64}$/);
assert.strictEqual(O.sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
console.log(`ORDER.CREATE parity: ${scenarios.length}/${scenarios.length} cenários canônicos equivalentes (100%).`);
