package br.com.ne3d.erp;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SimplificaNotifications")
public class SimplificaNotificationsPlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) {
        SimplificaSecurePreferences preferences = new SimplificaSecurePreferences(getContext());
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("permissionGranted", hasNotificationAccess());
        result.put("enabled", preferences.getBoolean("enabled", false));
        result.put("registered", !preferences.getString("device_token").isEmpty());
        result.put("whatsapp", preferences.getBoolean("channel_whatsapp", true));
        result.put("instagram", preferences.getBoolean("channel_instagram", true));
        result.put("tiktok", preferences.getBoolean("channel_tiktok", true));
        call.resolve(result);
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        JSObject result = new JSObject();
        result.put("opened", true);
        call.resolve(result);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        String relayUrl = value(call.getString("relayUrl"));
        String anonKey = value(call.getString("anonKey"));
        String deviceToken = value(call.getString("deviceToken"));
        String deviceId = value(call.getString("deviceId"));
        SimplificaSecurePreferences preferences = new SimplificaSecurePreferences(getContext());
        if (deviceToken.isEmpty()) deviceToken = preferences.getString("device_token");
        if (enabled && (!relayUrl.startsWith("https://") || anonKey.isEmpty() || deviceToken.isEmpty() || deviceId.isEmpty())) {
            call.reject("Entre na sua conta e sincronize o aplicativo antes de ativar os avisos.");
            return;
        }
        try {
            preferences.putBoolean("enabled", enabled);
            preferences.putBoolean("channel_whatsapp", call.getBoolean("whatsapp", true));
            preferences.putBoolean("channel_instagram", call.getBoolean("instagram", true));
            preferences.putBoolean("channel_tiktok", call.getBoolean("tiktok", true));
            if (enabled) {
                preferences.putString("relay_url", relayUrl.replaceAll("/+$", ""));
                preferences.putString("anon_key", anonKey);
                preferences.putString("device_token", deviceToken);
                preferences.putString("device_id", deviceId);
                SimplificaNotificationListenerService.flushPendingAsync(getContext());
            } else {
                preferences.clearCredentials();
            }
            getStatus(call);
        } catch (Exception error) {
            call.reject("Não foi possível salvar a configuração protegida.", error);
        }
    }

    @PluginMethod
    public void flushPending(PluginCall call) {
        SimplificaNotificationListenerService.flushPendingAsync(getContext());
        JSObject result = new JSObject();
        result.put("scheduled", true);
        call.resolve(result);
    }

    private boolean hasNotificationAccess() {
        String enabled = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        if (enabled == null || enabled.isEmpty()) return false;
        ComponentName expected = new ComponentName(getContext(), SimplificaNotificationListenerService.class);
        String[] entries = enabled.split(":");
        for (String entry : entries) {
            ComponentName component = ComponentName.unflattenFromString(entry);
            if (expected.equals(component)) return true;
        }
        return false;
    }

    private String value(String input) {
        return input == null ? "" : input.trim();
    }
}
