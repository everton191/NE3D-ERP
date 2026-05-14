package com.arm.aichat.internal;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.io.IOException;

public final class InferenceEngineImpl {
    private static final String TAG = "S3D-Llama";
    private static final String LIB_NAME = "ai-chat";
    private static final int DEFAULT_MAX_TOKENS = 160;
    private static final int DEFAULT_CONTEXT_TOKENS = 2048;
    private static final int DEFAULT_THREADS = 2;
    private static final int DEFAULT_GPU_LAYERS = 0;
    private static final int MAX_RESPONSE_CHARS = 2400;
    private static final Object LOCK = new Object();

    private static InferenceEngineImpl instance;
    private static boolean nativeLoaded = false;

    private String loadedModelPath = "";
    private boolean modelReady = false;
    private volatile boolean cancelRequested = false;

    private InferenceEngineImpl(Context context) {
        synchronized (LOCK) {
            if (!nativeLoaded) {
                System.loadLibrary(LIB_NAME);
                init(context.getApplicationInfo().nativeLibraryDir);
                nativeLoaded = true;
            }
        }
    }

    public static InferenceEngineImpl getInstance(Context context) {
        synchronized (LOCK) {
            if (instance == null) {
                instance = new InferenceEngineImpl(context.getApplicationContext());
            }
            return instance;
        }
    }

    public static void unloadIfInitialized() {
        synchronized (LOCK) {
            if (instance != null) {
                instance.unloadModel();
            }
        }
    }

    public static void cancelIfInitialized() {
        synchronized (LOCK) {
            if (instance != null) {
                instance.cancelGeneration();
            }
        }
    }

    public static boolean isNativeLoaded() {
        synchronized (LOCK) {
            return nativeLoaded;
        }
    }

    public static boolean isModelReady() {
        synchronized (LOCK) {
            return instance != null && instance.modelReady;
        }
    }

    public static String getLoadedModelPath() {
        synchronized (LOCK) {
            return instance == null ? "" : instance.loadedModelPath;
        }
    }

    public static int getDefaultContextTokens() {
        return DEFAULT_CONTEXT_TOKENS;
    }

    public static int getDefaultThreads() {
        return DEFAULT_THREADS;
    }

    public static int getDefaultGpuLayers() {
        return DEFAULT_GPU_LAYERS;
    }

    public String generate(String modelPath, String systemPrompt, String userPrompt, int maxTokens, long timeoutMs)
            throws Exception {
        synchronized (LOCK) {
            cancelRequested = false;
            File modelFile = new File(modelPath == null ? "" : modelPath);
            if (!modelFile.exists() || !modelFile.isFile() || !modelFile.canRead()) {
                throw new IOException("Modelo GGUF não encontrado ou sem permissão de leitura.");
            }

            int safeMaxTokens = Math.max(16, Math.min(maxTokens <= 0 ? DEFAULT_MAX_TOKENS : maxTokens, 256));
            long safeTimeoutMs = Math.max(8000L, Math.min(timeoutMs <= 0 ? 60000L : timeoutMs, 120000L));
            long deadline = System.currentTimeMillis() + safeTimeoutMs;

            ensureModelLoaded(modelFile.getAbsolutePath());

            String safeSystemPrompt = systemPrompt == null || systemPrompt.trim().isEmpty()
                    ? "Você é um assistente de gestão para impressão 3D."
                    : systemPrompt.trim();
            String safeUserPrompt = userPrompt == null ? "" : userPrompt.trim();
            if (safeUserPrompt.isEmpty()) {
                throw new IllegalArgumentException("Prompt vazio.");
            }

            int systemStatus = processSystemPrompt(safeSystemPrompt);
            if (systemStatus != 0) {
                throw new IOException("Falha ao preparar o prompt do sistema: " + systemStatus);
            }

            int userStatus = processUserPrompt(safeUserPrompt, safeMaxTokens);
            if (userStatus != 0) {
                throw new IOException("Falha ao processar o prompt: " + userStatus);
            }

            StringBuilder output = new StringBuilder();
            while (!cancelRequested && System.currentTimeMillis() < deadline && output.length() < MAX_RESPONSE_CHARS) {
                String token = generateNextToken();
                if (token == null) break;
                output.append(token);
            }

            if (cancelRequested) {
                throw new IOException("Geração cancelada.");
            }

            if (System.currentTimeMillis() >= deadline) {
                Log.w(TAG, "Generation timeout reached.");
            }

            String text = output.toString().trim();
            if (text.isEmpty()) {
                throw new IOException("O modelo não retornou resposta.");
            }
            return text;
        }
    }

    public void loadModel(String modelPath) throws Exception {
        synchronized (LOCK) {
            File modelFile = new File(modelPath == null ? "" : modelPath);
            if (!modelFile.exists() || !modelFile.isFile() || !modelFile.canRead()) {
                throw new IOException("Modelo GGUF não encontrado ou sem permissão de leitura.");
            }
            ensureModelLoaded(modelFile.getAbsolutePath());
        }
    }

    public void cancelGeneration() {
        cancelRequested = true;
    }

    public void unloadModel() {
        synchronized (LOCK) {
            if (!modelReady) return;
            try {
                unload();
            } catch (Exception error) {
                Log.w(TAG, "Failed to unload model", error);
            } finally {
                loadedModelPath = "";
                modelReady = false;
            }
        }
    }

    private void ensureModelLoaded(String modelPath) throws Exception {
        if (modelReady && modelPath.equals(loadedModelPath)) return;
        if (modelReady) unloadModel();

        int loadStatus = load(modelPath);
        if (loadStatus != 0) {
            loadedModelPath = "";
            modelReady = false;
            throw new IOException("Falha ao carregar o modelo GGUF: " + loadStatus);
        }

        int prepareStatus = prepare();
        if (prepareStatus != 0) {
            try {
                unload();
            } catch (Exception cleanupError) {
                Log.w(TAG, "Failed to cleanup model after prepare error", cleanupError);
            }
            loadedModelPath = "";
            modelReady = false;
            throw new IOException("Falha ao preparar runtime GGUF: " + prepareStatus);
        }

        loadedModelPath = modelPath;
        modelReady = true;
    }

    private native void init(String nativeLibDir);
    private native int load(String modelPath);
    private native int prepare();
    private native String systemInfo();
    private native String benchModel(int pp, int tg, int pl, int nr);
    private native int processSystemPrompt(String systemPrompt);
    private native int processUserPrompt(String userPrompt, int predictLength);
    private native String generateNextToken();
    private native void unload();
    private native void shutdown();
}
