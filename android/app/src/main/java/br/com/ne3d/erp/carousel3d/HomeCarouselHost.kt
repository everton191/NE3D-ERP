package br.com.ne3d.erp.carousel3d

import android.app.Activity
import android.graphics.Outline
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewOutlineProvider
import android.view.ViewGroup
import android.widget.FrameLayout
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
    private const val BACKGROUND = 0xFF0C1118.toInt()
    private const val METRICS_INTERVAL_MS = 15_000L

    private val mainHandler = Handler(Looper.getMainLooper())
    private val generation = mutableIntStateOf(0)

    private var composeView: ComposeView? = null
    private var surface: CarouselSurfaceView? = null
    private var modules: List<CarouselModule> = emptyList()
    private var onSelect: ((CarouselModule) -> Unit)? = null
    private var lastRect: PlacedCarouselRect? = null
    private var lastContainerSize = 0L

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
        modules: List<CarouselModule>,
        onSelect: (CarouselModule) -> Unit,
    ) {
        if (activity.isFinishing || activity.isDestroyed) return
        this.onSelect = onSelect
        val modulesChanged = this.modules != modules
        this.modules = modules
        if (composeView == null || modulesChanged) attach(activity)
        applyRect(rect, viewWidth, viewHeight)
    }

    @Synchronized
    fun updateRect(rect: CarouselRect, viewWidth: Float, viewHeight: Float) {
        if (composeView == null) return
        applyRect(rect, viewWidth, viewHeight)
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
            setBackgroundColor(BACKGROUND)
            setContent { HomeCarouselContent() }
        }
        parent.addView(view, FrameLayout.LayoutParams(0, 0))
        composeView = view
        lastRect = null
        lastContainerSize = 0L
        mainHandler.removeCallbacks(metricsTick)
        mainHandler.postDelayed(metricsTick, METRICS_INTERVAL_MS)
    }

    private fun detach() {
        mainHandler.removeCallbacks(metricsTick)
        surface?.stopRenderer()
        surface = null
        val view = composeView ?: return
        composeView = null
        (view.parent as? ViewGroup)?.removeView(view)
    }

    private fun applyRect(rect: CarouselRect, viewWidth: Float, viewHeight: Float) {
        val view = composeView ?: return
        val parent = view.parent as? ViewGroup ?: return
        if (parent.width == 0 || parent.height == 0) {
            parent.post { applyRect(rect, viewWidth, viewHeight) }
            return
        }
        val placed = CarouselPlacement.place(rect, viewWidth, viewHeight, parent.width.toFloat(), parent.height.toFloat())
        if (placed == null) {
            detach()
            return
        }
        val sizeKey = (parent.width.toLong() shl 32) or (parent.height.toLong() and 0xffffffffL)
        val same = lastRect == placed && lastContainerSize == sizeKey
        lastRect = placed
        lastContainerSize = sizeKey
        if (same) return
        val left = placed.left.toInt()
        val top = placed.top.toInt()
        val width = placed.width.toInt()
        val height = placed.height.toInt()
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
                                AtomicReference(CarouselTileBitmap.render(module)),
                            )
                        }.toTypedArray()
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
                        ).also { surface = it }
                    },
                    update = { surface = it },
                    onRelease = { view ->
                        view.stopRenderer()
                        if (surface === view) surface = null
                    },
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }
}
