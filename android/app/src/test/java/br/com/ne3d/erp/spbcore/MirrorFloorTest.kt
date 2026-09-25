package br.com.ne3d.erp.spbcore

import br.com.ne3d.erp.spbcore.scene.MirrorFloor
import org.junit.Assert.assertEquals
import org.junit.Test

class MirrorFloorTest {
    @Test fun `mirror y is reflected around the explicit floor plane`() {
        assertEquals(-5f, MirrorFloor.mirroredY(-2f, 1f), 0f)
        assertEquals(-2f, MirrorFloor.mirroredY(-2f, -2f), 0f)
    }
}
