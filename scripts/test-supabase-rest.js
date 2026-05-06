const fs = require("fs");
const path = require("path");

function getSupabaseConfig() {
  const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const envKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (envUrl && envKey) {
    return { url: envUrl.replace(/\/+$/, ""), key: envKey };
  }

  const appPath = path.join(__dirname, "..", "app.js");
  const app = fs.readFileSync(appPath, "utf8");
  const url =
    app.match(/const\s+SUPABASE_DEFAULT_URL\s*=\s*["']([^"']+)["']/)?.[1] ||
    app.match(/SUPABASE_DEFAULT_URL["']?\s*:\s*["']([^"']+)["']/)?.[1];
  const key =
    app.match(/const\s+SUPABASE_DEFAULT_ANON_KEY\s*=\s*["']([^"']+)["']/)?.[1] ||
    app.match(/SUPABASE_DEFAULT_ANON_KEY["']?\s*:\s*["']([^"']+)["']/)?.[1];
  if (!url || !key) {
    throw new Error("Configuracao Supabase nao encontrada. Defina SUPABASE_URL/SUPABASE_ANON_KEY ou confira app.js.");
  }
  return { url: url.replace(/\/+$/, ""), key };
}

async function requestJson(test, headers) {
  const started = Date.now();
  try {
    const response = await fetch(test.url, {
      method: test.method || "GET",
      headers,
      body: test.body
    });
    const text = await response.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (_) {
      parsed = text;
    }
    const sample = Array.isArray(parsed)
      ? `rows=${parsed.length}`
      : parsed && typeof parsed === "object"
        ? Object.keys(parsed).slice(0, 6).join(",")
        : String(parsed || "").slice(0, 120);
    return {
      test: test.name,
      status: response.status,
      ok: test.expect.includes(response.status),
      ms: Date.now() - started,
      sample
    };
  } catch (error) {
    return {
      test: test.name,
      status: "ERR",
      ok: false,
      ms: Date.now() - started,
      sample: error.message
    };
  }
}

async function main() {
  const { url, key } = getSupabaseConfig();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
  const tests = [
    {
      name: "REST plans active",
      url: `${url}/rest/v1/plans?select=slug,name,active,kind&active=eq.true&order=sort_order.asc`,
      expect: [200]
    },
    {
      name: "REST profiles RLS anon",
      url: `${url}/rest/v1/profiles?select=id,user_id,client_id&limit=1`,
      expect: [200]
    },
    {
      name: "REST clients RLS anon",
      url: `${url}/rest/v1/clients?select=id,email&limit=1`,
      expect: [200]
    },
    {
      name: "RPC get_saas_license anon",
      url: `${url}/rest/v1/rpc/get_saas_license`,
      method: "POST",
      body: "{}",
      expect: [200, 401, 403, 404]
    },
    {
      name: "RPC register_saas_client anon blocked",
      url: `${url}/rest/v1/rpc/register_saas_client`,
      method: "POST",
      body: JSON.stringify({
        p_name: "Teste",
        p_responsible_name: "Teste",
        p_email: "teste@example.com",
        p_plan_slug: "premium_trial"
      }),
      expect: [400, 401, 403]
    },
    {
      name: "Auth settings",
      url: `${url}/auth/v1/settings`,
      expect: [200]
    },
    {
      name: "Auth invalid password blocked",
      url: `${url}/auth/v1/token?grant_type=password`,
      method: "POST",
      body: JSON.stringify({
        email: "nao-existe@simplifica3d.invalid",
        password: "SenhaInvalida123!"
      }),
      expect: [400]
    },
    {
      name: "Function create-payment requires JWT",
      url: `${url}/functions/v1/mercadopago-create-payment`,
      method: "POST",
      body: JSON.stringify({ plan_id: "premium", billing_variant: "premium_first_month" }),
      expect: [401, 403]
    },
    {
      name: "Function create-subscription requires JWT",
      url: `${url}/functions/v1/mercadopago-create-subscription`,
      method: "POST",
      body: JSON.stringify({ plan_id: "premium", billing_variant: "premium_monthly" }),
      expect: [401, 403]
    },
    {
      name: "Function cancel-subscription requires JWT",
      url: `${url}/functions/v1/mercadopago-cancel-subscription`,
      method: "POST",
      body: "{}",
      expect: [401, 403]
    }
  ];

  const results = [];
  for (const test of tests) {
    results.push(await requestJson(test, headers));
  }
  console.table(results);

  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
