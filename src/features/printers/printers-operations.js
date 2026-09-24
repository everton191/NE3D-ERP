(function attachPrintersOperations(global) {
  "use strict";

function getPrinterMonitoringService(context = {}) {
  const { window } = context;
  return window.PrinterMonitoringService || null;
}

function getPrinterBackendConfig(context = {}) {
  const { SUPABASE_DEFAULT_ANON_KEY, SUPABASE_DEFAULT_URL, syncConfig } = context;
  return {
    url: syncConfig.supabaseUrl || SUPABASE_DEFAULT_URL,
    anonKey: syncConfig.supabaseAnonKey || SUPABASE_DEFAULT_ANON_KEY,
    accessToken: syncConfig.supabaseAccessToken || ""
  };
}

async function printerBackendRequest(action, payload = {}, context = {}) {
  const { billingConfig, getInterfaceMode, getUsuarioAtual } = context;
  const service = getPrinterMonitoringService(context);
  if (!service) throw new Error("Serviço de impressoras indisponível.");
  return service.request(getPrinterBackendConfig(context), action, {
    company_id: getUsuarioAtual()?.companyId || billingConfig.companyId || "",
    interface_mode: getInterfaceMode(),
    ...payload
  });
}

function getPrinterRole(context = {}) {
  const { getUserAccessRole, getUsuarioAtual } = context;
  return getUserAccessRole(getUsuarioAtual());
}

function podeGerenciarImpressoras(context = {}) {
  const { isSuperAdmin } = context;
  return isSuperAdmin() || ["owner", "admin"].includes(getPrinterRole(context));
}

function podeOperarImpressoras(context = {}) {
  const { isSuperAdmin } = context;
  return isSuperAdmin() || ["owner", "admin", "manager", "production"].includes(getPrinterRole(context));
}

function getImpressorasAtivas(context = {}) {
  const { billingConfig, getUsuarioAtual, printerMonitoringState, syncConfig } = context;
  const scope = `${getUsuarioAtual()?.companyId || billingConfig.companyId || ""}:${getUsuarioAtual()?.supabaseUserId || syncConfig.supabaseUserId || ""}`;
  if (printerMonitoringState.scope && printerMonitoringState.scope !== scope) return [];
  return (Array.isArray(printerMonitoringState.items) ? printerMonitoringState.items : []).filter((item) => item?.active !== false);
}

function sincronizarImpressorasComCalculadora(context = {}) {
  const { printers } = context;
  getImpressorasAtivas(context).forEach((item) => {
    const nome = String(item.name || item.custom_model || "").trim();
    if (!nome) return;
    printers[nome] = {
      tipo: String(item.printer_type || "fdm").toLowerCase() === "resin" ? "RESINA" : "FDM",
      consumo: Number(item.power_watts) || 0,
      custo: Number(item.hourly_cost) || 0,
      registeredPrinterId: item.id
    };
  });
}


async function hidratarImpressorasSeNecessario(forcar = false, renderizarAoFinal = true, context = {}) {
  const { billingConfig, conectarBambuMqttCloudAutomatico, getPrinterMonitoringService, getUsuarioAtual, printerBackendRequest, printerMonitoringState, renderizarPreservandoScroll, sincronizarImpressorasComCalculadora, sincronizarImpressorasMonitoradasComProducao, syncConfig, telaAtual } = context;
  if (!syncConfig.supabaseAccessToken || !getUsuarioAtual()) return;
  const scope = `${getUsuarioAtual()?.companyId || billingConfig.companyId || ""}:${getUsuarioAtual()?.supabaseUserId || syncConfig.supabaseUserId || ""}`;
  if (printerMonitoringState.scope !== scope) {
    printerMonitoringState.requestId += 1;
    printerMonitoringState.scope = scope;
    printerMonitoringState.loading = false;
    printerMonitoringState.pendingForce = false;
    printerMonitoringState.loaded = false;
    printerMonitoringState.error = "";
    printerMonitoringState.items = [];
    printerMonitoringState.brands = [];
    printerMonitoringState.models = [];
    printerMonitoringState.connectors = [];
    printerMonitoringState.agents = [];
    printerMonitoringState.access = {};
    printerMonitoringState.history = {};
  }
  if (printerMonitoringState.loading || (printerMonitoringState.loaded && !forcar)) return;
  const requestId = ++printerMonitoringState.requestId;
  const carregamentoInicial = !printerMonitoringState.loaded;
  printerMonitoringState.loading = true;
  printerMonitoringState.error = "";
  if (telaAtual === "impressoras" && !printerMonitoringState.loaded) renderizarPreservandoScroll();
  try {
    const workspace = await printerBackendRequest("list");
    const currentScope = `${getUsuarioAtual()?.companyId || billingConfig.companyId || ""}:${getUsuarioAtual()?.supabaseUserId || syncConfig.supabaseUserId || ""}`;
    if (currentScope !== scope || requestId !== printerMonitoringState.requestId) return;
    printerMonitoringState.items = Array.isArray(workspace?.printers) ? workspace.printers : [];
    printerMonitoringState.brands = Array.isArray(workspace?.brands) ? workspace.brands : [];
    printerMonitoringState.models = Array.isArray(workspace?.models) ? workspace.models : [];
    printerMonitoringState.connectors = Array.isArray(workspace?.connectors) ? workspace.connectors : [];
    printerMonitoringState.agents = Array.isArray(workspace?.agents) ? workspace.agents : [];
    printerMonitoringState.access = workspace?.access || {};
    printerMonitoringState.loaded = true;
    sincronizarImpressorasComCalculadora();
    sincronizarImpressorasMonitoradasComProducao();
    setTimeout(() => conectarBambuMqttCloudAutomatico(), 0);
  } catch (erro) {
    if (requestId !== printerMonitoringState.requestId) return;
    printerMonitoringState.error = getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message || "Não foi possível carregar as impressoras.";
  } finally {
    if (requestId !== printerMonitoringState.requestId) return;
    const repetir = printerMonitoringState.pendingForce;
    printerMonitoringState.pendingForce = false;
    printerMonitoringState.loading = false;
    if (renderizarAoFinal && (telaAtual === "impressoras" || telaAtual === "calculadora" || (telaAtual === "producao" && carregamentoInicial))) renderizarPreservandoScroll();
  }
}

function getPrinterCurrentStatus(impressora = {}, context = {}) {
  const latest = impressora.latest_status || {};
  return String(latest.normalized_state || (impressora.connector_type === "manual" ? impressora.manual_status : "") || "unknown").toLowerCase();
}

function getPrinterDisplayBrand(impressora = {}, context = {}) {
  return impressora.printer_brands?.name || impressora.custom_brand || "Sem marca";
}

function getPrinterDisplayModel(impressora = {}, context = {}) {
  return impressora.printer_models?.name || impressora.custom_model || "Modelo não informado";
}



function isBambuPrinterCandidate(impressora = {}, context = {}) {
  const { getPrinterDisplayBrand, getPrinterDisplayModel } = context;
  if (impressora.connector_type === "bambu") return true;
  if (impressora.connector_type !== "manual") return false;
  return /bambu/i.test(`${getPrinterDisplayBrand(impressora)} ${getPrinterDisplayModel(impressora)} ${impressora.name || ""}`);
}

function getBambuAmsSlots(rawPayload = {}, context = {}) {
  const slots = [];
  const visited = new Set();
  const walk = (value) => {
    if (!value || typeof value !== "object" || visited.has(value) || slots.length >= 16) return;
    visited.add(value);
    if (!Array.isArray(value) && (value.tray_type || value.tray_color || value.filament_type)) {
      const colorRaw = String(value.tray_color || value.color || "").replace(/^#/, "").slice(0, 8);
      slots.push({
        id: String(value.id ?? value.tray_id ?? slots.length + 1),
        type: String(value.tray_type || value.filament_type || "Filamento"),
        color: /^[0-9a-f]{6,8}$/i.test(colorRaw) ? `#${colorRaw.slice(0, 6)}` : "#68707c",
        remain: Number(value.remain ?? value.remain_percent)
      });
    }
    Object.values(value).forEach(walk);
  };
  walk(rawPayload?.ams || rawPayload);
  return slots;
}

function getPrinterProgressValue(value, context = {}) {
  if (value === null || value === undefined || value === "") return Number.NaN;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : Number.NaN;
}

function getPrinterCameraStreamUrl(impressora = {}, context = {}) {
  const raw = impressora.latest_status?.raw_payload || {};
  const candidate = String(raw.camera_url || raw.mjpeg_url || raw.stream_url || "").trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch (_) {
    return "";
  }
}

function getBambuLanPlugin(context = {}) {
  const { window } = context;
  return window.Capacitor?.Plugins?.SimplificaBambuLan || null;
}

async function hidratarBambuLanState(context = {}) {
  const { bambuLanState, printerMonitoringState } = context;
  const plugin = getBambuLanPlugin(context);
  if (!plugin || bambuLanState.loading) return bambuLanState;
  bambuLanState.loading = true;
  try {
    const config = await plugin.getConfiguration();
    Object.assign(bambuLanState, {
      configured: config?.configured === true,
      cloudConfigured: config?.cloudConfigured === true,
      connected: config?.connectionState === "connected",
      connectionMode: String(config?.connectionMode || "none"),
      connectionState: String(config?.connectionState || "disconnected"),
      ip: String(config?.ip || ""),
      serial: String(config?.serial || "")
    });
    if (!bambuLanState.listenerReady && typeof plugin.addListener === "function") {
      await plugin.addListener("bambuStatus", (status) => aplicarStatusBambuLan(status, undefined, context));
      bambuLanState.listenerReady = true;
    }
  } catch (_) {
    bambuLanState.configured = false;
  } finally {
    bambuLanState.loading = false;
  }
  if (printerMonitoringState.loaded) setTimeout(() => conectarBambuMqttCloudAutomatico(undefined, context), 0);
  return bambuLanState;
}

async function conectarBambuMqttCloudAutomatico(forcar = false, context = {}) {
  const { bambuLanState, getImpressorasAtivas, mostrarToast, podeGerenciarImpressoras, printerBackendRequest, registrarDiagnostico } = context;
  const plugin = getBambuLanPlugin(context);
  if (!plugin || bambuLanState.cloudConnecting || bambuLanState.connected) return false;
  if (bambuLanState.cloudAttempted && !forcar) return false;
  const impressora = getImpressorasAtivas().find((printer) => printer.connector_type === "bambu" && printer.credentials_configured);
  if (!impressora || !podeGerenciarImpressoras()) return false;
  bambuLanState.cloudAttempted = true;
  bambuLanState.cloudConnecting = true;
  bambuLanState.printerId = impressora.id;
  try {
    let credentials = {};
    if (!bambuLanState.cloudConfigured || forcar) {
      credentials = await printerBackendRequest("bambu_mqtt_credentials", { printer_id: impressora.id });
    }
    const result = await plugin.connectCloud(credentials.token ? {
      host: credentials.host || "us.mqtt.bambulab.com",
      username: credentials.username,
      token: credentials.token,
      serial: credentials.serial
    } : {});
    Object.assign(bambuLanState, {
      cloudConfigured: true,
      connected: result?.connected === true,
      connectionMode: "cloud",
      connectionState: String(result?.connectionState || "connected"),
      serial: String(credentials.serial || bambuLanState.serial || "")
    });
    aplicarStatusBambuLan(result, impressora.id, context);
    setTimeout(async () => {
      try {
        aplicarStatusBambuLan(await plugin.getStatus(), impressora.id, context);
      } catch (_) {}
    }, 1800);
    return true;
  } catch (erro) {
    bambuLanState.connectionState = "error";
    registrarDiagnostico("Impressoras", "Falha ao conectar Bambu pela nuvem", erro?.message || String(erro), { silent: true });
    if (forcar) mostrarToast("Não foi possível conectar à Bambu pela nuvem agora. Confira a internet e tente novamente.", "erro", 6000);
    return false;
  } finally {
    bambuLanState.cloudConnecting = false;
  }
}

function getBambuLanPrinter(printerId = "", context = {}) {
  const { bambuLanState, getImpressorasAtivas, getPrinterById } = context;
  return getPrinterById(printerId || bambuLanState.printerId)
    || getImpressorasAtivas().find((printer) => printer.connector_type === "bambu")
    || null;
}

function normalizarEstadoBambuLan(value = "", context = {}) {
  const raw = String(value || "").toLowerCase();
  if (["running", "printing", "prepare", "slicing"].includes(raw)) return "printing";
  if (["pause", "paused"].includes(raw)) return "paused";
  if (["finish", "finished", "complete", "success"].includes(raw)) return "finished";
  if (["failed", "error", "cancelled", "canceled", "cancel", "aborted", "abort"].includes(raw)) return "error";
  if (["idle", "ready"].includes(raw)) return "idle";
  return "unknown";
}

function getBambuVisualFingerprint(impressora = {}, context = {}) {
  const latest = impressora.latest_status || {};
  const raw = latest.raw_payload || {};
  return JSON.stringify({
    connection: impressora.connection_status || "",
    state: latest.normalized_state || "",
    progress: latest.progress_percent ?? null,
    nozzle: latest.nozzle_temp ?? null,
    nozzleTarget: latest.nozzle_target_temp ?? null,
    bed: latest.bed_temp ?? null,
    bedTarget: latest.bed_target_temp ?? null,
    file: latest.current_file || "",
    remaining: latest.remaining_seconds ?? null,
    layer: raw.layer_num ?? null,
    layers: raw.total_layer_num ?? null,
    speed: raw.spd_lvl ?? raw.speed_level ?? null,
    light: raw.lights_report ?? raw.chamber_light ?? null,
    ams: raw.ams ?? null
  });
}

function atualizarElementosStatusBambu(impressora, context = {}) {
  const { CSS, document, formatarDataHora, formatarTemperaturaImpressora, getPrinterCurrentStatus, getPrinterMonitoringService, renderPrinterStatusBadge } = context;
  const latest = impressora.latest_status || {};
  const raw = latest.raw_payload || {};
  const progresso = getPrinterProgressValue(latest.progress_percent, context);
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((node) => {
    const next = String(value ?? "");
    if (node.textContent !== next) node.textContent = next;
  });
  const setHtml = (selector, value) => document.querySelectorAll(selector).forEach((node) => {
    const next = String(value ?? "");
    if (node.innerHTML !== next) node.innerHTML = next;
  });
  const scope = `[data-printer-live-id="${CSS.escape(String(impressora.id))}"]`;
  setHtml(`${scope} [data-printer-live="status"]`, renderPrinterStatusBadge(impressora));
  setText(`${scope} [data-printer-live="progress-text"]`, Number.isFinite(progresso) ? `${Math.round(progresso)}%` : "—");
  document.querySelectorAll(`${scope} [data-printer-live="progress"]`).forEach((node) => {
    node.hidden = !Number.isFinite(progresso);
    const progressValue = `${Math.max(0, Math.min(100, progresso || 0))}%`;
    const bar = node.querySelector("i");
    if (bar?.style.getPropertyValue("--progress") !== progressValue) bar?.style.setProperty("--progress", progressValue);
  });
  setText(`${scope} [data-printer-live="nozzle"]`, formatarTemperaturaImpressora(latest.nozzle_temp));
  setText(`${scope} [data-printer-live="bed"]`, formatarTemperaturaImpressora(latest.bed_temp));
  setText(`${scope} [data-printer-live="remaining"]`, getPrinterMonitoringService()?.formatDuration(latest.remaining_seconds) || "—");
  setText(`${scope} [data-printer-live="file"]`, latest.current_file || "");
  document.querySelectorAll(`${scope} [data-printer-live="file"]`).forEach((node) => { node.hidden = !latest.current_file; });
  setText(`${scope} [data-printer-live="updated"]`, `Atualizada ${formatarDataHora(latest.created_at || impressora.last_seen_at || new Date().toISOString())}`);
  setText(`${scope} [data-printer-live="layer"]`, Number.isFinite(Number(raw.layer_num)) && Number.isFinite(Number(raw.total_layer_num)) ? `Camada ${raw.layer_num}/${raw.total_layer_num}` : "");
  const productionTask = latest.current_file || "Impressão em andamento";
  setText(`${scope} [data-printer-live="production-status"]`, getPrinterCurrentStatus(impressora) === "printing" ? "Imprimindo" : getPrinterCurrentStatus(impressora) === "paused" ? "Pausada" : "Disponível");
  setText(`${scope} [data-printer-live="production-task"]`, getPrinterCurrentStatus(impressora) === "printing" ? productionTask : "Nenhuma tarefa");
}

function agendarRenderStatusBambu(impressora, context = {}) {
  const { bambuLanState } = context;
  if (bambuLanState.visualRenderTimer) clearTimeout(bambuLanState.visualRenderTimer);
  bambuLanState.visualRenderTimer = setTimeout(() => {
    bambuLanState.visualRenderTimer = null;
    atualizarElementosStatusBambu(impressora, context);
  }, 120);
}

function aplicarStatusBambuLan(status = {}, printerId = "", context = {}) {
  const { abrirConfirmacaoConclusaoImpressaoBambu, bambuLanState, getPrinterCurrentStatus, registrarFalhaImpressaoBambu } = context;
  let payload = {};
  try {
    payload = typeof status.payload === "string" ? JSON.parse(status.payload || "{}") : status.payload || {};
  } catch (_) {}
  const impressora = getBambuLanPrinter(printerId, context);
  Object.assign(bambuLanState, {
    connected: status.connected === true,
    connectionMode: String(status.connectionMode || bambuLanState.connectionMode || "none"),
    connectionState: String(status.connectionState || "disconnected"),
    ip: String(status.ip || bambuLanState.ip || ""),
    serial: String(status.serial || bambuLanState.serial || ""),
    printerId: impressora?.id || printerId || bambuLanState.printerId,
    lastPayloadAt: String(status.lastMessageAt || bambuLanState.lastPayloadAt || "")
  });
  if (!impressora || !Object.keys(payload).length) return;
  const estadoAnterior = bambuLanState.previousStates[impressora.id] || getPrinterCurrentStatus(impressora);
  const visualAnterior = getBambuVisualFingerprint(impressora, context);
  const progress = getPrinterProgressValue(payload.mc_percent, context);
  const remainingMinutes = Number(payload.mc_remaining_time);
  impressora.connection_status = "connected";
  impressora.last_seen_at = new Date().toISOString();
  impressora.latest_status = {
    ...(impressora.latest_status || {}),
    normalized_state: normalizarEstadoBambuLan(payload.gcode_state, context),
    progress_percent: Number.isFinite(progress) ? progress : null,
    nozzle_temp: Number(payload.nozzle_temper),
    nozzle_target_temp: Number(payload.nozzle_target_temper),
    bed_temp: Number(payload.bed_temper),
    bed_target_temp: Number(payload.bed_target_temper),
    current_file: String(payload.subtask_name || payload.gcode_file || payload.file || "") || null,
    remaining_seconds: Number.isFinite(remainingMinutes) ? Math.max(0, remainingMinutes * 60) : null,
    created_at: new Date().toISOString(),
    raw_payload: { ...(impressora.latest_status?.raw_payload || {}), ...payload, source: "android_lan_mqtt" }
  };
  const estadoAtual = getPrinterCurrentStatus(impressora);
  bambuLanState.previousStates[impressora.id] = estadoAtual;
  if (["printing", "paused"].includes(estadoAnterior) && estadoAtual === "finished") {
    setTimeout(() => abrirConfirmacaoConclusaoImpressaoBambu(impressora.id), 120);
  }
  if (["printing", "paused"].includes(estadoAnterior) && estadoAtual === "error") {
    setTimeout(() => registrarFalhaImpressaoBambu(impressora.id), 120);
  }
  if (visualAnterior !== getBambuVisualFingerprint(impressora, context)) agendarRenderStatusBambu(impressora, context);
}

async function abrirConfiguracaoBambuLan(printerId = "", context = {}) {
  const { bambuLanState, document, escaparAttr, escaparHtml, getPrinterById, mostrarToast, promoverPopupParaDialogUiV3, renderUiIcon } = context;
  const plugin = getBambuLanPlugin(context);
  const impressora = getPrinterById(printerId);
  const popup = document.getElementById("popup");
  if (!popup) return;
  if (!plugin) {
    mostrarToast("A conexão LAN direta está disponível somente no APK piloto Android.", "info", 4800);
    return;
  }
  await hidratarBambuLanState(context);
  bambuLanState.printerId = printerId || bambuLanState.printerId;
  popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()"><form class="modal-card printer-lan-modal" id="bambuLanForm" onclick="event.stopPropagation()"><div class="modal-header"><div><span class="eyebrow">Conexão direta no celular</span><h2>Conectar ${escaparHtml(impressora?.name || "Bambu")} pela rede local</h2></div><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div><p class="muted">O celular e a impressora precisam estar no mesmo Wi-Fi. O código LAN fica protegido pelo Android e não é enviado ao Simplifica.</p><div class="form-grid"><label class="field"><span>IP da impressora</span><input id="bambuLanIp" inputmode="decimal" autocomplete="off" required value="${escaparAttr(bambuLanState.ip)}" placeholder="Ex.: 192.168.1.120"></label><label class="field"><span>Número de série</span><input id="bambuLanSerial" autocomplete="off" required value="${escaparAttr(bambuLanState.serial)}" placeholder="Ex.: 01S00A..."></label><label class="field field-wide"><span>Código de acesso LAN</span><input id="bambuLanAccessCode" type="password" autocomplete="off" ${bambuLanState.configured ? "" : "required"} placeholder="${bambuLanState.configured ? "Mantido com segurança; deixe vazio para reutilizar" : "Código exibido em Configurações > WLAN"}"></label></div><div class="printer-lan-note">${renderUiIcon("seguranca")} <span>Conexão MQTT/TLS direta nas portas locais da Bambu. Nenhuma senha da conta Bambu é utilizada.</span></div><div class="actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button>${bambuLanState.connected ? `<button class="btn secondary" type="button" onclick="desconectarBambuLan()">Desconectar</button>` : ""}<button class="btn" id="bambuLanConnectButton" type="submit">Conectar e testar</button></div></form></div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Conexão local Bambu" });
  document.getElementById("bambuLanForm")?.addEventListener("submit", (event) => conectarBambuLan(event, printerId, context));
}

async function conectarBambuLan(event, printerId = "", context = {}) {
  const { abrirPainelImpressora, bambuLanState, document, fecharPopup, mostrarToast, registrarDiagnostico, setBotaoLoading } = context;
  event?.preventDefault?.();
  const plugin = getBambuLanPlugin(context);
  if (!plugin) return;
  const button = document.getElementById("bambuLanConnectButton");
  const ip = String(document.getElementById("bambuLanIp")?.value || "").trim();
  const serial = String(document.getElementById("bambuLanSerial")?.value || "").trim();
  const accessCode = String(document.getElementById("bambuLanAccessCode")?.value || "").trim();
  try {
    setBotaoLoading(button, true, "Conectando...");
    bambuLanState.printerId = printerId || bambuLanState.printerId;
    await hidratarBambuLanState(context);
    const result = await plugin.connect({ ip, serial, accessCode });
    Object.assign(bambuLanState, { configured: true, connected: true, connectionMode: "lan", connectionState: "connected", ip, serial, printerId });
    aplicarStatusBambuLan(result, printerId, context);
    mostrarToast("Bambu conectada diretamente ao celular. Aguardando telemetria...", "sucesso", 4200);
    fecharPopup();
    setTimeout(async () => {
      try {
        const status = await plugin.getStatus();
        aplicarStatusBambuLan(status, printerId, context);
        abrirPainelImpressora(printerId);
      } catch (_) {}
    }, 1800);
  } catch (erro) {
    registrarDiagnostico("Impressoras", "Falha ao conectar Bambu pela rede local", erro?.message || String(erro), { silent: true });
    mostrarToast("Não foi possível conectar à impressora. Confira o IP, o número de série, o código LAN e se os aparelhos estão no mesmo Wi-Fi.", "erro", 6000);
  } finally {
    setBotaoLoading(button, false);
  }
}

async function desconectarBambuLan(context = {}) {
  const { bambuLanState, fecharPopup, mostrarToast } = context;
  try {
    await getBambuLanPlugin(context)?.disconnect?.();
  } catch (_) {}
  Object.assign(bambuLanState, { connected: false, connectionMode: "none", connectionState: "disconnected" });
  fecharPopup();
  mostrarToast("Conexão LAN encerrada.", "info");
}

async function atualizarFrameCameraBambuLan(printerId = "", context = {}) {
  const { document } = context;
  const image = document.getElementById("bambuLanCameraImage");
  const status = document.getElementById("bambuLanCameraStatus");
  const plugin = getBambuLanPlugin(context);
  if (!image || !plugin) return;
  try {
    if (status) status.textContent = "Carregando imagem...";
    const frame = await plugin.getCameraFrame({});
    if (frame?.dataUrl) image.src = frame.dataUrl;
    if (status) status.textContent = "Imagem recebida diretamente da impressora";
  } catch (erro) {
    if (status) status.textContent = erro?.message || "Câmera indisponível.";
  }
}

function abrirCameraImpressora(id, context = {}) {
  const { bambuLanState, document, escaparAttr, escaparHtml, getPrinterById, mostrarToast, promoverPopupParaDialogUiV3 } = context;
  const impressora = getPrinterById(id);
  const streamUrl = getPrinterCameraStreamUrl(impressora, context);
  const cameraLan = Boolean(getBambuLanPlugin(context) && bambuLanState.configured);
  if (!impressora || (!streamUrl && !cameraLan)) {
    if (impressora && isBambuPrinterCandidate(impressora, context) && getBambuLanPlugin(context)) {
      mostrarToast("Para abrir a câmera, configure IP e código LAN desta impressora.", "info", 4800);
      setTimeout(() => abrirConfiguracaoBambuLan(impressora.id, context), 100);
      return;
    }
    mostrarToast("Streaming da câmera ainda não está disponível para esta conexão.", "info", 4200);
    return;
  }
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `<div class="modal-backdrop printer-camera-modal-backdrop" role="dialog" aria-modal="true" onclick="abrirPainelImpressora('${escaparAttr(id)}')"><section class="modal-card printer-camera-modal" onclick="event.stopPropagation()"><header><div><span class="eyebrow">Câmera ao vivo</span><h2>${escaparHtml(impressora.name || "Impressora")}</h2></div><button class="icon-button" type="button" onclick="abrirPainelImpressora('${escaparAttr(id)}')" title="Voltar">✕</button></header><div class="printer-camera-stream"><img id="bambuLanCameraImage" ${streamUrl ? `src="${escaparAttr(streamUrl)}"` : ""} alt="Transmissão da câmera de ${escaparAttr(impressora.name || "impressora")}"></div><div class="printer-camera-footer"><p class="muted" id="bambuLanCameraStatus">${streamUrl ? "Transmissão somente leitura." : "Preparando conexão direta com a câmera..."}</p>${cameraLan && !streamUrl ? `<button class="btn secondary" type="button" onclick="atualizarFrameCameraBambuLan('${escaparAttr(id)}')">Atualizar imagem</button>` : ""}</div></section></div>`;
  promoverPopupParaDialogUiV3(popup, { title: `Câmera de ${impressora.name || "impressora"}` });
  if (cameraLan && !streamUrl) setTimeout(() => atualizarFrameCameraBambuLan(id, context), 60);
}



function abrirPainelImpressora(id, callerContext = {}, context = {}) {
  const { configurarAcoesCadastroImpressora, document, escaparAttr, escaparHtml, formatarDataHora, formatarTemperaturaImpressora, getBambuAmsSlots, getPrinterById, getPrinterDisplayModel, getPrinterMonitoringService, getPrinterProgressValue, getTarefaVinculadaImpressoraBambu, isBambuPrinterCandidate, isMobile, productionJobs, promoverPopupParaDialogUiV3, renderUiIcon, requestAnimationFrame } = context;
  const impressora = getPrinterById(id);
  if (!impressora) return;
  const latest = impressora.latest_status || {};
  const pedidoVinculado = getPedidoVinculadoImpressora(impressora, context);
  const productionJob = callerContext.productionJob
    || getTarefaVinculadaImpressoraBambu(id)
    || productionJobs.find((job) => pedidoVinculado && String(job.orderId || job.order_id || "") === String(pedidoVinculado.id)
      && !["pronto_para_entrega", "entregue", "cancelado"].includes(String(job.status || "")))
    || null;
  const raw = latest.raw_payload || {};
  const slots = getBambuAmsSlots(raw);
  const progresso = getPrinterProgressValue(latest.progress_percent);
  const camadaAtual = Number(raw.layer_num);
  const camadasTotal = Number(raw.total_layer_num);
  const abertoPelaProducao = callerContext.source === "production" || Boolean(callerContext.productionPrinter || callerContext.productionJob);
  const somenteDadosBasicos = impressora.connector_type === "bambu"
    && impressora.connection_status === "connected"
    && !latest.current_file
    && !Number.isFinite(progresso)
    && !Number.isFinite(Number(latest.nozzle_temp))
    && !Number.isFinite(Number(latest.bed_temp));
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop printer-device-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card printer-device-panel ${abertoPelaProducao ? "is-production-context" : "is-printer-context"}" data-printer-live-id="${escaparAttr(impressora.id)}" onclick="event.stopPropagation()">
        <header class="printer-device-panel-header">
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Voltar">←</button>
          <div><h2>${escaparHtml(impressora.name || "Impressora")}</h2><span><span data-printer-live="status">${renderPrinterStatusBadge(impressora, context)}</span> ${escaparHtml(getPrinterDisplayModel(impressora))}</span></div>
          ${abertoPelaProducao ? `<span class="printer-panel-readonly-mark" title="Acompanhamento somente leitura">${renderUiIcon("seguranca")}</span>` : `<button class="icon-button" type="button" onclick="fecharPopup();setTimeout(()=>abrirCadastroImpressora('${escaparAttr(impressora.id)}'),80)" title="Editar">${renderUiIcon("edit")}</button>`}
        </header>
        <section class="printer-device-hero" aria-label="Resumo da impressora">
          <div class="printer-device-hero-temperature"><span>Bico</span><strong data-printer-live="nozzle">${formatarTemperaturaImpressora(latest.nozzle_temp)}</strong></div>
          <div class="printer-device-hero-art">${renderUiIcon("impressoras")}<span>${escaparHtml(getPrinterDisplayModel(impressora))}</span></div>
          <div class="printer-device-hero-temperature"><span>Mesa</span><strong data-printer-live="bed">${formatarTemperaturaImpressora(latest.bed_temp)}</strong></div>
        </section>
        <div class="printer-device-overview-grid monitoring-only">
        <section class="printer-device-job">
          <div class="printer-device-job-copy"><span class="printer-device-file-icon">${renderUiIcon("producao")}</span><div><strong data-printer-live="file">${escaparHtml(latest.current_file || productionJob?.itemName || (somenteDadosBasicos ? "Impressão não informada pela nuvem" : "Nenhuma impressão em andamento"))}</strong><span><b data-printer-live="progress-text">${Number.isFinite(progresso) ? `${Math.round(progresso)}%` : "—"}</b> · <b data-printer-live="remaining">${escaparHtml(getPrinterMonitoringService()?.formatDuration(latest.remaining_seconds) || "Tempo não informado")}</b></span><small data-printer-live="layer">${Number.isFinite(camadaAtual) && Number.isFinite(camadasTotal) ? `Camada ${camadaAtual}/${camadasTotal}` : productionJob ? `Pedido #${escaparHtml(productionJob.orderId || productionJob.order_id || "-")}` : ""}</small></div></div>
          <div class="printer-progress" data-printer-live="progress" ${Number.isFinite(progresso) ? "" : "hidden"}><i style="--progress:${Math.max(0, Math.min(100, progresso || 0))}%"></i><span data-printer-live="progress-text">${Number.isFinite(progresso) ? Math.round(progresso) : "—"}%</span></div>
          <p class="printer-read-only-notice">${renderUiIcon("seguranca")} Acompanhamento somente leitura.</p>
          <div class="printer-device-order-link">
            ${productionJob
              ? `<button class="btn secondary" type="button" onclick="abrirVinculoImpressaoBambuPedido('${escaparAttr(impressora.id)}','${escaparAttr(productionJob.id)}')">Editar vínculo com pedido</button>`
              : `<button class="btn secondary" type="button" onclick="abrirVinculoPedidoImpressora('${escaparAttr(impressora.id)}')">${pedidoVinculado ? `Pedido #${escaparHtml(pedidoVinculado.id)}` : "Vincular pedido"}</button>`}
          </div>
        </section>
        </div>
        ${productionJob ? renderResumoPlacasImpressora(productionJob, latest, context) : ""}
        <section class="printer-device-controls">
          <div class="printer-device-section-title"><div><span class="eyebrow">Dispositivo</span><h3>Estado da máquina</h3></div><button class="btn ghost" id="printerPanelRefresh" type="button" onclick="atualizarStatusImpressora('${escaparAttr(impressora.id)}')">Atualizar</button></div>
          <div class="printer-device-metric-grid">
            <article><i>${renderUiIcon("time")}</i><div><span>Bico</span><strong data-printer-live="nozzle">${formatarTemperaturaImpressora(latest.nozzle_temp)}</strong><small>Alvo ${formatarTemperaturaImpressora(latest.nozzle_target_temp)}</small></div></article>
            <article><i>${renderUiIcon("impressoras")}</i><div><span>Mesa</span><strong data-printer-live="bed">${formatarTemperaturaImpressora(latest.bed_temp)}</strong><small>Alvo ${formatarTemperaturaImpressora(latest.bed_target_temp)}</small></div></article>
            <article><i>${renderUiIcon("camera")}</i><div><span>Câmara</span><strong>${formatarTemperaturaImpressora(raw.chamber_temper)}</strong><small>Leitura recebida</small></div></article>
            <article><i>${renderUiIcon("rede")}</i><div><span>Conexão</span><strong>${escaparHtml(somenteDadosBasicos ? "Conta conectada" : impressora.connection_status === "connected" ? "Online" : impressora.connection_status || "Aguardando")}</strong><small>${somenteDadosBasicos ? "Dados básicos; telemetria local ausente" : impressora.last_seen_at ? escaparHtml(formatarDataHora(impressora.last_seen_at)) : "Sem sincronização"}</small></div></article>
          </div>
        </section>
        <section class="printer-device-ams">
          <div class="printer-device-section-title"><div><span class="eyebrow">Filamentos</span><h3>AMS</h3></div><span class="status-badge">${slots.length} slot(s)</span></div>
          ${slots.length ? `<div class="printer-ams-grid">${slots.map((slot) => `<article><i style="--filament-color:${escaparAttr(slot.color)}"></i><strong>${escaparHtml(slot.type)}</strong><span>Slot ${escaparHtml(slot.id)}</span>${Number.isFinite(slot.remain) ? `<small>${Math.round(slot.remain)}% restante</small>` : ""}</article>`).join("")}</div>` : `<p class="empty">Os dados do AMS aparecerão aqui quando forem recebidos da impressora.</p>`}
        </section>
        <section class="printer-machine-history" aria-labelledby="printerMachineHistoryTitle">
          <div class="printer-device-section-title"><div><span class="eyebrow">Produção registrada</span><h3 id="printerMachineHistoryTitle">Histórico de impressão</h3></div>${abertoPelaProducao ? "" : `<button class="btn ghost" type="button" onclick="abrirHistoricoImpressora('${escaparAttr(impressora.id)}')">Ver completo</button>`}</div>
          <div class="printer-machine-history-list" id="printerMachineHistoryList"><p class="empty">Carregando histórico da máquina...</p></div>
        </section>
        <footer class="printer-device-panel-actions">
          ${abertoPelaProducao ? "" : `
            <button class="btn secondary" type="button" onclick="abrirVinculoPedidoImpressora('${escaparAttr(impressora.id)}')">${pedidoVinculado ? `Pedido #${escaparHtml(pedidoVinculado.id)}` : "Vincular pedido"}</button>
            <button class="btn secondary" type="button" onclick="abrirHistoricoImpressora('${escaparAttr(impressora.id)}')">Histórico</button>
            ${isBambuPrinterCandidate(impressora) && !impressora.credentials_configured ? `<button class="btn" type="button" onclick="abrirLoginBambu('${escaparAttr(impressora.id)}')">Conectar Bambu</button>` : ""}
            ${renderPrinterMoreActions(impressora, context)}
          `}
        </footer>
      </section>
    </div>`;
  const printerOverlay = promoverPopupParaDialogUiV3(popup, { title: `Painel de ${impressora.name || "impressora"}`, wide: true, fullscreen: isMobile() });
  requestAnimationFrame(() => printerOverlay?.querySelector?.(".ui3-dialog")?.scrollTo?.({ top: 0, behavior: "auto" }));
  configurarAcoesCadastroImpressora();
  setTimeout(() => carregarHistoricoCompactoImpressora(impressora.id, productionJob, context), 0);
}

function renderResumoPlacasImpressora(job = {}, latest = {}, context = {}) {
  const { escaparHtml, getPrinterMonitoringService } = context;
  const totalPlacas = Math.max(1, Number(job.printPlatesTotal || job.print_plates_total) || 1);
  const placasConcluidas = Math.max(0, Number(job.printPlatesCompleted || job.print_plates_completed) || 0);
  const pesoTotal = Math.max(0, Number(job.filamentWeightGrams || job.filament_weight_grams) || 0);
  const tempoEstimadoTotal = Math.max(0, Number(job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0);
  const tempoRealTotal = Math.max(0, Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes) || 0);
  const pesoPlaca = pesoTotal > 0 ? pesoTotal / totalPlacas : 0;
  const tempoEstimadoPlaca = tempoEstimadoTotal > 0 ? tempoEstimadoTotal / totalPlacas : 0;
  const tempoRealPlaca = tempoRealTotal > 0 ? tempoRealTotal / Math.max(1, placasConcluidas) : 0;
  const placaAtual = Math.min(totalPlacas, placasConcluidas + 1);
  const formatMinutes = (minutes) => minutes > 0
    ? (getPrinterMonitoringService()?.formatDuration(Math.round(minutes * 60)) || `${Math.round(minutes)} min`)
    : "Não informado";
  return `<section class="printer-plate-summary">
    <div class="printer-device-section-title"><div><span class="eyebrow">Pedido #${escaparHtml(job.orderId || job.order_id || "-")}</span><h3>Placa ${placaAtual} de ${totalPlacas}</h3></div><span class="status-badge">${placasConcluidas}/${totalPlacas} concluída(s)</span></div>
    <div class="printer-plate-metrics">
      <article><span>Peso desta placa</span><strong>${pesoPlaca > 0 ? `${pesoPlaca.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} g` : "Não informado"}</strong><small>Total ${pesoTotal > 0 ? `${pesoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} g` : "—"}</small></article>
      <article><span>Tempo estimado</span><strong>${formatMinutes(tempoEstimadoPlaca)}</strong><small>por placa</small></article>
      <article><span>Tempo real médio</span><strong>${formatMinutes(tempoRealPlaca)}</strong><small>${placasConcluidas ? `${placasConcluidas} placa(s) medida(s)` : "Aguardando conclusão"}</small></article>
      <article><span>Tempo restante</span><strong>${getPrinterMonitoringService()?.formatDuration(latest.remaining_seconds) || "Não informado"}</strong><small>leitura da máquina</small></article>
    </div>
  </section>`;
}

async function carregarHistoricoCompactoImpressora(printerId, job = null, context = {}) {
  const { document, escaparHtml, formatarDataHora, getPrinterMonitoringService, getPrinterProgressValue, getProductionStatusLabel, printerBackendRequest, productionEvents, renderResumoDesperdicioImpressora } = context;
  const target = document.getElementById("printerMachineHistoryList");
  if (!target) return;
  try {
    const data = await printerBackendRequest("history", { printer_id: printerId });
    if (!document.getElementById("printerMachineHistoryList")) return;
    const events = Array.isArray(data?.events) ? data.events.slice(0, 4) : [];
    const snapshots = Array.isArray(data?.snapshots) ? data.snapshots.slice(0, 4) : [];
    const localEvents = job ? productionEvents.filter((item) => String(item.productionJobId || item.production_job_id || "") === String(job.id)).slice(-4).reverse() : [];
    const rows = [
      ...localEvents.map((item) => ({ title: item.note || getProductionStatusLabel(item.newStatus || item.new_status), meta: formatarDataHora(item.created_at), tone: item.eventType || item.event_type || "produção" })),
      ...events.map((item) => ({ title: item.message || item.event_type || "Evento da impressora", meta: formatarDataHora(item.created_at), tone: item.event_type || "máquina" })),
      ...snapshots.map((item) => ({ title: `${getPrinterMonitoringService()?.status(item.normalized_state)?.label || item.normalized_state || "Estado registrado"}${item.current_file ? ` · ${item.current_file}` : ""}`, meta: `${formatarDataHora(item.created_at)}${Number.isFinite(getPrinterProgressValue(item.progress_percent)) ? ` · ${Math.round(getPrinterProgressValue(item.progress_percent))}%` : ""}`, tone: "snapshot" }))
    ].slice(0, 6);
    target.innerHTML = `${renderResumoDesperdicioImpressora(printerId)}${rows.length ? rows.map((row) => `<article><i aria-hidden="true"></i><div><strong>${escaparHtml(row.title)}</strong><span>${escaparHtml(row.meta)}</span></div><small>${escaparHtml(row.tone)}</small></article>`).join("") : `<p class="empty">Nenhuma impressão registrada para esta máquina.</p>`}`;
  } catch (erro) {
    target.innerHTML = `<p class="empty">Histórico indisponível agora. Use “Ver completo” para tentar novamente.</p>`;
  }
}

function getPrinterConnectorLabel(value = "", context = {}) {
  const { getPrinterMonitoringService } = context;
  return getPrinterMonitoringService()?.connector(value)?.name || String(value || "Manual");
}

function renderPrinterStatusBadge(impressora = {}, context = {}) {
  const { escaparAttr, escaparHtml, getPrinterCurrentStatus, getPrinterMonitoringService, getPrinterProgressValue } = context;
  const state = getPrinterCurrentStatus(impressora);
  const latest = impressora.latest_status || {};
  if (impressora.connector_type === "bambu" && impressora.connection_status === "connected" && latest.raw_payload?.online === true
    && !latest.current_file && !Number.isFinite(getPrinterProgressValue(latest.progress_percent))) {
    return `<span class="printer-status-badge status-muted"><i aria-hidden="true"></i>Conectada · dados básicos</span>`;
  }
  const config = getPrinterMonitoringService()?.status(state) || { label: state, tone: "muted" };
  return `<span class="printer-status-badge status-${escaparAttr(config.tone)}"><i aria-hidden="true"></i>${escaparHtml(config.label)}</span>`;
}

function renderPrinterMoreActions(impressora = {}, context = {}) {
  const { escaparAttr, isBambuPrinterCandidate, podeGerenciarImpressoras, podeOperarImpressoras } = context;
  const automatico = String(impressora.connector_type || "manual") !== "manual";
  const podeGerenciar = podeGerenciarImpressoras();
  const podeOperar = podeOperarImpressoras();
  const actions = [
    isBambuPrinterCandidate(impressora) && podeGerenciar && !impressora.credentials_configured ? `<button type="button" onclick="abrirLoginBambu('${escaparAttr(impressora.id)}')">Conectar Bambu</button>` : "",
    impressora.connector_type === "bambu" && impressora.credentials_configured && podeGerenciar ? `<button type="button" onclick="desconectarContaBambu('${escaparAttr(impressora.id)}')">Desconectar Bambu</button>` : "",
    !automatico && podeOperar ? `<button type="button" onclick="abrirStatusManualImpressora('${escaparAttr(impressora.id)}')">Atualizar status manual</button>` : "",
    podeOperar ? `<button type="button" onclick="abrirVinculoPedidoImpressora('${escaparAttr(impressora.id)}')">Vincular pedido</button>` : "",
    `<button type="button" onclick="abrirHistoricoImpressora('${escaparAttr(impressora.id)}')">Histórico</button>`,
    podeGerenciar ? `<button type="button" onclick="fecharPopup();setTimeout(()=>abrirCadastroImpressora('${escaparAttr(impressora.id)}'),80)">Editar cadastro</button>` : "",
    podeGerenciar ? `<button class="danger" type="button" onclick="desativarImpressora('${escaparAttr(impressora.id)}')">Remover impressora</button>` : ""
  ].filter(Boolean);
  return actions.length ? `<button class="btn ghost printer-more-button" type="button" onclick="abrirMenuAcoesImpressora('${escaparAttr(impressora.id)}')">Mais <span aria-hidden="true">⋮</span></button>` : "";
}

function abrirMenuAcoesImpressora(id, context = {}) {
  const { document, escaparAttr, escaparHtml, getPrinterById, isBambuPrinterCandidate, podeGerenciarImpressoras, podeOperarImpressoras, promoverPopupParaDialogUiV3 } = context;
  const impressora = getPrinterById(id);
  const popup = document.getElementById("popup");
  if (!impressora || !popup) return;
  const automatico = String(impressora.connector_type || "manual") !== "manual";
  const podeGerenciar = podeGerenciarImpressoras();
  const podeOperar = podeOperarImpressoras();
  const actions = [
    isBambuPrinterCandidate(impressora) && podeGerenciar && !impressora.credentials_configured ? `<button type="button" onclick="fecharPopup();setTimeout(()=>abrirLoginBambu('${escaparAttr(id)}'),80)">Conectar conta Bambu</button>` : "",
    impressora.connector_type === "bambu" && impressora.credentials_configured && podeGerenciar ? `<button type="button" onclick="fecharPopup();setTimeout(()=>desconectarContaBambu('${escaparAttr(id)}'),80)">Desconectar conta Bambu</button>` : "",
    !automatico && podeOperar ? `<button type="button" onclick="fecharPopup();setTimeout(()=>abrirStatusManualImpressora('${escaparAttr(id)}'),80)">Atualizar status manual</button>` : "",
    podeOperar ? `<button type="button" onclick="fecharPopup();setTimeout(()=>abrirVinculoPedidoImpressora('${escaparAttr(id)}'),80)">Vincular pedido</button>` : "",
    `<button type="button" onclick="fecharPopup();setTimeout(()=>abrirHistoricoImpressora('${escaparAttr(id)}'),80)">Histórico</button>`,
    podeGerenciar ? `<button type="button" onclick="fecharPopup();setTimeout(()=>abrirCadastroImpressora('${escaparAttr(id)}'),80)">Editar cadastro</button>` : "",
    podeGerenciar ? `<button class="danger" type="button" onclick="fecharPopup();setTimeout(()=>desativarImpressora('${escaparAttr(id)}'),80)">Remover impressora</button>` : ""
  ].filter(Boolean);
  popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()"><section class="modal-card printer-actions-sheet" onclick="event.stopPropagation()"><div class="modal-header"><h2>${escaparHtml(impressora.name || "Impressora")}</h2><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div><div class="printer-actions-sheet-list">${actions.join("")}</div></section></div>`;
  promoverPopupParaDialogUiV3(popup, { title: impressora.name || "Ações da impressora", kind: "sheet" });
}

function getPedidoVinculadoImpressora(impressora = {}, context = {}) {
  const { pedidos } = context;
  const link = impressora.active_order_link;
  if (!link?.order_id) return null;
  return pedidos.find((pedido) => String(pedido.id) === String(link.order_id)) || { id: link.order_id };
}

function getTextoTrabalhoImpressora(impressora = {}, context = {}) {
  const latest = impressora.latest_status || {};
  const pedido = getPedidoVinculadoImpressora(impressora, context);
  return String(latest.job_name || latest.current_file || latest.file_name || pedido?.descricao || pedido?.nome || "Impressão atual")
    .replace(/\.(gcode|3mf)$/i, "")
    .trim() || "Impressão atual";
}

function getConexaoAtualImpressora(impressora = {}, context = {}) {
  const { normalizarDataLocal } = context;
  const conectado = impressora.connection_status === "connected";
  const automatico = String(impressora.connector_type || "manual") !== "manual";
  const ultimoSinal = normalizarDataLocal(impressora.last_seen_at || "", null);
  const sinalRecente = ultimoSinal && Math.abs(Date.now() - ultimoSinal.getTime()) <= 15 * 60 * 1000;
  return {
    online: conectado && (!automatico || sinalRecente),
    ultimoSinal
  };
}

function isImpressoraBambu(impressora = {}, context = {}) {
  const { getPrinterDisplayBrand, getPrinterDisplayModel, normalizarTextoBusca } = context;
  return String(impressora.connector_type || "").toLowerCase() === "bambu"
    || normalizarTextoBusca(`${getPrinterDisplayBrand(impressora)} ${getPrinterDisplayModel(impressora)}`).includes("bambu");
}

function temNumeroImpressora(valor) {
  if (valor === null || valor === undefined || valor === "") return false;
  return Number.isFinite(Number(valor));
}

function abrirPainelImpressoraSimplifica(id, context = {}) {
  const { document, escaparAttr, escaparHtml, formatarDataHora, formatarTemperaturaImpressora, getPrinterById, getPrinterDisplayBrand, getPrinterDisplayModel, getPrinterMonitoringService, podeGerenciarImpressoras, promoverPopupParaDialogUiV3, renderUiIcon } = context;
  const impressora = getPrinterById(id);
  const popup = document.getElementById("popup");
  if (!impressora || !popup) return;
  const latest = impressora.latest_status || {};
  const temProgresso = temNumeroImpressora(latest.progress_percent);
  const progressoNumero = temProgresso ? Number(latest.progress_percent) : 0;
  const progresso = Math.max(0, Math.min(100, Math.round(progressoNumero)));
  const tempo = temNumeroImpressora(latest.remaining_seconds) && Number(latest.remaining_seconds) > 0
    ? (getPrinterMonitoringService()?.formatDuration(latest.remaining_seconds) || "—")
    : "—";
  const tempoDecorrido = temNumeroImpressora(latest.elapsed_seconds) && Number(latest.elapsed_seconds) > 0
    ? (getPrinterMonitoringService()?.formatDuration(latest.elapsed_seconds) || "—")
    : "—";
  const camadaAtual = Number(latest.current_layer ?? latest.layer_current);
  const totalCamadas = Number(latest.total_layers ?? latest.layer_total);
  const camada = Number.isFinite(camadaAtual) && camadaAtual > 0
    ? `${Math.round(camadaAtual)}${Number.isFinite(totalCamadas) && totalCamadas > 0 ? ` de ${Math.round(totalCamadas)}` : ""}`
    : "—";
  const conexao = getConexaoAtualImpressora(impressora, context);
  const estadoAtual = String(latest.normalized_state || latest.state || "unknown").toLowerCase();
  const imprimindo = estadoAtual === "printing" || temProgresso || !!latest.current_file || !!latest.job_name;
  const tituloEstado = imprimindo ? "Imprimindo" : conexao.online ? "Disponível" : "Sem conexão recente";
  const descricaoEstado = imprimindo
    ? getTextoTrabalhoImpressora(impressora, context)
    : conexao.online ? "Conectada e pronta para o próximo trabalho" : "Toque em Atualizar para tentar receber um novo sinal";
  const detalhes = [
    ["Modelo", getPrinterDisplayModel(impressora, context), getPrinterDisplayBrand(impressora, context)],
    temNumeroImpressora(latest.nozzle_temp) ? ["Bico", formatarTemperaturaImpressora(latest.nozzle_temp), temNumeroImpressora(latest.nozzle_target_temp) ? `Alvo ${formatarTemperaturaImpressora(latest.nozzle_target_temp)}` : ""] : null,
    temNumeroImpressora(latest.bed_temp) ? ["Mesa", formatarTemperaturaImpressora(latest.bed_temp), temNumeroImpressora(latest.bed_target_temp) ? `Alvo ${formatarTemperaturaImpressora(latest.bed_target_temp)}` : ""] : null,
    camada !== "—" ? ["Camada", camada, "Andamento da placa"] : null,
    tempoDecorrido !== "—" ? ["Tempo impresso", tempoDecorrido, ""] : null,
    tempo !== "—" ? ["Tempo restante", tempo, ""] : null
  ].filter(Boolean);
  const nomeTrabalho = getTextoTrabalhoImpressora(impressora, context);
  const bambuSemConta = isImpressoraBambu(impressora, context) && !impressora.credentials_configured;
  const temDadosImpressao = imprimindo || detalhes.length > 1;
  popup.innerHTML = `
    <div class="modal-backdrop printer-simple-monitor-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card printer-simple-monitor" onclick="event.stopPropagation()">
        <div class="modal-header printer-simple-monitor-head">
          <div><span class="eyebrow">Sua impressora</span><h2>${escaparHtml(impressora.name || "Impressora")}</h2></div>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar" aria-label="Fechar">✕</button>
        </div>
        <section class="printer-simple-job printer-simple-overview">
          <span class="printer-device-icon">${renderUiIcon("impressoras")}</span>
          <div><span class="printer-friendly-state">${escaparHtml(tituloEstado)}</span><strong>${escaparHtml(descricaoEstado)}</strong></div>
        </section>
        ${imprimindo ? `<section class="printer-current-work"><span>Placa / trabalho</span><strong>${escaparHtml(nomeTrabalho)}</strong></section>` : ""}
        ${imprimindo && temProgresso ? `<div class="printer-simple-progress" aria-label="Progresso da impressão: ${progresso}%"><i style="--progress:${progresso}%"></i><strong>${progresso}%</strong></div>` : ""}
        ${detalhes.length ? `<section class="printer-simple-details"><h3>Informações da impressora</h3><div class="printer-simple-monitor-grid">${detalhes.map(([rotulo, valor, complemento]) => `<div><span>${escaparHtml(rotulo)}</span><strong>${escaparHtml(valor)}</strong>${complemento ? `<small>${escaparHtml(complemento)}</small>` : ""}</div>`).join("")}</div></section>` : ""}
        ${bambuSemConta ? `<p class="printer-data-notice">Conecte sua conta BambuLab para receber trabalho, progresso, tempo, camada e temperaturas.</p>` : !temDadosImpressao ? `<p class="printer-data-notice">A impressora está conectada. Os detalhes aparecerão quando ela enviar uma atualização completa.</p>` : ""}
        <p class="printer-simple-connection"><i class="${conexao.online ? "is-online" : ""}" aria-hidden="true"></i><span>${conexao.online ? "Online" : "Sem sinal"}</span><small>${impressora.last_seen_at ? `Último sinal: ${escaparHtml(formatarDataHora(impressora.last_seen_at))}` : "Aguardando atualização"}</small></p>
        <div class="actions printer-simple-monitor-actions">
          ${bambuSemConta ? `<button class="btn" type="button" onclick="fecharPopup();setTimeout(()=>abrirLoginBambu('${escaparAttr(impressora.id)}'),80)">Conectar BambuLab</button>` : ""}
          <button class="btn secondary" type="button" onclick="atualizarPainelImpressoraSimplifica('${escaparAttr(impressora.id)}')">${renderUiIcon("refresh")} Atualizar</button>
          ${podeGerenciarImpressoras(context) ? `<button class="btn ghost" type="button" onclick="fecharPopup();abrirCadastroImpressora('${escaparAttr(impressora.id)}')">${renderUiIcon("edit")} Editar</button>` : ""}
        </div>
      </section>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: impressora.name || "Impressora" });
}

async function atualizarPainelImpressoraSimplifica(id, context = {}) {
  const { abrirPainelImpressoraSimplifica: abrirPainel, atualizarStatusImpressora } = context;
  await atualizarStatusImpressora(id);
  if (typeof abrirPainel === "function") abrirPainel(id);
  else abrirPainelImpressoraSimplifica(id, context);
}

function renderCardImpressora(impressora = {}, context = {}) {
  const { canAccessFeature, escaparAttr, escaparHtml, formatarDataHora, formatarTemperaturaImpressora, getPrinterDisplayBrand, getPrinterDisplayModel, getPrinterMonitoringService, getPrinterProgressValue, podeGerenciarImpressoras, podeOperarImpressoras, renderUiIcon } = context;
  const latest = impressora.latest_status || {};
  const automatico = String(impressora.connector_type || "manual") !== "manual";
  const pedido = getPedidoVinculadoImpressora(impressora, context);
  const podeGerenciar = podeGerenciarImpressoras();
  const podeOperar = podeOperarImpressoras();
  const podeMonitorar = canAccessFeature({ feature: "printer_monitoring" }).allowed;
  const progresso = getPrinterProgressValue(latest.progress_percent);
  const atualizado = latest.created_at || impressora.last_seen_at || impressora.updated_at;
  return `
    <article class="printer-card" data-printer-id="${escaparAttr(impressora.id)}" data-printer-live-id="${escaparAttr(impressora.id)}" tabindex="0" role="button" aria-label="Abrir painel de ${escaparAttr(impressora.name || "impressora")}" onclick="if(!event.target.closest('button,select,a,input,textarea,details,summary')) abrirPainelImpressora('${escaparAttr(impressora.id)}')" onkeydown="if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button,select,a,input,textarea,details,summary')){event.preventDefault();abrirPainelImpressora('${escaparAttr(impressora.id)}')}">
      <header class="printer-card-header">
        <span class="printer-device-icon">${renderUiIcon("impressoras")}</span>
        <div>
          <h3>${escaparHtml(impressora.name || "Impressora")}</h3>
          <p>${escaparHtml(getPrinterDisplayBrand(impressora))} · ${escaparHtml(getPrinterDisplayModel(impressora))} · ${escaparHtml(getPrinterConnectorLabel(impressora.connector_type, context))}</p>
        </div>
        <span data-printer-live="status">${renderPrinterStatusBadge(impressora, context)}</span>
      </header>
      <div class="printer-progress" data-printer-live="progress" ${Number.isFinite(progresso) ? "" : "hidden"}><i style="--progress:${Math.max(0, Math.min(100, progresso || 0))}%"></i><span data-printer-live="progress-text">${Number.isFinite(progresso) ? Math.round(progresso) : "—"}%</span></div>
      <div class="printer-metrics">
        <div><span>Bico</span><strong data-printer-live="nozzle">${formatarTemperaturaImpressora(latest.nozzle_temp)}</strong></div>
        <div><span>Mesa</span><strong data-printer-live="bed">${formatarTemperaturaImpressora(latest.bed_temp)}</strong></div>
        <div><span>Tempo restante</span><strong data-printer-live="remaining">${escaparHtml(getPrinterMonitoringService()?.formatDuration(latest.remaining_seconds) || "—")}</strong></div>
        <div><span>Pedido</span><strong>${pedido ? `#${escaparHtml(pedido.id)}` : "Nenhum"}</strong></div>
      </div>
      <div class="printer-card-meta">
        <span>${impressora.connection_status === "connected" ? "Conectada" : impressora.connection_status === "not_configured" ? "Manual" : escaparHtml(impressora.connection_status || "Sem conexão")}</span>
        <span data-printer-live="updated">${atualizado ? `Atualizada ${escaparHtml(formatarDataHora(atualizado))}` : "Sem atualização automática"}</span>
        <span class="printer-current-file" data-printer-live="file" ${latest.current_file ? "" : "hidden"}>${escaparHtml(latest.current_file || "")}</span>
      </div>
      ${automatico && !podeMonitorar ? `<p class="printer-plan-note">A leitura automática não está disponível para este perfil.</p>` : ""}
      <div class="printer-card-actions">
        <button class="btn" type="button" onclick="abrirPainelImpressora('${escaparAttr(impressora.id)}')">Abrir painel</button>
        ${automatico && podeMonitorar ? `<button class="btn secondary" type="button" onclick="atualizarStatusImpressora('${escaparAttr(impressora.id)}')">${renderUiIcon("refresh")} Atualizar status</button>` : ""}
        ${renderPrinterMoreActions(impressora, context)}
      </div>
    </article>
  `;
}

function getBambuPilotProgressKey(context = {}) {
  const { BAMBU_PILOT_PROGRESS_STORAGE_PREFIX, getEscopoDadosAtual } = context;
  return `${BAMBU_PILOT_PROGRESS_STORAGE_PREFIX}:${getEscopoDadosAtual() || "local"}`;
}

function getBambuPilotProgress(context = {}) {
  const { BAMBU_PILOT_PROGRESS_DEFAULTS, carregarObjeto } = context;
  return carregarObjeto(getBambuPilotProgressKey(context), BAMBU_PILOT_PROGRESS_DEFAULTS);
}

function getBambuPilotProgressPercent(progress, context = {}) {
  if (progress === undefined) progress = getBambuPilotProgress(context);
  const steps = [
    "understoodUnofficial",
    "understoodNoPasswordStorage",
    "understoodRevocable",
    "acceptedReadOnlyPilot",
    "agentInstalled",
    "printerValidated"
  ];
  return Math.round((steps.filter((key) => progress[key] === true).length / steps.length) * 100);
}

function renderBambuPilotGuideCard(context = {}) {
  const progress = getBambuPilotProgress(context);
  const percent = getBambuPilotProgressPercent(progress, context);
  return `
    <section class="printer-pilot-card" aria-labelledby="bambuPilotTitle">
      <div class="printer-pilot-card-copy">
        <span class="app-badge warning">Piloto experimental</span>
        <h3 id="bambuPilotTitle">Acompanhar impressora Bambu</h3>
        <p>Prepare a conexão somente leitura pela conta Bambu ou pela rede local. Nenhuma senha é salva pelo Simplifica.</p>
        <small>A integração comunitária pode mudar, expirar ou ser revogada pela Bambu Lab sem aviso.</small>
      </div>
      <div class="printer-pilot-progress" aria-label="Progresso local do piloto: ${percent}%">
        <div><i style="--progress:${percent}%"></i></div>
        <strong>${percent}% preparado</strong>
        <button class="btn secondary" type="button" data-action="bambu-pilot-guide">Ver resumo e preparar</button>
      </div>
    </section>
  `;
}


function renderPrinterOrderQueue(context = {}) {
  const { PRODUCTION_PENDING_REASONS, clienteDoPedido, compararTarefasProducao, escaparAttr, escaparHtml, getPrinterQueueStage, getPrinterQueueStageLabel, getProductionOrder, getProductionPrinter, getRegisteredPrinterForProductionJob, productionJobs, renderProductionPrinterOptions, renderUiIcon, window } = context;
  const selected = ["fila", "impressao", "prontos"].includes(String(window.__printerQueueStage || ""))
    ? String(window.__printerQueueStage)
    : "fila";
  const activeJobs = productionJobs.filter((job) => getPrinterQueueStage(job) !== "arquivado");
  const jobs = activeJobs.filter((job) => getPrinterQueueStage(job) === selected).sort(compararTarefasProducao);
  const stages = [["fila", "Em fila"], ["impressao", "Imprimindo"], ["prontos", "Pronto"]];
  return `
    <section class="printer-order-queue" aria-labelledby="printerOrderQueueTitle">
      <div class="printer-order-queue-header">
        <div><span class="eyebrow">Pedidos para impressão</span><h3 id="printerOrderQueueTitle">Fila da produção</h3><p>Gerencie aqui somente a impressão. Pagamento e entrega continuam em Pedidos.</p></div>
        <button class="btn ghost" type="button" onclick="trocarTela('pedidos')">Abrir Pedidos</button>
      </div>
      <div class="printer-order-stages" role="tablist" aria-label="Etapas da impressão">
        ${stages.map(([value, label]) => {
          const count = activeJobs.filter((job) => getPrinterQueueStage(job) === value).length;
          return `<button type="button" role="tab" class="${selected === value ? "active" : ""}" aria-selected="${selected === value}" onclick="window.__printerQueueStage='${value}';renderizarPreservandoScroll()"><span>${label}</span><strong>${count}</strong></button>`;
        }).join("")}
      </div>
      <div class="printer-order-list">
        ${jobs.length ? jobs.map((job) => {
          const order = getProductionOrder(job) || {};
          const stage = getPrinterQueueStage(job);
          const nextStatus = stage === "fila" ? "em_impressao" : stage === "impressao" ? "pronto_para_entrega" : "";
          const nextLabel = stage === "fila" ? "Iniciar impressão" : stage === "impressao" ? "Marcar como pronto" : "";
          const registeredPrinter = getRegisteredPrinterForProductionJob(job);
          const assignedProductionPrinter = getProductionPrinter(job.printerId || job.printer_id || "");
          const productionPrinterName = registeredPrinter?.name || assignedProductionPrinter?.name || "";
          return `<article class="printer-order-row">
            <div class="printer-order-row-main"><strong>${escaparHtml(job.itemName || `Pedido #${job.orderId}`)}</strong><span>Pedido #${escaparHtml(job.orderId || "-")} · ${escaparHtml(job.customer || clienteDoPedido(order) || "Cliente não informado")}</span><button class="printer-order-printer-link ${registeredPrinter ? "" : "needs-setup"}" type="button" onclick="abrirImpressoraDaProducao('${escaparAttr(job.id)}')">${renderUiIcon(registeredPrinter ? "impressoras" : "plus")} <span>${escaparHtml(productionPrinterName || "Adicionar impressora")}</span><small>${registeredPrinter ? "Abrir painel" : productionPrinterName ? "Adicionar ao monitoramento" : "Nenhuma vinculada"}</small></button>${job.blockedReason ? `<small>${escaparHtml(PRODUCTION_PENDING_REASONS[job.blockedReason] || job.blockedReason)}</small>` : ""}</div>
            <span class="status-badge">${escaparHtml(getPrinterQueueStageLabel(stage))}</span>
            <div class="printer-order-row-actions">
              ${stage === "fila" ? `<select aria-label="Impressora do pedido" onchange="atribuirImpressoraTarefa('${escaparAttr(job.id)}',this.value)">${renderProductionPrinterOptions(job.printerId)}</select>` : ""}
              ${nextStatus ? `<button class="btn" type="button" onclick="atualizarStatusTarefaProducao('${escaparAttr(job.id)}','${nextStatus}')">${nextLabel}</button>` : `<button class="btn secondary" type="button" onclick="trocarTela('pedidos')">Ver em Pedidos</button>`}
            </div>
          </article>`;
        }).join("") : `<p class="empty">Nenhum pedido nesta etapa.</p>`}
      </div>
    </section>`;
}

function renderImpressoras(context = {}) {
  const { escaparHtml, getCurrentPlanSlug, getImpressorasAtivas, isMobile, isSimplificaMode, normalizarSlugPlano, podeGerenciarImpressoras, printerMonitoringState, renderAppButton, renderCardImpressora, renderResumoImpressoraSimplifica, renderUiIcon } = context;
  const items = getImpressorasAtivas();
  const podeGerenciar = podeGerenciarImpressoras();
  const plano = normalizarSlugPlano(getCurrentPlanSlug());

  if (printerMonitoringState.loading && !printerMonitoringState.loaded) {
    return `<section class="card printer-screen"><div class="printer-loading">${renderUiIcon("impressoras")}<strong>Carregando impressoras...</strong></div></section>`;
  }

  if (isSimplificaMode() || isMobile()) {
    return `
      <section class="card printer-screen printer-screen-simple">
        <div class="card-header">
          <div><span class="eyebrow">Produção</span><h2>${renderUiIcon("impressoras")} Impressoras</h2></div>
        </div>
        ${podeGerenciar ? `<div class="printer-add-centered">${renderAppButton({ label: "Adicionar impressora", icon: renderUiIcon("plus"), variant: "primary", extraClass: "compact-action", attrs: 'data-action="printer-add"' })}</div>` : ""}
        ${printerMonitoringState.error ? `<p class="printer-error">${escaparHtml(printerMonitoringState.error)}</p>` : ""}
        <div class="printer-summary-list">
          ${items.length ? items.map(renderResumoImpressoraSimplifica).join("") : `<p class="empty">Nenhuma impressora cadastrada.</p>`}
        </div>
        ${items.length ? `<p class="printer-simple-help">Toque em uma impressora para atualizar, vincular pedidos ou editar.</p>` : ""}
      </section>
    `;
  }

  return `
    <section class="printer-screen">
      <header class="printer-page-header">
        <div>
          <span class="eyebrow">Produção</span>
          <h2>Impressoras</h2>
          <p>Acompanhe suas máquinas e a impressão atual.</p>
        </div>
      </header>
      ${podeGerenciar ? `<div class="printer-add-centered">${renderAppButton({ label: "Adicionar impressora", icon: renderUiIcon("plus"), variant: "primary", extraClass: "compact-action", attrs: 'data-action="printer-add"' })}</div>` : ""}
      ${printerMonitoringState.error ? `<div class="printer-error"><span>${escaparHtml(printerMonitoringState.error)}</span><button class="btn ghost" onclick="hidratarImpressorasSeNecessario(true)">Tentar novamente</button></div>` : ""}
      <div class="printer-grid ${items.length ? "" : "is-empty"}">
        ${items.length ? items.map(renderCardImpressora).join("") : `
          <div class="printer-empty printer-empty-onboarding">
            ${renderUiIcon("impressoras")}
            <div class="printer-empty-copy">
              <strong>Adicione sua primeira impressora</strong>
              <p>Configure em poucos passos para acompanhar o status e a produção no Simplifica.</p>
            </div>
            ${podeGerenciar ? renderAppButton({ label: "Adicionar impressora", icon: renderUiIcon("plus"), variant: "primary", extraClass: "printer-empty-action", attrs: 'data-action="printer-add"' }) : ""}
            <small>Cadastro manual ilimitado. Automáticas: 1 no Free, até 3 no Start e sem limite no Pro.</small>
          </div>
        `}
      </div>
      ${renderPrinterOrderQueue(context)}
    </section>
  `;
}


function configurarAcoesCadastroImpressora(context = {}) {
  const { document } = context;
  document.querySelectorAll('[data-action="printer-add"], [data-action="printer-edit"]').forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      abrirCadastroImpressora(button.dataset.action === "printer-edit" ? button.dataset.printerId || "" : "", undefined, context);
    });
  });
  document.querySelectorAll('[data-action="bambu-pilot-guide"]').forEach((button) => {
    button.addEventListener("click", (...__args) => abrirGuiaPilotoBambu(context));
  });
}

function abrirGuiaPilotoBambu(context = {}) {
  const { document, escaparHtml, fecharPopup, getBambuPilotProgress, promoverPopupParaDialogUiV3, renderUiIcon } = context;
  const progress = getBambuPilotProgress();
  const popup = document.getElementById("popup");
  if (!popup) return;
  const items = [
    ["understoodUnofficial", "Entendi que esta é uma integração comunitária e experimental."],
    ["understoodNoPasswordStorage", "Entendi que o Simplifica não salva minha senha Bambu."],
    ["understoodRevocable", "Entendi que a Bambu pode alterar, limitar ou revogar esse acesso."],
    ["acceptedReadOnlyPilot", "Aceito iniciar o piloto somente para acompanhamento, sem comandos remotos."],
    ["agentInstalled", "O Agente Local Simplifica está instalado no computador que fará a conexão."],
    ["printerValidated", "A impressora já foi validada em uma impressão real de teste."]
  ];
  popup.innerHTML = `
    <div class="modal-backdrop printer-modal-backdrop" id="bambuPilotBackdrop" role="dialog" aria-modal="true" aria-labelledby="bambuPilotDialogTitle">
      <form class="modal-card printer-pilot-modal" id="bambuPilotForm">
        <div class="modal-header">
          <div><span class="eyebrow">Impressoras · piloto</span><h2 id="bambuPilotDialogTitle">Conectar uma conta Bambu com transparência</h2></div>
          <button class="icon-button" id="bambuPilotClose" type="button" title="Fechar">✕</button>
        </div>
        <div class="printer-pilot-summary">
          <strong>Antes de continuar</strong>
          <p>O piloto usa uma integração comunitária não oficial. Quando o login estiver habilitado, a senha será usada apenas durante a autenticação no agente local e descartada em seguida. Ela não será gravada no navegador, no Supabase nem nos servidores do Simplifica.</p>
          <p>Um token temporário poderá permanecer protegido no computador do usuário para acompanhar a impressora. Esse token pode expirar ou ser revogado pela Bambu Lab, exigindo uma nova autorização.</p>
          <p>Nesta fase o Simplifica receberá apenas estado, progresso, camadas, temperaturas, tempo restante e dados do AMS. Iniciar, pausar, cancelar, movimentar e alterar temperaturas continuarão desativados.</p>
        </div>
        <fieldset class="printer-pilot-checklist">
          <legend>Progresso salvo somente neste dispositivo</legend>
          ${items.map(([key, label]) => `<label><input type="checkbox" data-bambu-pilot-step="${key}" ${progress[key] ? "checked" : ""}><span>${escaparHtml(label)}</span></label>`).join("")}
        </fieldset>
        <div class="printer-pilot-data-note">
          ${renderUiIcon("seguranca")}
          <div><strong>O que fica salvo agora</strong><span>Somente estes marcadores de preparação e a data da última atualização. Nenhum e-mail, senha, token, serial ou código de acesso é solicitado nesta etapa.</span></div>
        </div>
        <div class="printer-wizard-actions">
          <button class="btn ghost" id="bambuPilotCancel" type="button">Cancelar</button>
          <button class="btn" id="bambuPilotSave" type="submit">Salvar progresso local</button>
        </div>
      </form>
    </div>
  `;
  promoverPopupParaDialogUiV3(popup, { title: "Piloto de impressoras Bambu" });
  document.getElementById("bambuPilotClose")?.addEventListener("click", fecharPopup);
  document.getElementById("bambuPilotCancel")?.addEventListener("click", fecharPopup);
  document.getElementById("bambuPilotBackdrop")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) fecharPopup();
  });
  document.getElementById("bambuPilotForm")?.addEventListener("submit", (...__args) => salvarProgressoPilotoBambu(...__args.slice(0, 1), context));
}

function salvarProgressoPilotoBambu(event, context = {}) {
  const { BAMBU_PILOT_PROGRESS_DEFAULTS, document, fecharPopup, getBambuPilotProgress, getBambuPilotProgressKey, mostrarToast, renderizarPreservandoScroll, salvarJsonLocalSeMudou } = context;
  event.preventDefault();
  const progress = { ...BAMBU_PILOT_PROGRESS_DEFAULTS };
  document.querySelectorAll("[data-bambu-pilot-step]").forEach((input) => {
    const key = input.dataset.bambuPilotStep;
    if (Object.prototype.hasOwnProperty.call(progress, key)) progress[key] = input.checked === true;
  });
  progress.updatedAt = new Date().toISOString();
  if (!salvarJsonLocalSeMudou(getBambuPilotProgressKey(), progress)) {
    const previous = getBambuPilotProgress();
    if (JSON.stringify(previous) !== JSON.stringify(progress)) {
      mostrarToast("Não foi possível salvar o progresso neste dispositivo.", "erro", 4200);
      return;
    }
  }
  fecharPopup();
  renderizarPreservandoScroll();
  mostrarToast("Preparação do piloto salva somente neste dispositivo.", "sucesso", 3400);
}

function getPrinterBrandOptions(selectedId = "", customBrand = "", context = {}) {
  const { escaparAttr, escaparHtml, getPrinterMonitoringService, printerMonitoringState } = context;
  const rows = printerMonitoringState.brands.length
    ? printerMonitoringState.brands
    : (getPrinterMonitoringService()?.BRANDS || []).map((item) => ({ id: "", slug: item.slug, name: item.name }));
  return rows.map((brand) => `<option value="${escaparAttr(brand.id || brand.slug)}" data-brand-id="${escaparAttr(brand.id || "")}" data-brand-name="${escaparAttr(brand.name)}" ${String(selectedId || customBrand).toLowerCase() === String(brand.id || brand.name).toLowerCase() ? "selected" : ""}>${escaparHtml(brand.name)}</option>`).join("");
}

function getPrinterModelOptions(brandId = "", selectedId = "", customModel = "", context = {}) {
  const { escaparAttr, escaparHtml, printerMonitoringState } = context;
  const models = printerMonitoringState.models.filter((model) => !brandId || String(model.brand_id) === String(brandId));
  const options = models.map((model) => `<option value="${escaparAttr(model.id)}" data-brand-id="${escaparAttr(model.brand_id)}" data-model-name="${escaparAttr(model.name)}" ${String(selectedId) === String(model.id) ? "selected" : ""}>${escaparHtml(model.name)}</option>`).join("");
  return `<option value="">Digitar modelo</option>${options}${customModel && !selectedId ? `<option value="" selected>Modelo personalizado: ${escaparHtml(customModel)}</option>` : ""}`;
}

function getPrinterModelSuggestionOptions(context = {}) {
  const { escaparAttr, getPrinterMonitoringService, printerMonitoringState } = context;
  const names = new Set();
  (printerMonitoringState.models || []).forEach((model) => {
    const name = String(model?.name || "").trim();
    if (name) names.add(name);
  });
  (getPrinterMonitoringService()?.BRANDS || []).forEach((brand) => {
    (brand.models || []).forEach((model) => {
      const name = String(model || "").trim();
      if (name) names.add(name);
    });
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((name) => `<option value="${escaparAttr(name)}"></option>`)
    .join("");
}

function abrirCadastroImpressora(id = "", initial = {}, context = {}) {
  const { document, escaparAttr, escaparHtml, fecharPopup, getPrinterById, getPrinterDisplayModel, getPrinterMonitoringService, mostrarToast, podeGerenciarImpressoras, printerMonitoringState, promoverPopupParaDialogUiV3, renderAppButton, renderUiIcon } = context;
  if (!podeGerenciarImpressoras()) {
    mostrarToast("Seu perfil não pode configurar impressoras.", "aviso");
    return;
  }
  const impressora = id ? getPrinterById(id) : { ...initial };
  const brandId = impressora?.brand_id || "";
  const automatico = String(impressora?.connector_type || "manual") !== "manual";
  const etapaInicial = id ? 2 : 1;
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop printer-modal-backdrop" id="printerModalBackdrop" role="dialog" aria-modal="true">
      <form class="modal-card printer-wizard printer-form-simple" id="printerForm">
        <div class="modal-header">
          <div><span class="eyebrow">${id ? "Editar" : "Nova"} impressora</span><h2>${id ? escaparHtml(impressora.name) : "Adicionar impressora"}</h2></div>
          <button class="icon-button" id="printerCloseButton" type="button" title="Fechar">✕</button>
        </div>
        <input type="hidden" id="printerId" value="${escaparAttr(id)}">
        <input type="hidden" id="printerModel" value="${escaparAttr(impressora?.model_id || "")}">
        <div class="ui-tabs printer-cadastro-tabs" aria-label="Etapas do cadastro">
          ${[[1, "Conexão"], [2, "Impressora"], [3, "Revisar"]].map(([etapa, rotulo]) => `<button class="ui-tab" type="button" data-printer-step-tab="${etapa}" onclick="atualizarEtapaCadastroImpressora(${etapa})"><span>${etapa}</span>${rotulo}</button>`).join("")}
        </div>

        ${id ? "" : `<section class="printer-cadastro-step printer-setup-choice" data-printer-cadastro-step="1" aria-labelledby="printerSetupChoiceTitle">
          <div><span class="eyebrow">Primeiro passo</span><h3 id="printerSetupChoiceTitle">Qual impressora você quer adicionar?</h3><p>Escolha como você prefere acompanhar a máquina.</p></div>
          <div class="printer-setup-summary"><strong>Como funciona</strong><span>1. Escolha Bambu ou rede local</span><span>2. Informe somente os dados necessários</span><span>3. Revise e conecte a impressora</span></div>
          <div class="printer-setup-choice-grid">
            <button class="printer-setup-option recommended" type="button" data-printer-setup="bambu">
              <span>${renderUiIcon("impressoras")}</span><strong>Minha Bambu Lab</strong><small>Entre com sua conta Bambu para acompanhar a impressora</small><b>Mais rápido</b>
            </button>
            <button class="printer-setup-option" type="button" data-printer-setup="lan">
              <span>${renderUiIcon("rede")}</span><strong>Rede local (LAN)</strong><small>Cadastre qualquer impressora pela sua rede, sem conta nem limite</small>
            </button>
          </div>
        </section>`}

        <section class="printer-cadastro-step" data-printer-cadastro-step="2">
        <div class="printer-simple-fields">
          <label class="field field-wide"><span>Nome da impressora</span><input id="printerName" required maxlength="120" value="${escaparAttr(impressora?.name || "")}" placeholder="Ex.: Ender da produção" autofocus></label>
          <div class="printer-lan-fields field-wide" id="printerLanFields" hidden>
            <label class="field"><span>Marca da impressora</span><select id="printerLanBrand" onchange="atualizarOrientacaoLanCadastro()"><option value="creality">Creality / Ender</option><option value="anycubic">Anycubic</option><option value="elegoo">Elegoo</option><option value="prusa">Prusa</option><option value="klipper">Klipper</option><option value="outra">Outra marca</option></select></label>
            <label class="field"><span>Endereço da impressora na rede</span><input id="printerLanAddress" inputmode="url" maxlength="240" placeholder="Ex.: 192.168.1.50"></label>
            <div class="printer-lan-guide" id="printerLanGuide"></div>
          </div>
          <div class="printer-bambu-account-fields field-wide" id="printerBambuAccountFields" hidden>
            <label class="field"><span>E-mail da conta Bambu</span><input id="printerBambuAccount" type="email" inputmode="email" autocomplete="username" maxlength="240" placeholder="seuemail@exemplo.com"></label>
            <label class="field"><span>Senha da conta Bambu</span><input id="printerBambuPassword" type="password" autocomplete="current-password" maxlength="1000" placeholder="Digite sua senha"></label>
            <small>A senha é usada somente para conectar sua conta e não fica salva no Simplifica.</small>
          </div>
          <label class="field"><span>Modelo</span><input id="printerCustomModel" list="printerModelSuggestions" maxlength="120" value="${escaparAttr(getPrinterDisplayModel(impressora) === "Modelo não informado" ? "" : getPrinterDisplayModel(impressora))}" placeholder="Ex.: Ender 3 V2"><datalist id="printerModelSuggestions">${getPrinterModelSuggestionOptions(context)}</datalist></label>
          <label class="field printer-technical-field"><span>Tipo</span><select id="printerType">${[["fdm","FDM"],["resin","Resina"],["other","Outro"]].map(([value,label]) => `<option value="${value}" ${String(impressora?.printer_type || "fdm") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
          <label class="field"><span>Localização</span><input id="printerLocation" maxlength="160" value="${escaparAttr(impressora?.location || "")}" placeholder="Ex.: Bancada 2"></label>
          <label class="field printer-technical-field"><span>Status inicial</span><select id="printerManualStatus">${["idle","printing","paused","finished","maintenance"].map((state) => `<option value="${state}" ${String(impressora?.manual_status || "idle") === state ? "selected" : ""}>${escaparHtml(getPrinterMonitoringService()?.status(state)?.label || state)}</option>`).join("")}</select></label>
        </div>
        </section>

        <section class="printer-cadastro-step" data-printer-cadastro-step="3">
        <div class="printer-bambu-review" id="printerBambuReview" hidden><span>${renderUiIcon("impressoras")}</span><div><strong>Pronto para conectar sua Bambu Lab</strong><small>Ao confirmar, você escolherá a impressora da sua conta.</small></div></div>
        <div class="printer-bambu-review" id="printerLanReview" hidden><span>${renderUiIcon("rede")}</span><div><strong>Impressora pela rede local</strong><small>Você poderá usar várias impressoras assim, em qualquer plano.</small></div></div>
        <details class="printer-advanced-settings" ${automatico ? "open" : ""}>
          <summary>
            <span>${renderUiIcon("config")}</span>
            <strong>Configuração avançada</strong>
            <small>Marca, conexão automática e custos</small>
          </summary>
          <div class="printer-advanced-content">
            <section class="printer-identification-section">
              <h3>Identificação</h3>
              <div class="form-grid">
                <label class="field"><span>Marca</span><select id="printerBrand"><option value="">Outra / personalizada</option>${getPrinterBrandOptions(brandId, impressora?.custom_brand, context)}</select></label>
                <label class="field"><span>Marca personalizada</span><input id="printerCustomBrand" maxlength="120" value="${escaparAttr(impressora?.custom_brand || "")}" placeholder="Se não estiver na lista"></label>
              </div>
            </section>

            <section>
              <h3>Conexão com a impressora</h3>
              <p class="muted">Use o acesso automático da BambuLab ou mantenha o acompanhamento manual.</p>
              <label class="field"><span>Conexão</span>
                <select id="printerConnector">
                  ${(getPrinterMonitoringService()?.CONNECTORS || []).map((connector) => `<option value="${connector.key}" ${String(impressora?.connector_type || "manual") === connector.key ? "selected" : ""}>${escaparHtml(connector.name)}${connector.automatic ? " · automática" : ""}</option>`).join("")}
                </select>
              </label>
              <p class="printer-connection-compatibility" id="printerConnectionCompatibility">Escolha a marca ou informe o modelo. Outras impressoras funcionam manualmente por enquanto.</p>
              <div id="printerAutomaticFields">
                <label class="field printer-connection-mode-field"><span>Modo de conexão</span><select id="printerConnectionMode">
                  <option value="local_agent" ${impressora?.connection_mode === "local_agent" ? "selected" : ""}>Agente Local Simplifica</option>
                  <option value="browser_local" ${impressora?.connection_mode === "browser_local" ? "selected" : ""}>Navegador na mesma rede</option>
                  <option value="cloud_supported" ${impressora?.connection_mode === "cloud_supported" ? "selected" : ""}>Gateway HTTPS</option>
                </select></label>
                <label class="field" id="printerAgentField"><span>Agente responsável</span><select id="printerAgentId"><option value="">Selecione um agente</option>${(printerMonitoringState.agents || []).map((agent) => `<option value="${escaparAttr(agent.id)}" ${String(impressora?.active_agent_id || "") === String(agent.id) ? "selected" : ""}>${escaparHtml(agent.name)} · ${escaparHtml(agent.status)}</option>`).join("")}</select></label>
                <div class="form-grid" id="printerDirectCredentialFields">
                  <label class="field"><span>IP ou URL</span><input id="printerHost" value="${escaparAttr(impressora?.host || "")}" placeholder="192.168.1.50"></label>
                  <label class="field"><span>Porta</span><input id="printerPort" type="number" min="1" max="65535" value="${escaparAttr(impressora?.port || "")}" placeholder="80"></label>
                  <label class="field"><span>Token / API Key</span><input id="printerApiToken" type="password" autocomplete="new-password" placeholder="${impressora?.credentials_configured ? "Configurado · deixe vazio para manter" : "Opcional"}"></label>
                  <label class="field"><span>Usuário</span><input id="printerUsername" autocomplete="off" placeholder="Quando exigido"></label>
                  <label class="field"><span>Senha</span><input id="printerPassword" type="password" autocomplete="new-password" placeholder="Quando exigida"></label>
                </div>
                <div class="printer-bambu-agent-note" id="printerBambuAgentNote" hidden>${renderUiIcon("seguranca")}<div><strong>Sua conta fica protegida</strong><span>Usamos seus dados somente para conectar a Bambu. A senha não é salva.</span></div></div>
                <div class="printer-read-only-notice">${renderUiIcon("seguranca")} O Simplifica apenas acompanha a impressora. Nenhum comando será enviado.</div>
                <div class="actions">${renderAppButton({ label: "Testar conexão", variant: "secondary", attrs: 'id="printerConnectionTestButton"' })}<span class="muted" id="printerConnectionTestResult"></span></div>
              </div>
              <div id="printerManualFields" hidden></div>
            </section>

            <section class="printer-costs-section">
              <h3>Custos opcionais</h3>
              <div class="form-grid">
                <label class="field"><span>Custo por hora</span><input id="printerHourlyCost" type="number" min="0" step="0.01" value="${escaparAttr(impressora?.hourly_cost || "")}" placeholder="0,00"></label>
                <label class="field"><span>Potência em watts</span><input id="printerPowerWatts" type="number" min="0" step="0.01" value="${escaparAttr(impressora?.power_watts || "")}" placeholder="Ex.: 250"></label>
                <label class="field"><span>Valor da impressora</span><input id="printerPurchasePrice" type="number" min="0" step="0.01" value="${escaparAttr(impressora?.purchase_price || "")}" placeholder="0,00"></label>
                <label class="field"><span>Data de compra</span><input id="printerPurchaseDate" type="date" value="${escaparAttr(impressora?.purchase_date || "")}"></label>
                <label class="field"><span>Vida útil (meses)</span><input id="printerLifetime" type="number" min="0" step="1" value="${escaparAttr(impressora?.estimated_lifetime_months || "")}"></label>
                <label class="field"><span>Manutenção mensal</span><input id="printerMaintenanceCost" type="number" min="0" step="0.01" value="${escaparAttr(impressora?.monthly_maintenance_cost || "")}"></label>
              </div>
              <label class="field"><span>Observações</span><textarea id="printerNotes" maxlength="2000" placeholder="Manutenção ou uso">${escaparHtml(impressora?.notes || "")}</textarea></label>
            </section>
          </div>
        </details>
        </section>

        <div class="printer-wizard-actions">
          <button class="btn ghost" id="printerCancelButton" type="button">Cancelar</button>
          <button class="btn ghost" id="printerPreviousButton" type="button" hidden>← Voltar</button>
          <button class="btn" id="printerNextButton" type="button">Próximo →</button>
          <button class="btn" id="printerSaveButton" type="submit" hidden>${id ? "Salvar alterações" : "Adicionar impressora"}</button>
        </div>
      </form>
    </div>
  `;
  promoverPopupParaDialogUiV3(popup, { title: "Cadastrar impressora", wide: true });
  document.getElementById("printerForm")?.addEventListener("submit", (...__args) => salvarCadastroImpressora(...__args.slice(0, 1), context));
  document.getElementById("printerCloseButton")?.addEventListener("click", fecharPopup);
  document.getElementById("printerCancelButton")?.addEventListener("click", fecharPopup);
  document.getElementById("printerPreviousButton")?.addEventListener("click", () => navegarEtapaCadastroImpressora(-1, context));
  document.getElementById("printerNextButton")?.addEventListener("click", () => navegarEtapaCadastroImpressora(1, context));
  document.getElementById("printerBrand")?.addEventListener("change", () => {
    atualizarMarcaCadastroImpressora(context);
    sincronizarConectorBambuPorIdentificacao(context);
  });
  document.getElementById("printerCustomBrand")?.addEventListener("input", (...__args) => sincronizarConectorBambuPorIdentificacao(context));
  document.getElementById("printerCustomModel")?.addEventListener("input", (...__args) => sincronizarConectorBambuPorIdentificacao(context));
  document.getElementById("printerConnector")?.addEventListener("change", (...__args) => atualizarCamposConectorImpressora(context));
  document.getElementById("printerConnectionMode")?.addEventListener("change", (...__args) => atualizarCamposConectorImpressora(context));
  document.getElementById("printerConnectionTestButton")?.addEventListener("click", (...__args) => testarConexaoCadastroImpressora(context));
  document.querySelectorAll("[data-printer-setup]").forEach((button) => {
    button.addEventListener("click", () => {
      aplicarPresetCadastroImpressora(button.dataset.printerSetup || "lan", context);
      atualizarEtapaCadastroImpressora(2, context);
    });
  });
  document.getElementById("printerModalBackdrop")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) fecharPopup();
  });
  if (id) atualizarCamposConectorImpressora(context);
  else aplicarPresetCadastroImpressora(initial?.preset === "manual" ? "lan" : "bambu", context);
  atualizarOrientacaoLanCadastro(context);
  atualizarEtapaCadastroImpressora(etapaInicial, context);
}

function atualizarOrientacaoLanCadastro(context = {}) {
  const { document } = context;
  const guide = document.getElementById("printerLanGuide");
  if (!guide) return;
  const marca = document.getElementById("printerLanBrand")?.value || "outra";
  const dicas = {
    creality: "Na tela da Creality/Ender, abra Rede ou Wi-Fi e anote o endereço IP mostrado. Se não aparecer, veja a lista de aparelhos do roteador.",
    anycubic: "Na tela da Anycubic, abra Wi-Fi ou Rede e anote o IP. Se preferir, consulte a lista de aparelhos conectados no roteador.",
    elegoo: "Na tela da Elegoo, abra Rede ou Wi-Fi e anote o IP. O mesmo endereço costuma aparecer no roteador da empresa.",
    prusa: "Na tela da Prusa, abra Configurações de rede e anote o endereço IP. Também é possível encontrá-lo no roteador.",
    klipper: "Use o endereço IP do computador ou placa que roda o Klipper. Ele pode ser visto no roteador ou na tela de rede do equipamento.",
    outra: "Procure por Rede, Wi-Fi ou Ethernet no painel da impressora. Anote o endereço IP exibido ou consulte o roteador."
  };
  guide.textContent = dicas[marca] || dicas.outra;
}

function atualizarEtapaCadastroImpressora(etapa = 1, context = {}) {
  const { document, window } = context;
  const atual = Math.max(1, Math.min(3, Number(etapa) || 1));
  window.__printerCadastroStep = atual;
  document.querySelectorAll("[data-printer-cadastro-step]").forEach((section) => {
    const visivel = Number(section.dataset.printerCadastroStep) === atual;
    section.hidden = !visivel;
    if (visivel) section.style.removeProperty("display");
    else section.style.setProperty("display", "none", "important");
  });
  document.querySelectorAll("[data-printer-step-tab]").forEach((item) => {
    const passo = Number(item.dataset.printerStepTab);
    item.classList.toggle("active", passo === atual);
    item.classList.toggle("done", passo < atual);
  });
  const mostrarBotao = (id, visivel) => {
    const botao = document.getElementById(id);
    if (!botao) return;
    botao.hidden = !visivel;
    botao.style.setProperty("display", visivel ? "" : "none", "important");
  };
  mostrarBotao("printerPreviousButton", atual > 1);
  mostrarBotao("printerNextButton", atual < 3);
  mostrarBotao("printerSaveButton", atual === 3);
  document.querySelector(".printer-wizard")?.scrollTo?.({ top: 0, behavior: "smooth" });
}

function navegarEtapaCadastroImpressora(direcao = 1, context = {}) {
  const { document, window } = context;
  const atual = Number(window.__printerCadastroStep) || 1;
  if (direcao > 0 && atual === 2) {
    const nome = document.getElementById("printerName");
    if (!nome?.reportValidity?.()) return;
    if (document.getElementById("printerConnector")?.value === "bambu") {
      const conta = document.getElementById("printerBambuAccount");
      const senha = document.getElementById("printerBambuPassword");
      if (!conta?.reportValidity?.() || !senha?.reportValidity?.()) return;
    }
  }
  atualizarEtapaCadastroImpressora(atual + direcao, context);
}

function aplicarPresetCadastroImpressora(mode = "manual", context = {}) {
  const { document, mostrarToast } = context;
  const connector = document.getElementById("printerConnector");
  const connectionMode = document.getElementById("printerConnectionMode");
  const type = document.getElementById("printerType");
  const customBrand = document.getElementById("printerCustomBrand");
  const name = document.getElementById("printerName");
  const advanced = document.querySelector(".printer-advanced-settings");
  const form = document.getElementById("printerForm");
  if (mode === "bambu") {
    const bambuOption = Array.from(connector?.options || []).find((option) => option.value === "bambu");
    if (!bambuOption) {
      mostrarToast("O conector Bambu não está disponível nesta instalação.", "aviso", 4200);
      return;
    }
    connector.value = "bambu";
    if (connectionMode) connectionMode.value = "cloud_supported";
    if (type) type.value = "fdm";
    if (customBrand) customBrand.value = "Bambu Lab";
    if (name && !name.value.trim()) name.value = "Bambu da produção";
    if (advanced) advanced.open = true;
  } else {
    if (connector) connector.value = "manual";
    if (connectionMode) connectionMode.value = "local_agent";
    if (advanced) advanced.open = false;
    if (mode === "lan" && name && !name.value.trim()) name.value = "Impressora da rede";
  }
  form?.classList.toggle("is-bambu-quick", mode === "bambu");
  if (form) form.dataset.printerSetup = mode;
  const save = document.getElementById("printerSaveButton");
  if (save && !document.getElementById("printerId")?.value) save.textContent = "Confirmar cadastro";
  document.querySelectorAll("[data-printer-setup]").forEach((button) => button.classList.toggle("selected", button.dataset.printerSetup === mode));
  atualizarCamposConectorImpressora(context);
  name?.focus({ preventScroll: true });
}

function sincronizarConectorBambuPorIdentificacao(context = {}) {
  const { document } = context;
  if (document.getElementById("printerId")?.value) return;
  const connector = document.getElementById("printerConnector");
  if (!connector || connector.value !== "manual") return;
  const identificacao = [
    document.getElementById("printerBrand")?.selectedOptions?.[0]?.dataset?.brandName,
    document.getElementById("printerCustomBrand")?.value,
    document.getElementById("printerCustomModel")?.value
  ].join(" ");
  if (!/bambu/i.test(identificacao)) return;
  aplicarPresetCadastroImpressora("bambu", context);
}

function atualizarMarcaCadastroImpressora(context = {}) {
  const { document } = context;
  const brand = document.getElementById("printerBrand");
  const brandName = brand?.selectedOptions?.[0]?.dataset?.brandName || "";
  const customBrand = document.getElementById("printerCustomBrand");
  if (customBrand && brandName) customBrand.value = brandName;
}

function atualizarCamposConectorImpressora(context = {}) {
  const { document } = context;
  const connector = document.getElementById("printerConnector")?.value || "manual";
  const automatic = connector !== "manual";
  const connectionMode = document.getElementById("printerConnectionMode")?.value || "local_agent";
  const bambuManaged = connector === "bambu";
  const lanManual = document.getElementById("printerForm")?.dataset?.printerSetup === "lan";
  document.getElementById("printerAutomaticFields")?.toggleAttribute("hidden", !automatic);
  document.getElementById("printerManualFields")?.toggleAttribute("hidden", automatic);
  document.getElementById("printerAgentField")?.toggleAttribute("hidden", !automatic || connectionMode !== "local_agent");
  document.getElementById("printerDirectCredentialFields")?.toggleAttribute("hidden", bambuManaged);
  document.getElementById("printerBambuAgentNote")?.toggleAttribute("hidden", !bambuManaged);
  document.getElementById("printerBambuAccountFields")?.toggleAttribute("hidden", !bambuManaged);
  document.getElementById("printerBambuReview")?.toggleAttribute("hidden", !bambuManaged);
  document.getElementById("printerLanFields")?.toggleAttribute("hidden", !lanManual);
  document.getElementById("printerLanReview")?.toggleAttribute("hidden", !lanManual);
  document.querySelector(".printer-advanced-settings")?.toggleAttribute("hidden", bambuManaged || lanManual);
  document.getElementById("printerBambuAccount")?.toggleAttribute("required", bambuManaged);
  document.getElementById("printerBambuPassword")?.toggleAttribute("required", bambuManaged);
  if (lanManual) atualizarOrientacaoLanCadastro(context);
  const testButton = document.getElementById("printerConnectionTestButton");
  if (testButton) {
    testButton.disabled = connectionMode === "local_agent";
    testButton.textContent = connectionMode === "browser_local" ? "Testar nesta rede" : connectionMode === "local_agent" ? "Status recebido pelo agente" : "Testar gateway de leitura";
  }
}

async function testarConexaoCadastroImpressora(context = {}) {
  const { document, getPrinterMonitoringService, printerBackendRequest } = context;
  const mode = document.getElementById("printerConnectionMode")?.value || "local_agent";
  const result = document.getElementById("printerConnectionTestResult");
  const button = document.getElementById("printerConnectionTestButton");
  if (mode === "local_agent") return;
  if (button) button.disabled = true;
  if (result) result.textContent = "Testando...";
  try {
    if (mode === "browser_local") {
      const response = await getPrinterMonitoringService().testBrowserLocal({
        connectorType: document.getElementById("printerConnector")?.value,
        host: document.getElementById("printerHost")?.value,
        port: document.getElementById("printerPort")?.value,
        apiToken: document.getElementById("printerApiToken")?.value,
        username: document.getElementById("printerUsername")?.value,
        password: document.getElementById("printerPassword")?.value
      });
      if (result) result.textContent = `Conectado · ${getPrinterMonitoringService()?.status(response.state)?.label || response.state}`;
      return;
    }
    const printerId = document.getElementById("printerId")?.value || "";
    if (!printerId) throw new Error("Salve a impressora antes de testar o gateway.");
    await printerBackendRequest("test_connection", { printer_id: printerId });
    if (result) result.textContent = "Conectado em modo somente leitura.";
  } catch (erro) {
    if (result) result.textContent = getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message;
  } finally {
    if (button) button.disabled = false;
  }
}

function valorOpcionalNumero(id, context = {}) {
  const { document } = context;
  const valor = document.getElementById(id)?.value;
  return String(valor || "").trim() ? Number(valor) : null;
}

async function salvarCadastroImpressora(event, context = {}) {
  const { abrirLoginBambu, bambuLoginDraftState, document, fecharPopup, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, printerBackendRequest, printerMonitoringState, sincronizarImpressorasComCalculadora } = context;
  event.preventDefault();
  const form = event.currentTarget;
  const save = document.getElementById("printerSaveButton");
  if (!form?.reportValidity?.()) return;
  const brandOption = document.getElementById("printerBrand")?.selectedOptions?.[0];
  const modelOption = document.getElementById("printerModel")?.selectedOptions?.[0];
  const connector = document.getElementById("printerConnector")?.value || "manual";
  const lanManual = document.getElementById("printerForm")?.dataset?.printerSetup === "lan";
  const connectionMode = connector === "manual" ? "manual" : document.getElementById("printerConnectionMode")?.value || "local_agent";
  const bambuManaged = connector === "bambu";
  const bambuAccount = bambuManaged ? String(document.getElementById("printerBambuAccount")?.value || "").trim() : "";
  const bambuPassword = bambuManaged ? String(document.getElementById("printerBambuPassword")?.value || "") : "";
  const payload = {
    id: document.getElementById("printerId")?.value || "",
    name: document.getElementById("printerName")?.value || "",
    brand_id: brandOption?.dataset?.brandId || null,
    model_id: document.getElementById("printerModel")?.value || null,
    custom_brand: lanManual ? document.getElementById("printerLanBrand")?.selectedOptions?.[0]?.textContent || "" : document.getElementById("printerCustomBrand")?.value || brandOption?.dataset?.brandName || "",
    custom_model: document.getElementById("printerCustomModel")?.value || modelOption?.dataset?.modelName || "",
    printer_type: document.getElementById("printerType")?.value || "fdm",
    location: document.getElementById("printerLocation")?.value || "",
    notes: document.getElementById("printerNotes")?.value || "",
    connector_type: connector,
    connection_mode: connectionMode,
    agent_id: document.getElementById("printerAgentId")?.value || null,
    host: bambuManaged ? "https://api.bambulab.com" : lanManual ? document.getElementById("printerLanAddress")?.value || "" : document.getElementById("printerHost")?.value || "",
    port: bambuManaged ? null : valorOpcionalNumero("printerPort", context),
    api_token: bambuManaged ? "" : document.getElementById("printerApiToken")?.value || "",
    username: bambuManaged ? "" : document.getElementById("printerUsername")?.value || "",
    password: bambuManaged ? "" : document.getElementById("printerPassword")?.value || "",
    manual_status: document.getElementById("printerManualStatus")?.value || "idle",
    hourly_cost: valorOpcionalNumero("printerHourlyCost", context),
    power_watts: valorOpcionalNumero("printerPowerWatts", context),
    purchase_price: valorOpcionalNumero("printerPurchasePrice", context),
    purchase_date: document.getElementById("printerPurchaseDate")?.value || null,
    estimated_lifetime_months: valorOpcionalNumero("printerLifetime", context),
    monthly_maintenance_cost: valorOpcionalNumero("printerMaintenanceCost", context)
  };
  if (save) save.disabled = true;
  try {
    const saved = await printerBackendRequest("save", { printer: payload });
    if (saved?.id) {
      const index = printerMonitoringState.items.findIndex((item) => String(item.id) === String(saved.id));
      if (index >= 0) printerMonitoringState.items[index] = { ...printerMonitoringState.items[index], ...saved };
      else printerMonitoringState.items.unshift(saved);
      printerMonitoringState.loaded = true;
      sincronizarImpressorasComCalculadora();
    }
    const abrirLoginDepois = !payload.id && payload.connector_type === "bambu";
    fecharPopup();
    await hidratarImpressorasSeNecessario(true);
    mostrarToast(payload.id ? "Impressora atualizada." : "Impressora adicionada.", "sucesso", 3400);
    if (abrirLoginDepois && saved?.id) {
      Object.assign(bambuLoginDraftState, { active: true, printerId: saved.id, account: bambuAccount, password: bambuPassword, code: "", consent: true, step: 3, awaitingCode: false });
      abrirLoginBambu(saved.id);
      setTimeout(() => document.getElementById("bambuLoginSubmit")?.click(), 80);
    }
  } catch (erro) {
    mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
    if (save) save.disabled = false;
  }
}



function abrirLoginBambu(id, context = {}) {
  const { bambuLoginDraftState, document, escaparHtml, getPrinterById, getPrinterDisplayBrand, getPrinterDisplayModel, isBambuPrinterCandidate, mostrarToast, podeGerenciarImpressoras, promoverPopupParaDialogUiV3, renderPrinterStatusBadge, renderUiIcon } = context;
  const impressora = getPrinterById(id);
  if (!impressora || !isBambuPrinterCandidate(impressora) || !podeGerenciarImpressoras()) return;
  if (impressora.credentials_configured) {
    mostrarToast("A conta Bambu já está conectada. Use Desconectar Bambu antes de entrar novamente.", "info", 4800);
    return;
  }
  if (!bambuLoginDraftState.active || String(bambuLoginDraftState.printerId) !== String(id)) {
    Object.assign(bambuLoginDraftState, { active: true, printerId: id, account: "", password: "", code: "", consent: false, step: 1, awaitingCode: false });
  }
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop printer-modal-backdrop" id="bambuLoginBackdrop" role="dialog" aria-modal="true" aria-labelledby="bambuLoginTitle">
      <form class="modal-card printer-bambu-login" id="bambuLoginForm" autocomplete="off">
        <div class="modal-header"><div><span class="eyebrow">Integração comunitária</span><h2 id="bambuLoginTitle">Conectar conta Bambu</h2></div><button class="icon-button" type="button" id="bambuLoginClose" title="Fechar">✕</button></div>
        ${renderEtapasLoginBambu(1, context)}
        <section class="printer-bambu-step" data-bambu-login-step="1">
          <span class="eyebrow">Etapa 1 de 5</span><h3>Confirmar impressora</h3>
          <div class="printer-bambu-printer-review"><span class="printer-device-icon">${renderUiIcon("impressoras")}</span><div><strong>${escaparHtml(impressora.name || "Impressora")}</strong><small>${escaparHtml(getPrinterDisplayBrand(impressora))} · ${escaparHtml(getPrinterDisplayModel(impressora))}</small></div>${renderPrinterStatusBadge(impressora)}</div>
          <p class="muted">Vamos usar este mesmo cadastro. Nome, histórico e pedidos vinculados serão preservados.</p>
          <div class="printer-wizard-actions"><button class="btn ghost" type="button" id="bambuLoginCancel">Cancelar</button><button class="btn" type="button" onclick="setEtapaLoginBambu(2)">Continuar</button></div>
        </section>
        <section class="printer-bambu-step" data-bambu-login-step="2" hidden>
          <span class="eyebrow">Etapa 2 de 5</span><h3>Autorizar integração experimental</h3>
          <div class="printer-pilot-summary"><strong>Login comunitário, não oficial</strong><p>A senha ou o código será transmitido à função segura do Simplifica apenas para autenticar na Bambu e será descartado depois da chamada. Somente o token retornado será armazenado cifrado.</p>${impressora.connector_type === "manual" ? "<p>Após o login bem-sucedido, o cadastro manual será convertido para acompanhamento automático.</p>" : ""}<p>A Bambu pode alterar, limitar ou revogar o acesso sem aviso. O piloto permanece somente leitura.</p></div>
          <label class="printer-bambu-consent"><input id="bambuLoginConsent" type="checkbox"><span>Li e autorizo a transmissão temporária da credencial para autenticação.</span></label>
          <p class="printer-login-result" id="bambuConsentResult" role="status"></p>
          <div class="printer-wizard-actions"><button class="btn ghost" type="button" onclick="setEtapaLoginBambu(1)">Voltar</button><button class="btn" type="button" onclick="setEtapaLoginBambu(3)">Concordar e continuar</button></div>
        </section>
        <section class="printer-bambu-step" data-bambu-login-step="3" hidden>
          <span class="eyebrow">Etapa 3 de 5</span><h3>Entrar na conta Bambu</h3><p class="muted">Digite os dados somente nesta tela. O Simplifica não salva sua senha.</p>
          <label class="field"><span>E-mail da conta Bambu</span><input id="bambuLoginAccount" type="email" inputmode="email" autocomplete="username" required maxlength="240" placeholder="seuemail@exemplo.com"></label>
          <label class="field" id="bambuPasswordField"><span>Senha Bambu</span><input id="bambuLoginPassword" type="password" autocomplete="current-password" maxlength="1000" placeholder="Usada uma única vez"></label>
          <label class="field" id="bambuCodeField" hidden><span>Código de confirmação</span><input id="bambuLoginCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="Código de 6 dígitos recebido no e-mail"></label>
          <p class="printer-login-result" id="bambuLoginResult" role="status"></p>
          <div class="printer-wizard-actions"><button class="btn ghost" type="button" onclick="setEtapaLoginBambu(2)">Voltar</button><button class="btn" type="submit" id="bambuLoginSubmit">Entrar e localizar</button></div>
        </section>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Conectar conta Bambu" });
  document.getElementById("bambuLoginClose")?.addEventListener("click", (...__args) => fecharLoginBambu(context));
  document.getElementById("bambuLoginCancel")?.addEventListener("click", (...__args) => fecharLoginBambu(context));
  document.getElementById("bambuLoginBackdrop")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) fecharLoginBambu(context);
  });
  document.getElementById("bambuLoginForm")?.addEventListener("submit", (event) => autenticarContaBambu(event, id, context));
  ["bambuLoginAccount", "bambuLoginPassword", "bambuLoginCode"].forEach((fieldId) => document.getElementById(fieldId)?.addEventListener("input", (...__args) => capturarRascunhoLoginBambu(context)));
  document.getElementById("bambuLoginConsent")?.addEventListener("change", (...__args) => capturarRascunhoLoginBambu(context));
  restaurarRascunhoLoginBambu(context);
}

