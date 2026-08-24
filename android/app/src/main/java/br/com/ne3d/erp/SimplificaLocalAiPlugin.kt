package br.com.ne3d.erp

import android.app.ActivityManager
import android.net.Uri
import android.os.Build
import br.com.ne3d.erp.ai.FunctionGemmaModelInstaller
import br.com.ne3d.erp.ai.FunctionGemmaToolPolicy
import br.com.ne3d.erp.ai.FunctionGemmaToolRuntime
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject

/** Ponte Android exclusiva do FunctionGemma. Não oferece chat nem execução de WRITE. */
@CapacitorPlugin(name = "SimplificaLocalAi")
class SimplificaLocalAiPlugin : Plugin() {
    private val executor = Executors.newSingleThreadExecutor()
    @Volatile private var functionGemmaRuntime: FunctionGemmaToolRuntime? = null

    override fun load() {
        super.load()
        executor.execute { removeLegacyModelArtifacts() }
    }

    private fun functionRuntime(): FunctionGemmaToolRuntime = synchronized(this) {
        functionGemmaRuntime ?: FunctionGemmaToolRuntime(context).also { functionGemmaRuntime = it }
    }

    @PluginMethod
    fun status(call: PluginCall) = functionGemmaStatus(call)

    @PluginMethod
    fun listModels(call: PluginCall) = executor.execute {
        val status = functionRuntime().status()
        val item = JSObject().apply {
            put("id", MODEL_ID); put("displayName", "FunctionGemma 270M Q8_0"); put("profile", "OPERATIONAL")
            put("version", SOURCE_REVISION); put("downloadBytes", FunctionGemmaModelInstaller.EXPECTED_BYTES)
            put("installed", status.optBoolean("installed", false)); put("available", status.optBoolean("installed", false))
            put("compatible", Build.SUPPORTED_ABIS.any { it.equals("arm64-v8a", ignoreCase = true) })
            put("text", true); put("vision", false); put("audio", false); put("tools", true)
        }
        call.resolve(JSObject().put("models", JSArray().put(item)).put("selection", MODEL_ID).put("enabled", true).put("writeExposed", 0))
    }

    @PluginMethod
    fun profileDevice(call: PluginCall) = executor.execute {
        val memoryInfo = ActivityManager.MemoryInfo()
        (context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memoryInfo)
        call.resolve(JSObject().apply {
            put("totalMemoryBytes", memoryInfo.totalMem); put("availableMemoryBytes", memoryInfo.availMem)
            put("abis", JSArray(Build.SUPPORTED_ABIS.toList())); put("runtime", "llama.cpp-arm64-cpu")
            put("backendPolicy", "CPU_ONLY"); put("activeBackend", "llama.cpp")
        })
    }

    @PluginMethod
    fun ensureModel(call: PluginCall) = functionGemmaStatus(call)

    /** Importa o GGUF para storage privado somente após tamanho e SHA-256 completos. */
    @PluginMethod
    fun importFunctionGemma(call: PluginCall) = executor.execute {
        val source = call.getString("uri", "")?.trim().orEmpty()
        if (source.isEmpty()) { call.reject("Informe o arquivo FunctionGemma.", "FUNCTIONGEMMA_URI_REQUIRED"); return@execute }
        try {
            val uri = Uri.parse(source)
            val input = when (uri.scheme) {
                "content" -> context.contentResolver.openInputStream(uri)
                "file" -> uri.path?.let(::File)?.inputStream()
                else -> null
            } ?: throw IllegalArgumentException("FUNCTIONGEMMA_SOURCE_UNREADABLE")
            val installed = FunctionGemmaModelInstaller.install(context, input)
            call.resolve(JSObject().put("installed", true).put("path", installed.file.absolutePath).put("bytes", installed.bytes).put("sha256", installed.sha256).put("writeExposed", 0))
        } catch (error: Exception) {
            call.reject("Não foi possível verificar o arquivo FunctionGemma.", "FUNCTIONGEMMA_IMPORT_FAILED", error)
        }
    }

    @PluginMethod
    fun functionGemmaStatus(call: PluginCall) = executor.execute {
        try { call.resolve(JSObject.fromJSONObject(functionRuntime().status())) }
        catch (error: Exception) { call.resolve(functionGemmaFailure(error)) }
    }

    @PluginMethod
    fun loadFunctionGemma(call: PluginCall) = executor.execute {
        try { call.resolve(JSObject().put("ok", true).put("metrics", functionRuntime().load()).put("mode", "tool_call").put("writeExposed", 0)) }
        catch (error: Exception) { call.resolve(functionGemmaFailure(error)) }
    }

    @PluginMethod
    fun warmupFunctionGemma(call: PluginCall) = executor.execute {
        try { call.resolve(JSObject().put("ok", true).put("metrics", functionRuntime().warmup()).put("mode", "tool_call").put("writeExposed", 0)) }
        catch (error: Exception) { call.resolve(functionGemmaFailure(error)) }
    }

