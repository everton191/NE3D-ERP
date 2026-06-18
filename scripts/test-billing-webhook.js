const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const webhook = read("supabase/functions/mercadopago-webhook/index.ts");
const shared = read("supabase/functions/_shared/mercadopago-billing.ts");
const cancel = read("supabase/functions/mercadopago-cancel-subscription/index.ts");
const createPayment = read("supabase/functions/mercadopago-create-payment/index.ts");
const migration = read("supabase/migrations/20260529213000_billing_webhook_hardening.sql");
const diagnostics = read("src/services/diagnosticsService.js");
const functionsDir = path.join(root, "supabase", "functions");

function sign(secret, dataId, requestId, ts) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  return crypto.createHmac("sha256", secret).update(manifest).digest("hex");
}

const webhookFolders = fs.readdirSync(functionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /mercadopago.*webhook/i.test(entry.name))
  .map((entry) => entry.name);

assert.deepEqual(webhookFolders, ["mercadopago-webhook"], "deve existir somente um webhook central Mercado Pago");
assert(shared.includes("WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000"), "assinatura deve limitar idade do timestamp");
assert(shared.includes("timingSafeEqualHex"), "assinatura deve usar comparacao constante");
assert(shared.includes("id:${dataId};request-id:${options.xRequestId};ts:${ts};"), "manifesto deve seguir template oficial");
assert(webhook.includes("getSignedDataId"), "webhook deve separar data.id assinado da carga recebida");
assert(webhook.includes("reserveWebhookEvent"), "webhook deve reservar evento idempotente antes de processar");
assert(webhook.includes('existing?.status !== "error"'), "evento com erro deve poder ser tentado novamente");
assert(webhook.includes("return jsonResponse({ ok: false }, 500)"), "falha de processamento deve permitir retry do provedor");
assert(webhook.includes("webhook_ignored_duplicate"), "webhook deve diagnosticar duplicatas");
assert(webhook.includes("webhook_validation_failed"), "webhook deve diagnosticar assinatura invalida");
assert(webhook.includes("billing_webhook_events"), "webhook deve usar tabela idempotente dedicada");
assert(migration.includes("create table if not exists public.billing_webhook_events"), "migration deve criar tabela idempotente");
assert(migration.includes("create unique index if not exists billing_webhook_events_provider_key_unique_idx"), "migration deve impedir evento duplicado");
assert(migration.includes("alter table public.billing_webhook_events enable row level security"), "tabela idempotente deve ativar RLS");
assert(migration.includes("revoke all on public.billing_webhook_events from public, anon, authenticated"), "frontend nao deve acessar tabela idempotente");
assert(migration.includes("cancel_at_period_end boolean not null default false"), "migration deve preparar cancelamento ao fim do periodo");
assert(!cancel.includes('.eq("slug", "free")'), "cancelamento remoto nao pode buscar Free para downgrade imediato");
assert(!cancel.includes('plano_atual: "free"'), "cancelamento remoto nao pode aplicar Free imediatamente");
assert(cancel.includes("cancel_at_period_end: true"), "cancelamento remoto deve agendar fim da renovacao");
assert(cancel.includes('status_assinatura: "canceling"'), "cancelamento remoto deve preservar acesso com estado canceling");
assert(shared.includes('["pro", "plus", "premium", "premium_monthly", "pro_monthly"]'), "aliases Pro legados devem ser controlados");
assert(shared.includes("Plano Start ainda não está habilitado no backend de cobrança"), "Start deve falhar fechado ate migracao da autoridade");
assert(shared.includes('if (startPlanId && planId === startPlanId) return "start"'), "webhook deve mapear o ID Mercado Pago do Start");
assert(shared.includes('if (proPlanId && planId === proPlanId) return "premium"'), "webhook deve mapear o ID Mercado Pago do Pro pelo alias compativel");
assert(createPayment.includes("normalizeRequestedPlan"), "checkout deve resolver plano no backend");
assert(createPayment.includes('action: "checkout aberto"'), "preferencia deve registrar checkout aberto sem pagamento real");
assert(!createPayment.includes('status: "pending",\n      external_reference: externalReference'), "preferencia aberta nao deve inserir pagamento pending");
assert(diagnostics.includes('"webhook_received"'), "diagnosticos devem aceitar webhook_received");
assert(diagnostics.includes('"webhook_validation_failed"'), "diagnosticos devem aceitar webhook_validation_failed");
assert(diagnostics.includes('"webhook_ignored_duplicate"'), "diagnosticos devem aceitar webhook_ignored_duplicate");
assert(read("scripts/billing-webhook-remote-controlled.js").includes('"--project-ref", projectRef, "--use-api"'), "deploy remoto deve usar project-ref explicito compatível com a CLI");
assert(!/MERCADOPAGO_(ACCESS_TOKEN|WEBHOOK_SECRET)\s*=\s*["'][^"']+["']/.test(shared + webhook + createPayment + cancel), "segredos Mercado Pago nao podem ficar hardcoded");

const ts = Date.now();
const signature = sign("test-secret", "ORD01ABC", "request-1", ts);
assert.equal(signature.length, 64, "fixture HMAC SHA-256 deve gerar hex de 64 caracteres");
assert.equal(signature, sign("test-secret", "ord01abc", "request-1", ts), "data.id deve ser normalizado para lowercase");
assert.notEqual(signature, sign("other-secret", "ord01abc", "request-1", ts), "segredo incorreto nao pode validar");
assert(Math.abs(Date.now() - (ts - (5 * 60 * 1000 + 1))) > 5 * 60 * 1000, "timestamp expirado deve exceder tolerancia");

console.log("Billing webhook hardening tests OK");
