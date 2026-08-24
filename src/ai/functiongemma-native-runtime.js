(function attachFunctionGemmaNativeRuntime(global) {
  "use strict";
  const registry = global.SimplificaActionRegistry || (typeof require === "function" ? require("./action-registry.js") : null);
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const NUMBER_FIELDS = new Set(["amount", "opening_amount", "counted_amount", "quantity", "time_minutes", "weight_grams"]);
  const PROPERTY_DESCRIPTIONS = Object.freeze({
    query: "Texto, nome, cliente, material ou número procurado.", status: "Status solicitado.", customer: "Nome do cliente.",
    order_id: "Identificador do pedido.", period: "Período solicitado, como hoje.", quantity: "Quantidade.",
    time_minutes: "Tempo em minutos.", weight_grams: "Peso em gramas."
  });
  // Wire schemas are intentionally narrower than canonical schemas. Search
  // filters/statuses travel as a single natural-language query and are mapped
  // back to the same canonical action after validation.
  const WIRE_FIELDS = Object.freeze({
    "orders.search": Object.freeze(["query"]),
    "customers.search": Object.freeze(["query"]),
    "inventory.search": Object.freeze(["query"]),
    "cash.get_summary": Object.freeze(["period"]),
    "orders.get": Object.freeze(["order_id"]),
    "calculator.quote": Object.freeze(["weight_grams", "time_minutes", "quantity"])
  });
  const WIRE_PROPERTY_DESCRIPTIONS = Object.freeze({
    "orders.search": Object.freeze({ query: "Cliente, número ou texto do pedido procurado." }),
    "customers.search": Object.freeze({ query: "Nome, telefone ou texto do cliente procurado." }),
    "inventory.search": Object.freeze({ query: "Material ou rolo que deve ser procurado." })
  });
  const NAVIGATION_TARGETS = Object.freeze([
    { target: "pedidos", wireName: "navigation_open_orders", anchors: ["pedido", "pedidos", "ped"] },
    { target: "estoque", wireName: "navigation_open_inventory", anchors: ["estoque", "inventario", "material", "rolo", "filamento"] },
    { target: "caixa", wireName: "navigation_open_cash", anchors: ["caixa", "cx"] },
    { target: "producao", wireName: "navigation_open_production", anchors: ["producao", "fila", "impressao"] },
    { target: "clientes", wireName: "navigation_open_customers", anchors: ["cliente", "clientes"] },
    { target: "calculadora", wireName: "navigation_open_calculator", anchors: ["calculadora", "orcamento"] },
    { target: "home", wireName: "navigation_open_home", anchors: ["home", "inicio", "principal"] }
  ]);

  function navigationSpec(action, command) {
    const text = normalize(command);
    const target = NAVIGATION_TARGETS.find((item) => item.anchors.some((anchor) => text.split(/[^a-z0-9]+/).some((token) => token.startsWith(anchor.slice(0, 5)))));
    if (!target) return null;
    return {
      id: action.id, wireName: target.wireName, operationType: action.operationType,
      description: `Abre a tela de ${target.target}.`, properties: [], requiredAll: [], requiredAny: [],
      fixedArguments: { tela: target.target }, anchors: target.anchors
    };
  }

  function toolSpec(action, command) {
    if (action.id === "navigation.open") return navigationSpec(action, command);
    const fields = WIRE_FIELDS[action.id] || action.inputSchema.allowed;
    const narrowedAlternative = action.inputSchema.requiredAny.length && fields.length === 1 && action.inputSchema.requiredAny.includes(fields[0]);
    return {
      id: action.id,
      wireName: action.id.replace(".", "_"),
      operationType: action.operationType,
      description: action.description,
      properties: fields.map((name) => ({
        name,
        type: NUMBER_FIELDS.has(name) ? "NUMBER" : "STRING",
        description: WIRE_PROPERTY_DESCRIPTIONS[action.id]?.[name] || PROPERTY_DESCRIPTIONS[name] || "Valor solicitado."
      })),
      requiredAll: narrowedAlternative ? [...fields] : action.inputSchema.requiredAll.filter((name) => fields.includes(name)),
      requiredAny: narrowedAlternative ? [] : action.inputSchema.requiredAny.filter((name) => fields.includes(name)),
      fixedArguments: {}, anchors: []
    };
  }

  class AndroidFunctionGemmaRuntime {
    constructor() { this.metrics = {}; }
    get plugin() { return global.Capacitor?.Plugins?.SimplificaLocalAi; }
    async load() {
      if (!this.plugin?.loadFunctionGemma) throw new Error("FUNCTIONGEMMA_NATIVE_PLUGIN_UNAVAILABLE");
      const result = await this.plugin.loadFunctionGemma();
      if (!result?.ok) throw new Error(result?.reason || "FUNCTIONGEMMA_LOAD_FAILED");
      this.metrics = result.metrics || {}; return result;
    }
    async warmup() {
      const result = await this.plugin?.warmupFunctionGemma?.();
      if (!result?.ok) throw new Error(result?.reason || "FUNCTIONGEMMA_WARMUP_FAILED");
      this.metrics = result.metrics || this.metrics; return result;
    }
    async unload() { return this.plugin?.unloadFunctionGemma?.(); }
    async cancel() { return this.plugin?.cancelFunctionGemma?.(); }
    async generateToolCall({ command, tools = [], blockedWriteAliases = [] } = {}) {
      if (!this.plugin?.predictFunctionGemma) throw new Error("FUNCTIONGEMMA_NATIVE_PLUGIN_UNAVAILABLE");
      const nativeTools = tools.map((action) => toolSpec(action, command)).filter(Boolean).slice(0, 5);
      if (!nativeTools.length) return { kind: "NO_TOOL", reason: "NO_SEMANTIC_TOP_K_MATCH", arguments: {} };
      const result = await this.plugin.predictFunctionGemma({ command: String(command || ""), tools: nativeTools, blockedWriteAliases });
      this.metrics = result?.metrics || this.metrics;
      const diagnostics = Object.freeze({
        reason: result?.reason || "FUNCTIONGEMMA_DEGRADED",
        rawTool: result?.rawTool || "",
        wireTool: result?.wireTool || "",
        rawText: result?.envelope?.text || "",
        metrics: Object.freeze({ ...(result?.metrics || {}) })
      });
      if (!result?.ok || result.kind !== "TOOL_CALL") {
        return { kind: "NO_TOOL", reason: diagnostics.reason, arguments: {}, diagnostics };
      }
      return { kind: "TOOL_CALL", tool: result.tool, arguments: result.arguments || {}, confidence: 0, reason: result.reason, diagnostics };
    }
    getMetrics() { return Object.freeze({ ...this.metrics }); }
  }

  const runtime = new AndroidFunctionGemmaRuntime();
  global.SimplificaFunctionGemmaNativeRuntime = Object.freeze({ AndroidFunctionGemmaRuntime, runtime, toolSpec });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaFunctionGemmaNativeRuntime;
})(typeof window !== "undefined" ? window : globalThis);
