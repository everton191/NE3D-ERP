(function attachLocalToolModelAdapter(global) {
  "use strict";
  const modelApi = global.SimplificaToolCallingModel || (typeof require === "function" ? require("./tool-calling-model.js") : null);
  const registry = global.SimplificaActionRegistry || (typeof require === "function" ? require("./action-registry.js") : null);
  const ALLOWED_MODELS = Object.freeze(["functiongemma-270m-it-q8_0", "lfm2.5-1.2b-q4_0", "lfm2.5-1.2b-q6_k", "disabled"]);
  function hasValue(value) { return value !== undefined && value !== null && value !== ""; }
  function validateArguments(action, args) {
    const schema = action?.inputSchema || {};
    const allowed = Array.isArray(schema.allowed) ? schema.allowed : [];
    if (Object.keys(args).some((key) => !allowed.includes(key))) return "UNKNOWN_ARGUMENT";
    const requiredAll = Array.isArray(schema.requiredAll) ? schema.requiredAll : [];
    if (requiredAll.some((key) => !hasValue(args[key]))) return "MISSING_REQUIRED_ARGUMENT";
    const requiredAny = Array.isArray(schema.requiredAny) ? schema.requiredAny : [];
    if (requiredAny.length && !requiredAny.some((key) => hasValue(args[key]))) return "MISSING_REQUIRED_ARGUMENT";
    return null;
  }
  class LocalToolModelAdapter extends modelApi.ToolCallingModel {
    constructor({ runtime, modelId = "disabled", shadow = false, clock = () => Date.now() } = {}) { super(); if (!ALLOWED_MODELS.includes(modelId)) throw new Error("INVALID_AI_TOOL_MODEL"); this.runtime = runtime; this.modelId = modelId; this.shadow = shadow === true; this.clock = clock; this.loaded = false; this.confidence = 0; this.metrics = { loadMs: 0, warmupMs: 0, calls: 0, failures: 0, lastLatencyMs: 0 }; }
    async load() { if (this.modelId === "disabled") return false; if (typeof this.runtime?.load !== "function") throw new Error("LOCAL_TOOL_MODEL_RUNTIME_UNAVAILABLE"); const started = this.clock(); await this.runtime.load(); this.metrics.loadMs = this.clock() - started; this.loaded = true; return true; }
    async warmup() { if (!this.loaded) throw new Error("MODEL_NOT_LOADED"); const started = this.clock(); await this.runtime.warmup?.(); this.metrics.warmupMs = this.clock() - started; return true; }
    async unload() { await this.runtime?.unload?.(); this.loaded = false; this.confidence = 0; }
    allowedTools(ids = []) { return ids.map((id) => registry.get(id)).filter((action) => action && registry.health(action).exposed && action.operationType !== registry.OPERATION.WRITE); }
    async generateToolCall({ command, tools = [], context = {} } = {}) { if (!this.loaded) throw new Error("MODEL_NOT_READY"); const allowed = this.allowedTools(tools); if (!allowed.length) return Object.freeze({ kind: "NO_TOOL", reason: "NO_ALLOWED_TOOL" }); const started = this.clock(); this.metrics.calls += 1; try { const output = await this.runtime.generateToolCall({ command: String(command || ""), tools: allowed, context, blockedWriteAliases: registry.actions.filter((item) => item.operationType === registry.OPERATION.WRITE).flatMap((item) => item.aliases || []) }); if (output?.kind && output.kind !== "TOOL_CALL") return Object.freeze({ kind: "NO_TOOL", reason: output.reason || "MODEL_NO_TOOL", diagnostics: output.diagnostics || null }); const action = registry.get(output?.tool); if (!action || !allowed.some((item) => item.id === action.id)) return Object.freeze({ kind: "NO_TOOL", reason: "TOOL_OUTSIDE_TOP_K" }); const args = output?.arguments && typeof output.arguments === "object" && !Array.isArray(output.arguments) ? output.arguments : {}; const invalid = validateArguments(action, args); if (invalid) return Object.freeze({ kind: "NO_TOOL", reason: invalid }); this.confidence = Math.max(0, Math.min(1, Number(output.confidence) || 0)); return Object.freeze({ kind: "TOOL_CALL", tool: action.id, arguments: Object.freeze({ ...args }), confidence: this.confidence, diagnostics: output.diagnostics || null, shadow: this.shadow }); } catch (error) { this.metrics.failures += 1; throw error; } finally { this.metrics.lastLatencyMs = this.clock() - started; } }
    getConfidence() { return this.confidence; } getMetrics() { return Object.freeze({ ...this.metrics, loaded: this.loaded, modelId: this.modelId, shadow: this.shadow }); }
  }
  const api = Object.freeze({ ALLOWED_MODELS, LocalToolModelAdapter, validateArguments, resolveModelId: (value) => ALLOWED_MODELS.includes(value) ? value : "disabled" }); global.SimplificaLocalToolModel = api; if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
