package br.com.ne3d.erp.carousel3d

import android.app.Activity
import android.content.Context
import android.graphics.Outline
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewOutlineProvider
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.TextView
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView
import br.com.ne3d.erp.spbcore.core.ShellRenderer
import br.com.ne3d.erp.spbcore.host.CarouselSurfaceView
import br.com.ne3d.erp.spbcore.scene.Panel3D
import br.com.ne3d.erp.spbcore.scene.PanelTextureKind
import java.util.concurrent.atomic.AtomicReference

/**
 * Sobe o carrossel nativo sobre a área que o WebView reporta para o card da Home.
 *
 * A view é adicionada em `android.R.id.content`, exatamente sobre a WebView, porém
 * limitada ao retângulo do carrossel: os toques fora da área continuam chegando ao
 * WebView (o FrameLayout só repassa o toque quando nenhum filho o consome).
 */
object HomeCarouselHost {
    private const val CORNER_DP = 14f
    const val BACKGROUND_DARK = 0xFF0C1118.toInt()
    const val BACKGROUND_LIGHT = 0xFFF2F5F4.toInt()
    private const val METRICS_INTERVAL_MS = 15_000L

    private val mainHandler = Handler(Looper.getMainLooper())
    private val generation = mutableIntStateOf(0)

    private var composeView: ComposeView? = null
    private var surface: CarouselSurfaceView? = null
    private var modules: List<CarouselModule> = emptyList()
    private var onSelect: ((CarouselModule) -> Unit)? = null
    private var onEditor: (() -> Unit)? = null
    private var lastRect: PlacedCarouselRect? = null
    private var lastContainerSize = 0L
    private var lastHostOffset = 0L
    private var panelBackground: Int = BACKGROUND_DARK
    private var lightTheme = false
    private var pendingTextures: Array<ShellRenderer.PendingTexture> = emptyArray()
    private var assetContext: Context? = null

    private val metricsTick: Runnable = Runnable {
        val active = surface ?: return@Runnable
        active.publishMetrics("home-carousel-15s")
        mainHandler.postDelayed(metricsTick, METRICS_INTERVAL_MS)
    }

    @Synchronized
    fun show(
        activity: Activity,
        rect: CarouselRect,
        viewWidth: Float,
        viewHeight: Float,
        background: Int,
        modules: List<CarouselModule>,
        onSelect: (CarouselModule) -> Unit,
        onEditor: () -> Unit,
    ) {
        if (activity.isFinishing || activity.isDestroyed) return
        assetContext = activity.applicationContext
        this.onSelect = onSelect
        this.onEditor = onEditor
        val structureChanged = this.modules.map { it.id } != modules.map { it.id }
        val contentChanged = this.modules != modules
        this.modules = modules
        applyBackground(background)
        // Dados novos do tile (contadores, valores, status) só exigem novo
        // bitmap; recriar a GLSurfaceView reiniciava a entrada do carrossel.
        if (composeView == null || structureChanged) attach(activity)
        else if (contentChanged) repaintTextures()
        applyRect(rect, viewWidth, viewHeight)
    }

    @Synchronized
    fun updateRect(rect: CarouselRect, viewWidth: Float, viewHeight: Float, background: Int) {
        if (composeView == null) return
        applyBackground(background)
        applyRect(rect, viewWidth, viewHeight)
    }

    private fun applyBackground(background: Int) {
        val light = background == BACKGROUND_LIGHT
        val themeChanged = light != lightTheme
        lightTheme = light
        panelBackground = background
        composeView?.setBackgroundColor(panelBackground)
        surface?.applyBackground(background)
        if (themeChanged) repaintTextures()
    }

    /**
     * Repinta os tiles quando o tema muda. Os bitmaps entram nos mesmos
     * `AtomicReference` já entregues ao renderer, então o upload acontece no
     * próximo frame sem recriar a superfície GL.
     */
    private fun repaintTextures() {
        if (pendingTextures.isEmpty() || modules.isEmpty()) return
        modules.forEachIndexed { index, module ->
            val pending = pendingTextures.getOrNull(index) ?: return@forEachIndexed
            val context = assetContext ?: return
            pending.bitmap.set(CarouselTileBitmap.render(context, module, lightTheme))
        }
    }

    /**
     * Destrói a view imediatamente: o renderer perde o contexto EGL ao pausar e as
     * texturas pendentes já consumidas não são reenviadas, então reusar a mesma
     * GLSurfaceView deixa o painel preto.
     */
    @Synchronized
    fun hide() {
        detach()
        modules = emptyList()
        onSelect = null
        onEditor = null
        lastRect = null
        lastContainerSize = 0L
    }

    @Synchronized
    fun onPause() = surface?.pauseRenderer()

    @Synchronized
    fun onResume() = surface?.resumeRenderer()

    @Synchronized
    fun isAttached(): Boolean = composeView != null

    /** Recria a superfície quando o toque termina sem um destino navegável. */
    fun recreate() {
        generation.intValue++
    }

