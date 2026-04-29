package br.com.ne3d.erp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SimplificaFilesPlugin.class);
        registerPlugin(SimplificaBiometricPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