function capturarRascunhoLoginBambu(context = {}) {
  const { bambuLoginDraftState, document } = context;
  if (!bambuLoginDraftState.active) return;
  const account = document.getElementById("bambuLoginAccount");
  const password = document.getElementById("bambuLoginPassword");
  const code = document.getElementById("bambuLoginCode");
  const consent = document.getElementById("bambuLoginConsent");
  if (account) bambuLoginDraftState.account = account.value || "";
  if (password) bambuLoginDraftState.password = password.value || "";
  if (code) bambuLoginDraftState.code = code.value || "";
  if (consent) bambuLoginDraftState.consent = consent.checked === true;
}

function restaurarRascunhoLoginBambu(context = {}) {
  const { bambuLoginDraftState, document } = context;
  const account = document.getElementById("bambuLoginAccount");
  const password = document.getElementById("bambuLoginPassword");
  const code = document.getElementById("bambuLoginCode");
  const consent = document.getElementById("bambuLoginConsent");
  if (account) account.value = bambuLoginDraftState.account || "";
  if (password) password.value = bambuLoginDraftState.password || "";
  if (code) code.value = bambuLoginDraftState.code || "";
  if (consent) consent.checked = bambuLoginDraftState.consent === true;
  if (bambuLoginDraftState.awaitingCode) {
    document.getElementById("bambuCodeField")?.removeAttribute("hidden");
    document.getElementById("bambuPasswordField")?.setAttribute("hidden", "");
    if (code) code.required = true;
  }
  setEtapaLoginBambu(bambuLoginDraftState.step || 1, context);
}

