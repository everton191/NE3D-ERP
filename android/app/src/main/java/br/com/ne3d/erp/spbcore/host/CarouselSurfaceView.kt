package br.com.ne3d.erp.spbcore.host

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.Choreographer
import android.view.GestureDetector
import android.view.View
import br.com.ne3d.erp.spbcore.core.FrameReason
import br.com.ne3d.erp.spbcore.core.FrameScheduler
import br.com.ne3d.erp.spbcore.core.ShellEngine
import br.com.ne3d.erp.spbcore.core.ShellRenderer
import br.com.ne3d.erp.spbcore.input.GestureController
import br.com.ne3d.erp.spbcore.scene.Panel3D
import java.util.concurrent.atomic.AtomicInteger

/**
 * Superfície GLES compartilhada pelo núcleo SPB.
 *
 * É a peça que liga ShellEngine + ShellRenderer + FrameScheduler + gestos a uma View
 * Android real. Usada pelo host de debug da Fase B e pelo carrossel nativo da Home
 * (Fase C) — não conhece a aplicação, só painéis, texturas pendentes e callbacks.
 */
class CarouselSurfaceView(
    context: Context,
    private val pendingTextures: Array<ShellRenderer.PendingTexture>,
    panels: List<Panel3D>,
    private val onExit: (Int) -> Unit,
    private val onSurfaceReady: () -> Unit = {},
    private val onPinch: () -> Unit = {},
    onFrame: () -> Unit = {},
    private val onPanelTap: ((Int) -> Unit)? = null,
    private val onPanelDropToFloor: ((Int) -> Unit)? = null,
    private val onPanelDrag: ((Int, Float, Float, Boolean) -> Unit)? = null,
) : GLSurfaceView(context) {

    val engine = ShellEngine(panels = panels)
    private val scheduler = FrameScheduler(Choreographer.getInstance()) { requestRender() }
    private val renderConsumed = Runnable { scheduler.onRenderConsumed() }
    private val frames = AtomicInteger()

    private val renderer: ShellRenderer = ShellRenderer(
        engine = engine,
        onFrameDrawn = {
            frames.incrementAndGet()
            onFrame()
            post(renderConsumed)
        },
        onAutoWakeNeeded = {
            post {
                scheduler.wakeOnceAfter(ShellEngine.AUTO_ROTATE_DELAY_MILLIS) {
                    engine.beginAutoRotation()
                    scheduler.activate(FrameReason.AUTO_ROTATE)
                    scheduler.invalidateOnce()
                }
            }
        },
        onEngineIdle = {
            post {
                scheduler.deactivate(FrameReason.PHYSICS)
                scheduler.deactivate(FrameReason.TRANSITION)
                scheduler.deactivate(FrameReason.AUTO_ROTATE)
            }
        },
        onSurfaceReady = {
            queueEvent { renderer.beginMeasurement() }
            post { if (isAttachedToWindow) onSurfaceReady() }
        },
        onExitFinished = {
            postOnAnimation {
                if (isAttachedToWindow) postOnAnimation {
                    if (isAttachedToWindow) onExit(engine.selectedIndex)
                }
            }
        },
        onTextureUploadsDrained = { post { scheduler.deactivate(FrameReason.TEXTURE_UPLOAD) } },
        pendingTextures = pendingTextures,
        onEntryFrameReady = { postOnAnimation { if (isAttachedToWindow) scheduler.invalidateOnce() } },
    )

    private var heldPanelIndex: Int? = null
    private var droppingToFloor = false
    private val surfaceLocation = IntArray(2)

    private val gestures = GestureController(
        engine,
        {
            scheduler.activate(FrameReason.PHYSICS)
            scheduler.invalidateOnce()
        },
        onTap = { x ->
            val index = engine.panelIndexAt(x, width.toFloat())
            val callback = onPanelTap
            if (callback != null) {
                callback(index)
            } else {
                // Primeiro toque fixa e expande o painel. Quando ele já está
                // ampliado, o segundo toque confirma sua abertura. Usar o
                // painel já selecionado evita que a perspectiva do anel mapeie
                // o mesmo toque para uma face lateral e o faça girar de novo.
                if (engine.cardExpanded) {
                    engine.beginExitForPanel(engine.selectedIndex)
                    scheduler.activate(FrameReason.TRANSITION)
                } else {
                    engine.focusPanel(index)
                    scheduler.activate(FrameReason.PHYSICS)
                }
                scheduler.invalidateOnce()
            }
        },
        onPinch = { scaleDelta ->
            clearTapLatch()
            engine.onPinch(scaleDelta)
            scheduler.activate(FrameReason.PHYSICS)
            scheduler.invalidateOnce()
        },
        onDragMoved = { clearTapLatch() },
        onGestureStarted = {
            scheduler.cancelDelayedWake()
            queueEvent { renderer.beginMeasurement() }
            scheduler.activate(FrameReason.INPUT)
        },
        onGestureFinished = { scheduler.deactivate(FrameReason.INPUT) },
    )

    private val longPressDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onDown(event: android.view.MotionEvent): Boolean = true

        override fun onLongPress(event: android.view.MotionEvent) {
            val index = engine.panelIndexAt(event.x, width.toFloat())
            heldPanelIndex = index
            onPanelDrag?.invoke(index, event.x, event.y, true)
        }
    })

    init {
        setEGLContextClientVersion(3)
        setRenderer(renderer)
        renderMode = RENDERMODE_WHEN_DIRTY
        setOnTouchListener { _: View, event ->
            if (event.actionMasked == android.view.MotionEvent.ACTION_DOWN) {
                heldPanelIndex = null
                droppingToFloor = false
            }
            longPressDetector.onTouchEvent(event)
            if (event.actionMasked == android.view.MotionEvent.ACTION_MOVE && heldPanelIndex != null) {
                getLocationInWindow(surfaceLocation)
                // A remoção só é armada quando o dedo atravessa a borda inferior
                // da cena rumo ao piso. Toque curto e long-press parado não movem.
                droppingToFloor = event.rawY > surfaceLocation[1] + height + 12
                onPanelDrag?.invoke(heldPanelIndex!!, event.x, event.y, true)
            }
            val shouldDrop = event.actionMasked == android.view.MotionEvent.ACTION_UP && droppingToFloor
            val indexToDrop = heldPanelIndex
            val handled = if (engine.blocksInput()) true else gestures.onTouch(event)
            if (shouldDrop && indexToDrop != null) onPanelDropToFloor?.invoke(indexToDrop)
            if (event.actionMasked == android.view.MotionEvent.ACTION_UP || event.actionMasked == android.view.MotionEvent.ACTION_CANCEL) {
                indexToDrop?.let { onPanelDrag?.invoke(it, event.x, event.y, false) }
                heldPanelIndex = null
                droppingToFloor = false
            }
            handled
        }
        if (engine.entry.active) scheduler.activate(FrameReason.TRANSITION)
        scheduler.invalidateOnce()
    }

    /** Amostra de frame-time em janelas de 15s (logcat tag Shell3D.Metrics). */
    fun publishMetrics(label: String) = queueEvent { renderer.publishMeasurement(label) }

    fun applyBackground(background: Int) {
        renderer.clearColor = background
        requestRender()
    }

    private fun clearTapLatch() = Unit

    fun consumeFrames(): Int = frames.getAndSet(0)
    fun selectedPanelLabel(): String = engine.state.panels.getOrNull(engine.selectedIndex)?.label ?: "-"
    fun selectedPanelId(): String = engine.state.panels.getOrNull(engine.selectedIndex)?.id ?: "-"
    fun motionState(): String = engine.carousel.state.name

    fun pauseRenderer() {
        scheduler.pause()
        super.onPause()
    }

    fun resumeRenderer() {
        super.onResume()
        scheduler.resume()
        if (engine.entry.active || engine.exit.active) scheduler.activate(FrameReason.TRANSITION)
        else scheduler.invalidateOnce()
    }

    fun stopRenderer() {
        scheduler.shutdown()
        queueEvent { renderer.release() }
    }

    override fun onDetachedFromWindow() {
        stopRenderer()
        super.onDetachedFromWindow()
    }

}
