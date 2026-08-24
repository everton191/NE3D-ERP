package br.com.ne3d.erp.ai

import android.content.Context
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

/** CPU-only FunctionGemma lifecycle. It is deliberately not a general chat API. */
class LlamaCppBackend(private val context: Context) : AutoCloseable {
    private val worker = Executors.newSingleThreadExecutor { Thread(it, "functiongemma-cpu").apply { priority = Thread.NORM_PRIORITY - 1 } }
    @Volatile private var closed = false
    @Volatile private var generating = false
    fun load(file: File, expectedSha256: String) = worker.submit {
        check(!closed); check(file.isFile()) { "FUNCTIONGEMMA_FILE_MISSING" }
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(1024 * 1024)
            while (true) { val count = input.read(buffer); if (count < 0) break; digest.update(buffer, 0, count) }
        }
        val actual = digest.digest().joinToString("") { "%02x".format(it) }
        check(actual.equals(expectedSha256, true)) { "FUNCTIONGEMMA_SHA_MISMATCH" }
        // Native libs remain mmap-able directly from the APK (extractNativeLibs=false).
        // JNI selects dotprod only when the device advertises ASIMDDP.
        checkNative(nativeInit(context.applicationInfo.sourceDir))
        checkNative(nativeLoadModel(file.absolutePath))
    }
    fun warmup() = worker.submit { checkNative(nativeWarmup()) }

    /** Runs only on the dedicated worker. Timeout requests cancellation, never concurrent unload. */
    fun generate(prompt: String, maxTokens: Int = 96, temperature: Float = 0f, topP: Float = 0.9f, timeoutMs: Long = 20_000): String {
        check(!closed) { "FUNCTIONGEMMA_CLOSED" }
        val task: Future<String> = worker.submit<String> {
            check(!closed) { "FUNCTIONGEMMA_CLOSED" }
            check(!generating) { "FUNCTIONGEMMA_BUSY" }
            generating = true
            try { nativeGenerate(prompt, maxTokens, temperature, topP) }
            finally { generating = false }
        }
        return try {
            task.get(timeoutMs, TimeUnit.MILLISECONDS)
        } catch (timeout: TimeoutException) {
            nativeCancel()
            task.get()
            "{\"ok\":false,\"text\":\"\",\"tokensGenerated\":0,\"ttftMs\":0,\"totalMs\":0,\"cancelled\":true,\"error\":\"TIMEOUT\"}"
        }
    }
    fun cancel() { nativeCancel() }
    override fun close() { if (!closed) { closed = true; nativeCancel(); worker.submit { nativeUnload() }.get(); worker.shutdown() } }
    private fun checkNative(envelope: String): String {
        check(envelope.contains("\"ok\":true")) { envelope }
        return envelope
    }
    private external fun nativeInit(nativeLibraryDir: String): String
    private external fun nativeLoadModel(path: String): String
    private external fun nativeWarmup(): String
    private external fun nativeGenerate(prompt: String, maxTokens: Int, temperature: Float, topP: Float): String
    private external fun nativeCancel()
    private external fun nativeUnload()
    external fun nativeGetMetrics(): String
    companion object { init { System.loadLibrary("functiongemma_jni") } }
}