    private fun attach(activity: Activity) {
        val parent = activity.findViewById<ViewGroup>(android.R.id.content)
        if (parent !is FrameLayout) return
        detach()
        val view = ComposeView(activity).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnDetachedFromWindow)
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(v: View, outline: Outline) {
                    val radius = CORNER_DP * v.resources.displayMetrics.density
                    outline.setRoundRect(0, 0, v.width, v.height, radius)
                }
            }
            clipToOutline = true
            setBackgroundColor(panelBackground)
            setContent { HomeCarouselContent() }
        }
        parent.addView(view, FrameLayout.LayoutParams(0, 0))
        composeView = view
        lastRect = null
        lastContainerSize = 0L
        lastHostOffset = 0L
        mainHandler.removeCallbacks(metricsTick)
        mainHandler.postDelayed(metricsTick, METRICS_INTERVAL_MS)
    }

    private fun detach() {
        mainHandler.removeCallbacks(metricsTick)
        surface?.stopRenderer()
        surface = null
        pendingTextures = emptyArray()
        assetContext = null
        val view = composeView ?: return
        composeView = null
        (view.parent as? ViewGroup)?.removeView(view)
    }

    private data class HostBounds(val offsetX: Int, val offsetY: Int, val width: Float, val height: Float)

    /**
     * A WebView pode ficar deslocada dentro de `android.R.id.content` (barra de status,
     * cutout). Usar o pai como referência estica e desloca o painel, fazendo-o invadir
     * o menu inferior. A referência correta é a própria WebView.
     */
    private fun resolveHostBounds(parent: ViewGroup): HostBounds {
        val webView = findWebView(parent)
        if (webView != null && webView.width > 0 && webView.height > 0) {
            val webLocation = IntArray(2).also { webView.getLocationInWindow(it) }
            val parentLocation = IntArray(2).also { parent.getLocationInWindow(it) }
            return HostBounds(
                offsetX = webLocation[0] - parentLocation[0],
                offsetY = webLocation[1] - parentLocation[1],
                width = webView.width.toFloat(),
                height = webView.height.toFloat(),
            )
        }
        return HostBounds(0, 0, parent.width.toFloat(), parent.height.toFloat())
    }

    private fun findWebView(root: ViewGroup): WebView? {
        if (root is WebView) return root
        for (index in 0 until root.childCount) {
            val child = root.getChildAt(index)
            if (child is WebView) return child
            if (child is ViewGroup) findWebView(child)?.let { return it }
        }
        return null
    }

    private fun applyRect(rect: CarouselRect, viewWidth: Float, viewHeight: Float) {
        val view = composeView ?: return
        val parent = view.parent as? ViewGroup ?: return
        if (parent.width == 0 || parent.height == 0) {
            parent.post { applyRect(rect, viewWidth, viewHeight) }
            return
        }
        val bounds = resolveHostBounds(parent)
        val placed = CarouselPlacement.place(rect, viewWidth, viewHeight, bounds.width, bounds.height)
        if (placed == null) {
            detach()
            return
        }
        var left = placed.left.toInt() + bounds.offsetX
        var top = placed.top.toInt() + bounds.offsetY
        var width = placed.width.toInt()
        var height = placed.height.toInt()
        if (left < 0) { width += left; left = 0 }
        if (top < 0) { height += top; top = 0 }
        if (left + width > parent.width) width = parent.width - left
        if (top + height > parent.height) height = parent.height - top
        if (width <= 0 || height <= 0) {
            detach()
            return
        }
        val sizeKey = (parent.width.toLong() shl 32) or (parent.height.toLong() and 0xffffffffL)
        val offsetKey = (bounds.offsetX.toLong() shl 32) or (bounds.offsetY.toLong() and 0xffffffffL)
        val same = lastRect == placed && lastContainerSize == sizeKey && lastHostOffset == offsetKey
        lastRect = placed
        lastContainerSize = sizeKey
        lastHostOffset = offsetKey
        if (same) return
        val params = (view.layoutParams as? FrameLayout.LayoutParams) ?: return
        if (params.leftMargin == left && params.topMargin == top && params.width == width && params.height == height) return
        params.leftMargin = left
        params.topMargin = top
        params.width = width
        params.height = height
        view.layoutParams = params
    }

    @Composable
    private fun HomeCarouselContent() {
        val currentGeneration = generation.intValue
        Box(modifier = Modifier.fillMaxSize()) {
            key(currentGeneration) {
                AndroidView(
                    factory = { context ->
                        val textures = modules.map { module ->
                            ShellRenderer.PendingTexture(
                                module.id,
                                AtomicReference(CarouselTileBitmap.render(context, module, lightTheme)),
                            )
                        }.toTypedArray()
                        pendingTextures = textures
                        val panels = modules.map { module ->
                            Panel3D(module.id, module.title, module.accentColor, PanelTextureKind.REAL_SNAPSHOT)
                        }
                        CarouselSurfaceView(
                            context = context,
                            pendingTextures = textures,
                            panels = panels,
                            onExit = { index ->
                                val module = modules.getOrNull(index)
                                if (module == null || module.targetScreen.isEmpty()) recreate()
                                else onSelect?.invoke(module)
                            },
                        ).also { view ->
                            surface = view
                            view.applyBackground(panelBackground)
                        }
                    },
                    update = { surface = it },
                    onRelease = { view ->
                        view.stopRenderer()
                        if (surface === view) surface = null
                    },
                    modifier = Modifier.fillMaxSize(),
                )
            }
            AndroidView(
                factory = { context -> TextView(context).apply {
                    text = "⚙"
                    textSize = 28f
                    gravity = android.view.Gravity.CENTER
                    contentDescription = "Configurar carrossel"
                    setBackgroundColor(0x00000000)
                    setOnClickListener { onEditor?.invoke() }
                } },
                modifier = Modifier.align(Alignment.BottomEnd).padding(10.dp).size(48.dp),
            )
        }
    }
}
