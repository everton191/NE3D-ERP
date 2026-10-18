"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const delivery = require("../src/features/company/pdf-document-delivery.js");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const factory = app.match(/^function getPdfDocumentDeliveryDeps\(\) \{[\s\S]*?^\}/m);
assert.ok(factory, "fábrica canônica das dependências PDF deve existir");

function fixture() {
  const state = { calls: [], alerts: [], confirms: [], saved: [], printed: [], history: [], diagnostics: [], timers: new Map(), revoked: [], removed: [], clicks: 0 };
  let timerId = 0;
  const windowRef = { print() {} };
  const browserMethod = (name, run) => function (...args) {
    if (this !== windowRef) throw new TypeError(`Illegal invocation: ${name} requires Window receiver`);
    state.calls.push(name);
    return run(...args);
  };
  windowRef.alert = browserMethod("alert", (message) => state.alerts.push(message));
  windowRef.btoa = browserMethod("btoa", (binary) => Buffer.from(binary, "binary").toString("base64"));
  windowRef.confirm = browserMethod("confirm", (message) => { state.confirms.push(message); return false; });
  windowRef.setTimeout = browserMethod("setTimeout", (run, delay) => { const id = ++timerId; state.timers.set(id, { run, delay }); return id; });
  windowRef.clearTimeout = browserMethod("clearTimeout", (id) => state.timers.delete(id));
  const plugin = {
    async requestStoragePermission() { return { granted: true }; },
    async savePdf(payload) { state.saved.push(payload); return { ok: true }; },
    async printPdf(payload) { state.printed.push(payload); return { ok: true }; }
  };
  windowRef.Capacitor = { Plugins: { SimplificaFiles: plugin } };
  const frame = {
    style: {},
    contentWindow: { focus() {}, print() { state.browserPrinted = true; } },
    remove() { state.removed.push("iframe"); }
  };
  const link = { click() { state.clicks += 1; }, remove() { state.removed.push("a"); } };
  const documentRef = { body: { appendChild() {} }, createElement: (tag) => tag === "iframe" ? frame : link };
  const globals = {
    window: windowRef,
    alert: windowRef.alert,
    btoa: windowRef.btoa,
    clearTimeout: windowRef.clearTimeout,
    confirm: windowRef.confirm,
    setTimeout: windowRef.setTimeout,
    appConfig: {},
    document: documentRef,
    navigator: {},
    Uint8Array,
    URL: { createObjectURL: () => "blob:pdf-browser-bindings", revokeObjectURL: (url) => state.revoked.push(url) },
    temAcessoPdfProfissional: () => true,
    isAndroid: () => true,
    isAndroidNativeApp: () => true,
    limitarCorPdf: (value) => value,
    registrarDiagnostico: (...args) => state.diagnostics.push(args),
    registrarHistorico: (...args) => state.history.push(args)
  };
  const context = vm.runInNewContext(`${factory[0]}\ngetPdfDocumentDeliveryDeps();`, globals, { filename: "app.js:getPdfDocumentDeliveryDeps" });
  const bytes = Uint8Array.from([37, 80, 68, 70, 0, 255]);
  const doc = { output: (type) => type === "arraybuffer" ? bytes.buffer : { syntheticPdf: true } };
  const fire = (delay) => {
    const entry = [...state.timers].find(([, timer]) => timer.delay === delay);
    assert.ok(entry, `temporizador de ${delay} ms deve existir`);
    state.timers.delete(entry[0]);
    entry[1].run();
  };
  return { state, windowRef, globals, context, plugin, frame, doc, fire, expectedBase64: Buffer.from(bytes).toString("base64") };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

for (const name of ["alert", "btoa", "confirm", "setTimeout", "clearTimeout"]) {
  test(`${name} mantém o receptor Window ao ser chamado pela dependência PDF`, () => {
    const f = fixture();
    const args = name === "setTimeout" ? [() => {}, 1] : name === "clearTimeout" ? [1] : ["synthetic"];
    const callback = f.context[`${name}Ref`];
    callback.call(f.context, ...args);
    callback(...args);
    assert.deepEqual(f.state.calls, [name, name]);
    assert.equal(f.context.windowRef, f.windowRef);
    assert.equal(f.context.documentRef, f.globals.document);
  });
}

test("salvar PDF nativo alcança a Bridge com Base64 correto e confirma sucesso", async () => {
  const f = fixture();
  assert.equal(await delivery.savePdfAndroidNative(f.doc, "synthetic.pdf", f.context), true);
  assert.deepEqual(f.state.saved, [{ fileName: "synthetic.pdf", base64: f.expectedBase64 }]);
  assert.equal(f.state.alerts.length, 1);
  assert.equal(f.state.history.length, 1);
  assert.equal(f.state.diagnostics.length, 0);
});

test("impressão nativa alcança a Bridge com Base64 e título corretos", async () => {
  const f = fixture();
  assert.equal(await delivery.printPdfAndroidNative(f.doc, "synthetic.pdf", "Synthetic", f.context), true);
  assert.deepEqual(f.state.printed, [{ fileName: "synthetic.pdf", base64: f.expectedBase64, title: "Synthetic", jobName: "Synthetic" }]);
  assert.equal(f.state.history.length, 1);
});

test("permissão negada alerta sem salvar PDF", async () => {
  const f = fixture();
  f.plugin.requestStoragePermission = async () => ({ granted: false });
  assert.equal(await delivery.savePdfAndroidNative(f.doc, "synthetic.pdf", f.context), false);
  assert.equal(f.state.alerts.length, 1);
  assert.equal(f.state.saved.length, 0);
});

test("fallback de impressão respeita a confirmação negada sem baixar", async () => {
  const f = fixture();
  f.context.isAndroidNativeApp = () => false;
  f.windowRef.print = undefined;
  assert.equal(await delivery.printOrOfferPdf(f.doc, "synthetic.pdf", "Synthetic", f.context), false);
  assert.equal(f.state.confirms.length, 1);
  assert.equal(f.state.saved.length, 0);
});

test("impressão no navegador usa temporizadores vinculados e limpa recursos", async () => {
  const f = fixture();
  const printing = delivery.printPdfBrowser(f.doc, "synthetic.pdf", "Synthetic", f.context);
  const completed = assert.doesNotReject(printing);
  if (typeof f.frame.onload === "function") f.frame.onload();
  await completed;
  assert.equal(await printing, true);
  assert.equal(f.state.browserPrinted, true);
  f.fire(60000);
  assert.equal(f.state.timers.size, 0);
  assert.deepEqual(f.state.revoked, ["blob:pdf-browser-bindings"]);
  assert.deepEqual(f.state.removed, ["iframe"]);
});

test("download de fallback agenda revogação com receptor Window", async () => {
  const f = fixture();
  f.context.isAndroid = () => false;
  f.doc.save = () => { throw new Error("synthetic-save-failure"); };
  assert.equal(await delivery.saveOrSharePdf(f.doc, "synthetic.pdf", "Synthetic", f.context), true);
  assert.equal(f.state.clicks, 1);
  f.fire(60000);
  assert.deepEqual(f.state.revoked, ["blob:pdf-browser-bindings"]);
  assert.equal(f.state.timers.size, 0);
});

(async () => {
  let failures = 0;
  for (const { name, run } of tests) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures += 1; console.error(`FAIL: ${name}\n${error.stack || error}`); }
  }
  console.log(`PDF browser bindings: ${tests.length - failures}/${tests.length} PASS`);
  if (failures) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
