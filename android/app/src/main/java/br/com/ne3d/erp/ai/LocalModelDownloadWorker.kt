package br.com.ne3d.erp.ai

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest

class LocalModelDownloadWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val workToken = inputData.getString(KEY_WORK_TOKEN).orEmpty()
        val descriptor = LocalModelCatalog.get(inputData.getString(KEY_MODEL_ID)) ?: return@withContext failure("Modelo desconhecido.", workToken)
        if (!ModelArtifactManager.isActiveWork(applicationContext, workToken)) return@withContext Result.failure()
        val destination = LocalModelCatalog.modelFile(applicationContext, descriptor)
        if (ModelArtifactManager.isReady(applicationContext, descriptor)) return@withContext Result.success()
        destination.parentFile?.mkdirs()
        val temporary = LocalModelCatalog.temporaryFile(applicationContext, descriptor)
        val existing = temporary.let { if (it.exists()) it.length() else 0L }
        var connection: HttpURLConnection? = null
        try {
            connection = (URL(descriptor.url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 20_000; readTimeout = 45_000; instanceFollowRedirects = true
                setRequestProperty("Accept", "application/octet-stream")
                if (existing > 0) setRequestProperty("Range", "bytes=$existing-")
            }
            connection.connect()
            val resumed = existing > 0 && connection.responseCode == HttpURLConnection.HTTP_PARTIAL
            if (connection.responseCode !in 200..299) return@withContext retryOrFail("Servidor respondeu ${connection.responseCode}.", workToken)
            val offset = if (resumed) existing else 0L
            if (!resumed && existing > 0) temporary.delete()
            RandomAccessFile(temporary, "rw").use { output ->
                if (resumed) output.seek(offset) else output.setLength(0)
                connection.inputStream.use { input ->
                    val buffer = ByteArray(DEFAULT_BUFFER_SIZE * 4)
                    var downloaded = offset
                    while (true) {
                        if (isStopped || !ModelArtifactManager.isActiveWork(applicationContext, workToken)) return@withContext Result.failure()
                        val count = input.read(buffer)
                        if (count < 0) break
                        if (isStopped || !ModelArtifactManager.isActiveWork(applicationContext, workToken)) return@withContext Result.failure()
                        output.write(buffer, 0, count)
                        downloaded += count
                        if (!ModelArtifactManager.updateProgressFromWorker(applicationContext, workToken, ModelInstallState.DOWNLOADING, downloaded, descriptor.downloadBytes)) return@withContext Result.failure()
                        setProgress(Data.Builder().putString(KEY_STAGE, "DOWNLOADING").putLong(KEY_DOWNLOADED, downloaded).putLong(KEY_TOTAL, descriptor.downloadBytes).build())
                    }
                }
                output.fd.sync()
            }
            if (temporary.length() != descriptor.downloadBytes) return@withContext retryOrFail("O download terminou com tamanho incorreto.", workToken)
            if (isStopped || !ModelArtifactManager.isActiveWork(applicationContext, workToken)) return@withContext Result.failure()
            setProgress(Data.Builder().putString(KEY_STAGE, "VERIFYING").putLong(KEY_DOWNLOADED, temporary.length()).putLong(KEY_TOTAL, descriptor.downloadBytes).build())
            if (!ModelArtifactManager.updateProgressFromWorker(applicationContext, workToken, ModelInstallState.VERIFYING, temporary.length(), descriptor.downloadBytes)) return@withContext Result.failure()
            if (!sha256(temporary).equals(descriptor.sha256, ignoreCase = true)) { temporary.delete(); return@withContext retryOrFail("A verificação de integridade falhou.", workToken) }
            if (isStopped || !ModelArtifactManager.isActiveWork(applicationContext, workToken)) return@withContext Result.failure()
            setProgress(Data.Builder().putString(KEY_STAGE, "INSTALLING").putLong(KEY_DOWNLOADED, temporary.length()).putLong(KEY_TOTAL, descriptor.downloadBytes).build())
            if (!ModelArtifactManager.updateProgressFromWorker(applicationContext, workToken, ModelInstallState.INSTALLING, temporary.length(), descriptor.downloadBytes)) return@withContext Result.failure()
            runCatching { Files.move(temporary.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE) }
                .getOrElse { Files.move(temporary.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING) }
            if (!ModelArtifactManager.markVerifiedFromWorker(applicationContext, workToken, descriptor)) return@withContext Result.failure()
            Result.success()
        } catch (error: Exception) {
            if (isStopped || !ModelArtifactManager.isActiveWork(applicationContext, workToken)) Result.failure()
            else retryOrFail(error.message ?: "Falha de conexão durante o download.", workToken)
        } finally { connection?.disconnect() }
    }

    private fun retryOrFail(message: String, workToken: String): Result = if (runAttemptCount < 3) Result.retry() else failure(message, workToken)
    private fun failure(message: String, workToken: String): Result {
        val descriptor = LocalModelCatalog.get(inputData.getString(KEY_MODEL_ID))
        ModelArtifactManager.updateProgressFromWorker(applicationContext, workToken, ModelInstallState.FAILED, descriptor?.let { LocalModelCatalog.temporaryFile(applicationContext, it).let { file -> if (file.exists()) file.length() else 0L } } ?: 0L, descriptor?.downloadBytes ?: 0L, message)
        return Result.failure(Data.Builder().putString(KEY_ERROR, message).build())
    }
    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input -> val buffer = ByteArray(DEFAULT_BUFFER_SIZE * 4); while (true) { val count = input.read(buffer); if (count < 0) break; digest.update(buffer, 0, count) } }
        return digest.digest().joinToString("") { "%02X".format(it) }
    }

    companion object {
        const val KEY_MODEL_ID = "modelId"
        const val KEY_WORK_TOKEN = "workToken"
        const val KEY_STAGE = "stage"
        const val KEY_DOWNLOADED = "downloadedBytes"
        const val KEY_TOTAL = "totalBytes"
        const val KEY_ERROR = "error"
    }
}
