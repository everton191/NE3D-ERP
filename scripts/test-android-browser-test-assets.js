"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const builder = require("./build-android-browser-test-assets.js");
const root = path.resolve(__dirname, "..");

(async () => {
  const shim = builder.browserAssert();
  assert.throws(() => shim.equal(false, true));
  assert.throws(() => shim.deepEqual({ value: 1 }, { value: "1" }));
  assert.throws(() => shim.deepEqual([1], { 0: 1 }));
  assert.throws(() => shim.deepEqual(new Date(0), new Date(1)));
  assert.throws(() => builder.write(root), /OUTSIDE_VALIDATION_BUILD/);
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ["src/features/cash/cash-renderer.js", "scripts/fixtures/android-back-navigation-cases.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  }
  const generated = builder.sources();
  vm.runInContext(generated.imagePresets, sandbox, { filename: "canonical-image-presets.js" });
  assert.deepEqual(Object.keys(sandbox.ANDROID_IMAGE_PERSONALIZATION_PRESETS).sort(),
    ["brand-logo", "company-logo", "login-background", "pdf-background", "profile-photo"]);
  assert.equal(sandbox.ANDROID_IMAGE_PERSONALIZATION_PRESETS["profile-photo"].width, 512);
  assert.equal(sandbox.ANDROID_IMAGE_PERSONALIZATION_PRESETS["login-background"].mode, "cover");
  new vm.Script(generated.pdfDependencies, { filename: "canonical-pdf-dependencies.js" });
  vm.runInContext(generated.compiler, sandbox, { filename: "canonical-navigation.js" });
  vm.runInContext(generated.behavior, sandbox, { filename: "android-browser-behavior.js" });
  const result = JSON.parse(JSON.stringify(await sandbox.runAndroidBehaviorContracts()));
  assert.deepEqual(result.navigation, { passed: 16, total: 16, failures: [] });
  assert.equal(result.cash.passed, true);
  assert(result.cash.assertions > 40, "cash assertions must not disappear during adaptation");
  assert.equal(result.navigatorMode, "synthetic-context");
  assert.equal(result.shareAndClipboardMode, "injected-fakes");
  assert.equal(sandbox.localStorage, undefined);
  console.log(`ANDROID BROWSER ADAPTER: 16 canonical navigation cases and ${result.cash.assertions} existing cash assertions PASS in VM; no device claim.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
