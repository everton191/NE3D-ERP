package br.com.ne3d.erp.spbcore.scene

/** Shared mirror-plane math used by the GL floor pass and its unit tests. */
object MirrorFloor {
    fun mirroredY(floorY: Float, panelY: Float): Float = 2f * floorY - panelY
}
