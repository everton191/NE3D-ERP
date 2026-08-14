package br.com.ne3d.erp.ai

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.StatFs
import java.io.File

enum class LocalModelProfile { LIGHT, BALANCED, ADVANCED }

data class LocalModelCapabilities(val text: Boolean, val vision: Boolean, val audio: Boolean, val tools: Boolean)

data class LocalModelDescriptor(
    val id: String,
    val displayName: String,
    val profile: LocalModelProfile,
    val version: String,
    val fileName: String,
    val url: String,
    val downloadBytes: Long,
    val sha256: String,
    val minimumMemoryBytes: Long,
    val capabilities: LocalModelCapabilities,
    val available: Boolean,
    val experimental: Boolean = false
)

data class LocalModelCompatibility(val compatible: Boolean, val reason: String? = null)

object LocalModelCatalog {
    private const val MB = 1024L * 1024L
    private const val STORAGE_MARGIN = 512L * MB

    val light = LocalModelDescriptor(
        id = "qwen2.5-1.5b-instruct",
        displayName = "IA Leve",
        profile = LocalModelProfile.LIGHT,
        version = "planned",
        fileName = "",
        url = "",
        downloadBytes = 0,
        sha256 = "",
        minimumMemoryBytes = 3_500L * MB,
        capabilities = LocalModelCapabilities(text = true, vision = false, audio = false, tools = true),
        available = false,
        experimental = true
    )

    val balanced = LocalModelDescriptor(
        id = "gemma-4-e2b-it",
        displayName = "IA Equilibrada",
        profile = LocalModelProfile.BALANCED,
        version = "2026-05-05",
        fileName = "gemma-4-E2B-it.litertlm",
        url = "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/6b78abd019e61a1ca4cbe3b212d2c9ce8ff38a94/gemma-4-E2B-it.litertlm?download=true",
        downloadBytes = 2_588_147_712L,
        sha256 = "181938105E0EEFD105961417E8DA75903EACDA102C4FCE9CE90F50B97139A63C",
        minimumMemoryBytes = 5_500L * MB,
        capabilities = LocalModelCapabilities(text = true, vision = true, audio = false, tools = true),
        available = true
    )

    val advanced = LocalModelDescriptor(
        id = "gemma-4-e4b-it",
        displayName = "IA Avançada",
        profile = LocalModelProfile.ADVANCED,
        version = "planned",
        fileName = "",
        url = "",
        downloadBytes = 0,
        sha256 = "",
        minimumMemoryBytes = 9_000L * MB,
        capabilities = LocalModelCapabilities(text = true, vision = true, audio = false, tools = true),
        available = false,
        experimental = true
    )

    val artifacts = listOf(light, balanced, advanced)

    fun get(id: String?): LocalModelDescriptor? = artifacts.firstOrNull { it.id == id }
    fun recommended(context: Context): LocalModelDescriptor = balanced
    fun modelFile(context: Context, descriptor: LocalModelDescriptor): File = File(File(File(context.filesDir, "models"), descriptor.id), "${descriptor.version}/${descriptor.fileName}")
    fun temporaryFile(context: Context, descriptor: LocalModelDescriptor): File = File(modelFile(context, descriptor).parentFile, "${descriptor.fileName}.part")

    fun compatibility(context: Context, descriptor: LocalModelDescriptor): LocalModelCompatibility {
        if (!descriptor.available) return LocalModelCompatibility(false, "Este modelo ainda está em validação para este aplicativo.")
        val memoryInfo = ActivityManager.MemoryInfo()
        (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memoryInfo)
        val existing = modelFile(context, descriptor).let { it.exists() && it.length() == descriptor.downloadBytes }
        return when {
            Build.SUPPORTED_ABIS.none { it.equals("arm64-v8a", ignoreCase = true) } -> LocalModelCompatibility(false, "Este aparelho não usa processador ARM64 compatível.")
            memoryInfo.totalMem < descriptor.minimumMemoryBytes -> LocalModelCompatibility(false, "Este aparelho tem pouca memória para este modelo.")
            !existing && StatFs(context.filesDir.path).availableBytes < descriptor.downloadBytes + STORAGE_MARGIN -> LocalModelCompatibility(false, "Não há espaço livre suficiente para baixar este modelo.")
            else -> LocalModelCompatibility(true)
        }
    }
}
