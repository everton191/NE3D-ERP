package br.com.ne3d.erp.bridgevalidation;

import static org.junit.Assert.*;

import android.Manifest;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
import android.print.PrintJob;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import androidx.test.core.app.ActivityScenario;
import androidx.lifecycle.Lifecycle;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Tests only the disposable host. Native and canonical JS paths are real; inputs are synthetic. */
@RunWith(AndroidJUnit4.class)
public final class BridgeMediaDeviceTest {
    private static final String PACKAGE = "br.com.ne3d.erp.bridgevalidation";
    private static final String PREFIX = "simplifica-bridge-validation-";
    private static final String DIRECTORY = Environment.DIRECTORY_DOWNLOADS + "/Simplifica3D/";
    private final Map<Uri, String> created = new LinkedHashMap<>();
    private final Set<String> expectedNames = new LinkedHashSet<>();
    private final Set<String> printNames = new LinkedHashSet<>();
    private Context context;
    private ContentResolver resolver;
    private ActivityScenario<ValidationBridgeActivity> scenario;
    private ValidationBridgeActivity activity;

    @Before public void requireIsolationBeforeLaunchingFixture() throws Exception {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Context instrumentation = InstrumentationRegistry.getInstrumentation().getContext();
        assertEquals(PACKAGE, context.getPackageName());
        assertEquals(PACKAGE + ".test", instrumentation.getPackageName());
        assertNotEquals("br.com.ne3d.erp", context.getPackageName());
        assertTrue(Build.VERSION.SDK_INT >= 29);
        assertFalse(BuildConfig.AI_ENABLED);
        assertFalse(BuildConfig.SELF_UPDATE_ENABLED);
        assertFalse(BuildConfig.EXTERNAL_CHECKOUT_ENABLED);
        for (String packageName : new String[] { PACKAGE, PACKAGE + ".test" }) {
            for (String permission : new String[] { Manifest.permission.INTERNET,
                Manifest.permission.ACCESS_NETWORK_STATE, Manifest.permission.READ_CONTACTS,
                Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO }) {
                assertEquals(packageName + " must not hold " + permission, PackageManager.PERMISSION_DENIED,
                    context.getPackageManager().checkPermission(permission, packageName));
            }
        }
        PackageInfo info = context.getPackageManager().getPackageInfo(PACKAGE, PackageManager.GET_ACTIVITIES);
        assertNotNull(info.activities);
        assertEquals(1, info.activities.length);
        assertEquals(ValidationBridgeActivity.class.getName(), info.activities[0].name);
        assertFalse(info.activities[0].exported);
        assertNull(context.getPackageManager().getLaunchIntentForPackage(PACKAGE));
        enableWindowInventoryForThisTestConnection();
        assertNoPrintWindows();
        resolver = context.getContentResolver();
        scenario = ActivityScenario.launch(new Intent(context, ValidationBridgeActivity.class));
        scenario.onActivity(value -> activity = value);
        awaitReady();
    }

    @After public void removeOnlyOwnedFixturesAndCloseOwnHost() throws Exception {
        Throwable firstFailure = null;
        try {
            // Only jobs visible to this UID and bearing this test's UUID label
            // may be cancelled. Never send an action to an external window.
            cancelOnlyOurPrintJobs();
        } catch (Exception | AssertionError failure) { firstFailure = failure; }
        try {
            // If JS fails after a native save but before returning its URI, recover
            // only exact UUID names proven absent immediately before this test.
            discoverOnlyPlannedFixtureUris();
        } catch (Exception | AssertionError failure) {
            if (firstFailure == null) firstFailure = failure;
            else firstFailure.addSuppressed(failure);
        }
        for (Map.Entry<Uri, String> entry : new ArrayList<>(created.entrySet())) {
            try {
                if (!exists(entry.getKey())) continue;
                requireFixture(entry.getKey(), entry.getValue());
                assertEquals(1, resolver.delete(entry.getKey(), null, null));
                assertFalse(exists(entry.getKey()));
            } catch (Exception | AssertionError failure) {
                if (firstFailure == null) firstFailure = failure;
                else firstFailure.addSuppressed(failure);
            }
        }
        if (scenario != null) scenario.close();
        if (firstFailure instanceof Exception) throw (Exception) firstFailure;
        if (firstFailure instanceof AssertionError) throw (AssertionError) firstFailure;
    }

