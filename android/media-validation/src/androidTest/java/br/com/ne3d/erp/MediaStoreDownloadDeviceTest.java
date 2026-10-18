package br.com.ne3d.erp;

import static org.junit.Assert.*;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.pdf.PdfDocument;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import br.com.ne3d.erp.validation.BuildConfig;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Real scoped-storage round trips in a separate, networkless package.
 * No ERP activity, session, contacts, model or pre-existing file is opened.
 * Provider faults below are deliberately injected around one newly-created URI.
 */
@RunWith(AndroidJUnit4.class)
public class MediaStoreDownloadDeviceTest {
    private static final String TARGET_PACKAGE = "br.com.ne3d.erp.validation";
    private static final String TEST_PACKAGE = TARGET_PACKAGE + ".test";
    private static final String DIRECTORY = Environment.DIRECTORY_DOWNLOADS + "/Simplifica3D/";
    private static final String FIXTURE_PREFIX = "simplifica-validation-";
    private static final byte[] JSON_BYTES = "{\"synthetic\":true,\"value\":42}".getBytes(StandardCharsets.UTF_8);

    private final Map<Uri, String> created = new LinkedHashMap<>();
    private Context context;
    private ContentResolver resolver;
    private ContextPlugin plugin;

    @Before
    public void requireIsolatedNetworklessTargetBeforeAnyWrite() throws Exception {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Context testContext = InstrumentationRegistry.getInstrumentation().getContext();
        assertEquals(TARGET_PACKAGE, context.getPackageName());
        assertEquals(TEST_PACKAGE, testContext.getPackageName());
        assertNotEquals("br.com.ne3d.erp", context.getPackageName());
        assertTrue("Scoped-storage test requires API 29+", Build.VERSION.SDK_INT >= 29);
        assertFalse(BuildConfig.AI_ENABLED);
        assertFalse(BuildConfig.SELF_UPDATE_ENABLED);
        assertFalse(BuildConfig.EXTERNAL_CHECKOUT_ENABLED);
        assertEquals(PackageManager.PERMISSION_DENIED,
            context.getPackageManager().checkPermission(Manifest.permission.INTERNET, TARGET_PACKAGE));
        assertEquals(PackageManager.PERMISSION_DENIED,
            context.getPackageManager().checkPermission(Manifest.permission.INTERNET, TEST_PACKAGE));
        PackageInfo target = context.getPackageManager().getPackageInfo(TARGET_PACKAGE, PackageManager.GET_ACTIVITIES);
        assertTrue("Validation target must have no Activity", target.activities == null || target.activities.length == 0);
        assertNull(context.getPackageManager().getLaunchIntentForPackage(TARGET_PACKAGE));
        resolver = context.getContentResolver();
        plugin = new ContextPlugin(context);
    }

    @After
    public void removeOnlyNewUrisWithConfirmedOwnerNameAndDirectory() throws Exception {
        Throwable firstFailure = null;
        for (Map.Entry<Uri, String> entry : new ArrayList<>(created.entrySet())) {
            try {
                if (!exists(entry.getKey())) continue;
                requireOwnedFixture(entry.getKey(), entry.getValue());
                assertEquals("Cleanup must remove exactly this fixture", 1,
                    resolver.delete(entry.getKey(), null, null));
                assertFalse(exists(entry.getKey()));
            } catch (Exception | AssertionError failure) {
                if (firstFailure == null) firstFailure = failure;
                else firstFailure.addSuppressed(failure);
            }
        }
        if (firstFailure instanceof Exception) throw (Exception) firstFailure;
        if (firstFailure instanceof AssertionError) throw (AssertionError) firstFailure;
    }

    @Test
    public void savePdfPublishesIdenticalReadablePdf() throws Exception {
        byte[] pdf = syntheticPdf();
        Uri uri = save("savePdf", fixtureName(".pdf"), "application/pdf", pdf);
        assertArrayEquals(pdf, read(uri));
        assertPublished(uri, "application/pdf");
        try (ParcelFileDescriptor input = resolver.openFileDescriptor(uri, "r")) {
            assertNotNull(input);
            try (PdfRenderer renderer = new PdfRenderer(input)) {
                assertEquals(1, renderer.getPageCount());
            }
        }
    }

