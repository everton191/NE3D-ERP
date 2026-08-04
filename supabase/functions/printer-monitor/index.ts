import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CREDENTIALS_SECRET = Deno.env.get("PRINTER_CREDENTIALS_SECRET") || "";
const BAMBU_API_ROOT = "https://api.bambulab.com";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-simplifica-agent-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizedStates = new Set(["idle", "printing", "paused", "finished", "error", "offline", "unknown", "maintenance"]);
const automaticConnectors = new Set(["octoprint", "moonraker", "prusalink", "bambu"]);
const managementRoles = new Set(["owner", "admin"]);
const operationalRoles = new Set(["owner", "admin", "manager", "production"]);
const viewRoles = new Set(["owner", "admin", "manager", "production", "sales", "viewer"]);

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleanText(value: unknown, max = 240) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function cleanNumber(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, number));
}

function normalizeRole(value: unknown) {
  const role = cleanText(value, 40).toLowerCase();
  if (["owner", "dono", "user", "usuario"].includes(role)) return "owner";
  if (["admin", "administrator"].includes(role)) return "admin";
  if (["manager", "gerente", "supervisor"].includes(role)) return "manager";
  if (["production", "producao"].includes(role)) return "production";
  if (["sales", "vendas", "attendant", "operador"].includes(role)) return "sales";
  if (["viewer", "visualizador", "read_only"].includes(role)) return "viewer";
  if (["cashier", "caixa", "finance"].includes(role)) return "cashier";
  return "viewer";
}

function normalizePlan(value: unknown) {
  const plan = cleanText(value, 40).toLowerCase().replace(/-/g, "_");
  if (["pro", "premium", "premium_trial", "premium_monthly"].includes(plan)) return "pro";
  if (["start", "starter", "start_monthly"].includes(plan)) return "start";
  return "free";
}

function normalizeState(value: unknown) {
  const raw = cleanText(value, 120).toLowerCase();
  if (!raw) return "unknown";
  if (normalizedStates.has(raw)) return raw;
  if (/(cancel|complete|finished|success|done)/.test(raw)) return "finished";
  if (/(print|running|busy|processing)/.test(raw)) return "printing";
  if (/(pause|paused)/.test(raw)) return "paused";
  if (/(ready|operational|standby|idle)/.test(raw)) return "idle";
  if (/(maintenance|service)/.test(raw)) return "maintenance";
  if (/(offline|disconnected|unreachable)/.test(raw)) return "offline";
  if (/(error|failed|failure|shutdown|fault)/.test(raw)) return "error";
  return "unknown";
}

function bearerToken(request: Request) {
  return (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey() {
  if (CREDENTIALS_SECRET.length < 32) throw new Error("PRINTER_CREDENTIALS_SECRET_NOT_CONFIGURED");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(CREDENTIALS_SECRET));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptCredentials(credentials: Record<string, unknown>) {
  if (!Object.values(credentials).some((value) => String(value || "").trim())) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(credentials)),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function decryptCredentials(ciphertext: string | null) {
  if (!ciphertext) return {};
  const [version, ivValue, encryptedValue] = ciphertext.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) throw new Error("INVALID_PRINTER_CREDENTIALS");
  const key = await encryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivValue) },
    key,
    base64ToBytes(encryptedValue),
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function getContext(request: Request, requestedCompanyId = "") {
  const token = bearerToken(request);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) throw new Error("UNAUTHENTICATED");
  const userId = userData.user.id;

  const [{ data: profile }, { data: erpProfile }] = await Promise.all([
    supabase.from("profiles").select("company_id,client_id,role,status").eq("user_id", userId).maybeSingle(),
    supabase.from("erp_profiles").select("company_id,client_id,role,status").eq("id", userId).maybeSingle(),
  ]);
  const isSuperadmin = String(profile?.role || erpProfile?.role || "").toLowerCase() === "superadmin";
  let companyId = cleanText(requestedCompanyId || profile?.company_id || erpProfile?.company_id, 60);
  const clientId = cleanText(profile?.client_id || erpProfile?.client_id, 60);

  if (!companyId && clientId) {
    const { data: client } = await supabase.from("clients").select("company_id").eq("id", clientId).maybeSingle();
    companyId = cleanText(client?.company_id, 60);
  }
  if (!companyId) {
    const { data: member } = await supabase
      .from("company_members")
      .select("company_id,role,status")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    companyId = cleanText(member?.company_id, 60);
  }
  if (!companyId) throw new Error("COMPANY_NOT_LINKED");

  let memberRole = normalizeRole(profile?.role || erpProfile?.role);
  if (!isSuperadmin) {
    const { data: membership } = await supabase
      .from("company_members")
      .select("role,status")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (!membership && companyId !== profile?.company_id && companyId !== erpProfile?.company_id) throw new Error("COMPANY_ACCESS_DENIED");
    memberRole = normalizeRole(membership?.role || profile?.role || erpProfile?.role);
  } else {
    memberRole = "owner";
  }

  let subscriptionQuery = supabase
    .from("subscriptions")
    .select("status,status_assinatura,active_plan,subscription_status,plan_id,plans(slug)")
    .limit(1);
  subscriptionQuery = clientId ? subscriptionQuery.eq("client_id", clientId) : subscriptionQuery.eq("company_id", companyId);
  const { data: subscription } = await subscriptionQuery.maybeSingle();
  const plan = isSuperadmin
    ? "pro"
    : normalizePlan(subscription?.active_plan || subscription?.subscription_status || subscription?.plans?.slug);
  const subscriptionStatus = cleanText(subscription?.status || subscription?.status_assinatura || "active", 30).toLowerCase();
  const planActive = isSuperadmin || ["active", "trialing"].includes(subscriptionStatus) || (plan === "free" && !subscription);

  return { userId, companyId, clientId, role: memberRole, plan, planActive, isSuperadmin };
}

