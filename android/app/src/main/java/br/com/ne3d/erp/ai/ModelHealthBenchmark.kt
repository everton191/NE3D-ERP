package br.com.ne3d.erp.ai

import android.content.Context
import android.os.SystemClock
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

enum class ModelHealth { NOT_TESTED, READY, SLOW, UNSTABLE, FAILED }

data class ModelHealthResult(
    val health: ModelHealth,
    val initializationMs: Long = 0L,
    val generationMs: Long = 0L,
    val estimatedTokensPerSecond: Double = 0.0,
    val backend: String? = null,
    val reason: String? = null
)

object ModelHealthBenchmark {
    private const val PREFS = "simplifica_ai_model_health_v1"
    private fun prefix(descriptor: LocalModelDescriptor) = "${descriptor.id}:${descriptor.version}:"

    fun read(context: Context, descriptor: LocalModelDescriptor = ModelArtifactManager.selected(context)): ModelHealthResult {
        val values = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val key = prefix(descriptor)
        val health = runCatching { ModelHealth.valueOf(values.getString("${key}health", ModelHealth.NOT_TESTED.name) ?: ModelHealth.NOT_TESTED.name) }.getOrDefault(ModelHealth.NOT_TESTED)
        return ModelHealthResult(
            health = health,
            initializationMs = values.getLong("${key}initialization_ms", 0L),
            generationMs = values.getLong("${key}generation_ms", 0L),
            estimatedTokensPerSecond = Double.fromBits(values.getLong("${key}tokens_per_second", 0.0.toBits())),
            backend = values.getString("${key}backend", null),
            reason = values.getString("${key}reason", null)
        )
    }

    fun run(context: Context, descriptor: LocalModelDescriptor = ModelArtifactManager.selected(context)): ModelHealthResult {
        if (!ModelArtifactManager.isReady(context, descriptor)) return save(context, descriptor, ModelHealthResult(ModelHealth.FAILED, reason = "Modelo não instalado."))
        return try {
            LocalInferenceEngine.unload()
            val initializationStart = SystemClock.elapsedRealtime()
            LocalInferenceEngine.generate(context, "Responda de forma curta em português.", "Responda somente OK.")
            val initializationMs = SystemClock.elapsedRealtime() - initializationStart
            val generationStart = SystemClock.elapsedRealtime()
            val response = LocalInferenceEngine.generate(context, "Responda de forma curta em português.", "Diga apenas: pronto.")
            val generationMs = (SystemClock.elapsedRealtime() - generationStart).coerceAtLeast(1L)
            val estimatedTokens = (response.length / 4.0).coerceAtLeast(1.0)
            val tokensPerSecond = estimatedTokens * 1000.0 / generationMs
            val health = when {
                LocalInferenceEngine.backendName() == null -> ModelHealth.UNSTABLE
                initializationMs > 45_000L || generationMs > 15_000L || tokensPerSecond < 0.4 -> ModelHealth.SLOW
                else -> ModelHealth.READY
            }
            save(context, descriptor, ModelHealthResult(health, initializationMs, generationMs, tokensPerSecond, LocalInferenceEngine.backendName()))
        } catch (error: OutOfMemoryError) {
            LocalInferenceEngine.unload()
            save(context, descriptor, ModelHealthResult(ModelHealth.UNSTABLE, reason = "Memória insuficiente durante o teste."))
        } catch (error: Exception) {
            LocalInferenceEngine.unload()
            save(context, descriptor, ModelHealthResult(ModelHealth.FAILED, reason = error.message ?: "Falha no teste local."))
        }
    }

    fun enqueue(context: Context, descriptor: LocalModelDescriptor) {
        if (read(context, descriptor).health != ModelHealth.NOT_TESTED) return
        val request = OneTimeWorkRequestBuilder<LocalModelBenchmarkWorker>()
            .setConstraints(Constraints.Builder().setRequiresBatteryNotLow(true).build())
            .setInputData(Data.Builder().putString(LocalModelBenchmarkWorker.KEY_MODEL_ID, descriptor.id).build())
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork("simplifica-ai-benchmark-${descriptor.id}-${descriptor.version}", ExistingWorkPolicy.KEEP, request)
    }

    private fun save(context: Context, descriptor: LocalModelDescriptor, result: ModelHealthResult): ModelHealthResult {
        val key = prefix(descriptor)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("${key}health", result.health.name)
            .putLong("${key}initialization_ms", result.initializationMs)
            .putLong("${key}generation_ms", result.generationMs)
            .putLong("${key}tokens_per_second", result.estimatedTokensPerSecond.toBits())
            .putString("${key}backend", result.backend)
            .putString("${key}reason", result.reason)
            .apply()
        return result
    }
}

class LocalModelBenchmarkWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val descriptor = LocalModelCatalog.get(inputData.getString(KEY_MODEL_ID)) ?: return@withContext Result.failure()
        ModelHealthBenchmark.run(applicationContext, descriptor)
        Result.success()
    }

    companion object { const val KEY_MODEL_ID = "modelId" }
}
