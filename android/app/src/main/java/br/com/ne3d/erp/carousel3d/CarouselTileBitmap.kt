package br.com.ne3d.erp.carousel3d

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Shader
import android.graphics.Typeface
import br.com.ne3d.erp.spbcore.texture.PanelTextureSpec

/**
 * Desenha o conteúdo real de um módulo do Simplifica no formato do painel 3D.
 *
 * O bitmap é enviado pelo caminho normal de upload do renderer
 * (PanelTextureKind.REAL_SNAPSHOT), ou seja, o mesmo caminho que o launcher usa
 * para as capturas dos widgets.
 */
object CarouselTileBitmap {
    fun render(module: CarouselModule): Bitmap {
        val width = PanelTextureSpec.WIDTH
        val height = PanelTextureSpec.HEIGHT
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val scale = width / 384f

        canvas.drawColor(0xFF0C141C.toInt())

        val card = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(
                0f, 0f, 0f, height.toFloat(),
                module.accentColor, 0xFF0C141C.toInt(), Shader.TileMode.CLAMP,
            )
        }
        val inset = 14f * scale
        val radius = 22f * scale
        canvas.drawRoundRect(inset, inset, width - inset, height - inset, radius, radius, card)

        val edge = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 3f * scale
            color = 0x668CFFFF.toInt()
        }
        canvas.drawRoundRect(inset, inset, width - inset, height - inset, radius, radius, edge)

        val stripe = Paint().apply { color = module.accentColor }
        val banner = Path().apply {
            moveTo(inset, inset)
            lineTo(width - inset, inset)
            lineTo(width - inset, inset + 92f * scale)
            lineTo(inset, inset + 148f * scale)
            close()
        }
        canvas.drawPath(banner, stripe)

        val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xFFFFFFFF.toInt()
            textSize = 34f * scale
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText(fit(module.title, 18), 34f * scale, 96f * scale, title)

        val detail = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xD0F4FFFF.toInt()
            textSize = 24f * scale
        }
        canvas.drawText(fit(module.detail, 26), 34f * scale, 176f * scale, detail)

        val body = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xE6F2FBFF.toInt()
            textSize = 24f * scale
        }
        var y = 236f * scale
        module.live.forEach { line ->
            canvas.drawText(fit(line, 26), 34f * scale, y, body)
            y += 44f * scale
        }

        val footer = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0x99B9D8E6.toInt()
            textSize = 18f * scale
        }
        canvas.drawText("Simplifica 3D", 34f * scale, height - 34f * scale, footer)

        return bitmap
    }

    private fun fit(text: String, maxChars: Int): String =
        if (text.length <= maxChars) text else text.take(maxChars - 1) + "…"
}
