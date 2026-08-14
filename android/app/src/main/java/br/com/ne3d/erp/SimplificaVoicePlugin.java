package br.com.ne3d.erp;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
    name = "SimplificaVoice",
    permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") }
)
public class SimplificaVoicePlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private TextToSpeech textToSpeech;
    private boolean speechReady = false;

    @Override
    public void load() {
        super.load();
        getActivity().runOnUiThread(() -> textToSpeech = new TextToSpeech(getContext(), status -> {
            speechReady = status == TextToSpeech.SUCCESS;
            if (speechReady) textToSpeech.setLanguage(new Locale("pt", "BR"));
        }));
    }

    @PluginMethod
    public void availability(PluginCall call) {
        JSObject result = new JSObject();
        result.put("listening", SpeechRecognizer.isRecognitionAvailable(getContext()));
        result.put("speaking", speechReady);
        call.resolve(result);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
            return;
        }
        startListening(call);
    }

    @PermissionCallback
    private void microphonePermissionCallback(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Permita o uso do microfone para falar com a assistente.", "MICROPHONE_DENIED");
            return;
        }
        startListening(call);
    }

    private void startListening(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("O reconhecimento de voz não está disponível neste aparelho.", "VOICE_UNAVAILABLE");
            return;
        }
        getActivity().runOnUiThread(() -> {
            stopRecognizer();
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) { }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float rmsdB) { }
                @Override public void onBufferReceived(byte[] buffer) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onPartialResults(Bundle partialResults) { }
                @Override public void onEvent(int eventType, Bundle params) { }
                @Override public void onError(int error) {
                    stopRecognizer();
                    call.reject(error == SpeechRecognizer.ERROR_NO_MATCH
                        ? "Não entendi. Toque no microfone e tente novamente."
                        : "Não consegui ouvir agora. Tente novamente.", "VOICE_RECOGNITION_FAILED");
                }
                @Override public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    String text = matches != null && !matches.isEmpty() ? matches.get(0).trim() : "";
                    stopRecognizer();
                    if (text.isEmpty()) {
                        call.reject("Não entendi. Toque no microfone e tente novamente.", "VOICE_EMPTY");
                        return;
                    }
                    JSObject response = new JSObject();
                    response.put("text", text);
                    call.resolve(response);
                }
            });
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Fale com a IA Fácil");
            recognizer.startListening(intent);
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "").trim();
        if (text.isEmpty()) {
            call.reject("Não há resposta para ler.", "VOICE_EMPTY_TEXT");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (!speechReady || textToSpeech == null) {
                call.reject("A leitura em voz alta ainda está sendo preparada.", "VOICE_NOT_READY");
                return;
            }
            textToSpeech.stop();
            int result = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "simplifica-ai-response");
            if (result == TextToSpeech.ERROR) {
                call.reject("Não consegui ler a resposta agora.", "VOICE_SPEAK_FAILED");
                return;
            }
            JSObject response = new JSObject();
            response.put("ok", true);
            call.resolve(response);
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            stopRecognizer();
            if (textToSpeech != null) textToSpeech.stop();
            JSObject response = new JSObject();
            response.put("ok", true);
            call.resolve(response);
        });
    }

    private void stopRecognizer() {
        if (recognizer == null) return;
        try { recognizer.cancel(); } catch (Exception ignored) { }
        recognizer.destroy();
        recognizer = null;
    }
}
