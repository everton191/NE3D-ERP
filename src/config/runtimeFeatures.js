(function (global) {
  "use strict";

  // Ponto unico para ativar recursos operacionais preservados para uso futuro.
  global.__SIMPLIFICA_RUNTIME_FEATURES__ = Object.freeze({
    adsEnabled: false,
    aiOrderCreateEnabled: true,
    stockRollsEnabled: true,
    stockScannerEnabled: false,
    stockReservationsEnabled: false,
    stockMovementRpcEnabled: false,
    stockRollAutoConsumptionEnabled: false,
    enterpriseWarehousesEnabled: false,
    enterprisePurchasingEnabled: false,
    enterpriseQualityControlEnabled: false,
    enterpriseTransfersEnabled: false,
    enterpriseCycleCountsEnabled: false
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
