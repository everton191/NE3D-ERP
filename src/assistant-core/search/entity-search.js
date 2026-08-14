(function attachAssistantSearch(global) {
  "use strict";
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function distance(a, b) { const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) rows[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return rows[a.length][b.length]; }
  function score(query, candidate) {
    const q = normalize(query); const c = normalize(candidate);
    if (!q || !c) return 0; if (q === c) return 100; if (c.includes(q)) return 80;
    const terms = q.split(" "); const matched = terms.filter((term) => c.includes(term)).length;
    const fuzzy = Math.max(0, 1 - distance(q, c) / Math.max(q.length, c.length));
    return Math.round((matched / terms.length) * 55 + fuzzy * 35);
  }
  class EntitySearchEngine {
    search({ query, items = [], fields = ["name"], limit = 10, minScore = 35 } = {}) {
      return items.map((item) => ({ item, score: Math.max(...fields.map((field) => score(query, item?.[field]))) })).filter((result) => result.score >= minScore).sort((a, b) => b.score - a.score).slice(0, limit);
    }
  }
  const api = Object.freeze({ normalize, distance, score, EntitySearchEngine });
  global.UniversalAssistantSearch = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
