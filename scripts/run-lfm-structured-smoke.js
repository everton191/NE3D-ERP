"use strict";

const { execFileSync } = require("node:child_process");

const PACKAGE = "br.com.ne3d.erp";
const adbPath = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const cases = [
  ["abre estoque", ["navigation.open"]],
  ["qnt tem de pla preto", ["inventory.get_stock", "inventory.search"]],
  ["faz pedido pra Maria", ["orders.create", "orders.get", "orders.list"]],
  ["120g por 2h30", ["calculator.calculate", "calculator.create_order"]],
  ["manda esse pedido no zap", ["documents.share_order", "documents.order_pdf"]]
];

const adb = (...args) => execFileSync(adbPath, args, { encoding: "utf8" }).trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function targetForApp() {
  const pid = adb("shell", "pidof", PACKAGE).split(/\s+/)[0];
  if (!/^\d+$/.test(pid)) throw new Error("LFM_APP_NOT_RUNNING");
  adb("forward", "tcp:9223", `localabstract:webview_devtools_remote_${pid}`);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json()).catch(() => []);
    const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (target) return target.webSocketDebuggerUrl;
    await sleep(250);
  }
  throw new Error("LFM_WEBVIEW_NOT_FOUND");
}

async function evaluate(url, expression) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("CDP_CONNECT_FAILED")), { once: true });
  });
  const value = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP_EVALUATION_TIMEOUT")), 90000);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      clearTimeout(timer);
      if (message.result?.exceptionDetails) reject(new Error(message.result.exceptionDetails.exception?.description || message.result.exceptionDetails.text));
      else resolve(message.result?.result?.value);
    });
    socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
  });
  socket.close();
  return value;
}

(async () => {
  const url = await targetForApp();
  const results = [];
  for (const [input, ids] of cases) {
    const expression = `(async () => {
      await window.SimplificaAiRuntimeLoader.ensureAiRuntimeLoaded();
      const ids = ${JSON.stringify(ids)};
      const candidates = ids.map((id) => window.SimplificaIntentRegistry.get(id)).filter(Boolean);
      const provider = new window.SimplificaLfmIntent.LfmIntentProvider();
      return provider.interpretIntent({ input: ${JSON.stringify(input)}, candidateIntents: candidates, useGrammar: true });
    })()`;
    const result = await evaluate(url, expression);
    const pass = !result.errorCode && result.grammarApplied === true && result.chatMessages === 2 && result.writeExposed === 0;
    results.push({ input, pass, intentId: result.intentId, grammarApplied: result.grammarApplied, chatMessages: result.chatMessages, writeExposed: result.writeExposed, errorCode: result.errorCode || "" });
    console.log(`${pass ? "PASS" : "FAIL"}: ${input} -> ${result.intentId || "NO_MATCH"}`);
  }
  const passed = results.filter((item) => item.pass).length;
  console.log(JSON.stringify({ passed, total: results.length, writeExposed: Math.max(...results.map((item) => item.writeExposed)), results }, null, 2));
  if (passed !== results.length) process.exitCode = 1;
})().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
