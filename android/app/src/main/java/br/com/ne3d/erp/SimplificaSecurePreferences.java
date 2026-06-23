package br.com.ne3d.erp;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class SimplificaSecurePreferences {
    private static final String STORE_NAME = "simplifica_message_relay";
    private static final String KEY_ALIAS = "simplifica_message_relay_key_v1";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private final SharedPreferences preferences;

    SimplificaSecurePreferences(Context context) {
        preferences = context.getApplicationContext().getSharedPreferences(STORE_NAME, Context.MODE_PRIVATE);
    }

    synchronized void putString(String key, String value) {
        if (value == null || value.isEmpty()) {
            preferences.edit().remove(key).apply();
            return;
        }
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            byte[] iv = cipher.getIV();
            ByteBuffer payload = ByteBuffer.allocate(4 + iv.length + encrypted.length);
            payload.putInt(iv.length);
            payload.put(iv);
            payload.put(encrypted);
            preferences.edit().putString(key, Base64.encodeToString(payload.array(), Base64.NO_WRAP)).apply();
        } catch (Exception error) {
            throw new IllegalStateException("Não foi possível proteger a configuração do relé.", error);
        }
    }

    synchronized String getString(String key) {
        String encoded = preferences.getString(key, "");
        if (encoded == null || encoded.isEmpty()) return "";
        try {
            ByteBuffer payload = ByteBuffer.wrap(Base64.decode(encoded, Base64.NO_WRAP));
            int ivLength = payload.getInt();
            if (ivLength < 12 || ivLength > 32 || payload.remaining() <= ivLength) return "";
            byte[] iv = new byte[ivLength];
            payload.get(iv);
            byte[] encrypted = new byte[payload.remaining()];
            payload.get(encrypted);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception error) {
            preferences.edit().remove(key).apply();
            return "";
        }
    }

    void putBoolean(String key, boolean value) {
        preferences.edit().putBoolean(key, value).apply();
    }

    boolean getBoolean(String key, boolean fallback) {
        return preferences.getBoolean(key, fallback);
    }

    void clearCredentials() {
        preferences.edit()
            .remove("relay_url")
            .remove("anon_key")
            .remove("device_token")
            .remove("device_id")
            .remove("pending_events")
            .putBoolean("enabled", false)
            .apply();
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
         .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
         .build());
        return generator.generateKey();
    }
}
