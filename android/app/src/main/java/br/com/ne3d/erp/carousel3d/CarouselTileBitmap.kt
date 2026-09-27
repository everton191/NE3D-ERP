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
            val imageBottom = 148f * scale
            sceneFor(context, module.id)?.let { scene ->
                body.drawBitmap(scene, crop(scene), RectF(0f, 0f, width.toFloat(), imageBottom), Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    isFilterBitmap = true
                })
            }
            val banner = Path().apply {
                moveTo(0f, 112f * scale)
                lineTo(width.toFloat(), 112f * scale)
                lineTo(width.toFloat(), 168f * scale)
                lineTo(0f, 188f * scale)
                close()
            }
            body.drawPath(banner, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xE6007F89.toInt() })
            body.drawRect(0f, 174f * scale, width.toFloat(), height.toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = if (light) 0xECF7FBFD.toInt() else 0xDD10242C.toInt()
            })

            val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = 0xFFFFFFFF.toInt()
                textSize = 34f * scale
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            body.drawText(fit(module.title, 18), 34f * scale, 158f * scale, title)

            val colors = GlassCard.textColors(light)

            val detail = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.detail
                textSize = 24f * scale
            }
            body.drawText(fit(module.detail, 26), 34f * scale, 220f * scale, detail)

            val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = colors.body
                textSize = 24f * scale
                if (!light) setShadowLayer(2f * scale, 0f, scale / 2f, 0x66000000)
            }
            var y = 270f * scale
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
        val asset = when (id) {
            "production", "printers" -> "public/assets/storefront-v3/examples/product-vase.jpg"
            "orders", "inventory" -> "public/assets/storefront-v3/examples/category-utilidades.jpg"
            "storefront", "sales" -> "public/assets/storefront-v3/examples/hero-3d-products.jpg"
            "customers" -> "public/assets/storefront-v3/examples/product-dino.jpg"
            "cash", "calculator", "quotes" -> "public/assets/storefront-v3/examples/product-keychain.jpg"
            else -> "public/assets/storefront-v3/examples/product-support.jpg"
        }
        return synchronized(sceneCache) {
            sceneCache[asset] ?: runCatching {
                context.assets.open(asset).use { BitmapFactory.decodeStream(it) }
            }.getOrNull()?.also { sceneCache[asset] = it }
        }
    }

    private fun crop(bitmap: Bitmap): Rect {
        val targetRatio = 384f / 148f
        val sourceRatio = bitmap.width.toFloat() / bitmap.height.coerceAtLeast(1)
        return if (sourceRatio > targetRatio) {
            val width = (bitmap.height * targetRatio).toInt().coerceAtMost(bitmap.width)
            Rect((bitmap.width - width) / 2, 0, (bitmap.width + width) / 2, bitmap.height)
        } else {
            val height = (bitmap.width / targetRatio).toInt().coerceAtMost(bitmap.height)
            Rect(0, (bitmap.height - height) / 2, bitmap.width, (bitmap.height + height) / 2)
        }
    }

    private fun metricColor(index: Int): Int = when (index) {
        0 -> 0xFF14A76C.toInt()
        1 -> 0xFF1595D3.toInt()
        else -> 0xFFFFA414.toInt()
    }
}
