package br.com.ne3d.erp.spbcore.animation

import br.com.ne3d.erp.spbcore.carousel.CarouselMotionSpec
import br.com.ne3d.erp.spbcore.core.EffectivePanelRender

/** Hold the focused frame even after the one-shot handoff has been consumed. */
class CarouselExitTransition(private val spec: CarouselMotionSpec) {
    private var elapsedMs = 0f
    @Volatile var active = false
        private set
    var completed = false
        private set
    @Volatile var started = false
        private set
    val progress: Float get() = (elapsedMs / spec.exitDurationMs.coerceAtLeast(1)).coerceIn(0f, 1f)
    val focusProgress: Float get() = progress
    val cameraZ: Float get() = spec.cameraZ + (spec.entryCameraZ - spec.cameraZ) * EffectivePanelRender.smoothstep(progress)
    val fov: Float get() = spec.cameraFov + (spec.entryCameraFov - spec.cameraFov) * EffectivePanelRender.smoothstep(progress)
    val radius: Float get() = spec.radius
    val panelSpread: Float get() = 1f
    val sideAlpha: Float get() = EffectivePanelRender.sideAlpha(progress)
    val sideScale: Float get() = EffectivePanelRender.sideScale(progress)
    val sideRetreat: Float get() = EffectivePanelRender.sideRetreat(progress)
    val mirrorAlpha: Float get() = EffectivePanelRender.mirrorAlpha(progress)
    fun begin() { if (started) return; elapsedMs = 0f; active = true; started = true; completed = false }
    fun tick(deltaSeconds: Float): Boolean {
        if (!active) return false
        elapsedMs = (elapsedMs + deltaSeconds.coerceAtLeast(0f) * 1_000f).coerceAtMost(spec.exitDurationMs.toFloat())
        if (progress >= 1f) { active = false; completed = true }
        return active
    }
    fun consumeCompleted(): Boolean = completed.also { completed = false }
}