function limparRascunhoLoginBambu(context = {}) {
  const { bambuLoginDraftState } = context;
  Object.assign(bambuLoginDraftState, { active: false, printerId: "", account: "", password: "", code: "", consent: false, step: 1, awaitingCode: false });
}

function fecharLoginBambu(context = {}) {
  const { fecharPopup } = context;
  limparRascunhoLoginBambu(context);
  fecharPopup();
}

function renderEtapasLoginBambu(current = 1, context = {}) {
  const labels = ["Impressora", "Aviso", "Login", "Dispositivo", "Pronto"];
  return `<ol class="printer-bambu-steps" aria-label="Etapas da conexão">${labels.map((label, index) => `<li class="${index + 1 < current ? "done" : index + 1 === current ? "active" : ""}"><i>${index + 1 < current ? "✓" : index + 1}</i><span>${label}</span></li>`).join("")}</ol>`;
}

function setEtapaLoginBambu(step, context = {}) {
  const { bambuLoginDraftState, document } = context;
  capturarRascunhoLoginBambu(context);
  const target = Math.max(1, Math.min(3, Number(step) || 1));
  if (target === 3 && !document.getElementById("bambuLoginConsent")?.checked) {
    const result = document.getElementById("bambuConsentResult");
    if (result) result.textContent = "Marque a autorização para continuar.";
    return;
  }
  bambuLoginDraftState.step = target;
  document.querySelectorAll("[data-bambu-login-step]").forEach((section) => section.toggleAttribute("hidden", Number(section.dataset.bambuLoginStep) !== target));
  const progress = document.querySelector(".printer-bambu-steps");
  if (progress) progress.outerHTML = renderEtapasLoginBambu(target, context);
  if (target === 3) setTimeout(() => document.getElementById("bambuLoginAccount")?.focus({ preventScroll: true }), 30);
}

