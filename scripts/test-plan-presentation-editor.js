"use strict";

// Executes the actual editor, commands and persistence functions with a minimal
// event-capable DOM and an isolated in-memory network boundary. Not a browser,
// real Supabase authorization check or physical-device certification.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const clone = (value) => JSON.parse(JSON.stringify(value));

function extractFunction(name) {
  const match = new RegExp(`(?:^|\\n)((?:async )?function ${name}\\()`).exec(app);
  assert.ok(match, `actual function missing: ${name}`);
  const start = match.index + (app[match.index] === "\n" ? 1 : 0);
  const next = /\r?\n(?:async )?function \w+\(/g;
  next.lastIndex = start;
  const end = next.exec(app);
  assert.ok(end, `following declaration missing: ${name}`);
  return app.slice(start, end.index);
}

class EventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, handler, options = {}) {
    const list = this.listeners.get(type) || [];
    list.push({ handler, once: options.once === true });
    this.listeners.set(type, list);
  }
  removeEventListener(type, handler) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter((entry) => entry.handler !== handler));
  }
  dispatch(type, extra = {}) {
    const event = { target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...extra };
    for (const entry of [...(this.listeners.get(type) || [])]) {
      if (entry.once) this.removeEventListener(type, entry.handler);
      entry.handler(event);
    }
  }
  listenerCount() { return [...this.listeners.values()].reduce((sum, entries) => sum + entries.length, 0); }
}

