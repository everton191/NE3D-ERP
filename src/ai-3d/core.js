(function attachSimplifica3dAiCore(global) {
  "use strict";

  const SLOT_STATE = Object.freeze({ MISSING: "MISSING", PROVIDED: "PROVIDED", RESOLVED: "RESOLVED", AMBIGUOUS: "AMBIGUOUS", INVALID: "INVALID" });
  const INTENT_TYPE = Object.freeze({ CONVERSATIONAL: "CONVERSATIONAL", TASK_UPDATE: "TASK_UPDATE", SUBTASK: "SUBTASK", NEW_TASK: "NEW_TASK", NAVIGATION: "NAVIGATION" });
  const TOOL_STATUS = Object.freeze({ SUCCESS: "SUCCESS", NEEDS_INFORMATION: "NEEDS_INFORMATION", AMBIGUOUS: "AMBIGUOUS", NOT_FOUND: "NOT_FOUND", PERMISSION_DENIED: "PERMISSION_DENIED", VALIDATION_ERROR: "VALIDATION_ERROR", UNAVAILABLE: "UNAVAILABLE", FAILURE: "FAILURE" });
  const OPERATION_TYPE = Object.freeze({ READ: "READ", SIMULATION: "SIMULATION", WRITE: "WRITE" });
  const CAPABILITY_STATE = Object.freeze({ READY: "READY", UNAVAILABLE: "UNAVAILABLE", NOT_IMPLEMENTED: "NOT_IMPLEMENTED", DISABLED_BY_PERMISSION: "DISABLED_BY_PERMISSION", DISABLED_BY_PLAN: "DISABLED_BY_PLAN" });

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const normalizeText = (value) => String(value || "").trim();
  const normalizeSearch = (value) => normalizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const slot = (value = null, state = SLOT_STATE.MISSING, source = "") => ({ value, state, source });

  function createOrderDraft(seed = {}) {
    return {
      kind: "ORDER",
      draftVersion: 1,
      customer: seed.customer ? slot(seed.customer, SLOT_STATE.PROVIDED, "message") : slot(),
      customerId: seed.customerId ? slot(seed.customerId, SLOT_STATE.RESOLVED, "tool") : slot(),
      items: [{
        nome: seed.product ? slot(seed.product, SLOT_STATE.PROVIDED, "message") : slot(),
        pesoGramas: Number(seed.weightGrams) > 0 ? slot(Number(seed.weightGrams), SLOT_STATE.PROVIDED, "message") : slot(),
        quantidade: Number(seed.quantity) > 0 ? slot(Number(seed.quantity), SLOT_STATE.PROVIDED, "message") : slot(1, SLOT_STATE.PROVIDED, "default"),
        valor: Number(seed.unitPrice) > 0 ? slot(Number(seed.unitPrice), SLOT_STATE.PROVIDED, "message") : slot()
      }],
      materials: Array.isArray(seed.materials) ? clone(seed.materials) : [],
      downPayment: Number(seed.downPayment) > 0 ? Number(seed.downPayment) : 0,
      status: String(seed.status || "aberto"),
      notes: String(seed.notes || "")
    };
  }

  function missingSlots(draft) {
    if (!draft) return [];
    const item = draft.items?.[0] || {};
    return [
      ["customer", draft.customer], ["product", item.nome], ["weightGrams", item.pesoGramas], ["unitPrice", item.valor]
    ].filter(([, entry]) => !entry || [SLOT_STATE.MISSING, SLOT_STATE.AMBIGUOUS, SLOT_STATE.INVALID].includes(entry.state)).map(([name]) => name);
  }

  class ConversationSession {
    constructor(data = {}) {
      this.conversationId = data.conversationId || id("conversation");
      this.activeTask = data.activeTask || null;
      this.taskStack = Array.isArray(data.taskStack) ? data.taskStack : [];
      this.activeDraft = data.activeDraft || null;
      if (this.activeDraft && !(Number(this.activeDraft.draftVersion) > 0)) this.activeDraft.draftVersion = 1;
      this.pendingAction = data.pendingAction || null;
      this.conversationState = data.conversationState || "IDLE";
      this.resolvedEntities = data.resolvedEntities || {};
      this.missingSlots = Array.isArray(data.missingSlots) ? data.missingSlots : [];
      this.recentToolResults = Array.isArray(data.recentToolResults) ? data.recentToolResults.slice(-8) : [];
      this.currentTopic = data.currentTopic || "";
      this.lastQuestion = data.lastQuestion || null;
      this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    snapshot() { return clone(this); }
  }

  class TaskStack {
    constructor(session) { this.session = session; }
    push(intent, parentTaskId = this.session.activeTask?.taskId || null) {
      const task = { taskId: id("task"), intent, parentTaskId, startedAt: new Date().toISOString() };
      this.session.taskStack.push(task);
      return task;
    }
    pop(result = null) {
      const task = this.session.taskStack.pop() || null;
      if (task && result) this.session.recentToolResults.push({ taskId: task.taskId, intent: task.intent, result, at: new Date().toISOString() });
      this.session.recentToolResults = this.session.recentToolResults.slice(-8);
      return task;
    }
    current() { return this.session.taskStack[this.session.taskStack.length - 1] || this.session.activeTask; }
  }

  class ConversationTaskManager {
    constructor({ storage = null, storageKey = "simplifica:ai-operational:v2" } = {}) {
      this.storage = storage;
      this.storageKey = storageKey;
      this.session = this.load();
    }
    load() {
      try { return new ConversationSession(JSON.parse(this.storage?.getItem(this.storageKey) || "{}")); }
      catch (_) { return new ConversationSession(); }
    }
    save() {
      this.session.updatedAt = new Date().toISOString();
      this.session.missingSlots = missingSlots(this.session.activeDraft);
      try { this.storage?.setItem(this.storageKey, JSON.stringify(this.session.snapshot())); } catch (_) { }
      return this.session;
    }
    startOrder(seed = {}) {
      const task = { taskId: id("task"), intent: "ORDER.CREATE", domain: "ORDER", startedAt: new Date().toISOString() };
      this.session.activeTask = task;
      this.session.taskStack = [task];
      this.session.activeDraft = createOrderDraft(seed);
      this.session.conversationState = "COLLECTING_INFORMATION";
      this.session.currentTopic = "pedido";
      this.session.pendingAction = null;
      return this.save();
    }
    updateSlot(name, value, state = SLOT_STATE.PROVIDED, source = "message") {
      const draft = this.session.activeDraft;
      if (!draft) return this.session;
      const item = draft.items?.[0];
      if (name === "customer") draft.customer = slot(value, state, source);
      if (name === "customerId") draft.customerId = slot(value, state, source);
      if (name === "product") item.nome = slot(value, state, source);
      if (name === "weightGrams") item.pesoGramas = slot(Number(value), state, source);
      if (name === "quantity") item.quantidade = slot(Number(value), state, source);
      if (name === "unitPrice") item.valor = slot(Number(value), state, source);
      draft.draftVersion = (Number(draft.draftVersion) || 1) + 1;
      if (this.session.pendingAction?.status === "CONFIRMATION_PENDING") this.session.pendingAction.status = "STALE";
      if (this.session.pendingAction) this.session.conversationState = "COLLECTING_INFORMATION";
      return this.save();
    }
    setLastQuestion(question) { this.session.lastQuestion = question; return this.save(); }
    cancel() {
      this.session.activeTask = null; this.session.taskStack = []; this.session.activeDraft = null;
      this.session.pendingAction = null; this.session.missingSlots = []; this.session.currentTopic = "";
      this.session.lastQuestion = null; this.session.conversationState = "CANCELLED";
      return this.save();
    }
    complete(result = null) {
      if (result) this.session.recentToolResults.push({ intent: "ORDER.CREATE", result, at: new Date().toISOString() });
      this.session.recentToolResults = this.session.recentToolResults.slice(-8);
      this.session.activeTask = null; this.session.taskStack = []; this.session.activeDraft = null;
      this.session.pendingAction = null; this.session.missingSlots = []; this.session.currentTopic = "";
      this.session.lastQuestion = null; this.session.conversationState = "COMPLETED";
      return this.save();
    }
  }

  function extractOrderSeed(text) {
    const source = normalizeText(text);
    const weight = source.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gramas?)\b/i);
    const quantity = source.match(/(?:quantidade|qtd)\s*(?:de|:)?\s*(\d+)/i);
    const customer = source.match(/\bpara\s+(?:o\s+|a\s+)?([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][\p{L}'-]*(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][\p{L}'-]*){0,2})(?=[,.!?]|$)/u);
    return { customer: customer?.[1] || "", weightGrams: weight ? Number(weight[1].replace(",", ".")) : 0, quantity: quantity ? Number(quantity[1]) : 0 };
  }

  function extractPricingArguments(text) {
    const source = normalizeText(text);
    const weight = source.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gramas?)\b/i);
    const clock = source.match(/\b(\d{1,3}):([0-5]\d)\b/);
    const hours = source.match(/(\d+(?:[.,]\d+)?)\s*(?:h|horas?)\b/i);
    const minutes = source.match(/(\d+)\s*(?:min|minutos?)\b/i);
    const quantity = source.match(/\b(\d+)\s*(?:pe[cç]as?|unidades?|itens?|chaveiros?|pezinhos?|produtos?)\b/i);
    const timeMinutes = clock
      ? Number(clock[1]) * 60 + Number(clock[2])
      : Math.round((hours ? Number(hours[1].replace(",", ".")) * 60 : 0) + (minutes ? Number(minutes[1]) : 0));
    return {
      weightGrams: weight ? Number(weight[1].replace(",", ".")) : 0,
      quantity: quantity ? Math.max(1, Number(quantity[1])) : 1,
      timeMinutes: Math.max(0, timeMinutes)
    };
  }

  function extractNavigationTarget(text) {
    const value = normalizeSearch(text).replace(/[?.!]+$/g, "");
    const explicit = /\b(abrir|abre|abra|ir|va|vai|leva|leve|acesse|acessar|entrar|entre|voltar|volta)\b/.test(value)
      || /\b(?:mostrar|mostre)\s+(?:a\s+)?tela\b/.test(value);
    if (!explicit) return null;
    if (/\b(novo pedido|novo orcamento|criar pedido)\b/.test(value)) return { routeId: "orders.new", label: "Novo pedido" };
    if (/\b(home|inicio|pagina inicial|tela inicial)\b/.test(value)) return { routeId: "dashboard", label: "Início" };
    if (/\b(pedidos|lista de pedidos)\b/.test(value)) return { routeId: "orders.list", label: "Pedidos" };
    if (/\b(estoque|materiais|filamentos)\b/.test(value)) return { routeId: "inventory.list", label: "Estoque" };
    if (/\b(calculadora|calculo de preco|fazer orcamento)\b/.test(value)) return { routeId: "calculator", label: "Calculadora" };
    if (/\b(caixa|financeiro|financas)\b/.test(value)) return { routeId: "cash.home", label: "Caixa" };
    return null;
  }

  function extractStockQuery(text) {
    return normalizeText(text)
      .replace(/^(?:veja|verifica|verifique|procura|procure|consulta|consulte)\s+(?:se\s+)?(?:tem\s+)?/i, "")
      .replace(/^(?:tem|estoque de)\s+/i, "")
      .replace(/\s+(?:no|em)\s+estoque[?.!]*$/i, "")
      .replace(/[?.!]+$/g, "")
      .trim();
  }

  class ContinuationResolver {
    classify(text, session) {
      const raw = normalizeText(text);
      const value = normalizeSearch(raw);
      const navigation = extractNavigationTarget(raw);
      if (navigation) return { type: INTENT_TYPE.NAVIGATION, intent: "APP.NAVIGATE", ...navigation };
      const pricing = extractPricingArguments(raw);
      const pricingRequest = /\b(orcamento|quanto(?:\s+vai)?\s+(?:dar|custar|ficar)|quanto custa|preco|valor|calcula|calcular|custo)\b/i.test(value)
        || (pricing.weightGrams > 0 && pricing.timeMinutes > 0);
      if (pricingRequest && (pricing.weightGrams > 0 || pricing.timeMinutes > 0)) return { type: INTENT_TYPE.SUBTASK, intent: "PRICE.CALCULATE", arguments: pricing };
      if (/\b(cria|criar|monte|montar|novo)\b.*\bpedido\b/.test(value)) return { type: INTENT_TYPE.NEW_TASK, intent: "ORDER.CREATE", seed: extractOrderSeed(raw) };
      if (/\b(veja|verifica|verifique|procura|procure|consulta|consulte|tem|estoque)\b.*\b(pingente|sacola|embalagem|argola|pla|petg|abs|resina|filamento|material)\w*\b/i.test(value)) {
        return { type: INTENT_TYPE.SUBTASK, intent: "STOCK.SEARCH", arguments: { query: extractStockQuery(raw) } };
      }
      if (/\b(quanto|qual|quais|resumo|mostre|mostrar|consulte|consultar)\b.*\b(saldo|entradas|saidas|caixa|financeiro|vendi|vendas|faturei|faturamento)\b|\b(saldo|resumo)\s+(?:do\s+)?caixa\b/i.test(value)) {
        return { type: INTENT_TYPE.SUBTASK, intent: "CASH.SUMMARY", arguments: { period: /\bhoje\b/.test(value) ? "today" : "all" } };
      }
      if (/\b(quais|quantos|liste|listar|mostre|mostrar|consulte|consultar)\b.*\bpedidos\b|\bresumo\s+(?:dos\s+)?pedidos\b/i.test(value)) {
        return { type: INTENT_TYPE.SUBTASK, intent: "ORDER.SEARCH", arguments: { query: "", limit: 10 } };
      }
      if (/\b(resumo|como esta|como ficou)\b.*\b(home|inicio|negocio|empresa|hoje)\b/i.test(value)) {
        return { type: INTENT_TYPE.SUBTASK, intent: "HOME.SUMMARY", arguments: {} };
      }
      if (/\b(estoque baixo|materiais?\s+(?:estao\s+)?acabando|resumo do estoque|como esta o estoque)\b/i.test(value)) {
        return { type: INTENT_TYPE.SUBTASK, intent: "STOCK.SUMMARY", arguments: {} };
      }
      if (!session?.activeTask) return pricingRequest ? { type: INTENT_TYPE.NAVIGATION, intent: "APP.NAVIGATE", routeId: "calculator", label: "Calculadora" } : { type: INTENT_TYPE.CONVERSATIONAL };
      if (/^(cancela|cancelar|deixa isso|esquece)(\s+(esse|este|o)\s+pedido)?[.!]?$/i.test(value)) return { type: INTENT_TYPE.TASK_UPDATE, action: "CANCEL_TASK" };
      if (/^(sim|confirmo|confirma|pode confirmar|pode salvar|pode criar|salva|cria)[.!]?$/i.test(value) && session.pendingAction) return { type: INTENT_TYPE.TASK_UPDATE, action: "CONFIRM_PENDING", fastPath: true };
      if (/^(prepara|preparar|prepare|revisa|revisar|validar|pode preparar|pode criar|crie|salve|pode salvar)(\s+(esse|este|o)\s+pedido)?[.!]?$/i.test(value)) return { type: INTENT_TYPE.TASK_UPDATE, action: "PREPARE_OPERATION", fastPath: true };
      if (/^(calcula|calcule|pode calcular|prefiro que calcule)[.!]?$/i.test(value)) return { type: INTENT_TYPE.SUBTASK, intent: "PRICE.CALCULATE", arguments: {} };
      const explicitPrice = raw.match(/(?:ent[aã]o\s+)?(?:coloca|coloque|define|p[oõ]e|use)\s+(?:por\s+)?r?\$?\s*(\d+(?:[.,]\d+)?)/i);
      if (explicitPrice) return { type: INTENT_TYPE.TASK_UPDATE, updates: { unitPrice: Number(explicitPrice[1].replace(",", ".")) } };
      const explicitQuantity = raw.match(/(?:muda|altera|coloca|fa[cç]a|faz)(?:\s+(?:a\s+)?quantidade)?\s+(?:para\s+)?(\d+)\b/i);
      if (explicitQuantity) return { type: INTENT_TYPE.TASK_UPDATE, updates: { quantity: Number(explicitQuantity[1]) } };
      if (/\b(acho|achando|pensando|o que voce acha|você acha|acha caro|acha bom|vale a pena)\b/i.test(value)) return { type: INTENT_TYPE.CONVERSATIONAL };
      if (/^(sim|isso|isso mesmo|confirmo)[.!]?$/i.test(value) && session.lastQuestion?.acceptUpdate) return { type: INTENT_TYPE.TASK_UPDATE, updates: session.lastQuestion.acceptUpdate, fastPath: true };
      if (/^(nao|não)[.!]?$/i.test(value) && session.lastQuestion) return { type: INTENT_TYPE.TASK_UPDATE, action: "REJECT_SUGGESTION", fastPath: true };
      const item = session.activeDraft?.items?.[0];
      if (item?.nome?.state === SLOT_STATE.MISSING && /^[\p{L}\d][\p{L}\d -]{1,60}[.!]?$/u.test(raw)) return { type: INTENT_TYPE.TASK_UPDATE, updates: { product: raw.replace(/[.!]$/, "") } };
      return { type: INTENT_TYPE.CONVERSATIONAL };
    }
  }

  class ContextBuilder {
    build({ session, app = {}, messages = [], attachments = [], maxMessages = 8 } = {}) {
      return {
        version: "AI_CONTEXT_V2",
        rules: ["Consultas são livres conforme permissão", "Pedido só pode ser salvo após prévia e confirmação explícita do usuário", "Sugestões não alteram campos"],
        actor: { userId: app.userId || "", companyId: app.companyId || "", plan: app.plan || "", permissions: app.permissions || [] },
        screen: { current: app.screen || "", route: app.route || "", selectedOrderId: app.selectedOrderId || "", selectedCustomerId: app.selectedCustomerId || "" },
        activeTask: clone(session?.activeTask), activeDraft: clone(session?.activeDraft), missingSlots: clone(session?.missingSlots || []),
        resolvedEntities: clone(session?.resolvedEntities || {}), recentMessages: clone(messages.slice(-maxMessages)), recentToolResults: clone((session?.recentToolResults || []).slice(-5)),
        currentTopic: session?.currentTopic || "", conversationState: session?.conversationState || "IDLE",
        attachments: clone(attachments.map(({ id, type, mimeType, width, height }) => ({ id, type, mimeType, width, height })).slice(0, 1))
      };
    }
  }

  class CapabilityRegistry {
    constructor({ allowedOperations = [OPERATION_TYPE.READ, OPERATION_TYPE.SIMULATION] } = {}) { this.allowedOperations = new Set(allowedOperations); this.items = new Map(); }
    register(definition) {
      const item = { state: CAPABILITY_STATE.UNAVAILABLE, ...definition };
      item.state = item.operationType === OPERATION_TYPE.WRITE ? CAPABILITY_STATE.UNAVAILABLE : (item.schema && item.tool && typeof item.adapter === "function" && item.tested === true ? CAPABILITY_STATE.READY : item.state);
      this.items.set(item.name, Object.freeze(item)); return item;
    }
    get(name) { return this.items.get(name); }
    ready() { return [...this.items.values()].filter((item) => item.state === CAPABILITY_STATE.READY && this.allowedOperations.has(item.operationType)); }
    selfTest() {
      const failures = [...this.items.values()].filter((item) => item.state === CAPABILITY_STATE.READY && (!item.schema || !item.tool || typeof item.adapter !== "function" || !this.allowedOperations.has(item.operationType)));
      return { ok: failures.length === 0, failures: failures.map((item) => item.name), ready: this.ready().map((item) => item.name) };
    }
  }

  class ToolRegistry {
    constructor({ capabilities, permissionGuard = () => true } = {}) { this.capabilities = capabilities; this.permissionGuard = permissionGuard; this.tools = new Map(); }
    register(tool) { if (!tool?.name || typeof tool.executor !== "function") throw new Error("Tool inválida."); this.tools.set(tool.name, Object.freeze(tool)); return tool; }
    get(name) { return this.tools.get(name); }
    async execute(name, args = {}, context = {}) {
      const tool = this.get(name); const capability = tool && this.capabilities.get(tool.capability);
      if (!tool || !capability || capability.state !== CAPABILITY_STATE.READY) return { status: TOOL_STATUS.UNAVAILABLE, tool: name };
      if (tool.operationType === OPERATION_TYPE.WRITE) return { status: TOOL_STATUS.UNAVAILABLE, tool: name, reason: "WRITE_DISABLED_PHASE_1" };
      if (!this.permissionGuard(capability, context)) return { status: TOOL_STATUS.PERMISSION_DENIED, tool: name };
      try { return { tool: name, capability: capability.name, ...(await tool.executor(args, context)) }; }
      catch (error) { return { status: TOOL_STATUS.FAILURE, tool: name, errorCode: "TOOL_EXECUTION_FAILED" }; }
    }
  }

  const api = Object.freeze({ SLOT_STATE, INTENT_TYPE, TOOL_STATUS, OPERATION_TYPE, CAPABILITY_STATE, ConversationSession, ConversationTaskManager, ContinuationResolver, TaskStack, ContextBuilder, CapabilityRegistry, ToolRegistry, createOrderDraft, missingSlots, extractOrderSeed, extractPricingArguments, extractNavigationTarget, extractStockQuery, normalizeSearch });
  global.Simplifica3dAiCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
