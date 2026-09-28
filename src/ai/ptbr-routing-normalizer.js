(function attachPtBrRoutingNormalizer(global) {
  "use strict";
  const MAP = Object.freeze({ qnt: "quanto", qunto: "quanto", qtd: "quantidade", pra: "para", pro: "para o", hj: "hoje", zap: "whatsapp", tb: "também", vc: "você" });
  function normalizeRoutingInput(rawInput = "") { const raw = String(rawInput); const normalizedRoutingInput = raw.replace(/\b(qnt|qunto|qtd|pra|pro|hj|zap|tb|vc)\b/gi, (token) => MAP[token.toLowerCase()] || token); return Object.freeze({ rawInput: raw, normalizedRoutingInput, changed: raw !== normalizedRoutingInput }); }
  const api = Object.freeze({ MAP, normalizeRoutingInput }); global.SimplificaPtBrRoutingNormalizer = api; if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
