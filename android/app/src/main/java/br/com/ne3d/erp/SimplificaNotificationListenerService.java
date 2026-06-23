package br.com.ne3d.erp;

import android.app.Notification;
import android.content.Context;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SimplificaNotificationListenerService extends NotificationListenerService {
    private static final ExecutorService RELAY_EXECUTOR = Executors.newSingleThreadExecutor();
    private static final int MAX_PENDING_EVENTS = 80;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        flushPendingAsync(getApplicationContext());
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;
        SimplificaSecurePreferences preferences = new SimplificaSecurePreferences(this);
        if (!preferences.getBoolean("enabled", false)) return;
        String source = sourceForPackage(sbn.getPackageName());
        if (source.isEmpty() || !preferences.getBoolean("channel_" + source, true)) return;
        if ((sbn.getNotification().flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        String sender = sanitizeSender(sbn.getNotification().extras.getCharSequence(Notification.EXTRA_TITLE), source);
        JSONObject event = baseEvent("insert", sbn, source, sender);
        enqueueAndFlush(getApplicationContext(), event);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;
        SimplificaSecurePreferences preferences = new SimplificaSecurePreferences(this);
        if (!preferences.getBoolean("enabled", false)) return;
        String source = sourceForPackage(sbn.getPackageName());
        if (source.isEmpty()) return;
        JSONObject event = baseEvent("delete", sbn, source, "");
        enqueueAndFlush(getApplicationContext(), event);
    }

    static void flushPendingAsync(Context context) {
        Context appContext = context.getApplicationContext();
        RELAY_EXECUTOR.execute(() -> flushPending(appContext));
    }

    private static void enqueueAndFlush(Context context, JSONObject event) {
        RELAY_EXECUTOR.execute(() -> {
            SimplificaSecurePreferences preferences = new SimplificaSecurePreferences(context);
            JSONArray queue = readQueue(preferences);
            String eventKey = event.optString("event_key");
            String action = event.optString("action");
            JSONArray next = new JSONArray();
            for (int index = 0; index < queue.length(); index++) {
                JSONObject existing = queue.optJSONObject(index);
                if (existing == null) continue;
                if (eventKey.equals(existing.optString("event_key"))) continue;
                next.put(existing);
            }
            next.put(event);
            while (next.length() > MAX_PENDING_EVENTS) next.remove(0);
            preferences.putString("pending_events", next.toString());
            flushPending(context);
        });
    }

    private static synchronized void flushPending(Context context) {
        SimplificaSecurePreferences preferences = new SimplificaSecurePreferences(context);
        if (!preferences.getBoolean("enabled", false)) return;
        if (preferences.getString("user_id").isEmpty()) return;
        JSONArray queue = readQueue(preferences);
        if (queue.length() == 0) return;
        JSONArray remaining = new JSONArray();
        for (int index = 0; index < queue.length(); index++) {
            JSONObject event = queue.optJSONObject(index);
            if (event == null) continue;
            if (!sendEvent(preferences, event)) {
                remaining.put(event);
                for (int rest = index + 1; rest < queue.length(); rest++) {
                    JSONObject pending = queue.optJSONObject(rest);
                    if (pending != null) remaining.put(pending);
                }
                break;
            }
        }
        preferences.putString("pending_events", remaining.toString());
    }

    private static boolean sendEvent(SimplificaSecurePreferences preferences, JSONObject event) {
        String relayUrl = preferences.getString("relay_url");
        String deviceId = preferences.getString("device_id");
        String deviceToken = preferences.getString("device_token");
        String eventKey = event.optString("event_key");
        if (relayUrl.isEmpty() || deviceToken.isEmpty() || deviceId.isEmpty() || eventKey.isEmpty()) return false;
        try {
            JSONObject payload = new JSONObject();
            payload.put("action", event.optString("action", "insert"));
            payload.put("device_id", deviceId);
            payload.put("source", event.optString("source"));
            payload.put("sender_name", event.optString("sender_name"));
            payload.put("event_key", eventKey);
            payload.put("received_at", event.optString("received_at", isoNow()));
            int response = request(preferences, relayUrl, payload.toString());
            return response >= 200 && response < 300;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static int request(SimplificaSecurePreferences preferences, String url, String body) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(12000);
        connection.setReadTimeout(12000);
        connection.setRequestProperty("apikey", preferences.getString("anon_key"));
        connection.setRequestProperty("x-simplifica-device-token", preferences.getString("device_token"));
        connection.setRequestProperty("Content-Type", "application/json");
        if (!body.isEmpty()) {
            connection.setDoOutput(true);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body.getBytes(StandardCharsets.UTF_8));
            }
        }
        int responseCode = connection.getResponseCode();
        closeQuietly(responseCode >= 400 ? connection.getErrorStream() : connection.getInputStream());
        connection.disconnect();
        return responseCode;
    }

    private static JSONObject baseEvent(String action, StatusBarNotification sbn, String source, String sender) {
        JSONObject event = new JSONObject();
        try {
            event.put("action", action);
            event.put("source", source);
            event.put("sender_name", sender);
            event.put("event_key", sha256(sbn.getPackageName() + ":" + sbn.getKey()));
            event.put("received_at", isoDate(sbn.getPostTime()));
        } catch (Exception ignored) {}
        return event;
    }

    private static String sourceForPackage(String packageName) {
        if ("com.whatsapp".equals(packageName) || "com.whatsapp.w4b".equals(packageName)) return "whatsapp";
        if ("com.instagram.android".equals(packageName)) return "instagram";
        if ("com.zhiliaoapp.musically".equals(packageName) || "com.ss.android.ugc.trill".equals(packageName)) return "tiktok";
        return "";
    }

    private static String sanitizeSender(CharSequence raw, String source) {
        String sender = raw == null ? "" : raw.toString().replaceAll("[\\r\\n\\t]+", " ").trim();
        if (sender.length() > 120) sender = sender.substring(0, 120);
        String normalized = sender.toLowerCase(Locale.ROOT);
        if (normalized.equals(source) || normalized.equals("whatsapp") || normalized.equals("instagram") || normalized.equals("tiktok")) return "";
        return sender;
    }

    private static JSONArray readQueue(SimplificaSecurePreferences preferences) {
        try {
            String value = preferences.getString("pending_events");
            return value.isEmpty() ? new JSONArray() : new JSONArray(value);
        } catch (Exception ignored) {
            return new JSONArray();
        }
    }

    private static String sha256(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder output = new StringBuilder();
        for (byte item : digest) output.append(String.format(Locale.ROOT, "%02x", item));
        return output.toString();
    }

    private static String isoDate(long timestamp) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date(timestamp > 0 ? timestamp : System.currentTimeMillis()));
    }

    private static String isoNow() {
        return isoDate(System.currentTimeMillis());
    }

    private static void closeQuietly(InputStream stream) {
        if (stream == null) return;
        try { stream.close(); } catch (Exception ignored) {}
    }
}
