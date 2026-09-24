/**
 * scripts/ai-evals/test-model-adapters.js
 *
 * Adapters de TESTE para simulacao de respostas de modelo.
 * NAO instala, NAO baixa e NAO altera nenhum modelo real.
 * Serve para validar o harness com respostas conhecidas.
 *
 * Adapters disponiveis:
 *   - DisabledAdapter: sempre retorna NO_TOOL (baseline)
 *   - MockPerfectAdapter: retorna exatamente o esperado (upper bound)
 *   - MockErrorAdapter: retorna erros comuns para teste de robustez
 *   - MockWriteLeakAdapter: retorna WRITE (para teste de detection de violacao)
 *   - FileResponseAdapter: ler respostas de um arquivo JSON externo
 *
 * O harness aceita tambem respuesta direto de arquivo via --response.
 */

"use strict";

// ============================================================
// BASE INTERFACE (espelho do ToolCallingModel do runtime)
// ============================================================

class TestToolModel {
  constructor() {
    this.loaded = false;
    this.metrics = { calls: 0, failures: 0, lastLatencyMs: 0 };
  }

  async load() { this.loaded = true; return true; }
  async warmup() { return true; }
  async unload() { this.loaded = false; }
  getConfidence() { return 0; }
  getMetrics() { return Object.freeze({ ...this.metrics, loaded: this.loaded }); }

  async generateToolCall({ command, tools = [], context = {} } = {}) {
    throw new Error("NOT_IMPLEMENTED");
  }
}

// ============================================================
// DISABLED ADAPTER — baseline (sem modelo)
// ============================================================

class DisabledAdapter extends TestToolModel {
  async generateToolCall() {
    return Object.freeze({
      kind: "NO_TOOL",
      reason: "NO_ALLOWED_TOOL",
      diagnostics: Object.freeze({ backend: "disabled-adapter" })
    });
  }
}

// ============================================================
// MOCK PERFECT ADAPTER — upper bound (se tudo estivesse correto)
// ============================================================

class MockPerfectAdapter extends TestToolModel {
  constructor() {
    super();
    this.expectedMap = new Map();
  }

  setExpected(caseId, toolCall) {
    this.expectedMap.set(caseId, toolCall);
  }

