"use strict";

/* Teste de contrato: as preferencias do editor do carrossel sobrevivem
   a fechar e reabrir o app. Executa as funcoes reais de persistencia
   extraidas do app.js (carregarObjeto, salvarLocalSeMudou,
   salvarJsonLocalSeMudou, salvarDados, persistirEditorCarrosselHome)
   com um localStorage em memoria e valida o caminho de restauracao
   usado por abrirEditorCarrosselHome/mountHomeCarousel. */

const fs = require("fs");
const path = require("path");
const assert = (value, message) => { if (!value) throw new Error(message); };
const ROOT = path.join(__dirname, "..");

const appSource = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const cssSource = fs.readFileSync(path.join(ROOT, "style.css"), "utf8");
const indexSource = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const viewSource = fs.readFileSync(path.join(ROOT, "src/features/home/carousel3d/editor/carousel-editor-view.js"), "utf8");
const mountSource = fs.readFileSync(path.join(ROOT, "src/features/home/carousel3d/home-carousel-mount.js"), "utf8");
const renderersSource = fs.readFileSync(path.join(ROOT, "src/features/app-ui/app-ui-renderers.js"), "utf8");

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}
const viewCode = stripComments(viewSource);

function extractFunction(source, name) {
  const marker = "function " + name + "(";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("funcao nao encontrada em app.js: " + name);
  let pIndex = start + marker.length - 1;
  let pDepth = 0;
  for (; pIndex < source.length; pIndex++) {
    const ch = source[pIndex];
    if (ch === "(") pDepth++;
    else if (ch === ")") { pDepth--; if (pDepth === 0) break; }
  }
  let i = source.indexOf("{", pIndex);
  if (i < 0) throw new Error("corpo nao encontrado: " + name);
  let depth = 0;
  let state = "code";
  for (; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (state === "code") {
      if (ch === '"') state = "dq";
      else if (ch === "'") state = "sq";
      else if (ch === "`") state = "tpl";
      else if (ch === "/" && next === "/") { state = "lc"; i++; }
      else if (ch === "/" && next === "*") { state = "bc"; i++; }
      else if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) return source.slice(start, i + 1); }
    } else if (state === "dq") { if (ch === "\\") i++; else if (ch === '"') state = "code"; }
    else if (state === "sq") { if (ch === "\\") i++; else if (ch === "'") state = "code"; }
    else if (state === "tpl") { if (ch === "\\") i++; else if (ch === "`") state = "code"; }
    else if (state === "lc") { if (ch === "\n") state = "code"; }
    else if (state === "bc") { if (ch === "*" && next === "/") { state = "code"; i++; } }
  }
  throw new Error("falha ao extrair a funcao: " + name);
}

const core = require("../src/features/home/carousel3d/editor/carousel-editor-core.js");
require("../src/features/home/carousel3d/config/home-carousel-config.js");
const registryApi = require("../src/features/home/carousel3d/widgets/home-carousel-widget-registry.js");

const screens = ["pedidos", "estoque", "producao", "caixa", "relatorios", "impressoras", "clientes", "lojaOnline", "calculadora"];
const registry = registryApi.createRegistry(screens);
const defaults = core.buildDefaultState(registry);

function createStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    has(key) { return data.has(key); },
  };
}

function createSession(storage) {
  const remounts = { count: 0 };
  const ctx = {
    localStorage: storage,
    localStorageWriteCache: new Map(),
    APP_DEBUG_MODE: false,
    console,
    scopedDataCacheReady: false,
    getEscopoDadosAtual: () => "",
    estoque: [],
    caixa: [],
    pedidos: [],
    orcamentos: [],
    historico: [],
    productionJobs: [],
    productionPrinters: [],
    productionEvents: [],
    diagnostics: [],
    sugestoes: [],
    securityLogs: [],
    auditLogs: [],
    pendingSync: [],
    PENDING_SYNC_QUEUE_KEY: "pendingSync",
    saasPlans: {},
    usageCounters: {},
    USAGE_LEARNING_KEY: "usageLearning",
    usageLearning: { events: [] },
    loginAttempts: [],
    usuarios: [],
    criarSyncConfigPersistente: () => ({}),
    normalizarUsoInteligente: (value) => value,
    billingConfig: {},
    dashboardPeriod: "month",
    dashboardAnalyticsCache: {},
    passwordResetTokens: [],
    window: { SimplificaHomeCarouselMount: { remount() { remounts.count += 1; }, resume() {} } },
    appConfig: {},
    editorCarrosselHomeAberto: false,
    editorCarrosselHomeAlterado: false,
  };
  const names = ["carregarObjeto", "salvarLocalSeMudou", "salvarJsonLocalSeMudou", "salvarDados", "persistirEditorCarrosselHome"];
  const body = names.map((name) => extractFunction(appSource, name)).join("\n")
    + "\nreturn { " + names.join(", ") + " };";
  const api = new Function(...Object.keys(ctx), body)(...Object.values(ctx));
  return {
    appConfig: ctx.appConfig,
    remounts,
    carregarObjeto: api.carregarObjeto,
    salvarJsonLocalSeMudou: api.salvarJsonLocalSeMudou,
    salvarDados: api.salvarDados,
    persistir: api.persistirEditorCarrosselHome,
  };
}

const storage = createStorage();

/* ---------------- Sessao 1: editar e salvar ---------------- */
const session1 = createSession(storage);
const editor = core.createEditor(defaults, registry);
assert(editor.addCard("printers"), "sessao 1: adiciona card do piso");
assert(editor.removeCard("production"), "sessao 1: remove card ativo");
assert(editor.moveCardToIndex("printers", 0), "sessao 1: reordena card");
editor.setAutoplay(false);
editor.setAutoplayInterval(30000);
const savedState = editor.getState();
assert(savedState.visibleCardIds[0] === "printers", "sessao 1: ordenacao esperada");

