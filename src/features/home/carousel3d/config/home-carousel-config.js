(function attachHomeCarouselConfig(global) {
  "use strict";
  const active = [
    ["production", "Produção", "producao"], ["cash_today", "Caixa", "caixa"],
    ["reports", "Relatórios", "relatorios"], ["stock", "Estoque", "estoque"],
    ["administration", "Administração", "administracao"]
  ].map(function (item, index) { return Object.freeze({ id: item[0], title: item[1], source: item[0], targetScreen: item[2], targetMode: "screen", available: true, enabled: true, defaultVisible: true, removable: true, reorderable: true, configurable: true, future: false, priority: index + 1, layout: "card", animation: "depth" }); });
  const future = ["fiscal", "accounts_payable", "accounts_receivable", "purchases", "shipping", "crm", "quality", "maintenance"].map(function (id) { return Object.freeze({ id, title: id, source: null, targetScreen: null, targetMode: "none", available: false, enabled: false, defaultVisible: false, removable: false, reorderable: false, configurable: false, future: true, priority: 0, layout: "card", animation: "none" }); });
  const config = Object.freeze({ dragToIndexRatio: 0.008, friction: 0.92, snapDurationMs: 220, autoplayIntervalMs: 15000, active, future });
  global.SimplificaHomeCarouselConfig = config;
  if (typeof module !== "undefined" && module.exports) module.exports = config;
})(typeof window !== "undefined" ? window : globalThis);
