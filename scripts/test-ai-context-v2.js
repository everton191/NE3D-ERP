"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const C = require("../src/ai-3d/core.js");
global.Simplifica3dAiCore = C;
const { AiOrchestrator3D } = require("../src/ai-3d/orchestrator.js");

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.get(key) || null; }
  setItem(key, value) { this.data.set(key, value); }
}

const storage = new MemoryStorage();
const manager = new C.ConversationTaskManager({ storage, storageKey: "test" });
const resolver = new C.ContinuationResolver();
const contextBuilder = new C.ContextBuilder();
const capabilities = new C.CapabilityRegistry();
const calls = [];
const fixtures = {
  customer_search: { status: C.TOOL_STATUS.SUCCESS, customer: { id: "customer-jose", name: "José" } },
  order_history: { status: C.TOOL_STATUS.SUCCESS, customerName: "José", orders: [{ id: 1, items: ["chaveiro"] }], suggestedProduct: "chaveiro" },
  order_search: { status: C.TOOL_STATUS.SUCCESS, orders: [{ id: 9, customerName: "Ana", status: "Aberto", total: 35 }] },
  price_calculate: { status: C.TOOL_STATUS.SUCCESS, calculatedPrice: 4.7, formattedPrice: "R$ 4,70", warnings: [] },
  stock_search: { status: C.TOOL_STATUS.SUCCESS, matches: [{ id: "stock-1", name: "Pingente", quantity: 40, unit: "un" }] },
  stock_summary: { status: C.TOOL_STATUS.SUCCESS, totalItems: 3, lowStockCount: 1, items: [{ id: "stock-1", name: "PLA preto", quantity: 0.8, unit: "kg" }] },
  cash_summary: { status: C.TOOL_STATUS.SUCCESS, period: "today", entradas: 100, saidas: 30, saldo: 70, formattedEntries: "R$ 100,00", formattedExits: "R$ 30,00", formattedBalance: "R$ 70,00" },
  home_summary: { status: C.TOOL_STATUS.SUCCESS, ordersToday: 2, openOrders: 4, activeProduction: 1, lowStockCount: 1, revenueToday: 100, cashBalanceToday: 70, formattedRevenue: "R$ 100,00", formattedCashBalance: "R$ 70,00" }
};

[
  ["CUSTOMER.SEARCH", "customer_search", C.OPERATION_TYPE.READ],
  ["ORDER.HISTORY", "order_history", C.OPERATION_TYPE.READ],
  ["ORDER.SEARCH", "order_search", C.OPERATION_TYPE.READ],
  ["PRICE.CALCULATE", "price_calculate", C.OPERATION_TYPE.SIMULATION],
  ["STOCK.SEARCH", "stock_search", C.OPERATION_TYPE.READ],
  ["STOCK.SUMMARY", "stock_summary", C.OPERATION_TYPE.READ],
  ["CASH.SUMMARY", "cash_summary", C.OPERATION_TYPE.READ],
  ["HOME.SUMMARY", "home_summary", C.OPERATION_TYPE.READ]
].forEach(([name, tool, operationType]) => capabilities.register({ name, tool, operationType, schema: { input: "object" }, adapter: () => {}, tested: true }));
const blocked = capabilities.register({ name: "ORDER.CREATE", tool: "order_create", operationType: C.OPERATION_TYPE.WRITE, schema: {}, adapter: async () => { throw new Error("WRITE MUST NOT RUN"); }, tested: true });
assert.strictEqual(blocked.state, C.CAPABILITY_STATE.UNAVAILABLE);
assert.deepStrictEqual(capabilities.ready().map((item) => item.name), ["CUSTOMER.SEARCH", "ORDER.HISTORY", "ORDER.SEARCH", "PRICE.CALCULATE", "STOCK.SEARCH", "STOCK.SUMMARY", "CASH.SUMMARY", "HOME.SUMMARY"]);
assert.strictEqual(capabilities.selfTest().ok, true);

const tools = new C.ToolRegistry({ capabilities, permissionGuard: () => true });
Object.keys(fixtures).forEach((name) => tools.register({
  name, capability: { customer_search: "CUSTOMER.SEARCH", order_history: "ORDER.HISTORY", order_search: "ORDER.SEARCH", price_calculate: "PRICE.CALCULATE", stock_search: "STOCK.SEARCH", stock_summary: "STOCK.SUMMARY", cash_summary: "CASH.SUMMARY", home_summary: "HOME.SUMMARY" }[name],
  operationType: name === "price_calculate" ? C.OPERATION_TYPE.SIMULATION : C.OPERATION_TYPE.READ,
  executor: async (args) => { calls.push({ name, args, stackDepth: manager.session.taskStack.length }); return fixtures[name]; }
}));
tools.register({ name: "order_create", capability: "ORDER.CREATE", operationType: C.OPERATION_TYPE.WRITE, executor: async () => { throw new Error("WRITE MUST NOT RUN"); } });

