"use strict";

// Build-only adapter: use canonical functions and the existing assertions, not
// another implementation of navigation, sharing or clipboard behavior.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const navigationNames = [
  "getParentScreenForBack", "isDashboardRoute", "navegarVoltarSeguroInterno",
  "voltarTela", "fecharDetalhesPedido", "handleAndroidBackPress"
];

function browserAssert() {
  let assertions = 0;
  const fail = (message) => { throw new Error(message || "Assertion failed"); };
  function same(actual, expected) {
    if (Object.is(actual, expected)) return true;
    if (!actual || !expected || typeof actual !== "object" || typeof expected !== "object") return false;
    if (Array.isArray(actual) !== Array.isArray(expected)) return false;
    if (Object.getPrototypeOf(actual) !== Object.getPrototypeOf(expected)) return false;
    if (![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(actual))) {
      throw new Error("Browser assertion supports only plain fixture objects/arrays");
    }
    const left = Object.keys(actual).sort();
    const right = Object.keys(expected).sort();
    return left.length === right.length && left.every((key, index) => key === right[index] && same(actual[key], expected[key]));
  }
  return {
    equal(actual, expected, message) { assertions++; if (!Object.is(actual, expected)) fail(message); },
    notEqual(actual, expected, message) { assertions++; if (Object.is(actual, expected)) fail(message); },
    deepEqual(actual, expected, message) { assertions++; if (!same(actual, expected)) fail(message); },
    ok(value, message) { assertions++; if (!value) fail(message); },
    match(value, expression, message) { assertions++; if (!expression.test(value)) fail(message); },
    get count() { return assertions; }
  };
}

function sources() {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const canonical = navigationNames.map((name) => {
    const match = app.match(new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m"));
    if (!match) throw new Error(`CANONICAL_NAVIGATION_MISSING: ${name}`);
    return match[0];
  }).join("\n\n");
  const dependencies = app.match(/^function getPdfDocumentDeliveryDeps\([^\n]*\) \{[\s\S]*?^\}/m)?.[0];
  if (!dependencies) throw new Error("CANONICAL_PDF_DEPENDENCIES_MISSING");
  const presets = app.match(/^const IMAGE_PERSONALIZATION_PRESETS = Object\.freeze\((\{[\s\S]*?^\})\);/m)?.[1];
  if (!presets) throw new Error("CANONICAL_IMAGE_PRESETS_MISSING");
  const imagePresets = `globalThis.ANDROID_IMAGE_PERSONALIZATION_PRESETS = Object.freeze(${presets});\n`;
  const cashTest = fs.readFileSync(path.join(root, "scripts/test-cash-renderer.js"), "utf8");
  const requires = [
    'const assert = require("node:assert/strict");',
    'const renderer = require("../src/features/cash/cash-renderer.js");'
  ];
  const tail = "testStatementShareRecovery().then(() => {";
  if (cashTest.indexOf(tail) !== cashTest.lastIndexOf(tail) || cashTest.indexOf(tail) < 0) throw new Error("CASH_TEST_ADAPTER_TAIL_CHANGED");
  let body = cashTest.slice(0, cashTest.indexOf(tail));
  for (const declaration of requires) {
    if (body.indexOf(declaration) < 0 || body.indexOf(declaration) !== body.lastIndexOf(declaration)) throw new Error("CASH_TEST_ADAPTER_IMPORT_CHANGED");
    body = body.replace(declaration, "");
  }
  if (/\brequire\s*\(|\bprocess\.|\b(?:globalThis|window|document|navigator|localStorage|sessionStorage|indexedDB)\s*\./.test(body)) {
    throw new Error("CASH_TEST_ADAPTER_UNREVIEWED_GLOBAL_ACCESS");
  }
  const methods = Array.from(body.matchAll(/\bassert\.([A-Za-z]+)/g), (match) => match[1]);
  if (!methods.length || methods.some((method) => !["equal", "notEqual", "deepEqual", "ok", "match"].includes(method))) {
    throw new Error("CASH_TEST_ADAPTER_ASSERTION_CHANGED");
  }
  const compiler = `globalThis.compileCanonicalBack = function(context) {
    return Object.assign(context, Function("context", ${JSON.stringify(`with (context) {\n${canonical}\nreturn { ${navigationNames.join(", ")} };\n}`)})(context));
  };\n`;
  const behavior = `(() => {
    const makeAssert = ${browserAssert.toString()};
    async function runCash(assert, renderer) {
      ${body}
      await testStatementShareRecovery();
      return { passed: true, assertions: assert.count };
    }
    globalThis.runAndroidBehaviorContracts = async function() {
      const navigation = await globalThis.SimplificaAndroidBackCases.run({
        assert: makeAssert(), compile: globalThis.compileCanonicalBack
      });
      const cash = await runCash(makeAssert(), globalThis.SimplificaCashRenderer);
      return { navigation, cash, navigatorMode: "synthetic-context", shareAndClipboardMode: "injected-fakes" };
    };
  })();\n`;
  const pdfDependencies = `(() => {
    const factory = Function("context", ${JSON.stringify(`with (context) {\n${dependencies}\nreturn getPdfDocumentDeliveryDeps();\n}`)});
    globalThis.createCanonicalPdfDepsForValidation = function(hooks = {}) {
      const host = globalThis.window;
      const noop = () => {};
      const context = factory({
        appConfig: {}, window: host, document: host.document, navigator: host.navigator,
        alert: host.alert, btoa: host.btoa, confirm: host.confirm,
        setTimeout: host.setTimeout, clearTimeout: host.clearTimeout,
        File: host.File, Uint8Array: host.Uint8Array, URL: host.URL,
        temAcessoPdfProfissional: () => true, isAndroid: () => true, isAndroidNativeApp: () => true,
        limitarCorPdf: (value) => value,
        registrarDiagnostico: hooks.logDiagnostic || noop,
        registrarHistorico: hooks.logHistory || noop
      });
      // Do not open alert/confirm dialogs or write commercial history in a test.
      // Encoding/timer bindings above are the exact canonical factory, not mocks.
      context.alertRef = hooks.alertRef || noop;
      context.confirmRef = () => false;
      return context;
    };
  })();\n`;
  return { compiler, behavior, pdfDependencies, imagePresets };
}

function write(output) {
  const destination = path.resolve(output);
  const allowed = path.join(root, "android", "bridge-validation", "build") + path.sep;
  if (!destination.startsWith(allowed)) throw new Error("TEST_ASSET_TARGET_OUTSIDE_VALIDATION_BUILD");
  const generated = sources();
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, "canonical-navigation.js"), generated.compiler);
  fs.writeFileSync(path.join(destination, "android-browser-behavior.js"), generated.behavior);
  fs.writeFileSync(path.join(destination, "canonical-pdf-dependencies.js"), generated.pdfDependencies);
  fs.writeFileSync(path.join(destination, "canonical-image-presets.js"), generated.imagePresets);
  console.log("Canonical navigation/PDF dependencies and existing cash assertions adapted for isolated Android WebView.");
}

if (require.main === module) {
  if (!process.argv[2]) throw new Error("VALIDATION_ASSET_OUTPUT_REQUIRED");
  write(process.argv[2]);
}
module.exports = { browserAssert, sources, write };
