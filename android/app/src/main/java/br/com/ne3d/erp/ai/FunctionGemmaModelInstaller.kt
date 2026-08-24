package br.com.ne3d.erp.ai

import android.content.Context
import java.io.File
import java.io.InputStream
import java.security.MessageDigest

/** Installs only a fully verified FunctionGemma artifact into app-private storage. */
object FunctionGemmaModelInstaller {
    const val EXPECTED_SHA256 = "595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47"
    const val EXPECTED_BYTES = 291_557_856L
    const val FILE_NAME = "functiongemma-270m-it-39eccb091651513a5dfb56892d3714c1b5b8276c-Q8_0.gguf"

    data class InstalledModel(val file: File, val bytes: Long, val sha256: String)

    fun modelFile(context: Context): File = File(
        File(context.noBackupFilesDir, "models/functiongemma/0.2.0-q8_0"),
        FILE_NAME
    )

    @Throws(Exception::class)
    fun install(context: Context, source: InputStream): InstalledModel {
        val target = modelFile(context)
        val directory = target.parentFile ?: throw IllegalStateException("FUNCTIONGEMMA_TARGET_INVALID")
        check(directory.exists() || directory.mkdirs()) { "FUNCTIONGEMMA_DIRECTORY_CREATE_FAILED" }
        val partial = File(directory, "$FILE_NAME.part")
        partial.delete()
        val digest = MessageDigest.getInstance("SHA-256")
        var bytes = 0L
        try {
            source.use { input ->
                partial.outputStream().buffered(1_048_576).use { output ->
                    val buffer = ByteArray(1_048_576)
                    while (true) {
                        val read = input.read(buffer)
                        if (read < 0) break
                        output.write(buffer, 0, read)
                        digest.update(buffer, 0, read)
                        bytes += read
                    }
                    output.flush()
                }
            }
            val sha256 = digest.digest().joinToString("") { "%02x".format(it) }
            check(bytes == EXPECTED_BYTES) { "FUNCTIONGEMMA_SIZE_MISMATCH" }
            check(sha256.equals(EXPECTED_SHA256, ignoreCase = true)) { "FUNCTIONGEMMA_SHA_MISMATCH" }
            if (target.exists()) check(target.delete()) { "FUNCTIONGEMMA_REPLACE_FAILED" }
            check(partial.renameTo(target)) { "FUNCTIONGEMMA_ATOMIC_RENAME_FAILED" }
            return InstalledModel(target, bytes, sha256)
        } catch (error: Exception) {
            partial.delete()
            throw error
        }
    }

    fun verify(context: Context): InstalledModel? {
        val file = modelFile(context)
        if (!file.isFile || file.length() != EXPECTED_BYTES) return null
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().buffered(1_048_576).use { input ->
            val buffer = ByteArray(1_048_576)
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                digest.update(buffer, 0, read)
            }
        }
        val sha256 = digest.digest().joinToString("") { "%02x".format(it) }
        return if (sha256.equals(EXPECTED_SHA256, ignoreCase = true)) InstalledModel(file, file.length(), sha256) else null
    }
}
