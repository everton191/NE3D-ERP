package br.com.ne3d.erp.spbdebug

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import br.com.ne3d.erp.carousel3d.GlassCard
import br.com.ne3d.erp.spbcore.scene.Panel3D
import br.com.ne3d.erp.spbcore.scene.PanelTextureKind
import br.com.ne3d.erp.spbcore.texture.PanelTextureSpec

/**
 * Fase B — cinco paineis mock do Simplifica.
 *
 * Sao apenas dados de demonstracao para provar o nucleo 3D dentro do APK.
 * Nao ha Supabase, rota, autenticacao ou negocio aqui: o host de debug e
 * substituido pelo bridge real na Fase C.
 */
data class SpbMockModule(
    val id: String,
    val title: String,
    val color: Int,
    val lines: List<String>,
)

object SpbMockModules {
    val all: List<SpbMockModule> = listOf(
        SpbMockModule("producao", "PRODUCAO", 0xFF1B7F79.toInt(), listOf("2 em producao", "3 abertos", "1 pronto")),
        SpbMockModule("pedidos", "PEDIDOS", 0xFF2E5FA3.toInt(), listOf("4 aguardando", "2 em producao")),
        SpbMockModule("caixa", "CAIXA", 0xFFB07C1E.toInt(), listOf("Aberto", "R$ 1.240 hoje")),
        SpbMockModule("estoque", "ESTOQUE", 0xFF2E7D4F.toInt(), listOf("2 materiais baixos")),
        SpbMockModule("relatorios", "RELATORIOS", 0xFF6A4FA3.toInt(), listOf("12 emitidos")),
    )

    fun panels(): List<Panel3D> = all.map {
        Panel3D(it.id, it.title, it.color, PanelTextureKind.REAL_SNAPSHOT)
    }

    /** Tile 9:16 renderizado fora do GL e enviado como textura (mesmo caminho de upload do launcher). */
    fun tile(module: SpbMockModule, light: Boolean = false): Bitmap {
        val width = PanelTextureSpec.WIDTH
        val height = PanelTextureSpec.HEIGHT
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val density = width / 384f

        GlassCard.draw(canvas, width.toFloat(), height.toFloat(), density, module.color, light) { body ->
            val path = Path().apply {
                moveTo(0f, 0f)
                lineTo(width.toFloat(), 0f)
                lineTo(width.toFloat(), 92f * density)
                lineTo(0f, 148f * density)
                close()
            }
            body.drawPath(path, Paint().apply { color = module.color })

            val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = 0xFFFFFFFF.toInt()
                textSize = 34f * density
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            body.drawText(module.title, 34f * density, 96f * density, title)

            val colors = GlassCard.textColors(light)
            val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.body
                textSize = 26f * density
            }
            var y = 236f * density
            module.lines.forEach { text ->
                body.drawText(text, 34f * density, y, line)
                y += 46f * density
            }

            val footer = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.footer
                textSize = 18f * density
            }
            body.drawText("Simplifica 3D", 34f * density, height - 34f * density, footer)
        }

        return bitmap
    }
}
