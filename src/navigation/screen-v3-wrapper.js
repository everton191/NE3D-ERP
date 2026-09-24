(function attachScreenV3Wrapper(global) {
  "use strict";
  function render(screen, context = {}) {
    const { escaparAttr, renderScreen } = context;
    const html = renderScreen(screen);
    const migrated = new Set(["mais", "conta", "administracao", "promocoes", "pedido", "producao", "estoque", "pedidos", "clientes", "caixa", "relatorios", "backup", "config", "empresa", "preferencias", "personalizacao", "pdf", "seguranca", "usuarios", "ajuda", "sobre", "superadmin"]);
    if (!migrated.has(screen) || String(html).includes('data-ui-version="v3"')) return html;
    return `<section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-generic-screen" data-ui-version="v3" data-ui3-screen="${escaparAttr(screen)}">${html}</section>`;
  }
  const api = Object.freeze({ render });
  global.SimplificaScreenV3Wrapper = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
