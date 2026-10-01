(function attachLfmIntentProvider(global) {
  "use strict";
  const intents = global.SimplificaIntentRegistry || (typeof require === "function" ? require("./intent-registry.js") : null);
  const normalizer = global.SimplificaPtBrRoutingNormalizer || (typeof require === "function" ? require("./ptbr-routing-normalizer.js") : null);
  const retriever = global.SimplificaToolCandidateRetriever || (typeof require === "function" ? require("./tool-candidate-retriever.js") : null);
  const MODEL_ID = "lfm2.5-1.2b-q4_0";
  const MAX_INTENTS = 8;
  const plugin = () => global.Capacitor?.Plugins?.SimplificaLocalAi || null;
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const minimalContext = (context = {}) => Object.freeze({ currentScreen: context.currentScreen || "", activeWorkflow: context.activeWorkflow || "", currentOrder: context.currentOrder || null, currentCustomer: context.currentCustomer || null, currentCalculation: context.currentCalculation || null, missingFields: Array.isArray(context.missingFields) ? context.missingFields.slice(0, 8) : [] });
  const domainsFor = (input, context = {}) => {
    const text = clean(input); const found = new Set();
    if (/pedido|cliente/.test(text) || context.currentOrder || context.currentCustomer) found.add("orders");
    if (/zap|whatsapp|pdf|documento/.test(text)) found.add("documents");
    if (/estoque|material|pla|petg|abs|rolo/.test(text)) found.add("inventory");
    if (/producao|impress/.test(text)) found.add("production");
    if (/caixa|venda|sangria/.test(text)) found.add("cash");
    if (/calcula|orcamento|gramas?|\bkg\b|horas?|\bmin/.test(text) || context.currentCalculation) found.add("calculator");
    if (/abre|ir para|vai para/.test(text)) found.add("navigation");
    return found;
  };
  function plausibleIntents(input, context = {}, limit = MAX_INTENTS) {
    const normalized = normalizer?.normalizeRoutingInput?.(input)?.normalizedRoutingInput || String(input || "");
    const deterministicId = intents?.resolveIntentId?.(retriever?.semanticIntent?.(normalized, context));
    if (deterministicId) return Object.freeze([intents.get(deterministicId)].filter(Boolean));
    const domains = domainsFor(normalized, context); const workflow = intents?.resolveIntentId?.(context.activeWorkflow);
    if (!domains.size && !workflow) return Object.freeze([]);
    const candidates = (intents?.definitions || []).filter((item) => !domains.size || domains.has(item.domain)).filter((item) => item.mode !== "WRITE");
    const selected = workflow ? [intents.get(workflow)] : candidates;
    return Object.freeze(selected.filter(Boolean).slice(0, Math.max(1, Math.min(MAX_INTENTS, limit))).map((item) => Object.freeze({ id: item.id, domain: item.domain, description: item.description })));
  }
  const emptyResult = (errorCode) => Object.freeze({ intentId: "", domain: "", confidence: 0, noMatch: true, errorCode });
  function parseOutput(raw, allowed) {
    let value; try { value = JSON.parse(String(raw || "").trim()); } catch (_) { return emptyResult("STRUCTURED_PARSE_FAILED"); }
    if (!value || typeof value !== "object" || Array.isArray(value)) return emptyResult("STRUCTURED_OUTPUT_INVALID");
    const keys = Object.keys(value).sort(); if (keys.join(",") !== "confidence,intentId,noMatch") return emptyResult("STRUCTURED_KEYS_INVALID");
    if (typeof value.noMatch !== "boolean" || typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) return emptyResult("STRUCTURED_VALUE_INVALID");
    if (value.intentId === null) return value.noMatch ? Object.freeze({ intentId: "", domain: "", confidence: value.confidence, noMatch: true, errorCode: "" }) : emptyResult("NO_MATCH_CONFLICT");
    if (typeof value.intentId !== "string" || value.noMatch) return emptyResult("NO_MATCH_CONFLICT");
    const intentId = intents?.resolveIntentId?.(value.intentId) || "";
    if (!intentId) return emptyResult("INVALID_INTENT");
    if (!allowed.some((item) => item.id === intentId)) return emptyResult("INTENT_OUTSIDE_CLOSED_SET");
    return Object.freeze({ intentId, domain: intents?.get?.(intentId)?.domain || "", confidence: value.confidence, noMatch: false, errorCode: "" });
  }
  function grammarLiteral(value) { return `"\\\"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\\"')}\\\""`; }
  function intentGrammar(candidates) {
    const options = candidates.map((item) => grammarLiteral(item.id)).join(" | ");
    return `root ::= "{" ws "\\\"intentId\\\"" ws ":" ws intent-value ws "," ws "\\\"confidence\\\"" ws ":" ws number ws "," ws "\\\"noMatch\\\"" ws ":" ws boolean ws "}"\nintent-value ::= intent | "null"\nintent ::= ${options}\nnumber ::= "0" | "1" | "0." [0-9]+\nboolean ::= "true" | "false"\nws ::= | " " | "\\n" [ \\t]{0,20}`;
  }
  function systemPromptFor() { return "Você classifica somente a intenção. Responda pelo formato solicitado, sem texto adicional, sem IDs inventados, sem valores financeiros e sem executar ações."; }
  function promptFor(input, candidates, context) { return `Solicitação: ${JSON.stringify(String(input || ""))}\nContexto mínimo: ${JSON.stringify(minimalContext(context))}\nIntenções permitidas: ${JSON.stringify(candidates.map((item) => item.id))}`; }
  class LfmIntentProvider {
    constructor() { this.state = "NOT_INSTALLED"; this.lastMetrics = {}; }
    async status() { const local = plugin(); if (!local?.localLlmStatus) return Object.freeze({ state: "FAILED", reason: "LOCAL_LLM_PLUGIN_UNAVAILABLE", writeExposed: 0 }); const result = await local.localLlmStatus(); this.state = result.loaded ? "READY" : result.installed ? "INSTALLED" : "NOT_INSTALLED"; return Object.freeze({ ...result, state: this.state, modelId: MODEL_ID, role: "language_interpreter", writeExposed: 0 }); }
    async load() { const local = plugin(); if (!local?.loadLocalModel || !local?.warmupLocalModel) throw new Error("LOCAL_LLM_PLUGIN_UNAVAILABLE"); this.state = "LOADING"; try { const started = Date.now(); await local.loadLocalModel({ modelId: MODEL_ID }); const warmed = await local.warmupLocalModel(); this.lastMetrics = { ...(warmed?.metrics ? JSON.parse(warmed.metrics) : {}), loadAndWarmupMs: Date.now() - started }; this.state = "READY"; return Object.freeze({ ok: true, state: this.state, writeExposed: 0 }); } catch (error) { this.state = "FAILED"; throw error; } }
    async normalChat() { if (this.state !== "READY") await this.load(); const response = await plugin().generateLocal({ systemPrompt: "Responda exatamente ao pedido do usuário.", prompt: "Responda apenas OK.", maxTokens: 8, temperature: 0, topP: 0.9, timeoutMs: 60000 }); const generated = JSON.parse(response?.result || "{}"); return Object.freeze({ ok: generated.ok === true, text: String(generated.text || "").trim(), chatMessages: generated.chatMessages || 0, grammarApplied: generated.grammarApplied === true, error: generated.error || null, writeExposed: 0 }); }
    async interpretIntent({ input = "", contextSnapshot = {}, candidateIntents = [], useGrammar = true } = {}) { const deterministicId = !candidateIntents.length ? intents?.resolveIntentId?.(retriever?.semanticIntent?.(input, contextSnapshot)) : ""; if (deterministicId) return Object.freeze({ intentId: deterministicId, domain: intents.get(deterministicId)?.domain || "", confidence: 1, noMatch: false, errorCode: "", provider: "deterministic", candidateIntents: [intents.get(deterministicId)], latencyMs: 0, grammarApplied: false, chatMessages: 0, rawModelOutput: "", deterministic: true, writeExposed: 0 }); const candidates = candidateIntents.length ? candidateIntents.slice(0, MAX_INTENTS) : plausibleIntents(input, contextSnapshot); if (!candidates.length) return Object.freeze({ ...emptyResult("NO_PLAUSIBLE_INTENTS"), provider: "lfm2.5", candidateIntents: [], rawModelOutput: "", deterministic: false, writeExposed: 0 }); if (this.state !== "READY") await this.load(); const started = Date.now(); const response = await plugin().generateLocal({ systemPrompt: systemPromptFor(), prompt: promptFor(input, candidates, contextSnapshot), grammar: useGrammar ? intentGrammar(candidates) : "", maxTokens: 64, temperature: 0, topP: 0.9, timeoutMs: 60000 }); const generated = JSON.parse(response?.result || "{}"); this.lastMetrics = { ...this.lastMetrics, ...(generated || {}), latencyMs: Date.now() - started }; return Object.freeze({ ...parseOutput(generated.text, candidates), provider: "lfm2.5", candidateIntents: candidates, latencyMs: this.lastMetrics.latencyMs, grammarApplied: generated.grammarApplied === true, chatMessages: generated.chatMessages || 0, rawModelOutput: String(generated.text || ""), deterministic: false, writeExposed: 0 }); }
    async health() { const status = await this.status(); return Object.freeze({ ok: status.state === "READY" || status.state === "INSTALLED", state: status.state, chatTemplate: "GGUF_METADATA", writeExposed: 0 }); }
    metrics() { return Object.freeze({ ...this.lastMetrics, state: this.state, writeExposed: 0 }); }
    async unload() { await plugin()?.unloadLocalModel?.(); this.state = "INSTALLED"; return Object.freeze({ ok: true, state: this.state, writeExposed: 0 }); }
  }
  const api = Object.freeze({ MODEL_ID, MAX_INTENTS, LfmIntentProvider, plausibleIntents, parseOutput, promptFor, systemPromptFor, intentGrammar }); global.SimplificaLfmIntent = api; if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