async function autenticarContaBambu(event, printerId, context = {}) {
  const { bambuLoginDraftState, document, getPrinterMonitoringService, hidratarImpressorasSeNecessario, printerBackendRequest } = context;
  event.preventDefault();
  capturarRascunhoLoginBambu(context);
  const form = event.currentTarget;
  if (!form?.reportValidity?.()) return;
  const submit = document.getElementById("bambuLoginSubmit");
  const result = document.getElementById("bambuLoginResult");
  const password = document.getElementById("bambuLoginPassword");
  const code = document.getElementById("bambuLoginCode");
  if (!String(password?.value || "") && !String(code?.value || "")) {
    if (result) result.textContent = "Informe a senha ou o código de verificação.";
    return;
  }
  if (submit) submit.disabled = true;
  if (result) result.textContent = "Autenticando com a Bambu...";
  try {
    const data = await printerBackendRequest("bambu_login", {
      printer_id: printerId,
      account: document.getElementById("bambuLoginAccount")?.value || "",
      password: code?.value ? "" : password?.value || "",
      code: code?.value || ""
    });
    limparRascunhoLoginBambu(context);
    if (password) password.value = "";
    if (code) code.value = "";
    await hidratarImpressorasSeNecessario(true);
    const servidorAindaNaoAtualizado = !Array.isArray(data?.imported_printer_ids);
    if ((data?.requires_device_selection === true || servidorAindaNaoAtualizado) && Array.isArray(data?.devices) && data.devices.length > 1) {
      renderizarSelecaoDispositivoBambu(printerId, data.devices, data.selected_device_id, context);
      return;
    }
    renderizarConclusaoBambu(printerId, data?.devices?.find((device) => String(device.id) === String(data?.selected_device_id)), data, context);
  } catch (erro) {
    const message = String(erro?.message || "");
    if (message === "BAMBU_VERIFICATION_CODE_REQUIRED" || (message === "BAMBU_LOGIN_REJECTED" && !bambuLoginDraftState.awaitingCode)) {
      bambuLoginDraftState.awaitingCode = true;
      bambuLoginDraftState.step = 3;
      document.getElementById("bambuCodeField")?.removeAttribute("hidden");
      document.getElementById("bambuPasswordField")?.setAttribute("hidden", "");
      if (code) code.required = true;
      if (result) result.textContent = "Confira seu e-mail da Bambu e informe o código de 6 dígitos para concluir.";
      code?.focus();
    } else if (result) {
      capturarRascunhoLoginBambu(context);
      result.textContent = getPrinterMonitoringService()?.errorMessage(message) || "Não foi possível conectar à Bambu.";
    }
    if (submit) submit.disabled = false;
  }
}

