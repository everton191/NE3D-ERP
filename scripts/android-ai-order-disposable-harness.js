"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PACKAGE = "br.com.ne3d.erp";
const ADB = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const SCREENSHOT = path.resolve(__dirname, "../output/ai-order-manual-disposable.png");
const CLEANUP_ONLY = process.argv.includes("--cleanup-only");
const LOCAL_CLEANUP_ONLY = process.argv.includes("--local-cleanup-only");
const DIAGNOSTICS_ONLY = process.argv.includes("--diagnostics");

function fail(message) { throw new Error(message); }
function adb(...args) { return execFileSync(ADB, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
async function cdp(url, expression, timeoutMs = 20000) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP timeout")), timeoutMs);
    ws.addEventListener("message", (event) => { const data = JSON.parse(String(event.data)); if (data.id !== 1) return; clearTimeout(timer); data.result?.exceptionDetails ? reject(new Error(data.result.exceptionDetails.text)) : resolve(data.result?.result?.value); });
    ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } }));
  });
  ws.close();
  return result;
}
async function captureCdpScreenshot(url, outputPath) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  const data = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP screenshot timeout")), 10000);
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 2) return;
      clearTimeout(timer);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result?.data || "");
    });
    ws.send(JSON.stringify({ id: 2, method: "Page.captureScreenshot", params: { format: "png", captureBeyondViewport: false } }));
  });
  ws.close();
  if (!data) fail("captura visual CDP vazia");
  fs.writeFileSync(outputPath, Buffer.from(data, "base64"));
}
function validateForeground() {
  const activity = adb("shell", "dumpsys", "activity", "activities");
  const resumed = activity.match(/topResumedActivity=.*?\s([\w.]+)\//)?.[1] || activity.match(/ResumedActivity:.*?\s([\w.]+)\//)?.[1];
  if (resumed !== PACKAGE) fail(`foreground inválido: ${resumed || "desconhecido"}`);
}
async function target() {
  validateForeground();
  const pid = adb("shell", "pidof", PACKAGE).split(/\s+/)[0];
  if (!/^\d+$/.test(pid)) fail("PID do Simplifica 3D ausente");
  const socket = `webview_devtools_remote_${pid}`;
  if (!adb("shell", "cat", "/proc/net/unix").includes(`@${socket}`)) fail("WebView validado ausente");
  adb("forward", "tcp:9224", `localabstract:${socket}`);
  const targets = await fetch("http://127.0.0.1:9224/json").then((response) => response.json());
  const page = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!page) fail("página WebView ausente");
  const ok = await cdp(page.webSocketDebuggerUrl, `({ platform: window.Capacitor?.getPlatform?.(), visible: document.visibilityState, executor: !!window.Simplifica3dOrderCreateExecutor })`);
  if (ok?.platform !== "android" || ok?.visible !== "visible" || !ok?.executor) fail("WebView não corresponde ao Simplifica 3D esperado");
  return page;
}
async function restore(page, backup, keepSandbox = true) {
  await cdp(page.webSocketDebuggerUrl, `(() => {
    const originalStorage = ${JSON.stringify(backup?.storage || {})};
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && !Object.prototype.hasOwnProperty.call(originalStorage, key)) localStorage.removeItem(key);
    }
    Object.entries(originalStorage).forEach(([key, value]) => localStorage.setItem(key, value));
    pedidos = ${JSON.stringify(backup?.state?.pedidos || [])};
    caixa = ${JSON.stringify(backup?.state?.caixa || [])};
    estoque = ${JSON.stringify(backup?.state?.estoque || [])};
    historico = ${JSON.stringify(backup?.state?.historico || [])};
    pendingSync = ${JSON.stringify(backup?.state?.pendingSync || [])};
    window.__simplificaOrderValidationSandbox = ${keepSandbox ? "true" : "false"};
    ${keepSandbox ? 'localStorage.setItem("simplifica_order_validation_sandbox", "1")' : 'localStorage.removeItem("simplifica_order_validation_sandbox")'};
    window.__simplificaOrderFaultInjection = "";
    salvarDados();
    return true;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 300));
}

(async () => {
  let page = await target();
  if (DIAGNOSTICS_ONLY) {
    const diagnostics = await cdp(page.webSocketDebuggerUrl, `(async () => {
      const orchestrator = criarSimplifica3dAiOrchestratorV2();
      const blocked = await orchestrator.toolRegistry.execute("order_create", {});
      return {
        counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length },
        disposableOrders: pedidos.filter((item) => /^(HOMOLOGAÇÃO|FAULT) DESCARTÁVEL /.test(String(item.cliente || ""))).length,
        sandboxMarker: localStorage.getItem("simplifica_order_validation_sandbox"),
        writeMode: orchestrator.operationSafety.gate.mode,
        orderCreateTool: blocked.status,
        executorExposedToAi: !!orchestrator.orderCreateExecutor
      };
    })()`);
    console.log(JSON.stringify({ status: "DIAGNOSTICS", diagnostics }, null, 2));
    return;
  }
  if (LOCAL_CLEANUP_ONLY) {
    const cleanup = await cdp(page.webSocketDebuggerUrl, `(() => {
      window.__simplificaOrderValidationSandbox = true;
      localStorage.setItem("simplifica_order_validation_sandbox", "1");
      const tests = pedidos.filter((item) => /^(HOMOLOGAÇÃO|FAULT) DESCARTÁVEL /.test(String(item.cliente || "")));
      const ids = new Set(tests.map((item) => String(item.id)));
      tests.forEach((order) => {
        if (pedidoEstoqueFoiBaixado(order)) calcularConsumoMateriais(order.itens || []).forEach((quantity, materialId) => {
          const index = estoque.findIndex((item) => String(item.id) === String(materialId));
          if (index >= 0) estoque[index] = normalizarMaterialEstoque({ ...estoque[index], qtd: (Number(estoque[index].qtd) || 0) + Number(quantity || 0) });
        });
      });
      pedidos = pedidos.filter((item) => !ids.has(String(item.id)));
      caixa = caixa.filter((item) => !ids.has(String(item.pedidoId ?? item.pedido_id ?? item.orderId ?? "")));
      historico = historico.filter((item) => !ids.has(String(item.metadata?.order_id || "")) && !tests.some((order) => String(item.detalhes || "").includes(String(order.cliente || ""))));
      pendingSync = pendingSync.filter((item) => !ids.has(String(item.recordId || item.record_id || item.data?.id || item.data?.pedidoId || item.data?.pedido_id || "")));
      window.__simplificaOrderFaultInjection = "";
      salvarDados();
      window.__simplificaOrderValidationSandbox = false;
      localStorage.removeItem("simplifica_order_validation_sandbox");
      return { removed: tests.length, counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length } };
    })()`);
    console.log(JSON.stringify({ status: "LOCAL_CLEANED", cleanup }, null, 2));
    return;
  }
  if (CLEANUP_ONLY) {
    const cleanup = await cdp(page.webSocketDebuggerUrl, `(async () => {
      const tests = pedidos.filter((item) => /^HOMOLOGAÇÃO DESCARTÁVEL /.test(String(item.cliente || "")) || /^FAULT DESCARTÁVEL /.test(String(item.cliente || "")));
      const ids = new Set(tests.map((item) => String(item.id)));
      const cashTests = caixa.filter((item) => ids.has(String(item.pedidoId ?? item.pedido_id ?? item.orderId ?? "")));
      const deletedAt = new Date().toISOString();
      const remoteResults = [];
      for (const order of tests) {
        const deletedOrder = { ...order, deleted_at: deletedAt, deletedAt, sync_status: "pending", updated_at: deletedAt, updatedAt: deletedAt };
        try { remoteResults.push({ collection: "pedidos", id: getRegistroSyncId("pedidos", deletedOrder), result: await enviarRegistroSyncSupabase({ collection: "pedidos", recordId: getRegistroSyncId("pedidos", deletedOrder), data: deletedOrder, scopeId: getEscopoDadosAtual() }) }); }
        catch (error) { remoteResults.push({ collection: "pedidos", id: order.id, error: String(error?.message || error) }); }
        const customerKey = normalizarTextoBusca(String(order.cliente || "") + "|" + String(order.clienteTelefone || "") + "|" + String(order.clienteEmail || order.emailCliente || ""));
        const customerId = "cliente-" + customerKey.slice(0, 72);
        const deletedCustomer = { id: customerId, nome: order.cliente, telefone: order.clienteTelefone || "", email: order.clienteEmail || order.emailCliente || "", owner_id: order.owner_id || getDataOwnerId(), deleted_at: deletedAt, sync_status: "pending", updated_at: deletedAt };
        try { remoteResults.push({ collection: "clientes", id: customerId, result: await enviarRegistroSyncSupabase({ collection: "clientes", recordId: customerId, data: deletedCustomer, scopeId: getEscopoDadosAtual() }) }); }
        catch (error) { remoteResults.push({ collection: "clientes", id: customerId, error: String(error?.message || error) }); }
      }
      for (const entry of cashTests) {
        const deletedCash = { ...entry, deleted_at: deletedAt, deletedAt, sync_status: "pending", updated_at: deletedAt, updatedAt: deletedAt };
        try { remoteResults.push({ collection: "caixa", id: getRegistroSyncId("caixa", deletedCash), result: await enviarRegistroSyncSupabase({ collection: "caixa", recordId: getRegistroSyncId("caixa", deletedCash), data: deletedCash, scopeId: getEscopoDadosAtual() }) }); }
        catch (error) { remoteResults.push({ collection: "caixa", id: entry.id, error: String(error?.message || error) }); }
      }
      tests.forEach((order) => {
        if (pedidoEstoqueFoiBaixado(order)) {
          calcularConsumoMateriais(order.itens || []).forEach((quantity, materialId) => {
            const index = estoque.findIndex((item) => String(item.id) === String(materialId));
            if (index >= 0) estoque[index] = normalizarMaterialEstoque({ ...estoque[index], qtd: (Number(estoque[index].qtd) || 0) + Number(quantity || 0) });
          });
        }
      });
      pedidos = pedidos.filter((item) => !ids.has(String(item.id)));
      caixa = caixa.filter((item) => !ids.has(String(item.pedidoId ?? item.pedido_id ?? item.orderId ?? "")));
      historico = historico.filter((item) => !ids.has(String(item.metadata?.order_id || "")) && !tests.some((order) => String(item.detalhes || "").includes(String(order.cliente || ""))));
      window.__simplificaOrderValidationSandbox = false; localStorage.removeItem("simplifica_order_validation_sandbox"); window.__simplificaOrderFaultInjection = ""; salvarDados();
      const backupReplaced = await salvarBackupSupabase({ contexto: "sandbox-cleanup", avisarLimite: false });
      return { removed: tests.length, remoteResults, backupReplaced, counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length } };
    })()`);
    console.log(JSON.stringify({ status: "CLEANED", cleanup }, null, 2));
    return;
  }
  const backup = await cdp(page.webSocketDebuggerUrl, `(() => ({
    storage: Object.fromEntries(Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)])),
    state: { pedidos: JSON.parse(JSON.stringify(pedidos)), caixa: JSON.parse(JSON.stringify(caixa)), estoque: JSON.parse(JSON.stringify(estoque)), historico: JSON.parse(JSON.stringify(historico)), pendingSync: JSON.parse(JSON.stringify(pendingSync)) },
    counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length },
    signature: JSON.stringify({ pedidos, caixa, estoque })
  }))()`);
  let restored = false;
  try {
    const success = await cdp(page.webSocketDebuggerUrl, `(async () => {
      window.__simplificaOrderValidationSandbox = true;
      localStorage.setItem("simplifica_order_validation_sandbox", "1");
      window.__simplificaOrderFaultInjection = "";
      const customer = "HOMOLOGAÇÃO DESCARTÁVEL " + Date.now();
      const material = normalizarEstoque().find((item) => Number(item.qtd) > 0.01);
      if (!material) return { ok: false, reason: "material_indisponivel" };
      trocarTela("pedidos");
      clientePedido = customer;
      clienteTelefonePedido = "85999990000";
      clienteEmailPedido = "sandbox@simplifica.invalid";
      observacaoPedido = "Pedido descartável de homologação";
      prazoPedido = "";
      statusPedido = "confirmado";
      entradaPedido = 1;
      descontoPedido = 0;
      descontoTipoPedido = "fixo";
      descontoPercentualPedido = 0;
      itensPedido = [normalizarItemPedido({ nome: "Chaveiro homologação", qtd: 2, valor: 7, total: 14, materialGramsTotal: 2, materiais: [{ materialId: material.id, quantidade: 0.002, unidade: "kg" }] })];
      renderizarPreservandoScroll();
      await fecharPedido();
      const order = pedidos.find((item) => item.cliente === customer);
      if (order) {
        document.getElementById("simplifica-disposable-visual-proof")?.remove();
        const proof = document.createElement("div");
        proof.id = "simplifica-disposable-visual-proof";
        proof.setAttribute("data-test-only", "true");
        proof.style.cssText = "position:fixed;inset:0;z-index:2147483647;overflow:auto;background:var(--bg,#071019);padding:16px";
        proof.innerHTML = renderListaPedidos();
        document.body.appendChild(proof);
      }
      return { ok: !!order, customer, order, counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length }, visualText: document.querySelector("main")?.innerText?.slice(0, 2000) || document.body.innerText.slice(0, 2000) };
    })()`, 30000);
    if (!success?.ok) fail(`pedido manual descartável falhou: ${success?.reason || "não persistido"}`);
    if (success.counts.orders !== backup.counts.orders + 1) fail("pedido descartável não alterou exatamente um pedido");
    if (success.counts.cash !== backup.counts.cash + 1) fail("pedido descartável não produziu exatamente um lançamento de caixa");

    fs.mkdirSync(path.dirname(SCREENSHOT), { recursive: true });
    await captureCdpScreenshot(page.webSocketDebuggerUrl, SCREENSHOT);

    const manualEvidence = await cdp(page.webSocketDebuggerUrl, `(() => {
      const order = pedidos.find((item) => item.cliente === ${JSON.stringify("__MANUAL_CUSTOMER__")});
      const canonical = order ? window.Simplifica3dCanonicalOrder.normalizeForParity(order) : null;
      const parity = canonical ? { customerSnapshot: canonical.customerSnapshot, items: canonical.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal, weightGrams: item.weightGrams, materials: item.materials.map((material) => ({ materialId: material.materialId, quantity: material.quantity, unit: material.unit })) })), subtotal: canonical.subtotal, discountTotal: canonical.discountTotal, total: canonical.total, downPayment: canonical.downPayment, status: canonical.status, notes: canonical.notes } : null;
      return order ? { canonical, parity, cashAmount: caixa.find((item) => String(item.pedidoId ?? item.pedido_id ?? item.orderId ?? "") === String(order.id))?.valor || 0 } : null;
    })()`.replace("__MANUAL_CUSTOMER__", success.customer));

    await restore(page, backup, true); restored = true;
    page = await target();
    const afterRestore = await cdp(page.webSocketDebuggerUrl, `(() => ({ counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length }, signature: JSON.stringify({ pedidos, caixa, estoque }) }))()`);
    if (afterRestore.signature !== backup.signature) fail("restauração após pedido manual não foi integral");

    restored = false;
    const aiEvidence = await cdp(page.webSocketDebuggerUrl, `(async () => {
      window.__simplificaOrderValidationSandbox = true;
      localStorage.setItem("simplifica_order_validation_sandbox", "1");
      const material = normalizarEstoque().find((item) => Number(item.qtd) > 0.01);
      if (!material) return { ok: false, reason: "material_indisponivel" };
      const orchestrator = criarSimplifica3dAiOrchestratorV2();
      orchestrator.manager.cancel();
      orchestrator.manager.startOrder({ customer: ${JSON.stringify("__MANUAL_CUSTOMER__")}, product: "Chaveiro homologação", weightGrams: 2, quantity: 2, unitPrice: 7, downPayment: 1, status: "confirmado", notes: "Pedido descartável de homologação", materials: [{ materialId: material.id, quantity: 0.002, unit: "kg" }] });
      orchestrator.manager.session.resolvedEntities.customer = { name: ${JSON.stringify("__MANUAL_CUSTOMER__")}, phone: "85999990000", email: "sandbox@simplifica.invalid" };
      orchestrator.manager.save();
      const countsBeforePreview = { orders: pedidos.length, cash: caixa.length, stock: estoque.length };
      const preview = await orchestrator.handle("preparar", { appContext: window.Simplifica3dAiReadFacade.getAppContext() });
      const countsAfterPreview = { orders: pedidos.length, cash: caixa.length, stock: estoque.length };
      if (JSON.stringify(countsBeforePreview) !== JSON.stringify(countsAfterPreview)) return { ok: false, reason: "preview_mutated_state" };
      if (orchestrator.manager.session.pendingAction?.status !== "CONFIRMATION_PENDING") return { ok: false, reason: "confirmation_missing" };
      const confirmed = await orchestrator.handle("confirmo", { appContext: window.Simplifica3dAiReadFacade.getAppContext() });
      const order = pedidos.find((item) => item.cliente === ${JSON.stringify("__MANUAL_CUSTOMER__")});
      const canonical = order ? window.Simplifica3dCanonicalOrder.normalizeForParity(order) : null;
      const parity = canonical ? { customerSnapshot: canonical.customerSnapshot, items: canonical.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal, weightGrams: item.weightGrams, materials: item.materials.map((material) => ({ materialId: material.materialId, quantity: material.quantity, unit: material.unit })) })), subtotal: canonical.subtotal, discountTotal: canonical.discountTotal, total: canonical.total, downPayment: canonical.downPayment, status: canonical.status, notes: canonical.notes } : null;
      return { ok: !!order && confirmed.confirmed?.result?.status === "COMMITTED", preview: preview.summary, confirmationStatus: confirmed.confirmed?.result?.status, canonical, parity, cashAmount: order ? caixa.find((item) => String(item.pedidoId ?? item.pedido_id ?? item.orderId ?? "") === String(order.id))?.valor || 0 : 0, counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length } };
    })()`.replaceAll("__MANUAL_CUSTOMER__", success.customer), 30000);
    if (!aiEvidence?.ok) fail(`pedido confirmado pela IA falhou: ${aiEvidence?.reason || "não persistido"}`);
    if (JSON.stringify(aiEvidence.parity) !== JSON.stringify(manualEvidence.parity)) fail(`pedido manual e pedido confirmado pela IA divergiram no domínio: ${JSON.stringify({ manual: manualEvidence.parity, ai: aiEvidence.parity })}`);
    if (Number(aiEvidence.cashAmount) !== Number(manualEvidence.cashAmount)) fail("efeito de caixa divergiu entre manual e IA");
    await restore(page, backup, true); restored = true;

    const injectFault = async (faultPoint) => cdp(page.webSocketDebuggerUrl, `(async () => {
      window.__simplificaOrderValidationSandbox = true;
      window.__simplificaOrderFaultInjection = ${JSON.stringify("__FAULT_POINT__")};
      const customer = "FAULT DESCARTÁVEL ${"__FAULT_POINT__"} " + Date.now();
      trocarTela("pedidos"); clientePedido = customer; statusPedido = "aberto"; entradaPedido = 0; descontoPedido = 0;
      itensPedido = [normalizarItemPedido({ nome: "Fault item", qtd: 1, valor: 3, total: 3 })];
      renderizarPreservandoScroll(); await fecharPedido();
      return { exists: pedidos.some((item) => item.cliente === customer), counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length } };
    })()`.replaceAll("__FAULT_POINT__", faultPoint), 30000);
    const faultBefore = await injectFault("BEFORE_LOCAL_PERSIST");
    if (faultBefore.exists || JSON.stringify(faultBefore.counts) !== JSON.stringify(backup.counts)) fail("fault injection antes da persistência não restaurou o estado em memória");
    const faultAfter = await injectFault("AFTER_LOCAL_PERSIST");
    if (faultAfter.exists || JSON.stringify(faultAfter.counts) !== JSON.stringify(backup.counts)) fail("fault injection após a persistência não restaurou o estado em memória");

    await restore(page, backup, true);
    adb("shell", "am", "force-stop", PACKAGE);
    adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    page = await target();
    const afterRestart = await cdp(page.webSocketDebuggerUrl, `(() => ({ counts: { orders: pedidos.length, cash: caixa.length, stock: estoque.length }, signature: JSON.stringify({ pedidos, caixa, estoque }), writeMode: criarSimplifica3dAiOrchestratorV2().operationSafety.gate.mode }))()`);
    if (afterRestart.signature !== backup.signature) fail("reinício restaurou estado divergente");
    if (afterRestart.writeMode !== "LIVE") fail("ORDER.CREATE confirmado não foi restaurado no modo esperado");
    await cdp(page.webSocketDebuggerUrl, `(() => { window.__simplificaOrderValidationSandbox = false; localStorage.removeItem("simplifica_order_validation_sandbox"); window.__simplificaOrderFaultInjection = ""; pendingSync = ${JSON.stringify(backup?.state?.pendingSync || [])}; salvarDados(); return true; })()`);

    console.log(JSON.stringify({ status: "PASSED", success: { counts: success.counts, customer: success.customer, orderTotal: success.order.total }, parity: { domainEqual: JSON.stringify(aiEvidence.parity) === JSON.stringify(manualEvidence.parity), cashEqual: Number(aiEvidence.cashAmount) === Number(manualEvidence.cashAmount), confirmationStatus: aiEvidence.confirmationStatus }, restored: afterRestore.counts, faultInjection: { beforeLocalPersist: faultBefore, afterLocalPersist: faultAfter }, afterRestart: { counts: afterRestart.counts, signatureMatches: afterRestart.signature === backup.signature, writeMode: afterRestart.writeMode }, screenshot: SCREENSHOT }, null, 2));
  } finally {
    if (!restored) {
      try { await restore(page, backup, false); } catch (_) {}
    }
  }
})().catch((error) => { console.error(`ABORTADO: ${error.message}`); process.exit(2); });