    @Test
    public void saveFilePublishesIdenticalSyntheticJson() throws Exception {
        Uri uri = save("saveFile", fixtureName(".json"), "application/json", JSON_BYTES);
        assertArrayEquals(JSON_BYTES, read(uri));
        assertPublished(uri, "application/json");
    }

    @Test
    public void emptyPdfAndFileRejectWithoutCreatingEntry() throws Exception {
        assertRejectedWithoutEntry("savePdf", "");
        assertRejectedWithoutEntry("saveFile", "  ");
    }

    @Test
    public void invalidBase64RejectsWithoutCreatingEntry() throws Exception {
        assertRejectedWithoutEntry("savePdf", "A");
        assertRejectedWithoutEntry("saveFile", "A");
    }

    @Test
    public void fileNamesAreSanitizedWithoutEscapingSyntheticPrefix() throws Exception {
        String pdfBase = fixtureName("");
        Uri pdf = save("savePdf", pdfBase + " unsafe/name", "application/pdf", syntheticPdf(), pdfBase + "-unsafe-name.pdf");
        assertPublished(pdf, "application/pdf");
        String jsonBase = fixtureName("");
        Uri json = save("saveFile", jsonBase + " unsafe:name", "application/json", JSON_BYTES, jsonBase + "-unsafe-name.json");
        assertArrayEquals(JSON_BYTES, read(json));
    }

    @Test
    public void realPendingEntryClosesThenPublishesOneRow() throws Exception {
        RealEntry entry = newEntry();
        PendingDownloadWriter.write(JSON_BYTES, entry);
        assertTrue(entry.closed);
        assertTrue(entry.publishAfterClose);
        assertPublished(entry.uri, "application/json");
        assertArrayEquals(JSON_BYTES, read(entry.uri));
    }

    @Test
    public void injectedOpenFailureDiscardsOnlyTheNewRealEntry() throws Exception {
        RealEntry entry = newEntry();
        entry.failureStage = "open";
        assertSame(entry.injectedFailure, failureFor(entry));
        assertFalse(exists(entry.uri));
    }

    @Test
    public void injectedWriteFailureClosesAndDiscardsRealEntry() throws Exception {
        RealEntry entry = newEntry();
        entry.failureStage = "write";
        assertSame(entry.injectedFailure, failureFor(entry));
        assertTrue(entry.closed);
        assertFalse(exists(entry.uri));
    }

    @Test
    public void injectedCloseFailureDoesNotPublishAndDiscardsRealEntry() throws Exception {
        RealEntry entry = newEntry();
        entry.failureStage = "close";
        assertSame(entry.injectedFailure, failureFor(entry));
        assertFalse(entry.publishAfterClose);
        assertFalse(exists(entry.uri));
    }

    @Test
    public void injectedZeroPublicationCannotReportSuccess() throws Exception {
        RealEntry entry = newEntry();
        entry.failureStage = "zero-publish";
        Exception failure = failureFor(entry);
        assertTrue(failure instanceof IOException);
        assertEquals("Não foi possível concluir o arquivo em Downloads.", failure.getMessage());
        assertFalse(exists(entry.uri));
    }

    @Test
    public void injectedPublicationFailureDiscardsCompletedBytes() throws Exception {
        RealEntry entry = newEntry();
        entry.failureStage = "publish";
        assertSame(entry.injectedFailure, failureFor(entry));
        assertTrue(entry.closed);
        assertFalse(exists(entry.uri));
    }

