(function attachPrinterPresentation(global) {
  "use strict";

  function formatarTemperaturaImpressora(valor) {
    if (valor === null || valor === undefined || valor === "") return "—";
    const numero = Number(valor);
    return Number.isFinite(numero) ? `${numero.toFixed(0)} °C` : "—";
  }

  function getPrinterQueueStage(job = {}) {
    const status = String(job.status || "novo_pedido");
    if (["em_impressao", "pausado", "pos_processamento", "controle_qualidade"].includes(status)) return "impressao";
    if (status === "pronto_para_entrega") return "prontos";
    if (["entregue", "cancelado"].includes(status)) return "arquivado";
    return "fila";
  }

  function getPrinterQueueStageLabel(stage = "fila") {
    return ({ fila: "Em fila", impressao: "Imprimindo", prontos: "Pronto" })[stage] || "Em fila";
  }
  function calcularCustoDesperdicioImpressao(material = {}, grams = 0, minutes = 0, printer = {}) {
    const unit = String(material.unidade || material.unit || "kg").toLowerCase();
    const quantity = unit === "kg" ? Math.max(0, Number(grams) || 0) / 1000 : unit === "g" ? Math.max(0, Number(grams) || 0) : 0;
    const materialCost = quantity * Math.max(0, Number(material.custoUnitario || material.unit_cost) || 0);
    const machineCost = (Math.max(0, Number(printer.hourly_cost) || 0) / 60) * Math.max(0, Number(minutes) || 0);
    return materialCost + machineCost;
  }

  const api = Object.freeze({ formatarTemperaturaImpressora, getPrinterQueueStage, getPrinterQueueStageLabel, calcularCustoDesperdicioImpressao });
  global.SimplificaPrinterPresentation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
