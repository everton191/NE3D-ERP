package br.com.ne3d.erp.spbcore

import br.com.ne3d.erp.spbcore.core.FrameReason
import br.com.ne3d.erp.spbcore.core.FrameReasons
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FrameReasonsTest {
    @Test fun `reasons combine and can be independently removed`() {
        val reasons = FrameReasons()
        reasons.activate(FrameReason.INPUT)
        reasons.activate(FrameReason.TEXTURE_UPLOAD)

        reasons.deactivate(FrameReason.INPUT)

        assertFalse(reasons.contains(FrameReason.INPUT))
        assertTrue(reasons.contains(FrameReason.TEXTURE_UPLOAD))
        assertTrue(reasons.any())
    }

    @Test fun `clear makes the scheduler idle`() {
        val reasons = FrameReasons()
        FrameReason.entries.forEach(reasons::activate)
        reasons.clear()

        assertFalse(reasons.any())
    }
}
