package br.com.ne3d.erp.ai

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject

/** Device-only proof of the private artifact, JNI lifecycle and a READ-only tool-shaped response. */
@RunWith(AndroidJUnit4::class)
class FunctionGemmaDeviceSmokeTest {
    private fun prompt(declarations: String, command: String) = """
        <start_of_turn>developer
        You are a model that can do function calling with the following functions$declarations<end_of_turn>
        <start_of_turn>user
        $command<end_of_turn>
        <start_of_turn>model
    """.trimIndent()

    private fun runCase(backend: LlamaCppBackend, id: String, prompt: String, maxTokens: Int = 24): JSONObject {
        val envelope = backend.generate(prompt, maxTokens = maxTokens, temperature = 0f, topP = 0.9f, timeoutMs = 45_000)
        val parsed = JSONObject(envelope)
        Log.i("FunctionGemmaTest", "case=$id result=$envelope metrics=${backend.nativeGetMetrics()}")
        assertTrue("$id must return a structured success envelope: $envelope", parsed.optBoolean("ok"))
        return parsed
    }

    @Test
    fun runsThreeReadOnlyPortugueseSmokeCases() {
        val targetContext = InstrumentationRegistry.getInstrumentation().targetContext
        val installed = FunctionGemmaModelInstaller.verify(targetContext)
        assertNotNull("FunctionGemma GGUF must be verified before inference", installed)
        LlamaCppBackend(targetContext).use { backend ->
            backend.load(installed!!.file, FunctionGemmaModelInstaller.EXPECTED_SHA256).get()
            backend.warmup().get()
            // Navigation is specialized only at the wire boundary. The adapter maps this
            // back to navigation.open with { tela: "pedidos" } before schema validation.
            val navigationDeclaration = "<start_function_declaration>declaration:navigation_open_orders{description:<escape>Abre a tela de pedidos.<escape>,parameters:{type:<escape>OBJECT<escape>}}<end_function_declaration>"
            val navigation = runCase(backend, "navigation", prompt(navigationDeclaration, "abre os pedidos"))
                .getString("text")
            assertTrue("navigation.open expected through navigation_open_orders: $navigation", navigation.contains("call:navigation_open_orders"))

            val inventoryDeclaration = "<start_function_declaration>declaration:inventory_search{description:<escape>Busca materiais e rolos sem alterar estoque.<escape>,parameters:{properties:{query:{description:<escape>Material que deve ser procurado.<escape>,type:<escape>STRING<escape>}},required:[<escape>query<escape>],type:<escape>OBJECT<escape>}}<end_function_declaration>"
            val inventory = runCase(backend, "inventory", prompt(inventoryDeclaration, "quanto tenho de PLA preto?"))
                .getString("text")
            assertTrue("inventory.search expected through inventory_search: $inventory", inventory.contains("call:inventory_search"))
            assertTrue("inventory query must preserve PLA preto: $inventory", inventory.contains("PLA", ignoreCase = true) && inventory.contains("preto", ignoreCase = true))

            val readOnlyOrdersDeclaration = "<start_function_declaration>declaration:orders_search{description:<escape>Busca pedidos sem alterar ou cancelar dados.<escape>,parameters:{properties:{query:{description:<escape>Pedido que deve ser procurado.<escape>,type:<escape>STRING<escape>}},type:<escape>OBJECT<escape>}}<end_function_declaration>"
            val negative = runCase(backend, "negative", prompt(readOnlyOrdersDeclaration, "se eu cancelar esse pedido o que acontece?"), maxTokens = 20)
                .getString("text")
            assertFalse("negative case must not produce a tool call: $negative", negative.contains("<start_function_call>"))
        }
    }
}