    /** Retorna apenas uma previsão validada; nunca executa uma ação do ERP. */
    @PluginMethod
    fun predictFunctionGemma(call: PluginCall) = executor.execute {
        try {
            val command = call.getString("command", "")?.trim().orEmpty()
            val tools = parseFunctionGemmaTools(call.getArray("tools", JSArray()) ?: JSArray())
            val blockedAliases = stringList(call.getArray("blockedWriteAliases", JSArray()) ?: JSArray(), 100)
            val prediction = functionRuntime().predict(command, tools, blockedAliases)
            val decision = prediction.decision
            call.resolve(JSObject().apply {
                put("ok", true); put("kind", decision.kind); put("tool", decision.canonicalId ?: "")
                put("wireTool", decision.wireName ?: ""); put("rawTool", decision.rawTool ?: "")
                put("arguments", JSONObject(decision.arguments)); put("reason", decision.reason)
                put("shadow", false); put("writeExposed", 0); put("metrics", prediction.metrics); put("envelope", prediction.envelope)
            })
        } catch (error: Exception) { call.resolve(functionGemmaFailure(error)) }
    }

    @PluginMethod
    fun cancelFunctionGemma(call: PluginCall) {
        functionGemmaRuntime?.cancel()
        call.resolve(JSObject().put("ok", true).put("cancelled", true).put("writeExposed", 0))
    }

    @PluginMethod
    fun unloadFunctionGemma(call: PluginCall) = executor.execute {
        synchronized(this) { functionGemmaRuntime?.close(); functionGemmaRuntime = null }
        call.resolve(JSObject().put("ok", true).put("unloaded", true).put("writeExposed", 0))
    }

    @PluginMethod
    fun unload(call: PluginCall) = unloadFunctionGemma(call)

    private fun parseFunctionGemmaTools(items: JSArray): List<FunctionGemmaToolRuntime.Tool> {
        require(items.length() in 1..5) { "FUNCTIONGEMMA_TOP_K_INVALID" }
        return (0 until items.length()).map { index ->
            val item = items.getJSONObject(index)
            val propertiesArray = item.optJSONArray("properties") ?: JSONArray()
            val properties = (0 until propertiesArray.length()).map { propertyIndex ->
                val property = propertiesArray.getJSONObject(propertyIndex)
                FunctionGemmaToolRuntime.Property(property.getString("name"), property.optString("type", "STRING").uppercase(), property.optString("description", ""))
            }
            val fixed = linkedMapOf<String, Any>()
            item.optJSONObject("fixedArguments")?.let { value -> value.keys().forEach { key -> value.opt(key)?.takeIf { it != JSONObject.NULL }?.let { fixed[key] = it } } }
            val requiredAll = stringSet(item.optJSONArray("requiredAll") ?: JSONArray(), 20)
            val requiredAny = stringSet(item.optJSONArray("requiredAny") ?: JSONArray(), 20)
            val allowed = properties.map { it.name }.toSet() + fixed.keys + requiredAll + requiredAny
            FunctionGemmaToolRuntime.Tool(
                FunctionGemmaToolPolicy.Contract(
                    canonicalId = item.getString("id"), wireName = item.getString("wireName"),
                    operationType = item.optString("operationType", "READ").uppercase(), allowedArguments = allowed,
                    requiredAll = requiredAll, requiredAny = requiredAny, fixedArguments = fixed,
                    semanticAnchors = stringSet(item.optJSONArray("anchors") ?: JSONArray(), 30)
                ),
                description = item.getString("description"), properties = properties
            )
        }
    }

    private fun stringSet(items: JSONArray, limit: Int): Set<String> = stringList(items, limit).toSet()
    private fun stringList(items: JSONArray, limit: Int): List<String> {
        require(items.length() <= limit) { "FUNCTIONGEMMA_LIST_TOO_LARGE" }
        return (0 until items.length()).map { items.getString(it).trim() }.filter { it.isNotBlank() }
    }

    private fun functionGemmaFailure(error: Exception): JSObject = JSObject().apply {
        put("ok", false); put("kind", "NO_TOOL"); put("state", "DEGRADED")
        put("reason", error.message ?: "FUNCTIONGEMMA_FAILED"); put("shadow", false); put("writeExposed", 0)
    }

    private fun removeLegacyModelArtifacts() {
        val legacyRoot = File(File(context.filesDir, "models"), "gemma-4-e2b-it")
        if (legacyRoot.exists()) runCatching { legacyRoot.deleteRecursively() }
        context.getSharedPreferences("simplifica_local_ai_v1", android.content.Context.MODE_PRIVATE).edit().clear().apply()
    }

    override fun handleOnDestroy() {
        val runtime = synchronized(this) { val active = functionGemmaRuntime; functionGemmaRuntime = null; active }
        runCatching { executor.execute { runtime?.close() } }
        executor.shutdown()
        super.handleOnDestroy()
    }

    private companion object {
        const val MODEL_ID = "functiongemma-270m-it-q8_0"
        const val SOURCE_REVISION = "39eccb091651513a5dfb56892d3714c1b5b8276c"
    }
}
