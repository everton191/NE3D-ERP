package br.com.ne3d.erp;

import static org.junit.Assert.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class PendingDownloadWriterTest {
    private static final byte[] CONTENT = { 37, 80, 68, 70, 10 };

    @Test
    public void successClosesBeforePublishingAndDoesNotDiscard() throws Exception {
        FakeEntry entry = new FakeEntry();
        PendingDownloadWriter.write(CONTENT, entry);
        assertArrayEquals(CONTENT, entry.bytes.toByteArray());
        assertEquals(Arrays.asList("open", "write", "close", "publish"), entry.events);
        assertFalse(entry.discarded);
    }

    @Test
    public void nullOutputDiscardsPendingEntryAndPreservesOpeningMessage() {
        FakeEntry entry = new FakeEntry();
        entry.nullOutput = true;
        Exception failure = failureFor(entry);
        assertTrue(failure instanceof PendingDownloadWriter.OpenFailedException);
        assertEquals("Não foi possível abrir o arquivo em Downloads.", failure.getMessage());
        assertEquals(Arrays.asList("open", "discard"), entry.events);
    }

    @Test
    public void openFailureDiscardsPendingEntry() {
        FakeEntry entry = new FakeEntry();
        entry.openFailure = new IOException("open failed");
        assertSame(entry.openFailure, failureFor(entry));
        assertEquals(Arrays.asList("open", "discard"), entry.events);
    }

    @Test
    public void writeFailureClosesThenDiscardsWithoutPublishing() {
        FakeEntry entry = new FakeEntry();
        entry.writeFailure = new IOException("write failed");
        assertSame(entry.writeFailure, failureFor(entry));
        assertEquals(Arrays.asList("open", "write", "close", "discard"), entry.events);
    }

    @Test
    public void closeFailureDiscardsWithoutPublishing() {
        FakeEntry entry = new FakeEntry();
        entry.closeFailure = new IOException("close failed");
        assertSame(entry.closeFailure, failureFor(entry));
        assertEquals(Arrays.asList("open", "write", "close", "discard"), entry.events);
    }

    @Test
    public void publicationFailureDiscardsPendingEntry() {
        FakeEntry entry = new FakeEntry();
        entry.publishFailure = new SecurityException("publication denied");
        assertSame(entry.publishFailure, failureFor(entry));
        assertEquals(Arrays.asList("open", "write", "close", "publish", "discard"), entry.events);
    }

    @Test
    public void zeroUpdatedRowsCannotReportSuccess() {
        FakeEntry entry = new FakeEntry();
        entry.updatedRows = 0;
        Exception failure = failureFor(entry);
        assertTrue(failure instanceof IOException);
        assertEquals("Não foi possível concluir o arquivo em Downloads.", failure.getMessage());
        assertTrue(entry.discarded);
    }

    @Test
    public void unexpectedMultipleUpdatedRowsCannotReportSuccess() {
        FakeEntry entry = new FakeEntry();
        entry.updatedRows = 2;
        assertTrue(failureFor(entry) instanceof IOException);
        assertTrue(entry.discarded);
    }

    @Test
    public void failedCleanupCannotReplacePrimaryFailure() {
        FakeEntry entry = new FakeEntry();
        entry.openFailure = new IOException("open failed");
        entry.discardFailure = new SecurityException("cleanup denied");
        Exception failure = failureFor(entry);
        assertSame(entry.openFailure, failure);
        assertArrayEquals(new Throwable[] { entry.discardFailure }, failure.getSuppressed());
        assertTrue(entry.discarded);
    }

    @Test
    public void writeCloseAndCleanupFailuresKeepWriteFailurePrimary() {
        FakeEntry entry = new FakeEntry();
        entry.writeFailure = new IOException("write failed");
        entry.closeFailure = new IOException("close failed");
        entry.discardFailure = new IOException("cleanup failed");
        Exception failure = failureFor(entry);
        assertSame(entry.writeFailure, failure);
        assertArrayEquals(new Throwable[] { entry.closeFailure, entry.discardFailure }, failure.getSuppressed());
    }

    @Test
    public void cleanupThrowingSameExceptionDoesNotMaskPrimaryFailure() {
        FakeEntry entry = new FakeEntry();
        entry.openFailure = new IOException("provider failed");
        entry.discardFailure = entry.openFailure;
        assertSame(entry.openFailure, failureFor(entry));
        assertEquals(0, entry.openFailure.getSuppressed().length);
        assertTrue(entry.discarded);
    }

    @Test
    public void failedAttemptDoesNotDiscardAnotherSuccessfulEntry() throws Exception {
        FakeEntry previous = new FakeEntry();
        PendingDownloadWriter.write(CONTENT, previous);
        FakeEntry current = new FakeEntry();
        current.updatedRows = 0;
        failureFor(current);
        assertTrue(current.discarded);
        assertFalse(previous.discarded);
        assertArrayEquals(CONTENT, previous.bytes.toByteArray());
    }

    private static Exception failureFor(FakeEntry entry) {
        try {
            PendingDownloadWriter.write(CONTENT, entry);
        } catch (Exception failure) {
            return failure;
        }
        throw new AssertionError("A failed save must not return success");
    }

    private static final class FakeEntry implements PendingDownloadWriter.Entry {
        final List<String> events = new ArrayList<>();
        final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        boolean nullOutput;
        boolean discarded;
        int updatedRows = 1;
        Exception openFailure;
        IOException writeFailure;
        IOException closeFailure;
        Exception publishFailure;
        Exception discardFailure;

        @Override
        public OutputStream open() throws Exception {
            events.add("open");
            if (openFailure != null) throw openFailure;
            if (nullOutput) return null;
            return new OutputStream() {
                @Override
                public void write(int value) throws IOException {
                    throw new AssertionError("Expected a single byte-array write");
                }

                @Override
                public void write(byte[] content) throws IOException {
                    events.add("write");
                    if (writeFailure != null) throw writeFailure;
                    bytes.write(content);
                }

                @Override
                public void close() throws IOException {
                    events.add("close");
                    if (closeFailure != null) throw closeFailure;
                }
            };
        }

        @Override
        public int publish() throws Exception {
            events.add("publish");
            if (publishFailure != null) throw publishFailure;
            return updatedRows;
        }

        @Override
        public void discard() throws Exception {
            events.add("discard");
            discarded = true;
            if (discardFailure != null) throw discardFailure;
        }
    }
}
