const fs = require("fs");
const path = require("path");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "qsufnnivlgdidmjuaprb";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "";
const PUBLIC_URL = (process.env.SIMPLIFICA3D_PUBLIC_URL || "https://erpne3d-everton191s-projects.vercel.app").replace(/\/+$/, "");
const SUPPORT_EMAIL = process.env.SIMPLIFICA3D_SUPPORT_EMAIL || "simplifica3d.app@gmail.com";
const DRY_RUN = process.argv.includes("--dry-run");
const GET_ONLY = process.argv.includes("--get");

const templateDir = path.join(__dirname, "..", "supabase", "templates");

function readTemplate(name) {
  return fs.readFileSync(path.join(templateDir, name), "utf8");
}

function buildPayload() {
  const payload = {
    site_url: PUBLIC_URL,
    uri_allow_list: [
      PUBLIC_URL,
      `${PUBLIC_URL}/**`,
      "http://127.0.0.1:*/**",
      "http://localhost:*/**"
    ].join(","),
    mailer_subjects_confirmation: "Confirme sua conta no Simplifica 3D",
    mailer_templates_confirmation_content: readTemplate("confirmation.html"),
    mailer_subjects_recovery: "Recuperação de senha - Simplifica 3D",
    mailer_templates_recovery_content: readTemplate("recovery.html"),
    mailer_subjects_magic_link: "Entrar no Simplifica 3D",
    mailer_templates_magic_link_content: readTemplate("magic_link.html"),
    mailer_subjects_invite: "Você foi convidado para o Simplifica 3D",
    mailer_templates_invite_content: readTemplate("invite.html"),
    mailer_subjects_email_change: "Confirme a alteração de email - Simplifica 3D",
    mailer_templates_email_change_content: readTemplate("email_change.html"),
    mailer_subjects_reauthentication: "Confirmação de segurança - Simplifica 3D",
    mailer_templates_reauthentication_content: readTemplate("reauthentication.html"),
    mailer_notifications_password_changed_enabled: true,
    mailer_subjects_password_changed_notification: "Senha alterada - Simplifica 3D",
    mailer_templates_password_changed_notification_content: readTemplate("password_changed_notification.html"),
    mailer_notifications_email_changed_enabled: true,
    mailer_subjects_email_changed_notification: "Email alterado - Simplifica 3D",
    mailer_templates_email_changed_notification_content: readTemplate("email_changed_notification.html")
  };
  if (process.env.SIMPLIFICA3D_ENABLE_SMTP_FROM === "1") {
    payload.smtp_admin_email = SUPPORT_EMAIL;
    payload.smtp_sender_name = "Simplifica 3D";
  }
  return payload;
}

function redact(value) {
  if (!value || typeof value !== "string") return value;
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : "***";
}

async function requestSupabaseConfig(method, body) {
  if (!ACCESS_TOKEN) {
    throw new Error("Defina SUPABASE_ACCESS_TOKEN no ambiente antes de aplicar no remoto.");
  }
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }
  return data;
}

async function main() {
  const payload = buildPayload();
  if (DRY_RUN) {
    const preview = Object.fromEntries(Object.entries(payload).map(([key, value]) => [
      key,
      key.includes("content") ? `[html ${String(value).length} chars]` : value
    ]));
    console.log(JSON.stringify({ projectRef: PROJECT_REF, dryRun: true, payload: preview }, null, 2));
    return;
  }
  if (GET_ONLY) {
    const data = await requestSupabaseConfig("GET");
    const subset = Object.fromEntries(Object.entries(data || {}).filter(([key]) => key.startsWith("mailer_") || key === "site_url" || key === "uri_allow_list" || key.startsWith("smtp_")));
    if (subset.smtp_pass) subset.smtp_pass = redact(subset.smtp_pass);
    console.log(JSON.stringify(subset, null, 2));
    return;
  }
  await requestSupabaseConfig("PATCH", payload);
  console.log(JSON.stringify({
    ok: true,
    projectRef: PROJECT_REF,
    templates: [
      "confirmation",
      "recovery",
      "magic_link",
      "invite",
      "email_change",
      "reauthentication",
      "password_changed_notification",
      "email_changed_notification"
    ],
    siteUrl: PUBLIC_URL,
    supportEmail: SUPPORT_EMAIL
  }, null, 2));
}

main().catch((error) => {
  console.error(`[supabase-email-templates] ${error.message}`);
  process.exit(1);
});
