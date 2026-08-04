const fs = require("node:fs");
const path = require("node:path");
const { readBambuCloudStatus, startBambuMqttMonitor, unprotectToken } = require("./bambu-cloud");

const configPath = path.resolve(process.argv[2] || process.env.SIMPLIFICA_AGENT_CONFIG || "config.json");

function readConfig() {
  if (!fs.existsSync(configPath)) throw new Error(`Arquivo de configuracao nao encontrado: ${configPath}`);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!/^https:\/\//i.test(String(config.endpoint || ""))) throw new Error("endpoint HTTPS obrigatorio");
  if (String(config.agentToken || "").length < 48) throw new Error("agentToken invalido");
  if (!Array.isArray(config.printers) || !config.printers.length) throw new Error("Nenhuma impressora configurada");
  return config;
}

function normalizedState(value) {
  const state = String(value || "").toLowerCase();
  if (/(complete|finished|success|done)/.test(state)) return "finished";
  if (/(print|running|busy|processing)/.test(state)) return "printing";
  if (/(pause)/.test(state)) return "paused";
  if (/(ready|operational|standby|idle)/.test(state)) return "idle";
  if (/(maintenance|service)/.test(state)) return "maintenance";
  if (/(offline|disconnected|unreachable)/.test(state)) return "offline";
  if (/(error|failed|failure|shutdown|fault)/.test(state)) return "error";
  return "unknown";
}

function baseUrl(printer) {
  const host = String(printer.host || "").trim();
  if (!host) throw new Error("host obrigatorio");
  const url = new URL(/^https?:\/\//i.test(host) ? host : `http://${host}`);
  if (printer.port && !url.port) url.port = String(printer.port);
  return url.toString().replace(/\/+$/, "");
}

async function readJson(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers }, signal: controller.signal });
    if (response.status === 401 || response.status === 403) throw new Error("credencial rejeitada");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function readPrinter(printer) {
  const connector = String(printer.connector || "").toLowerCase();
  if (connector === "bambu") {
    return readBambuCloudStatus(printer, unprotectToken(printer.bambuProtectedToken));
  }
  const root = baseUrl(printer);
  if (connector === "octoprint") {
    const headers = printer.apiToken ? { "X-Api-Key": printer.apiToken } : {};
    const [status, job] = await Promise.all([readJson(`${root}/api/printer`, headers), readJson(`${root}/api/job`, headers)]);
    return {
      state: normalizedState(status?.state?.text || job?.state),
      progress_percent: job?.progress?.completion,
      nozzle_temp: status?.temperature?.tool0?.actual,
      nozzle_target_temp: status?.temperature?.tool0?.target,
      bed_temp: status?.temperature?.bed?.actual,
      bed_target_temp: status?.temperature?.bed?.target,
      current_file: job?.job?.file?.display || job?.job?.file?.name,
      elapsed_seconds: job?.progress?.printTime,
      remaining_seconds: job?.progress?.printTimeLeft,
      error_message: status?.state?.error || null,
    };
  }
  if (connector === "moonraker") {
    const headers = printer.apiToken ? { Authorization: `Bearer ${printer.apiToken}` } : {};
    const data = await readJson(`${root}/printer/objects/query?print_stats&virtual_sdcard&extruder&heater_bed&webhooks&display_status`, headers);
    const status = data?.result?.status || {};
    const stats = status.print_stats || {};
    const progress = status.virtual_sdcard?.progress ?? status.display_status?.progress;
    return {
      state: normalizedState(stats.state || status.webhooks?.state),
      progress_percent: Number(progress) * 100,
      nozzle_temp: status.extruder?.temperature,
      nozzle_target_temp: status.extruder?.target,
      bed_temp: status.heater_bed?.temperature,
      bed_target_temp: status.heater_bed?.target,
      current_file: stats.filename,
      elapsed_seconds: stats.print_duration,
      remaining_seconds: progress > 0 ? (stats.print_duration / progress) - stats.print_duration : null,
      error_message: stats.message || status.webhooks?.state_message || null,
    };
  }
  if (connector === "prusalink") {
    const headers = {};
    if (printer.apiToken) headers.Authorization = `Bearer ${printer.apiToken}`;
    else if (printer.username || printer.password) headers.Authorization = `Basic ${Buffer.from(`${printer.username || ""}:${printer.password || ""}`).toString("base64")}`;
    const [status, job] = await Promise.all([
      readJson(`${root}/api/v1/status`, headers),
      readJson(`${root}/api/v1/job`, headers).catch(() => ({})),
    ]);
    return {
      state: normalizedState(status?.printer?.state || status?.state || job?.state),
      progress_percent: job?.progress ?? status?.job?.progress,
      nozzle_temp: status?.printer?.temp_nozzle,
      nozzle_target_temp: status?.printer?.target_nozzle,
      bed_temp: status?.printer?.temp_bed,
      bed_target_temp: status?.printer?.target_bed,
      current_file: job?.file?.display_name || job?.file?.name,
      elapsed_seconds: job?.time_printing,
      remaining_seconds: job?.time_remaining,
      error_message: status?.error || null,
    };
  }
  throw new Error(`Conector nao suportado: ${connector}`);
}