    @Test public void canonicalPdfCrossesRealBridgeAndPublishesReadableBytes() throws Exception {
        byte[] pdf = syntheticPdf();
        String name = name(".pdf");
        requireAbsent(name);
        JSONObject result = call("validation.saveCanonicalPdf(" + quote(name) + "," + quote(base64(pdf)) + ")");
        JSONObject nativeResult = result.getJSONObject("nativeResult");
        Uri uri = track(nativeResult, name);
        assertTrue(result.getBoolean("ok"));
        assertEquals(2, result.getJSONArray("events").length());
        assertArrayEquals(pdf, read(uri));
        assertPublished(uri, "application/pdf");
        try (ParcelFileDescriptor input = resolver.openFileDescriptor(uri, "r")) {
            assertNotNull(input);
            try (PdfRenderer renderer = new PdfRenderer(input)) { assertEquals(1, renderer.getPageCount()); }
        }
    }

    @Test public void jsonCrossesRealBridgeAndPreservesSyntheticContent() throws Exception {
        byte[] json = "{\"synthetic\":true,\"source\":\"real-js-bridge\"}".getBytes(StandardCharsets.UTF_8);
        String name = name(".json");
        requireAbsent(name);
        Uri uri = track(call("validation.saveJson(" + quote(name) + "," + quote(base64(json)) + ")"), name);
        assertArrayEquals(json, read(uri));
        assertPublished(uri, "application/json");
    }

    @Test public void invalidInputsRejectAcrossBridgeWithoutCreatingDownloads() throws Exception {
        for (String method : new String[] { "savePdf", "saveFile" }) {
            for (String invalid : new String[] { "", "A" }) {
                String name = name("savePdf".equals(method) ? ".pdf" : ".json");
                requireAbsent(name);
                JSONObject result = call("validation.rejectInvalid(" + quote(name) + ","
                    + quote(invalid) + "," + quote(method) + ")");
                assertTrue(result.getBoolean("rejected"));
                assertFalse(result.getString("message").isEmpty());
                requireAbsent(name);
            }
        }
    }

