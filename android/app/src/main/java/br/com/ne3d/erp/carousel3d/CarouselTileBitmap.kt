package br.com.ne3d.erp.carousel3d

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
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
    private val sceneCache = mutableMapOf<String, Bitmap>()

    fun render(context: Context, module: CarouselModule, light: Boolean): Bitmap {
        val width = PanelTextureSpec.WIDTH
        val height = PanelTextureSpec.HEIGHT
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val scale = width / 384f

        GlassCard.draw(canvas, width.toFloat(), height.toFloat(), scale, module.accentColor, light) { body ->
            // A foto ocupa uma faixa um pouco maior, como os painéis de
            // referência, para que não pareça apenas uma tira no topo.
            val imageBottom = 164f * scale
            sceneFor(context, module.id)?.let { scene ->
                body.drawBitmap(scene, crop(scene, module.id), RectF(0f, 0f, width.toFloat(), imageBottom), Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    isFilterBitmap = true
                })
            }
            val banner = Path().apply {
                moveTo(0f, 128f * scale)
                lineTo(width.toFloat(), 128f * scale)
                lineTo(width.toFloat(), 184f * scale)
                lineTo(0f, 204f * scale)
                close()
            }
            body.drawPath(banner, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xE6007F89.toInt() })
            body.drawRect(0f, 190f * scale, width.toFloat(), height.toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply {
                // A área de dados era quase opaca no tema claro e criava uma
                // mancha branca no anel. Esta opacidade mantém a leitura, mas
                // deixa a base e a luz da cena atravessarem o cartão.
                color = if (light) 0xA8E7F4F5.toInt() else 0xDD10242C.toInt()
            })

            val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = 0xFFFFFFFF.toInt()
                textSize = 34f * scale
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            body.drawText(fit(module.title, 18), 34f * scale, 174f * scale, title)

            val colors = GlassCard.textColors(light)

            val detail = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.detail
                textSize = 24f * scale
            }
            body.drawText(fit(module.detail, 26), 34f * scale, 236f * scale, detail)

            val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.body
                textSize = 24f * scale
                if (!light) setShadowLayer(2f * scale, 0f, scale / 2f, 0x66000000)
            }
            var y = 286f * scale
            module.live.take(3).forEachIndexed { index, line ->
                body.drawCircle(47f * scale, (y - 8f * scale), 10f * scale, Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = metricColor(index)
                })
                body.drawText(fit(line, 24), 74f * scale, y, bodyPaint)
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

    private fun sceneFor(context: Context, id: String): Bitmap? {
        // Atlas gerado a partir da referência aprovada: cada módulo ocupa uma
        // célula exclusiva, evitando que dois cards reutilizem a mesma foto.
        val asset = "public/assets/carousel-cards/module-scenes-atlas.png"
        return synchronized(sceneCache) {
            sceneCache[asset] ?: runCatching {
                context.assets.open(asset).use { BitmapFactory.decodeStream(it) }
            }.getOrNull()?.also { sceneCache[asset] = it }
        }
    }

    private fun crop(bitmap: Bitmap, id: String): Rect {
        val index = when (id) {
            "orders" -> 0; "production" -> 1; "cash" -> 2; "storefront" -> 3; "inventory" -> 4
            "sales" -> 5; "customers" -> 6; "calculator" -> 7; "printers" -> 8; "quotes" -> 9
            else -> 0
        }
        val column = index % 5
        val row = index / 5
        // O atlas possui uma margem branca fina entre as células. Retirá-la aqui
        // preserva a fotografia limpa em todos os tamanhos de painel.
        val gutter = 7
        val cellLeft = (column * bitmap.width / 5 + gutter).coerceAtMost(bitmap.width - 1)
        val cellTop = (row * bitmap.height / 2 + gutter).coerceAtMost(bitmap.height - 1)
        val cellRight = ((column + 1) * bitmap.width / 5 - gutter).coerceAtLeast(cellLeft + 1)
        val cellBottom = ((row + 1) * bitmap.height / 2 - gutter).coerceAtLeast(cellTop + 1)
        val cell = Rect(cellLeft, cellTop, cellRight, cellBottom)
        val targetRatio = 384f / 164f
        val sourceRatio = cell.width().toFloat() / cell.height().coerceAtLeast(1)
        return if (sourceRatio > targetRatio) {
            val width = (cell.height() * targetRatio).toInt().coerceAtMost(cell.width())
            Rect(cell.centerX() - width / 2, cell.top, cell.centerX() + width / 2, cell.bottom)
        } else {
            val height = (cell.width() / targetRatio).toInt().coerceAtMost(cell.height())
            Rect(cell.left, cell.centerY() - height / 2, cell.right, cell.centerY() + height / 2)
        }
    }

    private fun metricColor(index: Int): Int = when (index) {
        0 -> 0xFF14A76C.toInt()
        1 -> 0xFF1595D3.toInt()
        else -> 0xFFFFA414.toInt()
    }
}
