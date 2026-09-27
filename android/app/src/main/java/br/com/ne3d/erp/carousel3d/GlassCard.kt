package br.com.ne3d.erp.carousel3d

import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader

/**
 * Superfície "vidro" dos cartões do carrossel 3D.
 *
 * O bitmap nasce transparente: o cartão ocupa o retângulo inteiro com cantos
 * arredondados recortados, então não existe moldura escura em volta (o antigo
 * `drawColor(#0C141C)` + inset era o que aparecia como borda preta).
 *
 * Por cima da base entram três camadas de vidro — brilho diagonal, sombra
 * interna inferior e filete de contorno — e o `content` do chamador desenha
 * faixa/textos já recortado pelo mesmo caminho.
 */
object GlassCard {

    data class TextColors(val detail: Int, val body: Int, val footer: Int)

    fun textColors(light: Boolean): TextColors = if (light) {
        TextColors(detail = 0xB3152430.toInt(), body = 0xE016222C.toInt(), footer = 0x996B7C88.toInt())
    } else {
        TextColors(detail = 0xD0F4FFFF.toInt(), body = 0xE6F2FBFF.toInt(), footer = 0x99B9D8E6.toInt())
    }

    fun draw(
        canvas: Canvas,
        width: Float,
        height: Float,
        scale: Float,
        accent: Int,
        light: Boolean,
        content: (Canvas) -> Unit,
    ) {
        val radius = 26f * scale
        val bounds = RectF(0f, 0f, width, height)
        val clip = Path().apply { addRoundRect(bounds, radius, radius, Path.Direction.CW) }

        canvas.save()
        canvas.clipPath(clip)

        val card = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(
                0f, 0f, 0f, height,
                if (light) tint(accent, .72f) else accent,
                if (light) tint(accent, .90f) else shade(accent, .55f),
                Shader.TileMode.CLAMP,
            )
            // O bitmap é composto sobre o plano 3D. Opacidade quase total
            // apaga a cena e faz o painel parecer uma folha sólida, em vez de
            // vidro. Mantemos contraste de texto, mas deixamos o fundo e a
            // iluminação do carrossel atravessarem a superfície.
            alpha = if (light) 202 else 216
        }
        canvas.drawRect(bounds, card)

        val sheen = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(
                0f, 0f, width * .72f, height * .48f,
                if (light) 0xB8FFFFFF.toInt() else 0x70FFFFFF.toInt(),
                0x00FFFFFF.toInt(),
                Shader.TileMode.CLAMP,
            )
        }
        canvas.drawRect(bounds, sheen)

        val depth = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(
                0f, height * .42f, 0f, height,
                0x00000000,
                if (light) 0x1A0C1118.toInt() else 0x59000000.toInt(),
                Shader.TileMode.CLAMP,
            )
        }
        canvas.drawRect(bounds, depth)

        content(canvas)
        canvas.restore()

        val inset = 1.5f * scale
        val rim = RectF(bounds.left + inset, bounds.top + inset, bounds.right - inset, bounds.bottom - inset)
        val edge = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = inset
            color = if (light) 0x8CFFFFFF.toInt() else 0x59FFFFFF.toInt()
        }
        canvas.drawRoundRect(rim, radius - inset, radius - inset, edge)

        if (light) {
            val outline = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = scale
                color = 0x2B0C1118.toInt()
            }
            canvas.drawRoundRect(bounds, radius, radius, outline)
        }
    }

    private fun tint(color: Int, amount: Float): Int = mix(color, 0xFFFFFFFF.toInt(), amount)

    private fun shade(color: Int, amount: Float): Int = mix(color, 0xFF060C14.toInt(), amount)

    private fun mix(from: Int, to: Int, amount: Float): Int {
        val t = amount.coerceIn(0f, 1f)
        val red = channel(from, 16) + (channel(to, 16) - channel(from, 16)) * t
        val green = channel(from, 8) + (channel(to, 8) - channel(from, 8)) * t
        val blue = channel(from, 0) + (channel(to, 0) - channel(from, 0)) * t
        return (0xFF shl 24) or (red.toInt().coerceIn(0, 255) shl 16) or
            (green.toInt().coerceIn(0, 255) shl 8) or blue.toInt().coerceIn(0, 255)
    }

    private fun channel(color: Int, shift: Int): Int = (color shr shift) and 0xFF
}
