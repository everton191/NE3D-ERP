package br.com.ne3d.erp.spbdebug

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.Choreographer
import android.view.View
import br.com.ne3d.erp.spbcore.core.FrameReason
import br.com.ne3d.erp.spbcore.core.FrameScheduler
import br.com.ne3d.erp.spbcore.core.ShellEngine
import br.com.ne3d.erp.spbcore.core.ShellRenderer
import br.com.ne3d.erp.spbcore.input.GestureController
import br.com.ne3d.erp.spbcore.scene.Panel3D
import java.util.concurrent.atomic.AtomicInteger

/**
 * Host de debug da Fase B.
 *
 * Prova que o nucleo SPB real (ShellEngine + ShellRenderer + fisica + camera +
 * espelho + efeitos + FrameScheduler) roda dentro do APK do Simplifica.
 *
 * Este arquivo NAO e arquitetura de producao: vive apenas no source set `debug`
 * e sera substituido pelo host com bridge na Fase C.
 */
class SpbDebugView(
    context: Context,
    private val pendingTextures: Array<ShellRenderer.PendingTexture>,
    panels: List<Panel3D>,
    private val onExit: (Int) -> Unit,
    private val onSurfaceReady: () -> Unit = {},
    onFrame: () -> Unit,
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

    private val gestures = GestureController(
        engine,
        {
            scheduler.activate(FrameReason.PHYSICS)
            scheduler.invalidateOnce()
        },
        onTap = { x ->
            engine.beginExitForPanel(engine.panelIndexAt(x, width.toFloat()))
            scheduler.activate(FrameReason.TRANSITION)
            scheduler.invalidateOnce()
        },
        onGestureStarted = {
            scheduler.cancelDelayedWake()
            queueEvent { renderer.beginMeasurement() }
            scheduler.activate(FrameReason.INPUT)
        },
        onGestureFinished = { scheduler.deactivate(FrameReason.INPUT) },
    )

    init {
        setEGLContextClientVersion(3)
        setRenderer(renderer)
        renderMode = RENDERMODE_WHEN_DIRTY
        setOnTouchListener { _: View, event ->
            if (engine.blocksInput()) true else gestures.onTouch(event)
        }
        if (engine.entry.active) scheduler.activate(FrameReason.TRANSITION)
        scheduler.invalidateOnce()
    }

    /** Amostra de frame-time em janelas de 15s (logcat tag Shell3D.Metrics). */
    fun publishMetrics(label: String) = queueEvent { renderer.publishMeasurement(label) }

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