function renderizarSelecaoDispositivoBambu(printerId, devices = [], selectedId = "", context = {}) {
  const { document, escaparAttr, escaparHtml } = context;
  const form = document.getElementById("bambuLoginForm");
  if (!form) return;
  form.innerHTML = `
    <div class="modal-header"><div><span class="eyebrow">Conta conectada</span><h2>Escolha a impressora</h2></div><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>
    ${renderEtapasLoginBambu(4, context)}
    <span class="eyebrow">Etapa 4 de 5</span>
    <p class="muted">Encontramos ${devices.length} impressoras nesta conta. Selecione qual será acompanhada neste cadastro.</p>
    <div class="printer-bambu-device-list">${devices.map((device) => `<button class="printer-bambu-device ${String(device.id) === String(selectedId) ? "selected" : ""}" type="button" onclick="selecionarDispositivoBambu('${escaparAttr(printerId)}','${escaparAttr(device.id)}')"><strong>${escaparHtml(device.name || "Impressora Bambu")}</strong><span>${escaparHtml(device.model || "Bambu Lab")} · ${device.online ? "Online" : "Offline"}</span></button>`).join("")}</div>`;
}

async function selecionarDispositivoBambu(printerId, deviceId, context = {}) {
  const { getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, printerBackendRequest } = context;
  try {
    await printerBackendRequest("bambu_select_device", { printer_id: printerId, device_id: deviceId });
    await hidratarImpressorasSeNecessario(true);
    renderizarConclusaoBambu(printerId, undefined, undefined, context);
  } catch (erro) {
    mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
  }
}

