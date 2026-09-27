(function attachHomeCarouselConfig(global) {
  "use strict";
  const active = [
    ["orders", "Pedidos", "pedidos"], ["inventory", "Estoque", "estoque"], ["production", "Produção", "producao"], ["cash", "Caixa", "caixa"], ["sales", "Vendas", "relatorios"],
    ["printers", "Impressoras", "impressoras"], ["customers", "Clientes", "clientes"], ["storefront", "Loja Online", "lojaOnline"], ["quotes", "Orçamentos", "calculadora"], ["calculator", "Calculadora", "calculadora"]
  ].map(function (item, index) { return Object.freeze({ id: item[0], title: item[1], source: item[0], targetScreen: item[2], targetMode: "screen", available: true, enabled: true, defaultVisible: index < 5, removable: true, reorderable: true, configurable: true, future: false, priority: index + 1, layout: "card", animation: "depth", dataProvider: null, dynamicState: null }); });
  const future = [];
  const config = Object.freeze({ dragToIndexRatio: 0.008, friction: 0.92, snapDurationMs: 220, autoplayIntervalMs: 15000, active, future });
  global.SimplificaHomeCarouselConfig = config;
  if (typeof module !== "undefined" && module.exports) module.exports = config;
})(typeof window !== "undefined" ? window : globalThis);
