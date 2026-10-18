"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const cases = require("./fixtures/android-back-navigation-cases.js");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const functions = [
  "getParentScreenForBack", "isDashboardRoute", "navegarVoltarSeguroInterno",
  "voltarTela", "fecharDetalhesPedido", "handleAndroidBackPress"
].map((name) => {
  const match = source.match(new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m"));
  assert(match, `Canonical function must exist: ${name}`);
  return match[0];
}).join("\n\n");

cases.run({
  assert,
  compile(context) {
    vm.createContext(context);
    vm.runInContext(functions, context);
  }
}).then(({ passed, total, failures }) => {
  for (const { name, message } of failures) console.error(`FAIL: ${name}: ${message}`);
  console.log(`ANDROID BACK NAVIGATION: ${passed}/${total} PASS; canonical functions, synthetic data, no network.`);
  if (failures.length) process.exitCode = 1;
}).catch((error) => { console.error(error); process.exitCode = 1; });
