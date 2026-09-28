package br.com.ne3d.erp.spbcore

import br.com.ne3d.erp.spbcore.carousel.CarouselMotionState
import br.com.ne3d.erp.spbcore.core.ShellEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ShellEngineInputTest {
    @Test fun `coalesced drags are consumed before gesture end and fling`() {
        val engine = ShellEngine()
        engine.tick(1f) // Input belongs to the settled ring, not the entry track.
        engine.onGestureStart()
        engine.onDrag(10f)
        engine.onDrag(20f)
        engine.onGestureEnd()
        engine.onFling(0f)
        engine.tick(0f) // Observe queued input before the snap advances time.
        assertEquals(30f * engine.spec.dragToAngleRatio, engine.carousel.angle, .001f)
    }
    @Test fun `pending drag survives gesture end without fling`() {
        val engine = ShellEngine()
        engine.tick(1f)
        engine.onGestureStart(); engine.onDrag(18f); engine.onGestureEnd(); engine.tick(0f)
        assertEquals(18f * engine.spec.dragToAngleRatio, engine.carousel.angle, .001f)
    }
    @Test fun `first tap turns a side card to the front without opening it`() {
        val engine = ShellEngine()
        engine.tick(1f) // Settle the entry track before the ring accepts focus.
        engine.focusPanel(2)
        engine.tick(1f / 60f)
        assertEquals(2, engine.selectedIndex)
        assertTrue(engine.cardExpanded)
        assertFalse(engine.exit.started)
        assertEquals(CarouselMotionState.SNAP, engine.carousel.state)
    }
    @Test fun `first tap on the front card only expands and keeps the ring still`() {
        val engine = ShellEngine()
        engine.tick(1f)
        engine.focusPanel(0)
        engine.tick(1f / 60f)
        assertEquals(0, engine.selectedIndex)
        assertTrue(engine.cardExpanded)
        assertEquals(CarouselMotionState.IDLE, engine.carousel.state)
        assertEquals(0f, engine.carousel.angle, .001f)
        assertTrue(engine.expandProgress > 0f)
        assertTrue(engine.expandProgress < 1f)
    }
    @Test fun `dragging the ring collapses the expanded card`() {
        val engine = ShellEngine()
        engine.tick(1f)
        engine.focusPanel(0)
        engine.tick(1f / 60f)
        engine.onGestureStart(); engine.onDrag(40f); engine.tick(1f / 60f)
        assertFalse(engine.cardExpanded)
        assertTrue(engine.expandProgress < 1f)
    }
    @Test fun `opening the card releases the held state`() {
        val engine = ShellEngine()
        engine.tick(1f)
        engine.focusPanel(1)
        engine.tick(1f / 60f)
        engine.beginExitForPanel(1)
        engine.tick(1f / 60f)
        assertTrue(engine.exit.started)
        assertFalse(engine.cardExpanded)
        assertEquals(1, engine.selectedIndex)
    }
}
