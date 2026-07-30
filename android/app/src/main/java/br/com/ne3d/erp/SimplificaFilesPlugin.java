package br.com.ne3d.erp;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@CapacitorPlugin(
    name = "SimplificaFiles",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage"),
        @Permission(strings = { Manifest.permission.READ_CONTACTS }, alias = "contacts")
    }
)
public class SimplificaFilesPlugin extends Plugin {

    @PluginMethod
    public void requestStoragePermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("scoped", true);
            call.resolve(result);
            return;
        }

        if (getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storageCheckPermsCallback");
            return;
        }

        JSObject result = new JSObject();
        result.put("granted", true);
        result.put("scoped", false);
        call.resolve(result);
    }

    @PermissionCallback
    private void storageCheckPermsCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("storage") == PermissionState.GRANTED);
        result.put("scoped", false);
        call.resolve(result);
    }

    @PluginMethod
    public void savePdf(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermsCallback");
            return;
        }

        writePdf(call);
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermsCallback");
            return;
        }

        writeFile(call);
    }

    @PluginMethod
    public void printPdf(PluginCall call) {
        String base64 = call.getString("base64", "");
        if (base64 == null || base64.trim().isEmpty()) {
            call.reject("PDF vazio.");
            return;
        }
        final byte[] bytes;
        try {
            bytes = Base64.decode(base64.replaceAll("\\s", ""), Base64.DEFAULT);
        } catch (Exception error) {
            call.reject("PDF inválido para impressão.", error);
            return;
        }
        final String fileName = sanitizePdfFileName(call.getString("fileName", "pedido-simplifica-3d.pdf"));
        final String jobName = call.getString("jobName", call.getString("title", "Simplifica 3D"));
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("Impressão não disponível neste dispositivo.");
                    return;
                }
                PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                    .build();
                printManager.print(jobName, new PdfPrintDocumentAdapter(bytes, fileName), attributes);
                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("fileName", fileName);
                result.put("jobName", jobName);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Falha ao abrir impressão: " + error.getMessage(), error);
            }
        });
    }

    @PluginMethod
    public void searchPhoneContacts(PluginCall call) {
        if (getPermissionState("contacts") != PermissionState.GRANTED) {
            requestPermissionForAlias("contacts", call, "contactsPermsCallback");
            return;
        }
        searchPhoneContactsGranted(call);
    }

    @PermissionCallback
    private void contactsPermsCallback(PluginCall call) {
        if (getPermissionState("contacts") != PermissionState.GRANTED) {
            call.reject("Permissão de contatos negada.");
            return;
        }
        searchPhoneContactsGranted(call);
    }

    private void searchPhoneContactsGranted(PluginCall call) {
        try {
            String query = call.getString("query", "");
            int limit = Math.max(1, Math.min(call.getData().optInt("limit", 8), 12));
            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("granted", true);
            result.put("contacts", queryPhoneContacts(query, limit));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível buscar os contatos.", error);
        }
    }

    @PermissionCallback
    private void storagePermsCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            String fileName = call.getString("fileName", "");
            if (fileName.toLowerCase().endsWith(".pdf")) {
                writePdf(call);
            } else {
                writeFile(call);
            }
        } else {
            call.reject("Permissão de armazenamento negada.");
        }
    }

    private void writePdf(PluginCall call) {
        writeBase64ToDownloads(call, "application/pdf", sanitizePdfFileName(call.getString("fileName", "pedido-simplifica-3d.pdf")), "PDF");
    }

    private void writeFile(PluginCall call) {
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String fileName = sanitizeGenericFileName(call.getString("fileName", "arquivo-simplifica-3d.json"));
        writeBase64ToDownloads(call, mimeType, fileName, "arquivo");
    }

    private void writeBase64ToDownloads(PluginCall call, String mimeType, String fileName, String label) {
        String base64 = call.getString("base64", "");

        if (base64 == null || base64.trim().isEmpty()) {
            call.reject(label + " vazio.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64.replaceAll("\\s", ""), Base64.DEFAULT);
            Uri uri;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Simplifica3D");
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Não foi possível criar o arquivo em Downloads.");
                    return;
                }

                try (OutputStream output = resolver.openOutputStream(uri)) {
                    if (output == null) {
                        call.reject("Não foi possível abrir o arquivo em Downloads.");
                        return;
                    }
                    output.write(bytes);
                }

                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Simplifica3D");
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Não foi possível criar a pasta Downloads/Simplifica3D.");
                    return;
                }

                File file = new File(dir, fileName);
                try (FileOutputStream output = new FileOutputStream(file)) {
                    output.write(bytes);
                }
                uri = Uri.fromFile(file);
            }

            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("fileName", fileName);
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Falha ao salvar " + label + ": " + error.getMessage(), error);
        }
    }

    private JSArray queryPhoneContacts(String query, int limit) {
        JSArray results = new JSArray();
        Map<String, JSObject> byContact = new LinkedHashMap<>();
        Map<String, JSArray> phonesByContact = new LinkedHashMap<>();
        String normalizedQuery = normalizeContactText(query);
        String queryPhone = normalizeContactPhone(query);
        String[] projection = {
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        };
        try (Cursor cursor = getContext().getContentResolver().query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            projection,
            null,
            null,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        )) {
            if (cursor == null) return results;
            int idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
            int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
            int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
            while (cursor.moveToNext() && byContact.size() < limit) {
                String contactId = idIndex >= 0 ? cursor.getString(idIndex) : "";
                String name = nameIndex >= 0 ? cursor.getString(nameIndex) : "";
                String number = numberIndex >= 0 ? cursor.getString(numberIndex) : "";
                String normalizedName = normalizeContactText(name);
                String normalizedPhone = normalizeContactPhone(number);
                boolean listAll = normalizedQuery.isEmpty() && queryPhone.isEmpty();
                boolean matchesName = !normalizedQuery.isEmpty() && normalizedName.contains(normalizedQuery);
                boolean matchesPhone = queryPhone.length() >= 2 && normalizedPhone.contains(queryPhone);
                if (!listAll && !matchesName && !matchesPhone) continue;

                String key = contactId == null || contactId.isEmpty() ? normalizedName + "|" + normalizedPhone : contactId;
                JSObject item = byContact.get(key);
                if (item == null) {
                    JSArray phones = new JSArray();
                    item = new JSObject();
                    item.put("id", key);
                    item.put("name", name == null ? "" : name.trim());
                    item.put("source", "phone_contact");
                    item.put("phones", phones);
                    item.put("emails", queryEmailsForContact(contactId));
                    byContact.put(key, item);
                    phonesByContact.put(key, phones);
                }
                JSArray phones = phonesByContact.get(key);
                if (phones == null) phones = new JSArray();
                if (!normalizedPhone.isEmpty() && !arrayContainsString(phones, normalizedPhone)) phones.put(normalizedPhone);
                if (!item.has("phone")) item.put("phone", normalizedPhone);
            }
        } catch (SecurityException ignored) {
            return results;
        }
        for (JSObject item : byContact.values()) results.put(item);
        return results;
    }

    private JSArray queryEmailsForContact(String contactId) {
        JSArray emails = new JSArray();
        if (contactId == null || contactId.trim().isEmpty()) return emails;
        String[] projection = { ContactsContract.CommonDataKinds.Email.ADDRESS };
        try (Cursor cursor = getContext().getContentResolver().query(
            ContactsContract.CommonDataKinds.Email.CONTENT_URI,
            projection,
            ContactsContract.CommonDataKinds.Email.CONTACT_ID + "=?",
            new String[] { contactId },
            null
        )) {
            if (cursor == null) return emails;
            int emailIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.ADDRESS);
            while (cursor.moveToNext()) {
                String email = emailIndex >= 0 ? cursor.getString(emailIndex) : "";
                if (email != null && !email.trim().isEmpty() && !arrayContainsString(emails, email.trim())) {
                    emails.put(email.trim());
                }
            }
        } catch (Exception ignored) {
            // E-mail é opcional para a sugestão de clientes.
        }
        return emails;
    }

    private boolean arrayContainsString(JSArray array, String value) {
        if (array == null || value == null) return false;
        for (int i = 0; i < array.length(); i++) {
            if (value.equalsIgnoreCase(array.optString(i, ""))) return true;
        }
        return false;
    }

    private String normalizeContactText(String value) {
        String text = value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
        text = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return text.replaceAll("\\s+", " ");
    }

    private String normalizeContactPhone(String value) {
        return value == null ? "" : value.replaceAll("\\D+", "");
    }

    private static class PdfPrintDocumentAdapter extends PrintDocumentAdapter {
        private final byte[] bytes;
        private final String fileName;

        PdfPrintDocumentAdapter(byte[] bytes, String fileName) {
            this.bytes = bytes;
            this.fileName = fileName;
        }

        @Override
        public void onLayout(
            PrintAttributes oldAttributes,
            PrintAttributes newAttributes,
            CancellationSignal cancellationSignal,
            LayoutResultCallback callback,
            Bundle extras
        ) {
            if (cancellationSignal.isCanceled()) {
                callback.onLayoutCancelled();
                return;
            }
            PrintDocumentInfo info = new PrintDocumentInfo.Builder(fileName)
                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                .build();
            callback.onLayoutFinished(info, true);
        }

        @Override
        public void onWrite(
            PageRange[] pages,
            ParcelFileDescriptor destination,
            CancellationSignal cancellationSignal,
            WriteResultCallback callback
        ) {
            if (cancellationSignal.isCanceled()) {
                callback.onWriteCancelled();
                return;
            }
            try (FileOutputStream output = new FileOutputStream(destination.getFileDescriptor())) {
                output.write(bytes);
                callback.onWriteFinished(new PageRange[] { PageRange.ALL_PAGES });
            } catch (IOException error) {
                callback.onWriteFailed(error.getMessage());
            }
        }
    }

    private String sanitizePdfFileName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty()) name = "pedido-simplifica-3d.pdf";
        name = name.replaceAll("[\\\\/:*?\"<>|]+", "-").replaceAll("\\s+", "-").toLowerCase();
        if (!name.endsWith(".pdf")) name += ".pdf";
        return name;
    }

    private String sanitizeGenericFileName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty()) name = "arquivo-simplifica-3d.json";
        name = name.replaceAll("[\\\\/:*?\"<>|]+", "-").replaceAll("\\s+", "-").toLowerCase();
        if (!name.contains(".")) name += ".json";
        return name;
    }
}
