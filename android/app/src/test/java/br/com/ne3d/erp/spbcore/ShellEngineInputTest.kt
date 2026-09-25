package br.com.ne3d.erp.spbcore

import br.com.ne3d.erp.spbcore.core.ShellEngine
import org.junit.Assert.assertEquals
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
}
