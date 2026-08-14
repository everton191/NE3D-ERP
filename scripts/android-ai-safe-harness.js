"use strict";

const { execFileSync } = require("child_process");

const PACKAGE = "br.com.ne3d.erp";
const REQUIRE_CHAT = process.argv.includes("--require-chat");
const OPEN_CHAT = process.argv.includes("--open-chat");
const CLOSE_CHAT = process.argv.includes("--close-chat");
const DIAGNOSTICS = process.argv.includes("--diagnostics");
const messageIndex = process.argv.indexOf("--message");
const TEST_MESSAGE = messageIndex >= 0 ? String(process.argv[messageIndex + 1] || "").trim() : "";
const ADB = process.env.ANDROID_ADB
  || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;

function abort(reason) {
  console.error(`ABORTADO: ${reason}`);
  process.exit(2);
}

function adb(...args) {
  try { return execFileSync(ADB, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (error) { abort(error.stderr?.trim() || error.message); }
}

async function cdp(socketUrl, expression, timeoutMs = 5000) {
  const ws = new WebSocket(socketUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout ao conectar no WebView")), 5000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("falha ao conectar no WebView")); }, { once: true });
  });
  const id = 1;
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout ao validar a tela")), timeoutMs);
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== id) return;
      clearTimeout(timer);
      resolve(message.result?.result?.value);
    });
    ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } }));
  });
  ws.close();
  return result;
}

