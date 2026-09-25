package br.com.ne3d.erp.carousel3d

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CarouselModuleMapperTest {

    @Test
    fun `keeps order and removes duplicated ids`() {
        val modules = CarouselModuleMapper.sanitize(
            listOf(
                RawCarouselModule("production", "Produção", "producao", "3", listOf("a")),
                RawCarouselModule("stock", "Estoque", "estoque", "OK", listOf("b")),
                RawCarouselModule("production", "Outra produção", "outra", "x", listOf("c")),
            )
        )

        assertEquals(listOf("production", "stock"), modules.map { it.id })
        assertEquals("Produção", modules[0].title)
        assertEquals("estoque", modules[1].targetScreen)
        assertEquals("the first occurrence wins", listOf("a"), modules[0].live)
    }

    @Test
    fun `drops entries without id`() {
        val modules = CarouselModuleMapper.sanitize(
            listOf(
                RawCarouselModule(null, "Sem id", "tela", null, null),
                RawCarouselModule("   ", "Em branco", "tela", null, null),
                RawCarouselModule("caixa", "Caixa", "caixa", null, null),
            )
        )

        assertEquals(listOf("caixa"), modules.map { it.id })
    }

    @Test
    fun `fills missing title and detail with defaults`() {
        val modules = CarouselModuleMapper.sanitize(
            listOf(RawCarouselModule("reports", "   ", null, "  ", null))
        )

        assertEquals(1, modules.size)
        assertEquals("reports", modules[0].title)
        assertEquals("", modules[0].targetScreen)
        assertEquals(CarouselModuleMapper.DEFAULT_DETAIL, modules[0].detail)
        assertTrue(modules[0].live.isEmpty())
    }

    @Test
    fun `cleans the live lines that reach the tile`() {
        val longLine = "x".repeat(120)
        val modules = CarouselModuleMapper.sanitize(
            listOf(
                RawCarouselModule(
                    "production",
                    "Produção",
                    "producao",
                    "3 em produção",
                    listOf("  Abertos 4  ", "", "   ", longLine, "Prontos 1", "Linha extra 1", "Linha extra 2", "Linha extra 3"),
                )
            )
        )

        val live = modules[0].live
        assertEquals(CarouselModuleMapper.MAX_LIVE_LINES, live.size)
        assertEquals("Abertos 4", live[0])
        assertEquals(CarouselModuleMapper.MAX_LINE_LENGTH, live[1].length)
        assertTrue(live[1].endsWith("…"))
        assertEquals("Prontos 1", live[2])
        assertEquals("Linha extra 1", live[3])
    }

    @Test
    fun `accent color is stable per module`() {
        val production = CarouselModuleMapper.sanitize(listOf(RawCarouselModule("production", "Produção", "producao", null, null)))
        val unknown = CarouselModuleMapper.sanitize(listOf(RawCarouselModule("whatever", "X", "x", null, null)))

        assertEquals(CarouselModulePalette.colorFor("production"), production[0].accentColor)
        assertTrue(
            "unknown modules must not steal a module color",
            unknown[0].accentColor != production[0].accentColor,
        )
    }
}
