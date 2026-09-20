(function attachSimplifica3dAiRuntime(global) {
  "use strict";
  const QAD = "lfm2.5-1.2b-q4_0";
  const Q6 = "lfm2.5-1.2b-q6_k";
  const MODEL_CATALOG = Object.freeze({ [QAD]: Object.freeze({ id: QAD, available: true, fallback: true }), [Q6]: Object.freeze({ id: Q6, available: true, experimental: true }), disabled: Object.freeze({ id: "disabled", available: false }) });
  let preparation = null;
  const plugin = () => global.Capacitor?.Plugins?.SimplificaLocalAi || null;
  function selectedModelId() { const requested = String(global.SIMPLIFICA_AI_TOOL_MODEL || global.__SIMPLIFICA_AI_TOOL_MODEL__ || "").trim(); return MODEL_CATALOG[requested] ? requested : QAD; }
  function modelSelection() { const selected = selectedModelId(); return Object.freeze({ ...MODEL_CATALOG[selected], selected, writeExposed: 0 }); }
  async function prepareSelectedModel() {
    if (preparation) return preparation;
    preparation = (async () => { const selected = modelSelection(); if (!selected.available) throw new Error("AI_TOOL_MODEL_UNAVAILABLE"); const local = plugin(); if (!local?.loadLocalModel || !local?.warmupLocalModel) throw new Error("LOCAL_LLM_PLUGIN_UNAVAILABLE"); await local.loadLocalModel({ modelId: selected.selected }); return local.warmupLocalModel(); })();
    try { return await preparation; } finally { preparation = null; }
  }
  class LocalToolModelProvider {
    async status() {
      const local = plugin();
      if (!local?.localLlmStatus) return { available: false, compatible: false, enabled: true, modelReady: false, runtimeReady: false, state: "UNAVAILABLE", reason: "LOCAL_LLM_PLUGIN_UNAVAILABLE", writeExposed: 0 };
      const value = await local.localLlmStatus();
      return { ...value, available: value.installed === true, compatible: true, enabled: true, modelId: value.modelId || QAD, modelName: "LFM2.5 1.2B Q4_0", modelReady: value.installed === true, runtimeReady: value.loaded === true, supportsText: true, supportsVision: false, supportsAudio: false, supportsTools: false, writeExposed: 0 };
    }
    async listModels() { const local = plugin(); return local?.listModels ? local.listModels() : { enabled: true, selection: selectedModelId(), models: [] }; }
    async profileDevice() { return plugin()?.profileDevice ? plugin().profileDevice() : { runtime: "unavailable", backendPolicy: "CPU_ONLY" }; }
    async ensureReady() { return this.prewarm(); }
    async prewarm() { await prepareSelectedModel(); return { ...(await this.status()), available: true, modelReady: true, runtimeReady: true, state: "READY", writeExposed: 0 }; }
    async unload() { await plugin()?.unloadLocalModel?.(); return { unloaded: true, writeExposed: 0 }; }
    async converse(text, context) { await this.prewarm(); const deterministic = global.SimplificaDeterministicRouter?.resolve?.(text, context); if (deterministic) return "Entendi o comando seguro do Simplifica."; return "A IA local está preparada. A interpretação por ferramentas permanece bloqueada até a validação do chat template e do schema."; }
  }
  const provider = new LocalToolModelProvider();
  async function predictTool(text, context = {}, { shadow = false } = {}) { const deterministic = global.SimplificaDeterministicRouter?.resolve?.(text, context); return Object.freeze({ ...(deterministic || { kind: "NO_TOOL", reason: "LOCAL_LLM_TOOL_ADAPTER_NOT_VALIDATED" }), shadow }); }
  async function interpret(text, context = {}) { const prediction = await predictTool(text, context); return global.Simplifica3dAiActions.preview(prediction.kind === "TOOL_CALL" ? { type: prediction.tool, payload: prediction.arguments || {} } : { type: "chat", payload: { answer: "Não identifiquei uma função segura para esse pedido." } }); }
  async function execute(preview, confirmed) { if (preview?.requiresConfirmation || confirmed === true) throw new Error("LOCAL_LLM_WRITE_BLOCKED"); return global.Simplifica3dErpBridge.execute(preview); }
  async function cancel() { await plugin()?.cancelLocalModel?.(); return { cancelled: true, writeExposed: 0 }; }
  global.Simplifica3dAiRuntime = Object.freeze({ interpret, execute, cancel, predictTool, predictToolShadow: (text, context) => predictTool(text, context, { shadow: true }), scheduleToolShadow: (text, context) => global.setTimeout(() => predictTool(text, context, { shadow: true }).catch(() => {}), 0), prepareSelectedModel, selectedModelId, modelSelection, MODEL_CATALOG, provider, LocalToolModelProvider });
})(window);
