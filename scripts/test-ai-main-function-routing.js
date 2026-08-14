const assert = require("assert");
const C = require("../src/ai-3d/core.js");

const resolver = new C.TaskResolver();
const idle = { activeTask: null, pendingAction: null };
const staleOrderTask = { activeTask: { taskId: "old-order", intent: "ORDER.CREATE" }, activeDraft: { items: [] }, pendingAction: null };

const expectNavigation = (text, routeId, session = idle) => {
  const result = resolver.classify(text, session);
  assert.strictEqual(result.type, C.INTENT_TYPE.NAVIGATION, `${text} deveria ser navegação`);
  assert.strictEqual(result.routeId, routeId, `${text} deveria abrir ${routeId}`);
};

expectNavigation("Abrir a Home", "dashboard");
expectNavigation("Abrir pedidos", "orders.list");
expectNavigation("Abrir estoque", "inventory.list");
expectNavigation("Abrir caixa", "cash.home");
expectNavigation("Abrir calculadora", "calculator");
expectNavigation("Quero fazer um orçamento", "calculator");
expectNavigation("Fazer orçamento", "calculator", staleOrderTask);

const pricedQuote = resolver.classify("Faça um orçamento de 120 g e 2 horas", idle);
assert.strictEqual(pricedQuote.intent, "PRICE.CALCULATE");
assert.strictEqual(pricedQuote.arguments.weightGrams, 120);
assert.strictEqual(pricedQuote.arguments.timeMinutes, 120);

const stock = resolver.classify("Quanto tenho de PLA no estoque?", idle);
assert.strictEqual(stock.intent, "STOCK.SEARCH");
const cash = resolver.classify("Quanto vendi hoje?", idle);
assert.strictEqual(cash.intent, "CASH.SUMMARY");
assert.strictEqual(cash.arguments.metric, "sales");
const home = resolver.classify("Mostre o resumo da Home hoje", idle);
assert.strictEqual(home.intent, "HOME.SUMMARY");

console.log("IA: Home, Pedidos, Estoque, Calculadora e Caixa roteados deterministicamente.");
