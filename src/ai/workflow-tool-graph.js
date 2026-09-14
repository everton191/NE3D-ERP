(function attachWorkflowToolGraph(global) {
  "use strict";
  const registry = global.SimplificaActionRegistry || (typeof require === "function" ? require("./action-registry.js") : null);
  const searchApi = global.SimplificaActionSearch || (typeof require === "function" ? require("./action-search.js") : null);
  const MAX_TOP_K = 3;
  const compact = (value, max = 160) => String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
  function refsFrom(context = {}) {
    const selected = context.selectedEntityRefs || context.selectedRefs || {};
    const fields = { ...(context.knownFields || {}), ...selected };
    for (const [key, value] of Object.entries(context.recentResults || {})) if (value != null && typeof value !== "object") fields[key] = value;
    return fields;
  }
  function operationalContext(input = {}) {
    const fields = refsFrom(input);
    return Object.freeze({ route: compact(input.route || input.screen, 80), screen: compact(input.screen || input.route, 80), domain: compact(input.domain, 40),
      selectedEntityRefs: Object.freeze({ ...fields }), permissions: Object.freeze([...(input.permissions || [])]), workflowState: Object.freeze({ lastActionId: compact(input.workflowState?.lastActionId, 100), known: Object.keys(fields) }),
      recentResults: Object.freeze(Object.fromEntries(Object.entries(input.recentResults || {}).slice(-3).map(([key, value]) => [key, compact(typeof value === "string" ? value : JSON.stringify(value), 160)]))), candidateToolIds: Object.freeze([]) });
  }
  class WorkflowToolGraph {
    constructor({ permissionGuard = null } = {}) { this.permissionGuard = permissionGuard || (() => true); }
    canUse(action, context, known) {
      if (!action || !registry.health(action).exposed || ![registry.OPERATION.READ, registry.OPERATION.PREPARE].includes(action.operationType)) return false;
      if (!this.permissionGuard(action.permission, context)) return false;
      if (action.requires.some((field) => known[field] == null || known[field] === "")) return false;
      const previous = context.workflowState?.lastActionId && registry.get(context.workflowState.lastActionId);
      return !previous?.allowedNext?.length || previous.allowedNext.includes(action.id) || action.domain === previous.domain;
    }
    mask(context = {}) {
      const normalized = operationalContext(context), known = refsFrom(normalized);
      const actions = registry.actions.filter((action) => this.canUse(action, normalized, known) && (!normalized.domain || action.domain === normalized.domain || action.domain === "navigation"));
      return Object.freeze({ context: Object.freeze({ ...normalized, candidateToolIds: Object.freeze(actions.map((item) => item.id)) }), actions: Object.freeze(actions), maxTopK: MAX_TOP_K });
    }
    select(command, context = {}) {
      const mask = this.mask(context);
      const ranked = searchApi.search(command, mask.context, MAX_TOP_K).filter((item) => mask.context.candidateToolIds.includes(item.action));
      const candidates = ranked.length > 1 && ranked[0].score - ranked[1].score >= 2 ? ranked.slice(0, 1) : ranked.slice(0, MAX_TOP_K);
      return Object.freeze({ ...mask, candidates: Object.freeze(candidates.map((item) => item.action)) });
    }
    advance(context = {}, actionId, result = {}) {
      const action = registry.get(actionId); const known = refsFrom(context);
      for (const field of action?.produces || []) if (result[field] != null) known[field] = result[field];
      return operationalContext({ ...context, knownFields: known, workflowState: { lastActionId: actionId } });
    }
  }
  const api = Object.freeze({ MAX_TOP_K, WorkflowToolGraph, operationalContext, compact });
  global.SimplificaWorkflowToolGraph = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
