(function attachSimplificaActionSearch(global) {
  "use strict";
  const registry = global.SimplificaActionRegistry || (typeof require === "function" ? require("./action-registry.js") : null);
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const STOP_WORDS = new Set(["a", "as", "o", "os", "um", "uma", "uns", "umas", "de", "da", "das", "do", "dos", "em", "no", "na", "nos", "nas", "para", "por", "com", "me", "te", "se", "eu", "voce", "que"]);
  const stem = (value) => value.length > 5 ? value.slice(0, 5) : value.length > 3 && value.endsWith("r") ? value.slice(0, -1) : value;
  const tokens = (value) => new Set(normalize(value).split(/[^a-z0-9_]+/).filter((item) => item.length > 1 && !STOP_WORDS.has(item)).map(stem));
  function search(input, context = {}, topK = 5) {
    const queryTokens = tokens(input);
    const screen = normalize(context.screen || "");
    return registry.actions.filter((action) => registry.health(action).exposed).map((action) => {
      const haystack = tokens([action.id, action.domain, action.description, ...action.aliases, ...action.examples].join(" "));
      const lexicalScore = [...queryTokens].reduce((sum, token) => sum + (haystack.has(token) ? 1 : 0), 0);
      const aliasBonus = action.aliases.reduce((best, alias) => {
        const aliasTokens = [...tokens(alias)];
        return aliasTokens.length && aliasTokens.every((token) => queryTokens.has(token)) ? Math.max(best, aliasTokens.length + 1) : best;
      }, 0);
      let score = lexicalScore + aliasBonus;
      if (screen && (screen.includes(action.domain) || action.domain.includes(screen))) score += 3;
      if (context.capabilityBundle?.includes(action.id)) score += 4;
      return { action: action.id, score, lexicalScore, aliasBonus };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.action.localeCompare(b.action)).slice(0, Math.max(1, Math.min(10, Number(topK) || 5)));
  }
  const api = Object.freeze({ search });
  global.SimplificaActionSearch = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
