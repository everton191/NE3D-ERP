package br.com.ne3d.erp.ai

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Serial Android owner for Needle. The C runtime is one process-global model,
 * cannot unload weights and exposes no cancellation API; calls therefore never
 * run concurrently and cancellation applies only while a download is queued.
 */
class NeedleProvider(private val context: Context) : AutoCloseable {
    enum class State { NOT_INSTALLED, DOWNLOADING, VERIFYING, INSTALLED, LOADING, READY, DEGRADED, FAILED }
    data class Result(val ok: Boolean, val payload: JSONObject)
    private val worker = Executors.newSingleThreadExecutor { Thread(it, "needle3-shadow").apply { priority = Thread.NORM_PRIORITY - 1 } }
    private val cancelDownload = AtomicBoolean(false)
    private val native = NeedleNativeBridge()
    private val config: JSONObject by lazy {
        val manifest = context.assets.open("ai/model-manifest.json").bufferedReader().use { JSONObject(it.readText()) }
        val models = manifest.getJSONArray("models")
        (0 until models.length()).map { models.getJSONObject(it) }.first { it.getString("id") == "needle3" }
    }
    @Volatile private var state = State.NOT_INSTALLED
    @Volatile private var loaded = false
    @Volatile private var lastError = ""
    @Volatile private var loadMs = 0L
    @Volatile private var initMs = 0L
    @Volatile private var prefixTokens = -1
    @Volatile private var downloadProgress = 0
    private fun root() = File(context.filesDir, "ai/models/needle3")
    private fun weights() = File(root(), config.getString("filename"))
    private fun installedManifest() = File(root(), "manifest.json")
    private fun sourceUrl() = "https://huggingface.co/${config.getString("repo")}/resolve/${config.getString("revision")}/${config.getString("filename")}?download=true"
    private fun digest(file: File): String { val sha = MessageDigest.getInstance("SHA-256"); file.inputStream().use { input -> val buffer = ByteArray(1024 * 1024); while (true) { val count = input.read(buffer); if (count < 0) break; sha.update(buffer, 0, count) } }; return sha.digest().joinToString("") { "%02x".format(it) } }
    private fun verified(file: File = weights()): Boolean = file.isFile && file.length() == config.getLong("expectedSize") && digest(file).equals(config.getString("sha256"), true)
    private fun writeInstalledManifest() { installedManifest().writeText(JSONObject(config.toString()).put("installedRevision", config.getString("revision")).put("downloadState", "INSTALLED").put("healthState", state.name).toString()) }
    private fun response(ok: Boolean = true) = JSONObject().put("ok", ok).put("id", config.getString("id")).put("displayName", config.getString("displayName")).put("state", state.name).put("installed", verified()).put("loaded", loaded).put("downloadProgress", downloadProgress).put("installedRevision", if (installedManifest().isFile) config.getString("revision") else "").put("cancelSupported", false).put("writeExposed", 0).put("error", lastError)
    fun status(): Future<JSONObject> = worker.submit<JSONObject> { if (state == State.NOT_INSTALLED && verified()) state = State.INSTALLED; response() }
    fun install(): Future<JSONObject> = worker.submit<JSONObject> {
        try { state = State.DOWNLOADING; lastError = ""; downloadProgress = 0; cancelDownload.set(false); root().mkdirs(); val pending = File(root(), weights().name + ".part")
            val connection = (URL(sourceUrl()).openConnection() as HttpURLConnection).apply { connectTimeout = 20_000; readTimeout = 60_000; instanceFollowRedirects = true; requestMethod = "GET" }
            require(connection.responseCode in 200..299) { "DOWNLOAD_HTTP_${connection.responseCode}" }; val total = connection.contentLengthLong
            connection.inputStream.use { input -> pending.outputStream().use { output -> val buffer = ByteArray(128 * 1024); while (true) { if (cancelDownload.get()) throw IllegalStateException("DOWNLOAD_CANCELLED"); val count = input.read(buffer); if (count < 0) break; output.write(buffer, 0, count); if (total > 0) downloadProgress = ((pending.length() * 100L) / total).toInt().coerceIn(0, 99) } } }
            state = State.VERIFYING; check(verified(pending)) { "CHECKSUM_FAILED" }; if (weights().exists()) check(weights().delete()) { "INSTALL_REPLACE_FAILED" }; check(pending.renameTo(weights())) { "INSTALL_ATOMIC_RENAME_FAILED" }; downloadProgress = 100; state = State.INSTALLED; writeInstalledManifest(); response()
        } catch (error: Exception) { state = if (verified()) State.INSTALLED else State.FAILED; lastError = error.message ?: "DOWNLOAD_FAILED"; response(false) }
    }
    fun import(uriValue: String): Future<JSONObject> = worker.submit<JSONObject> {
        try { val uri = Uri.parse(uriValue); require(uri.scheme == "content") { "NEEDLE_IMPORT_CONTENT_URI_REQUIRED" }; state = State.VERIFYING; root().mkdirs(); val pending = File(root(), weights().name + ".part"); context.contentResolver.openInputStream(uri)?.use { input -> pending.outputStream().use { input.copyTo(it) } } ?: error("IMPORT_SOURCE_UNREADABLE")
            check(verified(pending)) { "CHECKSUM_FAILED" }; if (weights().exists()) check(weights().delete()) { "INSTALL_REPLACE_FAILED" }; check(pending.renameTo(weights())) { "INSTALL_ATOMIC_RENAME_FAILED" }; state = State.INSTALLED; downloadProgress = 100; writeInstalledManifest(); response()
        } catch (error: Exception) { state = if (verified()) State.INSTALLED else State.FAILED; lastError = error.message ?: "IMPORT_FAILED"; response(false) }
    }
    fun cancelQueuedDownload(): JSONObject { cancelDownload.set(true); return response().put("cancelRequested", true) }
    private fun checkedNative(raw: String, failure: String): JSONObject { val value = JSONObject(raw); if (!value.optBoolean("ok")) { lastError = value.optString("error", failure); throw IllegalStateException(if (lastError.contains("prefix", true)) "PREFIX_TOO_LARGE" else failure) }; return value }
    private fun ensureLoaded() { if (loaded) return; check(verified()) { "MODEL_NOT_INSTALLED" }; state = State.LOADING; val started = System.nanoTime(); checkedNative(native.nativeLoad(weights().absolutePath), "MODEL_LOAD_FAILED"); loadMs = (System.nanoTime() - started) / 1_000_000; loaded = true; state = State.INSTALLED }
    private fun initialize(systemPrompt: String, tools: JSONArray) { val started = System.nanoTime(); val result = checkedNative(native.nativeInit(systemPrompt, tools.toString()), "INIT_FAILED"); initMs = (System.nanoTime() - started) / 1_000_000; prefixTokens = result.optInt("prefixTokens", -1); state = State.READY }
    fun load(): Future<JSONObject> = worker.submit<JSONObject> { try { ensureLoaded(); response() } catch (error: Exception) { state = State.FAILED; lastError = error.message ?: "MODEL_LOAD_FAILED"; response(false) } }
    fun shadow(input: String, systemPrompt: String, tools: JSONArray): Future<JSONObject> = worker.submit<JSONObject> {
        try { require(input.isNotBlank()) { "INPUT_REQUIRED" }; require(tools.length() in 1..3) { "INVALID_TOOL_COUNT" }; ensureLoaded(); initialize(systemPrompt, tools); val started = System.nanoTime(); val raw = checkedNative(native.nativeComplete(input, 128), "INFERENCE_FAILED"); response().put("result", raw.optString("result")).put("tokens", raw.optInt("tokens")).put("inferenceMs", (System.nanoTime() - started) / 1_000_000).put("prefixTokens", prefixTokens).put("toolCount", tools.length()) }
        catch (error: Exception) { state = State.DEGRADED; lastError = error.message ?: "INFERENCE_FAILED"; response(false) }
    }
    fun embed(input: String): Future<JSONObject> = worker.submit<JSONObject> { try { ensureLoaded(); val started = System.nanoTime(); val raw = checkedNative(native.nativeEmbed(input), "UNSUPPORTED_OPERATION"); response().put("dimension", raw.optInt("dimension")).put("values", raw.optJSONArray("values")).put("embeddingMs", (System.nanoTime() - started) / 1_000_000) } catch (error: Exception) { state = State.DEGRADED; lastError = error.message ?: "UNSUPPORTED_OPERATION"; response(false) } }
    fun health(): Future<JSONObject> = worker.submit<JSONObject> { try { ensureLoaded(); val tools = JSONArray().put(JSONObject().put("name", "health_echo").put("description", "Echoes a supplied value.").put("parameters", JSONObject().put("type", "object").put("properties", JSONObject().put("value", JSONObject().put("type", "string"))).put("required", JSONArray().put("value")))); initialize("Use only the provided tool. Do not invent values.", tools); val call = checkedNative(native.nativeComplete("echo value ready", 64), "INFERENCE_FAILED"); val embedding = checkedNative(native.nativeEmbed("needle health"), "UNSUPPORTED_OPERATION"); response().put("health", JSONObject().put("weightsPresent", weights().isFile).put("checksumValid", verified()).put("nativeEngineAvailable", true).put("loadSuccess", loaded).put("initSuccess", true).put("toolCallProbe", call.optString("result").isNotBlank()).put("embeddingProbe", embedding.optInt("dimension") > 0)).put("prefixTokens", prefixTokens).put("loadMs", loadMs).put("initMs", initMs) } catch (error: Exception) { state = State.DEGRADED; lastError = error.message ?: "HEALTH_FAILED"; response(false) } }
    fun delete(): Future<JSONObject> = worker.submit<JSONObject> { if (weights().exists()) weights().delete(); installedManifest().delete(); loaded = false; state = State.NOT_INSTALLED; lastError = ""; response() }
    override fun close() { worker.shutdown() }
}
