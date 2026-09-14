(function attachReportsData(global) {
  "use strict";
  function createSnapshot(deps) {
    const period = deps.getPeriodoRelatoriosAtivo();
    const info = deps.getInfoPeriodoRelatorios(period);
    const aggregate = deps.calcularAgregadoRelatorios(info);
    const series = deps.gerarSerieRelatorios(info);
    return Object.freeze({ period, info, customPeriod: deps.getPeriodoCustomizadoRelatorios(), aggregate, series, categories: deps.calcularCategoriasRelatorios(info), canOperate: deps.temAcessoCompleto(), advanced: deps.isContextAdvancedVisible("relatorios") });
  }
  global.SimplificaReportsData = Object.freeze({ createSnapshot });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaReportsData;
})(typeof window !== "undefined" ? window : globalThis);
