const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const aiService = require("../src/services/aiService.js");
const provider = require("../src/services/aiProviderAdapter.js");
const quota = require("../src/services/aiQuotaService.js");
const context = require("../src/services/aiContextService.js");
const flags = require("../src/services/aiFeatureFlagService.js");
const cost = require("../src/services/aiCostService.js");

const aiFiles = [
  "src/services/aiService.js",
  "src/services/aiProviderAdapter.js",
  "src/services/aiQuotaService.js",
  "src/services/aiContextService.js",
  "src/services/aiFeatureFlagService.js",
  "src/services/aiCostService.js"
];

async function run() {
  const disabled = await aiService.askAi({
    ownerId: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    contextType: "orders_summary",
    actionType: "ask",
    question: "Resumo?"
  });
  assert.equal(disabled.ok, false, "askAi deve bloquear por padrao");
  assert.equal(disabled.reason, "AI_DISABLED", "askAi deve retornar AI_DISABLED");

  const access = await quota.canUseAi({
    ownerId: "owner",
    userId: "user",
    contextType: "orders_summary"
  });
  assert.equal(access.allowed, false, "canUseAi deve bloquear");
  assert.equal(access.reason, "AI_DISABLED", "canUseAi deve explicar bloqueio");

  const disabledProvider = await provider.generateAiResponse({ provider: "disabled" });
  assert.equal(disabledProvider.reason, "AI_DISABLED", "provider disabled nao chama IA");

  for (const providerName of ["openai", "groq", "gemini", "anthropic", "local"]) {
    const result = await provider.generateAiResponse({ provider: providerName });
    assert.equal(result.ok, false, `${providerName} deve ficar bloqueado`);
    assert.equal(result.reason, "AI_PROVIDER_NOT_CONFIGURED", `${providerName} deve retornar erro controlado`);
  }

  const defaults = flags.getDefaultAiFeatureFlags();
  Object.values(defaults).forEach((value) => assert.equal(value, false, "feature flags devem nascer desligadas"));

  assert.equal(cost.estimateTokensFromText("abcd"), 1, "estimativa simples de tokens funciona");
  assert.equal(cost.estimateAiCost({ provider: "disabled" }).estimatedCost, 0, "custo padrao deve ser zero nesta fase");

  await assert.rejects(
    () => context.buildOrdersAiContext({ userId: "user" }),
    /ownerId/,
    "context builders devem exigir ownerId"
  );

  const ordersContext = await context.buildOrdersAiContext({
    ownerId: "owner-a",
    userId: "user-a",
    filters: {
      orders: [
        { ownerId: "owner-a", status: "aberto", total: 10, customerPhone: "nao deve sair" },
        { ownerId: "owner-b", status: "entregue", total: 999 }
      ]
    }
  });
  assert.equal(ordersContext.totalOrders, 1, "contexto deve filtrar por ownerId");
  assert.equal(ordersContext.recentSafeItems.length, 1, "contexto deve limitar itens seguros");
  assert.equal(ordersContext.recentSafeItems[0].customerPhone, undefined, "contexto nao deve expor telefone");

  const usage = await quota.registerAiUsage({
    ownerId: "owner-a",
    userId: "user-a",
    contextType: "orders_summary",
    status: "blocked",
    blockedReason: "AI_DISABLED"
  });
  assert.equal(usage.ok, true, "log bloqueado nao deve quebrar");
  assert.equal(usage.entry.status, "blocked", "log deve ficar bloqueado");

  const migrationPath = "supabase/migrations/20260529141000_ai_foundation_disabled.sql";
  assert(exists(migrationPath), "migration de IA deve existir");
  const migration = read(migrationPath);
  [
    "create table if not exists public.app_ai_settings",
    "create table if not exists public.app_ai_usage_logs",
    "create table if not exists public.app_ai_context_snapshots",
    "create table if not exists public.app_ai_feature_flags",
    "alter table public.app_ai_settings enable row level security",
    "alter table public.app_ai_usage_logs enable row level security",
    "alter table public.app_ai_context_snapshots enable row level security",
    "alter table public.app_ai_feature_flags enable row level security"
  ].forEach((marker) => assert(migration.includes(marker), `migration incompleta: ${marker}`));
  assert(!/using\s*\(\s*true\s*\)/i.test(migration), "policies de IA nao podem ser publicas");

  for (const file of aiFiles) {
    const source = read(file);
    assert(!/\bfetch\s*\(/.test(source), `${file} nao deve chamar rede externa`);
    assert(!/sk-[A-Za-z0-9_-]{20,}/.test(source), `${file} nao deve conter chave de API`);
  }

  const index = read("index.html");
  assert(!index.includes("aiService.js"), "servicos de IA nao devem ser carregados na UI");
  assert(!index.includes("ai-foundation"), "nenhuma tela de IA deve aparecer no HTML");

  assert(exists("docs/ai-foundation.md"), "documentacao de IA deve existir");
  assert(!/sk-[A-Za-z0-9_-]{20,}/.test(read("docs/ai-foundation.md")), "documentacao nao deve conter chave real");

  console.log("AI foundation tests OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
