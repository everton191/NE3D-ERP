package br.com.ne3d.erp.spbcore

import br.com.ne3d.erp.spbcore.core.ShellEngine
import br.com.ne3d.erp.spbcore.scene.Panel3D
import org.junit.Assert.*
import org.junit.Test

class CarouselMorphTest {
    @Test fun `initial selection and angle agree including clamping and empty panels`() {
        for ((input, expected) in listOf(-1 to 0, 3 to 3, 99 to 7)) {
            val engine = ShellEngine(initialSelectedIndex = input)
            assertEquals(expected, engine.selectedIndex)
            assertEquals(-expected * 45f, engine.carousel.angle, .001f)
        }
        assertEquals(0, ShellEngine(panels = emptyList(), initialSelectedIndex = 5).selectedIndex)
    }
    @Test fun `input blocked during entry and exit works on the settled ring`() {
        val engine = ShellEngine(initialSelectedIndex = 2)
        engine.onGestureStart(); engine.onDrag(200f); engine.beginExitForPanel(4); engine.tick(.1f)
        assertEquals(2, engine.selectedIndex); assertFalse(engine.exit.started)
        assertEquals(-90f, engine.carousel.angle, .001f)
        engine.tick(1f)
        engine.onGestureStart(); engine.onDrag(120f); engine.tick(.016f)
        assertEquals(-90f + 120f * engine.spec.dragToAngleRatio, engine.carousel.angle, .001f)
        val angle = engine.carousel.angle
        engine.beginExitForPanel(3); engine.tick(.016f)
        assertEquals(3, engine.selectedIndex); assertTrue(engine.exit.started)
        assertEquals(angle, engine.carousel.angle, 0f)
        engine.onDrag(500f); engine.onFling(2000f); engine.beginExitForPanel(0); engine.tick(1f)
        assertEquals(3, engine.selectedIndex); assertEquals(angle, engine.carousel.angle, 0f)
        assertTrue(engine.consumeExitCompleted()); assertFalse(engine.consumeExitCompleted())
        assertFalse(engine.tick(.016f))
    }
    @Test fun `return uses selected identity after panel order changes`() {
        val panels = listOf("apps", "photos", "home").map { Panel3D(it, it, 0) }
        val engine = ShellEngine(panels = panels, initialSelectedIndex = panels.indexOfFirst { it.id == "photos" })
        assertEquals("photos", engine.state.panels[engine.selectedIndex].id)
        assertEquals(-120f, engine.carousel.angle, .001f)
    }
}
