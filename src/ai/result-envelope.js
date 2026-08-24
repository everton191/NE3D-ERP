(function attachSimplificaActionResult(global) {
  "use strict";
  function create(action, { success = true, data = null, warnings = [], missing = [], errors = [], nextActions = [] } = {}) {
    return Object.freeze({ success: Boolean(success), action: String(action || ""), data, warnings: [...warnings], missing: [...missing], errors: [...errors], nextActions: [...nextActions] });
  }
  const api = Object.freeze({ success: (action, data, extra = {}) => create(action, { ...extra, success: true, data }), failure: (action, errors, extra = {}) => create(action, { ...extra, success: false, errors: Array.isArray(errors) ? errors : [errors] }), create });
  global.SimplificaActionResult = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
