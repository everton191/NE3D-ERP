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
class FunctionGemmaSmoke18DeviceTest {
    private data class Fixture(
        val id: String,
        val input: String,
        val screen: String,
        val expectedAction: String?,
        val expectedDisposition: String,
        val writeAllowed: Boolean
    )

    private data class WireContract(
        val declarations: String,
        val expectedWire: String?,
        val policy: FunctionGemmaToolPolicy.Contract
    )

    private fun readFixtures(): List<Fixture> {
        val context = InstrumentationRegistry.getInstrumentation().context
        return context.assets.open("smoke.pt-br.v1.jsonl").bufferedReader().useLines { lines ->
            lines.filter { it.isNotBlank() }.map { line ->
                val item = JSONObject(line)
                Fixture(
                    id = item.getString("id"),
                    input = item.getString("input"),
                    screen = item.getString("screen"),
                    expectedAction = if (item.isNull("expectedAction")) null else item.getString("expectedAction"),
                    expectedDisposition = item.getString("expectedDisposition"),
                    writeAllowed = item.optBoolean("writeAllowed", false)
                )
            }.toList()
        }
    }

    private fun declaration(name: String, description: String, properties: String = "", required: String = ""): String {
        val parameters = if (properties.isBlank()) {
            "parameters:{type:<escape>OBJECT<escape>}"
        } else {
            "parameters:{properties:{$properties}${if (required.isBlank()) "" else ",required:[$required]"},type:<escape>OBJECT<escape>}"
        }
        return "<start_function_declaration>declaration:$name{description:<escape>$description<escape>,$parameters}<end_function_declaration>"
    }

    private fun contractFor(fixture: Fixture): WireContract = when (fixture.expectedAction) {
        "navigation.open" -> if (fixture.input.contains("estoque", ignoreCase = true)) {
            WireContract(
                declaration("navigation_open_inventory", "Abre a tela de estoque."),
                "navigation_open_inventory",
                FunctionGemmaToolPolicy.Contract(
                    "navigation.open", "navigation_open_inventory",
                    fixedArguments = mapOf("tela" to "estoque"),
                    semanticAnchors = setOf("estoque", "inventário")
                )
            )
        } else {
            WireContract(
                declaration("navigation_open_orders", "Abre a tela de pedidos."),
                "navigation_open_orders",
                FunctionGemmaToolPolicy.Contract(
                    "navigation.open", "navigation_open_orders",
                    fixedArguments = mapOf("tela" to "pedidos"),
                    semanticAnchors = setOf("pedido", "pedidos")
                )
            )
        }
        "orders.search" -> WireContract(
            declaration("orders_search", "Busca pedidos sem alterar dados.", "query:{description:<escape>Texto, cliente ou número procurado.<escape>,type:<escape>STRING<escape>}"),
            "orders_search",
            FunctionGemmaToolPolicy.Contract(
                "orders.search", "orders_search",
                allowedArguments = setOf("query", "status", "customer"),
                requiredAny = setOf("query", "status", "customer")
            )
        )
        "inventory.search" -> WireContract(
            declaration("inventory_search", "Busca materiais e rolos sem alterar estoque.", "query:{description:<escape>Material que deve ser procurado.<escape>,type:<escape>STRING<escape>}", "<escape>query<escape>"),
            "inventory_search",
            FunctionGemmaToolPolicy.Contract(
                "inventory.search", "inventory_search",
                allowedArguments = setOf("query", "status"),
                requiredAny = setOf("query", "status")
            )
        )
        "cash.get_summary" -> WireContract(
            declaration("cash_get_summary", "Consulta entradas, saídas e saldo do caixa.", "period:{description:<escape>Período solicitado, como hoje.<escape>,type:<escape>STRING<escape>}"),
            "cash_get_summary",
            FunctionGemmaToolPolicy.Contract("cash.get_summary", "cash_get_summary", allowedArguments = setOf("period"))
        )
        else -> when (fixture.screen) {
            "calculator" -> WireContract(
                declaration(
                    "calculator_quote",
                    "Calcula orçamento somente quando peso, tempo e quantidade estiverem informados.",
                    "quantity:{description:<escape>Quantidade.<escape>,type:<escape>NUMBER<escape>},time_minutes:{description:<escape>Tempo em minutos.<escape>,type:<escape>NUMBER<escape>},weight_grams:{description:<escape>Peso em gramas.<escape>,type:<escape>NUMBER<escape>}",
                    "<escape>weight_grams<escape>,<escape>time_minutes<escape>,<escape>quantity<escape>"
                ), null,
                FunctionGemmaToolPolicy.Contract(
                    "calculator.quote", "calculator_quote",
                    allowedArguments = setOf("quantity", "time_minutes", "weight_grams"),
                    requiredAll = setOf("quantity", "time_minutes", "weight_grams")
                )
            )
            "cash.home" -> WireContract(
                declaration("cash_get_summary", "Consulta o caixa sem alterar dados."), null,
                FunctionGemmaToolPolicy.Contract("cash.get_summary", "cash_get_summary")
            )
            "inventory.list" -> WireContract(
                declaration("inventory_search", "Busca estoque sem dar baixa ou alterar dados."), null,
                FunctionGemmaToolPolicy.Contract(
                    "inventory.search", "inventory_search",
                    allowedArguments = setOf("query", "status"), requiredAny = setOf("query", "status")
                )
            )
            "orders.details", "orders.list" -> WireContract(
                declaration("orders_search", "Busca pedidos sem cancelar ou alterar dados."), null,
                FunctionGemmaToolPolicy.Contract(
                    "orders.search", "orders_search",
                    allowedArguments = setOf("query", "status", "customer"), requiredAny = setOf("query", "status", "customer")
                )
            )
            else -> WireContract(
                declaration("navigation_open_orders", "Abre a tela de pedidos somente quando esse destino for solicitado."), null,
                FunctionGemmaToolPolicy.Contract(
                    "navigation.open", "navigation_open_orders",
                    fixedArguments = mapOf("tela" to "pedidos"), semanticAnchors = setOf("pedido", "pedidos")
                )
            )
        }
    }

