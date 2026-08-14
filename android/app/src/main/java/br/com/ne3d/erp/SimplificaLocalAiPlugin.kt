package br.com.ne3d.erp

import br.com.ne3d.erp.ai.LocalInferenceEngine
import br.com.ne3d.erp.ai.LocalModelCatalog
import br.com.ne3d.erp.ai.DeviceCapabilityProfiler
import br.com.ne3d.erp.ai.ModelArtifactManager
import br.com.ne3d.erp.ai.ModelArtifactStatus
import br.com.ne3d.erp.ai.ModelHealthBenchmark
import br.com.ne3d.erp.ai.ModelHealthResult
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import android.util.Base64
import java.io.File
import java.util.concurrent.Executors

@CapacitorPlugin(name = "SimplificaLocalAi")
class SimplificaLocalAiPlugin : Plugin() {
    private val executor = Executors.newSingleThreadExecutor()

    @PluginMethod
    fun status(call: PluginCall) = executor.execute { resolveStatus(call) }

    @PluginMethod
    fun listModels(call: PluginCall) {
        val items = JSArray()
        LocalModelCatalog.artifacts.forEach { descriptor ->
            val item = JSObject()
            val compatibility = LocalModelCatalog.compatibility(context, descriptor)
            item.put("id", descriptor.id); item.put("displayName", descriptor.displayName); item.put("profile", descriptor.profile.name)
            item.put("version", descriptor.version); item.put("downloadBytes", descriptor.downloadBytes); item.put("available", descriptor.available); item.put("experimental", descriptor.experimental)
            item.put("installed", ModelArtifactManager.isReady(context, descriptor)); item.put("compatible", compatibility.compatible); item.put("reason", compatibility.reason ?: "")
            item.put("text", descriptor.capabilities.text); item.put("vision", descriptor.capabilities.vision); item.put("audio", descriptor.capabilities.audio); item.put("tools", descriptor.capabilities.tools)
            items.put(item)
        }
        call.resolve(JSObject().put("models", items).put("selection", ModelArtifactManager.selection(context)).put("enabled", ModelArtifactManager.isEnabled(context)))
    }

    @PluginMethod
    fun profileDevice(call: PluginCall) = executor.execute {
        try {
            val profile = DeviceCapabilityProfiler.profile(context)
            val result = JSObject()
            result.put("totalMemoryBytes", profile.totalMemoryBytes); result.put("availableMemoryBytes", profile.availableMemoryBytes)
            result.put("memoryClassMb", profile.memoryClassMb); result.put("largeMemoryClassMb", profile.largeMemoryClassMb)
            result.put("freeStorageBytes", profile.freeStorageBytes); result.put("abis", JSArray(profile.abis))
            result.put("runtime", profile.runtime); result.put("backendPolicy", profile.backendPolicy); result.put("activeBackend", profile.activeBackend ?: "")
            result.put("modelInitialization", profile.modelInitialization); result.put("conclusive", profile.conclusive); result.put("conservative", profile.conservative)
            result.put("modelHealth", healthResult(ModelHealthBenchmark.read(context)))
            call.resolve(result)
        } catch (error: Exception) { call.reject("Não foi possível analisar este aparelho.", "SIMPLIFICA_AI_PROFILE_FAILED", error) }
    }

    @PluginMethod
    fun benchmarkModel(call: PluginCall) = executor.execute {
        try { call.resolve(healthResult(ModelHealthBenchmark.run(context))) }
        catch (error: Exception) { call.reject("Não foi possível testar o modelo.", "SIMPLIFICA_AI_BENCHMARK_FAILED", error) }
    }

    @PluginMethod
    fun setEnabled(call: PluginCall) { ModelArtifactManager.setEnabled(context, call.getBoolean("enabled", false) == true); call.resolve(statusResult(ModelArtifactManager.status(context))) }

    @PluginMethod
    fun selectModel(call: PluginCall) {
        try { ModelArtifactManager.setSelection(context, call.getString("modelId", "automatic") ?: "automatic"); call.resolve(statusResult(ModelArtifactManager.status(context))) }
        catch (error: Exception) { call.reject("Modelo inválido.", "SIMPLIFICA_AI_INVALID_MODEL", error) }
    }

    @PluginMethod
    fun installModel(call: PluginCall) = executor.execute {
        try { call.resolve(statusResult(ModelArtifactManager.install(context, call.getString("modelId", LocalModelCatalog.balanced.id) ?: LocalModelCatalog.balanced.id))) }
        catch (error: Exception) { call.reject(error.message ?: "Não foi possível iniciar o download.", "SIMPLIFICA_AI_INSTALL_FAILED", error) }
    }

    @PluginMethod
    fun ensureModel(call: PluginCall) = executor.execute { resolveStatus(call) }

    @PluginMethod
    fun cancelDownload(call: PluginCall) { ModelArtifactManager.cancel(context); call.resolve(JSObject().put("cancelled", true)) }