    @Test
    public void successfulEntrySurvivesAnotherFailureAndNextSaveWorks() throws Exception {
        Uri previous = save("saveFile", fixtureName(".json"), "application/json", JSON_BYTES);
        RealEntry failed = newEntry();
        failed.failureStage = "write";
        assertSame(failed.injectedFailure, failureFor(failed));
        assertFalse(exists(failed.uri));
        Uri next = save("savePdf", fixtureName(".pdf"), "application/pdf", syntheticPdf());
        assertNotEquals(previous, next);
        assertPublished(previous, "application/json");
        assertArrayEquals(JSON_BYTES, read(previous));
        assertPublished(next, "application/pdf");
    }

    private String fixtureName(String extension) {
        return FIXTURE_PREFIX + UUID.randomUUID() + extension;
    }

    private byte[] syntheticPdf() throws Exception {
        PdfDocument document = new PdfDocument();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(200, 100, 1).create());
            page.getCanvas().drawText("SYNTHETIC VALIDATION ONLY", 10, 40, new android.graphics.Paint());
            document.finishPage(page);
            document.writeTo(output);
            return output.toByteArray();
        } finally {
            document.close();
        }
    }

    private Uri save(String method, String fileName, String mimeType, byte[] bytes) throws Exception {
        return save(method, fileName, mimeType, bytes, fileName);
    }

    private Uri save(String method, String fileName, String mimeType, byte[] bytes, String expectedName) throws Exception {
        assertNoEntryNamed(expectedName);
        CapturedCall call = call(method, fileName, mimeType, Base64.encodeToString(bytes, Base64.NO_WRAP));
        assertNull("Saving synthetic data must not reject", call.error);
        assertEquals(1, call.resolveCount);
        assertNotNull(call.result);
        assertTrue(call.result.getBoolean("ok"));
        Uri uri = Uri.parse(call.result.getString("uri"));
        created.put(uri, expectedName);
        requireOwnedFixture(uri, expectedName);
        assertEquals(expectedName, call.result.getString("fileName"));
        return uri;
    }

    private CapturedCall call(String method, String fileName, String mimeType, String base64) throws Exception {
        JSObject data = new JSObject();
        data.put("fileName", fileName);
        data.put("mimeType", mimeType);
        data.put("base64", base64);
        CapturedCall call = new CapturedCall(method, data);
        if ("savePdf".equals(method)) plugin.savePdf(call);
        else if ("saveFile".equals(method)) plugin.saveFile(call);
        else throw new AssertionError("Only isolated file save methods may be called");
        return call;
    }

    private void assertRejectedWithoutEntry(String method, String base64) throws Exception {
        String fileName = fixtureName("savePdf".equals(method) ? ".pdf" : ".json");
        assertNoEntryNamed(fileName);
        CapturedCall call = call(method, fileName, "application/json", base64);
        assertNotNull("Invalid input must reject", call.error);
        assertEquals(0, call.resolveCount);
        assertNull(call.result);
        assertNoEntryNamed(fileName);
    }

    private void assertNoEntryNamed(String name) throws Exception {
        assertTrue(name.startsWith(FIXTURE_PREFIX));
        try (Cursor cursor = resolver.query(MediaStore.Downloads.EXTERNAL_CONTENT_URI,
            new String[] { MediaStore.Downloads._ID }, MediaStore.Downloads.DISPLAY_NAME + "=?",
            new String[] { name }, null)) {
            assertNotNull(cursor);
            assertEquals("Fresh UUID fixture must not exist", 0, cursor.getCount());
        }
    }

    private boolean exists(Uri uri) throws Exception {
        try (Cursor cursor = resolver.query(uri, new String[] { MediaStore.Downloads._ID }, null, null, null)) {
            return cursor != null && cursor.moveToFirst();
        }
    }

    private void requireOwnedFixture(Uri uri, String expectedName) throws Exception {
        assertEquals("content", uri.getScheme());
        assertEquals(MediaStore.AUTHORITY, uri.getAuthority());
        assertTrue(expectedName.startsWith(FIXTURE_PREFIX));
        assertTrue("URI must have been created during this test", created.containsKey(uri));
        try (Cursor cursor = resolver.query(uri, new String[] {
            MediaStore.Downloads.DISPLAY_NAME,
            MediaStore.Downloads.RELATIVE_PATH,
            MediaStore.MediaColumns.OWNER_PACKAGE_NAME
        }, null, null, null)) {
            assertNotNull(cursor);
            assertTrue("Fixture URI must exist", cursor.moveToFirst());
            assertEquals(expectedName, cursor.getString(0));
            assertEquals(DIRECTORY, cursor.getString(1));
            assertEquals(TARGET_PACKAGE, cursor.getString(2));
            assertFalse(cursor.moveToNext());
        }
    }

    private void assertPublished(Uri uri, String mimeType) throws Exception {
        requireOwnedFixture(uri, created.get(uri));
        try (Cursor cursor = resolver.query(uri, new String[] {
            MediaStore.Downloads.IS_PENDING, MediaStore.Downloads.MIME_TYPE
        }, null, null, null)) {
            assertNotNull(cursor);
            assertTrue(cursor.moveToFirst());
            assertEquals(0, cursor.getInt(0));
            assertEquals(mimeType, cursor.getString(1));
        }
    }

    private byte[] read(Uri uri) throws Exception {
        requireOwnedFixture(uri, created.get(uri));
        try (InputStream input = resolver.openInputStream(uri); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            assertNotNull(input);
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toByteArray();
        }
    }

    private RealEntry newEntry() throws Exception {
        String name = fixtureName(".json");
        assertNoEntryNamed(name);
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, name);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
        values.put(MediaStore.Downloads.RELATIVE_PATH, DIRECTORY);
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        assertNotNull(uri);
        created.put(uri, name);
        requireOwnedFixture(uri, name);
        return new RealEntry(uri);
    }

    private Exception failureFor(RealEntry entry) throws Exception {
        try {
            PendingDownloadWriter.write(JSON_BYTES, entry);
        } catch (Exception failure) {
            return failure;
        }
        throw new AssertionError("An injected failure must never return success");
    }

    private final class RealEntry implements PendingDownloadWriter.Entry {
        final Uri uri;
        final IOException injectedFailure = new IOException("synthetic provider fault");
        String failureStage = "";
        boolean closed;
        boolean publishAfterClose;

        RealEntry(Uri uri) { this.uri = uri; }

        @Override
        public OutputStream open() throws Exception {
            requireOwnedFixture(uri, created.get(uri));
            if ("open".equals(failureStage)) throw injectedFailure;
            OutputStream actual = resolver.openOutputStream(uri);
            assertNotNull(actual);
            return new OutputStream() {
                @Override public void write(int value) throws IOException { actual.write(value); }
                @Override public void write(byte[] bytes) throws IOException {
                    actual.write(bytes);
                    if ("write".equals(failureStage)) throw injectedFailure;
                }
                @Override public void close() throws IOException {
                    actual.close();
                    closed = true;
                    if ("close".equals(failureStage)) throw injectedFailure;
                }
            };
        }

        @Override
        public int publish() throws Exception {
            requireOwnedFixture(uri, created.get(uri));
            publishAfterClose = closed;
            if ("publish".equals(failureStage)) throw injectedFailure;
            if ("zero-publish".equals(failureStage)) return 0;
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.IS_PENDING, 0);
            return resolver.update(uri, values, null, null);
        }

        @Override
        public void discard() throws Exception {
            requireOwnedFixture(uri, created.get(uri));
            if (resolver.delete(uri, null, null) != 1) throw new IOException("Synthetic fixture cleanup failed");
        }
    }

    private static final class ContextPlugin extends SimplificaFilesPlugin {
        private final Context isolatedContext;
        ContextPlugin(Context context) { isolatedContext = context; }
        @Override public Context getContext() { return isolatedContext; }
    }

    private static final class CapturedCall extends PluginCall {
        JSObject result;
        String error;
        int resolveCount;
        CapturedCall(String method, JSObject data) { super(null, "SimplificaFiles", "synthetic-validation", method, data); }
        @Override public void resolve(JSObject result) { this.result = result; resolveCount++; }
        @Override public void reject(String message, String code, Exception failure, JSObject data) { error = message; }
    }
}