(async () => {
  const devices = adb("devices").split(/\r?\n/).slice(1).filter((line) => /\tdevice$/.test(line));
  if (devices.length !== 1) abort(`esperado exatamente um aparelho autorizado; encontrados ${devices.length}`);

  const activityState = adb("shell", "dumpsys", "activity", "activities");
  const windowState = adb("shell", "dumpsys", "window", "windows");
  const resumed = activityState.match(/topResumedActivity=.*?\s([\w.]+)\//)?.[1]
    || activityState.match(/ResumedActivity:.*?\s([\w.]+)\//)?.[1]
    || windowState.match(/mCurrentFocus=.*?\s([\w.]+)\//)?.[1]
    || windowState.match(/mFocusedApp=.*?\s([\w.]+)\//)?.[1];
  if (resumed !== PACKAGE) abort(`pacote em foreground é ${resumed || "desconhecido"}, esperado ${PACKAGE}`);

  const pid = adb("shell", "pidof", PACKAGE).split(/\s+/)[0];
  if (!/^\d+$/.test(pid)) abort("processo do Simplifica 3D não encontrado");
  const sockets = adb("shell", "cat", "/proc/net/unix");
  const socket = `webview_devtools_remote_${pid}`;
  if (!sockets.includes(`@${socket}`)) abort(`WebView do PID ${pid} não está disponível para inspeção`);

  adb("forward", "tcp:9223", `localabstract:${socket}`);
  const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json()).catch(() => []);
  const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!target) abort("WebView correto não foi encontrado");
  if (OPEN_CHAT) {
    await cdp(target.webSocketDebuggerUrl, `(async () => { await abrirSecretariaIaLocal3d(); return true; })()`, 45000);
  }
  if (CLOSE_CHAT) {
    await cdp(target.webSocketDebuggerUrl, `(() => { closeModal(); return true; })()`);
  }

  const expected = await cdp(target.webSocketDebuggerUrl, `(() => ({
    packageOk: !!window.Capacitor && window.Capacitor.getPlatform?.() === "android",
    coreOk: !!window.Simplifica3dAiCore && !!window.Simplifica3dOperationSafety && !!window.Simplifica3dCanonicalOrder && !!window.Simplifica3dOrderCreatePreparation && !!window.Simplifica3dOrderCreateExecutor && !!window.Simplifica3dRlm && !!window.Simplifica3dAiOrchestrator && window.SimplificaAssistantPack?.modelScope === "simplifica-3d" && !window.RuralAssistantPack && !window.TecAssistantPack && !window.StoreEditorAssistantPack,
    chatOk: !!document.querySelector(".ai-chat-dialog") && !!document.getElementById("aiChatInput") && !!document.querySelector(".ai-chat-form button[type=submit]"),
    visible: document.visibilityState === "visible"
  }))()`);
  if (!expected?.packageOk || !expected?.coreOk || !expected?.visible) abort(`a página ativa não é o Simplifica 3D esperado (${JSON.stringify(expected)})`);
  if ((REQUIRE_CHAT || TEST_MESSAGE) && !expected.chatOk) abort("o modal esperado do chat não está ativo");

  let interaction = null;
  if (TEST_MESSAGE) {
    interaction = await cdp(target.webSocketDebuggerUrl, `(async () => {
      const input = document.getElementById("aiChatInput");
      const form = input?.closest("form");
      if (!input || !form || input.disabled) return { ok: false, reason: "chat_not_ready" };
      const previousAssistants = [...document.querySelectorAll(".ai-chat-message-assistant")];
      const previous = previousAssistants.length;
      const previousText = previousAssistants.at(-1)?.querySelector("p")?.textContent || "";
      input.value = ${JSON.stringify(TEST_MESSAGE)};
      input.dispatchEvent(new Event("input", { bubbles: true }));
      form.requestSubmit();
      const deadline = Date.now() + 45000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const button = document.querySelector(".ai-chat-form button[type=submit]");
        const assistants = [...document.querySelectorAll(".ai-chat-message-assistant")];
        const latestText = assistants.at(-1)?.querySelector("p")?.textContent || "";
        if (!button?.disabled && (assistants.length > previous || latestText !== previousText)) {
          return { ok: true, response: latestText, timings: window.getSimplifica3dAiTimings?.().slice(-8) || [] };
        }
      }
      return { ok: false, reason: "response_timeout", timings: window.getSimplifica3dAiTimings?.().slice(-8) || [] };
    })()`, 50000);
    if (!interaction?.ok) abort(`interação segura falhou: ${interaction?.reason || "resultado desconhecido"}`);
  }

  let diagnostics = null;
  if (DIAGNOSTICS) {
    diagnostics = await cdp(target.webSocketDebuggerUrl, `(async () => {
      const orchestrator = criarSimplifica3dAiOrchestratorV2();
      const blocked = await orchestrator.toolRegistry.execute("order_create", {});
      const before = { orders: pedidos.length, cash: caixa.length, stockItems: estoque.length };
      const shadow = orchestrator.orderCreateShadow.prepare({ customerName: "Teste Shadow", items: [{ description: "Item Shadow", quantity: 1, unitPrice: 1 }] }, {
        orderId: "shadow-device-test", sequenceNumber: 0, displayDate: "12/08/2026", createdAt: "2026-08-12T12:00:00.000Z", updatedAt: "2026-08-12T12:00:00.000Z"
      });
      const after = { orders: pedidos.length, cash: caixa.length, stockItems: estoque.length };
      return {
        currentScreen: telaAtual,
        currentUser: getUsuarioAtual()?.email || "",
        superadmin: isSuperAdmin(),
        superadminErpMode: isModoErpSuperadminAtivo(),
        assistantWarmup: typeof assistenteIaAquecimento === "object" ? assistenteIaAquecimento : null,
        voicePlugin: !!window.Capacitor?.Plugins?.SimplificaVoice,
        assistantShortcut: (() => { const element = document.querySelector(".ai-assistant-status"); const rect = element?.getBoundingClientRect(); return element && rect ? { visible: rect.width > 0 && rect.height > 0, width: rect.width, height: rect.height, right: innerWidth - rect.right, bottom: innerHeight - rect.bottom, state: element.className } : null; })(),
        orders: Array.isArray(pedidos) ? pedidos.length : -1,
        cash: Array.isArray(caixa) ? caixa.length : -1,
        stockItems: Array.isArray(estoque) ? estoque.length : -1,
        pendingStatus: orchestrator.manager.session.pendingAction?.status || "",
        dryRunExecutionsThisProcess: orchestrator.dryRunExecutor.executionCount,
        sideEffects: orchestrator.manager.session.pendingAction?.result?.sideEffects,
        orderCreateTool: blocked.status,
        writeMode: orchestrator.operationSafety.gate.mode,
        sharedPreparation: !!orchestrator.orderPreparationUseCase,
        transactionExecutorLoaded: !!window.Simplifica3dOrderCreateExecutor,
        transactionExecutorExposedToAi: !!orchestrator.orderCreateExecutor,
        shadowStatus: shadow.status,
        shadowSideEffects: shadow.sideEffects,
        shadowStateUnchanged: JSON.stringify(before) === JSON.stringify(after)
        ,canonicalHash: window.Simplifica3dCanonicalOrder.canonicalHash({ customerName: "Test", items: [{ description: "Item", quantity: 1, unitPrice: 1 }] })
        ,rlmLimits: window.Simplifica3dRlm.LIMITS
      };
    })()`);
  }

  console.log(JSON.stringify({ status: "SAFE_TO_TEST", package: PACKAGE, pid, webView: socket, chat: expected.chatOk, interaction, diagnostics }, null, 2));
})().catch((error) => abort(error.message));
