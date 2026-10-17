package br.com.ne3d.erp;

import java.io.IOException;
import java.io.OutputStream;

/** Writes the pending entry created by one Downloads save attempt. */
final class PendingDownloadWriter {
    interface Entry {
        OutputStream open() throws Exception;
        int publish() throws Exception;
        void discard() throws Exception;
    }

    static final class OpenFailedException extends IOException {
        OpenFailedException() {
            super("Não foi possível abrir o arquivo em Downloads.");
        }
    }

    private PendingDownloadWriter() {}

    static void write(byte[] bytes, Entry entry) throws Exception {
        try {
            try (OutputStream output = entry.open()) {
                if (output == null) throw new OpenFailedException();
                output.write(bytes);
            }
            if (entry.publish() != 1) {
                throw new IOException("Não foi possível concluir o arquivo em Downloads.");
            }
        } catch (Exception failure) {
            try {
                entry.discard();
            } catch (Exception cleanupFailure) {
                // Keep the reason saving failed, even if the provider rejects cleanup.
                if (cleanupFailure != failure) failure.addSuppressed(cleanupFailure);
            }
            throw failure;
        }
    }
}
