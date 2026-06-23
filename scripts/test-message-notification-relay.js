const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const app = read("app.js");
const manifest = read("android/app/src/main/AndroidManifest.xml");
const mainActivity = read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java");
const listener = read("android/app/src/main/java/br/com/ne3d/erp/SimplificaNotificationListenerService.java");
const securePreferences = read("android/app/src/main/java/br/com/ne3d/erp/SimplificaSecurePreferences.java");
const migration = read("supabase/migrations/20260623123000_user_message_notification_relay.sql");
const relay = read("supabase/functions/message-notification-relay/index.ts");

const checks = [
  ["serviço de notificações declarado", manifest.includes("SimplificaNotificationListenerService") && manifest.includes("BIND_NOTIFICATION_LISTENER_SERVICE")],
  ["plugin registrado no Capacitor", mainActivity.includes("registerPlugin(SimplificaNotificationsPlugin.class)")],
  ["somente título é lido", listener.includes("Notification.EXTRA_TITLE") && !listener.includes("Notification.EXTRA_TEXT") && !listener.includes("EXTRA_BIG_TEXT")],
  ["remoção da notificação sincroniza exclusão", listener.includes("onNotificationRemoved") && listener.includes('baseEvent("delete"')],
  ["canais permitidos são restritos", ["com.whatsapp", "com.instagram.android", "com.zhiliaoapp.musically"].every((value) => listener.includes(value))],
  ["credencial protegida pelo Android Keystore", securePreferences.includes("AndroidKeyStore") && securePreferences.includes("AES/GCM/NoPadding")],
  ["token normal da sessão não fica no serviço", !listener.includes("refresh_token") && !listener.includes("access_token")],
  ["tabela de avisos usa RLS", migration.includes("user_message_notifications enable row level security") && migration.includes("auth.uid() = user_id")],
  ["credencial do aparelho é separada", migration.includes("user_message_notification_devices") && migration.includes("register_message_notification_device")],
  ["DELETE chega pelo Realtime", migration.includes("replica identity full") && app.includes('{ event: "DELETE", schema: "public", table: "user_message_notifications"')],
  ["função relay valida token do aparelho", relay.includes("x-simplifica-device-token") && relay.includes("token_hash") && relay.includes("INVALID_DEVICE_TOKEN")],
  ["conteúdo da mensagem não existe no payload", !migration.includes("message_content") && !relay.includes("message_content") && !listener.includes("message_content")],
  ["interface permite ativar por canal", ["messageRelayWhatsapp", "messageRelayInstagram", "messageRelayTiktok"].every((value) => app.includes(value))],
  ["central permite dispensar aviso", app.includes("removerNotificacaoMensagem") && app.includes("limparNotificacoesMensagens")]
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([label, ok]) => console.log(`${ok ? "OK" : "FALHA"}: ${label}`));
if (failed.length) process.exit(1);
console.log("Message notification relay tests passed.");

