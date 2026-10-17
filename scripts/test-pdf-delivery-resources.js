"use strict";

const assert = require("node:assert/strict");
const delivery = require("../src/features/company/pdf-document-delivery.js");

function createFixture(faults = {}) {
  const state = { timers: new Map(), created: [], revoked: [], removed: [], history: [], diagnostics: [], alerts: [], clicks: 0, prints: 0 };
  let timerId = 0;
  const throwAt = (stage) => { if (faults[stage]) throw faults[stage]; };
  const frame = {
    style: {},
    contentWindow: {
      focus() { throwAt("focus"); },
      print() { throwAt("print"); state.prints += 1; }
    },
    remove() { state.removed.push("iframe"); throwAt("remove"); },
    set src(value) { throwAt("src"); this.url = value; }
  };
  const link = {
    click() { throwAt("click"); state.clicks += 1; },
    remove() { state.removed.push("a"); throwAt("remove"); }
  };
  const context = {
    windowRef: { print() {} },
    documentRef: {
      createElement(tag) { throwAt("createElement"); return tag === "iframe" ? frame : link; },
      body: { appendChild() { throwAt("appendChild"); } }
    },
    urlRef: {
      createObjectURL() { throwAt("createObjectURL"); const url = "blob:synthetic-pdf"; state.created.push(url); return url; },
      revokeObjectURL(url) { state.revoked.push(url); throwAt("revokeObjectURL"); }
    },
    setTimeoutRef(fn, delay) { const id = ++timerId; state.timers.set(id, { fn, delay }); return id; },
    clearTimeoutRef(id) { state.timers.delete(id); },
    logHistory(...entry) { state.history.push(entry); },
    logDiagnostic(...entry) { state.diagnostics.push(entry); },
    alertRef(message) { state.alerts.push(message); },
    isAndroid: () => false,
    navigatorRef: {},
    Uint8ArrayRef: Uint8Array,
    btoaRef: (value) => Buffer.from(value, "binary").toString("base64")
  };
  const doc = {
    output(type) { return type === "arraybuffer" ? Uint8Array.from([37, 80, 68, 70]).buffer : { syntheticPdf: true }; },
    save(name) { throwAt("save"); state.savedName = name; }
  };
  function fire(delay) {
    const entry = [...state.timers].find(([, timer]) => timer.delay === delay);
    assert.ok(entry, `timer de ${delay} ms ausente`);
    state.timers.delete(entry[0]);
    entry[1].fn();
  }
  return { state, context, doc, frame, fire };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("impressão mantém carregamento, impressão e descarte após 60 segundos", async () => {
  const f = createFixture();
  const pending = delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context);
  assert.deepEqual([...f.state.timers.values()].map((timer) => timer.delay), [8000]);
  f.frame.onload();
  assert.equal(await pending, true);
  assert.equal(f.state.prints, 1);
  assert.equal(f.state.history.length, 1);
  assert.deepEqual(f.state.revoked, []);
  assert.deepEqual([...f.state.timers.values()].map((timer) => timer.delay), [60000]);
  f.fire(60000);
  assert.equal(f.state.timers.size, 0);
  assert.deepEqual(f.state.revoked, f.state.created);
  assert.deepEqual(f.state.removed, ["iframe"]);
});

for (const stage of ["createElement", "appendChild", "src"]) {
  test(`impressão limpa recursos e preserva erro de ${stage}`, async () => {
    const error = new Error(`synthetic-${stage}`);
    const f = createFixture({ [stage]: error });
    await assert.rejects(delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context), (actual) => actual === error);
    assert.equal(f.state.timers.size, 0, "falha não pode deixar temporizador de carga pendente");
    assert.deepEqual(f.state.revoked, f.state.created, "URL deve ser revogada mesmo se o DOM falhar");
    assert.deepEqual(f.state.removed, stage === "createElement" ? [] : ["iframe"]);
    assert.equal(f.state.history.length, 0);
  });
}

test("timeout de impressão rejeita e limpa recursos", async () => {
  const f = createFixture();
  const pending = delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context);
  const rejected = assert.rejects(pending, /Tempo esgotado/);
  f.fire(8000);
  await rejected;
  assert.equal(f.state.timers.size, 0);
  assert.deepEqual(f.state.revoked, f.state.created);
  assert.deepEqual(f.state.removed, ["iframe"]);
});

test("erro de carregamento da impressão limpa temporizador e URL", async () => {
  const f = createFixture();
  const pending = delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context);
  const rejected = assert.rejects(pending, /Não foi possível preparar o documento/);
  f.frame.onerror();
  await rejected;
  assert.equal(f.state.timers.size, 0);
  assert.deepEqual(f.state.revoked, f.state.created);
});

for (const stage of ["focus", "print"]) {
  test(`falha em ${stage} não deixa iframe, URL ou timer`, async () => {
    const error = new Error(`synthetic-${stage}`);
    const f = createFixture({ [stage]: error });
    const pending = delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context);
    f.frame.onload();
    await assert.rejects(pending, (actual) => actual === error);
    assert.equal(f.state.timers.size, 0);
    assert.deepEqual(f.state.revoked, f.state.created);
    assert.deepEqual(f.state.removed, ["iframe"]);
    assert.equal(f.state.history.length, 0);
  });
}

