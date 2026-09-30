package br.com.ne3d.erp.ai

import android.content.Context
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

/** Single-owner CPU llama.cpp runtime shared by local model adapters. */
class LlamaCppBackend(private val context: Context) : AutoCloseable {
    data class ModelConfig(val modelId: String, val modelFile: File, val sha256: String = "", val contextSize: Int = 1024, val threads: Int = 0, val batchSize: Int = 0)
    data class GenerateRequest(val prompt: String, val maxTokens: Int = 96, val temperature: Float = 0f, val topP: Float = .9f, val grammar: String? = null, val systemPrompt: String = "", val timeoutMs: Long = 20_000)
    enum class State { UNLOADED, LOADING, LOADED, WARMING, READY, GENERATING, CANCELLING, FAILED }
    private val worker = Executors.newSingleThreadExecutor { Thread(it, "local-llama-cpu").apply { priority = Thread.NORM_PRIORITY - 1 } }
    @Volatile private var closed = false
    @Volatile private var generating = false
    @Volatile private var state = State.UNLOADED
    @Volatile private var activeModelId = ""
    fun loadModel(config: ModelConfig) = worker.submit {
        check(!closed); check(!generating) { "LOCAL_LLAMA_BUSY" }; check(config.modelFile.isFile() && config.modelFile.length() > 0) { "LOCAL_LLAMA_MODEL_MISSING" }
        state = State.LOADING
        val digest = MessageDigest.getInstance("SHA-256")
        config.modelFile.inputStream().use { input ->
            val buffer = ByteArray(1024 * 1024)
            while (true) { val count = input.read(buffer); if (count < 0) break; digest.update(buffer, 0, count) }
        }
        val actual = digest.digest().joinToString("") { "%02x".format(it) }
        check(config.sha256.isBlank() || actual.equals(config.sha256, true)) { "LOCAL_LLAMA_SHA_MISMATCH" }
        // Native libs remain mmap-able directly from the APK (extractNativeLibs=false).
        // JNI selects dotprod only when the device advertises ASIMDDP.
        checkNative(nativeInit(context.applicationInfo.sourceDir))
        check(config.contextSize in 256..16_384) { "LOCAL_LLAMA_CONTEXT_INVALID" }
        check(config.batchSize in 0..1_024) { "LOCAL_LLAMA_BATCH_INVALID" }
        check(config.threads in 0..8) { "LOCAL_LLAMA_THREADS_INVALID" }
        checkNative(nativeLoadModel(config.modelFile.absolutePath, config.contextSize, config.batchSize, config.threads)); activeModelId = config.modelId; state = State.LOADED
    }
    /** Compatibility bridge for the archived FunctionGemma runtime; no active plugin calls it. */
    fun load(file: File, expectedSha256: String) = loadModel(ModelConfig("archived-functiongemma", file, expectedSha256, 512, 2, 64))
    fun warmup() = worker.submit { check(state == State.LOADED || state == State.READY) { "LOCAL_LLAMA_NOT_LOADED" }; state = State.WARMING; checkNative(nativeWarmup()); state = State.READY }

    /** Runs only on the dedicated worker. Timeout requests cancellation, never concurrent unload. */
    fun generate(request: GenerateRequest): String {
        check(!closed) { "LOCAL_LLAMA_CLOSED" }
        val task: Future<String> = worker.submit<String> {
            check(!closed && state == State.READY) { "LOCAL_LLAMA_NOT_READY" }; check(!generating) { "LOCAL_LLAMA_BUSY" }
            generating = true; state = State.GENERATING
            try { nativeGenerate(request.systemPrompt, request.prompt, request.grammar.orEmpty(), request.maxTokens, request.temperature, request.topP) }
            finally { generating = false; if (!closed) state = State.READY }
        }
        return try {
            task.get(request.timeoutMs, TimeUnit.MILLISECONDS)
        } catch (timeout: TimeoutException) {
            state = State.CANCELLING; nativeCancel()
            task.get()
            "{\"ok\":false,\"text\":\"\",\"tokensGenerated\":0,\"ttftMs\":0,\"totalMs\":0,\"cancelled\":true,\"error\":\"TIMEOUT\"}"
        }
    }
    fun generate(prompt: String, maxTokens: Int = 96, temperature: Float = 0f, topP: Float = 0.9f, timeoutMs: Long = 20_000) = generate(GenerateRequest(prompt, maxTokens, temperature, topP, timeoutMs = timeoutMs))
    fun cancel() { nativeCancel() }
    fun currentState(): State = state
    fun currentModelId(): String = activeModelId
    fun status(): String = "{\"modelId\":\"$activeModelId\",\"state\":\"$state\",\"metrics\":${nativeGetMetrics()}}"
    override fun close() { if (!closed) { closed = true; state = State.CANCELLING; nativeCancel(); worker.submit { nativeUnload(); state = State.UNLOADED }.get(); worker.shutdown() } }
    private fun checkNative(envelope: String): String {
        check(envelope.contains("\"ok\":true")) { envelope }
        return envelope
    }
    private external fun nativeInit(nativeLibraryDir: String): String
    private external fun nativeLoadModel(path: String, contextSize: Int, batchSize: Int, threads: Int): String
    private external fun nativeWarmup(): String
    private external fun nativeGenerate(systemPrompt: String, prompt: String, grammar: String, maxTokens: Int, temperature: Float, topP: Float): String
    private external fun nativeCancel()
    private external fun nativeUnload()
    external fun nativeGetMetrics(): String
    companion object { init { System.loadLibrary("local_llama_jni") } }
}
