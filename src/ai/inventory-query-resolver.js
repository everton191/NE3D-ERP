(function attachInventoryQueryResolver(global) {
  "use strict";
  const SEARCH = /\b(?:procura|procurar|busca|buscar|pesquisa|pesquisar|encontra|encontrar|localiza|localizar)\b/i;
  function resolveInventoryQuery(rawInput = "") {
    const raw = String(rawInput).trim();
    const match = SEARCH.exec(raw);
    if (!match) return null;
    const prefix = raw.slice(0, match.index);
    if (prefix && !/^\s*(?:quero\s+|no\s+estoque\s+)?$/i.test(prefix)) return null;
    const query = raw.slice(match.index + match[0].length)
      .replace(/^\s*(?:por\s+)?/i, "")
      .replace(/\s+(?:no|do)\s+estoque\s*[?.!]*$/i, "")
      .replace(/[?.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!query || /^(?:estoque|material|produto)$/i.test(query)) return null;
    return Object.freeze({ query, rawSpan: raw.slice(match.index) });
  }
  const api = Object.freeze({ resolveInventoryQuery });
  global.SimplificaInventoryQueryResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
