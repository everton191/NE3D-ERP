(function attachScreenDispatcher(global) {
  "use strict";
  function render(screen, context = {}) {
    const registry = context.screenRegistry;
    const resolved = registry?.resolve?.(screen);
    const tela = resolved?.id || screen;
    if (!context.canAccessScreen(tela)) return context.renderAcessoNegado();
    const r = context.renderers;
    if (tela === "privacy") return r.renderDocumentoLegalPage("privacidade");
    if (tela === "terms") return r.renderDocumentoLegalPage("termos");
    return (r[tela] || r.dashboard)();
  }
  const api = Object.freeze({ render });
  global.SimplificaScreenDispatcher = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
