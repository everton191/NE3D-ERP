package br.com.ne3d.erp.carousel3d

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import br.com.ne3d.erp.spbcore.texture.PanelTextureSpec

/**
 * Desenha o conteúdo real de um módulo do Simplifica no formato do painel 3D.
 *
 * O bitmap é enviado pelo caminho normal de upload do renderer
 * (PanelTextureKind.REAL_SNAPSHOT), ou seja, o mesmo caminho que o launcher usa
 * para as capturas dos widgets.
 *
 * A superfície vem do [GlassCard] (vidro + cantos transparentes, sem moldura)
 * e muda conforme o tema do app: `light` troca o corpo do cartão e a cor dos
 * textos; o título continua branco porque ele cai sempre sobre a faixa do accent.
 */
object CarouselTileBitmap {
    fun render(module: CarouselModule, light: Boolean): Bitmap {
        val width = PanelTextureSpec.WIDTH
        val height = PanelTextureSpec.HEIGHT
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val scale = width / 384f

        GlassCard.draw(canvas, width.toFloat(), height.toFloat(), scale, module.accentColor, light) { body ->
            val banner = Path().apply {
                moveTo(0f, 0f)
                lineTo(width.toFloat(), 0f)
                lineTo(width.toFloat(), 92f * scale)
                lineTo(0f, 148f * scale)
                close()
            }
            body.drawPath(banner, Paint().apply { color = module.accentColor })

            val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = 0xFFFFFFFF.toInt()
                textSize = 34f * scale
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            body.drawText(fit(module.title, 18), 34f * scale, 96f * scale, title)

            val colors = GlassCard.textColors(light)

            val detail = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.detail
                textSize = 24f * scale
            }
            body.drawText(fit(module.detail, 26), 34f * scale, 176f * scale, detail)

            val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.body
                textSize = 24f * scale
                if (!light) setShadowLayer(2f * scale, 0f, scale / 2f, 0x66000000)
            }
            var y = 236f * scale
            module.live.forEach { line ->
                body.drawText(fit(line, 26), 34f * scale, y, bodyPaint)
                y += 44f * scale
            }

            val footer = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.footer
                textSize = 18f * scale
            }
            body.drawText("Simplifica 3D", 34f * scale, height - 34f * scale, footer)
        }

        return bitmap
    }

    private fun fit(text: String, maxChars: Int): String =
        if (text.length <= maxChars) text else text.take(maxChars - 1) + "…"
}
