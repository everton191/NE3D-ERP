package br.com.ne3d.erp.ai

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.StatFs

data class DeviceCapabilityProfile(
    val totalMemoryBytes: Long,
    val availableMemoryBytes: Long,
    val memoryClassMb: Int,
    val largeMemoryClassMb: Int,
    val freeStorageBytes: Long,
    val abis: List<String>,
    val runtime: String,
    val backendPolicy: String,
    val activeBackend: String?,
    val modelInitialization: String,
    val conclusive: Boolean,
    val conservative: Boolean
)

object DeviceCapabilityProfiler {
    const val RUNTIME = "LiteRT-LM 0.15.0"
    const val BACKEND_POLICY = "GPU_FIRST_CPU_FALLBACK"

    fun profile(context: Context, descriptor: LocalModelDescriptor = ModelArtifactManager.selected(context)): DeviceCapabilityProfile {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memory = ActivityManager.MemoryInfo().also(activityManager::getMemoryInfo)
        val backend = LocalInferenceEngine.backendName()
        val health = ModelHealthBenchmark.read(context, descriptor)
        val initialization = when {
            !ModelArtifactManager.isReady(context, descriptor) -> "MODEL_NOT_INSTALLED"
            health.health == ModelHealth.NOT_TESTED -> "NOT_TESTED"
            health.health == ModelHealth.FAILED -> "FAILED"
            else -> "VERIFIED"
        }
        val abis = Build.SUPPORTED_ABIS?.toList().orEmpty()
        val freeStorage = StatFs(context.filesDir.path).availableBytes
        val conclusive = memory.totalMem > 0L && freeStorage > 0L && abis.isNotEmpty()
        return DeviceCapabilityProfile(
            totalMemoryBytes = memory.totalMem,
            availableMemoryBytes = memory.availMem,
            memoryClassMb = activityManager.memoryClass,
            largeMemoryClassMb = activityManager.largeMemoryClass,
            freeStorageBytes = freeStorage,
            abis = abis,
            runtime = RUNTIME,
            backendPolicy = BACKEND_POLICY,
            activeBackend = backend,
            modelInitialization = initialization,
            conclusive = conclusive,
            conservative = !conclusive || initialization == "NOT_TESTED"
        )
    }
}
