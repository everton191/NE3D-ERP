(function attachSimplificaInventoryRollConsumption(global) {
  "use strict";

  function calcularPreviaConsumoPorRolo(material = {}, quantidadeNecessaria = 0, unidade = "", helpers = {}) {
    const necessario = Math.max(0, Number(quantidadeNecessaria) || 0);
    const unidadeControle = unidade || material.unidade || material.unit || "un";
    const normalizarLotesEstoque = helpers.normalizarLotesEstoque || (() => []);
    const materialUsaControleLote = helpers.materialUsaControleLote || (() => false);
    const podeUsarControleRolosEstoque = helpers.podeUsarControleRolosEstoque || (() => false);
    const lotes = normalizarLotesEstoque(material)
      .filter((lote) => String(lote.unit || unidadeControle) === String(unidadeControle))
      .filter((lote) => !["inativo", "esgotado"].includes(String(lote.status || "").toLowerCase()))
      .sort((a, b) => {
        const saldoA = Math.max(0, Number(a.current_quantity) || 0);
        const saldoB = Math.max(0, Number(b.current_quantity) || 0);
        return saldoA - saldoB || String(a.purchase_date || a.created_at || "").localeCompare(String(b.purchase_date || b.created_at || ""));
      });
    let restante = necessario;
    const sugestoes = lotes.map((lote) => {
      const saldo = Math.max(0, Number(lote.current_quantity) || 0);
      const consumir = Math.min(saldo, restante);
      restante = Math.max(0, restante - consumir);
      return {
        lote,
        quantidade: consumir,
        saldoAtual: saldo,
        saldoSimulado: Math.max(0, saldo - consumir)
      };
    }).filter((item) => item.quantidade > 0);
    const disponivel = lotes.reduce((soma, lote) => soma + (Number(lote.current_quantity) || 0), 0);
    return {
      enabled: Boolean(helpers.previewEnabled) && podeUsarControleRolosEstoque() && materialUsaControleLote(material),
      automaticoAtivo: Boolean(helpers.autoConsumptionEnabled),
      necessario,
      disponivel,
      unidade: unidadeControle,
      sugestoes,
      falta: Math.max(0, necessario - disponivel)
    };
  }

  const api = Object.freeze({ calcularPreviaConsumoPorRolo });
  global.SimplificaInventoryRollConsumption = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
