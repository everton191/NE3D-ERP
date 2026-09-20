"use strict";

const { execFileSync } = require("node:child_process");

const PACKAGE = "br.com.ne3d.erp";
const ADB = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const adb = (...args) => execFileSync(ADB, args, { encoding: "utf8" }).trim();

async function evaluate(socketUrl, expression, timeoutMs = 15000) {
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
  const localSocket = `webview_devtools_remote_${pid}`;
  adb("forward", "tcp:9224", `localabstract:${localSocket}`);
  const targets = await fetch("http://127.0.0.1:9224/json").then((response) => response.json());
  const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!target) throw new Error("WEBVIEW_NOT_FOUND");
  const result = await evaluate(target.webSocketDebuggerUrl, `(async () => {
    const superadmin = getSuperAdminPrincipal();
    if (!superadmin?.email) return { ok:false, reason:"SUPERADMIN_NOT_FOUND" };
    usuarioAtualEmail = superadmin.email;
    adminLogado = true;
    window.__simplificaLocalLockActive = false;
    sessionStorage.setItem("usuarioAtualEmail", superadmin.email);
    sessionStorage.setItem("adminLogado", "sim");
    sessionStorage.setItem("simplificaSuperadminAuthenticated", "true");
    setModoErpSuperadmin(false);
    window.__superAdminTab = "clientes";
    telaAtual = "superadmin";
    renderApp();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const root = document.querySelector(".superadmin-platform-shell");
    const actions = document.querySelector(".superadmin-company-actions");
    const buttons = [...document.querySelectorAll(".superadmin-company-actions .btn")].map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { text: element.textContent.trim(), directChild:element.parentElement === actions, left: rect.left, right: rect.right, width: rect.width, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, height: rect.height, minHeight:style.minHeight, padding:style.padding, whiteSpace:style.whiteSpace };
    });
    const more = document.querySelector(".client-admin-row .superadmin-action-menu-trigger");
    const moreRect = more?.getBoundingClientRect();
    const matchedButtonRules = [];
    const sampleButton = actions?.querySelector(".btn");
    const walkRules = (rules, condition = "") => {
      for (const rule of [...rules || []]) {
        if (rule.selectorText && sampleButton?.matches(rule.selectorText) && (rule.style?.minHeight || rule.style?.height || rule.style?.padding)) {
          matchedButtonRules.push({ selector:rule.selectorText, minHeight:rule.style.minHeight || "", height:rule.style.height || "", padding:rule.style.padding || "", condition });
        }
        if (rule.cssRules) walkRules(rule.cssRules, rule.conditionText || condition);
        if (rule.styleSheet?.cssRules) walkRules(rule.styleSheet.cssRules, condition);
      }
    };
    for (const sheet of [...document.styleSheets]) { try { walkRules(sheet.cssRules); } catch (_) {} }
    return {
      ok:true, screen:telaAtual, superadmin:isSuperAdmin(), viewport:{ width:innerWidth, height:innerHeight },
      bodyClass:document.body.className,
      actionsClass:actions?.className || "",
      actionsAncestors:actions ? [...actions.parentElement?.parentElement?.classList || []] : [],
      ui3SuperadminAncestor:actions?.closest(".ui3-superadmin")?.className || "",
      documentOverflow:document.documentElement.scrollWidth > document.documentElement.clientWidth,
      rootOverflow:root ? root.scrollWidth > root.clientWidth : null,
      mobileMedia:matchMedia("(max-width:767px)").matches,
      stylesheets:[...document.styleSheets].map((sheet) => sheet.href).filter(Boolean),
      actionsStyle:actions ? { gridTemplateColumns:getComputedStyle(actions).gridTemplateColumns, width:actions.getBoundingClientRect().width } : null,
      buttons, matchedButtonRules:matchedButtonRules.slice(-20), more:more ? { text:more.textContent.trim(), aria:more.getAttribute("aria-label"), left:moreRect.left, right:moreRect.right, width:moreRect.width } : null
    };
  })()`);
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
