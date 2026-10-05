(function attachOrderItemResolver(global) {
  "use strict";
  const singular = (value) => String(value || "").trim().replace(/s$/i, "");
  const result = (quantity, description, rawSpan) => Object.freeze({ quantity, description: singular(description), rawSpan });
  function resolveOrderItem(rawInput = "") {
    const raw = String(rawInput).trim();
    let match = raw.match(/\b(?:adiciona|adicionar)\s+mais\s+(\d+)\s+nesse\s+pedido\b/i);
    if (match) return result(Number(match[1]), "", match[0]);
    match = raw.match(/\bnovo\s+pedido\s+[\p{L}'-]+\s+(\d+)\s+(.+?)(?=\s+\d+(?:[,.]\d+)?\s+reais?\b|$)/iu);
    if (match) return result(Number(match[1]), match[2], match[0]);
    match = raw.match(/\bpedido\s+(?:pra|para)\s+[\p{L}'-]+\s+com\s+(\d+)\s+(.+?)(?=\s+de\s+\d+(?:[,.]\d+)?\s+reais?\b|$)/iu);
    if (match) return result(Number(match[1]), match[2], match[0]);
    match = raw.match(/\b(?:faz|quero|registra)\s+(\d+)\s+(.+?)(?=\s+(?:pra|para|por)\b|\s+a\s+\d+(?:[,.]\d+)?\b|\s+\d+(?:[,.]\d+)?\s+(?:reais?|cada)\b|$)/iu);
    if (match) return result(Number(match[1]), match[2], match[0]);
    match = raw.match(/^(?=.*\b(?:pra|para)\b)(\d+)\s+(.+?)(?=\s+(?:pra|para|por)\b)/iu);
    if (match) return result(Number(match[1]), match[2], match[0]);
    match = raw.match(/\bfaz\s+(um|uma|zero)\s+(.+?)(?=\s+(?:pra|para)\b|$)/iu);
    if (match) return result(/^zero$/i.test(match[1]) ? 0 : 1, match[2], match[0]);
    match = raw.match(/\bfaz\s+([\p{L}'-]+)(?=\s+por\s+[\p{L}'-]+\s+reais?\b)/iu);
    if (match) return result(null, match[1], match[0]);
    return null;
  }
  const api = Object.freeze({ resolveOrderItem });
  global.SimplificaOrderItemResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
