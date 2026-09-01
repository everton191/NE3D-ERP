"use strict";
const assert = require("node:assert/strict");
const router = require("../src/ai/deterministic-router.js");
const cases = [
  ["abre pedidos", "navigation.open", { tela: "pedidos" }],
  ["me leva pro estoque", "navigation.open", { tela: "estoque" }],
  ["quanto tem no caixa?", "cash.get_summary", null],
  ["mostra o pedido 123", "orders.get", { order_id: "123" }],
  ["busca o cliente João", "customers.search", null],
  ["quanto tem de PLA preto no estoque", "inventory.search", null],
  ["o que tem na produção", "production.list_queue", null],
  ["abre a calculadora", "navigation.open", { tela: "calculadora" }],
  ["calcula uma peça de 200 gramas", "calculator.quote", null],
  ["qunto cust impressão de dus hors", "calculator.quote", null],
  ["buscar produto chaveiro", "products.search", null],
  ["qual impressora está imprimindo?", "printers.search", null],
  ["abre relatórios", "navigation.open", { tela: "relatorios" }]
];
for (const [input, action, args] of cases) {
  const value = router.resolve(input);
  assert.equal(value?.tool, action, input);
  if (args) assert.deepEqual(value.arguments, args, input);
  assert.equal(value.diagnostics.modelInvoked, false, input);
}
assert.equal(router.resolve("qunto cust impressão de dus hors").arguments.time_minutes, 120);
assert.equal(router.resolve("se eu abrir pedidos, o que acontece?"), null);
assert.equal(router.resolve("faz alguma coisa"), null);
const incomplete = router.resolve("calcula uma peça de 200 gramas");
assert.deepEqual(incomplete.missing, ["time_minutes"]);
console.log("Deterministic AI router: 13 intents seguras validadas sem LLM.");
