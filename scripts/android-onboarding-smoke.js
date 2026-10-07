"use strict";

const { execFileSync } = require("node:child_process");

const PACKAGE = "br.com.ne3d.erp";
const PORT = "9226";
const ADB = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const adb = (...args) => execFileSync(ADB, args, { encoding: "utf8" }).trim();

async function evaluate(socketUrl, expression, timeoutMs = 20000) {
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
      const sessionBackup = { usuarioAtualEmail, adminLogado };
      let syntheticUserAdded = false;
      let usuario = getUsuarioAtual();
      if (!usuario) {
        usuario = normalizarUsuario({
          id: "onboarding-android-smoke",
          nome: "Teste de apresentação",
          email: "onboarding-smoke@local.invalid",
          papel: "admin",
          ativo: true,
          onboardingCompleted: false,
          onboardingStep: 0
        });
        usuarios.push(usuario);
        usuarioAtualEmail = usuario.email;
        adminLogado = true;
        syntheticUserAdded = true;
      }
      const userEmail = normalizarEmail(usuario.email || "");
      const getMutableUser = () => usuarios.find((item) => normalizarEmail(item.email || "") === userEmail) || getUsuarioAtual();
      const backup = {
        screen: telaAtual,
        step: usuario.onboardingStep,
        completed: usuario.onboardingCompleted,
        companySetupCompleted: appConfig.companySetupCompleted,
        papel: usuario.papel,
        superadminMaintenance: usuario.superadminMaintenance,
        maintenanceSuperadminEmail: usuario.maintenanceSuperadminEmail
      };
      const expectedTitles = [
        "Conheça o Simplifica 3D",
        "Deixe a calculadora mais próxima da sua rotina",
        "Forme preços com mais segurança",
        "Sua operação começa aqui",
        "Acompanhe cada venda do início ao fim",
        "Transforme pedidos em uma fila de trabalho",
        "Saiba o que você tem antes de produzir",
        "Mantenha as movimentações sob controle",
        "Agora você já conhece o fluxo do Simplifica 3D"
      ];
      const steps = [];
      try {
        let mutableUser = getMutableUser();
        mutableUser.papel = "admin";
        mutableUser.superadminMaintenance = false;
        mutableUser.maintenanceSuperadminEmail = "";
        mutableUser.onboardingCompleted = false;
        appConfig.companySetupCompleted = false;
        telaAtual = "onboarding";
        for (let step = 0; step < ONBOARDING_TOTAL_STEPS; step += 1) {
          mutableUser = getMutableUser();
          mutableUser.papel = "admin";
          mutableUser.superadminMaintenance = false;
          mutableUser.maintenanceSuperadminEmail = "";
          mutableUser.onboardingCompleted = false;
          mutableUser.onboardingStep = step;
          renderApp();
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const card = document.querySelector(".onboarding-presentation");
          const body = document.querySelector(".onboarding-presentation-body");
          const title = body?.querySelector("h2")?.textContent?.trim() || "";
          const rect = card?.getBoundingClientRect();
          steps.push({
            step,
            title,
            expectedTitle: expectedTitles[step],
            titleMatches: title === expectedTitles[step],
            indicator: document.querySelector(".onboarding-progress p")?.textContent?.replace(/\s+/g, " ").trim() || "",
            buttons: body?.querySelectorAll("button").length || 0,
            width: rect?.width || 0,
            withinViewport: !!rect && rect.left >= -1 && rect.right <= innerWidth + 1,
            internalOverflow: !!card && card.scrollWidth > card.clientWidth + 1
          });
        }
      } finally {
        const mutableUser = getMutableUser();
        if (!syntheticUserAdded) {
          mutableUser.onboardingStep = backup.step;
          mutableUser.onboardingCompleted = backup.completed;
          mutableUser.papel = backup.papel;
          mutableUser.superadminMaintenance = backup.superadminMaintenance;
          mutableUser.maintenanceSuperadminEmail = backup.maintenanceSuperadminEmail;
        } else {
          usuarios = usuarios.filter((item) => normalizarEmail(item.email || "") !== userEmail);
          usuarioAtualEmail = sessionBackup.usuarioAtualEmail;
          adminLogado = sessionBackup.adminLogado;
        }
        appConfig.companySetupCompleted = backup.companySetupCompleted;
        telaAtual = backup.screen;
        renderApp();
      }
      const restoredUser = syntheticUserAdded ? null : getMutableUser();
      const restored = syntheticUserAdded
        ? !usuarios.some((item) => normalizarEmail(item.email || "") === userEmail) && usuarioAtualEmail === sessionBackup.usuarioAtualEmail && adminLogado === sessionBackup.adminLogado
        : restoredUser.onboardingStep === backup.step && restoredUser.onboardingCompleted === backup.completed && restoredUser.papel === backup.papel;
      return {
        ok: steps.length === ONBOARDING_TOTAL_STEPS && steps.every((item) => item.titleMatches && item.withinViewport && !item.internalOverflow),
        viewport: { width: innerWidth, height: innerHeight },
        restored,
        usedSyntheticUser: syntheticUserAdded,
        steps
      };
    })()`);
    console.log(JSON.stringify(result, null, 2));
    if (!result?.ok || !result?.restored) throw new Error("ONBOARDING_ANDROID_SMOKE_FAILED");
  } finally {
    try { adb("forward", "--remove", `tcp:${PORT}`); } catch (_) {}
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