  async generateToolCall({ command, tools = [], context = {} } = {}) {
    // Simula extração do case_id do command (simplificado)
    const match = command.match(/case_id[:=]\s*["']?(\w+)["']?/i);
    const caseId = match ? match[1] : null;
    const expected = caseId ? this.expectedMap.get(caseId) : null;

    if (!expected) {
      return Object.freeze({
        kind: "NO_TOOL",
        reason: "NO_MATCHING_CASE",
        diagnostics: Object.freeze({ backend: "mock-perfect-adapter" })
      });
    }

    if (expected.kind === "NO_TOOL") {
      return Object.freeze({
        kind: "NO_TOOL",
        reason: expected.reason || "NO_TOOL",
        diagnostics: Object.freeze({ backend: "mock-perfect-adapter" })
      });
    }

    return Object.freeze({
      kind: "TOOL_CALL",
      tool: expected.tool,
      arguments: Object.freeze({ ...expected.arguments }),
      confidence: expected.confidence || 0.95,
      diagnostics: Object.freeze({ backend: "mock-perfect-adapter" })
    });
  }
}

// ============================================================
// MOCK WRITE LEAK ADAPTER — para teste de deteccao de violacao
// ============================================================

class MockWriteLeakAdapter extends TestToolModel {
  constructor() {
    super();
    this.leakCases = new Set();
  }

  addLeakCase(caseId) {
    this.leakCases.add(caseId);
  }

  async generateToolCall({ command, tools = [], context = {} } = {}) {
    const match = command.match(/case_id[:=]\s*["']?(\w+)["']?/i);
    const caseId = match ? match[1] : null;

    if (this.leakCases.has(caseId)) {
      // Simula vazamento de WRITE
      const writeTool = "orders.commit_create";
      return Object.freeze({
        kind: "TOOL_CALL",
        tool: writeTool,
        arguments: Object.freeze({ order_id: "777", confirmation_token: "leak-test-token" }),
        confidence: 0.99,
        diagnostics: Object.freeze({ backend: "mock-write-leak-adapter", leaked: true })
      });
    }

    return Object.freeze({
      kind: "NO_TOOL",
      reason: "NO_ALLOWED_TOOL",
      diagnostics: Object.freeze({ backend: "mock-write-leak-adapter" })
    });
  }
}

// ============================================================
// MOCK ERROR ADAPTER — simulacao de erros comuns
// ============================================================

class MockErrorAdapter extends TestToolModel {
  constructor() {
    super();
    this.errorCases = new Map();
  }

  setError(caseId, errorType) {
    this.errorCases.set(caseId, errorType);
  }

  async generateToolCall({ command, tools = [], context = {} } = {}) {
    const match = command.match(/case_id[:=]\s*["']?(\w+)["']?/i);
    const caseId = match ? match[1] : null;
    const errorType = caseId ? this.errorCases.get(caseId) : null;

    if (errorType === "invalid_json") {
      return null; // Simula response malformada
    }

    if (errorType === "wrong_action") {
      return Object.freeze({
        kind: "TOOL_CALL",
        tool: "navigation.open",
        arguments: { tela: "errado" },
        confidence: 0.5,
        diagnostics: Object.freeze({ backend: "mock-error-adapter", error: "wrong_action" })
      });
    }

    if (errorType === "extra_args") {
      return Object.freeze({
        kind: "TOOL_CALL",
        tool: "orders.get",
        arguments: { order_id: "1542", hack: true, admin: 1 },
        confidence: 0.85,
        diagnostics: Object.freeze({ backend: "mock-error-adapter", error: "extra_args" })
      });
    }

    if (errorType === "missing_args") {
      return Object.freeze({
        kind: "TOOL_CALL",
        tool: "calculator.quote",
        arguments: { weight_grams: 500 },
        confidence: 0.8,
        diagnostics: Object.freeze({ backend: "mock-error-adapter", error: "missing_args" })
      });
    }

    if (errorType === "hallucinated_tool") {
      return Object.freeze({
        kind: "TOOL_CALL",
        tool: "orders.nonexistent_tool",
        arguments: {},
        confidence: 0.9,
        diagnostics: Object.freeze({ backend: "mock-error-adapter", error: "hallucinated_tool" })
      });
    }

    return Object.freeze({
      kind: "NO_TOOL",
      reason: "NO_ALLOWED_TOOL",
      diagnostics: Object.freeze({ backend: "mock-error-adapter" })
    });
  }
}

// ============================================================
// FILE RESPONSE ADAPTER — ler respostas de arquivo externo
// ============================================================

class FileResponseAdapter extends TestToolModel {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this.responses = null;
  }

  async load() {
    if (!this.filePath) return false;
    try {
      const fs = require("fs");
      const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      this.responses = data;
      this.loaded = true;
      return true;
    } catch (error) {
      this.metrics.failures += 1;
      return false;
    }
  }

  async generateToolCall({ command, tools = [], context = {} } = {}) {
    if (!this.responses || !this.loaded) {
      return Object.freeze({
        kind: "NO_TOOL",
        reason: "NO_RESPONSES_LOADED",
        diagnostics: Object.freeze({ backend: "file-response-adapter" })
      });
    }

    const match = command.match(/case_id[:=]\s*["']?(\w+)["']?/i);
    const caseId = match ? match[1] : null;

    if (!caseId || !this.responses[caseId]) {
      return Object.freeze({
        kind: "NO_TOOL",
        reason: "CASE_NOT_FOUND",
        diagnostics: Object.freeze({ backend: "file-response-adapter" })
      });
    }

    const response = this.responses[caseId];
    if (!response || !response.model_response) {
      return Object.freeze({
        kind: "NO_TOOL",
        reason: "NO_MODEL_RESPONSE",
        diagnostics: Object.freeze({ backend: "file-response-adapter" })
      });
    }

    return Object.freeze({
      kind: response.model_response.kind,
      tool: response.model_response.tool || "",
      arguments: response.model_response.arguments || {},
      confidence: response.model_response.confidence || 0,
      diagnostics: Object.freeze({ backend: "file-response-adapter" })
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  TestToolModel,
  DisabledAdapter,
  MockPerfectAdapter,
  MockWriteLeakAdapter,
  MockErrorAdapter,
  FileResponseAdapter
};
