const fs = require("fs");
const vm = require("vm");

const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const service = fs.readFileSync("src/services/themeAuthorityV2.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'const ERP_THEME_KEY = "simplifica3d_erp_theme_preference"',
  'Object.freeze(["light", "system", "dark"])',
  'global.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"',
  "function applyErpTheme",
  "data-erp-theme-preference",
  "simplifica-theme-system-change"
].forEach((marker) => assert(service.includes(marker), `Autoridade ERP ausente: ${marker}`));

[
  'const erpKey = "simplifica3d_erp_theme_preference"',
  'document.documentElement.setAttribute("data-erp-theme", erpTheme)',
  'document.documentElement.setAttribute("data-erp-theme-preference", erpPreference)',
  'class="app-shell erp-shell erp-theme-v2"'
].forEach((marker) => assert(index.includes(marker), `Bootstrap ERP V2 ausente: ${marker}`));

[
  "function normalizarPreferenciaTemaInterface",
  'if (normalized === "auto") return "system"',
  "window.SimplificaThemeAuthorityV2?.applyErpTheme?.(temaPreferido)",
  'document.body.classList.toggle("theme-dark", !usarClaro)',
  '<option value="system" ${normalizarPreferenciaTemaInterface(appConfig.theme) === "system" ? "selected" : ""}>Seguir sistema</option>'
].forEach((marker) => assert(app.includes(marker), `Integracao ERP V2 ausente: ${marker}`));

function createThemeSandbox({ dark = false, matchMediaAvailable = true } = {}) {
  const storage = new Map();
  const attributes = new Map();
  const bodyAttributes = new Map();
  const shellAttributes = new Map();
  const classes = new Set();
  const listeners = {};
  const meta = { content: "", setAttribute(key, value) { if (key === "content") this.content = value; } };
  const shell = {
    classList: { add(value) { classes.add(value); } },
    setAttribute(key, value) { shellAttributes.set(key, value); }
  };
  const media = {
    matches: dark,
    addEventListener(type, callback) { listeners[type] = callback; }
  };
  const window = {
    localStorage: {
      getItem(key) { return storage.get(key) || ""; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    document: {
      documentElement: { setAttribute(key, value) { attributes.set(key, value); } },
      body: {
        setAttribute(key, value) { bodyAttributes.set(key, value); },
        classList: { toggle(value, active) { if (active) classes.add(value); else classes.delete(value); } }
      },
      querySelector(selector) {
        if (selector === "#app-shell") return shell;
        if (selector === "meta[name='theme-color']") return meta;
        return null;
      },
      querySelectorAll() { return []; }
    },
    dispatchEvent(event) { listeners.lastDispatch = event.type; },
    CustomEvent: function CustomEvent(type) { this.type = type; }
  };
  if (matchMediaAvailable) window.matchMedia = () => media;
  vm.runInNewContext(service, { window, globalThis: window, CustomEvent: window.CustomEvent });
  return { api: window.SimplificaThemeAuthorityV2, storage, attributes, bodyAttributes, shellAttributes, classes, listeners, media, meta };
}

const claro = createThemeSandbox({ dark: false });
assert(claro.api.resolveTheme("system") === "light", "system claro deve resolver light");
assert(claro.api.resolveTheme("auto") === "light", "auto legado deve migrar para system claro");
assert(claro.api.normalizePreference("valor-invalido") === "light", "valor invalido deve cair no padrao claro");
assert(claro.api.getSavedErpThemePreference() === "light", "ERP sem preferencia salva deve iniciar claro");
assert(claro.api.getSavedStoreThemePreference() === "light", "loja sem preferencia salva deve iniciar clara");
assert(claro.api.resolveTheme("dark") === "dark", "dark manual deve prevalecer em sistema claro");

const escuro = createThemeSandbox({ dark: true });
assert(escuro.api.resolveTheme("system") === "dark", "system escuro deve resolver dark");
assert(escuro.api.resolveTheme("light") === "light", "light manual deve prevalecer em sistema escuro");
escuro.api.applyErpTheme("system");
assert(escuro.attributes.get("data-erp-theme") === "dark", "apply system deve refletir sistema escuro");
assert(escuro.shellAttributes.get("data-erp-theme-preference") === "system", "shell deve guardar preferencia system");
assert(escuro.meta.content === "#08131d", "theme-color escuro deve ser aplicado");
escuro.media.matches = false;
escuro.listeners.change();
assert(escuro.attributes.get("data-erp-theme") === "light", "alteracao do sistema deve atualizar tema sem reload");
assert(escuro.listeners.lastDispatch === "simplifica-theme-system-change", "evento de alteracao do sistema deve ser emitido");

const fallback = createThemeSandbox({ matchMediaAvailable: false });
assert(fallback.api.resolveTheme("system") === "light", "fallback sem matchMedia deve permanecer claro");

console.log("ERP theme V2: system claro/escuro, preferencias manuais, migracao auto, fallback e troca sem reload validados.");
