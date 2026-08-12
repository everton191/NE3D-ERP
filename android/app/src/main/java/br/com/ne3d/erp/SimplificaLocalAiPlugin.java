package br.com.ne3d.erp;

import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "SimplificaLocalAi")
public class SimplificaLocalAiPlugin extends Plugin {
    private static final Uri PROVIDER = Uri.parse("content://br.com.simplifica.ai.provider");
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        super.load();
        executor.execute(() -> {
            try { callProvider("ensure_model", null); } catch (Exception ignored) { }
        });
    }

    @PluginMethod
    public void status(PluginCall call) {
        try {
            call.resolve(statusResult(callProvider("status", null)));
        } catch (Exception error) {
            call.reject("Instale o Simplifica IA para usar o modelo compartilhado.", "SIMPLIFICA_AI_UNAVAILABLE", error);
        }
    }

    @PluginMethod
    public void ensureModel(PluginCall call) {
        try {
            call.resolve(statusResult(callProvider("ensure_model", null)));
        } catch (Exception error) {
            call.reject("Não foi possível preparar o modelo compartilhado.", "SIMPLIFICA_AI_UNAVAILABLE", error);
        }
    }

    @PluginMethod
    public void interpret(PluginCall call) {
        final String text = call.getString("text", "").trim();
        final String operationalContext = call.getString("context", "{}").trim();
        if (text.isEmpty()) {
            call.reject("Informe o pedido para a IA Fácil.", "SIMPLIFICA_AI_EMPTY_TEXT");
            return;
        }
        executor.execute(() -> {
            try {
                String system = "Você é a IA Fácil do Simplifica 3D e conversa naturalmente em português. Responda somente JSON válido, sem markdown, neste formato: {\"type\":\"chat|navegar|estoque.consultar|caixa.consultar|producao.status|pedido.criar|pedido.status|estoque.entrada|caixa.lancar\",\"payload\":{}}. Para perguntas comuns use type chat e payload.answer com uma resposta útil. Para intenção operacional use apenas uma ação permitida e dados explícitos. Nunca execute, confirme gravação, invente valores ou escolha telas fora dessas ações.";
                Bundle extras = new Bundle();
                extras.putString("system", system);
                extras.putString("prompt", "Contexto operacional: " + operationalContext + "\nPedido: " + text);
                Bundle generated = callProvider("generate", extras);
                String result = generated.getString("response", "").trim();
                if (result.isEmpty()) throw new IllegalStateException("O Gemma 4 E2B não retornou texto.");
                JSObject response = new JSObject();
                response.put("text", result);
                response.put("backend", generated.getString("backend", "desconhecido"));
                call.resolve(response);
            } catch (Exception error) {
                call.reject("A IA compartilhada não conseguiu responder.", "SIMPLIFICA_AI_FAILED", error);
            }
        });
    }

    private Bundle callProvider(String method, Bundle extras) {
        Bundle result = getContext().getContentResolver().call(PROVIDER, method, null, extras);
        if (result == null) throw new IllegalStateException("O Simplifica IA não retornou dados.");
        return result;
    }

    private JSObject statusResult(Bundle status) {
        JSObject result = new JSObject();
        result.put("modelReady", status.getBoolean("modelReady"));
        result.put("compatible", status.getBoolean("compatible", true));
        result.put("incompatibilityReason", status.getString("incompatibilityReason", ""));
        result.put("modelBytes", status.getLong("modelBytes"));
        result.put("minimumBytes", status.getLong("minimumBytes"));
        result.put("downloading", status.getBoolean("downloading") || status.getBoolean("downloadQueued"));
        result.put("downloadedBytes", status.getLong("downloadedBytes"));
        result.put("totalBytes", status.getLong("totalBytes"));
        result.put("modelName", status.getString("modelName", "Gemma 4 E2B"));
        result.put("backendPolicy", status.getString("backendPolicy", "GPU_FIRST_CPU_FALLBACK"));
        return result;
    }
}
