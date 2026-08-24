package br.com.ne3d.erp.ai

import android.os.Debug
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class FunctionGemmaDeviceBenchmarkTest {
    @Test
    fun runsTenSequentialToolCallsWithoutUnboundedPssGrowth() {
        val targetContext = InstrumentationRegistry.getInstrumentation().targetContext
        val installed = FunctionGemmaModelInstaller.verify(targetContext)
        assertNotNull("FunctionGemma GGUF must be verified before benchmark", installed)
        val idlePssKb = Debug.getPss()
        LlamaCppBackend(targetContext).use { backend ->
            backend.load(installed!!.file, FunctionGemmaModelInstaller.EXPECTED_SHA256).get()
            backend.warmup().get()
            val loadedPssKb = Debug.getPss()
            val prompt = """
                <start_of_turn>developer
                You are a model that can do function calling with the following functions<start_function_declaration>declaration:navigation_open_orders{description:<escape>Abre a tela de pedidos.<escape>,parameters:{type:<escape>OBJECT<escape>}}<end_function_declaration><end_of_turn>
                <start_of_turn>user
                abre os pedidos<end_of_turn>
                <start_of_turn>model
            """.trimIndent()
            repeat(10) { index ->
                val envelope = backend.generate(prompt, maxTokens = 16, temperature = 0f, topP = 0.9f, timeoutMs = 45_000)
                val parsed = JSONObject(envelope)
                assertTrue("Sequential call ${index + 1} failed: $envelope", parsed.optBoolean("ok"))
                assertTrue("Sequential call ${index + 1} escaped Top-K: $envelope", parsed.getString("text").contains("call:navigation_open_orders"))
                Log.i("FunctionGemmaBench", "call=${index + 1} pssKb=${Debug.getPss()} envelope=$envelope")
            }
            val afterPssKb = Debug.getPss()
            val growthKb = afterPssKb - loadedPssKb
            Log.i("FunctionGemmaBench", "summary idlePssKb=$idlePssKb loadedPssKb=$loadedPssKb afterPssKb=$afterPssKb growthKb=$growthKb metrics=${backend.nativeGetMetrics()}")
            assertTrue("PSS grew more than 64 MiB across 10 serialized calls: $growthKb KiB", growthKb < 65_536)
        }
    }
}
