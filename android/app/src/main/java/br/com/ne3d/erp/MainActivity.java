package br.com.ne3d.erp;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private int lastStatusInsetTop = 0;
    private int lastNavigationInsetRight = 0;
    private int lastNavigationInsetBottom = 0;
    private int lastNavigationInsetLeft = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SimplificaFilesPlugin.class);
        registerPlugin(SimplificaBiometricPlugin.class);
        registerPlugin(SimplificaNotificationsPlugin.class);
        registerPlugin(SimplificaUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        applySimplificaSystemBars();
        setupSimplificaSystemInsets();
        setupAndroidBackDispatch();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySimplificaSystemBars();
        syncSystemInsetsToWebView();
    }

    private void setupAndroidBackDispatch() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchAndroidBackToWebView();
            }
        });
    }

    private void dispatchAndroidBackToWebView() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        webView.post(() -> webView.evaluateJavascript(
            "window.handleAndroidBackPress ? window.handleAndroidBackPress({ source: 'native-main-activity' }) : false;",
            null
        ));
    }

    private void applySimplificaSystemBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.setStatusBarColor(Color.parseColor("#FFFFFF"));
        window.setNavigationBarColor(Color.parseColor("#FFFFFF"));
        window.getDecorView().setBackgroundColor(Color.parseColor("#FFFFFF"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = window.getDecorView().getSystemUiVisibility();
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                );
            }
        }
    }

    private void setupSimplificaSystemInsets() {
        View decorView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (view, insets) -> {
            Insets navigationInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
            Insets statusInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars());
            lastStatusInsetTop = statusInsets.top;
            lastNavigationInsetRight = navigationInsets.right;
            lastNavigationInsetBottom = navigationInsets.bottom;
            lastNavigationInsetLeft = navigationInsets.left;
            syncSystemInsetsToWebView();
            return insets;
        });
        ViewCompat.requestApplyInsets(decorView);
    }

    private void syncSystemInsetsToWebView() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        final float density = Math.max(1f, getResources().getDisplayMetrics().density);
        final int top = Math.round(Math.max(0, lastStatusInsetTop) / density);
        final int right = Math.round(Math.max(0, lastNavigationInsetRight) / density);
        final int bottom = Math.round(Math.max(0, lastNavigationInsetBottom) / density);
        final int left = Math.round(Math.max(0, lastNavigationInsetLeft) / density);
        webView.post(() -> webView.evaluateJavascript(
            "(function(){"
                + "var root=document.documentElement;"
                + "if(!root){return false;}"
                + "root.style.setProperty('--android-system-top-inset','" + top + "px');"
                + "root.style.setProperty('--android-system-right-inset','" + right + "px');"
                + "root.style.setProperty('--android-system-bottom-inset','" + bottom + "px');"
                + "root.style.setProperty('--android-system-left-inset','" + left + "px');"
                + "if(document.body){document.body.classList.add('android-system-insets-ready');}"
                + "if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('simplifica-native-insets-change',{detail:{top:" + top + ",right:" + right + ",bottom:" + bottom + ",left:" + left + "}}));}"
                + "return true;"
                + "})();",
            null
        ));
    }
}