function renderizarConclusaoBambu(printerId, device = null, connection = {}, context = {}) {
  const { document, escaparHtml, getPrinterById, mostrarToast } = context;
  const form = document.getElementById("bambuLoginForm");
  const impressora = getPrinterById(printerId);
  if (!form) return;
  const planoGratisComMaisDeUma = connection?.free_plan_last_printer_only === true;
  form.innerHTML = `<div class="modal-header"><div><span class="eyebrow">Conta conectada</span><h2>Impressora pronta</h2></div><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>${renderEtapasLoginBambu(5, context)}<section class="printer-bambu-success"><i>✓</i><h3>${escaparHtml(device?.name || impressora?.name || "Impressora Bambu")}</h3><p>${planoGratisComMaisDeUma ? "Sua conta tem mais de uma impressora. No plano Grátis, mostramos somente a última impressora da conta." : "Sua conta foi conectada e as impressoras disponíveis foram adicionadas para acompanhamento."}</p><ul><li>Pedidos e histórico continuam no mesmo lugar</li><li>Sua senha não é salva</li><li>O Simplifica só acompanha, sem enviar comandos</li></ul></section><div class="printer-wizard-actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Fechar</button><button class="btn" type="button" onclick="fecharPopup();trocarTela('calculadora')">Abrir calculadora</button></div>`;
  mostrarToast("Conta Bambu conectada com sucesso.", "sucesso", 3600);
}


