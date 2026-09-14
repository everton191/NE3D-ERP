(function attachReportsFeature(global) {
  "use strict";
  class ReportsController {
    constructor() { this.mounted = false; this.mounts = 0; this.updates = 0; this.unmounts = 0; this.cleanup = new Set(); }
    mount(context = {}) { if (this.mounted) return this.update(context); this.mounted = true; this.mounts += 1; return this.render(context); }
    update(context = {}) { this.updates += 1; return this.render(context); }
    render(context = {}) { if (typeof context.renderLegacy !== "function") return ""; return context.renderLegacy(); }
    onCleanup(callback) { if (typeof callback === "function") this.cleanup.add(callback); return callback; }
    unmount() { for (const callback of this.cleanup) { try { callback(); } catch (_) {} } this.cleanup.clear(); if (this.mounted) this.unmounts += 1; this.mounted = false; }
    metrics() { return Object.freeze({ mounted: this.mounted, mounts: this.mounts, updates: this.updates, unmounts: this.unmounts, cleanup: this.cleanup.size }); }
  }
  const controller = new ReportsController();
  global.SimplificaReportsFeature = Object.freeze({ ReportsController, controller });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaReportsFeature;
})(typeof window !== "undefined" ? window : globalThis);
