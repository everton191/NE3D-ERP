package br.com.ne3d.erp.spbcore.input

import android.view.MotionEvent
import android.view.VelocityTracker
import br.com.ne3d.erp.spbcore.core.ShellEngine
import kotlin.math.abs
import kotlin.math.hypot

class GestureController(
    private val engine: ShellEngine,
    private val invalidate: () -> Unit,
    private val onTap: (Float) -> Unit = {},
    private val onPinch: (Float) -> Unit = {},
    private val onDragMoved: () -> Unit = {},
    private val onGestureStarted: () -> Unit = {},
    private val onGestureFinished: () -> Unit = {},
) {
    private var lastX = 0f; private var lastY = 0f; private var totalDx = 0f; private var totalDy = 0f; private var downTime = 0L; private var tracker: VelocityTracker? = null
    private var pinchStart = 0f; private var pinchLastRatio = 1f; private var pinching = false; private var pinched = false; private var dragMoved = false; private var dragActivated = false; private var horizontalDrag = false

    fun onTouch(event: MotionEvent): Boolean {
        if (engine.blocksInput()) return true
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                lastX = event.x; lastY = event.y; totalDx = 0f; totalDy = 0f; downTime = event.eventTime
                pinchStart = 0f; pinchLastRatio = 1f; pinching = false; pinched = false; dragMoved = false; dragActivated = false; horizontalDrag = false
                engine.onGestureStart(); tracker = VelocityTracker.obtain().also { it.addMovement(event) }; onGestureStarted(); invalidate()
            }
            MotionEvent.ACTION_POINTER_DOWN -> beginPinch(event)
            MotionEvent.ACTION_MOVE -> if (pinching) trackPinch(event) else trackDrag(event)
            MotionEvent.ACTION_POINTER_UP -> if (pinching && event.pointerCount == 2) endPinch(event)
            MotionEvent.ACTION_UP -> {
                tracker?.addMovement(event); tracker?.computeCurrentVelocity(1000); engine.onGestureEnd()
                val isTap = !pinched && event.eventTime - downTime <= TAP_TIMEOUT_MS &&
                    abs(totalDx) < TAP_SLOP_PX && abs(totalDy) < TAP_SLOP_PX
                when {
                    isTap -> onTap(event.x)
                    !pinched && dragActivated && horizontalDrag -> engine.onFling(tracker?.xVelocity ?: 0f)
                }
                pinching = false; pinchStart = 0f
                tracker?.recycle(); tracker = null; onGestureFinished(); invalidate()
            }
            MotionEvent.ACTION_CANCEL -> {
                engine.onGestureEnd(); pinchStart = 0f; pinchLastRatio = 1f; pinching = false; pinched = false; dragMoved = false
                tracker?.recycle(); tracker = null; onGestureFinished(); invalidate()
            }
        }; return true
    }

    private fun trackDrag(event: MotionEvent) {
        val dx = event.x - lastX; val dy = event.y - lastY
        totalDx += dx; totalDy += dy
        lastX = event.x; lastY = event.y
        tracker?.addMovement(event)
        if (!dragActivated) {
            if (abs(totalDx) < TAP_SLOP_PX && abs(totalDy) < TAP_SLOP_PX) return
            dragActivated = true
            dragMoved = true
            horizontalDrag = abs(totalDx) >= abs(totalDy)
            onDragMoved()
            // Entrega o deslocamento acumulado só depois de confirmar o gesto;
            // pequenas oscilações de um toque não podem girar o anel.
            if (horizontalDrag) engine.onDrag(totalDx) else engine.onVerticalDrag(totalDy)
        } else if (horizontalDrag) {
            engine.onDrag(dx)
        } else {
            engine.onVerticalDrag(dy)
        }
        invalidate()
    }

    private fun beginPinch(event: MotionEvent) {
        if (event.pointerCount != 2) return
        val start = pointerDistance(event)
        if (start <= 0f) return
        pinchStart = start; pinchLastRatio = 1f; pinching = true; pinched = true
        totalDx = 0f; totalDy = 0f
        onDragMoved()
    }

    private fun trackPinch(event: MotionEvent) {
        val start = pinchStart
        if (start <= 0f) return
        val ratio = pointerDistance(event) / start
        val delta = ratio / pinchLastRatio
        if (delta.isFinite() && abs(delta - 1f) >= .002f) {
            pinchLastRatio = ratio
            onPinch(delta)
            invalidate()
        }
    }

    private fun endPinch(event: MotionEvent) {
        val remaining = if (event.actionIndex == 0) 1 else 0
        pinchStart = 0f; pinching = false
        lastX = event.getX(remaining); lastY = event.getY(remaining)
        totalDx = 0f; totalDy = 0f
        tracker?.addMovement(event)
    }

    private fun pointerDistance(event: MotionEvent): Float {
        if (event.pointerCount < 2) return 0f
        return hypot(event.getX(0) - event.getX(1), event.getY(0) - event.getY(1))
    }

    private companion object {
        const val TAP_SLOP_PX = 14f; const val TAP_TIMEOUT_MS = 180L
    }
}