session1.persistir(savedState);
assert(session1.remounts.count === 1, "salvar remonta o carrossel imediatamente");
assert(storage.has("appConfig"), "salvarDados grava appConfig no localStorage");
const rawSession1 = JSON.parse(storage.getItem("appConfig"));
assert(JSON.stringify(rawSession1.homeCarouselPreferences) === JSON.stringify(savedState), "appConfig carrega homeCarouselPreferences");

/* ---------------- Sessao 2: fechar e reabrir o app ---------------- */
const session2 = createSession(storage);
const reloadedConfig = session2.carregarObjeto("appConfig", { appName: "Simplifica 3D" });
const saved = reloadedConfig.homeCarouselPreferences;
assert(saved && Array.isArray(saved.visibleCardIds) && saved.visibleCardIds.length >= core.MIN_CARDS, "preferencias persistem apos reabrir");

const reopenRule = saved && Array.isArray(saved.visibleCardIds) && saved.visibleCardIds.length >= core.MIN_CARDS ? saved : defaults;
const reopenedEditor = core.createEditor(reopenRule, registry);
assert(JSON.stringify(reopenedEditor.getState()) === JSON.stringify(savedState), "editor reabre com a ordem salva");

const virgin = createStorage();
const virginConfig = createSession(virgin).carregarObjeto("appConfig", { appName: "Simplifica 3D" });
assert(!virginConfig.homeCarouselPreferences, "sem preferencias salvas a sessao fica vazia");
assert(JSON.stringify(core.createEditor(virginConfig.homeCarouselPreferences || defaults, registry).getState()) === JSON.stringify(core.createEditor(defaults, registry).getState()), "estado inicial usa os defaults");

/* ---------------- Caminho de restauracao declarado no app.js ---------------- */
assert(/const saved = appConfig\.homeCarouselPreferences;/.test(appSource), "abrirEditorCarrosselHome le appConfig.homeCarouselPreferences");
assert(/saved && Array\.isArray\(saved\.visibleCardIds\) && saved\.visibleCardIds\.length >= editorApi\.MIN_CARDS \? saved : defaults/.test(appSource), "abrirEditorCarrosselHome restaura estado salvo ou defaults");
assert(/appConfig\.homeCarouselPreferences = estado;/.test(appSource), "persistirEditorCarrosselHome grava as preferencias");
assert(/salvarDados\(\);/.test(appSource) && /salvarJsonLocalSeMudou\("appConfig", appConfig\)/.test(appSource), "salvarDados persiste appConfig");
assert(/salvarJsonLocalSeMudou\("appConfig", data\.appConfig|data: \{[\s\S]*?appConfig,/.test(appSource), "snapshot do escopo tambem leva appConfig");
assert(/editorCarrosselHomeAlterado = true;/.test(appSource) && /mostrarToast\("Alteracoes do carrossel salvas\."|mostrarToast\("Alterações do carrossel salvas\."/.test(appSource), "fechar avisa que houve salvamento");
assert(/getPreferences: \(\) => appConfig\.homeCarouselPreferences/.test(appSource), "mountHomeCarousel passa getPreferences");
assert(/isEditorOpen: \(\) => editorCarrosselHomeAberto/.test(appSource), "mountHomeCarousel passa isEditorOpen");
assert(/options\.getPreferences\?\.\(\)/.test(mountSource), "mount le as preferencias salvas");
assert(/if \(disposed \|\| fallback \|\| editorOpen\) return;/.test(mountSource), "mount nao cobre o editor com a cena");

/* ---------------- Engrenagem, organizador e versao ---------------- */
assert(/class="home-carousel-edit-gear"[^>]*onclick="abrirEditorCarrosselHome\(\)"/.test(renderersSource), "engrenagem abre o editor");
assert(/\.home-carousel-edit-gear\s*\{/.test(cssSource), "engrenagem posicionada no canto");
assert(/\.home-carousel-3d-screen\s*\{[^}]*position:\s*relative/.test(cssSource), "palco do carrossel e o contexto da engrenagem");
assert(/carousel-organizer-modal/.test(appSource) && /createView\(root, editor, registry, persistirEditorCarrosselHome/.test(appSource), "editor usa a view do PanelOrganizer");
assert(!/mover para cima|mover para baixo|arrow-up|arrow-down/i.test(viewCode), "sem lista com setas cima/baixo");
assert(!/Salvar alterações|salvar alteracoes/i.test(viewCode), "sem botao de salvar (salvamento imediato)");
assert(/carousel-editor-view\.js\?v=home-carousel-editor-organizer-3/.test(indexSource), "cache-bust da view");
assert(/\?v=home-carousel-editor-organizer-2"/.test(indexSource) && /carousel-editor-styles\.css\?v=home-carousel-editor-organizer-2/.test(indexSource), "cache-bust dos estilos");
assert(/\?v=home-integration-8-editor-open/.test(indexSource), "cache-bust do mount");
assert(/\?v=app-js-finalization-owner-7/.test(indexSource), "cache-bust dos renderers");
assert(/style\.css\?v=home-carousel-editor-organizer-3/.test(indexSource), "cache-bust do style.css");
assert(/\/app\.js\?v=1\.0\.41-carousel-organizer/.test(indexSource), "cache-bust do app.js");

console.log("Home carousel editor persistence: fechar/reabrir mantem a config salva e o wiring de persistencia esta integro.");
