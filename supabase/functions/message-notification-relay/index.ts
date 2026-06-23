import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, x-simplifica-device-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: "SERVICE_NOT_CONFIGURED" });
  try {
    const payload = await request.json();
    const deviceId = String(payload?.device_id || "").trim().slice(0, 160);
    const deviceToken = String(request.headers.get("x-simplifica-device-token") || "").trim();
    const eventKey = String(payload?.event_key || "").trim();
    if (!deviceId || deviceToken.length < 32 || !/^[a-f0-9]{16,128}$/i.test(eventKey)) return json(400, { error: "INVALID_RELAY_EVENT" });
    const tokenHash = await sha256(deviceToken);
    const { data: device, error: deviceError } = await supabase
      .from("user_message_notification_devices")
      .select("user_id,device_id")
      .eq("device_id", deviceId)
      .eq("token_hash", tokenHash)
      .eq("active", true)
      .maybeSingle();
    if (deviceError || !device) return json(401, { error: "INVALID_DEVICE_TOKEN" });
    if (payload?.action === "delete") {
      const { error } = await supabase
        .from("user_message_notifications")
        .delete()
        .eq("user_id", device.user_id)
        .eq("device_id", deviceId)
        .eq("event_key", eventKey);
      if (error) throw error;
      return json(200, { ok: true, removed: true });
    }
    const source = String(payload?.source || "").toLowerCase();
    if (!["whatsapp", "instagram", "tiktok"].includes(source)) return json(400, { error: "INVALID_SOURCE" });
    const senderName = String(payload?.sender_name || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 120) || null;
    const receivedAt = new Date(payload?.received_at || Date.now());
    if (!Number.isFinite(receivedAt.getTime()) || receivedAt.getTime() > Date.now() + 5 * 60 * 1000) return json(400, { error: "INVALID_RECEIVED_AT" });
    const { error } = await supabase.from("user_message_notifications").upsert({
      user_id: device.user_id,
      device_id: deviceId,
      source,
      sender_name: senderName,
      event_key: eventKey,
      received_at: receivedAt.toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: "user_id,device_id,event_key", ignoreDuplicates: true });
    if (error) throw error;
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { error: "RELAY_FAILED", detail: String(error instanceof Error ? error.message : error).slice(0, 180) });
  }
});
