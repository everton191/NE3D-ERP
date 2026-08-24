package br.com.ne3d.erp.ai

import java.text.Normalizer

/**
 * Fail-closed boundary between FunctionGemma text and the Action Registry.
 * It accepts only one call, from the current Top-K, with a valid wire contract.
 */
object FunctionGemmaToolPolicy {
    data class Contract(
        val canonicalId: String,
        val wireName: String,
        val operationType: String = "READ",
        val allowedArguments: Set<String> = emptySet(),
        val requiredAll: Set<String> = emptySet(),
        val requiredAny: Set<String> = emptySet(),
        val fixedArguments: Map<String, Any> = emptyMap(),
        val semanticAnchors: Set<String> = emptySet()
    )

    data class Decision(
        val kind: String,
        val canonicalId: String? = null,
        val wireName: String? = null,
        val arguments: Map<String, Any> = emptyMap(),
        val reason: String,
        val rawTool: String? = null
    )

    private val callPattern = Regex(
        "<start_function_call>\\s*call:([a-zA-Z][a-zA-Z0-9_]*)\\{(.*?)\\}\\s*<end_function_call>",
        setOf(RegexOption.DOT_MATCHES_ALL)
    )
    private val safeName = Regex("^[a-z][a-z0-9_]*$")
    private val stopWords = setOf("a", "as", "o", "os", "um", "uma", "de", "da", "das", "do", "dos", "em", "no", "na", "para", "por", "eu", "esse", "essa")

    fun decide(
        command: String,
        rawText: String,
        topK: List<Contract>,
        blockedWriteAliases: Collection<String> = emptyList()
    ): Decision {
        if (command.isBlank()) return noTool("EMPTY_COMMAND")
        if (topK.isEmpty()) return noTool("NO_ALLOWED_TOOL")
        if (topK.any { it.operationType.equals("WRITE", true) }) return noTool("WRITE_TOOL_IN_TOP_K")
        if (blockedWriteAliases.any { aliasMatches(command, it) }) return noTool("WRITE_INTENT_BLOCKED")

        val matches = callPattern.findAll(rawText).toList()
        if (matches.isEmpty()) return noTool("MODEL_NO_TOOL")
        if (matches.size != 1) return noTool("MULTIPLE_TOOL_CALLS_REJECTED")
        val match = matches.single()
        val rawTool = match.groupValues[1]
        val contract = topK.singleOrNull { it.wireName == rawTool }
            ?: return noTool("TOOL_OUTSIDE_TOP_K", rawTool)
        if (!safeName.matches(contract.wireName)) return noTool("INVALID_WIRE_NAME", rawTool)
        if (contract.semanticAnchors.isNotEmpty() && contract.semanticAnchors.none { aliasMatches(command, it) }) {
            return noTool("INTENT_ANCHOR_MISSING", rawTool)
        }

        val parsed = parseArguments(match.groupValues[2]) ?: return noTool("MALFORMED_ARGUMENTS", rawTool)
        if (parsed.keys.any { it !in contract.allowedArguments }) return noTool("UNKNOWN_ARGUMENT", rawTool)
        val arguments = LinkedHashMap<String, Any>().apply { putAll(parsed); putAll(contract.fixedArguments) }
        if (contract.requiredAll.any { !arguments.hasValue(it) }) return noTool("MISSING_REQUIRED_ARGUMENT", rawTool)
        if (contract.requiredAny.isNotEmpty() && contract.requiredAny.none { arguments.hasValue(it) }) {
            return noTool("MISSING_REQUIRED_ARGUMENT", rawTool)
        }
        return Decision("TOOL_CALL", contract.canonicalId, contract.wireName, arguments, "VALIDATED", rawTool)
    }

    private fun Map<String, Any>.hasValue(key: String): Boolean {
        val value = this[key] ?: return false
        return value !is String || value.isNotBlank()
    }

    private fun parseArguments(body: String): Map<String, Any>? {
        if (body.isBlank()) return emptyMap()
        val parts = mutableListOf<String>()
        var escaped = false
        var quoted = false
        var start = 0
        var index = 0
        while (index < body.length) {
            if (body.startsWith("<escape>", index)) {
                escaped = !escaped
                index += "<escape>".length
                continue
            }
            val char = body[index]
            if (!escaped && char == '"' && (index == 0 || body[index - 1] != '\\')) quoted = !quoted
            if (!escaped && !quoted && char == ',') {
                parts += body.substring(start, index)
                start = index + 1
            }
            index += 1
        }
        if (escaped || quoted) return null
        parts += body.substring(start)
        val result = linkedMapOf<String, Any>()
        for (part in parts) {
            val separator = part.indexOf(':')
            if (separator <= 0) return null
            val key = part.substring(0, separator).trim()
            if (!safeName.matches(key) || result.containsKey(key)) return null
            val raw = part.substring(separator + 1).trim()
            val value: Any = when {
                raw.startsWith("<escape>") && raw.endsWith("<escape>") && raw.length >= 16 -> raw.substring(8, raw.length - 8)
                raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2 -> raw.substring(1, raw.length - 1).replace("\\\"", "\"").replace("\\\\", "\\")
                raw.equals("true", true) -> true
                raw.equals("false", true) -> false
                raw.toLongOrNull() != null -> raw.toLong()
                raw.toDoubleOrNull() != null -> raw.toDouble()
                else -> return null
            }
            result[key] = value
        }
        return result
    }

    private fun aliasMatches(command: String, alias: String): Boolean {
        val commandTokens = tokens(command).map(::stem)
        val aliasTokens = tokens(alias).filterNot { it in stopWords }.map(::stem)
        return aliasTokens.isNotEmpty() && aliasTokens.all { expected -> commandTokens.any { actual -> actual == expected } }
    }

    private fun tokens(value: String): List<String> = Normalizer.normalize(value, Normalizer.Form.NFD)
        .replace(Regex("\\p{M}+"), "")
        .lowercase()
        .replace("cx", "caixa")
        .split(Regex("[^a-z0-9_]+"))
        .filter { it.isNotBlank() }

    private fun stem(value: String): String = when {
        value.length > 5 -> value.take(5)
        value.length > 3 && value.endsWith("r") -> value.dropLast(1)
        else -> value
    }

    private fun noTool(reason: String, rawTool: String? = null) = Decision("NO_TOOL", reason = reason, rawTool = rawTool)
}
