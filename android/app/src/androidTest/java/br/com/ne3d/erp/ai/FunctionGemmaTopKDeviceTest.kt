package br.com.ne3d.erp.ai

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class FunctionGemmaTopKDeviceTest {
    private fun property(name: String, description: String = "Valor solicitado.") =
        FunctionGemmaToolRuntime.Property(name, "STRING", description)

    private fun tool(
        id: String,
        description: String,
        fields: List<String>,
        requiredAll: Set<String> = emptySet(),
        requiredAny: Set<String> = emptySet(),
        operationType: String = "READ"
    ) = FunctionGemmaToolRuntime.Tool(
        FunctionGemmaToolPolicy.Contract(
            canonicalId = id,
            wireName = id.replace('.', '_'),
            operationType = operationType,
            allowedArguments = fields.toSet(),
            requiredAll = requiredAll,
            requiredAny = requiredAny
        ),
        description,
        fields.map(::property)
    )

    @Test
    fun runsProductionStyleTopKAndRejectsWriteIntent() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        FunctionGemmaToolRuntime(context).use { runtime ->
            val navigation = FunctionGemmaToolRuntime.Tool(
                FunctionGemmaToolPolicy.Contract(
                    canonicalId = "navigation.open",
                    wireName = "navigation_open_orders",
                    fixedArguments = mapOf("tela" to "pedidos"),
                    semanticAnchors = setOf("pedido", "pedidos", "ped")
                ),
                "Abre a tela de pedidos."
            )
            val orderTools = listOf(
                navigation,
                tool("orders.get", "Obtém um pedido por ID.", listOf("order_id"), requiredAll = setOf("order_id")),
                tool("orders.prepare_create", "Prepara pedido sem gravar.", listOf("customer_id", "items"), requiredAll = setOf("customer_id", "items"), operationType = "PREPARE"),
                tool("orders.prepare_update", "Prepara edição sem gravar.", listOf("order_id", "proposed", "idempotency_key"), requiredAll = setOf("order_id", "proposed", "idempotency_key"), operationType = "PREPARE"),
                tool("orders.search", "Busca pedidos sem alterar dados.", listOf("query", "status", "customer"), requiredAny = setOf("query", "status", "customer"))
            )
            val opened = runtime.predict("abre os pedidos", orderTools, listOf("cancelar pedido"))
            Log.i("FunctionGemmaTopK", "navigation decision=${opened.decision} envelope=${opened.envelope} metrics=${opened.metrics}")
            assertEquals("TOOL_CALL", opened.decision.kind)
            assertEquals("navigation.open", opened.decision.canonicalId)
            assertEquals("pedidos", opened.decision.arguments["tela"])

            val blocked = runtime.predict("cancela o pedido 42", orderTools, listOf("cancelar pedido"))
            Log.i("FunctionGemmaTopK", "blocked decision=${blocked.decision} envelope=${blocked.envelope} metrics=${blocked.metrics}")
            assertEquals("NO_TOOL", blocked.decision.kind)
            assertEquals("WRITE_INTENT_BLOCKED", blocked.decision.reason)
            assertTrue(blocked.metrics.optString("backend").contains("dotprod"))
        }
    }
}
