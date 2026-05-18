package br.com.ne3d.erp;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SimplificaFilesPlugin.class);
        registerPlugin(SimplificaBiometricPlugin.class);
        super.onCreate(savedInstanceState);
        applySimplificaSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySimplificaSystemBars();
    }

    private void applySimplificaSystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#02080D"));
        window.setNavigationBarColor(Color.parseColor("#02080D"));
        window.getDecorView().setBackgroundColor(Color.parseColor("#02080D"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = window.getDecorView().getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                    0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                );
            }
        }
    }
}
