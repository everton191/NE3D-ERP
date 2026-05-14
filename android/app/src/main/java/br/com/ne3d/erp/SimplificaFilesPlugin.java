package br.com.ne3d.erp;

import android.Manifest;
import android.app.ActivityManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
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
import android.webkit.WebView;

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
import java.io.FileInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private final ConcurrentHashMap<String, AtomicBoolean> aiDownloadCancels = new ConcurrentHashMap<>();

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

    @Override
    protected void handleOnPause() {
        // Hiberna o modelo quando o app sai do primeiro plano para reduzir CPU/RAM/bateria.
        new Thread(() -> {
            try {
                InferenceEngineImpl.unloadIfInitialized();
            } catch (Throwable ignored) {
                // A pausa do app nunca deve derrubar a interface.
            }
        }, "simplifica-ai-hibernate").start();
        super.handleOnPause();
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
        if (!isAiLocalProAllowed(call)) {
            call.reject("IA Local é um recurso exclusivo do Plano Pro.");
            return;
        }
        final String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        final String rawUrl = call.getString("url", "");
        final String fallbackName = modelId.isEmpty() ? "modelo.gguf" : modelId + ".gguf";
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
            AtomicBoolean cancelFlag = new AtomicBoolean(false);
            try {
                File dir = getAiModelDir();
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Não foi possível preparar a pasta interna dos modelos.");
                    return;
                }

                File targetFile = new File(dir, fileName);
                JSObject existing = validateAiModelFile(targetFile, minBytes);
                if (existing.optBoolean("ok", false)) {
                    notifyAiModelProgress(modelId, "downloaded", 100, existing.optLong("sizeBytes", 0L), existing.optLong("sizeBytes", 0L));
                    existing.put("ok", true);
                    existing.put("modelId", modelId);
                    existing.put("fileName", fileName);
                    existing.put("installedAt", targetFile.lastModified());
                    existing.put("alreadyInstalled", true);
                    call.resolve(existing);
                    return;
                }

                AtomicBoolean previous = aiDownloadCancels.putIfAbsent(modelId, cancelFlag);
                if (previous != null) {
                    call.reject("A instalação da IA já está em andamento.");
                    return;
                }

                tempFile = new File(dir, fileName + ".download");
                if (tempFile.exists() && !tempFile.delete()) {
                    call.reject("Não foi possível limpar download anterior do modelo.");
                    return;
                }

                notifyAiModelProgress(modelId, "downloading", 0, 0L, 0L);
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
                long expectedBytes = Math.max(0L, connection.getContentLengthLong());
                int lastPercent = -1;
                try (InputStream input = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream output = new FileOutputStream(tempFile)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        if (cancelFlag.get()) {
                            throw new IOException("Download cancelado.");
                        }
                        output.write(buffer, 0, read);
                        totalBytes += read;
                        int percent = expectedBytes > 0 ? (int) Math.min(99, Math.max(0, (totalBytes * 100L) / expectedBytes)) : 0;
                        if (percent != lastPercent) {
                            lastPercent = percent;
                            notifyAiModelProgress(modelId, "downloading", percent, totalBytes, expectedBytes);
                        }
                    }
                } finally {
                    connection.disconnect();
                }

                if (minBytes > 0 && totalBytes < minBytes) {
                    if (tempFile.exists()) tempFile.delete();
                    call.reject("Pacote incompleto ou inválido. O arquivo baixado não tem o tamanho mínimo esperado.");
                    return;
                }

                if (!fileName.toLowerCase(Locale.ROOT).endsWith(".gguf") || !hasGgufMagic(tempFile)) {
                    if (tempFile.exists()) tempFile.delete();
                    call.reject("Arquivo do modelo inválido. O pacote baixado não é GGUF.");
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
                notifyAiModelProgress(modelId, "downloaded", 100, totalBytes, expectedBytes);

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
            } finally {
                aiDownloadCancels.remove(modelId, cancelFlag);
            }
        }).start();
    }

    @PluginMethod
    public void cancelAiModelDownload(PluginCall call) {
        String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        AtomicBoolean flag = aiDownloadCancels.get(modelId);
        if (flag != null) flag.set(true);
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("modelId", modelId);
        result.put("cancelled", flag != null);
        call.resolve(result);
    }

    @PluginMethod
    public void validateAiModel(PluginCall call) {
        String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        String fallbackName = modelId.isEmpty() ? "modelo.gguf" : modelId + ".gguf";
        String fileName = sanitizeGenericFileName(call.getString("fileName", fallbackName));
        String modelPath = call.getString("modelPath", "");
        long minBytes = call.getData().optLong("minBytes", 0L);

        try {
            File targetFile = modelPath != null && !modelPath.trim().isEmpty()
                ? new File(modelPath)
                : new File(getAiModelDir(), fileName);
            JSObject result = validateAiModelFile(targetFile, minBytes);
            result.put("modelId", modelId);
            result.put("fileName", fileName);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Falha ao verificar modelo: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void deleteAiModel(PluginCall call) {
        String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        String fallbackName = modelId.isEmpty() ? "modelo.gguf" : modelId + ".gguf";
        String fileName = sanitizeGenericFileName(call.getString("fileName", fallbackName));

        if (modelId.isEmpty()) {
            call.reject("Modelo inválido.");
            return;
        }

        try {
            try {
                InferenceEngineImpl.unloadIfInitialized();
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
            ? "Este modelo pode deixar seu aparelho lento neste aparelho."
            : "Teste básico de desempenho concluído.");
        call.resolve(result);
    }

    @PluginMethod
    public void getAiRuntimeDiagnostics(PluginCall call) {
        JSObject result = new JSObject();
        ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        int memoryClassMb = manager != null ? manager.getMemoryClass() : 0;
        int largeMemoryClassMb = manager != null ? manager.getLargeMemoryClass() : 0;
        String webView = "indisponível";
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PackageInfo packageInfo = WebView.getCurrentWebViewPackage();
                if (packageInfo != null) {
                    webView = packageInfo.packageName + " " + packageInfo.versionName;
                }
            }
        } catch (Throwable ignored) {
            webView = "não detectado";
        }

        result.put("ok", true);
        result.put("engine", "llama.cpp JNI");
        result.put("nativeLibraryLoaded", InferenceEngineImpl.isNativeLoaded());
        result.put("modelLoaded", InferenceEngineImpl.isModelReady());
        result.put("loadedModelPath", InferenceEngineImpl.getLoadedModelPath());
        result.put("contextTokens", InferenceEngineImpl.getDefaultContextTokens());
        result.put("maxTokens", 160);
        result.put("threads", InferenceEngineImpl.getDefaultThreads());
        result.put("temperature", 0.35);
        result.put("gpuLayers", InferenceEngineImpl.getDefaultGpuLayers());
        result.put("mmap", true);
        result.put("availableMemoryMb", getAvailableMemoryMb());
        result.put("memoryClassMb", memoryClassMb);
        result.put("largeMemoryClassMb", largeMemoryClassMb);
        result.put("availableStorageMb", getAvailableInternalStorageMb());
        result.put("cpuCores", Math.max(1, Runtime.getRuntime().availableProcessors()));
        result.put("androidSdk", Build.VERSION.SDK_INT);
        result.put("abi", Build.SUPPORTED_ABIS != null && Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : Build.CPU_ABI);
        result.put("webView", webView);
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
        if (!isAiLocalProAllowed(call)) {
            call.reject("IA Local é um recurso exclusivo do Plano Pro.");
            return;
        }
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

        runWithPluginTimeout(call, timeoutMs, "Tempo limite da IA offline atingido. Tente um modelo menor.", () -> {
            try {
                InferenceEngineImpl engine = InferenceEngineImpl.getInstance(getContext());
                String text = engine.generate(modelPath, systemPrompt, prompt, maxTokens, timeoutMs);
                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("text", text);
                result.put("offline", true);
                result.put("maxTokens", maxTokens);
                return result;
            } catch (Throwable error) {
                throw new Exception("Falha na inferência offline: " + error.getMessage(), error);
            }
        });
    }

    @PluginMethod
    public void loadAiModel(PluginCall call) {
        if (!isAiLocalProAllowed(call)) {
            call.reject("IA Local é um recurso exclusivo do Plano Pro.");
            return;
        }
        final String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        final String modelPath = call.getString("modelPath", "");
        final long timeoutMs = Math.max(8000L, Math.min(call.getData().optLong("timeoutMs", 60000L), 120000L));

        if (modelPath == null || modelPath.trim().isEmpty()) {
            call.reject("Modelo offline não instalado.");
            return;
        }

        runWithPluginTimeout(call, timeoutMs, "Tempo limite ao carregar a IA local.", () -> {
            JSObject validation = validateAiModelFile(new File(modelPath), 0L);
            if (!validation.optBoolean("ok", false)) {
                throw new IOException("Arquivo GGUF inválido.");
            }
            notifyAiModelProgress(modelId, "loading", 100, validation.optLong("sizeBytes", 0L), validation.optLong("sizeBytes", 0L));
            long startedAt = System.currentTimeMillis();
            InferenceEngineImpl.getInstance(getContext()).loadModel(modelPath);
            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("modelId", modelId);
            result.put("elapsedMs", System.currentTimeMillis() - startedAt);
            result.put("offline", true);
            return result;
        });
    }

    @PluginMethod
    public void testAiModelRuntime(PluginCall call) {
        if (!isAiLocalProAllowed(call)) {
            call.reject("IA Local é um recurso exclusivo do Plano Pro.");
            return;
        }
        final String modelId = sanitizeAiModelId(call.getString("modelId", ""));
        final String modelPath = call.getString("modelPath", "");
        final String systemPrompt = call.getString("systemPrompt", "Você é um assistente de gestão para impressão 3D.");
        final String prompt = call.getString("prompt", "Responda apenas: OK");
        final int maxTokens = Math.max(4, Math.min(call.getData().optInt("maxTokens", 12), 32));
        final long timeoutMs = Math.max(15000L, Math.min(call.getData().optLong("timeoutMs", 120000L), 180000L));

        if (modelPath == null || modelPath.trim().isEmpty()) {
            call.reject("Modelo offline não instalado.");
            return;
        }

        runWithPluginTimeout(call, timeoutMs, "Tempo limite ao testar a IA. Tente um modelo menor.", () -> {
            try {
                JSObject validation = validateAiModelFile(new File(modelPath), 0L);
                if (!validation.optBoolean("ok", false)) {
                    throw new IOException("Arquivo GGUF inválido.");
                }
                notifyAiModelProgress(modelId, "testing", 100, validation.optLong("sizeBytes", 0L), validation.optLong("sizeBytes", 0L));
                long startedAt = System.currentTimeMillis();
                InferenceEngineImpl engine = InferenceEngineImpl.getInstance(getContext());
                String text = engine.generate(modelPath, systemPrompt, prompt, maxTokens, timeoutMs);
                long elapsedMs = System.currentTimeMillis() - startedAt;
                JSObject result = new JSObject();
                result.put("ok", text != null && !text.trim().isEmpty());
                result.put("modelId", modelId);
                result.put("text", text == null ? "" : text.trim());
                result.put("elapsedMs", elapsedMs);
                result.put("offline", true);
                return result;
            } catch (Throwable error) {
                throw new Exception("Falha no teste da IA offline: " + error.getMessage(), error);
            }
        });
    }

    @PluginMethod
    public void cancelAiGeneration(PluginCall call) {
        try {
            InferenceEngineImpl.cancelIfInitialized();
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
            // Nao inicializa o runtime apenas para hibernar; isso evita consumo de CPU/RAM ao minimizar o app.
            InferenceEngineImpl.unloadIfInitialized();
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

    private boolean isAiLocalProAllowed(PluginCall call) {
        return call != null && call.getData() != null && call.getData().optBoolean("proAllowed", false);
    }

    private void notifyAiModelProgress(String modelId, String status, int percent, long bytesRead, long totalBytes) {
        JSObject event = new JSObject();
        event.put("modelId", modelId == null ? "" : modelId);
        event.put("status", status == null ? "" : status);
        event.put("percent", Math.max(0, Math.min(100, percent)));
        event.put("bytesRead", Math.max(0L, bytesRead));
        event.put("totalBytes", Math.max(0L, totalBytes));
        mainHandler.post(() -> notifyListeners("aiModelProgress", event, true));
    }

    private JSObject validateAiModelFile(File targetFile, long minBytes) throws IOException {
        JSObject result = new JSObject();
        if (targetFile == null || !targetFile.exists() || !targetFile.isFile() || !targetFile.canRead()) {
            result.put("ok", false);
            result.put("message", "Arquivo do modelo não encontrado.");
            return result;
        }
        long sizeBytes = targetFile.length();
        if (minBytes > 0 && sizeBytes < minBytes) {
            result.put("ok", false);
            result.put("message", "Arquivo incompleto.");
            result.put("sizeBytes", sizeBytes);
            return result;
        }
        if (!targetFile.getName().toLowerCase(Locale.ROOT).endsWith(".gguf")) {
            result.put("ok", false);
            result.put("message", "Extensão inválida.");
            result.put("sizeBytes", sizeBytes);
            return result;
        }
        if (!hasGgufMagic(targetFile)) {
            result.put("ok", false);
            result.put("message", "Cabeçalho GGUF inválido.");
            result.put("sizeBytes", sizeBytes);
            return result;
        }
        result.put("ok", true);
        result.put("path", targetFile.getAbsolutePath());
        result.put("fileName", targetFile.getName());
        result.put("sizeBytes", sizeBytes);
        result.put("sizeMb", Math.round(sizeBytes / 1024f / 1024f));
        result.put("extension", "gguf");
        return result;
    }

    private boolean hasGgufMagic(File file) {
        if (file == null || !file.exists() || file.length() < 4) return false;
        byte[] header = new byte[4];
        try (FileInputStream input = new FileInputStream(file)) {
            int read = input.read(header);
            return read == 4 && header[0] == 'G' && header[1] == 'G' && header[2] == 'U' && header[3] == 'F';
        } catch (Exception ignored) {
            return false;
        }
    }

    private interface AiRuntimeTask {
        JSObject run() throws Exception;
    }

    private void runWithPluginTimeout(PluginCall call, long timeoutMs, String timeoutMessage, AiRuntimeTask task) {
        final AtomicBoolean settled = new AtomicBoolean(false);
        Thread worker = new Thread(() -> {
            try {
                JSObject result = task.run();
                if (settled.compareAndSet(false, true)) {
                    mainHandler.post(() -> call.resolve(result));
                }
            } catch (Exception error) {
                if (settled.compareAndSet(false, true)) {
                    mainHandler.post(() -> call.reject(error.getMessage(), error));
                }
            }
        }, "simplifica-ai-runtime");
        worker.start();

        long safeTimeoutMs = Math.max(8000L, Math.min(timeoutMs <= 0 ? 60000L : timeoutMs, 180000L));
        mainHandler.postDelayed(() -> {
            if (settled.compareAndSet(false, true)) {
                try {
                    InferenceEngineImpl.cancelIfInitialized();
                } catch (Throwable ignored) {
                    // O timeout deve devolver o controle para a UI mesmo que o runtime esteja ocupado.
                }
                call.reject(timeoutMessage);
            }
        }, safeTimeoutMs);
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
