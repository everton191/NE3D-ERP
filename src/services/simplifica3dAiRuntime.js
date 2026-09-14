(function attachSimplifica3dAiRuntime(global) {
  "use strict";

  const FUNCTIONGEMMA_MODEL_ID = "functiongemma-270m-it-q8_0";
  const LFM_Q4_MODEL_ID = "lfm2.5-1.2b-q4_0";
  const LFM_MODEL_ID = "lfm2.5-1.2b-q6_k";
  // The candidate has no verified GGUF metadata yet. It is deliberately selectable
  // for integration tests, but cannot load or silently replace the fallback.
  const MODEL_CATALOG = Object.freeze({
    [FUNCTIONGEMMA_MODEL_ID]: Object.freeze({ id: FUNCTIONGEMMA_MODEL_ID, available: true, fallback: true }),
    [LFM_Q4_MODEL_ID]: Object.freeze({ id: LFM_Q4_MODEL_ID, available: false, experimental: true, reason: "LFM_ARTIFACT_UNVERIFIED" }),
    [LFM_MODEL_ID]: Object.freeze({ id: LFM_MODEL_ID, available: false, experimental: true, reason: "LFM_ARTIFACT_UNVERIFIED" }),
    disabled: Object.freeze({ id: "disabled", available: false })
  });
  const WEB_MODEL_ID = "functiongemma-270m-it-q8_0-web";
  let adapter = null;
  let adapterRuntime = null;
  let preparationPromise = null;

  function deterministicNavigation(text) {
    const decision = global.SimplificaDeterministicRouter?.resolve?.(text, {});
    return decision?.tool === "navigation.open" ? decision : null;
  }

  function nonExecutableReason(text) {
    const normalized = String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    if (/^nao\b/.test(normalized)) return "NEGATED_COMMAND";
    if (/^se eu\b.*\bo que acontece\??$/.test(normalized)) return "HYPOTHETICAL_REQUEST";
    return null;
  }

  function nativePlugin() { return global.Capacitor?.Plugins?.SimplificaLocalAi || null; }
  function functionGemmaRuntimeForPlatform() {
    return nativePlugin()?.predictFunctionGemma
      ? global.SimplificaFunctionGemmaNativeRuntime?.runtime
      : global.SimplificaFunctionGemmaWebRuntime?.runtime;
  }
  function selectedModelId() {
    const requested = String(global.SIMPLIFICA_AI_TOOL_MODEL || global.__SIMPLIFICA_AI_TOOL_MODEL__ || "").trim();
    return MODEL_CATALOG[requested] ? requested : FUNCTIONGEMMA_MODEL_ID;
  }
  function modelSelection() { const id = selectedModelId(); return Object.freeze({ ...MODEL_CATALOG[id], selected: id, writeExposed: 0 }); }

  const webProvider = global.UniversalAssistantWebProvider?.WebLocalModelProvider ? new global.UniversalAssistantWebProvider.WebLocalModelProvider({
    appId: global.SimplificaAssistantPack?.modelScope || "simplifica-3d",
    runtime: global.SimplificaFunctionGemmaWebRuntime?.runtime || null,
    artifacts: global.SimplificaWebAiArtifacts || global.__SIMPLIFICA_WEB_AI_ARTIFACTS__ || []
  }) : null;

  async function prepareWebRuntime() {
    if (!webProvider) throw new Error("FUNCTIONGEMMA_WEB_UNAVAILABLE");
    let status = await webProvider.status();
    if (!status.enabled) status = await webProvider.setEnabled(true);
    if (!status.modelReady) {
      const catalog = await webProvider.listModels();
      const descriptor = catalog.models.find((item) => item.id === WEB_MODEL_ID) || catalog.models[0];
      if (!descriptor?.available) throw new Error(status.reason || "FUNCTIONGEMMA_WEB_ARTIFACT_UNAVAILABLE");
      status = await webProvider.installModel(descriptor.id);
    } else {
      status = await webProvider.prewarm();
    }
    if (!status.runtimeReady) throw new Error(status.reason || "FUNCTIONGEMMA_WEB_NOT_READY");
    return status;
  }

  async function prepareFunctionGemma() {
    if (preparationPromise) return preparationPromise;
    preparationPromise = (async () => {
      const runtime = functionGemmaRuntimeForPlatform();
      const Adapter = global.SimplificaFunctionGemmaAdapter?.FunctionGemmaAdapter;
      if (!runtime || !Adapter) throw new Error("FUNCTIONGEMMA_RUNTIME_UNAVAILABLE");
      if (!nativePlugin()?.predictFunctionGemma) await prepareWebRuntime();
      if (!adapter || adapterRuntime !== runtime) {
        adapter = new Adapter({ runtime, mode: "functiongemma", shadow: false });
        adapterRuntime = runtime;
      }
      if (!adapter.getMetrics().loaded) {
        await adapter.load();
        await adapter.warmup();
      }
      return adapter.getMetrics();
    })().catch((error) => {
      adapter = null;
      adapterRuntime = null;
      throw error;
    }).finally(() => { preparationPromise = null; });
    return preparationPromise;
  }
  async function prepareSelectedModel() {
    const selection = modelSelection();
    if (selection.selected === "disabled") throw new Error("AI_TOOL_MODEL_DISABLED");
    if (!selection.available) throw new Error(selection.reason || "AI_TOOL_MODEL_UNAVAILABLE");
    return prepareFunctionGemma(); // compatibility adapter until a verified LFM runtime is installed
  }

  async function predictTool(text, context = {}, { shadow = false } = {}) {
    const started = global.performance?.now?.() || Date.now();
    const finish = (result, routeType) => {
      const latency = (global.performance?.now?.() || Date.now()) - started;
      global.SimplificaAiTelemetry?.record?.({
        intent: result.intent || result.tool || result.reason || "unknown", route_type: routeType,
        function_id: result.tool || "", latency_ms: latency, success: result.kind === "TOOL_CALL",
        fallback: result.kind !== "TOOL_CALL", error_type: result.kind === "TOOL_CALL" ? "" : result.reason || "NO_TOOL"
      });
      return Object.freeze({ ...result, shadow });
    };
    const blocked = nonExecutableReason(text);
    if (blocked) return finish({ kind: "NO_TOOL", reason: blocked, diagnostics: null }, "deterministic");
    const deterministic = global.SimplificaDeterministicRouter?.resolve?.(text, context);
    if (deterministic) return finish(deterministic, "deterministic");
    const actionSearch = global.SimplificaActionSearch;
    if (!actionSearch?.search) return finish({ kind: "NO_TOOL", reason: "ACTION_SEARCH_UNAVAILABLE" }, "functiongemma");
    const graphApi = global.SimplificaWorkflowToolGraph || (typeof require === "function" ? require("../ai/workflow-tool-graph.js") : null);
    if (!graphApi?.WorkflowToolGraph) return finish({ kind: "NO_TOOL", reason: "WORKFLOW_GRAPH_UNAVAILABLE" }, "local-tool-model");
    const graph = new graphApi.WorkflowToolGraph();
    const selection = graph.select(String(text || ""), context || {});
    const candidates = selection.candidates;
    if (!candidates.length) return finish({ kind: "NO_TOOL", reason: "NO_ACTION_SEARCH_MATCH" }, "functiongemma");
    await prepareSelectedModel();
    const result = await adapter.generateToolCall({ command: text, tools: candidates, context: selection.context });
    return finish({ ...result, intent: result.tool || "local-tool-model", workflow: { candidates, maxTopK: selection.maxTopK } }, "local-tool-model");
  }

  async function predictToolShadow(text, context = {}) { return predictTool(text, context, { shadow: true }); }
  function scheduleToolShadow(text, context = {}) { global.setTimeout(() => predictToolShadow(text, context).catch(() => {}), 0); }

  class LocalToolModelProvider {
    get plugin() { return nativePlugin(); }
    async status() {
      if (this.plugin?.functionGemmaStatus) {
        const value = await this.plugin.functionGemmaStatus();
        const installed = value?.installed === true;
        return {
          ...value, available: installed, compatible: true, enabled: true,
          modelId: FUNCTIONGEMMA_MODEL_ID, modelName: "FunctionGemma 270M Q8_0",
          modelReady: installed, runtimeReady: value?.loaded === true && value?.warmed === true,
          supportsText: true, supportsVision: false, supportsAudio: false, supportsTools: true, writeExposed: 0
        };
      }
      if (!webProvider) return { available: false, compatible: false, enabled: true, modelReady: false, state: "UNAVAILABLE", reason: "FUNCTIONGEMMA_WEB_UNAVAILABLE", writeExposed: 0 };
      const value = await webProvider.status();
      return { ...value, enabled: true, supportsVision: false, supportsAudio: false, supportsTools: true, writeExposed: 0 };
    }
    async listModels() {
      const status = await this.status();
      return { enabled: true, selection: selectedModelId(), models: [{
        id: status.modelId || FUNCTIONGEMMA_MODEL_ID, displayName: "FunctionGemma 270M Q8_0", profile: "OPERATIONAL",
        version: "39eccb091651513a5dfb56892d3714c1b5b8276c", downloadBytes: 291557856,
        installed: status.modelReady === true, available: status.available === true,
        compatible: status.compatible !== false, text: true, vision: false, audio: false, tools: true
      }, { id: LFM_MODEL_ID, displayName: "LFM2.5 1.2B Q6_K", profile: "EXPERIMENTAL", installed: false, available: false, compatible: false, reason: "LFM_ARTIFACT_UNVERIFIED", text: true, vision: false, audio: false, tools: true }] };
    }
    async profileDevice() { return { runtime: this.plugin ? "llama.cpp-arm64-cpu" : "wllama-wasm-cpu", backendPolicy: "CPU_ONLY", modelHealth: { health: "NOT_TESTED" } }; }
    async ensureReady() { return this.prewarm(); }
    async prewarm() {
      await prepareFunctionGemma();
      return { ...(await this.status()), available: true, enabled: true, modelReady: true, runtimeReady: true, state: "READY", writeExposed: 0 };
    }
    async converse(text, context) {
      const prediction = await predictTool(text, context, { shadow: false });
      if (prediction.kind === "TOOL_CALL" && prediction.missing?.length) return `Entendi a função, mas ainda preciso de: ${prediction.missing.join(", ")}.`;
      if (prediction.kind === "TOOL_CALL") return "Entendi o comando. Vou usar a função segura do Simplifica e manter qualquer alteração para sua revisão.";
      if (["HYPOTHETICAL_REQUEST", "NEGATED_COMMAND"].includes(prediction.reason)) return "Nenhuma ação foi executada. Posso explicar ou preparar um rascunho quando você pedir diretamente.";
      return "Não identifiquei uma função segura para esse pedido. Tente dizer a tela, consulta ou rascunho que deseja abrir.";
    }
    async unload() {
      await adapter?.unload?.();
      adapter = null;
      adapterRuntime = null;
      return { unloaded: true };
    }
  }

  // Legacy name stays exported for callers while the runtime is model-neutral.
  class FunctionGemmaOnlyProvider extends LocalToolModelProvider {}
  const provider = new LocalToolModelProvider();
  async function interpret(text, context = {}) {
    const prediction = await predictTool(text, context, { shadow: false });
    if (prediction.kind === "TOOL_CALL" && prediction.missing?.length) {
      return global.Simplifica3dAiActions.preview({ type: "chat", payload: { answer: `Para continuar, informe: ${prediction.missing.join(", ")}.` } });
    }
    const action = prediction.kind === "TOOL_CALL"
      ? { type: prediction.tool, payload: prediction.arguments || {} }
      : { type: "chat", payload: { answer: ["HYPOTHETICAL_REQUEST", "NEGATED_COMMAND"].includes(prediction.reason)
        ? "Nenhuma ação foi executada. Posso explicar ou preparar um rascunho quando você pedir diretamente."
        : "Não identifiquei uma função segura para esse pedido. Tente dizer a tela, consulta ou rascunho que deseja abrir." } };
    return global.Simplifica3dAiActions.preview(action);
  }
  async function execute(preview, confirmed) {
    if (preview?.requiresConfirmation || confirmed === true) throw new Error("FUNCTIONGEMMA_WRITE_BLOCKED");
    return global.Simplifica3dErpBridge.execute(preview);
  }
  async function cancel() {
    await functionGemmaRuntimeForPlatform()?.cancel?.();
    return { cancelled: true, writeExposed: 0 };
  }

  global.Simplifica3dAiRuntime = Object.freeze({
    interpret, execute, cancel, predictTool, predictToolShadow, scheduleToolShadow,
    nonExecutableReason, deterministicNavigation, prepareFunctionGemma, prepareSelectedModel, selectedModelId, modelSelection, MODEL_CATALOG, provider, webProvider, LocalToolModelProvider, FunctionGemmaOnlyProvider
  });
})(window);
