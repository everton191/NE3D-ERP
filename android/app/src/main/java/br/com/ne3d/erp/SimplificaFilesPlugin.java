package br.com.ne3d.erp;

import android.Manifest;
import android.app.ActivityManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StatFs;
import android.provider.MediaStore;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.arm.aichat.internal.InferenceEngineImpl;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
    name = "SimplificaFiles",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage"),
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
    }
)
public class SimplificaFilesPlugin extends Plugin {

    private static final String AI_MODEL_DIR = "ai-models";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer speechRecognizer;
    private PluginCall speechCall;
    private Runnable speechTimeoutRunnable;
    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady = false;

    @Override
    protected void handleOnDestroy() {
        mainHandler.post(() -> {
            cleanupSpeechRecognizer(false);
            if (textToSpeech != null) {
                textToSpeech.stop();
                textToSpeech.shutdown();
                textToSpeech = null;
                textToSpeechReady = false;
            }
        });
        super.handleOnDestroy();
    }

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
            try {
                InferenceEngineImpl.getInstance(getContext()).unloadModel();
            } catch (Throwable ignored) {
                // Remocao do arquivo nao deve falhar se o runtime ainda nao foi carregado.
            }
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
        ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        int memoryClassMb = manager != null ? manager.getMemoryClass() : 0;
        int largeMemoryClassMb = manager != null ? manager.getLargeMemoryClass() : 0;
        int cpuCores = Math.max(1, Runtime.getRuntime().availableProcessors());
        boolean speechAvailable = SpeechRecognizer.isRecognitionAvailable(getContext());
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
        result.put("memoryClassMb", memoryClassMb);
        result.put("largeMemoryClassMb", largeMemoryClassMb);
        result.put("storageMb", storageMb);
        result.put("cpuCores", cpuCores);
        result.put("androidSdk", Build.VERSION.SDK_INT);
        result.put("speechAvailable", speechAvailable);
        result.put("ttsAvailable", true);
        result.put("message", "high".equals(risk)
            ? "Este modelo pode deixar seu aparelho lento. Recomendamos usar IA Lite ou IA Smart."
            : "Teste básico de desempenho concluído.");
        call.resolve(result);
    }

    @PluginMethod
    public void getAiVoiceSupport(PluginCall call) {
        JSObject result = new JSObject();
        result.put("speechAvailable", SpeechRecognizer.isRecognitionAvailable(getContext()));
        result.put("ttsAvailable", true);
        result.put("microphonePermission", getPermissionState("microphone") == PermissionState.GRANTED);
        result.put("androidSdk", Build.VERSION.SDK_INT);
        call.resolve(result);
    }

    @PluginMethod
    public void startAiVoiceRecognition(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("Seu dispositivo não possui suporte completo ao reconhecimento de voz.");
            return;
        }
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphonePermsCallback");
            return;
        }
        startSpeechRecognition(call);
    }

    @PluginMethod
    public void stopAiVoiceRecognition(PluginCall call) {
        mainHandler.post(() -> {
            cleanupSpeechRecognizer(false);
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void speakAiText(PluginCall call) {
        final String text = call.getString("text", "");
        final float rate = (float) Math.max(0.6, Math.min(call.getData().optDouble("rate", 1.0), 1.4));
        if (text == null || text.trim().isEmpty()) {
            call.reject("Texto vazio.");
            return;
        }
        mainHandler.post(() -> speakText(call, text, rate));
    }

    @PluginMethod
    public void stopAiSpeech(PluginCall call) {
        mainHandler.post(() -> {
            if (textToSpeech != null) textToSpeech.stop();
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void runAiPrompt(PluginCall call) {
        final String modelPath = call.getString("modelPath", "");
        final String systemPrompt = call.getString("systemPrompt", "");
        final String prompt = call.getString("prompt", "");
        final int maxTokens = Math.max(16, Math.min(call.getData().optInt("maxTokens", 160), 256));
        final long timeoutMs = Math.max(8000L, Math.min(call.getData().optLong("timeoutMs", 60000L), 120000L));

        if (modelPath == null || modelPath.trim().isEmpty()) {
            call.reject("Modelo offline não instalado.");
            return;
        }
        if (prompt == null || prompt.trim().isEmpty()) {
            call.reject("Pergunta vazia.");
            return;
        }

        new Thread(() -> {
            try {
                InferenceEngineImpl engine = InferenceEngineImpl.getInstance(getContext());
                String text = engine.generate(modelPath, systemPrompt, prompt, maxTokens, timeoutMs);
                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("text", text);
                result.put("offline", true);
                result.put("maxTokens", maxTokens);
                call.resolve(result);
            } catch (Throwable error) {
                call.reject("Falha na inferência offline: " + error.getMessage(), error instanceof Exception ? (Exception) error : null);
            }
        }).start();
    }

    @PluginMethod
    public void cancelAiGeneration(PluginCall call) {
        try {
            InferenceEngineImpl.getInstance(getContext()).cancelGeneration();
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        } catch (Throwable error) {
            call.reject("Falha ao cancelar geração offline: " + error.getMessage(), error instanceof Exception ? (Exception) error : null);
        }
    }

    @PluginMethod
    public void unloadAiModel(PluginCall call) {
        try {
            InferenceEngineImpl.getInstance(getContext()).unloadModel();
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        } catch (Throwable error) {
            call.reject("Falha ao liberar IA local: " + error.getMessage(), error instanceof Exception ? (Exception) error : null);
        }
    }

    @PermissionCallback
    private void microphonePermsCallback(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            startSpeechRecognition(call);
        } else {
            call.reject("Permissão de microfone negada.");
        }
    }

    private void startSpeechRecognition(PluginCall call) {
        mainHandler.post(() -> {
            cleanupSpeechRecognizer(false);
            speechCall = call;
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}

                @Override
                public void onError(int error) {
                    PluginCall activeCall = speechCall;
                    cleanupSpeechRecognizer(false);
                    if (activeCall != null) {
                        activeCall.reject(speechErrorMessage(error));
                    }
                }

                @Override
                public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    String text = matches != null && !matches.isEmpty() ? matches.get(0) : "";
                    PluginCall activeCall = speechCall;
                    cleanupSpeechRecognizer(false);
                    if (activeCall != null) {
                        if (text == null || text.trim().isEmpty()) {
                            activeCall.reject("Não foi possível reconhecer sua fala.");
                            return;
                        }
                        JSObject result = new JSObject();
                        result.put("ok", true);
                        result.put("text", text.trim());
                        activeCall.resolve(result);
                    }
                }
            });

            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Fale com o Assistente Simplifica 3D");
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            speechTimeoutRunnable = () -> {
                PluginCall activeCall = speechCall;
                cleanupSpeechRecognizer(false);
                if (activeCall != null) {
                    activeCall.reject("Tempo esgotado para reconhecimento de voz.");
                }
            };
            mainHandler.postDelayed(speechTimeoutRunnable, 12000);
            speechRecognizer.startListening(intent);
        });
    }

    private void cleanupSpeechRecognizer(boolean rejectActive) {
        if (speechTimeoutRunnable != null) {
            mainHandler.removeCallbacks(speechTimeoutRunnable);
            speechTimeoutRunnable = null;
        }
        if (speechRecognizer != null) {
            try {
                speechRecognizer.cancel();
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        if (rejectActive && speechCall != null) {
            speechCall.reject("Reconhecimento de voz cancelado.");
        }
        speechCall = null;
    }

    private String speechErrorMessage(int error) {
        if (error == SpeechRecognizer.ERROR_AUDIO) return "Falha ao acessar o microfone.";
        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) return "Permissão de microfone negada.";
        if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) return "O reconhecimento de voz não respondeu. Tente novamente.";
        if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) return "Não foi possível reconhecer sua fala.";
        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) return "Reconhecimento de voz ocupado. Tente novamente.";
        return "Falha no reconhecimento de voz.";
    }

    private void speakText(PluginCall call, String text, float rate) {
        if (textToSpeech == null) {
            textToSpeech = new TextToSpeech(getContext(), status -> {
                if (status == TextToSpeech.SUCCESS) {
                    textToSpeechReady = true;
                    textToSpeech.setLanguage(new Locale("pt", "BR"));
                    textToSpeech.setSpeechRate(rate);
                    textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "simplifica-ai-response");
                    JSObject result = new JSObject();
                    result.put("ok", true);
                    call.resolve(result);
                } else {
                    call.reject("Leitura em voz indisponível neste aparelho.");
                }
            });
            return;
        }
        if (!textToSpeechReady) {
            call.reject("Leitura em voz ainda não está pronta.");
            return;
        }
        textToSpeech.setLanguage(new Locale("pt", "BR"));
        textToSpeech.setSpeechRate(rate);
        textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "simplifica-ai-response");
        JSObject result = new JSObject();
        result.put("ok", true);
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
