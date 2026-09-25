package br.com.ne3d.erp.spbcore.core

import br.com.ne3d.erp.spbcore.scene.Transform3D
import kotlin.math.min
import kotlin.math.tan

/** Focus is 0 at the ring and 1 at the page. Entry traverses the same path backwards. */
object EffectivePanelRender {
    fun smoothstep(value: Float): Float = value.coerceIn(0f, 1f).let { it * it * (3f - 2f * it) }
    fun easeOut(value: Float): Float = value.coerceIn(0f, 1f).let { 1f - (1f - it) * (1f - it) * (1f - it) }
    fun sideProgress(focus: Float) = smoothstep((focus - .20f) / .65f)
    fun sideAlpha(focus: Float) = 1f - smoothstep((focus - .25f) / .65f)
    fun sideScale(focus: Float) = 1f - .15f * sideProgress(focus)
    fun sideRetreat(focus: Float) = .65f * sideProgress(focus)
    fun mirrorAlpha(focus: Float) = 1f - smoothstep(focus / .65f)
    // Deform in the middle of the movement, then settle onto the canonical plane.
    fun effectProgress(focus: Float) = 4f * focus * (1f - focus) * (1f - smoothstep((focus - .50f) / .35f))

    /** Half-width of a plane fitted into the viewport, with no crop or aspect distortion. */
    fun calculateFocusScale(width: Int, height: Int, panelAspect: Float, fov: Float, distance: Float, coverage: Float = 1f): Float {
        require(width > 0 && height > 0 && panelAspect > 0f && distance > 0f && fov in 1f..179f)
        val halfHeight = distance * tan(Math.toRadians(fov.toDouble() / 2.0)).toFloat()
        return min(halfHeight / panelAspect, halfHeight * width / height) * coverage.coerceIn(.9f, 1f)
    }

    /** Mutates only this frame's effect output, never the canonical ring transform. */
    fun applyFocus(transform: Transform3D, selected: Boolean, focus: Float, focusY: Float, focusZ: Float, focusScale: Float, focusScaleY: Float = focusScale) {
        val p = focus.coerceIn(0f, 1f)
        if (p == 0f) return
        if (selected) {
            val move = easeOut(p)
            val turn = smoothstep(p)
            transform.x *= 1f - move
            transform.y += (focusY - transform.y) * move
            transform.z += (focusZ - transform.z) * move
            val angle = ((transform.rotationY + 180f) % 360f + 360f) % 360f - 180f
            transform.rotationY = angle * (1f - turn)
            transform.rotationX *= 1f - turn
            transform.rotationZ *= 1f - turn
            transform.scaleX += (focusScale - transform.scaleX) * move
            transform.scaleY += (focusScaleY - transform.scaleY) * move
            transform.scaleZ += (focusScale - transform.scaleZ) * move
            transform.alpha += (1f - transform.alpha) * move
            transform.visible = true
        } else {
            transform.z -= sideRetreat(p)
            val scale = sideScale(p)
            transform.scaleX *= scale; transform.scaleY *= scale; transform.scaleZ *= scale
            transform.alpha *= sideAlpha(p)
            transform.visible = transform.visible && transform.alpha > 0f
        }
    }
}
