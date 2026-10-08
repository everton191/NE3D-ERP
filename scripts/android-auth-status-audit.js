"use strict";

const { execFileSync } = require("node:child_process");

const PACKAGE = "br.com.ne3d.erp";
const PORT = "9228";
const ADB = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const adb = (...args) => execFileSync(ADB, args, { encoding: "utf8" }).trim();

async function evaluate(socketUrl, expression, timeoutMs = 30000) {
  const socket = new WebSocket(socketUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP_CONNECT_TIMEOUT")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once:true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP_CONNECT_FAILED")); }, { once:true });
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
    socket.send(JSON.stringify({ id:1, method:"Runtime.evaluate", params:{ expression, awaitPromise:true, returnByValue:true } }));
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
      const backup = {
        email:usuarioAtualEmail,
        admin:adminLogado,
        screen:telaAtual,
        theme:appConfig.theme,
        bootstrap:document.documentElement.dataset.simplificaBootstrap,
        visual:window.__simplificaSessionCheckVisualState
      };
      const reports = [];
      try {
        usuarioAtualEmail = "";
        adminLogado = false;
        telaAtual = "home";
        document.documentElement.dataset.simplificaBootstrap = "restoring";
        window.__simplificaSessionCheckVisualState = { title:"Verificando acesso", message:"Preparando seus dados...", progress:60, step:3 };
        for (const theme of ["light", "dark"]) {
          appConfig.theme = theme;
          aplicarPersonalizacao();
          renderApp();
          await new Promise((resolve) => setTimeout(resolve, 120));
          const page = document.querySelector(".auth-page.auth-session-check");
          const card = page?.querySelector(".auth-card");
          const dock = page?.querySelector(".auth-session-dock");
          const form = page?.querySelector(".auth-tab-panel");
          const cardRect = card?.getBoundingClientRect();
          const dockRect = dock?.getBoundingClientRect();
          const dockStyle = dock ? getComputedStyle(dock) : null;
          const isStatic = dockStyle?.position === "static";
          const noOverlap = !!cardRect && !!dockRect && (isStatic ? dockRect.top >= cardRect.bottom - 1 : dockRect.bottom <= innerHeight + 1 && dockRect.top >= cardRect.bottom + 4);
          reports.push({
            theme,
            page:!!page,
            card:!!card,
            dock:!!dock,
            form:!!form,
            dockAfterCard:!!dock && !!card && card.compareDocumentPosition(dock) === Node.DOCUMENT_POSITION_FOLLOWING,
            position:dockStyle?.position || "",
            pointerEvents:dockStyle?.pointerEvents || "",
            noOverlap,
            insideViewport:!!dockRect && dockRect.left >= -1 && dockRect.right <= innerWidth + 1 && dockRect.top >= -1 && dockRect.bottom <= innerHeight + 1,
            progress:dock?.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow") || "",
            viewport:{ width:innerWidth, height:innerHeight }
          });
        }
      } finally {
        usuarioAtualEmail = backup.email;
        adminLogado = backup.admin;
        telaAtual = backup.screen;
        appConfig.theme = backup.theme;
        if (backup.bootstrap === undefined) delete document.documentElement.dataset.simplificaBootstrap;
        else document.documentElement.dataset.simplificaBootstrap = backup.bootstrap;
        if (backup.visual === undefined) delete window.__simplificaSessionCheckVisualState;
        else window.__simplificaSessionCheckVisualState = backup.visual;
        aplicarPersonalizacao();
        renderApp();
      }
      const required = ["page", "card", "dock", "form", "dockAfterCard", "noOverlap", "insideViewport"];
      const failures = reports.flatMap((report) => {
        const issues = required.filter((key) => !report[key]);
        if (report.pointerEvents !== "none") issues.push("pointer-events");
        if (report.progress !== "60") issues.push("progress");
        return issues.length ? [{ theme:report.theme, issues, report }] : [];
      });
      const resources = performance.getEntriesByType("resource").map((entry) => entry.name);
      const currentAssets = {
        css:resources.some((name) => name.includes("/style.css?v=auth-status-dock-20261008")),
        bootstrap:resources.some((name) => name.includes("/src/app/bootstrap.js?v=auth-status-dock-20261008")),
        app:resources.some((name) => name.includes("/app.js?v=1.0.41-auth-status-dock-20261008"))
      };
      if (!Object.values(currentAssets).every(Boolean)) failures.push({ theme:"assets", issues:["stale-assets"], currentAssets });
      return { ok:failures.length === 0, reports, currentAssets, failures };
    })()`);
    console.log(JSON.stringify(result, null, 2));
    if (!result?.ok) process.exitCode = 1;
  } finally {
    try { adb("forward", "--remove", `tcp:${PORT}`); } catch (_) {}
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