async function sendSnapshot(config, printer, snapshot) {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-simplifica-agent-token": config.agentToken,
    },
    body: JSON.stringify({ action: "agent_status", printer_id: printer.id, ...snapshot, timestamp: new Date().toISOString() }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Simplifica HTTP ${response.status}`);
}

function nextDelay(state) {
  if (state === "printing") return 30000;
  if (state === "offline") return 300000;
  return 120000;
}

async function pollPrinter(config, printer) {
  let state = "unknown";
  try {
    const snapshot = await readPrinter(printer);
    state = snapshot.state;
    await sendSnapshot(config, printer, snapshot);
    console.log(`[${new Date().toISOString()}] ${printer.name || printer.id}: ${state}`);
  } catch (error) {
    state = "offline";
    const message = String(error?.message || error).slice(0, 300);
    try {
      await sendSnapshot(config, printer, { state, error_message: message });
    } catch (sendError) {
      console.error(`[${new Date().toISOString()}] ${printer.name || printer.id}: ${message}; envio: ${sendError.message}`);
    }
  }
  setTimeout(() => pollPrinter(config, printer), nextDelay(state));
}

function startBambuPrinter(config, printer) {
  const accessToken = unprotectToken(printer.bambuProtectedToken);
  let lastSentAt = 0;
  let pendingSnapshot = null;
  let sendTimer = null;
  const flush = async () => {
    sendTimer = null;
    if (!pendingSnapshot) return;
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    try {
      await sendSnapshot(config, printer, snapshot);
      lastSentAt = Date.now();
      console.log(`[${new Date().toISOString()}] ${printer.name || printer.id}: ${snapshot.state} (Bambu MQTT)`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ${printer.name || printer.id}: envio MQTT: ${error.message}`);
    }
  };
  const queueSnapshot = (snapshot) => {
    pendingSnapshot = snapshot;
    const delay = Math.max(0, 15000 - (Date.now() - lastSentAt));
    if (!sendTimer) sendTimer = setTimeout(flush, delay);
  };
  startBambuMqttMonitor({
    printer,
    accessToken,
    mqttUsername: printer.bambuMqttUsername,
    onSnapshot: queueSnapshot,
    onError: (error) => console.error(`[${new Date().toISOString()}] ${printer.name || printer.id}: Bambu MQTT: ${error.message}`),
  });
  setTimeout(() => pollPrinter(config, printer), 1000);
}

async function main() {
  const config = readConfig();
  console.log(`Simplifica Local Agent iniciado com ${config.printers.length} impressora(s). Somente leitura.`);
  config.printers.forEach((printer, index) => {
    if (String(printer.connector || "").toLowerCase() === "bambu") {
      setTimeout(() => startBambuPrinter(config, printer), index * 1000);
      return;
    }
    setTimeout(() => pollPrinter(config, printer), index * 1000);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
