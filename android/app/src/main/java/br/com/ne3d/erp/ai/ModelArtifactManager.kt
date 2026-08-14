package br.com.ne3d.erp.ai

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import java.util.UUID
import java.util.concurrent.TimeUnit

enum class ModelInstallState { NOT_INSTALLED, CHECKING, DOWNLOADING, VERIFYING, INSTALLING, READY, FAILED, UPDATE_AVAILABLE, INCOMPATIBLE, EXPERIMENTAL }

data class ModelArtifactStatus(
    val descriptor: LocalModelDescriptor,
    val state: ModelInstallState,
    val enabled: Boolean,
    val downloadedBytes: Long,
    val totalBytes: Long,
    val reason: String? = null,
    val backend: String? = null
)

object ModelArtifactManager {
    private const val PREFS = "simplifica_local_ai_v1"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_SELECTION = "selection"
    private const val KEY_VERIFIED_ID = "verified_id"
    private const val KEY_VERIFIED_VERSION = "verified_version"
    private const val KEY_VERIFIED_SHA = "verified_sha"
    private const val KEY_STATE = "state"
    private const val KEY_DOWNLOADED = "downloaded"
    private const val KEY_TOTAL = "total"
    private const val KEY_ERROR = "error"
    private const val KEY_WORK_TOKEN = "work_token"
    private const val AUTOMATIC = "automatic"
    const val WORK_NAME = "simplifica-3d-local-model-v1"

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun verifiedVersionKey(descriptor: LocalModelDescriptor) = "verified_${descriptor.id}_version"
    private fun verifiedShaKey(descriptor: LocalModelDescriptor) = "verified_${descriptor.id}_sha"
    fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)
    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
        if (!enabled) LocalInferenceEngine.unload()
        else selected(context).takeIf { isReady(context, it) }?.let { ModelHealthBenchmark.enqueue(context, it) }
    }
    fun selection(context: Context): String = prefs(context).getString(KEY_SELECTION, AUTOMATIC) ?: AUTOMATIC
    fun isAutomatic(context: Context): Boolean = selection(context) == AUTOMATIC
    fun setSelection(context: Context, id: String) { require(id == AUTOMATIC || LocalModelCatalog.get(id) != null); prefs(context).edit().putString(KEY_SELECTION, id).apply() }

    fun selected(context: Context): LocalModelDescriptor {
        val explicit = LocalModelCatalog.get(selection(context))
        if (explicit != null) return explicit
        val values = prefs(context)
        return LocalModelCatalog.artifacts.asReversed().firstOrNull { descriptor ->
            descriptor.available && LocalModelCatalog.compatibility(context, descriptor).compatible && modelIsVerified(context, descriptor, values)
        } ?: LocalModelCatalog.recommended(context)
    }

    fun isReady(context: Context, descriptor: LocalModelDescriptor = selected(context)): Boolean {
        return modelIsVerified(context, descriptor, prefs(context))
    }

    fun automaticFallback(context: Context, failed: LocalModelDescriptor, needsVision: Boolean): LocalModelDescriptor? {
        if (!isAutomatic(context) || failed.id == LocalModelCatalog.balanced.id) return null
        val balanced = LocalModelCatalog.balanced
        val compatible = LocalModelCatalog.compatibility(context, balanced).compatible
        val supportsRequest = balanced.capabilities.text && (!needsVision || balanced.capabilities.vision)
        return balanced.takeIf { it.available && compatible && supportsRequest && isReady(context, it) }
    }

    private fun modelIsVerified(context: Context, descriptor: LocalModelDescriptor, values: android.content.SharedPreferences): Boolean {
        val file = LocalModelCatalog.modelFile(context, descriptor)
        val scoped = values.getString(verifiedVersionKey(descriptor), "") == descriptor.version &&
            values.getString(verifiedShaKey(descriptor), "").equals(descriptor.sha256, ignoreCase = true)
        val legacy = values.getString(KEY_VERIFIED_ID, "") == descriptor.id &&
            values.getString(KEY_VERIFIED_VERSION, "") == descriptor.version &&
            values.getString(KEY_VERIFIED_SHA, "").equals(descriptor.sha256, ignoreCase = true)
        if (legacy && !scoped) prefs(context).edit()
            .putString(verifiedVersionKey(descriptor), descriptor.version)
            .putString(verifiedShaKey(descriptor), descriptor.sha256)
            .remove(KEY_WORK_TOKEN)
            .apply()
        if ((scoped || legacy) && selection(context) == descriptor.id &&
            values.getString(KEY_STATE, "") == ModelInstallState.READY.name && values.contains(KEY_WORK_TOKEN)) {
            prefs(context).edit().remove(KEY_WORK_TOKEN).apply()
        }
        return file.exists() && file.length() == descriptor.downloadBytes && (scoped || legacy)
    }

    fun status(context: Context): ModelArtifactStatus {
        val descriptor = selected(context)
        val compatibility = LocalModelCatalog.compatibility(context, descriptor)
        if (!descriptor.available) return ModelArtifactStatus(descriptor, ModelInstallState.EXPERIMENTAL, isEnabled(context), 0, descriptor.downloadBytes, compatibility.reason)
        if (!compatibility.compatible) return ModelArtifactStatus(descriptor, ModelInstallState.INCOMPATIBLE, isEnabled(context), 0, descriptor.downloadBytes, compatibility.reason)
        if (isReady(context, descriptor)) return ModelArtifactStatus(descriptor, ModelInstallState.READY, isEnabled(context), descriptor.downloadBytes, descriptor.downloadBytes, backend = LocalInferenceEngine.backendName())
        val values = prefs(context)
        val state = runCatching { ModelInstallState.valueOf(values.getString(KEY_STATE, ModelInstallState.NOT_INSTALLED.name) ?: ModelInstallState.NOT_INSTALLED.name) }.getOrDefault(ModelInstallState.NOT_INSTALLED)
        val downloaded = maxOf(values.getLong(KEY_DOWNLOADED, 0L), LocalModelCatalog.temporaryFile(context, descriptor).let { if (it.exists()) it.length() else 0L })
        return ModelArtifactStatus(descriptor, state, isEnabled(context), downloaded, values.getLong(KEY_TOTAL, descriptor.downloadBytes), values.getString(KEY_ERROR, null))
    }

    fun install(context: Context, modelId: String): ModelArtifactStatus {
        val descriptor = requireNotNull(LocalModelCatalog.get(modelId)) { "Modelo desconhecido." }
        require(descriptor.available) { "Este modelo ainda não está disponível." }
        val compatibility = LocalModelCatalog.compatibility(context, descriptor)
        require(compatibility.compatible) { compatibility.reason ?: "Modelo incompatível." }
        setSelection(context, descriptor.id)
        setEnabled(context, true)
        val workToken = UUID.randomUUID().toString()
        val downloaded = LocalModelCatalog.temporaryFile(context, descriptor).let { if (it.exists()) it.length() else 0L }
        prefs(context).edit()
            .putString(KEY_WORK_TOKEN, workToken)
            .putString(KEY_STATE, ModelInstallState.DOWNLOADING.name)
            .putLong(KEY_DOWNLOADED, downloaded)
            .putLong(KEY_TOTAL, descriptor.downloadBytes)
            .remove(KEY_ERROR)
            .commit()
        val request = OneTimeWorkRequestBuilder<LocalModelDownloadWorker>()
            .setInputData(Data.Builder().putString(LocalModelDownloadWorker.KEY_MODEL_ID, descriptor.id).putString(LocalModelDownloadWorker.KEY_WORK_TOKEN, workToken).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.KEEP, request)
        return status(context)
    }

    fun cancel(context: Context) {
        prefs(context).edit().remove(KEY_WORK_TOKEN).commit()
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        updateProgress(context, ModelInstallState.NOT_INSTALLED, LocalModelCatalog.temporaryFile(context, selected(context)).let { if (it.exists()) it.length() else 0L }, selected(context).downloadBytes)
    }
    fun delete(context: Context, modelId: String) {
        val descriptor = requireNotNull(LocalModelCatalog.get(modelId))
        if (selected(context).id == descriptor.id) LocalInferenceEngine.unload()
        LocalModelCatalog.modelFile(context, descriptor).delete()
        LocalModelCatalog.temporaryFile(context, descriptor).delete()
        val values = prefs(context)
        val editor = values.edit().remove(KEY_WORK_TOKEN).remove(verifiedVersionKey(descriptor)).remove(verifiedShaKey(descriptor))
        if (values.getString(KEY_VERIFIED_ID, "") == descriptor.id) editor.remove(KEY_VERIFIED_ID).remove(KEY_VERIFIED_VERSION).remove(KEY_VERIFIED_SHA)
        editor.apply()
        updateProgress(context, ModelInstallState.NOT_INSTALLED, 0L, descriptor.downloadBytes)
    }
    internal fun isActiveWork(context: Context, token: String): Boolean = token.isNotBlank() && prefs(context).getString(KEY_WORK_TOKEN, "") == token
    internal fun updateProgressFromWorker(context: Context, token: String, state: ModelInstallState, downloaded: Long, total: Long, error: String? = null): Boolean {
        if (!isActiveWork(context, token)) return false
        updateProgress(context, state, downloaded, total, error)
        return true
    }
    internal fun updateProgress(context: Context, state: ModelInstallState, downloaded: Long, total: Long, error: String? = null) {
        prefs(context).edit().putString(KEY_STATE, state.name).putLong(KEY_DOWNLOADED, downloaded).putLong(KEY_TOTAL, total).putString(KEY_ERROR, error).apply()
    }
    internal fun markVerifiedFromWorker(context: Context, token: String, descriptor: LocalModelDescriptor): Boolean {
        if (!isActiveWork(context, token)) return false
        prefs(context).edit()
            .putString(verifiedVersionKey(descriptor), descriptor.version).putString(verifiedShaKey(descriptor), descriptor.sha256)
            .putString(KEY_VERIFIED_ID, descriptor.id).putString(KEY_VERIFIED_VERSION, descriptor.version).putString(KEY_VERIFIED_SHA, descriptor.sha256)
            .remove(KEY_WORK_TOKEN).apply()
        updateProgress(context, ModelInstallState.READY, descriptor.downloadBytes, descriptor.downloadBytes)
        if (isEnabled(context)) ModelHealthBenchmark.enqueue(context, descriptor)
        return true
    }
}
