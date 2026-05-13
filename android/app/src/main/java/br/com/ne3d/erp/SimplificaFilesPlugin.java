package br.com.ne3d.erp;

import android.Manifest;
import android.app.ActivityManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(
    name = "SimplificaFiles",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage")
    }
)
public class SimplificaFilesPlugin extends Plugin {

    private static final String AI_MODEL_DIR = "ai-models";

    @PluginMethod
    public void requestStoragePermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("scoped", true);
            call.resolve(result);
            return;
        }

        if (getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storageCheckPermsCallback");
            return;
        }

        JSObject result = new JSObject();
        result.put("granted", true);
        result.put("scoped", false);
        call.resolve(result);
    }

    @PermissionCallback
    private void storageCheckPermsCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("storage") == PermissionState.GRANTED);
        result.put("scoped", false);
        call.resolve(result);
    }

    @PluginMethod
    public void savePdf(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermsCallback");
            return;
        }

        writePdf(call);
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermsCallback");
            return;
        }

        writeFile(call);
    }

    @PluginMethod
    public void downloadAiModel(PluginCall call) {
        final String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        final String rawUrl = call.getString("url", "");
        final String fallbackName = modelId.isEmpty() ? "modelo.s3dmodel" : modelId + ".s3dmodel";
        final String fileName = sanitizeGenericFileName(call.getString("fileName", fallbackName));
        final long minBytes = call.getData().optLong("minBytes", 0L);
        final int sizeMb = call.getData().optInt("sizeMb", 0);

        if (modelId.isEmpty()) {
            call.reject("Modelo inválido.");
            return;
        }

        if (rawUrl == null || rawUrl.trim().isEmpty() || !(rawUrl.startsWith("https://") || rawUrl.startsWith("http://"))) {
            call.reject("Link direto do pacote do modelo não configurado.");
            return;
        }

        new Thread(() -> {
            File tempFile = null;
            try {
                File dir = getAiModelDir();
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Não foi possível preparar a pasta interna dos modelos.");
                    return;
                }

                File targetFile = new File(dir, fileName);
                tempFile = new File(dir, fileName + ".download");
                if (tempFile.exists() && !tempFile.delete()) {
                    call.reject("Não foi possível limpar download anterior do modelo.");
                    return;
                }

                HttpURLConnection connection = (HttpURLConnection) new URL(rawUrl).openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(120000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", "Simplifica3D-Android");
                int responseCode = connection.getResponseCode();
                if (responseCode < 200 || responseCode >= 300) {
                    call.reject("Pacote do modelo indisponível (" + responseCode + ").");
                    connection.disconnect();
                    return;
                }

                long totalBytes = 0;
                try (InputStream input = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream output = new FileOutputStream(tempFile)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        totalBytes += read;
                    }
                } finally {
                    connection.disconnect();
                }

                if (minBytes > 0 && totalBytes < minBytes) {
                    if (tempFile.exists()) tempFile.delete();
                    call.reject("Pacote incompleto ou inválido. O arquivo baixado não tem o tamanho mínimo esperado.");
                    return;
                }

                if (targetFile.exists() && !targetFile.delete()) {
                    if (tempFile.exists()) tempFile.delete();
                    call.reject("Não foi possível substituir o modelo instalado.");
                    return;
                }

                if (!tempFile.renameTo(targetFile)) {
                    if (tempFile.exists()) tempFile.delete();
                    call.reject("Não foi possível concluir a instalação do modelo.");
                    return;
                }

                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("modelId", modelId);
                result.put("fileName", fileName);
                result.put("path", targetFile.getAbsolutePath());
                result.put("sizeBytes", totalBytes);
                result.put("sizeMb", Math.max(sizeMb, Math.round(totalBytes / 1024f / 1024f)));
                result.put("installedAt", System.currentTimeMillis());
                call.resolve(result);
            } catch (Exception error) {
                if (tempFile != null && tempFile.exists()) tempFile.delete();
                call.reject("Falha ao baixar o modelo: " + error.getMessage(), error);
            }
        }).start();
    }

    @PluginMethod
    public void deleteAiModel(PluginCall call) {
        String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        String fallbackName = modelId.isEmpty() ? "modelo.s3dmodel" : modelId + ".s3dmodel";
        String fileName = sanitizeGenericFileName(call.getString("fileName", fallbackName));

        if (modelId.isEmpty()) {
            call.reject("Modelo inválido.");
            return;
        }

        try {
            File targetFile = new File(getAiModelDir(), fileName);
            boolean deleted = !targetFile.exists() || targetFile.delete();
            JSObject result = new JSObject();
            result.put("ok", deleted);
            result.put("modelId", modelId);
            result.put("fileName", fileName);
            result.put("deleted", deleted);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Falha ao remover modelo: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void testAiModelPerformance(PluginCall call) {
        int sizeMb = call.getData().optInt("sizeMb", 0);
        long memoryMb = getAvailableMemoryMb();
        long storageMb = getAvailableInternalStorageMb();
        String risk = "low";

        if (sizeMb >= 180 && memoryMb > 0 && memoryMb < 1024) {
            risk = "high";
        } else if (sizeMb >= 90 && memoryMb > 0 && memoryMb < 768) {
            risk = "medium";
        } else if (storageMb > 0 && storageMb < Math.max(256, sizeMb * 2L)) {
            risk = "medium";
        }

        JSObject result = new JSObject();
        result.put("ok", !"high".equals(risk));
        result.put("risk", risk);
        result.put("memoryMb", memoryMb);
        result.put("storageMb", storageMb);
        result.put("message", "high".equals(risk)
            ? "Este modelo pode deixar seu aparelho lento. Recomendamos usar IA Lite ou IA Smart."
            : "Teste básico de desempenho concluído.");
        call.resolve(result);
    }

    @PermissionCallback
    private void storagePermsCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            String fileName = call.getString("fileName", "");
            if (fileName.toLowerCase().endsWith(".pdf")) {
                writePdf(call);
            } else {
                writeFile(call);
            }
        } else {
            call.reject("Permissão de armazenamento negada.");
        }
    }

    private void writePdf(PluginCall call) {
        writeBase64ToDownloads(call, "application/pdf", sanitizePdfFileName(call.getString("fileName", "pedido-simplifica-3d.pdf")), "PDF");
    }

    private void writeFile(PluginCall call) {
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String fileName = sanitizeGenericFileName(call.getString("fileName", "arquivo-simplifica-3d.json"));
        writeBase64ToDownloads(call, mimeType, fileName, "arquivo");
    }

    private void writeBase64ToDownloads(PluginCall call, String mimeType, String fileName, String label) {
        String base64 = call.getString("base64", "");

        if (base64 == null || base64.trim().isEmpty()) {
            call.reject(label + " vazio.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64.replaceAll("\\s", ""), Base64.DEFAULT);
            Uri uri;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Simplifica3D");
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Não foi possível criar o arquivo em Downloads.");
                    return;
                }

                try (OutputStream output = resolver.openOutputStream(uri)) {
                    if (output == null) {
                        call.reject("Não foi possível abrir o arquivo em Downloads.");
                        return;
                    }
                    output.write(bytes);
                }

                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Simplifica3D");
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Não foi possível criar a pasta Downloads/Simplifica3D.");
                    return;
                }

                File file = new File(dir, fileName);
                try (FileOutputStream output = new FileOutputStream(file)) {
                    output.write(bytes);
                }
                uri = Uri.fromFile(file);
            }

            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("fileName", fileName);
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Falha ao salvar " + label + ": " + error.getMessage(), error);
        }
    }

    private File getAiModelDir() {
        return new File(getContext().getFilesDir(), AI_MODEL_DIR);
    }

    private String sanitizeAiModelId(String value) {
        String id = value == null ? "" : value.trim().toLowerCase();
        return id.replaceAll("[^a-z0-9_-]+", "");
    }

    private long getAvailableMemoryMb() {
        try {
            ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo info = new ActivityManager.MemoryInfo();
            manager.getMemoryInfo(info);
            return Math.max(0L, info.availMem / 1024L / 1024L);
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private long getAvailableInternalStorageMb() {
        try {
            StatFs stats = new StatFs(getContext().getFilesDir().getAbsolutePath());
            return Math.max(0L, stats.getAvailableBytes() / 1024L / 1024L);
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private String sanitizePdfFileName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty()) name = "pedido-simplifica-3d.pdf";
        name = name.replaceAll("[\\\\/:*?\"<>|]+", "-").replaceAll("\\s+", "-").toLowerCase();
        if (!name.endsWith(".pdf")) name += ".pdf";
        return name;
    }

    private String sanitizeGenericFileName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty()) name = "arquivo-simplifica-3d.json";
        name = name.replaceAll("[\\\\/:*?\"<>|]+", "-").replaceAll("\\s+", "-").toLowerCase();
        if (!name.contains(".")) name += ".json";
        return name;
    }
}
