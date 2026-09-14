(function attachSimplificaScreenRegistry(global) {
  "use strict";
  const MAIN_SCREENS = Object.freeze([
    ["dashboard", "Início", "dashboard", "renderDashboard", "basic_dashboard", ["home", "inicio"], true, true],
    ["pedidos", "Pedidos", "pedidos", "renderListaPedidos", "basic_orders", ["orders"], true, true],
    ["producao", "Produção", "producao", "renderProducao", "basic_production", ["production"], true, true],
    ["caixa", "Caixa", "caixa", "renderCaixa", "simple_cashier", ["cash"], true, true],
    ["estoque", "Estoque", "estoque", "renderEstoque", "basic_stock", ["inventory"], true, false],
    ["clientes", "Clientes", "clientes", "renderClientes", "basic_customers", ["customers"], true, false],
    ["calculadora", "Calculadora", "calculadora", "renderCalculadoraTela", "basic_calculator", ["calculator"], true, true],
    ["impressoras", "Impressoras", "impressoras", "renderImpressoras", "printer_registry", ["printers"], true, false],
    ["relatorios", "Relatórios", "relatorios", "renderRelatorios", "simple_reports", ["reports"], true, false],
    ["config", "Sistema", "config", "renderConfig", "settingsBasic", ["settings", "configuracoes"], true, false]
  ].map(([id,title,icon,renderer,permission,aliases,desktopNav,bottomNav]) => Object.freeze({ id, path: id, title, icon, renderer, permission, aliases: Object.freeze(aliases), aiNavigationId: id, desktopNav, mobileNav: desktopNav, bottomNav, layout: "app" })));
  class ScreenRegistry {
    constructor({ screens = MAIN_SCREENS } = {}) { this.screens = new Map(); this.aliases = new Map(); screens.forEach((screen) => this.register(screen)); }
    register(screen) { if (!screen?.id || this.screens.has(screen.id)) throw new Error("DUPLICATE_SCREEN_ID"); for (const alias of screen.aliases || []) if (this.aliases.has(alias) || this.screens.has(alias)) throw new Error("DUPLICATE_SCREEN_ALIAS"); const value = Object.freeze({ ...screen, aliases: Object.freeze([...(screen.aliases || [])]) }); this.screens.set(value.id, value); value.aliases.forEach((alias) => this.aliases.set(alias, value.id)); return value; }
    resolve(id) { const key = String(id || ""); return this.screens.get(key) || this.screens.get(this.aliases.get(key)) || null; }
    has(id) { return !!this.resolve(id); }
    list() { return Object.freeze([...this.screens.values()]); }
    validate() { const screens = this.list(); return Object.freeze({ ok: screens.length === MAIN_SCREENS.length && screens.every((screen) => screen.id && screen.path && screen.renderer), screens }); }
  }
  const registry = new ScreenRegistry();
  global.SimplificaScreenRegistry = Object.freeze({ MAIN_SCREENS, ScreenRegistry, registry });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaScreenRegistry;
})(typeof window !== "undefined" ? window : globalThis);
