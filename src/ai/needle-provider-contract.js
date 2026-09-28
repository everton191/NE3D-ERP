(function attachNeedleProviderContract(global) {
  "use strict";
  const CAPABILITIES = Object.freeze(["toolCall", "extract", "embed", "health", "metrics", "cancel"]);
  function validateNeedleProviderContract(provider = {}) { const errors = CAPABILITIES.filter((name) => typeof provider[name] !== "function").map((name) => `MISSING_CAPABILITY:${name}`); return Object.freeze({ ok: errors.length === 0, capabilities: CAPABILITIES, errors: Object.freeze(errors) }); }
  const api = Object.freeze({ CAPABILITIES, validateNeedleProviderContract }); global.SimplificaNeedleProviderContract = api; if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