test("falhas de descarte não substituem erro original da impressão", async () => {
  const error = new Error("synthetic-append");
  const f = createFixture({ appendChild: error, remove: new Error("synthetic-remove"), revokeObjectURL: new Error("synthetic-revoke") });
  await assert.rejects(delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context), (actual) => actual === error);
  assert.equal(f.state.timers.size, 0);
  assert.deepEqual(f.state.revoked, f.state.created);
});

test("impressão não suportada não aloca recursos", async () => {
  const f = createFixture();
  f.context.windowRef.print = null;
  assert.equal(await delivery.printPdfBrowser(f.doc, "pedido.pdf", "Pedido", f.context), false);
  assert.equal(f.state.created.length, 0);
  assert.equal(f.state.timers.size, 0);
});

test("salvamento normal mantém nome e não cria fallback", async () => {
  const f = createFixture();
  assert.equal(await delivery.saveOrSharePdf(f.doc, "Pedido 1.pdf", "Pedido", f.context), true);
  assert.equal(f.state.savedName, "pedido-1.pdf");
  assert.equal(f.state.created.length, 0);
});

test("download alternativo remove âncora e mantém URL por 60 segundos", async () => {
  const f = createFixture({ save: new Error("synthetic-save") });
  assert.equal(await delivery.saveOrSharePdf(f.doc, "pedido.pdf", "Pedido", f.context), true);
  assert.equal(f.state.clicks, 1);
  assert.deepEqual(f.state.removed, ["a"]);
  assert.deepEqual(f.state.revoked, []);
  f.fire(60000);
  assert.deepEqual(f.state.revoked, f.state.created);
});

for (const stage of ["createElement", "appendChild", "click"]) {
  test(`download alternativo libera URL/âncora na falha ${stage}`, async () => {
    const f = createFixture({ save: new Error("synthetic-save"), [stage]: new Error(`synthetic-${stage}`) });
    assert.equal(await delivery.saveOrSharePdf(f.doc, "pedido.pdf", "Pedido", f.context), false);
    assert.equal(f.state.timers.size, 0);
    assert.deepEqual(f.state.revoked, f.state.created);
    assert.deepEqual(f.state.removed, stage === "createElement" ? [] : ["a"]);
    assert.equal(f.state.alerts.length, 1);
    assert.equal(f.state.diagnostics[0][2], `synthetic-${stage}`);
  });
}

test("descarte do download não mascara erro do clique", async () => {
  const f = createFixture({ save: new Error("synthetic-save"), click: new Error("synthetic-click"), remove: new Error("synthetic-remove"), revokeObjectURL: new Error("synthetic-revoke") });
  assert.equal(await delivery.saveOrSharePdf(f.doc, "pedido.pdf", "Pedido", f.context), false);
  assert.deepEqual(f.state.revoked, f.state.created);
  assert.equal(f.state.diagnostics[0][2], "synthetic-click");
});

test("permissão Android negada não chama salvamento nem registra sucesso nativo", async () => {
  const f = createFixture();
  let saveCalls = 0;
  f.context.windowRef.Capacitor = { Plugins: { SimplificaFiles: {
    requestStoragePermission: async () => ({ granted: false }),
    savePdf: async () => { saveCalls += 1; return { ok: true }; }
  } } };
  assert.equal(await delivery.savePdfAndroidNative(f.doc, "pedido.pdf", f.context), false);
  assert.equal(saveCalls, 0);
  assert.equal(f.state.history.length, 0);
  assert.equal(f.state.alerts.length, 1);
});

test("salvamento Android autorizado preserva conteúdo PDF e confirmação nativa", async () => {
  const f = createFixture();
  let received;
  f.context.windowRef.Capacitor = { Plugins: { SimplificaFiles: {
    requestStoragePermission: async () => ({ granted: true, scoped: true }),
    savePdf: async (args) => { received = args; return { ok: true }; }
  } } };
  assert.equal(await delivery.savePdfAndroidNative(f.doc, "pedido.pdf", f.context), true);
  assert.equal(Buffer.from(received.base64, "base64").toString(), "%PDF");
  assert.equal(received.fileName, "pedido.pdf");
  assert.equal(f.state.history.length, 1);
});

async function main() {
  const failures = [];
  for (const { name, run } of tests) {
    try { await run(); }
    catch (error) { failures.push(name); console.error(`FAIL: ${name}\n${error.stack}`); }
  }
  if (failures.length) {
    process.exitCode = 1;
    console.error(`PDF DELIVERY RESOURCES: ${tests.length - failures.length}/${tests.length} PASS.`);
  } else {
    console.log(`PDF DELIVERY RESOURCES: ${tests.length} cenários PASS; DOM, relógio e plugin sintéticos, sem rede/dispositivo.`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
