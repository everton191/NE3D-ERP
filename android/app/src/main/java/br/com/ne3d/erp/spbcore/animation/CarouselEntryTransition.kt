package br.com.ne3d.erp.spbcore.animation

import br.com.ne3d.erp.spbcore.carousel.CarouselMotionSpec
import br.com.ne3d.erp.spbcore.core.EffectivePanelRender

/** Selected page returns to the unchanged ring; its texture must be ready before ticking. */
class CarouselEntryTransition(private val spec: CarouselMotionSpec) {
    private var elapsedMs = 0f
    @Volatile var active = true
        private set
    val progress: Float get() = (elapsedMs / spec.entryDurationMs.coerceAtLeast(1)).coerceIn(0f, 1f)
    val focusProgress: Float get() = 1f - progress
    val cameraZ: Float get() = spec.cameraZ + (spec.entryCameraZ - spec.cameraZ) * EffectivePanelRender.smoothstep(focusProgress)
    val fov: Float get() = spec.cameraFov + (spec.entryCameraFov - spec.cameraFov) * EffectivePanelRender.smoothstep(focusProgress)
    val radius: Float get() = spec.radius
    val panelSpread: Float get() = 1f
    val sideAlpha: Float get() = EffectivePanelRender.sideAlpha(focusProgress)
    val mirrorAlpha: Float get() = EffectivePanelRender.mirrorAlpha(focusProgress)
    fun tick(deltaSeconds: Float): Boolean {
        if (!active) return false
        elapsedMs = (elapsedMs + deltaSeconds.coerceAtLeast(0f) * 1_000f).coerceAtMost(spec.entryDurationMs.toFloat())
        active = progress < 1f
        return active
    }
}
