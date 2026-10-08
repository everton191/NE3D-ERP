"use strict";

const { execFileSync } = require("node:child_process");

const PACKAGE = "br.com.ne3d.erp";
const PORT = "9229";
const expectAiDisabled = process.argv.includes("--expect-ai=disabled");
const expectAiEnabled = process.argv.includes("--expect-ai=enabled");
const ADB = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const adb = (...args) => execFileSync(ADB, args, { encoding: "utf8" }).trim();

async function evaluate(socketUrl, expression, timeoutMs = 30000) {
  const socket = new WebSocket(socketUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP_CONNECT_TIMEOUT")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP_CONNECT_FAILED")); }, { once: true });
  });
  const value = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP_EVALUATE_TIMEOUT")), timeoutMs);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      clearTimeout(timer);
      if (message.result?.exceptionDetails) reject(new Error(message.result.exceptionDetails.text || "CDP_EVALUATE_FAILED"));
      else resolve(message.result?.result?.value);
    });
    socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
  });
  socket.close();
  return value;
}

(async () => {
  const pid = adb("shell", "pidof", PACKAGE).split(/\s+/)[0];
  if (!/^\d+$/.test(pid)) throw new Error("APP_NOT_RUNNING");
  adb("forward", `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`);
  try {
    const targets = await fetch(`http://127.0.0.1:${PORT}/json`).then((response) => response.json());
    const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (!target) throw new Error("WEBVIEW_NOT_FOUND");
    const result = await evaluate(target.webSocketDebuggerUrl, `(async () => {
      const capacitor = globalThis.Capacitor;
      let pdfBytes = 0;
      let qrNodes = 0;
      if (globalThis.jspdf?.jsPDF) {
        const document = new globalThis.jspdf.jsPDF();
        document.text("Simplifica 3D", 10, 10);
        pdfBytes = document.output("arraybuffer").byteLength;
      }
      if (typeof globalThis.qrcode === "function") {
        const qr = globalThis.qrcode(0, "M");
        qr.addData("simplifica3d-runtime-smoke");
        qr.make();
        qrNodes = qr.createSvgTag(2, 4).includes("<svg") ? 1 : 0;
      }
      return {
        platform: capacitor?.getPlatform?.() || "",
        nativePlatform: capacitor?.isNativePlatform?.() === true,
        appPlugin: capacitor?.isPluginAvailable?.("App") === true,
        admobPlugin: capacitor?.isPluginAvailable?.("AdMob") === true,
        localAiPlugin: capacitor?.isPluginAvailable?.("SimplificaLocalAi") === true,
        localAiSupportedByApp: globalThis.getPlatformAdapter?.().supportsLocalAI === true,
        aiShortcutCount: document.querySelectorAll("[data-ai-assistant-shortcut]").length,
        viewportReady: innerWidth > 0 && innerHeight > 0,
        pdfBytes,
        qrNodes
      };
    })()`);
    console.log(JSON.stringify(result, null, 2));
    const failures = [];
    if (result?.platform !== "android") failures.push("platform");
    if (!result?.nativePlatform) failures.push("nativePlatform");
    if (!result?.appPlugin) failures.push("App plugin");
    if (!result?.admobPlugin) failures.push("AdMob plugin");
    if (expectAiEnabled && !result?.localAiPlugin) failures.push("local AI plugin missing");
    if (expectAiEnabled && !result?.localAiSupportedByApp) failures.push("local AI hidden from app");
    if (expectAiDisabled && result?.localAiPlugin) failures.push("local AI plugin enabled");
    if (expectAiDisabled && result?.localAiSupportedByApp) failures.push("local AI exposed by app");
    if (expectAiDisabled && result?.aiShortcutCount !== 0) failures.push("AI shortcut visible");
    if (!result?.viewportReady) failures.push("viewport");
    if (!(result?.pdfBytes > 500)) failures.push("PDF");
    if (!(result?.qrNodes > 0)) failures.push("QR Code");
    if (failures.length) throw new Error(`ANDROID_RUNTIME_SMOKE_FAILED: ${failures.join(", ")}`);
  } finally {
    try { adb("forward", "--remove", `tcp:${PORT}`); } catch (_) {}
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