    @PluginMethod
    fun deleteModel(call: PluginCall) = executor.execute {
        try { ModelArtifactManager.delete(context, call.getString("modelId", ModelArtifactManager.selected(context).id) ?: ModelArtifactManager.selected(context).id); call.resolve(statusResult(ModelArtifactManager.status(context))) }
        catch (error: Exception) { call.reject("Não foi possível remover o modelo.", "SIMPLIFICA_AI_DELETE_FAILED", error) }
    }

    @PluginMethod
    fun unload(call: PluginCall) { LocalInferenceEngine.unload(); call.resolve(JSObject().put("unloaded", true)) }

    @PluginMethod
    fun interpret(call: PluginCall) {
        val text = (call.getString("text", "") ?: "").trim()
        val operationalContext = (call.getString("context", "{}") ?: "{}").trim()
        val imageBase64 = (call.getString("imageBase64", "") ?: "").trim()
        val imageMimeType = (call.getString("imageMimeType", "") ?: "").lowercase()
        if (text.isEmpty()) { call.reject("Informe uma mensagem.", "SIMPLIFICA_AI_EMPTY_TEXT"); return }
        if (imageBase64.length > 3_000_000) { call.reject("A imagem preparada ficou grande demais.", "SIMPLIFICA_AI_IMAGE_TOO_LARGE"); return }
        if (imageBase64.isNotEmpty() && imageMimeType !in setOf("image/jpeg", "image/png")) { call.reject("Formato de imagem inválido.", "SIMPLIFICA_AI_IMAGE_INVALID"); return }
        executor.execute {
            var temporaryImage: File? = null
            try {
                if (imageBase64.isNotEmpty()) {
                    val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
                    if (bytes.size > 2 * 1024 * 1024) throw IllegalArgumentException("A imagem preparada ficou grande demais.")
                    val directory = File(context.cacheDir, "assistant-images").apply { mkdirs() }
                    val extension = if (imageMimeType == "image/png") ".png" else ".jpg"
                    temporaryImage = File.createTempFile("assistant-", extension, directory).apply { writeBytes(bytes) }
                }
                val system = "Você é a Assistente do Simplifica 3D e conversa em português simples. Responda somente um JSON válido, sem markdown. Para conversa ou análise de imagem use exatamente {\"type\":\"chat\",\"payload\":{\"answer\":\"resposta útil em português\"}} e nunca deixe answer vazio. Outros tipos permitidos são navegar, estoque.consultar, caixa.consultar, producao.status, pedido.criar e pedido.status, sempre com payload preenchido. Nunca grave dados, invente valores ou produza URLs. Operações de alteração serão apenas preparadas e validadas pelo aplicativo."
                val result = LocalInferenceEngine.generate(context, system, "Contexto e conversa: $operationalContext\nMensagem: $text", temporaryImage?.absolutePath)
                call.resolve(JSObject().put("text", result).put("backend", LocalInferenceEngine.backendName() ?: "desconhecido"))
            } catch (error: Exception) { call.reject(error.message ?: "A IA local não conseguiu responder.", "SIMPLIFICA_AI_FAILED", error) }
            finally { temporaryImage?.delete() }
        }
    }

    private fun resolveStatus(call: PluginCall) {
        try { call.resolve(statusResult(ModelArtifactManager.status(context))) }
        catch (error: Exception) { call.reject("Não foi possível consultar a IA local.", "SIMPLIFICA_AI_STATUS_FAILED", error) }
    }

    private fun statusResult(status: ModelArtifactStatus): JSObject = JSObject().apply {
        put("enabled", status.enabled); put("state", status.state.name); put("modelReady", status.state.name == "READY")
        put("compatible", status.state.name != "INCOMPATIBLE"); put("incompatibilityReason", status.reason ?: "")
        put("modelId", status.descriptor.id); put("modelName", status.descriptor.displayName); put("modelVersion", status.descriptor.version)
        put("modelBytes", if (status.state.name == "READY") status.descriptor.downloadBytes else 0L); put("minimumBytes", status.descriptor.downloadBytes)
        put("downloading", status.state.name in setOf("DOWNLOADING", "VERIFYING", "INSTALLING")); put("downloadedBytes", status.downloadedBytes); put("totalBytes", status.totalBytes)
        put("backend", status.backend ?: ""); put("backendPolicy", "GPU_FIRST_CPU_FALLBACK")
        put("supportsText", status.state.name == "READY" && status.descriptor.capabilities.text)
        put("supportsVision", status.state.name == "READY" && status.descriptor.capabilities.vision)
        put("supportsTools", status.state.name == "READY" && status.descriptor.capabilities.tools)
        put("fallbackFromModelId", LocalInferenceEngine.activeFallbackFrom() ?: "")
        put("fallbackModelId", LocalInferenceEngine.activeFallbackModel() ?: "")
        put("fallbackReason", LocalInferenceEngine.activeFallbackReason() ?: "")
        put("modelHealth", healthResult(ModelHealthBenchmark.read(context, status.descriptor)))
    }

    private fun healthResult(result: ModelHealthResult): JSObject = JSObject().apply {
        put("health", result.health.name); put("initializationMs", result.initializationMs); put("generationMs", result.generationMs)
        put("estimatedTokensPerSecond", result.estimatedTokensPerSecond); put("backend", result.backend ?: ""); put("reason", result.reason ?: "")
    }
}