const providerCalls = [];
const provider = { converse: async (text, context) => { providerCalls.push({ text, context }); return "Pelo cálculo e pelo contexto do rascunho, R$ 7 pode ser adequado; confirme explicitamente se quiser usar esse valor."; } };
const telemetry = [];
const orchestrator = new AiOrchestrator3D({ manager, continuationResolver: resolver, contextBuilder, tools, provider, telemetry: (event) => telemetry.push(event) });

(async () => {
  let response = await orchestrator.handle("Cria um pedido de 10 g para José.");
  assert.strictEqual(manager.session.activeTask.intent, "ORDER.CREATE");
  assert.strictEqual(manager.session.activeDraft.customer.value, "José");
  assert.strictEqual(manager.session.activeDraft.items[0].pesoGramas.value, 10);
  assert.strictEqual(manager.session.activeDraft.items[0].nome.state, C.SLOT_STATE.MISSING);
  assert.strictEqual(manager.session.activeDraft.items[0].valor.state, C.SLOT_STATE.MISSING);
  assert.match(response.summary, /chaveiro/i);

  response = await orchestrator.handle("Sim.");
  assert.strictEqual(response.classification.fastPath, true);
  assert.strictEqual(manager.session.activeDraft.items[0].nome.value, "chaveiro");
  assert.strictEqual(manager.session.activeTask.intent, "ORDER.CREATE");

  response = await orchestrator.handle("Calcula.");
  assert.strictEqual(response.classification.type, C.INTENT_TYPE.SUBTASK);
  assert.strictEqual(manager.session.activeTask.intent, "ORDER.CREATE");
  assert.strictEqual(manager.session.taskStack.length, 1);
  assert(calls.find((call) => call.name === "price_calculate" && call.stackDepth === 2), "PRICE.CALCULATE deve executar como subtarefa");
  assert.match(response.summary, /4,70/);

  response = await orchestrator.handle("Veja se tem pingente.");
  assert.strictEqual(manager.session.activeTask.intent, "ORDER.CREATE");
  assert(calls.find((call) => call.name === "stock_search" && call.stackDepth === 2), "STOCK.SEARCH deve executar como subtarefa");
  assert.match(response.summary, /40/);

  response = await orchestrator.handle("Estou pensando em cobrar R$ 7. Você acha caro?");
  assert.strictEqual(response.classification.type, C.INTENT_TYPE.CONVERSATIONAL);
  assert.strictEqual(manager.session.activeDraft.items[0].valor.state, C.SLOT_STATE.MISSING);
  assert.strictEqual(providerCalls.length, 1);
  assert.strictEqual(providerCalls[0].context.activeTask.intent, "ORDER.CREATE");
  assert(providerCalls[0].context.missingSlots.includes("unitPrice"));

  response = await orchestrator.handle("Então coloca R$ 7.");
  assert.strictEqual(response.classification.type, C.INTENT_TYPE.TASK_UPDATE);
  assert.strictEqual(manager.session.activeDraft.items[0].valor.value, 7);
  assert.strictEqual(orchestrator.summarizeDraft().includes("R$ 7,00"), true);
  assert.strictEqual(storage.getItem("test").includes("ORDER.CREATE"), true, "sessão operacional deve persistir");

  const restoredManager = new C.ConversationTaskManager({ storage, storageKey: "test" });
  assert.strictEqual(restoredManager.session.activeDraft.items[0].valor.value, 7, "processo reiniciado deve restaurar o draft");
  const otherAccountManager = new C.ConversationTaskManager({ storage, storageKey: "other-account" });
  assert.strictEqual(otherAccountManager.session.activeTask, null, "troca de conta não pode herdar a tarefa anterior");

  const taskBeforeUnrelatedTopic = manager.session.activeTask.taskId;
  response = await orchestrator.handle("E qual é a diferença entre PLA e PETG?");
  assert.strictEqual(response.classification.type, C.INTENT_TYPE.CONVERSATIONAL);
  assert.strictEqual(manager.session.activeTask.taskId, taskBeforeUnrelatedTopic, "mudança contextual de assunto não deve apagar o pedido");
  response = await orchestrator.handle("O que você acha do preço desse pedido?");
  assert.strictEqual(manager.session.activeTask.taskId, taskBeforeUnrelatedTopic, "retorno ao assunto deve preservar a tarefa");

  const deniedTools = new C.ToolRegistry({ capabilities, permissionGuard: () => false });
  deniedTools.register({ name: "customer_search", capability: "CUSTOMER.SEARCH", operationType: C.OPERATION_TYPE.READ, executor: async () => fixtures.customer_search });
  assert.strictEqual((await deniedTools.execute("customer_search", {})).status, C.TOOL_STATUS.PERMISSION_DENIED);
  assert.strictEqual((await tools.execute("order_create", {})).status, C.TOOL_STATUS.UNAVAILABLE);

  const failingTools = new C.ToolRegistry({ capabilities, permissionGuard: () => true });
  failingTools.register({ name: "stock_search", capability: "STOCK.SEARCH", operationType: C.OPERATION_TYPE.READ, executor: async () => { throw new Error("sensitive internal failure"); } });
  const failedToolResult = await failingTools.execute("stock_search", { query: "PLA" });
  assert.strictEqual(failedToolResult.status, C.TOOL_STATUS.FAILURE);
  assert.strictEqual(failedToolResult.error, undefined, "Tool não deve expor detalhe interno");

  const providerFailureManager = new C.ConversationTaskManager({ storage: new MemoryStorage(), storageKey: "provider-failure" });
  providerFailureManager.startOrder({ customer: "José", product: "chaveiro", weightGrams: 10 });
  const providerFailureTaskId = providerFailureManager.session.activeTask.taskId;
  const providerFailureOrchestrator = new AiOrchestrator3D({
    manager: providerFailureManager, continuationResolver: resolver, contextBuilder, tools,
    provider: { converse: async () => { throw new Error("provider internal details"); } }, telemetry: (event) => telemetry.push(event)
  });
  await assert.rejects(() => providerFailureOrchestrator.handle("O que você acha desse preço?"));
  assert.strictEqual(providerFailureManager.session.activeTask.taskId, providerFailureTaskId, "falha do provider não pode apagar a tarefa");
  assert(providerFailureManager.session.activeDraft, "falha do provider não pode apagar o draft");

  response = await orchestrator.handle("Cancela esse pedido.");
  assert.strictEqual(manager.session.activeTask, null);
  assert.strictEqual(manager.session.activeDraft, null);
  assert.match(response.summary, /nenhum dado.*alterado/i);

  const normalManager = new C.ConversationTaskManager({ storage: new MemoryStorage(), storageKey: "normal" });
  const normalProviderCalls = [];
  const normalOrchestrator = new AiOrchestrator3D({ manager: normalManager, continuationResolver: resolver, contextBuilder, tools, provider: { converse: async (text) => { normalProviderCalls.push(text); return "PLA é mais simples; PETG tende a resistir melhor ao impacto e calor."; } } });
  response = await normalOrchestrator.handle("Faça um orçamento de um pezinho com 20 g de filamento em 3 horas.");
  assert.strictEqual(response.classification.intent, "PRICE.CALCULATE");
  assert.deepStrictEqual(response.classification.arguments, { weightGrams: 20, quantity: 1, timeMinutes: 180 });
  const budgetCall = calls.findLast((call) => call.name === "price_calculate");
  assert.deepStrictEqual(budgetCall.args, { weightGrams: 20, quantity: 1, timeMinutes: 180 });
  assert.match(response.summary, /4,70/);
  assert.doesNotMatch(response.summary, /pedido está completo/i);
  response = await normalOrchestrator.handle("Qual a diferença entre PLA e PETG?");
  assert.strictEqual(response.classification.type, C.INTENT_TYPE.CONVERSATIONAL);
  assert.strictEqual(normalManager.session.activeTask, null);
  assert.strictEqual(normalProviderCalls.length, 1);

  const navigationCases = [
    ["Abrir a Home", "dashboard"], ["Abrir pedidos", "orders.list"], ["Abrir novo pedido", "orders.new"],
    ["Abrir estoque", "inventory.list"], ["Abrir calculadora", "calculator"], ["Abrir caixa", "cash.home"]
  ];
  for (const [prompt, routeId] of navigationCases) {
    response = await normalOrchestrator.handle(prompt);
    assert.strictEqual(response.classification.type, C.INTENT_TYPE.NAVIGATION, `${prompt} deve ser navegação determinística`);
    assert.strictEqual(response.navigationTarget.routeId, routeId);
  }
  response = await normalOrchestrator.handle("Quero fazer um orçamento");
  assert.strictEqual(response.navigationTarget.routeId, "calculator", "orçamento sem dados deve abrir a calculadora");
  response = await normalOrchestrator.handle("Veja se tem filamento preto no estoque");
  assert.strictEqual(response.classification.intent, "STOCK.SEARCH");
  assert.strictEqual(response.classification.arguments.query, "filamento preto");
  response = await normalOrchestrator.handle("Liste os pedidos");
  assert.strictEqual(response.classification.intent, "ORDER.SEARCH");
  assert.strictEqual(response.toolResult.tool, "order_search");
  response = await normalOrchestrator.handle("Como está o estoque?");
  assert.strictEqual(response.classification.intent, "STOCK.SUMMARY");
  assert.strictEqual(response.toolResult.tool, "stock_summary");
  response = await normalOrchestrator.handle("Quais materiais estão acabando?");
  assert.strictEqual(response.classification.intent, "STOCK.SUMMARY");
  response = await normalOrchestrator.handle("Qual o saldo do caixa?");
  assert.strictEqual(response.classification.intent, "CASH.SUMMARY");
  assert.strictEqual(response.toolResult.tool, "cash_summary");
  response = await normalOrchestrator.handle("Quanto vendi hoje?");
  assert.strictEqual(response.classification.intent, "CASH.SUMMARY");
  assert.strictEqual(response.classification.arguments.period, "today");
  response = await normalOrchestrator.handle("Mostre o resumo da Home hoje");
  assert.strictEqual(response.classification.intent, "HOME.SUMMARY");
  assert.strictEqual(response.toolResult.tool, "home_summary");
  assert.strictEqual(normalProviderCalls.length, 1, "funções principais não devem cair no modelo conversacional");

  const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const styleSource = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
  const prepareWebSource = fs.readFileSync(path.join(__dirname, "prepare-web.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "src", "services", "simplifica3dAiRuntime.js"), "utf8");
  assert.match(appSource, /AI_CONTEXT_V2_ENABLED/);
  assert.match(appSource, /registrarTelemetriaAiContextV2/);
  assert.match(appSource, /T_CONTEXT.*T_PROVIDER.*T_PARSE.*T_TOOL.*T_RESPONSE/);
  assert.match(appSource, /unsafeTechnicalMessage/);
  assert.match(styleSource, /grid-template-rows:auto minmax\(0, 1fr\) auto/);
  assert.match(runtimeSource, /FunctionGemmaOnlyProvider/);
  assert.match(runtimeSource, /FUNCTIONGEMMA_WRITE_BLOCKED/);
  assert.doesNotMatch(runtimeSource.match(/async converse[\s\S]*?\n    }\n  }/)?.[0] || "", /Simplifica3dErpBridge\.execute/, "Provider conversacional não pode executar Action legada");
  assert.match(appSource, /searchMaterialsReadOnly/);
  assert.match(appSource, /nome\.startsWith\(termo\)/, "Busca de cliente deve exigir correspondência textual real");
  assert.match(appSource, /CalculatorDomain\.calculate/);
  assert.match(appSource, /function abrirRotaPelaAssistenteIa/);
  assert.match(styleSource, /ai-chat-dialog\.has-context-actions/);
  assert.match(prepareWebSource, /src\/ai-3d\/core\.js/);
  assert.match(prepareWebSource, /src\/ai-3d\/orchestrator\.js/);
  assert.match(prepareWebSource, /src\/ai-3d\/operation-safety\.js/);
  assert.doesNotMatch(appSource.match(/window\.Simplifica3dAiReadFacade = Object\.freeze\(\{[\s\S]*?\n  \}\);/)?.[0] || "", /fecharPedido\(|salvarDados\(|adicionarMovimentoCaixa\(|getConfiguracaoCalculadora\(|normalizarEstoque\(/, "Facade da IA não pode alcançar caminhos com gravação indireta");
  const toolTelemetry = telemetry.filter((event) => event.stage === "T_TOOL");
  assert(toolTelemetry.every((event) => event.conversationId && event.taskId && event.tool && event.result));
  assert(telemetry.some((event) => event.stage === "T_CONTEXT"));
  assert(telemetry.some((event) => event.stage === "T_PROVIDER"));
  assert(telemetry.some((event) => event.stage === "T_PARSE"));
  assert(telemetry.some((event) => event.stage === "T_TOOL"));
  assert(telemetry.some((event) => event.stage === "T_RESPONSE"));
  console.log("AI Context V2: sessão, continuidade, subtarefas, tools e bloqueio WRITE validados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