async function desconectarContaBambu(printerId, context = {}) {
  const { confirm, getPrinterById, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, printerBackendRequest } = context;
  const impressora = getPrinterById(printerId);
  if (!impressora || !confirm(`Desconectar a conta Bambu de ${impressora.name}? O token cifrado será apagado.`)) return;
  try {
    await printerBackendRequest("bambu_disconnect", { printer_id: printerId });
    await hidratarImpressorasSeNecessario(true);
    mostrarToast("Conta Bambu desconectada e token apagado.", "sucesso", 3400);
  } catch (erro) {
    mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
  }
}

async function atualizarStatusImpressora(id, context = {}) {
  const { atualizarElementosStatusBambu, document, getPrinterById, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, printerBackendRequest } = context;
  const refreshButton = document.getElementById("printerPanelRefresh");
  try {
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = "Atualizando...";
    }
    mostrarToast("Consultando status da impressora...", "info", 2200);
    await printerBackendRequest("fetch_status", { printer_id: id });
    await hidratarImpressorasSeNecessario(true, false);
    const impressoraAtualizada = getPrinterById(id);
    if (impressoraAtualizada) atualizarElementosStatusBambu(impressoraAtualizada);
    mostrarToast("Status atualizado.", "sucesso", 3000);
  } catch (erro) {
    mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
  } finally {
    if (refreshButton?.isConnected) {
      refreshButton.disabled = false;
      refreshButton.textContent = "Atualizar";
    }
  }
}

