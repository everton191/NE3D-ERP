package br.com.ne3d.erp.spbcore.core

import br.com.ne3d.erp.spbcore.animation.CarouselEntryTransition
import br.com.ne3d.erp.spbcore.animation.CarouselExitTransition
import br.com.ne3d.erp.spbcore.carousel.CarouselMotionSpec
import br.com.ne3d.erp.spbcore.scene.Transform3D
import org.junit.Assert.*
import org.junit.Test
import kotlin.math.tan

class EffectivePanelRenderTest {
    private fun ring() = Transform3D().apply {
        x = -1.7f; y = .2f; z = 1.3f; rotationY = -60f
        scaleX = .8f; scaleY = .8f; scaleZ = .8f; alpha = .85f
    }
    private fun focused(p: Float, selected: Boolean = true) = ring().also {
        EffectivePanelRender.applyFocus(it, selected, p, 0f, 2.5f, 1.8f, 2.1f)
    }
    @Test fun `morph starts at the exact current lateral transform`() {
        val start = focused(0f)
        assertEquals(-1.7f, start.x, 0f); assertEquals(1.3f, start.z, 0f)
        assertEquals(-60f, start.rotationY, 0f); assertEquals(.8f, start.scaleX, 0f)
    }
    @Test fun `selected endpoint is a full opaque front facing page`() {
        val end = focused(1f)
        assertEquals(0f, end.x, .0001f); assertEquals(0f, end.y, .0001f)
        assertEquals(2.5f, end.z, .0001f); assertEquals(0f, end.rotationY, .0001f)
        assertEquals(1.8f, end.scaleX, .0001f); assertEquals(2.1f, end.scaleY, .0001f)
        assertEquals(1f, end.alpha, .0001f); assertTrue(end.visible)
        assertTrue(focused(.5f).x in -1.7f..0f)
        assertTrue(focused(.5f).scaleX > .8f * 1.12f)
    }
    @Test fun `side cards stay in the ring then retreat shrink and fade`() {
        val start = focused(0f, false); val end = focused(1f, false)
        assertEquals(start.x, end.x, 0f); assertEquals(start.rotationY, end.rotationY, 0f)
        assertTrue(end.z < start.z); assertTrue(end.scaleX < start.scaleX)
        assertEquals(0f, end.alpha, 0f); assertFalse(end.visible)
        assertEquals(1f, EffectivePanelRender.sideAlpha(.2f), 0f)
        assertTrue(EffectivePanelRender.sideAlpha(.6f) in .01f.. .99f)
    }
    @Test fun `mirror disappears early and effects settle before handoff`() {
        assertEquals(1f, EffectivePanelRender.mirrorAlpha(0f), 0f)
        assertEquals(0f, EffectivePanelRender.mirrorAlpha(.65f), 0f)
        assertEquals(0f, EffectivePanelRender.mirrorAlpha(1f), 0f)
        assertEquals(0f, EffectivePanelRender.effectProgress(0f), 0f)
        assertTrue(EffectivePanelRender.effectProgress(.5f) > .5f)
        assertEquals(0f, EffectivePanelRender.effectProgress(.9f), 0f)
        assertEquals(0f, EffectivePanelRender.effectProgress(1f), 0f)
    }
    @Test fun `page aspect fills portrait tall and landscape viewports without cropping`() {
        for ((w, h) in listOf(1080 to 1920, 1080 to 2448, 2400 to 1080)) {
            val aspect = h.toFloat() / w
            val halfHeight = 4.2f * tan(Math.toRadians(27.0)).toFloat()
            val scale = EffectivePanelRender.calculateFocusScale(w, h, aspect, 54f, 4.2f)
            assertEquals(1f, scale * aspect / halfHeight, .0001f)
            assertEquals(1f, scale / (halfHeight * w / h), .0001f)
        }
    }
    @Test fun `entry and exit traverse the same morph in reverse`() {
        val spec = CarouselMotionSpec()
        val entry = CarouselEntryTransition(spec)
        val exit = CarouselExitTransition(spec).apply { begin() }
        assertEquals(1f, entry.focusProgress, 0f); assertEquals(0f, exit.focusProgress, 0f)
        repeat(10) {
            entry.tick(spec.entryDurationMs / 10_000f); exit.tick(spec.exitDurationMs / 10_000f)
            assertEquals(1f, entry.focusProgress + exit.focusProgress, .0001f)
        }
        entry.tick(.001f); exit.tick(.001f)
        assertFalse(entry.active); assertFalse(exit.active)
        assertTrue(exit.started); assertTrue(exit.consumeCompleted()); assertFalse(exit.consumeCompleted())
        assertEquals(1f, exit.focusProgress, 0f)
    }
}
