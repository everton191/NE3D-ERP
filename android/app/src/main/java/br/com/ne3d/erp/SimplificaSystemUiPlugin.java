package br.com.ne3d.erp;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SimplificaSystemUi")
public class SimplificaSystemUiPlugin extends Plugin {
    @PluginMethod
    public void setAppearance(PluginCall call) {
        String theme = call.getString("theme", "dark");
        boolean light = "light".equalsIgnoreCase(theme);
        if (!(getActivity() instanceof MainActivity)) {
            call.reject("Não foi possível ajustar a aparência do sistema.");
            return;
        }
        ((MainActivity) getActivity()).setSimplificaLightSystemBars(light);
        JSObject result = new JSObject();
        result.put("theme", light ? "light" : "dark");
        call.resolve(result);
    }
}
