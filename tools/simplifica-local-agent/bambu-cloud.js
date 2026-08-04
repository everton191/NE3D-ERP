const { spawnSync } = require("node:child_process");

const BAMBU_API_ROOT = "https://api.bambulab.com";
const BAMBU_MQTT_URL = "mqtts://us.mqtt.bambulab.com:8883";

async function bambuRequest(pathname, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 15000);
  try {
    const response = await fetch(`${BAMBU_API_ROOT}${pathname}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data?.code && data?.message !== "success")) {
      const message = data?.message || data?.error || `Bambu HTTP ${response.status}`;
      throw new Error(String(message).slice(0, 240));
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function loginBambu({ account, password, code }) {
  const body = { account: String(account || "").trim() };
  if (code) body.code = String(code).trim();
  else body.password = String(password || "");
  const data = await bambuRequest("/v1/user-service/user/login", { method: "POST", body });
  if (!data?.accessToken) {
    if (String(data?.loginType || "").toLowerCase().includes("verify")) throw new Error("BAMBU_VERIFICATION_CODE_REQUIRED");
    throw new Error("BAMBU_ACCESS_TOKEN_MISSING");
  }
  return { accessToken: data.accessToken, expiresIn: Number(data.expiresIn) || null };
}

async function getBambuAccount(accessToken) {
  const data = await bambuRequest("/v1/design-user-service/my/preference", { accessToken });
  if (!data?.uid) throw new Error("BAMBU_UID_MISSING");
  return { uid: String(data.uid), mqttUsername: `u_${data.uid}` };
}

async function listBambuDevices(accessToken) {
  const data = await bambuRequest("/v1/iot-service/api/user/bind", { accessToken });
  return (Array.isArray(data?.devices) ? data.devices : []).map((device) => ({
    id: String(device.dev_id || "").trim(),
    name: String(device.name || device.dev_product_name || device.dev_id || "Bambu").trim(),
    model: String(device.dev_product_name || device.dev_model_name || "Bambu Lab").trim(),
    online: device.online === true,
    state: device.print_status || "unknown",
  })).filter((device) => device.id);
}

function runDpapi(script, input) {
  if (process.platform !== "win32") throw new Error("DPAPI_AVAILABLE_ONLY_ON_WINDOWS");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
    input: String(input),
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`DPAPI_FAILED: ${String(result.stderr || "").trim()}`);
  return String(result.stdout || "").trim();
}

function protectToken(accessToken) {
  const script = "$s=[Console]::In.ReadToEnd(); Add-Type -AssemblyName System.Security; $b=[Text.Encoding]::UTF8.GetBytes($s); $e=[Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Convert]::ToBase64String($e)";
  return `dpapi:${runDpapi(script, accessToken)}`;
}

function unprotectToken(protectedToken) {
  const value = String(protectedToken || "");
  if (!value.startsWith("dpapi:")) throw new Error("BAMBU_TOKEN_NOT_DPAPI_PROTECTED");
  const script = "$s=[Console]::In.ReadToEnd().Trim(); Add-Type -AssemblyName System.Security; $e=[Convert]::FromBase64String($s); $b=[Security.Cryptography.ProtectedData]::Unprotect($e,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Text.Encoding]::UTF8.GetString($b)";
  return runDpapi(script, value.slice(6));
}

function normalizeBambuState(value) {
  const state = String(value || "").toUpperCase();
  if (["RUNNING", "PRINTING", "PREPARE"].includes(state)) return "printing";
  if (state.includes("PAUSE")) return "paused";
  if (["FINISH", "FINISHED", "SUCCESS", "COMPLETED"].includes(state)) return "finished";
  if (["IDLE", "READY"].includes(state)) return "idle";
  if (state.includes("FAIL") || state.includes("ERROR")) return "error";
  if (state.includes("OFFLINE")) return "offline";
  return "unknown";
}

function bambuPrintToSnapshot(print = {}) {
  const remainingMinutes = Number(print.mc_remaining_time);
  const progress = Number(print.mc_percent ?? print.print_percent ?? print.progress);
  const raw = {
    layer_num: print.layer_num ?? null,
    total_layer_num: print.total_layer_num ?? null,
    chamber_temper: print.chamber_temper ?? null,
    ams: print.ams ?? null,
    wifi_signal: print.wifi_signal ?? null,
  };
  return {
    state: normalizeBambuState(print.gcode_state || print.print_status || print.task_status || print.state),
    progress_percent: Number.isFinite(progress) ? progress : null,
    nozzle_temp: numberOrNull(print.nozzle_temper ?? print.nozzle_temp),
    nozzle_target_temp: numberOrNull(print.nozzle_target_temper ?? print.nozzle_target_temp),
    bed_temp: numberOrNull(print.bed_temper ?? print.bed_temp),
    bed_target_temp: numberOrNull(print.bed_target_temper ?? print.bed_target_temp),
    current_file: print.subtask_name || print.gcode_file || print.task_name || null,
    remaining_seconds: Number.isFinite(remainingMinutes) ? Math.max(0, Math.round(remainingMinutes * 60)) : null,
    error_message: String(print.mc_print_error_code || print.print_error || "0") !== "0" ? `Bambu erro ${print.mc_print_error_code || print.print_error}` : null,
    raw_payload: raw,
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function readBambuCloudStatus(printer, accessToken) {
  const data = await bambuRequest("/v1/iot-service/api/user/print?force=true", { accessToken });
  const device = (Array.isArray(data?.devices) ? data.devices : []).find((item) => String(item.dev_id) === String(printer.bambuDeviceId));
  if (!device) throw new Error("BAMBU_DEVICE_NOT_FOUND");
  return bambuPrintToSnapshot(device);
}

function startBambuMqttMonitor({ printer, accessToken, mqttUsername, onSnapshot, onError }) {
  const mqtt = require("mqtt");
  const deviceId = String(printer.bambuDeviceId || "").trim();
  if (!deviceId || !mqttUsername || !accessToken) throw new Error("BAMBU_MQTT_CONFIG_INCOMPLETE");
  let accumulated = {};
  const client = mqtt.connect(printer.bambuMqttUrl || BAMBU_MQTT_URL, {
    username: mqttUsername,
    password: accessToken,
    protocolVersion: 4,
    rejectUnauthorized: true,
    reconnectPeriod: 10000,
    connectTimeout: 15000,
    clientId: `simplifica_${Math.random().toString(16).slice(2, 14)}`,
  });
  const topic = `device/${deviceId}/report`;
  client.on("connect", () => client.subscribe(topic, { qos: 0 }, (error) => error && onError(error)));
  client.on("message", (_topic, payload) => {
    try {
      const message = JSON.parse(payload.toString("utf8"));
      if (!message?.print) return;
      accumulated = { ...accumulated, ...message.print };
      onSnapshot(bambuPrintToSnapshot(accumulated));
    } catch (error) {
      onError(error);
    }
  });
  client.on("error", onError);
  return client;
}

module.exports = {
  BAMBU_API_ROOT,
  BAMBU_MQTT_URL,
  bambuPrintToSnapshot,
  getBambuAccount,
  listBambuDevices,
  loginBambu,
  protectToken,
  readBambuCloudStatus,
  startBambuMqttMonitor,
  unprotectToken,
};
