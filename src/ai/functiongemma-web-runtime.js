(function attachFunctionGemmaWebRuntime(global) {
  "use strict";

  const MODULE_URL = "/assets/vendor/wllama/index.min.js?v=3.6.0";
  const WASM_URL = "/assets/vendor/wllama/wllama.wasm?v=3.6.0";
  const CALL_PATTERN = /<start_function_call>\s*call:([a-zA-Z][a-zA-Z0-9_]*)\{([\s\S]*?)\}\s*<end_function_call>/g;
  const SAFE_NAME = /^[a-z][a-z0-9_]*$/;
  const STOP_WORDS = new Set(["a", "as", "o", "os", "um", "uma", "de", "da", "das", "do", "dos", "em", "no", "na", "para", "por", "eu", "esse", "essa"]);

  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\bcx\b/g, "caixa");
  const stem = (value) => value.length > 5 ? value.slice(0, 5) : value.length > 3 && value.endsWith("r") ? value.slice(0, -1) : value;
  const tokens = (value) => normalize(value).split(/[^a-z0-9_]+/).filter(Boolean);
  const aliasMatches = (command, alias) => {
    const commandTokens = tokens(command).map(stem);
    const aliasTokens = tokens(alias).filter((item) => !STOP_WORDS.has(item)).map(stem);
    return aliasTokens.length > 0 && aliasTokens.every((expected) => commandTokens.some((actual) => actual === expected));
  };

  function splitArguments(body) {
    if (!String(body || "").trim()) return [];
    const parts = [];
    let escaped = false;
    let quoted = false;
    let start = 0;
    for (let index = 0; index < body.length; index += 1) {
      if (body.startsWith("<escape>", index)) {
        escaped = !escaped;
        index += "<escape>".length - 1;
        continue;
      }
      const character = body[index];
      if (!escaped && character === '"' && body[index - 1] !== "\\") quoted = !quoted;
      if (!escaped && !quoted && character === ",") {
        parts.push(body.slice(start, index));
        start = index + 1;
      }
    }
    if (escaped || quoted) return null;
    parts.push(body.slice(start));
    return parts;
  }

  function parseArguments(body) {
    const parts = splitArguments(body);
    if (!parts) return null;
    const result = {};
    for (const part of parts) {
      const separator = part.indexOf(":");
      if (separator <= 0) return null;
      const key = part.slice(0, separator).trim();
      if (!SAFE_NAME.test(key) || Object.prototype.hasOwnProperty.call(result, key)) return null;
      const raw = part.slice(separator + 1).trim();
      let value;
      if (raw.startsWith("<escape>") && raw.endsWith("<escape>") && raw.length >= 16) value = raw.slice(8, -8);
      else if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) value = raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      else if (/^(true|false)$/i.test(raw)) value = raw.toLowerCase() === "true";
      else if (/^-?\d+(?:\.\d+)?$/.test(raw)) value = Number(raw);
      else return null;
      result[key] = value;
    }
    return result;
  }

  function decide(command, rawText, topK, blockedWriteAliases = []) {
    if (!String(command || "").trim()) return { kind: "NO_TOOL", reason: "EMPTY_COMMAND", arguments: {} };
    if (!topK.length) return { kind: "NO_TOOL", reason: "NO_ALLOWED_TOOL", arguments: {} };
    if (topK.some((item) => String(item.operationType).toUpperCase() === "WRITE")) return { kind: "NO_TOOL", reason: "WRITE_TOOL_IN_TOP_K", arguments: {} };
    if (blockedWriteAliases.some((alias) => aliasMatches(command, alias))) return { kind: "NO_TOOL", reason: "WRITE_INTENT_BLOCKED", arguments: {} };
    const matches = [...String(rawText || "").matchAll(CALL_PATTERN)];
    if (!matches.length) return { kind: "NO_TOOL", reason: "MODEL_NO_TOOL", arguments: {} };
    if (matches.length !== 1) return { kind: "NO_TOOL", reason: "MULTIPLE_TOOL_CALLS_REJECTED", arguments: {} };
    const rawTool = matches[0][1];
    const contract = topK.find((item) => item.wireName === rawTool);
    if (!contract) return { kind: "NO_TOOL", reason: "TOOL_OUTSIDE_TOP_K", rawTool, arguments: {} };
    if (!SAFE_NAME.test(contract.wireName)) return { kind: "NO_TOOL", reason: "INVALID_WIRE_NAME", rawTool, arguments: {} };
    if (contract.anchors?.length && !contract.anchors.some((alias) => aliasMatches(command, alias))) {
      return { kind: "NO_TOOL", reason: "INTENT_ANCHOR_MISSING", rawTool, arguments: {} };
    }
    const parsed = parseArguments(matches[0][2]);
    if (!parsed) return { kind: "NO_TOOL", reason: "MALFORMED_ARGUMENTS", rawTool, arguments: {} };
    if (Object.keys(parsed).some((key) => !contract.properties.some((item) => item.name === key))) {
      return { kind: "NO_TOOL", reason: "UNKNOWN_ARGUMENT", rawTool, arguments: {} };
    }
    const args = { ...parsed, ...(contract.fixedArguments || {}) };
    const hasValue = (key) => args[key] !== undefined && args[key] !== null && (typeof args[key] !== "string" || args[key].trim());
    if (contract.requiredAll.some((key) => !hasValue(key)) || (contract.requiredAny.length && !contract.requiredAny.some(hasValue))) {
      return { kind: "NO_TOOL", reason: "MISSING_REQUIRED_ARGUMENT", rawTool, arguments: {} };
    }
    return { kind: "TOOL_CALL", tool: contract.id, wireTool: contract.wireName, rawTool, arguments: args, reason: "VALIDATED" };
  }

  function buildPrompt(command, tools) {
    const safeCommand = String(command || "").trim();
    if (!safeCommand || safeCommand.length > 500 || /<start_of_turn>|<end_of_turn>/.test(safeCommand)) throw new Error("FUNCTIONGEMMA_INVALID_COMMAND");
    const declarations = tools.map((tool) => {
      const properties = tool.properties.map((property) => {
        const description = String(property.description || "").replace(/\s+/g, " ").trim();
        return `${property.name}:{${description ? `description:<escape>${description}<escape>,` : ""}type:<escape>${property.type}<escape>}`;
      }).join(",");
      const required = tool.requiredAll.map((name) => `<escape>${name}<escape>`).join(",");
      const parameters = properties
        ? `parameters:{properties:{${properties}}${required ? `,required:[${required}]` : ""},type:<escape>OBJECT<escape>}`
        : "parameters:{type:<escape>OBJECT<escape>}";
      const description = String(tool.description || "").replace(/\s+/g, " ").trim();
      return `<start_function_declaration>declaration:${tool.wireName}{description:<escape>${description}<escape>,${parameters}}<end_function_declaration>`;
    }).join("");
    return `<start_of_turn>developer\nYou are a model that can do function calling with the following functions${declarations}<end_of_turn>\n<start_of_turn>user\n${safeCommand}<end_of_turn>\n<start_of_turn>model\n`;
  }

  class FunctionGemmaWebRuntime {
    constructor({ engineFactory = null, clock = () => performance.now() } = {}) {
      this.engineFactory = engineFactory;
      this.clock = clock;
      this.modulePromise = null;
      this.engine = null;
      this.loaded = false;
      this.warmed = false;
      this.inflight = null;
      this.abortController = null;
      this.metrics = { backend: "llama.cpp-wasm-cpu", runtime: "wllama-3.6.0", threads: 1, loadMs: 0, warmupMs: 0, calls: 0, failures: 0, ttftMs: 0, totalMs: 0, tokensPerSecond: 0, writeExposed: 0 };
    }
    async capabilities() {
      try {
        if (!this.engineFactory) await this.loadRuntimeModule();
        return { text: true, tools: true, vision: false, audio: false, wasmCpu: true, webGpuRequired: false, runtimeAvailable: true, runtime: this.metrics.runtime, backend: this.metrics.backend };
      } catch (_) {
        return { text: false, tools: false, vision: false, audio: false, wasmCpu: true, webGpuRequired: false, runtimeAvailable: false, reason: "O runtime WebAssembly da IA não está acessível. Verifique a conexão e tente novamente." };
      }
    }
    async loadRuntimeModule() {
      if (!this.modulePromise) this.modulePromise = import(MODULE_URL);
      return this.modulePromise;
    }
    async createEngine() {
      if (this.engineFactory) return this.engineFactory();
      const module = await this.loadRuntimeModule();
      return new module.Wllama({ default: WASM_URL }, { logger: module.LoggerWithoutDebug || console, suppressNativeLog: true, allowOffline: true });
    }
    async load(options = {}) {
      if (this.loaded) return this.getMetrics();
      const artifact = options.artifact;
      const descriptor = options.descriptor || {};
      if (!(artifact instanceof Blob) || artifact.size !== Number(descriptor.downloadBytes)) throw new Error("FUNCTIONGEMMA_WEB_ARTIFACT_INVALID");
      const started = this.clock();
      const engine = await this.createEngine();
      const cores = Math.max(1, Number(global.navigator?.hardwareConcurrency) || 1);
      const threads = Math.min(2, cores);
      try {
        await engine.loadModel([artifact], { n_ctx: Math.min(768, Math.max(256, Number(options.contextWindow) || 512)), n_batch: 64, n_threads: threads, n_gpu_layers: 0, n_parallel: 1 });
        this.engine = engine;
        this.loaded = true;
        this.metrics.threads = threads;
        this.metrics.loadMs = Math.round(this.clock() - started);
        return this.getMetrics();
      } catch (error) {
        await engine.exit?.().catch?.(() => {});
        throw error;
      }
    }
    async warmup() {
      if (!this.loaded || !this.engine) throw new Error("FUNCTIONGEMMA_WEB_NOT_LOADED");
      if (this.warmed) return this.getMetrics();
      const started = this.clock();
      await this.engine.createCompletion({ prompt: "<start_of_turn>user\nresponda nao<end_of_turn>\n<start_of_turn>model\n", max_tokens: 1, temperature: 0, top_p: 0.9, top_k: 20 });
      this.warmed = true;
      this.metrics.warmupMs = Math.round(this.clock() - started);
      return this.getMetrics();
    }
    async generateToolCall({ command, tools = [], blockedWriteAliases = [] } = {}) {
      if (!this.loaded || !this.engine) throw new Error("FUNCTIONGEMMA_WEB_NOT_LOADED");
      if (this.inflight) return { kind: "NO_TOOL", reason: "FUNCTIONGEMMA_WEB_BUSY", arguments: {} };
      const toolSpec = global.SimplificaFunctionGemmaNativeRuntime?.toolSpec;
      if (typeof toolSpec !== "function") throw new Error("FUNCTIONGEMMA_TOOL_SPEC_UNAVAILABLE");
      const topK = tools.map((action) => toolSpec(action, command)).filter(Boolean).slice(0, 5);
      if (!topK.length) return { kind: "NO_TOOL", reason: "NO_SEMANTIC_TOP_K_MATCH", arguments: {} };
      if (topK.some((item) => String(item.operationType).toUpperCase() === "WRITE")) {
        return { kind: "NO_TOOL", reason: "WRITE_TOOL_IN_TOP_K", arguments: {} };
      }
      if (blockedWriteAliases.some((alias) => aliasMatches(command, alias))) {
        return { kind: "NO_TOOL", reason: "WRITE_INTENT_BLOCKED", arguments: {} };
      }
      const prompt = buildPrompt(command, topK);
      const started = this.clock();
      let firstTokenAt = 0;
      let rawText = "";
      let stoppedAfterToolCall = false;
      this.abortController = new AbortController();
      this.metrics.calls += 1;
      const complete = () => {
        const finished = this.clock();
        this.metrics.ttftMs = Math.round((firstTokenAt || finished) - started);
        this.metrics.totalMs = Math.round(finished - started);
        const tokensGenerated = Math.max(0, Math.round(rawText.length / 4));
        this.metrics.tokensPerSecond = this.metrics.totalMs > this.metrics.ttftMs
          ? Number((tokensGenerated / ((this.metrics.totalMs - this.metrics.ttftMs) / 1000)).toFixed(2)) : 0;
        const decision = decide(command, rawText, topK, blockedWriteAliases);
        return { ...decision, diagnostics: { rawText, metrics: this.getMetrics() } };
      };
      this.inflight = this.engine.createCompletion({
        prompt,
        max_tokens: 32,
        temperature: 0,
        top_p: 0.9,
        top_k: 40,
        // FunctionGemma às vezes começa a repetir function_response após uma
        // chamada válida. Pare antes da resposta simulada para reduzir latência
        // e preservar exatamente um tool call para o parser fail-closed.
        stop: ["<start_function_response>", "<end_of_turn>"],
        stream: true,
        abortSignal: this.abortController.signal,
        onData: (chunk) => {
          const text = String(chunk?.choices?.[0]?.text || "");
          if (text && !firstTokenAt) firstTokenAt = this.clock();
          rawText += text;
          if (!stoppedAfterToolCall && rawText.includes("<end_function_call>")) {
            stoppedAfterToolCall = true;
            this.abortController?.abort();
          }
        }
      });
      try {
        await this.inflight;
        return complete();
      } catch (error) {
        if (stoppedAfterToolCall) return complete();
        this.metrics.failures += 1;
        return { kind: "NO_TOOL", reason: error?.name === "AbortError" ? "CANCELLED" : "FUNCTIONGEMMA_WEB_GENERATION_FAILED", arguments: {}, diagnostics: { rawText, error: String(error?.message || error), metrics: this.getMetrics() } };
      } finally {
        this.inflight = null;
        this.abortController = null;
      }
    }
    async benchmark() { return { health: this.loaded && this.warmed ? "READY" : "NOT_TESTED", ...this.getMetrics() }; }
    async cancel() { this.abortController?.abort(); return { cancelRequested: true }; }
    async unload() {
      this.abortController?.abort();
      if (this.inflight) await this.inflight.catch(() => {});
      await this.engine?.exit?.();
      this.engine = null;
      this.loaded = false;
      this.warmed = false;
      return { unloaded: true };
    }
    getMetrics() { return Object.freeze({ ...this.metrics, loaded: this.loaded, warmed: this.warmed }); }
  }

  const runtime = new FunctionGemmaWebRuntime();
  const api = Object.freeze({ FunctionGemmaWebRuntime, buildPrompt, decide, parseArguments, runtime, MODULE_URL, WASM_URL });
  global.SimplificaFunctionGemmaWebRuntime = api;
  global.SimplificaWebAiRuntime = runtime;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
