(function attachAssistantNavigation(global) {
  "use strict";
  class NavigationRegistry {
    constructor({ routes = [], navigate = () => {}, back = () => {} } = {}) { this.routes = new Map(routes.map((route) => [route.id, route])); this.navigateAdapter = navigate; this.backAdapter = back; this.stack = []; }
    resolve(routeId, params = {}) {
      const route = this.routes.get(routeId);
      if (!route) return null;
      let path = route.path;
      for (const name of (path.match(/:[A-Za-z0-9_]+/g) || [])) {
        const key = name.slice(1); const value = String(params[key] || "");
        if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
        path = path.replace(name, encodeURIComponent(value));
      }
      return { routeId, path, params: { ...params } };
    }
    navigate(routeId, params = {}, origin = null) { const target = this.resolve(routeId, params); if (!target) return { status: "BLOCKED", reason: "UNKNOWN_OR_INVALID_ROUTE" }; if (origin) this.stack.push(origin); this.navigateAdapter(target); return { status: "SUCCESS", target }; }
    back() { const origin = this.stack.pop(); if (origin) this.navigateAdapter(origin); else this.backAdapter(); return { status: "SUCCESS", target: origin || null }; }
  }
  const api = Object.freeze({ NavigationRegistry });
  global.UniversalAssistantNavigation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
