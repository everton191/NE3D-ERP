package br.com.ne3d.erp.carousel3d

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class CarouselPlacementTest {

    private val phone = CarouselRect(left = 12f, top = 34f, width = 360f, height = 315f)

    @Test
    fun `maps css pixels 1 to 1 when the host matches the viewport`() {
        val placed = CarouselPlacement.place(phone, 1080f, 2448f, 1080f, 2448f)

        assertEquals(PlacedCarouselRect(12f, 34f, 360f, 315f), placed)
    }

    @Test
    fun `scales by the host to viewport ratio instead of the density`() {
        val placed = CarouselPlacement.place(phone, 1080f, 2448f, 540f, 1224f)

        assertNotNull(placed)
        assertEquals(6f, placed!!.left, 0.0f)
        assertEquals(17f, placed.top, 0.0f)
        assertEquals(180f, placed.width, 0.0f)
        assertEquals(157.5f, placed.height, 0.0f)
    }

    @Test
    fun `clamps a card that scrolled above the viewport`() {
        val placed = CarouselPlacement.place(phone.copy(top = -40f), 1080f, 2448f, 1080f, 2448f)

        assertNotNull(placed)
        assertEquals(0f, placed!!.top, 0.0f)
        assertEquals(275f, placed.height, 0.0f)
    }

    @Test
    fun `returns null when the card left the viewport`() {
        assertNull(CarouselPlacement.place(phone.copy(top = 2600f), 1080f, 2448f, 1080f, 2448f))
    }

    @Test
    fun `returns null for degenerate inputs`() {
        assertNull(CarouselPlacement.place(phone, 0f, 2448f, 1080f, 2448f))
        assertNull(CarouselPlacement.place(phone, 1080f, 0f, 1080f, 2448f))
        assertNull(CarouselPlacement.place(phone.copy(width = 0f), 1080f, 2448f, 1080f, 2448f))
        assertNull(CarouselPlacement.place(phone.copy(height = -10f), 1080f, 2448f, 1080f, 2448f))
        assertNull(CarouselPlacement.place(phone, 1080f, 2448f, 0f, 0f))
    }

    @Test
    fun `never places a host outside the native bounds`() {
        val huge = CarouselRect(left = -50f, top = -50f, width = 4000f, height = 4000f)
        val placed = CarouselPlacement.place(huge, 1080f, 2448f, 1080f, 2448f)

        assertNotNull(placed)
        assertEquals(0f, placed!!.left, 0.0f)
        assertEquals(0f, placed.top, 0.0f)
        assertEquals(1080f, placed.width, 0.0f)
        assertEquals(2448f, placed.height, 0.0f)
    }
}
