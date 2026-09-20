package br.com.ne3d.erp

import android.net.Uri
import android.os.Build
import br.com.ne3d.erp.ai.LlamaCppBackend
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.Executors

/** Generic CPU-only bridge for verified local GGUF artifacts; it never executes ERP actions. */
@CapacitorPlugin(name = "SimplificaLocalAi")
class SimplificaLocalAiPlugin : Plugin() {
    private data class Model(val id: String, val name: String, val fileName: String, val sha: String, val bytes: Long)
    private val catalog = listOf(
        Model("lfm2.5-1.2b-q4_0", "LFM2.5 1.2B Instruct Q4_0", "LFM2.5-1.2B-Instruct-QAD-Q4_0.gguf", "bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1", 695755488),
        Model("lfm2.5-1.2b-q6_k", "LFM2.5 1.2B Instruct Q6_K", "LFM2.5-1.2B-Instruct-Q6_K.gguf", "c5e895c191a066f6b26a8f09f10e94cdb799e579216f87df61a7e27beacd9a2b", 962843456)
    )
    private val worker = Executors.newSingleThreadExecutor()
    @Volatile private var runtime: LlamaCppBackend? = null
    @Volatile private var active: Model? = null
    private fun model(id: String) = catalog.firstOrNull { it.id == id } ?: error("LOCAL_MODEL_UNSUPPORTED")
    private fun location(item: Model) = File(File(context.filesDir, "models/lfm2"), item.fileName)
    private fun engine() = synchronized(this) { runtime ?: LlamaCppBackend(context).also { runtime = it } }

    @PluginMethod fun status(call: PluginCall) = localLlmStatus(call)
    @PluginMethod fun ensureModel(call: PluginCall) = localLlmStatus(call)
    @PluginMethod fun listModels(call: PluginCall) = worker.execute {
        val models = JSArray(); catalog.forEach { item -> models.put(JSObject().apply { put("id", item.id); put("displayName", item.name); put("downloadBytes", item.bytes); put("sha256", item.sha); put("installed", verified(item, location(item))); put("available", verified(item, location(item))); put("compatible", Build.SUPPORTED_ABIS.any { it.equals("arm64-v8a", true) }); put("text", true); put("vision", false); put("audio", false); put("tools", false) }) }
        call.resolve(JSObject().put("models", models).put("selection", active?.id ?: catalog.first().id).put("writeExposed", 0))
    }
    @PluginMethod fun importModel(call: PluginCall) = worker.execute {
        try {
            val item = model(call.getString("modelId", "") ?: ""); val raw = call.getString("uri", "")?.trim().orEmpty(); require(raw.isNotEmpty()) { "LOCAL_MODEL_URI_REQUIRED" }
            val uri = Uri.parse(raw); val input = when (uri.scheme) { "content" -> context.contentResolver.openInputStream(uri); "file" -> uri.path?.let(::File)?.inputStream(); else -> null } ?: error("LOCAL_MODEL_SOURCE_UNREADABLE")
            val target = location(item); target.parentFile?.mkdirs(); val pending = File(target.parentFile, target.name + ".part"); input.use { source -> pending.outputStream().use { source.copyTo(it) } }
            check(verified(item, pending)) { "LOCAL_MODEL_INTEGRITY_FAILED" }; if (target.exists()) target.delete(); check(pending.renameTo(target)) { "LOCAL_MODEL_INSTALL_FAILED" }
            call.resolve(JSObject().put("ok", true).put("modelId", item.id).put("path", target.absolutePath).put("bytes", target.length()).put("sha256", item.sha).put("writeExposed", 0))
        } catch (error: Exception) { call.reject("Não foi possível verificar o modelo local.", error.message ?: "LOCAL_MODEL_IMPORT_FAILED", error) }
    }
    @PluginMethod fun localLlmStatus(call: PluginCall) = worker.execute { val item = active ?: catalog.first(); call.resolve(JSObject().put("ok", true).put("modelId", item.id).put("installed", verified(item, location(item))).put("loaded", runtime != null).put("writeExposed", 0)) }
    @PluginMethod fun loadLocalModel(call: PluginCall) = worker.execute {
        try { val item = model(call.getString("modelId", catalog.first().id) ?: catalog.first().id); val file = location(item); check(verified(item, file)) { "LOCAL_MODEL_NOT_VERIFIED" }; engine().loadModel(LlamaCppBackend.ModelConfig(item.id, file, item.sha, 2048, 4, 64)).get(); active = item; call.resolve(JSObject().put("ok", true).put("modelId", item.id).put("writeExposed", 0)) }
        catch (error: Exception) { call.reject("Não foi possível carregar o modelo local.", error.message ?: "LOCAL_MODEL_LOAD_FAILED", error) }
    }
    @PluginMethod fun warmupLocalModel(call: PluginCall) = worker.execute { try { engine().warmup().get(); call.resolve(JSObject().put("ok", true).put("metrics", engine().status()).put("writeExposed", 0)) } catch (error: Exception) { call.reject("Não foi possível aquecer o modelo local.", error.message ?: "LOCAL_MODEL_WARMUP_FAILED", error) } }
    @PluginMethod fun generateLocal(call: PluginCall) = worker.execute {
        try { val prompt = call.getString("prompt", "")?.trim().orEmpty(); require(prompt.isNotEmpty()) { "LOCAL_PROMPT_REQUIRED" }; val result = engine().generate(LlamaCppBackend.GenerateRequest(prompt, (call.getInt("maxTokens", 96) ?: 96).coerceIn(1, 128), call.getFloat("temperature", 0f) ?: 0f, call.getFloat("topP", .9f) ?: .9f, timeoutMs = (call.getLong("timeoutMs", 30000) ?: 30000).coerceIn(1000, 60000))); call.resolve(JSObject().put("ok", true).put("result", result).put("writeExposed", 0)) }
        catch (error: Exception) { call.reject("Não foi possível gerar texto localmente.", error.message ?: "LOCAL_GENERATION_FAILED", error) }
    }
    @PluginMethod fun cancelLocalModel(call: PluginCall) { runtime?.cancel(); call.resolve(JSObject().put("ok", true).put("cancelled", true).put("writeExposed", 0)) }
    @PluginMethod fun unloadLocalModel(call: PluginCall) = worker.execute { synchronized(this) { runtime?.close(); runtime = null; active = null }; call.resolve(JSObject().put("ok", true).put("unloaded", true).put("writeExposed", 0)) }
    @PluginMethod fun unload(call: PluginCall) = unloadLocalModel(call)
    private fun verified(item: Model, file: File): Boolean { if (!file.isFile || file.length() != item.bytes) return false; val digest = MessageDigest.getInstance("SHA-256"); file.inputStream().use { input -> val buffer = ByteArray(1024 * 1024); while (true) { val count = input.read(buffer); if (count < 0) break; digest.update(buffer, 0, count) } }; return digest.digest().joinToString("") { "%02x".format(it) }.equals(item.sha, true) }
    override fun handleOnDestroy() { val value = synchronized(this) { val current = runtime; runtime = null; active = null; current }; runCatching { worker.execute { value?.close() } }; worker.shutdown(); super.handleOnDestroy() }
}
