const fs = require("node:fs");
const path = require("node:path");
const {
  ROOT,
  assertLinkedToStaging,
  assertStagingConfirmed,
  loadStagingEnv,
  run,
  supabaseArgs,
} = require("./storefront-staging-utils");

const USER_A_EMAIL = "storefront-user-a@simplifica3d-staging.local";
const USER_B_EMAIL = "storefront-user-b@simplifica3d-staging.local";
const DEFAULT_PASSWORD = "Simplifica3D-Staging-2026!";

function required(env, key) {
  const value = String(env[key] || "").trim();
  if (!value) throw new Error(`${key} nao configurado em .env.staging.`);
  return value;
}

async function supabaseFetch(url, key, pathName, options = {}) {
  const response = await fetch(`${url}${pathName}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_) {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathName} falhou (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function listUsers(url, serviceRole) {
  const body = await supabaseFetch(url, serviceRole, "/auth/v1/admin/users?page=1&per_page=200");
  return Array.isArray(body?.users) ? body.users : [];
}

async function ensureUser(url, serviceRole, email, password) {
  const users = await listUsers(url, serviceRole);
  const existing = users.find((user) => String(user.email || "").toLowerCase() === email.toLowerCase());
  if (existing?.id) return existing.id;

  const created = await supabaseFetch(url, serviceRole, "/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "storefront-phase36-staging" },
    }),
  });
  if (!created?.id) throw new Error(`Nao foi possivel criar usuario staging ${email}.`);
  return created.id;
}

async function main() {
  const env = loadStagingEnv();
  assertStagingConfirmed(env);
  assertLinkedToStaging(env);

  const url = required(env, "VITE_SUPABASE_URL_STAGING").replace(/\/+$/, "");
  const serviceRole = required(env, "SUPABASE_SERVICE_ROLE_STAGING");
  const passwordA = String(env.STAGING_USER_A_PASSWORD || DEFAULT_PASSWORD);
  const passwordB = String(env.STAGING_USER_B_PASSWORD || DEFAULT_PASSWORD);

  const userAId = await ensureUser(url, serviceRole, USER_A_EMAIL, passwordA);
  const userBId = await ensureUser(url, serviceRole, USER_B_EMAIL, passwordB);

  const seedPath = path.join(ROOT, "supabase/seed_storefront_phase35_test.sql");
  const generatedPath = path.join(ROOT, "supabase/.temp/storefront_phase36_seed.generated.sql");
  const sql = fs
    .readFileSync(seedPath, "utf8")
    .replaceAll("__USER_A_ID__", userAId)
    .replaceAll("__USER_B_ID__", userBId);

  fs.mkdirSync(path.dirname(generatedPath), { recursive: true });
  fs.writeFileSync(generatedPath, sql, "utf8");

  await run("npx", supabaseArgs(["db", "query", "--linked", "-f", generatedPath]));
  console.log(`Seed Storefront staging aplicado com ${USER_A_EMAIL} e ${USER_B_EMAIL}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
