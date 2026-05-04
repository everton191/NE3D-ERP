const fs = require("fs");
const path = require("path");

function readAppConfigValue(name) {
  const appPath = path.join(__dirname, "..", "app.js");
  const appSource = fs.readFileSync(appPath, "utf8");
  const match = appSource.match(new RegExp(`const\\s+${name}\\s*=\\s*["']([^"']+)["']`));
  return match ? match[1] : "";
}

function resolveSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || readAppConfigValue("SUPABASE_DEFAULT_URL");
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    readAppConfigValue("SUPABASE_DEFAULT_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY nao encontrados no ambiente nem no app.js.");
  }

  return { url: url.replace(/\/$/, ""), anonKey };
}

async function supabaseRequest(config, method, endpoint, body, prefer = "return=representation") {
  const response = await fetch(`${config.url}${endpoint}`, {
    method,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      Prefer: prefer
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { ok: response.ok, status: response.status, data };
}

async function registerError(config, payload) {
  const result = await supabaseRequest(config, "POST", "/rest/v1/rpc/register_app_error", payload);
  if (!result.ok) {
    throw new Error(`register_app_error falhou com HTTP ${result.status}`);
  }
  return result.data;
}

async function insertFeedback(config, payload) {
  const result = await supabaseRequest(config, "POST", "/rest/v1/app_feedback_reports", payload, "return=minimal");
  if (!result.ok) {
    throw new Error(`insert feedback falhou com HTTP ${result.status}: ${JSON.stringify(result.data)}`);
  }
  return result;
}

async function queryAnonLogs(config, errorKey) {
  const query = new URLSearchParams({
    select: "id,error_key",
    error_key: `eq.${errorKey}`
  });
  return supabaseRequest(config, "GET", `/rest/v1/app_error_logs?${query.toString()}`);
}

async function main() {
  const config = resolveSupabaseConfig();
  const timestamp = Date.now();
  const errorKey = `TEST_ERROR_SIMPLIFICA_${timestamp}`;
  const appVersion = `telemetry-test-${timestamp}`;
  const firstUserEmail = `telemetry.one+${timestamp}@example.com`;
  const secondUserEmail = `telemetry.two+${timestamp}@example.com`;

  const basePayload = {
    p_error_key: errorKey,
    p_error_message: "TEST_ERROR_SIMPLIFICA",
    p_screen_name: "telemetry_test",
    p_action_name: "manual_validation",
    p_app_version: appVersion,
    p_device_model: "node-test",
    p_os_version: process.platform,
    p_platform: "script",
    p_metadata: { source: "scripts/test-telemetry-rest.js" }
  };

  const first = await registerError(config, { ...basePayload, p_user_email: firstUserEmail });
  const second = await registerError(config, { ...basePayload, p_user_email: firstUserEmail });
  const third = await registerError(config, { ...basePayload, p_user_email: firstUserEmail });
  const fourth = await registerError(config, { ...basePayload, p_user_email: secondUserEmail });

  const feedback = await insertFeedback(config, {
    user_email: firstUserEmail,
    user_name: "Teste Telemetria",
    type: "sugestao",
    title: `Teste feedback ${timestamp}`,
    description: "Validacao automatica da tabela app_feedback_reports.",
    status: "new",
    priority: "normal",
    app_version: appVersion,
    device_model: "node-test",
    os_version: process.platform,
    platform: "script",
    screen_name: "telemetry_test",
    metadata: { source: "scripts/test-telemetry-rest.js" }
  });

  const anonRead = await queryAnonLogs(config, errorKey);
  const anonRows = Array.isArray(anonRead.data) ? anonRead.data : [];

  const checks = {
    rpcCreated: Boolean(first && first.id),
    occurrenceAfterThree: Number(third && third.occurrence_count) === 3,
    affectedAfterThree: Number(third && third.affected_user_count) === 1,
    occurrenceAfterSecondUser: Number(fourth && fourth.occurrence_count) === 4,
    affectedAfterSecondUser: Number(fourth && fourth.affected_user_count) === 2,
    feedbackInserted: feedback.status === 201 || feedback.status === 204,
    anonCannotReadGlobalLogs: anonRead.status === 200 && anonRows.length === 0
  };

  const summary = {
    projectUrlHost: new URL(config.url).host,
    errorKey,
    logId: first.id,
    occurrenceCount: fourth.occurrence_count,
    affectedUserCount: fourth.affected_user_count,
    severity: fourth.severity,
    feedbackStatus: feedback.status,
    anonReadStatus: anonRead.status,
    anonRowsVisible: anonRows.length,
    checks
  };

  console.log(JSON.stringify(summary, null, 2));

  const failed = Object.entries(checks).filter(([, value]) => !value);
  if (failed.length > 0) {
    throw new Error(`Falhas no teste de telemetria: ${failed.map(([key]) => key).join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
