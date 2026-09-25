package br.com.ne3d.erp.carousel3d

/**
 * Posiciona o overlay nativo sobre a área do carrossel reportada pelo WebView.
 *
 * O web envia o retângulo em CSS px relativamente ao viewport (`getBoundingClientRect`),
 * junto do tamanho do próprio viewport. Isso evita depender de densidade de tela ou de
 * `WebView.getScale()`: a conversão é uma regra de três entre o viewport do documento e
 * os pixels do host nativo, que ocupa exatamente a mesma área da WebView.
 */
data class CarouselRect(val left: Float, val top: Float, val width: Float, val height: Float)

data class PlacedCarouselRect(val left: Float, val top: Float, val width: Float, val height: Float)

object CarouselPlacement {
    private const val MIN_SIZE = 2f

    fun place(
        rect: CarouselRect,
        viewWidth: Float,
        viewHeight: Float,
        hostWidth: Float,
        hostHeight: Float,
    ): PlacedCarouselRect? {
        if (viewWidth <= 0f || viewHeight <= 0f || hostWidth <= 0f || hostHeight <= 0f) return null
        if (rect.width <= 0f || rect.height <= 0f) return null

        // Recorta ao viewport para não posicionar uma área que saiu da tela.
        val clampedLeft = rect.left.coerceIn(0f, viewWidth)
        val clampedTop = rect.top.coerceIn(0f, viewHeight)
        val clampedRight = (rect.left + rect.width).coerceIn(0f, viewWidth)
        val clampedBottom = (rect.top + rect.height).coerceIn(0f, viewHeight)
        val clampedWidth = clampedRight - clampedLeft
        val clampedHeight = clampedBottom - clampedTop
        if (clampedWidth < MIN_SIZE || clampedHeight < MIN_SIZE) return null

        val scaleX = hostWidth / viewWidth
        val scaleY = hostHeight / viewHeight

        var left = clampedLeft * scaleX
        var top = clampedTop * scaleY
        var width = clampedWidth * scaleX
        var height = clampedHeight * scaleY

        if (left < 0f) { width += left; left = 0f }
        if (top < 0f) { height += top; top = 0f }
        if (left + width > hostWidth) width = hostWidth - left
        if (top + height > hostHeight) height = hostHeight - top
        if (width < MIN_SIZE || height < MIN_SIZE) return null

        return PlacedCarouselRect(left, top, width, height)
    }
}
