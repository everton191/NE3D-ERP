"use strict";
const assert = require("assert");
const fs = require("fs");
const C = require("../src/ai-3d/core.js");
global.Simplifica3dAiCore = C;
const { AiOrchestrator3D } = require("../src/ai-3d/orchestrator.js");

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.get(key) || null; }
  setItem(key, value) { this.data.set(key, value); }
}

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} deve existir`);
  const signatureEnd = source.indexOf(")", start);
  const open = source.indexOf("{", signatureEnd);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`corpo de ${name} não encontrado`);
}

(async () => {
  const manager = new C.ConversationTaskManager({ storage: new MemoryStorage(), storageKey: "draft-handoff" });
  const capabilities = new C.CapabilityRegistry();
  capabilities.register({ name: "CUSTOMER.SEARCH", tool: "customer_search", operationType: C.OPERATION_TYPE.READ, schema: {}, adapter: () => {}, tested: true });
  capabilities.register({ name: "ORDER.HISTORY", tool: "order_history", operationType: C.OPERATION_TYPE.READ, schema: {}, adapter: () => {}, tested: true });
  const tools = new C.ToolRegistry({ capabilities, permissionGuard: () => true });
  tools.register({ name: "customer_search", capability: "CUSTOMER.SEARCH", operationType: C.OPERATION_TYPE.READ, executor: async () => ({ status: C.TOOL_STATUS.NOT_FOUND, matches: [] }) });
  tools.register({ name: "order_history", capability: "ORDER.HISTORY", operationType: C.OPERATION_TYPE.READ, executor: async () => ({ status: C.TOOL_STATUS.NOT_FOUND, orders: [] }) });
  let providerCalls = 0;
  const orchestrator = new AiOrchestrator3D({
    manager, continuationResolver: new C.ContinuationResolver(), contextBuilder: new C.ContextBuilder(), tools,
    provider: { converse: async () => { providerCalls += 1; return "não deveria chamar"; } }
  });

  let response = await orchestrator.handle("criar pedido novo de 100 g r$ 25 para Gessinaldo Júnior");
  assert.equal(manager.session.activeDraft.customer.value, "Gessinaldo Júnior");
  assert.equal(manager.session.activeDraft.items[0].pesoGramas.value, 100);
  assert.equal(manager.session.activeDraft.items[0].valor.value, 25);

  const reaisSeed = C.extractOrderSeed("criar pedido novo de 100 g por 25 reais para Gessinaldo Júnior");
  assert.equal(reaisSeed.totalPrice, 25, "preço escrito como 'por 25 reais' deve ser preservado");
  assert.match(response.summary, /item do pedido/i);

  response = await orchestrator.handle("Chaveiro");
  assert.equal(response.draftReady, true);
  assert.equal(manager.session.activeDraft.items[0].nome.value, "Chaveiro");
  assert.equal(manager.session.activeDraft.items[0].valor.value, 25, "valor informado antes deve ser preservado");
  assert.equal(providerCalls, 0, "rascunho completo não deve aguardar inferência conversacional");

  const resolver = new C.ContinuationResolver();
  const stock = resolver.classify("adicionar 1 kg de PLA preto no estoque", new C.ConversationSession());
  assert.equal(stock.routeId, "inventory.draft");
  assert.deepEqual(stock.draft, { material: "PLA", color: "preto", quantityKg: 1 });
  const cash = resolver.classify("registrar saída no caixa de R$ 80 para material em pix", new C.ConversationSession());
  assert.equal(cash.routeId, "cash.draft");
  assert.equal(cash.draft.type, "saida");
  assert.equal(cash.draft.amount, 80);

  const app = fs.readFileSync("app.js", "utf8");
  const orderHandoff = functionBody(app, "abrirRascunhoPedidoPadraoAssistenteIa");
  assert.match(orderHandoff, /abrirPedidoRapidoOperacional/);
  assert.doesNotMatch(orderHandoff, /fecharPedido\(|salvarPedidoRapidoOperacional\(/, "IA apenas preenche; usuário salva");
  assert.match(functionBody(app, "abrirRotaPelaAssistenteIa"), /inventory\.draft[\s\S]*cash\.draft/);
  assert.match(functionBody(app, "abrirCaixaRapidoOperacional"), /draft\.amount/);
  assert.match(functionBody(app, "abrirEstoqueRapidoOperacional"), /draft\.quantityKg/);
  console.log("IA preenche os rascunhos padrão de Pedido, Estoque e Caixa; nenhuma gravação é chamada pela IA.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
