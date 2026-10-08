"use strict";

const { execFileSync } = require("node:child_process");

const PACKAGE = "br.com.ne3d.erp";
const PORT = "9227";
const VERBOSE = process.argv.includes("--verbose");
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
      const screens = ["config", "personalizacao", "preferencias", "empresa", "pdf", "conta", "seguranca", "administracao"];
      const screenSelectors = { personalizacao:"aparencia" };
      const sessionBackup = { usuarioAtualEmail, adminLogado, telaAtual, theme: appConfig.theme, companySetupCompleted:appConfig.companySetupCompleted };
      const usuario = normalizarUsuario({ id:"settings-ui-audit", nome:"Auditoria visual", email:"settings-audit@local.invalid", papel:"admin", ativo:true, onboardingCompleted:true, onboardingStep:ONBOARDING_LAST_STEP });
      usuarios.push(usuario);
      usuarioAtualEmail = usuario.email;
      adminLogado = true;
      const userEmail = normalizarEmail(usuario.email || "");
      const getMutableUser = () => usuarios.find((item) => normalizarEmail(item.email || "") === userEmail) || getUsuarioAtual();
      const auditVisibleArea = (scope, label) => {
        const scopeRect = scope?.getBoundingClientRect();
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        };
        const buttons = [...(scope?.querySelectorAll("button,.btn,.app-button") || [])].filter(visible).map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            text:(element.textContent || element.getAttribute("aria-label") || "").replace(/\\s+/g," ").trim().slice(0,80),
            className:String(element.className || "").slice(0,120),
            width:Math.round(rect.width * 10) / 10,
            height:Math.round(rect.height * 10) / 10,
            textOverflow:element.scrollWidth > element.clientWidth + 1,
            outsideViewport:rect.left < -1 || rect.right > innerWidth + 1,
            color:style.color,
            background:style.backgroundColor
          };
        });
        const offenders = [...(scope?.querySelectorAll("*") || [])].filter(visible).filter((element) => {
          const rect = element.getBoundingClientRect();
          const outsideViewport = rect.left < -2 || rect.right > innerWidth + 2;
          const canExposeLayoutOverflow = !element.matches("input,select,textarea,option") && element.children.length > 0;
          return outsideViewport || (canExposeLayoutOverflow && element.scrollWidth > element.clientWidth + 2);
        }).slice(0,20).map((element) => ({ tag:element.tagName, className:String(element.className || "").slice(0,100), text:(element.textContent || "").replace(/\\s+/g," ").trim().slice(0,90), clientWidth:element.clientWidth, scrollWidth:element.scrollWidth }));
        return {
          label,
          width:scopeRect ? Math.round(scopeRect.width * 10) / 10 : 0,
          internalOverflow:!!scope && scope.scrollWidth > scope.clientWidth + 2,
          outsideViewport:!!scopeRect && (scopeRect.left < -1 || scopeRect.right > innerWidth + 1),
          buttonCount:buttons.length,
          shortButtons:buttons.filter((item) => item.height < 40),
          wideButtons:buttons.filter((item) => item.outsideViewport || item.textOverflow),
          offenders
        };
      };
      const reports = [];
      try {
        appConfig.companySetupCompleted = true;
        for (const theme of ["light", "dark"]) {
          appConfig.theme = theme;
          aplicarPersonalizacao();
          for (const screen of screens) {
            const mutableUser = getMutableUser();
            mutableUser.papel = "admin";
            mutableUser.superadminMaintenance = false;
            mutableUser.maintenanceSuperadminEmail = "";
            mutableUser.onboardingCompleted = true;
            telaAtual = screen;
            renderApp();
            await new Promise((resolve) => setTimeout(resolve, 300));
            const panel = document.querySelector('[data-ui3-screen="' + (screenSelectors[screen] || screen) + '"]');
            const actionButton = panel?.querySelector(".actions .btn,.ui3-action-row .btn,.settings-section-save .btn");
            const report = {
              theme,
              screen,
              main:auditVisibleArea(panel, panel ? "main" : "missing-screen"),
              sections:[],
              diagnostic:{
                bodyClass:document.body.className,
                renderedScreen:document.querySelector("[data-ui3-screen]")?.getAttribute("data-ui3-screen") || "",
                actionButton:actionButton ? {
                  text:(actionButton.textContent || "").replace(/\\s+/g," ").trim(),
                  height:getComputedStyle(actionButton).height,
                  minHeight:getComputedStyle(actionButton).minHeight,
                  fontSize:getComputedStyle(actionButton).fontSize,
                  parentClass:String(actionButton.parentElement?.className || ""),
                  matchesSettingsRule:actionButton.matches('body.mobile-mode :is([data-ui-version="v3"].ui3-settings-screen,[data-ui-version="v3"].ui3-administration,.ui-section.ui-subscreen-active) :is(.actions,.ui3-action-row,.security-card-actions,.security-page-actions,.settings-section-save) > :is(button,.btn,label.btn,.app-button)')
                } : null
              }
            };
            const sections = [...(panel?.querySelectorAll("details.ui-section") || [])];
            for (const section of sections) {
              abrirSubmenuConfiguracao({ preventDefault(){}, stopPropagation(){} }, section);
              await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
              report.sections.push(auditVisibleArea(section, section.dataset.uiSection || "section"));
              fecharSubmenuConfiguracao(section, true);
            }
            reports.push(report);
          }
        }
      } finally {
        usuarios = usuarios.filter((item) => normalizarEmail(item.email || "") !== userEmail);
        usuarioAtualEmail = sessionBackup.usuarioAtualEmail;
        adminLogado = sessionBackup.adminLogado;
        appConfig.theme = sessionBackup.theme;
        appConfig.companySetupCompleted = sessionBackup.companySetupCompleted;
        telaAtual = sessionBackup.telaAtual;
        aplicarPersonalizacao();
        renderApp();
      }
      const failures = reports.flatMap((report) => [report.main, ...report.sections].flatMap((area) => {
        const issues = [];
        if (area.label === "missing-screen" || !area.width) issues.push("missing-screen");
        if (area.internalOverflow || area.outsideViewport) issues.push("overflow");
        if (area.shortButtons.length) issues.push("short-buttons");
        if (area.wideButtons.length) issues.push("button-overflow");
        if (area.offenders.length) issues.push("element-overflow");
        return issues.length ? [{ theme:report.theme, screen:report.screen, area:area.label, issues, shortButtons:area.shortButtons, wideButtons:area.wideButtons, offenders:area.offenders }] : [];
      }));
      const settingsCssResource = performance.getEntriesByType("resource").map((entry) => entry.name).find((name) => name.includes("/styles/ui-v3/screens/settings.css")) || "";
      const settingsCssText = settingsCssResource ? await fetch(settingsCssResource).then((response) => response.text()).catch(() => "") : "";
      return {
        ok:failures.length === 0,
        viewport:{ width:innerWidth, height:innerHeight },
        reportCount:reports.length,
        failures,
        reports,
        cssContract:{ resource:settingsCssResource, hasSettingsActionRule:settingsCssText.includes("min-height: 42px !important") }
      };
    })()`);
    const output = VERBOSE ? result : {
      ok: result?.ok,
      viewport: result?.viewport,
      reportCount: result?.reportCount,
      cssContract: result?.cssContract,
      failureCount: result?.failures?.length || 0,
      failures: (result?.failures || []).map((failure) => ({
        theme: failure.theme,
        screen: failure.screen,
        area: failure.area,
        issues: failure.issues,
        shortButtonCount: failure.shortButtons.length,
        wideButtonCount: failure.wideButtons.length,
        offenderCount: failure.offenders.length,
        samples: [
          ...failure.shortButtons.slice(0, 2).map((item) => `botao baixo: ${item.text} (${item.height}px)`),
          ...failure.wideButtons.slice(0, 2).map((item) => `botao largo: ${item.text}`),
          ...failure.offenders.slice(0, 2).map((item) => `elemento: ${item.tag}.${item.className}`)
        ].slice(0, 4),
        diagnostic: result.reports.find((report) => report.theme === failure.theme && report.screen === failure.screen)?.diagnostic || null
      }))
    };
    console.log(JSON.stringify(output, null, 2));
    if (!result?.ok) process.exitCode = 1;
  } finally {
    try { adb("forward", "--remove", `tcp:${PORT}`); } catch (_) {}
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
