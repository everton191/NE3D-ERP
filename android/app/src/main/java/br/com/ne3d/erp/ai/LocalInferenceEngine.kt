package br.com.ne3d.erp.ai

import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig

object LocalInferenceEngine {
    @Volatile private var engine: Engine? = null
    @Volatile private var modelPath: String? = null
    @Volatile private var backend: String? = null
    @Volatile private var visionEnabled: Boolean = false
    @Volatile private var fallbackFromModelId: String? = null
    @Volatile private var fallbackModelId: String? = null
    @Volatile private var fallbackReason: String? = null

    @Synchronized
    fun generate(context: Context, systemInstruction: String, prompt: String, imagePath: String? = null): String {
        check(ModelArtifactManager.isEnabled(context)) { "O assistente local está desativado." }
        val selected = ModelArtifactManager.selected(context)
        val retainedFallback = fallbackModelId?.let(LocalModelCatalog::get)?.takeIf {
            ModelArtifactManager.isAutomatic(context) && fallbackFromModelId == selected.id && ModelArtifactManager.isReady(context, it)
        }
        val descriptor = retainedFallback ?: selected
        check(ModelArtifactManager.isReady(context, descriptor)) { "O modelo ainda não foi instalado neste aplicativo." }
        val needsVision = !imagePath.isNullOrBlank()
        check(!needsVision || descriptor.capabilities.vision) { "Este modelo não aceita imagens." }
        if (retainedFallback != null) return generateWithDescriptor(context, descriptor, systemInstruction, prompt, imagePath)
        fallbackFromModelId = null; fallbackModelId = null; fallbackReason = null
        return runCatching { generateWithDescriptor(context, descriptor, systemInstruction, prompt, imagePath) }.getOrElse { primaryError ->
            val fallback = ModelArtifactManager.automaticFallback(context, descriptor, needsVision)
            if (fallback == null) {
                if (ModelArtifactManager.isAutomatic(context) && descriptor.profile == LocalModelProfile.ADVANCED && !ModelArtifactManager.isReady(context, LocalModelCatalog.balanced)) {
                    throw IllegalStateException("A IA Avançada não conseguiu iniciar neste aparelho. A IA Equilibrada é mais compatível e pode ser baixada somente com sua autorização.", primaryError)
                }
                throw primaryError
            }
            unloadRuntime()
            val response = generateWithDescriptor(context, fallback, systemInstruction, prompt, imagePath)
            fallbackFromModelId = descriptor.id
            fallbackModelId = fallback.id
            fallbackReason = "${descriptor.displayName} não iniciou; ${fallback.displayName} foi usada sem novo download."
            response
        }
    }

    private fun generateWithDescriptor(context: Context, descriptor: LocalModelDescriptor, systemInstruction: String, prompt: String, imagePath: String? = null): String {
        val model = LocalModelCatalog.modelFile(context, descriptor)
        val needsVision = !imagePath.isNullOrBlank()
        val instance = if (engine != null && modelPath == model.absolutePath && visionEnabled == needsVision) engine!! else {
            engine?.close(); createEngine(context, model.absolutePath, needsVision).also { engine = it; modelPath = model.absolutePath; visionEnabled = needsVision }
        }
        return runCatching { send(instance, systemInstruction, prompt, imagePath) }.getOrElse { gpuError ->
            if (backend != "GPU" || needsVision) throw gpuError
            engine?.close()
            val cpu = Engine(EngineConfig(modelPath = model.absolutePath, backend = Backend.CPU(), cacheDir = context.cacheDir.absolutePath)).also { it.initialize() }
            engine = cpu; backend = "CPU"; visionEnabled = false; send(cpu, systemInstruction, prompt)
        }
    }

    private fun send(instance: Engine, systemInstruction: String, prompt: String, imagePath: String? = null): String = instance.createConversation(
        ConversationConfig(systemInstruction = com.google.ai.edge.litertlm.Contents.of(systemInstruction), samplerConfig = SamplerConfig(temperature = 0.2, topK = 20, topP = 0.8))
    ).use { conversation ->
        val response = if (imagePath.isNullOrBlank()) conversation.sendMessage(prompt)
        else conversation.sendMessage(com.google.ai.edge.litertlm.Contents.of(Content.ImageFile(imagePath), Content.Text(prompt)))
        response.contents.contents.filterIsInstance<Content.Text>().joinToString("") { it.text }
    }

    fun backendName(): String? = backend
    fun activeFallbackFrom(): String? = fallbackFromModelId
    fun activeFallbackModel(): String? = fallbackModelId
    fun activeFallbackReason(): String? = fallbackReason
    @Synchronized private fun unloadRuntime() { engine?.close(); engine = null; modelPath = null; backend = null; visionEnabled = false }
    @Synchronized fun unload() { unloadRuntime(); fallbackFromModelId = null; fallbackModelId = null; fallbackReason = null }
    private fun createEngine(context: Context, path: String, vision: Boolean): Engine = runCatching {
        Engine(EngineConfig(modelPath = path, backend = Backend.GPU(), visionBackend = if (vision) Backend.GPU() else null, maxNumImages = if (vision) 1 else null, cacheDir = context.cacheDir.absolutePath)).also { it.initialize(); backend = "GPU" }
    }.getOrElse {
        if (vision) throw IllegalStateException("A análise de imagem não pôde iniciar com aceleração neste aparelho.", it)
        Engine(EngineConfig(modelPath = path, backend = Backend.CPU(), cacheDir = context.cacheDir.absolutePath)).also { it.initialize(); backend = "CPU" }
    }
}
