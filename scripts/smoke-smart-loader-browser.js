const fs = require("fs");

const port = Number(process.argv[2] || 9333);

async function getTarget() {
  const response = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await response.json();
  return targets.find((target) => target.type === "page");
}

async function main() {
  const target = await getTarget();
  if (!target?.webSocketDebuggerUrl) throw new Error("Chrome remoto não encontrado.");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let sequence = 0;
  const pending = new Map();
  const consoleMessages = [];
  const runtimeErrors = [];

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
      return;
    }
    if (payload.method === "Runtime.consoleAPICalled") {
      consoleMessages.push(payload.params);
    }
    if (payload.method === "Runtime.exceptionThrown") {
      runtimeErrors.push(payload.params);
    }
  });

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  function send(method, params = {}) {
    sequence += 1;
    return new Promise((resolve, reject) => {
      pending.set(sequence, { resolve, reject });
      socket.send(JSON.stringify({ id: sequence, method, params }));
    });
  }

  async function evaluate(expression, awaitPromise = false) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Falha ao avaliar página.");
    return result.result?.value;
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await new Promise((resolve) => setTimeout(resolve, 900));

  const initial = await evaluate(`({
    title: document.title,
    smartLoaderVersion: window.SmartLoader?.version || "",
    layerExists: !!document.getElementById("smart-loader-layer"),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    viewport: [window.innerWidth, window.innerHeight]
  })`);

  await evaluate(`window.__smokeOperation = SmartLoader.start({
    name: "browser-smoke",
    title: "Salvando pedido",
    message: "Validando dados...",
    steps: ["Validando dados", "Salvando pedido", "Finalizando"],
    progress: 25
  })`);
  await new Promise((resolve) => setTimeout(resolve, 1150));
  const active = await evaluate(`({
    panels: document.querySelectorAll(".smart-loader-panel").length,
    text: document.querySelector(".smart-loader-panel")?.innerText || "",
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  })`);

  await evaluate(`SmartLoader.update(window.__smokeOperation, { stepIndex: 1, progress: 70, message: "Salvando pedido..." })`);
  const updated = await evaluate(`({
    progress: document.querySelector(".smart-loader-progress")?.getAttribute("aria-valuenow") || "",
    text: document.querySelector(".smart-loader-panel")?.innerText || ""
  })`);
  const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.mkdirSync("artifacts", { recursive: true });
  fs.writeFileSync("artifacts/perceived-performance-smart-loader-mobile.png", Buffer.from(capture.data, "base64"));
  await evaluate(`SmartLoader.success(window.__smokeOperation, "Pedido salvo")`);
  await new Promise((resolve) => setTimeout(resolve, 80));
  const finished = await evaluate(`({
    panels: document.querySelectorAll(".smart-loader-panel").length,
    active: SmartLoader.getActiveOperations().length
  })`);

  socket.close();

  const report = { initial, active, updated, finished, consoleMessages: consoleMessages.length, runtimeErrors: runtimeErrors.length };
  if (!initial.layerExists || initial.smartLoaderVersion !== "smart-loader-1") throw new Error(`SmartLoader ausente: ${JSON.stringify(report)}`);
  if (initial.horizontalOverflow || active.horizontalOverflow) throw new Error(`Overflow horizontal: ${JSON.stringify(report)}`);
  if (active.panels !== 1 || !active.text.includes("Salvando pedido")) throw new Error(`Painel contextual inválido: ${JSON.stringify(report)}`);
  if (updated.progress !== "70" || !updated.text.includes("Salvando pedido")) throw new Error(`Atualização contextual inválida: ${JSON.stringify(report)}`);
  if (finished.panels !== 0 || finished.active !== 0) throw new Error(`Operação não finalizou: ${JSON.stringify(report)}`);
  if (runtimeErrors.length) throw new Error(`Erros de runtime: ${JSON.stringify(report)}`);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
