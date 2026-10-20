package br.com.ne3d.erp.bridgevalidation;

import static org.junit.Assert.*;

import android.Manifest;
import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.UiAutomation;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Real system picker cancellation only. Never reads or selects an external file. */
@RunWith(AndroidJUnit4.class)
public final class RealPickerCancelDeviceTest {
    private static final String PACKAGE = "br.com.ne3d.erp.bridgevalidation";
    private static final Set<String> SYSTEM_PICKERS = new HashSet<>(Arrays.asList(
        "com.google.android.documentsui", "com.android.documentsui",
        "com.google.android.photopicker", "com.android.photopicker",
        "com.google.android.providers.media.module", "com.android.providers.media.module"));
    private ActivityScenario<ValidationBridgeActivity> scenario;
    private ValidationBridgeActivity activity;
    private WebChromeClient original;
    private UiAutomation automation;

    @After public void restoreClientAndCloseOnlyOwnHost() {
        if (activity != null && original != null && !activity.isDestroyed()) {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                activity.getBridge().getWebView().setWebChromeClient(original));
        }
        // No external UI action on failure. If ownership cannot be proven,
        // leave the external window alone instead of sending a speculative Back.
        if (scenario != null) scenario.close();
    }

    @Test public void realPickerCancellationReturnsNullAndResumesSameWebView() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals(PACKAGE, context.getPackageName());
        assertEquals(PACKAGE + ".test", InstrumentationRegistry.getInstrumentation().getContext().getPackageName());
        assertFalse(BuildConfig.AI_ENABLED);
        assertFalse(BuildConfig.SELF_UPDATE_ENABLED);
        assertFalse(BuildConfig.EXTERNAL_CHECKOUT_ENABLED);
        PackageManager manager = context.getPackageManager();
        for (String id : new String[] { PACKAGE, PACKAGE + ".test" }) {
            for (String permission : new String[] { Manifest.permission.INTERNET,
                Manifest.permission.ACCESS_NETWORK_STATE, Manifest.permission.READ_CONTACTS,
                Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.READ_MEDIA_IMAGES }) {
                assertEquals(PackageManager.PERMISSION_DENIED, manager.checkPermission(permission, id));
            }
        }
        assertNull(manager.getLaunchIntentForPackage(PACKAGE));
        automation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
        AccessibilityServiceInfo info = automation.getServiceInfo();
        assertNotNull(info);
        info.flags |= AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        automation.setServiceInfo(info);
        for (AccessibilityWindowInfo window : automation.getWindows()) {
            AccessibilityNodeInfo root = window.getRoot();
            try {
                String id = root == null ? "" : String.valueOf(root.getPackageName());
                assertFalse("Never touch a pre-existing system picker", SYSTEM_PICKERS.contains(id));
                assertNotEquals("com.android.printspooler", id);
            } finally {
                if (root != null) root.recycle();
                window.recycle();
            }
        }
        scenario = ActivityScenario.launch(new Intent(context, ValidationBridgeActivity.class));
        scenario.onActivity(value -> activity = value);
        awaitReady();
        int hostWindow = awaitActiveWindow(PACKAGE);
        ValidationBridgeActivity sameHost = activity;
        int pauses = activity.pauseCount;
        int resumes = activity.resumeCount;
        String token = UUID.randomUUID().toString();
        assertEquals(token, value("window.pickerValidationToken=" + JSONObject.quote(token)));
        assertEquals(0, ((JSONObject) value("validation.capabilities()")).getInt("imageCount"));

        AtomicReference<Throwable> failure = new AtomicReference<>();
        AtomicReference<String> pickerPackage = new AtomicReference<>();
        AtomicReference<String> pickerComponent = new AtomicReference<>();
        AtomicReference<String> requestType = new AtomicReference<>();
        AtomicInteger requests = new AtomicInteger();
        AtomicInteger callbacks = new AtomicInteger();
        AtomicReference<Uri[]> returned = new AtomicReference<>();
        CountDownLatch shown = new CountDownLatch(1);
        CountDownLatch cancelled = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            WebView view = activity.getBridge().getWebView();
            original = view.getWebChromeClient();
            assertTrue("Observe the already-registered Capacitor client, never substitute its implementation",
                original instanceof BridgeWebChromeClient);
            view.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onShowFileChooser(WebView source, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                    try {
                        assertEquals(1, requests.incrementAndGet());
                        assertEquals(FileChooserParams.MODE_OPEN, params.getMode());
                        assertFalse(params.isCaptureEnabled());
                        assertEquals(new HashSet<>(Arrays.asList("image/jpeg", "image/png", "image/webp")),
                            new HashSet<>(Arrays.asList(params.getAcceptTypes())));
                        Intent intent = params.createIntent();
                        assertEquals(Intent.ACTION_GET_CONTENT, intent.getAction());
                        assertTrue(intent.hasCategory(Intent.CATEGORY_OPENABLE));
                        assertNull(intent.getData());
                        ResolveInfo resolved = manager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
                        assertNotNull("Only a known system selector may be launched", resolved);
                        String id = resolved.activityInfo.packageName;
                        assertTrue("Unexpected resolver; do not launch it", SYSTEM_PICKERS.contains(id));
                        assertTrue((resolved.activityInfo.applicationInfo.flags
                            & (ApplicationInfo.FLAG_SYSTEM | ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) != 0);
                        pickerPackage.set(id);
                        pickerComponent.set(id + "/" + resolved.activityInfo.name);
                        requestType.set(intent.getType());
                        // The original Capacitor launcher and parseResult execute unchanged.
                        boolean handled = original.onShowFileChooser(source, uris -> {
                            callbacks.incrementAndGet();
                            returned.set(uris);
                            callback.onReceiveValue(uris);
                            cancelled.countDown();
                        }, params);
                        assertTrue(handled);
                    } catch (Throwable error) {
                        failure.set(error);
                        callback.onReceiveValue(null);
                    } finally { shown.countDown(); }
                    return true;
                }
            });
        });
        tapOnlyOwnFileInput();
        assertTrue("The real input must invoke the native chooser", shown.await(5, TimeUnit.SECONDS));
        if (failure.get() != null) throw new AssertionError("Chooser preflight/delegation failed", failure.get());
        assertNotNull(pickerPackage.get());
        int pickerWindow = awaitActiveWindow(pickerPackage.get());
        assertNotEquals(hostWindow, pickerWindow);
        assertTrue("The external selector must pause our host", activity.pauseCount > pauses);
        assertEquals(0, callbacks.get());

        // One Back only, with a fresh package + window-ID guard immediately
        // before acting. Never inspect children, file names, texts or thumbnails.
        requireExactActiveWindow(pickerPackage.get(), pickerWindow);
        assertEquals(0, callbacks.get());
        assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK));

        assertTrue("Real Capacitor callback must arrive after system cancellation", cancelled.await(8, TimeUnit.SECONDS));
        assertEquals(1, requests.get());
        assertEquals(1, callbacks.get());
        assertNull("Cancellation must not grant any file URI", returned.get());
        awaitActiveWindow(PACKAGE);
        scenario.onActivity(value -> assertSame(sameHost, value));
        assertTrue(activity.resumeCount > resumes);
        awaitReady();
        assertEquals(token, value("window.pickerValidationToken"));
        assertEquals(0, ((JSONObject) value("validation.capabilities()")).getInt("imageCount"));
        value("(window.pickerStorageResult=null,validation.storage().then(result=>window.pickerStorageResult=result),true)");
        long deadline = SystemClock.uptimeMillis() + 5000;
        Object storage;
        do {
            storage = value("window.pickerStorageResult");
            if (storage instanceof JSONObject) break;
            SystemClock.sleep(80);
        } while (SystemClock.uptimeMillis() < deadline);
        assertTrue("Real native bridge must still respond after cancellation", storage instanceof JSONObject);
        assertTrue(((JSONObject) storage).getBoolean("granted"));
        assertTrue(((JSONObject) storage).getBoolean("scoped"));
        JSONObject evidence = new JSONObject().put("run", token)
            .put("controllerRunId", InstrumentationRegistry.getArguments().getString("validationRunId", "unassigned"))
            .put("picker", pickerComponent.get())
            .put("action", Intent.ACTION_GET_CONTENT).put("type", requestType.get())
            .put("requests", requests.get()).put("callbacks", callbacks.get()).put("returnedUri", false)
            .put("sameHost", true).put("bridgeResponsive", true).put("selection", "none");
        Log.i("S3DRealPicker", evidence.toString());
    }

    private int awaitActiveWindow(String expectedPackage) {
        long deadline = SystemClock.uptimeMillis() + 8000;
        do {
            AccessibilityNodeInfo root = automation.getRootInActiveWindow();
            try {
                if (root != null && expectedPackage.equals(String.valueOf(root.getPackageName()))) return root.getWindowId();
            } finally { if (root != null) root.recycle(); }
            SystemClock.sleep(80);
        } while (SystemClock.uptimeMillis() < deadline);
        throw new AssertionError("Expected isolated host/system-picker window did not become active: " + expectedPackage);
    }

    private void tapOnlyOwnFileInput() throws Exception {
        awaitActiveWindow(PACKAGE);
        JSONObject bounds = (JSONObject) value("(()=>{const r=document.getElementById('fixtureImage').getBoundingClientRect();"
            + "return {x:r.x+r.width/2,y:r.y+r.height/2,width:innerWidth,height:innerHeight};})()");
        double x = bounds.getDouble("x") / bounds.getDouble("width");
        double y = bounds.getDouble("y") / bounds.getDouble("height");
        assertTrue(x > 0 && x < 1 && y > 0 && y < 1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            WebView view = activity.getBridge().getWebView();
            assertEquals(PACKAGE, view.getContext().getPackageName());
            assertTrue(view.hasWindowFocus());
            float localX = (float) (x * view.getWidth());
            float localY = (float) (y * view.getHeight());
            long now = SystemClock.uptimeMillis();
            MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, localX, localY, 0);
            MotionEvent up = MotionEvent.obtain(now, now + 1, MotionEvent.ACTION_UP, localX, localY, 0);
            try {
                // Target this WebView directly, never inject a screen/global tap.
                assertTrue(view.dispatchTouchEvent(down));
                assertTrue(view.dispatchTouchEvent(up));
            } finally { down.recycle(); up.recycle(); }
        });
    }

    private void requireExactActiveWindow(String expectedPackage, int expectedWindow) {
        assertTrue(SYSTEM_PICKERS.contains(expectedPackage));
        AccessibilityNodeInfo root = automation.getRootInActiveWindow();
        assertNotNull("Abort without UI action if the picker lost focus", root);
        try {
            assertEquals(expectedPackage, String.valueOf(root.getPackageName()));
            assertEquals(expectedWindow, root.getWindowId());
        } finally { root.recycle(); }
    }

    private void awaitReady() throws Exception {
        long deadline = SystemClock.uptimeMillis() + 12000;
        do {
            if (Boolean.TRUE.equals(value("Boolean(window.validation && validation.capabilities().ready)"))) {
                assertEquals("https://bridge-validation.local/", ((JSONObject) value("validation.capabilities()")).getString("url"));
                return;
            }
            SystemClock.sleep(80);
        } while (SystemClock.uptimeMillis() < deadline);
        fail("Isolated WebView did not become ready");
    }

    private Object value(String expression) throws Exception {
        AtomicReference<String> response = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getBridge().getWebView()
            .evaluateJavascript("JSON.stringify(" + expression + ")", json -> { response.set(json); done.countDown(); }));
        assertTrue(done.await(5, TimeUnit.SECONDS));
        Object encoded = new JSONTokener(response.get()).nextValue();
        return encoded == JSONObject.NULL ? JSONObject.NULL : new JSONTokener((String) encoded).nextValue();
    }
}
