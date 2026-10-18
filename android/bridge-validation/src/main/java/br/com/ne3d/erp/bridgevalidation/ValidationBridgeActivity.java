package br.com.ne3d.erp.bridgevalidation;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import br.com.ne3d.erp.SimplificaFilesPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;

/** A disposable local-only host, deliberately not derived from ERP MainActivity. */
public final class ValidationBridgeActivity extends BridgeActivity {
    public volatile int pauseCount;
    public volatile int resumeCount;

    @Override
    protected void onCreate(Bundle state) {
        if (!"br.com.ne3d.erp.bridgevalidation".equals(getPackageName())
            || BuildConfig.AI_ENABLED || BuildConfig.SELF_UPDATE_ENABLED || BuildConfig.EXTERNAL_CHECKOUT_ENABLED
            || getPackageManager().checkPermission(Manifest.permission.INTERNET, getPackageName()) != PackageManager.PERMISSION_DENIED
            || getPackageManager().checkPermission(Manifest.permission.READ_CONTACTS, getPackageName()) != PackageManager.PERMISSION_DENIED) {
            throw new SecurityException("Not an isolated networkless validation package");
        }
        config = new CapConfig.Builder(this)
            .setHostname("bridge-validation.local")
            .setAndroidScheme("https")
            .setAllowNavigation(new String[0])
            .setWebContentsDebuggingEnabled(false)
            .setLoggingEnabled(false)
            .create();
        registerPlugin(SimplificaFilesPlugin.class);
        super.onCreate(state);
    }

    @Override public void onPause() { pauseCount++; super.onPause(); }
    @Override public void onResume() { super.onResume(); resumeCount++; }
}