function abrirStatusManualImpressora(id, context = {}) {
  const { document, escaparHtml, fecharPopup, getPrinterById, getPrinterCurrentStatus, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, podeOperarImpressoras, printerBackendRequest, promoverPopupParaDialogUiV3 } = context;
  const impressora = getPrinterById(id);
  if (!impressora || !podeOperarImpressoras()) return;
  const popup = document.getElementById("popup");
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card" id="printerManualStatusForm" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>Status de ${escaparHtml(impressora.name)}</h2><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>
        <label class="field"><span>Status manual</span><select id="printerManualStatusUpdate">${["idle","printing","paused","finished","error","offline","maintenance"].map((state) => `<option value="${state}" ${getPrinterCurrentStatus(impressora) === state ? "selected" : ""}>${escaparHtml(getPrinterMonitoringService()?.status(state)?.label || state)}</option>`).join("")}</select></label>
        <p class="muted">Esta alteração registra um snapshot manual e não envia comandos à impressora.</p>
        <div class="actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button><button class="btn" type="submit">Salvar status</button></div>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Atualizar status da impressora" });
  document.getElementById("printerManualStatusForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await printerBackendRequest("manual_status", { printer_id: id, state: document.getElementById("printerManualStatusUpdate")?.value });
      fecharPopup();
      await hidratarImpressorasSeNecessario(true);
      mostrarToast("Status manual atualizado.", "sucesso");
    } catch (erro) {
      mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
    }
  });
}

function abrirVinculoPedidoImpressora(id, context = {}) {
  const { clienteDoPedido, document, escaparAttr, escaparHtml, fecharPopup, getPrinterById, getPrinterCurrentStatus, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, pedidos, podeOperarImpressoras, printerBackendRequest, promoverPopupParaDialogUiV3 } = context;
  const impressora = getPrinterById(id);
  if (!impressora || !podeOperarImpressoras()) return;
  const atual = impressora.active_order_link?.order_id || "";
  const ativos = pedidos.filter((pedido) => !["entregue", "cancelado", "finalizado"].includes(String(pedido.status || "").toLowerCase()));
  const popup = document.getElementById("popup");
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card" id="printerOrderLinkForm" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>Vincular pedido</h2><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>
        <p class="muted">${escaparHtml(impressora.name)} · ${escaparHtml(getPrinterMonitoringService()?.status(getPrinterCurrentStatus(impressora))?.label || "")}</p>
        <fieldset class="printer-order-picker"><legend>Escolha um pedido em aberto</legend>
          ${ativos.length ? ativos.map((pedido) => `<label class="printer-order-choice ${String(atual) === String(pedido.id) ? "selected" : ""}"><input type="radio" name="printerOrderId" value="${escaparAttr(pedido.id)}" ${String(atual) === String(pedido.id) ? "checked" : ""}><span><strong>Pedido #${escaparHtml(pedido.id)}</strong><small>${escaparHtml(clienteDoPedido(pedido))} · ${escaparHtml(String(pedido.status || "Em aberto").replace(/_/g, " "))}</small></span></label>`).join("") : `<p class="empty">Não há pedidos em aberto para vincular.</p>`}
          <label class="printer-order-choice printer-order-choice-clear"><input type="radio" name="printerOrderId" value="" ${atual ? "" : "checked"}><span><strong>Sem pedido vinculado</strong><small>Deixar esta impressora livre</small></span></label>
        </fieldset>
        <label class="field"><span>Observações</span><textarea id="printerOrderNotes" maxlength="1000"></textarea></label>
        <div class="actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button><button class="btn" type="submit">Salvar vínculo</button></div>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Vincular pedido à impressora" });
  document.getElementById("printerOrderLinkForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await printerBackendRequest("link_order", {
        printer_id: id,
        order_id: document.querySelector('input[name="printerOrderId"]:checked')?.value || "",
        notes: document.getElementById("printerOrderNotes")?.value || ""
      });
      fecharPopup();
      await hidratarImpressorasSeNecessario(true);
      mostrarToast("Vínculo do pedido atualizado.", "sucesso");
    } catch (erro) {
      mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
    }
  });
}

async function abrirHistoricoImpressora(id, context = {}) {
  const { document, escaparHtml, formatarDataHora, getPrinterById, getPrinterMonitoringService, getPrinterProgressValue, printerBackendRequest, promoverPopupParaDialogUiV3, renderResumoDesperdicioImpressora } = context;
  const impressora = getPrinterById(id);
  if (!impressora) return;
  const popup = document.getElementById("popup");
  popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()"><section class="modal-card printer-history-modal" onclick="event.stopPropagation()"><div class="modal-header"><h2>Histórico de ${escaparHtml(impressora.name)}</h2><button class="icon-button" onclick="fecharPopup()" title="Fechar">✕</button></div><p class="muted">Carregando eventos e snapshots...</p></section></div>`;
  promoverPopupParaDialogUiV3(popup, { title: `Histórico de ${impressora.name}` });
  try {
    const data = await printerBackendRequest("history", { printer_id: id });
    const snapshots = Array.isArray(data?.snapshots) ? data.snapshots : [];
    const events = Array.isArray(data?.events) ? data.events : [];
    const modal = document.querySelector(".printer-history-modal");
    if (!modal) return;
    modal.innerHTML = `
      <div class="modal-header"><h2>Histórico de ${escaparHtml(impressora.name)}</h2><button class="icon-button" onclick="fecharPopup()" title="Fechar">✕</button></div>
      ${renderResumoDesperdicioImpressora(id)}
      <div class="printer-history-grid">
        <section><h3>Snapshots</h3>${snapshots.length ? snapshots.map((item) => { const progress = getPrinterProgressValue(item.progress_percent); return `<div class="history-item"><strong>${escaparHtml(getPrinterMonitoringService()?.status(item.normalized_state)?.label || item.normalized_state)}</strong><span>${escaparHtml(formatarDataHora(item.created_at))}${Number.isFinite(progress) ? ` · ${Math.round(progress)}%` : ""}</span></div>`; }).join("") : `<p class="empty">Sem snapshots.</p>`}</section>
        <section><h3>Eventos</h3>${events.length ? events.map((item) => `<div class="history-item"><strong>${escaparHtml(item.message || item.event_type)}</strong><span>${escaparHtml(formatarDataHora(item.created_at))}</span></div>`).join("") : `<p class="empty">Sem eventos.</p>`}</section>
      </div>`;
  } catch (erro) {
    const modal = document.querySelector(".printer-history-modal");
    if (modal) modal.insertAdjacentHTML("beforeend", `<p class="printer-error">${escaparHtml(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message)}</p>`);
  }
}

async function desativarImpressora(id, context = {}) {
  const { confirm, getPrinterById, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, podeGerenciarImpressoras, printerBackendRequest } = context;
  const impressora = getPrinterById(id);
  if (!impressora || !podeGerenciarImpressoras()) return;
  if (!confirm(`Remover ${impressora.name} da lista? As credenciais de conexão serão apagadas. O histórico operacional será preservado.`)) return;
  try {
    await printerBackendRequest("disable", { printer_id: id });
    await hidratarImpressorasSeNecessario(true);
    mostrarToast("Impressora removida da lista e credenciais apagadas.", "sucesso");
  } catch (erro) {
    mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
  }
}

function abrirAgentesLocais(context = {}) {
  const { escaparHtml, formatarDataHora, podeGerenciarImpressoras, printerMonitoringState, window } = context;
  if (!podeGerenciarImpressoras()) return;
  const agents = printerMonitoringState.agents || [];
  const listHtml = agents.length
    ? `<div class="history-list">${agents.map((agent) => `<div class="history-item"><strong>${escaparHtml(agent.name)}</strong><span>${escaparHtml(agent.status)}${agent.last_seen_at ? ` · ${escaparHtml(formatarDataHora(agent.last_seen_at))}` : ""}</span></div>`).join("")}</div>`
    : `<p class="empty">Nenhum agente criado.</p>`;
  window.UiV3?.Dialog?.({
    title: "Simplifica Local Agent",
    content: `
      <p class="muted">O agente consulta impressoras na rede local e envia somente snapshots. Ele não recebe comandos.</p>
      ${listHtml}
      <div class="ui3-sticky-actions">
        <button class="ui3-button" data-variant="primary" type="button" data-create-agent>Criar agente</button>
      </div>
    `,
    onClose: () => {},
  });
}

async function criarAgenteLocal(context = {}) {
  const { escaparHtml, getPrinterMonitoringService, hidratarImpressorasSeNecessario, mostrarToast, printerBackendRequest, window } = context;
  try {
    const data = await printerBackendRequest("create_agent", { name: "Simplifica Local Agent" });
    window.UiV3?.Dialog?.({
      title: "Credenciais do agente",
      content: `
        <p class="printer-read-only-notice">Estas credenciais aparecem uma única vez. Guarde-as no computador que executará o agente.</p>
        <div class="metric"><span>Código de pareamento</span><strong>${escaparHtml(data.pairing_code)}</strong></div>
        <label class="field"><span>Token do agente</span><textarea readonly>${escaparHtml(data.agent_token)}</textarea></label>
        <div class="ui3-sticky-actions">
          <button class="ui3-button" data-variant="primary" type="button" data-agent-concluir>Concluir</button>
        </div>
      `,
      onClose: () => hidratarImpressorasSeNecessario(true),
    });
  } catch (erro) {
    mostrarToast(getPrinterMonitoringService()?.errorMessage(erro?.message) || erro?.message, "erro", 5200);
  }
}


async function garantirImpressorasMonitoradasCarregadas(context = {}) {
  const { hidratarImpressorasSeNecessario, printerMonitoringState } = context;
  if (!printerMonitoringState.loaded && !printerMonitoringState.loading) {
    await hidratarImpressorasSeNecessario(false);
  }
  for (let attempt = 0; printerMonitoringState.loading && attempt < 50; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  return printerMonitoringState.loaded;
}
  const api = Object.freeze({ getPrinterMonitoringService, getPrinterBackendConfig, printerBackendRequest, getPrinterRole, podeGerenciarImpressoras, podeOperarImpressoras, getImpressorasAtivas, sincronizarImpressorasComCalculadora, hidratarImpressorasSeNecessario, getPrinterCurrentStatus, getPrinterDisplayBrand, getPrinterDisplayModel, isBambuPrinterCandidate, getBambuAmsSlots, getPrinterProgressValue, getPrinterCameraStreamUrl, getBambuLanPlugin, hidratarBambuLanState, conectarBambuMqttCloudAutomatico, getBambuLanPrinter, normalizarEstadoBambuLan, getBambuVisualFingerprint, atualizarElementosStatusBambu, agendarRenderStatusBambu, aplicarStatusBambuLan, abrirConfiguracaoBambuLan, conectarBambuLan, desconectarBambuLan, atualizarFrameCameraBambuLan, abrirCameraImpressora, abrirPainelImpressora, renderResumoPlacasImpressora, carregarHistoricoCompactoImpressora, getPrinterConnectorLabel, renderPrinterStatusBadge, renderPrinterMoreActions, abrirMenuAcoesImpressora, getPedidoVinculadoImpressora, getTextoTrabalhoImpressora, getConexaoAtualImpressora, isImpressoraBambu, temNumeroImpressora, abrirPainelImpressoraSimplifica, atualizarPainelImpressoraSimplifica, renderCardImpressora, getBambuPilotProgressKey, getBambuPilotProgress, getBambuPilotProgressPercent, renderBambuPilotGuideCard, renderPrinterOrderQueue, renderImpressoras, configurarAcoesCadastroImpressora, abrirGuiaPilotoBambu, salvarProgressoPilotoBambu, getPrinterBrandOptions, getPrinterModelOptions, getPrinterModelSuggestionOptions, abrirCadastroImpressora, atualizarOrientacaoLanCadastro, atualizarEtapaCadastroImpressora, navegarEtapaCadastroImpressora, aplicarPresetCadastroImpressora, sincronizarConectorBambuPorIdentificacao, atualizarMarcaCadastroImpressora, atualizarCamposConectorImpressora, testarConexaoCadastroImpressora, valorOpcionalNumero, salvarCadastroImpressora, abrirLoginBambu, capturarRascunhoLoginBambu, restaurarRascunhoLoginBambu, limparRascunhoLoginBambu, fecharLoginBambu, renderEtapasLoginBambu, setEtapaLoginBambu, autenticarContaBambu, renderizarSelecaoDispositivoBambu, selecionarDispositivoBambu, renderizarConclusaoBambu, desconectarContaBambu, atualizarStatusImpressora, abrirStatusManualImpressora, abrirVinculoPedidoImpressora, abrirHistoricoImpressora, desativarImpressora, abrirAgentesLocais, criarAgenteLocal, garantirImpressorasMonitoradasCarregadas });
  global.SimplificaPrintersOperations = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
