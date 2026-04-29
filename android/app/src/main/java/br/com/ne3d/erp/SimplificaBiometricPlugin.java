package br.com.ne3d.erp;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "SimplificaBiometric")
public class SimplificaBiometricPlugin extends Plugin {
    private static final int AUTHENTICATORS =
        BiometricManager.Authenticators.BIOMETRIC_WEAK |
        BiometricManager.Authenticators.DEVICE_CREDENTIAL;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        int status = BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);
        JSObject result = new JSObject();
        result.put("available", status == BiometricManager.BIOMETRIC_SUCCESS);
        result.put("code", availabilityCode(status));
        call.resolve(result);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        FragmentActivity activity = (FragmentActivity) getActivity();
        activity.runOnUiThread(() -> authenticateOnUiThread(call, activity));
    }

    private void authenticateOnUiThread(PluginCall call, FragmentActivity activity) {
        int status = BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);
        if (status != BiometricManager.BIOMETRIC_SUCCESS) {
            JSObject unavailable = new JSObject();
            unavailable.put("ok", false);
            unavailable.put("available", false);
            unavailable.put("code", availabilityCode(status));
            call.resolve(unavailable);
            return;
        }

        Executor executor = ContextCompat.getMainExecutor(getContext());
        BiometricPrompt prompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                JSObject response = new JSObject();
                response.put("ok", true);
                response.put("available", true);
                call.resolve(response);
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                JSObject response = new JSObject();
                response.put("ok", false);
                response.put("available", true);
                response.put("code", String.valueOf(errorCode));
                response.put("message", String.valueOf(errString));
                call.resolve(response);
            }

            @Override
            public void onAuthenticationFailed() {
                notifyListeners("biometricAttemptFailed", new JSObject());
            }
        });

        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
            .setTitle(call.getString("title", "Simplifica 3D"))
            .setSubtitle(call.getString("subtitle", "Confirme sua identidade para continuar."))
            .setAllowedAuthenticators(AUTHENTICATORS)
            .build();

        prompt.authenticate(info);
    }

    private String availabilityCode(int status) {
        if (status == BiometricManager.BIOMETRIC_SUCCESS) return "available";
        if (status == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) return "none_enrolled";
        if (status == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) return "no_hardware";
        if (status == BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE) return "hardware_unavailable";
        if (status == BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED) return "security_update_required";
        if (status == BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED) return "unsupported";
        return "unknown";
    }
}
