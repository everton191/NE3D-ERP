package br.com.ne3d.erp

import br.com.ne3d.erp.ai.NeedleProvider
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import java.io.FileOutputStream
import java.nio.charset.StandardCharsets
import java.util.UUID

/** Narrow bridge: no raw C API, URL, filesystem path or ERP execution is exposed. */
@CapacitorPlugin(name = "SimplificaNeedle")
class SimplificaNeedlePlugin : Plugin() {
    private val provider by lazy { NeedleProvider(context.applicationContext) }
    private val runIdPattern = Regex("^run-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
    private fun resolve(call: PluginCall, task: () -> java.util.concurrent.Future<org.json.JSONObject>) {
        try { call.resolve(JSObject(task().get().toString())) } catch (error: Exception) { call.reject("Needle 3 não está disponível.", error.message ?: "NEEDLE_FAILED", error) }
    }
    @PluginMethod fun getNeedleStatus(call: PluginCall) = resolve(call) { provider.status() }
    @PluginMethod fun installNeedle(call: PluginCall) = resolve(call) { provider.install() }
    @PluginMethod fun importNeedle(call: PluginCall) { val uri = call.getString("uri", "")?.trim().orEmpty(); if (uri.isBlank()) { call.reject("Informe um content URI selecionado pelo Android.", "NEEDLE_IMPORT_CONTENT_URI_REQUIRED"); return }; resolve(call) { provider.import(uri) } }
    @PluginMethod fun cancelNeedleDownload(call: PluginCall) { call.resolve(JSObject(provider.cancelQueuedDownload().toString())) }
    @PluginMethod fun loadNeedle(call: PluginCall) = resolve(call) { provider.load() }
    @PluginMethod fun runNeedleShadow(call: PluginCall) {
        val input = call.getString("input", "")?.trim().orEmpty(); val systemPrompt = call.getString("systemPrompt", "")?.trim().orEmpty(); val tools = call.getArray("tools") ?: JSArray()
        if (input.isBlank() || systemPrompt.isBlank()) { call.reject("Entrada e instrução do shadow são obrigatórias.", "NEEDLE_SHADOW_REQUEST_INVALID"); return }
        resolve(call) { provider.shadow(input, systemPrompt, org.json.JSONArray(tools.toString())) }
    }
    @PluginMethod fun needleHealth(call: PluginCall) = resolve(call) { provider.health() }
    @PluginMethod fun needleEmbed(call: PluginCall) { val input = call.getString("input", "")?.trim().orEmpty(); if (input.isBlank()) { call.reject("Entrada obrigatória.", "INPUT_REQUIRED"); return }; resolve(call) { provider.embed(input) } }
    @PluginMethod fun deleteNeedle(call: PluginCall) = resolve(call) { provider.delete() }
    private fun runDir(runId: String): File { require(runIdPattern.matches(runId)) { "EVALUATION_RUN_INVALID" }; return File(context.filesDir, "ai/evaluations/needle3/lote-4-3/$runId") }
    private fun file(dir: File, name: String) = File(dir, name)
    private fun asJs(value: JSONObject) = JSObject(value.toString())
    private fun writeAtomic(target: File, text: String) { val tmp = File(target.parentFile, "${target.name}.tmp"); FileOutputStream(tmp).use { out -> out.write(text.toByteArray(StandardCharsets.UTF_8)); out.fd.sync() }; if (!tmp.renameTo(target)) { tmp.delete(); error("EVALUATION_PERSIST_FAILED") } }
    private fun manifest(dir: File): JSONObject { require(dir.isDirectory && file(dir, "manifest.json").isFile) { "EVALUATION_RUN_NOT_FOUND" }; return JSONObject(file(dir, "manifest.json").readText(StandardCharsets.UTF_8)) }
    private fun cases(dir: File): List<JSONObject> = file(dir, "cases.jsonl").takeIf { it.isFile }?.readLines(StandardCharsets.UTF_8)?.filter { it.isNotBlank() }?.map { JSONObject(it) } ?: emptyList()
    private fun expectedIds(manifest: JSONObject): List<String> { val ids = manifest.getJSONArray("caseIds"); return (0 until ids.length()).map { ids.getString(it) } }
    private fun writeCheckpoint(dir: File, manifest: JSONObject, entries: List<JSONObject>, status: String) = JSONObject().put("runId", manifest.getString("runId")).put("status", status).put("completed", entries.size).put("expected", manifest.getInt("totalCases")).put("updatedAt", System.currentTimeMillis()).also { writeAtomic(file(dir, "checkpoint.json"), it.toString()) }
    private fun buildSummary(dir: File, manifest: JSONObject): JSONObject { val entries = cases(dir); val ids = entries.map { it.optString("caseId") }; val expected = expectedIds(manifest); val missing = JSONArray(expected.filterNot { ids.contains(it) }); val duplicateCount = ids.size - ids.toSet().size; val complete = missing.length() == 0 && entries.size == manifest.getInt("totalCases") && duplicateCount == 0; fun metrics(split: String): JSONObject { val group = if (split.isBlank()) entries else entries.filter { it.optString("split") == split }; val latency = group.map { it.optJSONObject("latency")?.optLong("totalMs", 0L) ?: 0L }; return JSONObject().put("completed", group.size).put("intentMatches", group.count { it.optBoolean("intentMatch") }).put("toolExpected", group.count { it.optString("expectedTool").isNotBlank() }).put("toolMatches", group.count { it.optBoolean("toolMatch") }).put("avgLatencyMs", if (latency.isEmpty()) 0 else latency.average()) }; return JSONObject().put("runId", manifest.getString("runId")).put("status", if (complete) "COMPLETED" else "INCOMPLETE").put("completed", entries.size).put("expected", manifest.getInt("totalCases")).put("missingCaseIds", missing).put("duplicateCount", duplicateCount).put("tuning", metrics("tuning")).put("holdout", metrics("holdout")).put("total", metrics("")).put("generatedAt", System.currentTimeMillis()) }
    @PluginMethod fun createNeedleEvaluationRun(call: PluginCall) { try { val total = call.getInt("totalCases", 80); require(total in 1..80) { "EVALUATION_TOTAL_INVALID" }; val ids = JSONArray((call.getArray("caseIds") ?: JSArray()).toString()); require(ids.length() == total) { "EVALUATION_CASE_IDS_REQUIRED" }; val unique = (0 until ids.length()).map { ids.getString(it) }; require(unique.all { it.isNotBlank() } && unique.toSet().size == unique.size) { "EVALUATION_CASE_IDS_INVALID" }; val id = "run-" + UUID.randomUUID(); val dir = runDir(id); require(dir.mkdirs()) { "EVALUATION_RUN_CREATE_FAILED" }; val data = JSONObject().put("runId", id).put("status", "RUNNING").put("startedAt", System.currentTimeMillis()).put("modelRevision", "b274efcb211a9eef48c9a88da4b43bd569696a39").put("totalCases", total).put("caseIds", ids).put("deviceModel", android.os.Build.MODEL).put("androidVersion", android.os.Build.VERSION.RELEASE); writeAtomic(file(dir, "manifest.json"), data.toString()); file(dir, "cases.jsonl").createNewFile(); writeCheckpoint(dir, data, emptyList(), "RUNNING"); call.resolve(asJs(data)) } catch (e: Exception) { call.reject("Falha ao iniciar avaliação.", e.message ?: "EVALUATION_RUN_CREATE_FAILED", e) } }
    @PluginMethod fun appendNeedleEvaluationCase(call: PluginCall) { try { val dir = runDir(call.getString("runId", "")?.trim().orEmpty()); val data = manifest(dir); require(data.optString("status") == "RUNNING") { "EVALUATION_RUN_NOT_RUNNING" }; val record = call.getObject("result") ?: error("EVALUATION_CASE_REQUIRED"); val caseId = record.optString("caseId").trim(); require(caseId in expectedIds(data)) { "EVALUATION_CASE_INVALID" }; val previous = cases(dir); require(previous.none { it.optString("caseId") == caseId }) { "EVALUATION_DUPLICATE_CASE" }; FileOutputStream(file(dir, "cases.jsonl"), true).use { out -> out.write((record.toString() + "\n").toByteArray(StandardCharsets.UTF_8)); out.fd.sync() }; call.resolve(asJs(writeCheckpoint(dir, data, cases(dir), "RUNNING"))) } catch (e: Exception) { call.reject("Falha ao persistir avaliação.", e.message ?: "EVALUATION_APPEND_FAILED", e) } }
    @PluginMethod fun getNeedleEvaluationRun(call: PluginCall) { try { val dir = runDir(call.getString("runId", "")?.trim().orEmpty()); val data = manifest(dir); val entries = cases(dir); call.resolve(asJs(JSONObject(data.toString()).put("completed", entries.size).put("caseIds", JSONArray(entries.map { it.optString("caseId") })))) } catch (e: Exception) { call.reject("Run não encontrado.", e.message ?: "EVALUATION_RUN_NOT_FOUND", e) } }
    @PluginMethod fun interruptNeedleEvaluationRun(call: PluginCall) { try { val dir = runDir(call.getString("runId", "")?.trim().orEmpty()); val data = manifest(dir); require(data.optString("status") == "RUNNING") { "EVALUATION_RUN_NOT_RUNNING" }; data.put("status", "INTERRUPTED").put("updatedAt", System.currentTimeMillis()); writeAtomic(file(dir, "manifest.json"), data.toString()); call.resolve(asJs(writeCheckpoint(dir, data, cases(dir), "INTERRUPTED"))) } catch (e: Exception) { call.reject("Falha ao interromper avaliação.", e.message ?: "EVALUATION_INTERRUPT_FAILED", e) } }
    @PluginMethod fun resumeNeedleEvaluationRun(call: PluginCall) { try { val dir = runDir(call.getString("runId", "")?.trim().orEmpty()); val data = manifest(dir); require(data.optString("status") == "INTERRUPTED") { "EVALUATION_RUN_NOT_INTERRUPTED" }; data.put("status", "RUNNING").put("updatedAt", System.currentTimeMillis()); writeAtomic(file(dir, "manifest.json"), data.toString()); call.resolve(asJs(writeCheckpoint(dir, data, cases(dir), "RUNNING"))) } catch (e: Exception) { call.reject("Falha ao retomar avaliação.", e.message ?: "EVALUATION_RESUME_FAILED", e) } }
    @PluginMethod fun finalizeNeedleEvaluationRun(call: PluginCall) { try { val dir = runDir(call.getString("runId", "")?.trim().orEmpty()); val data = manifest(dir); val result = buildSummary(dir, data); data.put("status", result.getString("status")).put("updatedAt", System.currentTimeMillis()); writeAtomic(file(dir, "manifest.json"), data.toString()); writeCheckpoint(dir, data, cases(dir), result.getString("status")); writeAtomic(file(dir, "summary.json"), result.toString()); call.resolve(asJs(result)) } catch (e: Exception) { call.reject("Falha ao finalizar avaliação.", e.message ?: "EVALUATION_SUMMARY_FAILED", e) } }
    @PluginMethod fun getNeedleEvaluationSummary(call: PluginCall) { try { val dir = runDir(call.getString("runId", "")?.trim().orEmpty()); require(file(dir, "summary.json").isFile) { "EVALUATION_SUMMARY_NOT_FOUND" }; call.resolve(asJs(JSONObject(file(dir, "summary.json").readText(StandardCharsets.UTF_8)))) } catch (e: Exception) { call.reject("Summary não encontrado.", e.message ?: "EVALUATION_SUMMARY_NOT_FOUND", e) } }
    override fun handleOnDestroy() { provider.close(); super.handleOnDestroy() }
}
