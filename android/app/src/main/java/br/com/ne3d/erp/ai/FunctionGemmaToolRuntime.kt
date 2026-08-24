package br.com.ne3d.erp.ai

import android.content.Context
import org.json.JSONObject

/** Lazy FunctionGemma tool-calling runtime. It predicts; the ERP owns execution. */
class FunctionGemmaToolRuntime(context: Context) : AutoCloseable {
    data class Property(val name: String, val type: String, val description: String = "")
    data class Tool(
        val contract: FunctionGemmaToolPolicy.Contract,
        val description: String,
        val properties: List<Property> = emptyList()
    )
    data class Prediction(
        val decision: FunctionGemmaToolPolicy.Decision,
        val envelope: JSONObject,
        val metrics: JSONObject
    )

    private val appContext = context.applicationContext
    private val lifecycleGate = Any()
    @Volatile private var backend: LlamaCppBackend? = null
    @Volatile private var warmed = false
    @Volatile private var degradedReason: String? = null

    fun load(): JSONObject = synchronized(lifecycleGate) {
        backend?.let { return@synchronized JSONObject(it.nativeGetMetrics()) }
        val installed = FunctionGemmaModelInstaller.verify(appContext)
            ?: throw IllegalStateException("FUNCTIONGEMMA_MODEL_UNAVAILABLE")
        val candidate = LlamaCppBackend(appContext)
        try {
            candidate.load(installed.file, FunctionGemmaModelInstaller.EXPECTED_SHA256).get()
            backend = candidate
            degradedReason = null
            JSONObject(candidate.nativeGetMetrics())
        } catch (error: Exception) {
            runCatching { candidate.close() }
            degradedReason = error.message ?: "FUNCTIONGEMMA_LOAD_FAILED"
            throw error
        }
    }

    fun warmup(): JSONObject = synchronized(lifecycleGate) {
        val active = backend ?: run { load(); backend!! }
        if (!warmed) {
            active.warmup().get()
            warmed = true
        }
        JSONObject(active.nativeGetMetrics())
    }

    fun predict(
        command: String,
        tools: List<Tool>,
        blockedWriteAliases: Collection<String>
    ): Prediction {
        validateTools(tools)
        val active = synchronized(lifecycleGate) {
            if (backend == null) load()
            if (!warmed) warmup()
            backend ?: throw IllegalStateException("FUNCTIONGEMMA_NOT_READY")
        }
        val prompt = buildPrompt(command, tools)
        return try {
            val envelope = JSONObject(active.generate(prompt, maxTokens = 32, temperature = 0f, topP = 0.9f, timeoutMs = 10_000))
            val rawText = envelope.optString("text", "")
            val decision = if (envelope.optBoolean("ok", false)) {
                FunctionGemmaToolPolicy.decide(command, rawText, tools.map { it.contract }, blockedWriteAliases)
            } else {
                FunctionGemmaToolPolicy.Decision("NO_TOOL", reason = envelope.optString("error", "GENERATION_FAILED"))
            }
            Prediction(decision, envelope, JSONObject(active.nativeGetMetrics()))
        } catch (error: Exception) {
            degradedReason = error.message ?: "FUNCTIONGEMMA_GENERATION_FAILED"
            throw error
        }
    }

    fun status(): JSONObject = JSONObject().apply {
        val installed = runCatching { FunctionGemmaModelInstaller.verify(appContext) }.getOrNull()
        put("installed", installed != null)
        put("sha256", installed?.sha256 ?: "")
        put("bytes", installed?.bytes ?: 0L)
        put("loaded", backend != null)
        put("warmed", warmed)
        put("mode", "tool_call")
        put("writeExposed", 0)
        put("state", when {
            degradedReason != null -> "DEGRADED"
            backend != null && warmed -> "READY"
            installed != null -> "AVAILABLE"
            else -> "UNAVAILABLE"
        })
        put("reason", degradedReason ?: "")
        backend?.let { put("metrics", JSONObject(it.nativeGetMetrics())) }
    }

    fun cancel() { backend?.cancel() }

    override fun close() = synchronized(lifecycleGate) {
        val active = backend
        backend = null
        warmed = false
        if (active != null) runCatching { active.close() }
        Unit
    }

    private fun validateTools(tools: List<Tool>) {
        require(tools.isNotEmpty()) { "FUNCTIONGEMMA_TOP_K_EMPTY" }
        require(tools.size <= 5) { "FUNCTIONGEMMA_TOP_K_TOO_LARGE" }
        require(tools.map { it.contract.wireName }.distinct().size == tools.size) { "FUNCTIONGEMMA_DUPLICATE_WIRE_TOOL" }
        tools.forEach { tool ->
            require(tool.contract.operationType in setOf("READ", "PREPARE")) { "FUNCTIONGEMMA_WRITE_TOOL_BLOCKED" }
            require(Regex("^[a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*$").matches(tool.contract.canonicalId)) { "FUNCTIONGEMMA_INVALID_ACTION_ID" }
            require(Regex("^[a-z][a-z0-9_]*$").matches(tool.contract.wireName)) { "FUNCTIONGEMMA_INVALID_WIRE_NAME" }
            require(tool.description.length in 1..180 && !tool.description.contains("<start_") && !tool.description.contains("<end_")) { "FUNCTIONGEMMA_INVALID_DESCRIPTION" }
            tool.properties.forEach { property ->
                require(Regex("^[a-z][a-z0-9_]*$").matches(property.name)) { "FUNCTIONGEMMA_INVALID_PROPERTY" }
                require(property.name in tool.contract.allowedArguments) { "FUNCTIONGEMMA_PROPERTY_OUTSIDE_SCHEMA" }
                require(property.type in setOf("STRING", "NUMBER", "BOOLEAN")) { "FUNCTIONGEMMA_INVALID_PROPERTY_TYPE" }
                require(property.description.length <= 120 && !property.description.contains("<escape>")) { "FUNCTIONGEMMA_INVALID_PROPERTY_DESCRIPTION" }
            }
        }
    }

    private fun buildPrompt(command: String, tools: List<Tool>): String {
        require(command.isNotBlank() && command.length <= 500) { "FUNCTIONGEMMA_INVALID_COMMAND" }
        require(!command.contains("<start_of_turn>") && !command.contains("<end_of_turn>")) { "FUNCTIONGEMMA_PROMPT_MARKER_BLOCKED" }
        val declarations = tools.joinToString("") { tool ->
            val properties = tool.properties.joinToString(",") { property ->
                val description = property.description.replace(Regex("\\s+"), " ").trim()
                "${property.name}:{${if (description.isBlank()) "" else "description:<escape>$description<escape>,"}type:<escape>${property.type}<escape>}"
            }
            val required = tool.contract.requiredAll.joinToString(",") { "<escape>$it<escape>" }
            val parameters = if (properties.isBlank()) {
                "parameters:{type:<escape>OBJECT<escape>}"
            } else {
                "parameters:{properties:{$properties}${if (required.isBlank()) "" else ",required:[$required]"},type:<escape>OBJECT<escape>}"
            }
            val description = tool.description.replace(Regex("\\s+"), " ").trim()
            "<start_function_declaration>declaration:${tool.contract.wireName}{description:<escape>$description<escape>,$parameters}<end_function_declaration>"
        }
        return "<start_of_turn>developer\nYou are a model that can do function calling with the following functions$declarations<end_of_turn>\n" +
            "<start_of_turn>user\n$command<end_of_turn>\n<start_of_turn>model\n"
    }
}