    @Test public void scopedStorageReturnsWithoutRuntimePermissionDialog() throws Exception {
        int pauses = activity.pauseCount;
        JSONObject result = call("validation.storage()");
        assertTrue(result.getBoolean("granted"));
        assertTrue(result.getBoolean("scoped"));
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        assertEquals(pauses, activity.pauseCount);
        assertEquals(PackageManager.PERMISSION_DENIED, context.getPackageManager()
            .checkPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE, PACKAGE));
    }

    @Test public void reloadKeepsOnlyLocalFixtureAndReinitializesBridge() throws Exception {
        int resumes = activity.resumeCount;
        scenario.onActivity(value -> value.getBridge().getWebView().evaluateJavascript(
            "window.validation=null", ignored -> value.getBridge().getWebView().reload()));
        awaitReady();
        JSONObject capabilities = object("validation.capabilities()");
        assertEquals("https://bridge-validation.local/", capabilities.getString("url"));
        assertEquals(0, capabilities.getInt("imageCount"));
        assertTrue(activity.resumeCount >= resumes);
    }

    @Test public void canonicalBrowserNavigationAndCashContractsRunInRealWebView() throws Exception {
        JSONObject result = call("runAndroidBehaviorContracts()");
        JSONObject navigation = result.getJSONObject("navigation");
        assertEquals(16, navigation.getInt("total"));
        assertEquals(16, navigation.getInt("passed"));
        assertEquals(0, navigation.getJSONArray("failures").length());
        JSONObject cash = result.getJSONObject("cash");
        assertTrue(cash.getBoolean("passed"));
        assertEquals(85, cash.getInt("assertions"));
        assertEquals("synthetic-context", result.getString("navigatorMode"));
        assertEquals("injected-fakes", result.getString("shareAndClipboardMode"));
    }

    @Test public void ownHostStopsAndResumesWithoutLosingTheLocalBridge() throws Exception {
        int pauses = activity.pauseCount;
        int resumes = activity.resumeCount;
        String token = UUID.randomUUID().toString();
        assertEquals(token, value("window.syntheticLifecycleToken=" + quote(token)));
        scenario.moveToState(Lifecycle.State.CREATED);
        assertTrue(activity.pauseCount > pauses);
        scenario.moveToState(Lifecycle.State.RESUMED);
        scenario.onActivity(value -> activity = value);
        awaitReady();
        assertTrue(activity.resumeCount > resumes);
        assertEquals(token, value("window.syntheticLifecycleToken"));
        JSONObject result = call("validation.storage()");
        assertTrue(result.getBoolean("granted"));
        assertTrue(result.getBoolean("scoped"));
    }

    @Test public void canonicalImageSelectionUsesRealWebViewDecodeCanvasAndFiles() throws Exception {
        JSONObject result = call("runAndroidImageValidation()");
        String controllerRunId = InstrumentationRegistry.getArguments().getString("validationRunId", "unassigned");
        Log.i("S3DImageValidation", "controllerRunId=" + controllerRunId + " " + result.toString());
        assertEquals(result.getJSONArray("failures").toString(), 0, result.getJSONArray("failures").length());
        assertEquals("programmatic-real-File-DataTransfer", result.getString("selectionMode"));
        assertEquals("not-opened", result.getString("pickerMode"));
        assertEquals("fixture-memory-only", result.getString("persistenceMode"));
        assertEquals(13, result.getInt("total"));
        assertEquals(13, result.getJSONArray("results").length());
        assertTrue(result.getBoolean("passed"));
        assertEquals(8, result.getInt("decodedOutputs"));
        assertTrue(result.getInt("assertions") >= 200);
    }

    @Test public void canonicalImageCorrectionsUseRealDecodeCanvasAndPendingReads() throws Exception {
        JSONObject result = call("runAndroidImageCorrectionsValidation()");
        String controllerRunId = InstrumentationRegistry.getArguments().getString("validationRunId", "unassigned");
        Log.i("S3DImageCorrections", "controllerRunId=" + controllerRunId + " " + result.toString());
        assertEquals("programmatic-real-File-DataTransfer", result.getString("selectionMode"));
        assertEquals("not-opened", result.getString("pickerMode"));
        assertEquals("fixture-memory-only", result.getString("persistenceMode"));
        assertEquals(8, result.getInt("total"));
        assertEquals(8, result.getJSONArray("results").length());
        assertEquals(result.getJSONArray("failures").toString(), 0, result.getJSONArray("failures").length());
        assertTrue(result.getBoolean("passed"));
        assertTrue(result.getInt("assertions") >= 40);
    }

    @Test public void printOpensSystemDialogThenCancelsOwnJobAndDestroysOnlyOwnHost() throws Exception {
        assertNoPrintWindows();
        String name = name(".pdf");
        assertTrue(printNames.add(name));
        assertFalse("A fresh UUID must not identify an already-active owned job", hasActiveOwnPrintJob(name));
        int pauses = activity.pauseCount;
        JSONObject result = call("validation.printCanonical(" + quote(name) + "," + quote(base64(syntheticPdf())) + ")");
        assertTrue(result.getBoolean("ok"));
        long deadline = SystemClock.uptimeMillis() + 10000;
        while (SystemClock.uptimeMillis() < deadline && (!isPrintWindow() || activity.pauseCount <= pauses || !hasActiveOwnPrintJob(name))) {
            SystemClock.sleep(100);
        }
        assertTrue("A system print window must open after the canonical native call", isPrintWindow());
        assertTrue("Print dialog must pause only the disposable host", activity.pauseCount > pauses);
        assertTrue("The new UUID job must be active in its owning UID", hasActiveOwnPrintJob(name));
        assertTrue("Only this test's own job may be cancelled", cancelOnlyOurPrintJobs());
        assertEquals(PACKAGE, activity.getPackageName());
        scenario.close();
        assertEquals(Lifecycle.State.DESTROYED, scenario.getState());
        assertTrue("Only the disposable host must be destroyed", activity.isDestroyed());
        scenario = null;
        deadline = SystemClock.uptimeMillis() + 10000;
        while (SystemClock.uptimeMillis() < deadline && hasActiveOwnPrintJob()) SystemClock.sleep(100);
        assertFalse("No synthetic print job may remain created, queued, started or blocked", hasActiveOwnPrintJob());
        // This is a separate contract from cancelling the system dialog and
        // resuming the same host. Its visual cleanup must not be inferred.
        Log.i("S3DBridgeValidation", "spoolerWindowAfterHostClose=" + isPrintWindow());
    }

    private boolean cancelOnlyOurPrintJobs() {
        if (context == null || printNames.isEmpty()) return false;
        PrintManager manager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
        if (manager == null) return false;
        boolean found = false;
        for (PrintJob job : manager.getPrintJobs()) {
            if (printNames.contains(String.valueOf(job.getInfo().getLabel()))) {
                found = true;
                if (!job.isCancelled() && !job.isCompleted() && !job.isFailed()) job.cancel();
            }
        }
        return found;
    }

    private boolean hasActiveOwnPrintJob() {
        PrintManager manager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
        if (manager == null) return false;
        for (PrintJob job : manager.getPrintJobs()) {
            if (printNames.contains(String.valueOf(job.getInfo().getLabel()))
                && !job.isCancelled() && !job.isCompleted() && !job.isFailed()) return true;
        }
        return false;
    }

    private boolean hasActiveOwnPrintJob(String exactName) {
        if (context == null || !printNames.contains(exactName)) return false;
        PrintManager manager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
        if (manager == null) return false;
        for (PrintJob job : manager.getPrintJobs()) {
            if (exactName.equals(String.valueOf(job.getInfo().getLabel()))
                && !job.isCancelled() && !job.isCompleted() && !job.isFailed()) return true;
        }
        return false;
    }

    private void enableWindowInventoryForThisTestConnection() {
        AccessibilityServiceInfo info = InstrumentationRegistry.getInstrumentation().getUiAutomation().getServiceInfo();
        assertNotNull("The test automation connection must expose its own configuration", info);
        info.flags |= AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        InstrumentationRegistry.getInstrumentation().getUiAutomation().setServiceInfo(info);
    }

    private void assertNoPrintWindows() {
        assertFalse("A pre-existing Android print window must never be touched", isPrintWindow());
        for (AccessibilityWindowInfo window : InstrumentationRegistry.getInstrumentation().getUiAutomation().getWindows()) {
            AccessibilityNodeInfo root = window.getRoot();
            try {
                assertFalse("An existing print window prevents isolated print validation",
                    root != null && "com.android.printspooler".equals(String.valueOf(root.getPackageName())));
            } finally {
                if (root != null) root.recycle();
                window.recycle();
            }
        }
    }

    private boolean isPrintWindow() {
        AccessibilityNodeInfo root = InstrumentationRegistry.getInstrumentation().getUiAutomation().getRootInActiveWindow();
        if (root == null) return false;
        try { return "com.android.printspooler".equals(String.valueOf(root.getPackageName())); }
        finally { root.recycle(); }
    }

    private void awaitReady() throws Exception {
        long deadline = SystemClock.uptimeMillis() + 12000;
        while (SystemClock.uptimeMillis() < deadline) {
            Object ready = value("Boolean(window.validation && validation.capabilities().ready)");
            if (Boolean.TRUE.equals(ready)) {
                assertEquals("https://bridge-validation.local/", object("validation.capabilities()").getString("url"));
                return;
            }
            SystemClock.sleep(100);
        }
        fail("Local validation WebView/Bridge did not become ready");
    }

    private JSONObject call(String expression) throws Exception {
        value("(window.validationResult=null,Promise.resolve().then(()=>" + expression
            + ").then(value=>{window.validationResult={value};},error=>{window.validationResult={error:String(error.stack||error)};}),true)");
        long deadline = SystemClock.uptimeMillis() + 12000;
        while (SystemClock.uptimeMillis() < deadline) {
            Object polled = value("window.validationResult || null");
            if (polled instanceof JSONObject) {
                JSONObject result = (JSONObject) polled;
                assertFalse(result.optString("error"), result.has("error"));
                return result.getJSONObject("value");
            }
            SystemClock.sleep(80);
        }
        throw new AssertionError("Synthetic Bridge call timed out");
    }

    private JSONObject object(String expression) throws Exception { return (JSONObject) value(expression); }
    private Object value(String expression) throws Exception {
        AtomicReference<String> response = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getBridge().getWebView()
            .evaluateJavascript("JSON.stringify(" + expression + ")", json -> { response.set(json); done.countDown(); }));
        assertTrue("Only our local WebView may respond", done.await(5, TimeUnit.SECONDS));
        Object encoded = new JSONTokener(response.get()).nextValue();
        if (encoded == JSONObject.NULL) return JSONObject.NULL;
        return new JSONTokener((String) encoded).nextValue();
    }

    private String name(String extension) { return PREFIX + UUID.randomUUID() + extension; }
    private String quote(String text) { return JSONObject.quote(text); }
    private String base64(byte[] bytes) { return Base64.encodeToString(bytes, Base64.NO_WRAP); }

    private byte[] syntheticPdf() throws Exception {
        PdfDocument document = new PdfDocument();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(200, 100, 1).create());
            page.getCanvas().drawText("SYNTHETIC TEST - DO NOT PRINT", 5, 40, new Paint());
            document.finishPage(page);
            document.writeTo(output);
            return output.toByteArray();
        } finally { document.close(); }
    }

    private Uri track(JSONObject result, String name) throws Exception {
        assertTrue(result.getBoolean("ok"));
        assertEquals(name, result.getString("fileName"));
        Uri uri = Uri.parse(result.getString("uri"));
        created.put(uri, name);
        requireFixture(uri, name);
        return uri;
    }

    private void requireAbsent(String name) throws Exception {
        assertTrue(name.matches(PREFIX + "[0-9a-f-]+\\.(pdf|json)"));
        try (Cursor cursor = resolver.query(MediaStore.Downloads.EXTERNAL_CONTENT_URI,
            new String[] { MediaStore.Downloads._ID }, MediaStore.Downloads.DISPLAY_NAME + "=?", new String[] { name }, null)) {
            assertNotNull(cursor);
            assertEquals(0, cursor.getCount());
        }
        expectedNames.add(name);
    }

    private void discoverOnlyPlannedFixtureUris() throws Exception {
        if (resolver == null) return;
        for (String name : expectedNames) {
            if (created.containsValue(name)) continue;
            try (Cursor cursor = resolver.query(MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                new String[] { MediaStore.Downloads._ID }, MediaStore.Downloads.DISPLAY_NAME + "=?",
                new String[] { name }, null)) {
                assertNotNull(cursor);
                assertTrue("One UUID must never identify multiple fixtures", cursor.getCount() <= 1);
                if (cursor.moveToFirst()) {
                    Uri uri = ContentUris.withAppendedId(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cursor.getLong(0));
                    created.put(uri, name);
                    requireFixture(uri, name);
                }
            }
        }
    }

    private boolean exists(Uri uri) throws Exception {
        try (Cursor cursor = resolver.query(uri, new String[] { MediaStore.Downloads._ID }, null, null, null)) {
            return cursor != null && cursor.moveToFirst();
        }
    }

    private void requireFixture(Uri uri, String name) throws Exception {
        assertEquals("content", uri.getScheme());
        assertEquals(MediaStore.AUTHORITY, uri.getAuthority());
        assertTrue(created.containsKey(uri));
        assertTrue(name.startsWith(PREFIX));
        try (Cursor cursor = resolver.query(uri, new String[] { MediaStore.Downloads.DISPLAY_NAME,
            MediaStore.Downloads.RELATIVE_PATH, MediaStore.MediaColumns.OWNER_PACKAGE_NAME }, null, null, null)) {
            assertNotNull(cursor);
            assertTrue(cursor.moveToFirst());
            assertEquals(name, cursor.getString(0));
            assertEquals(DIRECTORY, cursor.getString(1));
            assertEquals(PACKAGE, cursor.getString(2));
            assertFalse(cursor.moveToNext());
        }
    }

    private void assertPublished(Uri uri, String mime) throws Exception {
        requireFixture(uri, created.get(uri));
        try (Cursor cursor = resolver.query(uri, new String[] { MediaStore.Downloads.IS_PENDING,
            MediaStore.Downloads.MIME_TYPE }, null, null, null)) {
            assertNotNull(cursor);
            assertTrue(cursor.moveToFirst());
            assertEquals(0, cursor.getInt(0));
            assertEquals(mime, cursor.getString(1));
        }
    }

    private byte[] read(Uri uri) throws Exception {
        requireFixture(uri, created.get(uri));
        try (InputStream input = resolver.openInputStream(uri); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            assertNotNull(input);
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toByteArray();
        }
    }
}
