(function attachInventoryPresentation(global) {
  "use strict";

  function labelStatusEstoque(status = "normal") {
    const mapa = { normal: "Normal", low: "Baixo", critical: "Crítico" };
    return mapa[String(status || "normal")] || "Normal";
  }

  function formatarQuantidadeEstoque(valor = 0, unidade = "un") {
    return `${(Number(valor) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unidade || "un"}`;
  }

  function normalizarChaveProdutoEstoque(valor = "", helpers = {}) {
    const normalizarTexto = typeof helpers.normalizarSugestaoClienteTexto === "function" ? helpers.normalizarSugestaoClienteTexto : (item) => String(item || "").toLowerCase().trim();
    return normalizarTexto(valor).replace(/\s+/g, " ").trim();
  }

  const api = Object.freeze({ labelStatusEstoque, formatarQuantidadeEstoque, normalizarChaveProdutoEstoque });
  global.SimplificaInventoryPresentation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
