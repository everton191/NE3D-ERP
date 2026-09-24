(function attachCalculatorCommands(global) {
  "use strict";

  function runCalculation(opcoes = {}, deps = {}) {
    const CalculatorDomain = deps.domain;
    const silent = opcoes.silent === true;
    const skipUsage = opcoes.skipUsage === true;
    const pesoRaw = deps.documentRef.getElementById("peso")?.value;
    const tempoRaw = deps.documentRef.getElementById("tempo")?.value;
    const tempoMinutosRaw = deps.documentRef.getElementById("tempoMinutos")?.value;
    if (silent && (!String(pesoRaw || "").trim() || (!String(tempoRaw || "").trim() && !String(tempoMinutosRaw || "").trim()))) {
      deps.setUltimoCalculo(null);
      const resultadoVazio = deps.documentRef.getElementById("res");
      if (resultadoVazio) resultadoVazio.innerHTML = deps.renderResumo(null);
      return false;
    }
    const usuarioMonetizacao = deps.getUsuarioMonetizacao();
    if (deps.adsEnabled && !skipUsage && deps.windowRef.MonetizationLimits && !deps.windowRef.MonetizationLimits.canUseCalculator(usuarioMonetizacao)) {
      deps.showUnlockModal({
        tipo: "calculator",
        titulo: "Limite diário da calculadora",
        texto: "Você usou os 30 cálculos gratuitos de hoje. Assista a um anúncio para liberar +20 cálculos ou assine o PRO para uso ilimitado."
      }).then((liberado) => {
        if (liberado) deps.recalcular();
      });
      return false;
    }

    let peso;
    let filamento;
    let tempo;
    let tempoMinutos;
    let qtd;
    let energia;
    let consumo;
    let custoHora;
    let margem;
    try {
      peso = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("peso")?.value, "peso em gramas", { min: 0 });
      filamento = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("filamento")?.value, "custo do material", { min: 0 });
      const tempoHoras = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("tempo")?.value || 0, "horas de impressão", { min: 0 });
      tempoMinutos = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("tempoMinutos")?.value || 0, "minutos de impressão", { min: 0 });
      const tempoTotalInformadoMinutos = CalculatorDomain.toMinutes(tempoHoras, tempoMinutos);
      const tempoNormalizado = CalculatorDomain.formatMinutes(tempoTotalInformadoMinutos);
      tempoMinutos = tempoNormalizado.minutes;
      tempo = tempoTotalInformadoMinutos / 60;
      const impressaoLote = deps.documentRef.getElementById("impressaoLote")?.checked === true;
      qtd = impressaoLote
        ? deps.inventory.parseNumberStrict(deps.documentRef.getElementById("quantidade")?.value, "quantidade do lote", { min: 2 })
        : 1;
      energia = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("energia")?.value, "custo de energia", { min: 0 });
      consumo = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("consumo")?.value, "consumo elétrico", { min: 0 });
      custoHora = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("custoHora")?.value, "custo por hora", { min: 0 });
      margem = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("margem")?.value, "margem", { min: 0 });
    } catch (erro) {
      if (!silent) deps.errorService.notify(erro, { area: "Calculadora", action: "Calcular preço", errorKey: "CALCULATE_QUOTE_FAILED" });
      return false;
    }
    const printer = deps.documentRef.getElementById("printer")?.value || deps.appConfig.defaultPrinterModel || "";
    const tipoImpressao = deps.printers[printer]?.tipo || deps.documentRef.getElementById("printerType")?.value || "FDM";
    const materialId = "";
    const materialEstoque = null;
    if (!skipUsage) {
      deps.recordUsageEvent("impressora_usada", { impressora: printer, margem, peso, tempo });
    }

    const impressaoLote = deps.documentRef.getElementById("impressaoLote")?.checked === true;
    const taxaAtiva = deps.documentRef.getElementById("taxaExtraAtiva")?.checked === true;
    const dominio = CalculatorDomain.calculate({
      weightGrams: peso,
      timeMinutes: Math.round(tempo * 60),
      batchActive: impressaoLote,
      quantity: qtd,
      batchMode: deps.getBatchMode(),
      materialPricePerKg: filamento,
      energyPricePerKwh: energia,
      powerWatts: consumo,
      machineCostPerHour: custoHora,
      minimumChargedHours: Number(deps.appConfig.minimumChargedHours) || 0,
      markupPercent: margem,
      extraFeeEnabled: taxaAtiva,
      extraFeeType: deps.getExtraFeeState().modo === "manual" ? "fixed" : "percent",
      extraFeePercent: deps.getExtraFeeState().percent,
      extraFeeFixed: deps.getExtraFeeState().value,
      roundingStep: Number(deps.appConfig.priceRounding) || 0
    });
    const tempoCobrado = dominio.chargedHours;
    const material = dominio.materialCost;
    const energiaC = dominio.energyCost;
    const maquina = dominio.machineCost;
    const baseProduto = dominio.baseCost;
    const lucroProduto = dominio.profitAmount;
    const valorProduto = dominio.subtotalBase;
    const taxaExtra = dominio.extraFeeAmount;
    const preco = dominio.totalPrice;
    const ajusteArredondamento = dominio.roundingAdjustment;
    const taxaInfo = { modo: dominio.extraFeeType === "fixed" ? "manual" : "percent", rotulo: dominio.extraFeeType === "fixed" ? "R$" : `${dominio.extraFeePercent}%` };
    deps.saveCalculatorConfig(!silent && !skipUsage);

    const calculo = {
      preco: dominio.unitPrice,
      custo: baseProduto / dominio.quantity,
      custoMaterial: material,
      custoEnergia: energiaC,
      custoMaquina: maquina,
      baseProduto,
      lucroProduto,
      valorProduto,
      valorProdutoTotal: valorProduto,
      taxaExtra,
      taxaExtraMode: taxaInfo.modo,
      taxaExtraRotulo: taxaInfo.rotulo,
      precoSemTaxa: valorProduto,
      custoTotal: baseProduto,
      precoTotal: preco,
      totalFinal: preco,
      ajusteArredondamento,
      qtd: dominio.quantity,
      impressaoLote: dominio.batchActive,
      modoLote: dominio.batchMode,
      pesoInformado: dominio.informedWeightGrams,
      pesoTotal: dominio.totalWeightGrams,
      peso: dominio.totalWeightGrams,
      tempoInformadoMinutos: dominio.informedTimeMinutes,
      tempoTotalMinutos: dominio.totalTimeMinutes,
      tempo: dominio.totalTimeHours,
      tempoHorasInformadas: Math.floor(tempo),
      tempoMinutos: dominio.totalTimeMinutes % 60,
      tempoCobrado,
      printer,
      tipoImpressao,
      materialId,
      materialNome: materialEstoque?.nome || ""
    };
    deps.setUltimoCalculo(calculo);

    const resultado = deps.documentRef.getElementById("res");
    if (resultado) resultado.innerHTML = deps.renderResumo(calculo);
    deps.updateKeyboardBar();
    if (!skipUsage) deps.registerCalculation(usuarioMonetizacao);
    return true;
  }

  const api = Object.freeze({
    runCalculation
  });
  global.SimplificaCalculatorCommands = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
