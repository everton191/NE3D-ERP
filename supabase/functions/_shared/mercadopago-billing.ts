export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

const BILLING_VARIANTS: Record<string, { id: string; planSlug: string; backendPlanSlug: string; name: string; amount: number }> = {
  premium_first_month: { id: "premium_first_month", planSlug: "pro", backendPlanSlug: "premium", name: "Pro legado", amount: 19.9 },
  premium_monthly: { id: "premium_monthly", planSlug: "pro", backendPlanSlug: "premium", name: "Pro", amount: 59.9 },
};

export function normalizeRequestedPlan(value: unknown) {
  const slug = String(value || "").toLowerCase().replace(/-/g, "_").trim();
  if (["pro", "plus", "premium", "premium_monthly", "pro_monthly"].includes(slug)) {
    return { requestedPlanSlug: "pro", backendPlanSlug: "premium" };
  }
  if (["start", "starter", "start_monthly", "premium_first_month"].includes(slug)) {
    throw new Error("Plano Start ainda não está habilitado no backend de cobrança");
  }
  throw new Error("Plano inválido");
}

export function normalizeBillingVariant(value: unknown, requestedPlanSlug = "pro") {
  const variant = String(value || "").toLowerCase().replace(/-/g, "_").trim();
  if (variant === "premium_first_month") return "premium_first_month";
  if (variant === "premium_monthly" || variant === "pro_monthly" || (!variant && requestedPlanSlug === "pro")) return "premium_monthly";
  throw new Error("Variante de cobrança inválida");
}

export function getBillingVariant(value: unknown, requestedPlanSlug = "pro") {
  const variant = normalizeBillingVariant(value, requestedPlanSlug);
  return BILLING_VARIANTS[variant];
}

export function parseSignature(header: string) {
  return String(header || "").split(",").reduce<Record<string, string>>((acc, part) => {
    const separator = part.indexOf("=");
    if (separator < 1) return acc;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key && value) acc[key] = value;
    return acc;
  }, {});
}

function hexToBytes(value: string) {
  const normalized = String(value || "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) return new Uint8Array();
  return new Uint8Array(normalized.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || []);
}

function timingSafeEqualHex(left: string, right: string) {
  const leftBytes = hexToBytes(left);
  const rightBytes = hexToBytes(right);
  if (!leftBytes.length || leftBytes.length !== rightBytes.length) return false;
  let mismatch = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    mismatch |= leftBytes[index] ^ rightBytes[index];
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, manifest: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyMercadoPagoSignature(options: {
  secret: string;
  xSignature: string;
  xRequestId: string;
  dataId: string;
  nowMs?: number;
  toleranceMs?: number;
}) {
  const parsed = parseSignature(options.xSignature);
  const ts = parsed.ts || "";
  const v1 = parsed.v1 || "";
  const timestamp = Number(ts);
  const configuredToleranceMs = Number(options.toleranceMs ?? WEBHOOK_TOLERANCE_MS);
  const toleranceMs = Number.isFinite(configuredToleranceMs) && configuredToleranceMs >= 0
    ? configuredToleranceMs
    : WEBHOOK_TOLERANCE_MS;
  const nowMs = Number(options.nowMs ?? Date.now());
  const dataId = String(options.dataId || "").toLowerCase();

  if (!options.secret || !dataId || !options.xRequestId || !ts || !v1 || !Number.isFinite(timestamp)) {
    return { ok: false, reason: "MISSING_SIGNATURE_DATA", ts, v1 };
  }
  if (Math.abs(nowMs - timestamp) > toleranceMs) {
    return { ok: false, reason: "SIGNATURE_TIMESTAMP_OUT_OF_RANGE", ts, v1 };
  }

  const manifest = `id:${dataId};request-id:${options.xRequestId};ts:${ts};`;
  const expected = await hmacSha256Hex(options.secret, manifest);
  const matches = timingSafeEqualHex(expected, v1);
  return {
    ok: matches,
    reason: matches ? "OK" : "INVALID_SIGNATURE",
    ts,
    v1,
  };
}

export function buildWebhookEventKey(event: Record<string, unknown>, eventType: string, dataId: string, requestId: string) {
  const action = String(event.action || eventType || "unknown").toLowerCase();
  const notificationId = String(event.id || "").trim();
  return ["mercado_pago", notificationId || requestId, action, String(dataId || "").toLowerCase()].join(":");
}

export function sanitizeWebhookPayload(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 1200);
  if (Array.isArray(value)) return value.slice(0, 24).map((item) => sanitizeWebhookPayload(item, depth + 1));
  if (typeof value !== "object") return String(value).slice(0, 240);

  return Object.entries(value as Record<string, unknown>).slice(0, 64).reduce<Record<string, unknown>>((clean, [key, item]) => {
    clean[key] = /access[_-]?token|refresh[_-]?token|authorization|api[_-]?key|password|secret|card|cpf|cnpj/i.test(key)
      ? "[redacted]"
      : sanitizeWebhookPayload(item, depth + 1);
    return clean;
  }, {});
}