function assertViewAccess(context: Awaited<ReturnType<typeof getContext>>) {
  if (!context.planActive) throw new Error("SUBSCRIPTION_INACTIVE");
  if (!viewRoles.has(context.role)) throw new Error("ROLE_BLOCKED");
}

function assertOperationalAccess(context: Awaited<ReturnType<typeof getContext>>) {
  assertViewAccess(context);
  if (!operationalRoles.has(context.role)) throw new Error("ROLE_BLOCKED");
}

function assertManagementAccess(context: Awaited<ReturnType<typeof getContext>>) {
  assertViewAccess(context);
  if (!managementRoles.has(context.role)) throw new Error("ROLE_BLOCKED");
}

function sanitizePrinter(row: Record<string, unknown>) {
  const { credential_ciphertext: _secret, ...safe } = row;
  return { ...safe, credentials_configured: Boolean(row.credential_ciphertext), credential_hint: row.credential_hint || "" };
}

async function listPrinters(context: Awaited<ReturnType<typeof getContext>>) {
  assertViewAccess(context);
  const { data: rows, error } = await supabase
    .from("printers")
    .select("*,printer_brands(name,slug),printer_models(name,slug)")
    .eq("company_id", context.companyId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const ids = (rows || []).map((row) => row.id);
  if (!ids.length) return [];
  const [{ data: snapshots }, { data: links }, { data: assignments }] = await Promise.all([
    supabase.from("printer_status_snapshots").select("*").in("printer_id", ids).order("created_at", { ascending: false }).limit(300),
    supabase.from("printer_order_links").select("*").in("printer_id", ids).in("status", ["linked", "printing"]).order("created_at", { ascending: false }),
    supabase.from("local_agent_printers").select("printer_id,agent_id").in("printer_id", ids),
  ]);
  const latest = new Map<string, Record<string, unknown>>();
  (snapshots || []).forEach((snapshot) => {
    if (!latest.has(snapshot.printer_id)) latest.set(snapshot.printer_id, snapshot);
  });
  const activeLinks = new Map<string, Record<string, unknown>>();
  (links || []).forEach((link) => {
    if (!activeLinks.has(link.printer_id)) activeLinks.set(link.printer_id, link);
  });
  const activeAgents = new Map<string, string>();
  (assignments || []).forEach((assignment) => {
    if (!activeAgents.has(assignment.printer_id)) activeAgents.set(assignment.printer_id, assignment.agent_id);
  });
  return (rows || []).map((row) => ({
    ...sanitizePrinter(row),
    latest_status: latest.get(row.id) || null,
    active_order_link: activeLinks.get(row.id) || null,
    active_agent_id: activeAgents.get(row.id) || null,
  }));
}

async function listPrinterWorkspace(context: Awaited<ReturnType<typeof getContext>>) {
  const [printers, brandsResult, modelsResult, connectorsResult, agentsResult] = await Promise.all([
    listPrinters(context),
    supabase.from("printer_brands").select("id,name,slug").eq("is_active", true).order("name"),
    supabase.from("printer_models").select("id,brand_id,name,slug,printer_type").eq("is_active", true).order("name"),
    supabase.from("printer_connector_types").select("key,name,description,supports_monitoring,supports_remote_control").eq("is_active", true).order("name"),
    managementRoles.has(context.role)
      ? supabase.from("local_agents").select("id,name,status,last_seen_at,created_at").eq("company_id", context.companyId).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);
  return {
    printers,
    brands: brandsResult.data || [],
    models: modelsResult.data || [],
    connectors: connectorsResult.data || [],
    agents: agentsResult.data || [],
    access: { role: context.role, plan: context.plan, plan_active: context.planActive, read_only_connectors: true },
  };
}

async function getPrinter(context: Awaited<ReturnType<typeof getContext>>, printerId: string, includeSecret = false) {
  const { data, error } = await supabase
    .from("printers")
    .select("*")
    .eq("id", printerId)
    .eq("company_id", context.companyId)
    .maybeSingle();
  if (error || !data) throw new Error("PRINTER_NOT_FOUND");
  return includeSecret ? data : sanitizePrinter(data);
}

function automaticConnectorLimit(plan: string) {
  if (plan === "free") return 1;
  return Number.POSITIVE_INFINITY;
}

async function savePrinter(context: Awaited<ReturnType<typeof getContext>>, input: Record<string, unknown>) {
  assertManagementAccess(context);
  const id = cleanText(input.id, 60);
  const connectorType = cleanText(input.connector_type || "manual", 30).toLowerCase();
  const connectionMode = cleanText(input.connection_mode || (connectorType === "manual" ? "manual" : "local_agent"), 30).toLowerCase();
  if (!["manual", "octoprint", "moonraker", "prusalink", "bambu", "none"].includes(connectorType)) throw new Error("INVALID_CONNECTOR");
  if (!["manual", "browser_local", "local_agent", "cloud_supported"].includes(connectionMode)) throw new Error("INVALID_CONNECTION_MODE");
  const existing = id ? await getPrinter(context, id, true) : null;
  const becomesAutomatic = automaticConnectors.has(connectorType) && !automaticConnectors.has(String(existing?.connector_type || ""));
  const agentId = cleanText(input.agent_id, 60);
  let selectedAgent: Record<string, unknown> | null = null;
  if (connectionMode === "local_agent" && agentId) {
    const { data: agent } = await supabase
      .from("local_agents")
      .select("id")
      .eq("id", agentId)
      .eq("company_id", context.companyId)
      .eq("status", "active")
      .maybeSingle();
    if (!agent) throw new Error("LOCAL_AGENT_NOT_FOUND");
    selectedAgent = agent;
  }

  if (becomesAutomatic) {
    const { count } = await supabase
      .from("printers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", context.companyId)
      .eq("active", true)
      .in("connector_type", Array.from(automaticConnectors));
    if ((count || 0) >= automaticConnectorLimit(context.plan)) throw new Error("AUTOMATIC_PRINTER_LIMIT_REACHED");
  }

  const credentials = {
    apiToken: cleanText(input.api_token, 1000),
    username: cleanText(input.username, 240),
    password: cleanText(input.password, 1000),
  };
  const hasNewCredentials = Object.values(credentials).some(Boolean);
  const credentialCiphertext = hasNewCredentials
    ? await encryptCredentials(credentials)
    : existing?.credential_ciphertext || null;
  const credentialHint = credentials.apiToken
    ? `token ...${credentials.apiToken.slice(-4)}`
    : credentials.username
      ? `usuario ${credentials.username.slice(0, 3)}...`
      : existing?.credential_hint || null;
  const payload = {
    company_id: context.companyId,
    name: cleanText(input.name, 120),
    brand_id: cleanText(input.brand_id, 60) || null,
    model_id: cleanText(input.model_id, 60) || null,
    custom_brand: cleanText(input.custom_brand, 120) || null,
    custom_model: cleanText(input.custom_model, 120) || null,
    printer_type: cleanText(input.printer_type || "fdm", 20).toLowerCase(),
    status: cleanText(input.status || existing?.status || "active", 30).toLowerCase(),
    manual_status: normalizeState(input.manual_status || existing?.manual_status || "idle"),
    location: cleanText(input.location, 160) || null,
    notes: cleanText(input.notes, 2000) || null,
    purchase_price: cleanNumber(input.purchase_price),
    purchase_date: cleanText(input.purchase_date, 10) || null,
    estimated_lifetime_months: cleanNumber(input.estimated_lifetime_months, 0, 1200),
    power_watts: cleanNumber(input.power_watts, 0, 100000),
    hourly_cost: cleanNumber(input.hourly_cost, 0, 1000000),
    monthly_maintenance_cost: cleanNumber(input.monthly_maintenance_cost, 0, 1000000),
    connector_type: connectorType,
    connection_mode: connectorType === "manual" ? "manual" : connectionMode,
    host: automaticConnectors.has(connectorType) ? cleanText(input.host, 500) || null : null,
    port: automaticConnectors.has(connectorType) ? cleanNumber(input.port, 1, 65535) : null,
    credential_ciphertext: automaticConnectors.has(connectorType) ? credentialCiphertext : null,
    credential_hint: automaticConnectors.has(connectorType) ? credentialHint : null,
    connection_status: connectorType === "manual" ? "not_configured" : existing?.connection_status || "not_configured",
    updated_by: context.userId,
  };
  if (!payload.name) throw new Error("PRINTER_NAME_REQUIRED");

  let saved;
  if (id) {
    const { data, error } = await supabase.from("printers").update(payload).eq("id", id).eq("company_id", context.companyId).select("*").single();
    if (error) throw error;
    saved = data;
  } else {
    const { data, error } = await supabase.from("printers").insert({ ...payload, created_by: context.userId }).select("*").single();
    if (error) throw error;
    saved = data;
  }
  await supabase.from("printer_events").insert({
    company_id: context.companyId,
    printer_id: saved.id,
    event_type: id ? "updated" : "created",
    message: id ? "Cadastro da impressora atualizado." : "Impressora cadastrada.",
    created_by: context.userId,
    metadata: { connector_type: connectorType, connection_mode: payload.connection_mode, read_only: true },
  });
  await supabase.from("local_agent_printers").delete().eq("printer_id", saved.id);
  if (payload.connection_mode === "local_agent" && selectedAgent?.id) {
    const { error: assignmentError } = await supabase.from("local_agent_printers").insert({
      company_id: context.companyId,
      agent_id: selectedAgent.id,
      printer_id: saved.id,
    });
    if (assignmentError) throw assignmentError;
  }
  return sanitizePrinter(saved);
}

function baseUrl(printer: Record<string, unknown>) {
  const host = cleanText(printer.host, 500);
  if (!host) throw new Error("HOST_REQUIRED");
  const withProtocol = /^https?:\/\//i.test(host) ? host : `http://${host}`;
  const parsed = new URL(withProtocol);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("INVALID_HOST_PROTOCOL");
  if (printer.port && !parsed.port) parsed.port = String(printer.port);
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" || hostname === "::1" || hostname.endsWith(".local")
    || /^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  ) {
    throw new Error("LOCAL_NETWORK_REQUIRES_AGENT");
  }
  return parsed.toString().replace(/\/+$/, "");
}

async function readJson(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const result = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers }, signal: controller.signal });
    const data = await result.json().catch(() => ({}));
    if (result.status === 401 || result.status === 403) throw new Error("CONNECTOR_UNAUTHORIZED");
    if (!result.ok) throw new Error(`CONNECTOR_HTTP_${result.status}`);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("CONNECTOR_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function bambuCloudRequest(pathname: string, options: { method?: string; accessToken?: string; body?: Record<string, unknown> } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const result = await fetch(`${BAMBU_API_ROOT}${pathname}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const data = await result.json().catch(() => ({}));
    if (result.status === 401 || result.status === 403) throw new Error("BAMBU_LOGIN_REJECTED");
    if (!result.ok) throw new Error("BAMBU_SERVICE_UNAVAILABLE");
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("BAMBU_LOGIN_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeBambuDevices(data: Record<string, unknown>) {
  return (Array.isArray(data?.devices) ? data.devices : []).map((raw) => {
    const device = raw as Record<string, unknown>;
    return {
      id: cleanText(device.dev_id, 160),
      name: cleanText(device.name || device.dev_name || device.dev_product_name || "Impressora Bambu", 120),
      model: cleanText(device.dev_product_name || device.dev_model_name || "Bambu Lab", 120),
      online: device.online === true,
    };
  }).filter((device) => device.id);
}

async function connectBambuAccount(context: Awaited<ReturnType<typeof getContext>>, printerId: string, input: Record<string, unknown>) {
  assertManagementAccess(context);
  const printer = await getPrinter(context, printerId, true);
  const firstConnection = !String(printer.credential_ciphertext || "");
  if (!["manual", "bambu"].includes(String(printer.connector_type || ""))) throw new Error("BAMBU_PRINTER_REQUIRED");
  if (printer.connector_type === "manual") {
    const { count } = await supabase
      .from("printers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", context.companyId)
      .eq("active", true)
      .in("connector_type", Array.from(automaticConnectors));
    if ((count || 0) >= automaticConnectorLimit(context.plan)) throw new Error("AUTOMATIC_PRINTER_LIMIT_REACHED");
  }
  const account = cleanText(input.account, 240);
  const password = String(input.password || "").slice(0, 1000);
  const code = cleanText(input.code, 40);
  if (!account || (!password && !code)) throw new Error("BAMBU_LOGIN_FIELDS_REQUIRED");
  const loginBody: Record<string, unknown> = { account };
  if (code) loginBody.code = code;
  else loginBody.password = password;
  const login = await bambuCloudRequest("/v1/user-service/user/login", { method: "POST", body: loginBody });
  const accessToken = String(login?.accessToken || "");
  if (!accessToken) {
    const loginDetails = JSON.stringify(login || {}).toLowerCase();
    if (/verify|verification|code|email|2fa|two.factor/.test(loginDetails)) throw new Error("BAMBU_VERIFICATION_CODE_REQUIRED");
    throw new Error("BAMBU_LOGIN_REJECTED");
  }
  const [accountData, devicesData] = await Promise.all([
    bambuCloudRequest("/v1/design-user-service/my/preference", { accessToken }),
    bambuCloudRequest("/v1/iot-service/api/user/bind", { accessToken }),
  ]);
  const devices = sanitizeBambuDevices(devicesData);
  if (!devices.length) throw new Error("BAMBU_NO_PRINTERS_FOUND");
  const selected = context.plan === "free"
    ? devices[devices.length - 1]
    : (devices.find((device) => device.id === cleanText(input.device_id, 160)) || devices[0]);
  const credentials = {
    apiToken: accessToken,
    bambuDeviceId: selected.id,
    bambuUid: cleanText(accountData?.uid, 120),
  };
  const credentialCiphertext = await encryptCredentials(credentials);
  const { error } = await supabase.from("printers").update({
    connector_type: "bambu",
    connection_mode: "cloud_supported",
    host: BAMBU_API_ROOT,
    credential_ciphertext: credentialCiphertext,
    credential_hint: "Conta Bambu conectada",
    name: selected.name,
    custom_brand: "Bambu Lab",
    custom_model: selected.model,
    connection_status: selected.online ? "connected" : "offline",
    last_error: null,
    updated_by: context.userId,
  }).eq("id", printer.id).eq("company_id", context.companyId);
  if (error) throw error;
  const importedPrinterIds: string[] = [printer.id];
  if (firstConnection && context.plan !== "free" && devices.length > 1) {
    const extraDevices = devices.filter((device) => device.id !== selected.id);
    const rows = await Promise.all(extraDevices.map(async (device) => ({
      company_id: context.companyId,
      created_by: context.userId,
      updated_by: context.userId,
      name: device.name,
      custom_brand: "Bambu Lab",
      custom_model: device.model,
      printer_type: "fdm",
      connector_type: "bambu",
      connection_mode: "cloud_supported",
      host: BAMBU_API_ROOT,
      credential_ciphertext: await encryptCredentials({ apiToken: accessToken, bambuDeviceId: device.id, bambuUid: cleanText(accountData?.uid, 120) }),
      credential_hint: "Conta Bambu conectada",
      connection_status: device.online ? "connected" : "offline",
      active: true,
    })));
    if (rows.length) {
      const { data: imported, error: importError } = await supabase.from("printers").insert(rows).select("id");
      if (importError) throw importError;
      importedPrinterIds.push(...(imported || []).map((item) => String(item.id)));
    }
  }
  await supabase.from("printer_events").insert({
    company_id: context.companyId,
    printer_id: printer.id,
    event_type: "bambu_account_connected",
    message: "Conta Bambu conectada em modo somente leitura.",
    created_by: context.userId,
    metadata: { device_id_suffix: selected.id.slice(-4), read_only: true },
  });
  return { connected: true, devices, selected_device_id: selected.id, imported_printer_ids: importedPrinterIds, requires_device_selection: false, free_plan_last_printer_only: context.plan === "free" && devices.length > 1 };
}

async function selectBambuDevice(context: Awaited<ReturnType<typeof getContext>>, printerId: string, deviceId: unknown) {
  assertManagementAccess(context);
  const printer = await getPrinter(context, printerId, true);
  if (printer.connector_type !== "bambu") throw new Error("BAMBU_PRINTER_REQUIRED");
  const credentials = await decryptCredentials(String(printer.credential_ciphertext || ""));
  const accessToken = String(credentials.apiToken || "");
  if (!accessToken) throw new Error("BAMBU_ACCOUNT_NOT_CONNECTED");
  const devicesData = await bambuCloudRequest("/v1/iot-service/api/user/bind", { accessToken });
  const devices = sanitizeBambuDevices(devicesData);
  const selected = devices.find((device) => device.id === cleanText(deviceId, 160));
  if (!selected) throw new Error("BAMBU_DEVICE_NOT_FOUND");
  const credentialCiphertext = await encryptCredentials({ ...credentials, bambuDeviceId: selected.id });
  const { error } = await supabase.from("printers").update({
    credential_ciphertext: credentialCiphertext,
    custom_model: selected.model,
    connection_status: selected.online ? "connected" : "offline",
    updated_by: context.userId,
  }).eq("id", printer.id).eq("company_id", context.companyId);
  if (error) throw error;
  return { selected: true, selected_device_id: selected.id };
}

async function getBambuMqttCredentials(context: Awaited<ReturnType<typeof getContext>>, printerId: string) {
  assertManagementAccess(context);
  const printer = await getPrinter(context, printerId, true);
  if (printer.connector_type !== "bambu") throw new Error("BAMBU_PRINTER_REQUIRED");
  const credentials = await decryptCredentials(String(printer.credential_ciphertext || ""));
  const token = String(credentials.apiToken || "");
  const serial = cleanText(credentials.bambuDeviceId, 160);
  const uid = cleanText(credentials.bambuUid, 120);
  if (!token || !serial || !uid) throw new Error("BAMBU_ACCOUNT_NOT_CONNECTED");
  return {
    host: "us.mqtt.bambulab.com",
    username: `u_${uid}`,
    token,
    serial,
    expires_with_account_session: true,
  };
}

async function disconnectBambuAccount(context: Awaited<ReturnType<typeof getContext>>, printerId: string) {
  assertManagementAccess(context);
  const printer = await getPrinter(context, printerId, true);
  if (printer.connector_type !== "bambu") throw new Error("BAMBU_PRINTER_REQUIRED");
  const { error } = await supabase.from("printers").update({
    credential_ciphertext: null,
    credential_hint: null,
    connection_status: "not_configured",
    last_error: null,
    updated_by: context.userId,
  }).eq("id", printer.id).eq("company_id", context.companyId);
  if (error) throw error;
  await supabase.from("printer_events").insert({
    company_id: context.companyId,
    printer_id: printer.id,
    event_type: "bambu_account_disconnected",
    message: "Token Bambu removido.",
    created_by: context.userId,
    metadata: { read_only: true },
  });
  return { disconnected: true };
}

function statusShape(input: Record<string, unknown>) {
  return {
    state: normalizeState(input.state),
    progress_percent: cleanNumber(input.progress_percent, 0, 100),
    nozzle_temp: cleanNumber(input.nozzle_temp, -100, 1000),
    nozzle_target_temp: cleanNumber(input.nozzle_target_temp, -100, 1000),
    bed_temp: cleanNumber(input.bed_temp, -100, 1000),
    bed_target_temp: cleanNumber(input.bed_target_temp, -100, 1000),
    current_file: cleanText(input.current_file, 500) || null,
    elapsed_seconds: cleanNumber(input.elapsed_seconds, 0, 100000000),
    remaining_seconds: cleanNumber(input.remaining_seconds, 0, 100000000),
    error_message: cleanText(input.error_message, 1000) || null,
  };
}

async function fetchConnectorStatus(printer: Record<string, unknown>) {
  const connector = String(printer.connector_type || "");
  const credentials = await decryptCredentials(String(printer.credential_ciphertext || ""));
  if (connector === "bambu") {
    const accessToken = String(credentials.apiToken || "");
    const deviceId = String(credentials.bambuDeviceId || "");
    if (!accessToken || !deviceId) throw new Error("BAMBU_ACCOUNT_NOT_CONNECTED");
    const data = await bambuCloudRequest("/v1/iot-service/api/user/print?force=true", { accessToken });
    const device = (Array.isArray(data?.devices) ? data.devices : []).find((item) => String(item?.dev_id || "") === deviceId) || {};
    if (!Object.keys(device).length) throw new Error("BAMBU_DEVICE_NOT_FOUND");
    const remainingMinutes = Number(device.mc_remaining_time);
    const cloudState = device.gcode_state || device.print_status || device.task_status || device.state
      || (device.dev_online === true ? "unknown" : "offline");
    return {
      ...statusShape({
        state: cloudState,
        progress_percent: device.mc_percent ?? device.print_percent ?? device.progress,
        nozzle_temp: device.nozzle_temper ?? device.nozzle_temp,
        nozzle_target_temp: device.nozzle_target_temper ?? device.nozzle_target_temp,
        bed_temp: device.bed_temper ?? device.bed_temp,
        bed_target_temp: device.bed_target_temper ?? device.bed_target_temp,
        current_file: device.subtask_name || device.gcode_file || device.task_name,
        remaining_seconds: Number.isFinite(remainingMinutes) ? Math.max(0, Math.round(remainingMinutes * 60)) : null,
        error_message: String(device.mc_print_error_code || device.print_error || "0") !== "0" ? "Erro informado pela impressora Bambu" : null,
      }),
      raw_payload: {
        online: device.dev_online === true,
        model: cleanText(device.dev_product_name || device.dev_model_name, 120) || null,
        task_status: cleanText(device.task_status, 80) || null,
        task_name: cleanText(device.task_name, 500) || null,
        cloud_progress: cleanNumber(device.progress, 0, 100),
        layer_num: device.layer_num ?? null,
        total_layer_num: device.total_layer_num ?? null,
        chamber_temper: device.chamber_temper ?? null,
        ams: device.ams ?? null,
      },
    };
  }

  const root = baseUrl(printer);

  if (connector === "octoprint") {
    const headers = credentials.apiToken ? { "X-Api-Key": String(credentials.apiToken) } : {};
    const [printerData, jobData] = await Promise.all([
      readJson(`${root}/api/printer`, headers),
      readJson(`${root}/api/job`, headers),
    ]);
    return {
      ...statusShape({
        state: printerData?.state?.text || jobData?.state,
        progress_percent: jobData?.progress?.completion,
        nozzle_temp: printerData?.temperature?.tool0?.actual,
        nozzle_target_temp: printerData?.temperature?.tool0?.target,
        bed_temp: printerData?.temperature?.bed?.actual,
        bed_target_temp: printerData?.temperature?.bed?.target,
        current_file: jobData?.job?.file?.display || jobData?.job?.file?.name,
        elapsed_seconds: jobData?.progress?.printTime,
        remaining_seconds: jobData?.progress?.printTimeLeft,
        error_message: printerData?.state?.error,
      }),
      raw_payload: { printer: printerData, job: jobData },
    };
  }

  if (connector === "moonraker") {
    const headers = credentials.apiToken ? { Authorization: `Bearer ${credentials.apiToken}` } : {};
    const data = await readJson(`${root}/printer/objects/query?print_stats&virtual_sdcard&extruder&heater_bed&webhooks&display_status`, headers);
    const status = data?.result?.status || {};
    const printStats = status.print_stats || {};
    const progress = status.virtual_sdcard?.progress ?? status.display_status?.progress;
    return {
      ...statusShape({
        state: printStats.state || status.webhooks?.state,
        progress_percent: Number(progress) * 100,
        nozzle_temp: status.extruder?.temperature,
        nozzle_target_temp: status.extruder?.target,
        bed_temp: status.heater_bed?.temperature,
        bed_target_temp: status.heater_bed?.target,
        current_file: printStats.filename,
        elapsed_seconds: printStats.print_duration,
        remaining_seconds: progress > 0 ? (printStats.print_duration / progress) - printStats.print_duration : null,
        error_message: printStats.message || status.webhooks?.state_message,
      }),
      raw_payload: data,
    };
  }

  if (connector === "prusalink") {
    const headers: Record<string, string> = {};
    if (credentials.apiToken) headers.Authorization = `Bearer ${credentials.apiToken}`;
    else if (credentials.username || credentials.password) headers.Authorization = `Basic ${btoa(`${credentials.username || ""}:${credentials.password || ""}`)}`;
    const [statusData, jobData] = await Promise.all([
      readJson(`${root}/api/v1/status`, headers),
      readJson(`${root}/api/v1/job`, headers).catch(() => ({})),
    ]);
    return {
      ...statusShape({
        state: statusData?.printer?.state || statusData?.state || jobData?.state,
        progress_percent: jobData?.progress ?? statusData?.job?.progress,
        nozzle_temp: statusData?.printer?.temp_nozzle ?? statusData?.temperature?.tool0?.actual,
        nozzle_target_temp: statusData?.printer?.target_nozzle ?? statusData?.temperature?.tool0?.target,
        bed_temp: statusData?.printer?.temp_bed ?? statusData?.temperature?.bed?.actual,
        bed_target_temp: statusData?.printer?.target_bed ?? statusData?.temperature?.bed?.target,
        current_file: jobData?.file?.display_name || jobData?.file?.name,
        elapsed_seconds: jobData?.time_printing,
        remaining_seconds: jobData?.time_remaining,
        error_message: statusData?.error,
      }),
      raw_payload: { status: statusData, job: jobData },
    };
  }

  throw new Error("CONNECTOR_NOT_AUTOMATIC");
}

async function saveSnapshot(context: Awaited<ReturnType<typeof getContext>>, printer: Record<string, unknown>, status: Record<string, unknown>, source = "connector") {
  const normalized = statusShape(status);
  const { data: previous } = await supabase
    .from("printer_status_snapshots")
    .select("normalized_state")
    .eq("printer_id", printer.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const snapshot = {
    company_id: context.companyId,
    printer_id: printer.id,
    connector_type: printer.connector_type,
    connection_mode: printer.connection_mode,
    state: cleanText(status.state, 120) || normalized.state,
    normalized_state: normalized.state,
    progress_percent: normalized.progress_percent,
    nozzle_temp: normalized.nozzle_temp,
    nozzle_target_temp: normalized.nozzle_target_temp,
    bed_temp: normalized.bed_temp,
    bed_target_temp: normalized.bed_target_temp,
    current_file: normalized.current_file,
    elapsed_seconds: normalized.elapsed_seconds,
    remaining_seconds: normalized.remaining_seconds,
    error_message: normalized.error_message,
    raw_payload: status.raw_payload || null,
    source,
  };
  const { data, error } = await supabase.from("printer_status_snapshots").insert(snapshot).select("*").single();
  if (error) throw error;
  await supabase.from("printers").update({
    connection_status: normalized.state === "offline" ? "offline" : "connected",
    last_seen_at: new Date().toISOString(),
    last_error: normalized.error_message,
  }).eq("id", printer.id);
  if (previous?.normalized_state !== normalized.state) {
    await supabase.from("printer_events").insert({
      company_id: context.companyId,
      printer_id: printer.id,
      event_type: "status_changed",
      message: `Status alterado para ${normalized.state}.`,
      created_by: context.userId || null,
      metadata: { previous: previous?.normalized_state || null, current: normalized.state, source, read_only: true },
    });
  }
  return data;
}

async function readStatus(context: Awaited<ReturnType<typeof getContext>>, printerId: string, testOnly = false) {
  assertViewAccess(context);
  const printer = await getPrinter(context, printerId, true);
  if (!automaticConnectors.has(printer.connector_type)) throw new Error("MANUAL_PRINTER_HAS_NO_AUTOMATIC_STATUS");
  if (printer.connection_mode === "local_agent") throw new Error("STATUS_IS_RECEIVED_FROM_LOCAL_AGENT");
  if (printer.connection_mode === "browser_local") throw new Error("BROWSER_LOCAL_TEST_REQUIRED");
  try {
    const status = await fetchConnectorStatus(printer);
    const snapshot = testOnly ? null : await saveSnapshot(context, printer, status);
    await supabase.from("printers").update({ connection_status: "connected", last_seen_at: new Date().toISOString(), last_error: null }).eq("id", printer.id);
    await supabase.from("printer_events").insert({
      company_id: context.companyId,
      printer_id: printer.id,
      event_type: testOnly ? "connection_success" : "snapshot_received",
      message: testOnly ? "Conexão de leitura testada com sucesso." : "Status atualizado pelo conector.",
      created_by: context.userId,
      metadata: { connector_type: printer.connector_type, read_only: true },
    });
    return { connected: true, status: statusShape(status), snapshot };
  } catch (error) {
    const message = cleanText(error instanceof Error ? error.message : error, 500);
    const connectionStatus = message.includes("UNAUTHORIZED") ? "unauthorized" : message.includes("TIMEOUT") ? "timeout" : "error";
    await supabase.from("printers").update({ connection_status: connectionStatus, last_error: message }).eq("id", printer.id);
    await supabase.from("printer_events").insert({
      company_id: context.companyId,
      printer_id: printer.id,
      event_type: "connection_failed",
      message: "A conexão de leitura falhou.",
      created_by: context.userId,
      metadata: { connector_type: printer.connector_type, error: message, read_only: true },
    });
    throw error;
  }
}

async function updateManualStatus(context: Awaited<ReturnType<typeof getContext>>, printerId: string, state: unknown) {
  assertOperationalAccess(context);
  const printer = await getPrinter(context, printerId, true);
  if (printer.connector_type !== "manual" && context.role === "production") throw new Error("AUTOMATIC_STATUS_IS_READ_ONLY");
  const normalized = normalizeState(state);
  const { error } = await supabase.from("printers").update({
    manual_status: normalized,
    connection_status: "not_configured",
    updated_by: context.userId,
  }).eq("id", printer.id);
  if (error) throw error;
  return saveSnapshot(context, { ...printer, connector_type: "manual", connection_mode: "manual" }, { state: normalized }, "manual");
}

async function linkOrder(context: Awaited<ReturnType<typeof getContext>>, printerId: string, orderId: unknown, notes: unknown) {
  assertOperationalAccess(context);
  const printer = await getPrinter(context, printerId, true);
  const normalizedOrderId = cleanText(orderId, 120);
  await supabase.from("printer_order_links").update({ status: "unlinked", finished_at: new Date().toISOString() })
    .eq("printer_id", printer.id).in("status", ["linked", "printing"]);
  if (!normalizedOrderId) return { linked: false };
  const { data, error } = await supabase.from("printer_order_links").upsert({
    company_id: context.companyId,
    printer_id: printer.id,
    order_id: normalizedOrderId,
    status: "linked",
    notes: cleanText(notes, 1000) || null,
    created_by: context.userId,
    started_at: new Date().toISOString(),
    finished_at: null,
  }, { onConflict: "printer_id,order_id" }).select("*").single();
  if (error) throw error;
  await supabase.from("printer_events").insert({
    company_id: context.companyId,
    printer_id: printer.id,
    event_type: "linked_to_order",
    message: `Impressora vinculada ao pedido ${normalizedOrderId}.`,
    order_id: normalizedOrderId,
    created_by: context.userId,
  });
  return data;
}

async function history(context: Awaited<ReturnType<typeof getContext>>, printerId: string) {
  assertViewAccess(context);
  await getPrinter(context, printerId);
  const [{ data: snapshots }, { data: events }] = await Promise.all([
    supabase.from("printer_status_snapshots").select("*").eq("printer_id", printerId).order("created_at", { ascending: false }).limit(100),
    supabase.from("printer_events").select("*").eq("printer_id", printerId).order("created_at", { ascending: false }).limit(100),
  ]);
  return { snapshots: snapshots || [], events: events || [] };
}

async function disablePrinter(context: Awaited<ReturnType<typeof getContext>>, printerId: string) {
  assertManagementAccess(context);
  const printer = await getPrinter(context, printerId, true);
  const { error } = await supabase.from("printers").update({
    active: false,
    status: "disabled",
    credential_ciphertext: null,
    credential_hint: null,
    updated_by: context.userId,
  }).eq("id", printer.id);
  if (error) throw error;
  await supabase.from("printer_events").insert({
    company_id: context.companyId,
    printer_id: printer.id,
    event_type: "disabled",
    message: "Impressora desativada e credenciais removidas.",
    created_by: context.userId,
  });
  return { disabled: true };
}

async function createAgent(context: Awaited<ReturnType<typeof getContext>>, name: unknown) {
  assertManagementAccess(context);
  const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  const pairingCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
  const { data, error } = await supabase.from("local_agents").insert({
    company_id: context.companyId,
    name: cleanText(name, 120) || "Simplifica Local Agent",
    pairing_code_hash: await sha256(pairingCode),
    agent_token_hash: await sha256(token),
    status: "active",
    created_by: context.userId,
  }).select("id,name,status,created_at").single();
  if (error) throw error;
  return { ...data, pairing_code: pairingCode, agent_token: token };
}

async function receiveAgentStatus(request: Request, body: Record<string, unknown>) {
  const token = cleanText(request.headers.get("x-simplifica-agent-token"), 500);
  if (token.length < 48) throw new Error("INVALID_AGENT_TOKEN");
  const { data: agent } = await supabase.from("local_agents").select("*").eq("agent_token_hash", await sha256(token)).eq("status", "active").maybeSingle();
  if (!agent) throw new Error("INVALID_AGENT_TOKEN");
  const printerId = cleanText(body.printer_id, 60);
  const { data: assignment } = await supabase.from("local_agent_printers").select("printer_id").eq("agent_id", agent.id).eq("printer_id", printerId).maybeSingle();
  if (!assignment) throw new Error("PRINTER_NOT_ASSIGNED_TO_AGENT");
  const { data: printer } = await supabase.from("printers").select("*").eq("id", printerId).eq("company_id", agent.company_id).maybeSingle();
  if (!printer) throw new Error("PRINTER_NOT_FOUND");
  await supabase.from("local_agents").update({ last_seen_at: new Date().toISOString(), status: "active" }).eq("id", agent.id);
  return saveSnapshot(
    { userId: "", companyId: agent.company_id, clientId: "", role: "production", plan: "pro", planActive: true, isSuperadmin: false },
    printer,
    { ...body, state: body.state || body.normalized_state, raw_payload: body.raw_payload || null },
    "local_agent",
  );
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return response({ ok: false, error: "BACKEND_NOT_CONFIGURED" }, 503);

  try {
    const body = await request.json().catch(() => ({}));
    const action = cleanText(body.action, 80).toLowerCase();
    if (action === "agent_status") {
      const data = await receiveAgentStatus(request, body);
      return response({ ok: true, data });
    }

    const context = await getContext(request, cleanText(body.company_id, 60));
    let data: unknown;
    if (action === "list") data = await listPrinterWorkspace(context);
    else if (action === "save") data = await savePrinter(context, body.printer || {});
    else if (action === "test_connection") data = await readStatus(context, cleanText(body.printer_id, 60), true);
    else if (action === "fetch_status") data = await readStatus(context, cleanText(body.printer_id, 60), false);
    else if (action === "manual_status") data = await updateManualStatus(context, cleanText(body.printer_id, 60), body.state);
    else if (action === "link_order") data = await linkOrder(context, cleanText(body.printer_id, 60), body.order_id, body.notes);
    else if (action === "history") data = await history(context, cleanText(body.printer_id, 60));
    else if (action === "disable") data = await disablePrinter(context, cleanText(body.printer_id, 60));
    else if (action === "create_agent") data = await createAgent(context, body.name);
    else if (action === "bambu_login") data = await connectBambuAccount(context, cleanText(body.printer_id, 60), body);
    else if (action === "bambu_select_device") data = await selectBambuDevice(context, cleanText(body.printer_id, 60), body.device_id);
    else if (action === "bambu_mqtt_credentials") data = await getBambuMqttCredentials(context, cleanText(body.printer_id, 60));
    else if (action === "bambu_disconnect") data = await disconnectBambuAccount(context, cleanText(body.printer_id, 60));
    else throw new Error("ACTION_NOT_ALLOWED");
    return response({ ok: true, data, read_only: true });
  } catch (error) {
    const message = cleanText(error instanceof Error ? error.message : error, 500) || "PRINTER_MONITOR_FAILED";
    const status = ["UNAUTHENTICATED", "INVALID_AGENT_TOKEN"].includes(message)
      ? 401
      : ["ROLE_BLOCKED", "COMPANY_ACCESS_DENIED"].includes(message)
        ? 403
        : message.endsWith("_NOT_FOUND")
          ? 404
          : 400;
    return response({ ok: false, error: message, read_only: true }, status);
  }
});