const decode = (text) => String(text).replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function createDom(hasPopup) {
  const nodes = new Map();
  const events = new EventTarget();
  class Element extends EventTarget {
    constructor(tag = "div", attrs = "", content = "") {
      super();
      this.tagName = tag.toUpperCase();
      this.attrs = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
      this.id = this.attrs.id || "";
      this.value = tag === "textarea" ? decode(content) : (this.attrs.value || "");
      this.required = /\brequired\b/.test(attrs);
      this.style = {};
      this.dataset = {};
      this.disabled = false;
      this._html = content;
    }
    get innerHTML() { return this._html; }
    set innerHTML(html) {
      this._html = String(html);
      if (this !== popup) return;
      for (const id of nodes.keys()) if (id !== "popup") nodes.delete(id);
      for (const match of this._html.matchAll(/<(form|input|textarea|button)\b([^>]*?)>/g)) {
        const content = match[1] === "textarea" ? this._html.slice(match.index + match[0].length).split("</textarea>")[0] : "";
        const element = new Element(match[1], match[2], content);
        if (element.id) nodes.set(element.id, element);
      }
    }
    querySelector(selector) {
      if (selector === ".modal-backdrop") return backdrop;
      if (selector.startsWith("#")) return nodes.get(selector.slice(1)) || null;
      return null;
    }
    querySelectorAll() { return [...nodes.values()].filter((node) => ["INPUT", "TEXTAREA"].includes(node.tagName)); }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key] ?? null; }
    checkValidity() { return this.querySelectorAll().every((node) => !node.required || node.value !== ""); }
    reportValidity() { return this.checkValidity(); }
    focus() {}
    remove() { if (this.id) nodes.delete(this.id); }
  }
  const popup = new Element();
  popup.id = "popup";
  const backdrop = new Element();
  if (hasPopup) nodes.set("popup", popup);
  return {
    popup, backdrop, events,
    document: {
      getElementById: (id) => nodes.get(id) || null,
      querySelector: (selector) => selector.startsWith("#") ? nodes.get(selector.slice(1)) || null : null,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events)
    }
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture(options = {}) {
  const dom = createDom(options.hasPopup !== false);
  const remote = {
    free: { name: "Grátis", headline: "Organização", description: "Descrição Free", features: ["Básico"], badge: "", ctaLabel: "Começar", priceLabel: "R$ 0" },
    start: { name: 'Start "Especial" <demo>', headline: "Vitrine", description: "Descrição Start", features: ["Primeiro", "Segundo"], badge: "SELO", ctaLabel: "Escolher Start", priceLabel: "R$ 29,90" },
    pro: { name: "Pro", headline: "Completo", description: "Descrição Pro", features: ["Avançado"], badge: "PRO", ctaLabel: "Escolher Pro", priceLabel: "R$ 59,90" }
  };
  const original = clone(remote);
  const originalCache = JSON.stringify(original);
  const storage = new Map([["simplificaPlanPresentationRemoteCache", originalCache]]);
  const calls = [], toasts = [], audits = [], diagnostics = [];
  const behavior = {};
  let superadmin = options.authorized !== false;
  let onOverlayClose = null;
  const noop = () => {};
  const context = {
    document: dom.document, window: {}, console,
    setTimeout: (callback) => { callback(); return 1; }, clearTimeout: noop,
    addEventListener: dom.events.addEventListener.bind(dom.events),
    removeEventListener: dom.events.removeEventListener.bind(dom.events),
    syncConfig: { supabaseUrl: "https://example.invalid", supabaseAccessToken: "synthetic-session", supabaseUserId: "fixture-admin" },
    isSuperAdmin: () => superadmin,
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) },
    sessionStorage: { removeItem: noop },
    prompt: () => { throw new Error("Native prompt must not be used by the plan editors"); },
    mostrarToast: (message, type) => { toasts.push({ message, type }); return { remove: noop }; },
    renderApp: noop, getSaasAdminDeps: () => ({}),
    registrarAuditoria: (...args) => audits.push(args), registrarDiagnostico: (...args) => diagnostics.push(args),
    getClientIdAtual: () => "", getPlanoSaas: (slug) => ({ slug, price: slug === "free" ? 0 : 99, active: true }),
    formatarMoeda: (price) => `R$ ${price}`,
    closeModal: noop, closeDrawer: noop, hideOverlay: noop,
    promoverPopupParaDialogUiV3: (popup, config) => { onOverlayClose = config.onClose; return popup; },
    usuarioAtualEmail: "admin@example.invalid", accountSecurityState: {}, adminLogado: false,
    localLockModalOpen: false, scopedDataCacheReady: true,
    LOCAL_SESSION_CACHE_KEY: "session-cache", ACTIVE_DATA_SCOPE_KEY: "data-scope",
    getEscopoDadosAtual: () => "", salvarCacheDadosUsuario: noop, pararRealtimeSyncUsuario: noop,
    desconectarRelayNotificacoesAndroid: async () => {}, limparSessaoSensivelSupabase: noop,
    limparDadosOperacionaisLocais: noop, limparCacheTemporarioContaAnterior: noop,
    registrarSeguranca: noop, salvarDados: noop,
    requisicaoSupabase: async (url, request = {}) => {
      calls.push({ url, method: request.method || "GET", body: request.body ? JSON.parse(request.body) : undefined });
      if (request.method === "POST") {
        if (behavior.postGate) await behavior.postGate.promise;
        if (behavior.postError) throw new Error("gravação recusada");
        const { p_slug, p_changes } = JSON.parse(request.body);
        remote[p_slug] = { ...remote[p_slug], ...clone(p_changes) };
        if (behavior.malformed) return { slug: p_slug };
        return { slug: p_slug, presentation: clone(remote[p_slug]), updated_at: "2026-10-16T12:00:00Z" };
      }
      if (behavior.readGate) await behavior.readGate.promise;
      if (behavior.readError) throw new Error("leitura indisponível");
      return Object.entries(remote).map(([slug, presentation]) => ({ slug, metadata: {
        presentation: behavior.stale && slug === "start" ? clone(original.start) : clone(presentation)
      } }));
    }
  };
  context.window = {
    addEventListener: context.addEventListener, removeEventListener: context.removeEventListener,
    SimplificaSaasAdmin: { carregarCatalogoPlanosSuperadminRemoto: async () => ({}) },
    UiV3: { closeOverlay: () => { const callback = onOverlayClose; onOverlayClose = null; callback?.(); } }
  };
  vm.createContext(context);
  vm.runInContext("let planPresentationRemoteOverrides = null; let planPresentationRemoteState = { status: 'idle', message: '' }; let planPresentationEditorOpen = false; let planPresentationEditorCancel = null;", context);
  const names = ["escaparHtml", "escaparAttr", "podeSalvarAdminSupabaseRemoto", "getPlanPresentationDefaults", "getPlanPresentationOverrides", "carregarApresentacaoPlanosRemota", "salvarApresentacaoPlanoSuperadmin", "getPlanPresentationData", "solicitarCamposPlanoSuperadmin", "editarPlanoApresentacaoSuperadmin", "editarPrecoExibidoPlanoSuperadmin", "fecharPopup", "logoutUsuario"];
  vm.runInContext(names.map(extractFunction).join("\n"), context);
  const run = (code) => vm.runInContext(code, context);
  const input = (key) => {
    const node = dom.document.getElementById(`planPresentationEditor-${key}`);
    assert.ok(node, `editor field missing: ${key}`);
    return node;
  };
  const submit = () => {
    const form = dom.document.getElementById("planPresentationEditorForm");
    assert.ok(form, "controlled editor form must be present");
    form.dispatch("submit");
    return form;
  };
  return {
    context, run, dom, remote, original, behavior, storage, originalCache, calls, toasts, audits, diagnostics, input, submit,
    authorize: (value) => { superadmin = value; },
    closeOverlay: () => context.window.UiV3.closeOverlay(),
    hasSuccess: () => toasts.some((toast) => toast.type === "sucesso"),
    postCalls: () => calls.filter((call) => call.method === "POST"),
    assertReleased: () => {
      assert.equal(run("planPresentationEditorOpen"), false, "editor lock must be released");
      assert.equal(run("planPresentationEditorCancel"), null, "cancel hook must be released");
      assert.equal(dom.events.listenerCount(), 0, "temporary keyboard/history listeners must be removed");
    }
  };
}

