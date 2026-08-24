(function attachToolCallingModel(global) {
  "use strict";
  class ToolCallingModel {
    async load() { throw new Error("NOT_IMPLEMENTED"); }
    async warmup() { throw new Error("NOT_IMPLEMENTED"); }
    async unload() { throw new Error("NOT_IMPLEMENTED"); }
    async selectTool() { throw new Error("NOT_IMPLEMENTED"); }
    async extractArguments() { throw new Error("NOT_IMPLEMENTED"); }
    async generateToolCall() { throw new Error("NOT_IMPLEMENTED"); }
    getConfidence() { return 0; }
    getMetrics() { return Object.freeze({}); }
  }
  const api = Object.freeze({ ToolCallingModel });
  global.SimplificaToolCallingModel = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
