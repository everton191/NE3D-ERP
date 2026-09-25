package br.com.ne3d.erp.carousel3d

/**
 * Um atalho real da Home que o carrossel nativo deve renderizar.
 *
 * Os dados vêm do web (SimplificaHomeCarouselConfig + presentations do dashboard);
 * aqui eles apenas ganham uma forma tipada e saneada para o renderer.
 */
data class CarouselModule(
    val id: String,
    val title: String,
    val targetScreen: String,
    val detail: String,
    val live: List<String>,
) {
    val accentColor: Int get() = CarouselModulePalette.colorFor(id)
}

/** Entrada crua, ainda sem saneamento, tal como lida do bridge. */
data class RawCarouselModule(
    val id: String?,
    val title: String?,
    val targetScreen: String?,
    val detail: String?,
    val live: List<String>?,
)

object CarouselModulePalette {
    private val colors = mapOf(
        "production" to 0xFF1B7F79.toInt(),
        "cash_today" to 0xFFB07C1E.toInt(),
        "reports" to 0xFF6A4FA3.toInt(),
        "stock" to 0xFF2E7D4F.toInt(),
        "administration" to 0xFF2E5FA3.toInt(),
    )

    private val fallback = 0xFF2A4A5A.toInt()

    fun colorFor(id: String): Int = colors[id] ?: fallback
}

object CarouselModuleMapper {
    const val DEFAULT_DETAIL = "Abrir recurso"
    const val MAX_LIVE_LINES = 4
    const val MAX_LINE_LENGTH = 80

    /**
     * Ordem preservada, ids duplicados removidos (primeira ocorrência vence),
     * textos vazios caem em padrão e as linhas ao vivo são limitadas para o tile.
     */
    fun sanitize(raw: List<RawCarouselModule>): List<CarouselModule> {
        val seen = LinkedHashSet<String>()
        val result = ArrayList<CarouselModule>(raw.size)
        raw.forEach { entry ->
            val id = entry.id?.trim().orEmpty()
            if (id.isEmpty() || !seen.add(id)) return@forEach
            result += CarouselModule(
                id = id,
                title = entry.title?.trim().orEmpty().ifEmpty { id },
                targetScreen = entry.targetScreen?.trim().orEmpty(),
                detail = entry.detail?.trim().orEmpty().ifEmpty { DEFAULT_DETAIL },
                live = sanitizeLines(entry.live),
            )
        }
        return result
    }

    private fun sanitizeLines(lines: List<String>?): List<String> {
        if (lines == null) return emptyList()
        return lines.asSequence()
            .mapNotNull { it?.trim() }
            .filter { it.isNotEmpty() }
            .map { if (it.length > MAX_LINE_LENGTH) it.take(MAX_LINE_LENGTH - 1) + "…" else it }
            .take(MAX_LIVE_LINES)
            .toList()
    }
}
