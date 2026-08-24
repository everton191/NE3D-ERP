package br.com.ne3d.erp.ai

import org.junit.Assert.assertEquals
import org.junit.Test

class FunctionGemmaToolPolicyTest {
    private val inventory = FunctionGemmaToolPolicy.Contract(
        canonicalId = "inventory.search",
        wireName = "inventory_search",
        allowedArguments = setOf("query", "status"),
        requiredAny = setOf("query", "status")
    )

    @Test
    fun acceptsValidatedTopKCall() {
        val decision = FunctionGemmaToolPolicy.decide(
            "quanto tem de PLA preto",
            "<start_function_call>call:inventory_search{query:<escape>PLA preto<escape>}<end_function_call>",
            listOf(inventory)
        )
        assertEquals("TOOL_CALL", decision.kind)
        assertEquals("inventory.search", decision.canonicalId)
        assertEquals("PLA preto", decision.arguments["query"])
    }

    @Test
    fun rejectsMissingArgumentsAndOutsideTopK() {
        assertEquals(
            "MISSING_REQUIRED_ARGUMENT",
            FunctionGemmaToolPolicy.decide(
                "dá baixa em 200 gramas",
                "<start_function_call>call:inventory_search{}<end_function_call>",
                listOf(inventory)
            ).reason
        )
        assertEquals(
            "TOOL_OUTSIDE_TOP_K",
            FunctionGemmaToolPolicy.decide(
                "procura PLA",
                "<start_function_call>call:orders_search{query:<escape>PLA<escape>}<end_function_call>",
                listOf(inventory)
            ).reason
        )
    }

    @Test
    fun rejectsWriteIntentAndAmbiguousNavigation() {
        assertEquals(
            "WRITE_INTENT_BLOCKED",
            FunctionGemmaToolPolicy.decide(
                "cancela o pedido 42",
                "<start_function_call>call:inventory_search{query:<escape>42<escape>}<end_function_call>",
                listOf(inventory),
                listOf("cancelar pedido")
            ).reason
        )
        val navigation = FunctionGemmaToolPolicy.Contract(
            canonicalId = "navigation.open",
            wireName = "navigation_open_orders",
            fixedArguments = mapOf("tela" to "pedidos"),
            semanticAnchors = setOf("pedido", "pedidos")
        )
        assertEquals(
            "INTENT_ANCHOR_MISSING",
            FunctionGemmaToolPolicy.decide(
                "abre lá",
                "<start_function_call>call:navigation_open_orders{}<end_function_call>",
                listOf(navigation)
            ).reason
        )
    }
}
