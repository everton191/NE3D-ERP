package br.com.ne3d.erp;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "SimplificaUpdate")
public class SimplificaUpdatePlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = value(call.getString("url"));
        int versionCode = call.getInt("versionCode", 0);
        if (!downloadUrl.startsWith("https://")) {
            call.reject("O endereço da atualização precisa usar HTTPS.");
            return;
        }
        int currentVersionCode = getCurrentVersionCode();
        if (versionCode > 0 && currentVersionCode > 0 && versionCode <= currentVersionCode) {
            JSObject result = new JSObject();
            result.put("upToDate", true);
            result.put("currentVersionCode", currentVersionCode);
            result.put("requestedVersionCode", versionCode);
            call.resolve(result);
            return;
        }

        File downloadsDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (downloadsDir == null) {
            call.reject("O armazenamento interno do aplicativo não está disponível.");
            return;
        }

        File apkFile = new File(downloadsDir, "Simplifica3D-update-" + Math.max(0, versionCode) + ".apk");
        if (apkFile.isFile() && apkFile.length() > 0) {
            requestInstall(apkFile, call);
            return;
        }

        executor.execute(() -> downloadApk(downloadUrl, apkFile, call));
    }

    private void downloadApk(String downloadUrl, File apkFile, PluginCall call) {
        File temporaryFile = new File(apkFile.getParentFile(), apkFile.getName() + ".part");
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(downloadUrl).openConnection();
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(60000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("Accept", "application/vnd.android.package-archive");
            connection.connect();
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                throw new IllegalStateException("Servidor respondeu HTTP " + status + ".");
            }

            try (InputStream input = connection.getInputStream();
                 FileOutputStream output = new FileOutputStream(temporaryFile, false)) {
                byte[] buffer = new byte[32768];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
                output.flush();
            }

            if (temporaryFile.length() <= 0 || (!temporaryFile.renameTo(apkFile) && !copyTemporaryFile(temporaryFile, apkFile))) {
                throw new IllegalStateException("O arquivo da atualização não pôde ser preparado.");
            }
            temporaryFile.delete();
            requestInstall(apkFile, call);
        } catch (Exception error) {
            temporaryFile.delete();
            call.reject("Não foi possível baixar a atualização dentro do aplicativo.", error);
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private boolean copyTemporaryFile(File source, File destination) {
        try (InputStream input = new java.io.FileInputStream(source);
             FileOutputStream output = new FileOutputStream(destination, false)) {
            byte[] buffer = new byte[32768];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            output.flush();
            return destination.length() > 0;
        } catch (Exception ignored) {
            destination.delete();
            return false;
        }
    }

    private void requestInstall(File apkFile, PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent permissionIntent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
                );
                getActivity().startActivity(permissionIntent);
                JSObject result = new JSObject();
                result.put("downloaded", true);
                result.put("permissionRequired", true);
                call.resolve(result);
                return;
            }

            Uri apkUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apkFile
            );
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(installIntent);

            JSObject result = new JSObject();
            result.put("downloaded", true);
            result.put("installerOpened", true);
            call.resolve(result);
        });
    }

    private String value(String input) {
        return input == null ? "" : input.trim();
    }

    private int getCurrentVersionCode() {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return (int) info.getLongVersionCode();
            }
            return info.versionCode;
        } catch (Exception ignored) {
            return 0;
        }
    }
}