async function flush() { for (let i = 0; i < 12; i += 1) await Promise.resolve(); }

async function run() {
  for (const method of ["editarPlanoApresentacaoSuperadmin", "editarPrecoExibidoPlanoSuperadmin"]) {
    for (const action of ["cancel", "cancel-top", "backdrop", "Escape", "popstate", "close-popup", "overlay-close", "logout"]) {
      const f = fixture();
      const pending = f.context[method]("start");
      assert.ok(f.dom.popup.innerHTML.includes("planPresentationEditorForm"));
      if (action === "cancel" || action === "cancel-top") {
        const id = action === "cancel" ? "planPresentationEditorCancel" : "planPresentationEditorCancelTop";
        f.dom.document.getElementById(id).dispatch("click");
      } else if (action === "backdrop") f.dom.backdrop.dispatch("click");
      else if (action === "Escape") f.dom.events.dispatch("keydown", { key: "Escape" });
      else if (action === "popstate") f.dom.events.dispatch("popstate");
      else if (action === "close-popup") f.context.fecharPopup();
      else if (action === "overlay-close") f.closeOverlay();
      else f.context.logoutUsuario();
      await pending;
      assert.equal(f.calls.length, 0, `${method}/${action} must not send a request`);
      assert.equal(f.hasSuccess(), false);
      assert.equal(f.storage.get("simplificaPlanPresentationRemoteCache"), f.originalCache);
      f.assertReleased();
    }
  }

  for (const options of [{ authorized: false }, { hasPopup: false }]) {
    for (const method of ["editarPlanoApresentacaoSuperadmin", "editarPrecoExibidoPlanoSuperadmin"]) {
      const f = fixture(options);
      await f.context[method]("start");
      assert.equal(f.calls.length, 0, "no authority/host must never save defaults silently");
      assert.equal(f.hasSuccess(), false);
      f.assertReleased();
    }
  }
  {
    const f = fixture();
    f.context.syncConfig.supabaseAccessToken = "";
    await f.context.editarPlanoApresentacaoSuperadmin("start");
    assert.equal(f.calls.length, 0, "missing authenticated session must prevent editing");
    f.assertReleased();
  }
  {
    const f = fixture();
    const pending = f.context.editarPlanoApresentacaoSuperadmin("start");
    assert.equal(f.input("name").value, f.original.start.name, "escaped attribute must preserve its actual text");
    assert.ok(f.dom.popup.innerHTML.includes("&quot;Especial&quot; &lt;demo&gt;"));
    assert.equal(f.input("features").tagName, "TEXTAREA", "benefits require a multiline control");
    assert.equal(f.input("description").tagName, "TEXTAREA", "commercial description must preserve multiline text");
    assert.equal(f.input("features").value, "Primeiro\nSegundo");
    f.input("name").value = "  Start atualizado  ";
    f.input("features").value = " Primeiro \r\n\r\n Segundo\n <benefício> ";
    const readGate = deferred();
    f.behavior.readGate = readGate;
    const form = f.submit();
    form.dispatch("submit"); // Programmatic repeated submission must also be idempotent locally.
    await flush();
    await f.context.editarPrecoExibidoPlanoSuperadmin("pro");
    await f.context.editarPlanoApresentacaoSuperadmin("free");
    assert.equal(f.postCalls().length, 1, "double-submit and concurrent editors must issue one POST");
    assert.equal(f.hasSuccess(), false, "POST acknowledgment alone is not confirmed success");
    assert.equal(f.storage.get("simplificaPlanPresentationRemoteCache"), f.originalCache);
    readGate.resolve();
    await pending;
    const changes = f.postCalls()[0].body.p_changes;
    assert.equal(changes.name, "Start atualizado");
    assert.deepEqual(changes.features, ["Primeiro", "Segundo", "<benefício>"]);
    assert.deepEqual(Object.keys(changes).sort(), ["badge", "ctaLabel", "description", "features", "headline", "name"].sort());
    assert.equal(f.remote.start.priceLabel, f.original.start.priceLabel, "text editing cannot alter displayed price");
    assert.equal(f.hasSuccess(), true);
    assert.equal(f.audits.length, 1);
    assert.equal(JSON.parse(f.storage.get("simplificaPlanPresentationRemoteCache")).start.name, "Start atualizado");
    assert.ok(f.calls.every((call) => call.url.includes("/rpc/superadmin_update_plan_presentation") || call.url.startsWith("/rest/v1/plans?")), "no billing/subscription/gateway route may be touched");
    f.assertReleased();
  }
  {
    const f = fixture();
    const pending = f.context.editarPrecoExibidoPlanoSuperadmin("pro");
    f.input("priceLabel").value = "  R$ 79,90 informativo  ";
    f.submit();
    await pending;
    assert.deepEqual(f.postCalls()[0].body, { p_slug: "pro", p_changes: { priceLabel: "R$ 79,90 informativo" } });
    assert.equal(f.hasSuccess(), true);
    f.assertReleased();
  }
  {
    const f = fixture();
    const pending = f.context.editarPlanoApresentacaoSuperadmin("start");
    f.input("features").value = Array.from({ length: 16 }, (_, i) => `Benefício ${i}`).join("\n");
    f.submit();
    await pending;
    assert.equal(f.postCalls()[0].body.p_changes.features.length, 16, "the existing 16-benefit boundary remains allowed");
    assert.equal(f.hasSuccess(), true);
    f.assertReleased();
  }
  for (const [key, value] of [["name", "   "], ["headline", ""], ["description", "   "], ["features", "x".repeat(181)], ["features", Array.from({ length: 17 }, (_, i) => `Benefício ${i}`).join("\n")]]) {
    const f = fixture();
    const pending = f.context.editarPlanoApresentacaoSuperadmin("start");
    f.input(key).value = value;
    f.submit();
    await flush();
    assert.equal(f.calls.length, 0, `invalid ${key} must not be sent`);
    f.context.fecharPopup();
    await pending;
    assert.equal(f.hasSuccess(), false);
    f.assertReleased();
  }
  for (const method of ["editarPlanoApresentacaoSuperadmin", "editarPrecoExibidoPlanoSuperadmin"]) {
    const f = fixture();
    const pending = f.context[method]("start");
    f.authorize(false);
    f.submit();
    await pending;
    assert.equal(f.calls.length, 0, "authorization lost while editor was open must stop the save");
    assert.equal(f.hasSuccess(), false);
    f.assertReleased();
  }
  for (const failure of ["postError", "malformed", "readError", "stale"]) {
    const f = fixture();
    f.behavior[failure] = true;
    const pending = f.context.editarPlanoApresentacaoSuperadmin("start");
    f.input("headline").value = "Nova oferta";
    f.submit();
    await pending;
    assert.equal(f.hasSuccess(), false, `${failure} must not claim success`);
    assert.equal(f.storage.get("simplificaPlanPresentationRemoteCache"), f.originalCache, `${failure} must retain confirmed cache`);
    assert.equal(f.audits.length, 0, `${failure} must not record successful frontend audit`);
    assert.ok(f.toasts.some((toast) => toast.type === "erro"));
    f.assertReleased();
  }
  console.log("PASS plan editor: controlled multiline/escaping, cancellation, authority/session, duplicate commands, confirmed persistence, price isolation and failure handling.");
  console.log("Network and DOM are isolated test boundaries; real authenticated API, browser and Android validation remain separate gates.");
}

const watchdog = setTimeout(() => {
  console.error("FAIL: editor promise did not settle (cancel/submit listener regression).");
  process.exitCode = 1;
}, 5000);
run().then(() => clearTimeout(watchdog), (error) => {
  clearTimeout(watchdog);
  console.error(error);
  process.exitCode = 1;
});
