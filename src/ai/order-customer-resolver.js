(function attachOrderCustomerResolver(global) {
  "use strict";
  const RESERVED = new Set(["pla", "petg", "abs", "impressora", "pedido"]);
  const isProperName = (value) => /^\p{Lu}[\p{L}'-]*$/u.test(String(value || "")) && !RESERVED.has(String(value).toLocaleLowerCase("pt-BR"));
  function resolveOrderCustomer(rawInput = "") {
    const raw = String(rawInput).trim();
    const patterns = [
      /\bpedido\s*#?\s*\d+\s+(?:da|do|de)\s+(?<name>[\p{L}'-]+)/iu,
      /\bpedido\s+(?:da|do|de|pra|para)\s+(?<name>[\p{L}'-]+)/iu,
      /\bnovo\s+pedido\s+(?<name>[\p{L}'-]+)/iu,
      /\b(?:pra|para)\s+(?<name>[\p{L}'-]+)(?=\s|$)/iu,
      /\bigual\s+(?:ao|o)\s+[úu]ltimo\s+(?:da|do|de)\s+(?<name>[\p{L}'-]+)/iu,
    ];
    for (const pattern of patterns) {
      const match = raw.match(pattern);
      const name = match?.groups?.name || "";
      if (match && isProperName(name)) return Object.freeze({ customerName: name, rawSpan: match[0] });
    }
    return null;
  }
  const api = Object.freeze({ resolveOrderCustomer });
  global.SimplificaOrderCustomerResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