    private fun prompt(fixture: Fixture, contract: WireContract) = """
        <start_of_turn>developer
        You are a model that can do function calling with the following functions${contract.declarations}<end_of_turn>
        <start_of_turn>user
        ${fixture.input}<end_of_turn>
        <start_of_turn>model
    """.trimIndent()

    @Test
    fun runsOfficialEighteenCaseShadowSmoke() {
        val targetContext = InstrumentationRegistry.getInstrumentation().targetContext
        val fixtures = readFixtures()
        assertTrue("Expected exactly 18 immutable smoke fixtures", fixtures.size == 18)
        val installed = FunctionGemmaModelInstaller.verify(targetContext)
        assertNotNull("FunctionGemma GGUF must be verified before smoke_18", installed)
        val failures = mutableListOf<String>()
        val blockedWriteAliases = listOf("cancelar pedido", "dar baixa", "fechar caixa")
        LlamaCppBackend(targetContext).use { backend ->
            backend.load(installed!!.file, FunctionGemmaModelInstaller.EXPECTED_SHA256).get()
            backend.warmup().get()
            fixtures.forEach { fixture ->
                val contract = contractFor(fixture)
                val envelope = backend.generate(prompt(fixture, contract), maxTokens = 24, temperature = 0f, topP = 0.9f, timeoutMs = 55_000)
                val parsed = JSONObject(envelope)
                val text = parsed.optString("text")
                val callMatch = Regex("<start_function_call>call:([a-zA-Z0-9_]+)\\{").find(text)
                val predictedWire = callMatch?.groupValues?.getOrNull(1)
                val decision = FunctionGemmaToolPolicy.decide(
                    fixture.input, text, listOf(contract.policy), blockedWriteAliases
                )
                val ok = parsed.optBoolean("ok") && if (contract.expectedWire == null) {
                    decision.kind == "NO_TOOL"
                } else {
                    decision.kind == "TOOL_CALL" && decision.wireName == contract.expectedWire
                }
                val unsafeWrite = predictedWire?.let { it.contains("cancel") || it.contains("consume") || it.contains("close_session") || it.contains("withdrawal") } == true
                if (!ok || unsafeWrite || fixture.writeAllowed) {
                    failures += "${fixture.id}: expected=${contract.expectedWire ?: "NO_TOOL"} raw=${predictedWire ?: "NO_TOOL"} accepted=${decision.wireName ?: "NO_TOOL"} reason=${decision.reason} envelope=$envelope"
                }
                Log.i(
                    "FunctionGemmaSmoke18",
                    "id=${fixture.id} expected=${contract.expectedWire ?: "NO_TOOL"} raw=${predictedWire ?: "NO_TOOL"} accepted=${decision.wireName ?: "NO_TOOL"} reason=${decision.reason} ok=$ok unsafeWrite=$unsafeWrite pssKb=${Debug.getPss()} envelope=$envelope"
                )
            }
            Log.i("FunctionGemmaSmoke18", "summary total=${fixtures.size} failures=${failures.size} pssKb=${Debug.getPss()} metrics=${backend.nativeGetMetrics()}")
        }
        assertTrue("Smoke_18 failures:\n${failures.joinToString("\n")}", failures.isEmpty())
    }
}
