(function attachAssistantTools(global) {
  "use strict";
  const contracts = global.UniversalAssistantContracts || (typeof require === "function" ? require("../schemas/contracts.js") : null);
  class ToolRegistry {
    constructor({ permissionGuard = () => true, writePipeline = null } = {}) { this.items = new Map(); this.permissionGuard = permissionGuard; this.writePipeline = writePipeline; }
    register(tool) { if (!tool?.name || !Object.values(contracts.ACCESS).includes(tool.access) || typeof tool.execute !== "function") throw new Error("Tool inválida."); if (this.items.has(tool.name)) throw new Error(`Tool duplicada: ${tool.name}`); this.items.set(tool.name, Object.freeze({ ...tool })); return tool; }
    async execute(name, input = {}, context = {}) {
      const tool = this.items.get(name);
      if (!tool) return { status: contracts.TOOL_STATUS.BLOCKED, reason: "UNKNOWN_TOOL" };
      if (!this.permissionGuard(tool, context)) return { status: contracts.TOOL_STATUS.BLOCKED, reason: "PERMISSION_DENIED" };
      if (tool.access === contracts.ACCESS.WRITE) {
        if (!this.writePipeline?.prepare) return { status: contracts.TOOL_STATUS.BLOCKED, reason: "WRITE_CAPABILITY_GATE_UNAVAILABLE" };
        return this.writePipeline.prepare({ type: name, payload: input, context });
      }
      try { return { status: contracts.TOOL_STATUS.SUCCESS, data: await tool.execute(input, context) }; }
      catch (_) { return { status: contracts.TOOL_STATUS.FAILURE, reason: "TOOL_EXECUTION_FAILED" }; }
    }
  }
  const api = Object.freeze({ ToolRegistry });
  global.UniversalAssistantTools = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
