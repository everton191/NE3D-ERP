(function attachFunctionGemmaAdapter(global) {
  "use strict";
  const modelApi = global.SimplificaToolCallingModel || (typeof require === "function" ? require("./tool-calling-model.js") : null);
  const registry = global.SimplificaActionRegistry || (typeof require === "function" ? require("./action-registry.js") : null);
  const ALLOWED_MODES = Object.freeze(["functiongemma", "disabled"]);

  class FunctionGemmaAdapter extends modelApi.ToolCallingModel {
    constructor({ runtime, mode = "disabled", shadow = false, clock = () => Date.now() } = {}) {
      super();
      if (!ALLOWED_MODES.includes(mode)) throw new Error("INVALID_AI_TOOL_MODEL");
      this.runtime = runtime; this.mode = mode; this.shadow = shadow !== false; this.clock = clock;
      this.loaded = false; this.confidence = 0; this.metrics = { loadMs: 0, warmupMs: 0, calls: 0, failures: 0, lastLatencyMs: 0 };
    }
    async load() {
      if (this.mode !== "functiongemma") return false;
      if (typeof this.runtime?.load !== "function") throw new Error("FUNCTIONGEMMA_RUNTIME_UNAVAILABLE");
      const started = this.clock(); await this.runtime.load(); this.metrics.loadMs = this.clock() - started; this.loaded = true; return true;
    }
    async warmup() {
      if (!this.loaded) throw new Error("MODEL_NOT_LOADED");
      const started = this.clock(); await this.runtime.warmup?.(); this.metrics.warmupMs = this.clock() - started; return true;
    }
    async unload() { await this.runtime?.unload?.(); this.loaded = false; this.confidence = 0; }
    allowedTools(candidateIds = []) {
      return candidateIds.map((id) => registry.get(id)).filter((action) => action && registry.health(action).exposed && action.operationType !== registry.OPERATION.WRITE);
    }
    async generateToolCall({ command, tools = [], context = {} } = {}) {
      if (this.mode !== "functiongemma" || !this.loaded) throw new Error("MODEL_NOT_READY");
      const allowed = this.allowedTools(tools); if (!allowed.length) return Object.freeze({ kind: "NO_TOOL", reason: "NO_ALLOWED_TOOL", shadow: this.shadow });
      const started = this.clock(); this.metrics.calls += 1;
      try {
        const blockedWriteAliases = registry.actions
          .filter((item) => item.operationType === registry.OPERATION.WRITE)
          .flatMap((item) => item.aliases || []);
        const output = await this.runtime.generateToolCall({ command: String(command || ""), tools: allowed, context, blockedWriteAliases });
        if (output?.kind && output.kind !== "TOOL_CALL") {
          return Object.freeze({ kind: "NO_TOOL", reason: output.reason || "MODEL_NO_TOOL", diagnostics: output.diagnostics || null, shadow: this.shadow });
        }
        const action = registry.get(output?.tool);
        if (!action || !allowed.some((item) => item.id === action.id)) return Object.freeze({ kind: "NO_TOOL", reason: "TOOL_OUTSIDE_TOP_K", shadow: this.shadow });
        const args = output?.arguments && typeof output.arguments === "object" ? output.arguments : {};
        if (Object.keys(args).some((key) => !action.inputSchema.allowed.includes(key))) return Object.freeze({ kind: "NO_TOOL", reason: "UNKNOWN_ARGUMENT", shadow: this.shadow });
        if (action.inputSchema.requiredAll.some((key) => args[key] === undefined || args[key] === null || args[key] === "")) return Object.freeze({ kind: "NO_TOOL", reason: "MISSING_REQUIRED_ARGUMENT", shadow: this.shadow });
        if (action.inputSchema.requiredAny.length && !action.inputSchema.requiredAny.some((key) => args[key] !== undefined && args[key] !== null && args[key] !== "")) return Object.freeze({ kind: "NO_TOOL", reason: "MISSING_REQUIRED_ARGUMENT", shadow: this.shadow });
        this.confidence = Math.max(0, Math.min(1, Number(output.confidence) || 0));
        return Object.freeze({ kind: "TOOL_CALL", tool: action.id, arguments: Object.freeze({ ...args }), confidence: this.confidence, diagnostics: output.diagnostics || null, shadow: this.shadow });
      } catch (error) { this.metrics.failures += 1; throw error; }
      finally { this.metrics.lastLatencyMs = this.clock() - started; }
    }
    async selectTool(input) { const result = await this.generateToolCall(input); return result.kind === "TOOL_CALL" ? result.tool : null; }
    async extractArguments(input) { const result = await this.generateToolCall(input); return result.kind === "TOOL_CALL" ? result.arguments : Object.freeze({}); }
    getConfidence() { return this.confidence; }
    getMetrics() { return Object.freeze({ ...this.metrics, loaded: this.loaded, mode: this.mode, shadow: this.shadow }); }
  }
  const resolveMode = (environment = {}) => ALLOWED_MODES.includes(environment.AI_TOOL_MODEL) ? environment.AI_TOOL_MODEL : "disabled";
  const api = Object.freeze({ ALLOWED_MODES, FunctionGemmaAdapter, resolveMode });
  global.SimplificaFunctionGemmaAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
