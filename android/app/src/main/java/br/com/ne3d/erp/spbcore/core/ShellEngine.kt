package br.com.ne3d.erp.spbcore.core

import br.com.ne3d.erp.spbcore.carousel.*
import br.com.ne3d.erp.spbcore.scene.Panel3D
import br.com.ne3d.erp.spbcore.animation.CarouselEntryTransition
import br.com.ne3d.erp.spbcore.animation.CarouselExitTransition
import br.com.ne3d.erp.spbcore.animation.CarouselIdleController
import br.com.ne3d.erp.spbcore.effects.EffectContext
import br.com.ne3d.erp.spbcore.effects.PanelEffectDebug
import br.com.ne3d.erp.spbcore.effects.configureEffect
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.sin
import kotlin.math.PI
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicInteger

class ShellEngine(
    val spec: CarouselMotionSpec = CarouselMotionSpec(),
    includeRealSnapshots: Boolean = true,
    panels: List<Panel3D>? = null,
    initialSelectedIndex: Int = 0,
) {
    val state = SceneState(); val carousel = CarouselPhysics(spec)
    val entry = CarouselEntryTransition(spec)
    val exit = CarouselExitTransition(spec)
    val idle = CarouselIdleController()
    @Volatile var selectedIndex = 0
        private set
    /** True while the first tap holds a card focused and the ring must not auto-wake. */
    @Volatile var cardExpanded = false
        private set
    /** 0..1 ease applied by the renderer as an extra scale on the focused card. */
    @Volatile var expandProgress = 0f
        private set
    var cameraY = spec.cameraY
        private set
    var cameraZ = spec.cameraZ
        private set
    private var autoRotationRequested = false
    private var autoWakePending = false
    private val commands = ConcurrentLinkedQueue<Command>()
    private val effectContext: EffectContext
    private val pendingDxBits = AtomicInteger(0)
    private val pendingDyBits = AtomicInteger(0)
    init {
        val snapshotKind = if (includeRealSnapshots) br.com.ne3d.erp.spbcore.scene.PanelTextureKind.REAL_SNAPSHOT else br.com.ne3d.erp.spbcore.scene.PanelTextureKind.STATIC
        state.panels += panels ?: listOf(
            Panel3D("home", "Home", 0xFF285B8C.toInt(), snapshotKind),
            Panel3D("agenda", "Agenda", 0xFF315F51.toInt(), snapshotKind),
            Panel3D("photos", "Fotos", 0xFF653A68.toInt(), snapshotKind),
            Panel3D("apps", "Apps", 0xFF405E86.toInt(), snapshotKind),
            Panel3D("weather", "Clima", 0xFF456E78.toInt(), snapshotKind),
            Panel3D("clock", "Relógio", 0xFF4A5F89.toInt(), snapshotKind),
            Panel3D("moon", "Lua", 0xFF48546B.toInt(), snapshotKind),
            Panel3D("gallery", "Galeria", 0xFF705747.toInt(), snapshotKind),
        )
        if (state.panels.isNotEmpty()) {
            selectedIndex = initialSelectedIndex.coerceIn(state.panels.indices)
            carousel.setAngle(-selectedIndex * 360f / state.panels.size)
        }
        effectContext = EffectContext(panelCount = state.panels.size, motionSpec = spec)
        var index = 0
        while (index < state.panels.size) {
            state.panels[index].effectStack.prepare(effectContext)
            state.panels[index].deformerStack.prepare(effectContext)
            state.panels[index].configureEffect(br.com.ne3d.erp.spbcore.effects.PanelEffectMode.NONE)
            index++
        }
    }
    /** Main/UI thread entry points only enqueue; the GL thread owns all physics mutation. */
    fun onDrag(dx: Float) = accumulate(pendingDxBits, dx)
    fun onGestureStart() = commands.add(Command.GestureStart)
    fun onGestureEnd() = commands.add(Command.GestureEnd)
    fun onVerticalDrag(dy: Float) = accumulate(pendingDyBits, dy)
    fun onPinch(scaleDelta: Float) = commands.add(Command.Pinch(scaleDelta))
    fun onFling(velocityX: Float) = commands.add(Command.Fling(velocityX))
    fun beginExitForPanel(index: Int) = commands.add(Command.ExitPanel(index))
    /** First tap: turn the card to the front and hold it there without leaving the ring. */
    fun focusPanel(index: Int) = commands.add(Command.FocusPanel(index))
    fun panelIndexAt(tapX: Float, surfaceWidth: Float): Int {
        if (state.panels.isEmpty()) return 0
        val targetX = (tapX / surfaceWidth.coerceAtLeast(1f) - .5f) * 2f
        var bestIndex = 0; var bestDistance = Float.MAX_VALUE
        val step = 360f / state.panels.size
        state.panels.indices.forEach { index ->
            val projectedX = sin((index * step + carousel.angle) * PI / 180.0).toFloat()
            val distance = abs(projectedX - targetX)
            if (distance < bestDistance) { bestDistance = distance; bestIndex = index }
        }
        return bestIndex
    }
    fun beginAutoRotation() = commands.add(Command.AutoRotate)
    fun blocksInput(): Boolean = entry.active || exit.started

    private fun applyVerticalDrag(dy: Float) {
        if (abs(dy) < .01f) return
        cameraY = (cameraY + dy * spec.verticalDragToCameraY).coerceIn(spec.minimumCameraY, spec.maximumCameraY)
    }
    private fun applyExitForPanel(index: Int) {
        if (blocksInput() || state.panels.isEmpty()) return
        selectedIndex = index.coerceIn(state.panels.indices)
        state.panels[selectedIndex].configureEffect(PanelEffectDebug.mode)
        autoRotationRequested = false; autoWakePending = false; cardExpanded = false
        // Stop physics at its current angle so a lateral card does not teleport.
        carousel.setAngle(carousel.angle)
        exit.begin()
    }
    private fun applyFocusForPanel(index: Int) {
        if (blocksInput() || state.panels.isEmpty()) return
        val count = state.panels.size
        val target = index.coerceIn(0 until count)
        selectedIndex = target
        autoRotationRequested = false; autoWakePending = false; cardExpanded = true
        idle.onInteraction()
        val step = 360f / count
        val front = Math.floorMod(Math.round(-carousel.angle / step), count)
        // The ring only turns when the tapped card is not the one already facing us.
        if (front != target) carousel.snapToIndex(target, count)
    }
    /** Eases expandProgress toward its target; reports true while it still moves. */
    private fun tickExpand(dt: Float): Boolean {
        val target = if (cardExpanded) 1f else 0f
        if (expandProgress == target) return false
        if (dt > 0f) {
            expandProgress += (target - expandProgress) * (1f - exp(-spec.expandEase * dt))
            if (abs(target - expandProgress) < .004f) expandProgress = target
        }
        return expandProgress != target
    }
    fun tick(dt: Float): Boolean {
        val wasExiting = exit.started
        drainCommands()
        if (exit.started && !wasExiting) return true
        val expanding = tickExpand(dt)
        val entering = entry.tick(dt)
        if (entering) return true
        if (exit.active) return exit.tick(dt)
        if (exit.started) return false // hold fullscreen until the host has drawn the next page
        if (carousel.dragging) return true
        val settling = carousel.tick(dt, state.panels.size)
        if (settling) return true
        if (autoRotationRequested) {
            carousel.autoRotate(dt * AUTO_ROTATE_DEGREES_PER_SECOND)
            return true
        }
        if (expanding) return true
        idle.onIdle()
        autoWakePending = !cardExpanded
        return false
    }
    fun consumeExitCompleted() = exit.consumeCompleted()
    fun consumeAutoWakePending(): Boolean = autoWakePending.also { autoWakePending = false }
    /** GL-owner terminal cleanup; safe to call more than once. */
    fun releaseEffects() { var index = 0; while (index < state.panels.size) { state.panels[index].effectStack.release(); state.panels[index].deformerStack.release(); index++ } }

    private fun drainCommands() {
        while (true) {
            val command = commands.poll() ?: break
            if (blocksInput()) continue
            when (command) {
            Command.GestureStart -> { autoRotationRequested = false; autoWakePending = false; carousel.beginDrag(); idle.onInteraction() }
            else -> consumePendingMoves()
            }
            when (command) {
            Command.GestureStart -> Unit
            Command.GestureEnd -> { carousel.endDrag(); idle.onSettling() }
            is Command.Fling -> { autoRotationRequested = false; autoWakePending = false; cardExpanded = false; idle.onSettling(); carousel.fling(command.velocityX) }
            is Command.Pinch -> { if (command.scaleDelta > .01f) cameraZ = (cameraZ / command.scaleDelta).coerceIn(spec.minimumCameraZ, spec.maximumCameraZ) }
            is Command.ExitPanel -> applyExitForPanel(command.index)
            is Command.FocusPanel -> applyFocusForPanel(command.index)
            Command.AutoRotate -> { if (!carousel.dragging && !exit.active) autoRotationRequested = true }
            }
        }
        consumePendingMoves()
    }

    private fun consumePendingMoves() {
        val dx = Float.fromBits(pendingDxBits.getAndSet(0))
        val dy = Float.fromBits(pendingDyBits.getAndSet(0))
        if (blocksInput()) return
        if (dx != 0f) { autoRotationRequested = false; autoWakePending = false; cardExpanded = false; idle.onInteraction(); carousel.dragBy(dx) }
        if (dy != 0f) { autoRotationRequested = false; autoWakePending = false; idle.onInteraction(); applyVerticalDrag(dy) }
    }
    private fun accumulate(target: AtomicInteger, delta: Float) {
        while (true) {
            val before = target.get()
            val after = Float.fromBits(before) + delta
            if (target.compareAndSet(before, after.toBits())) return
        }
    }

    private sealed interface Command {
        data object GestureStart : Command
        data object GestureEnd : Command
        data object AutoRotate : Command
        data class Fling(val velocityX: Float) : Command
        data class Pinch(val scaleDelta: Float) : Command
        data class ExitPanel(val index: Int) : Command
        data class FocusPanel(val index: Int) : Command
    }
    companion object { const val AUTO_ROTATE_DELAY_MILLIS = 5_000L; private const val AUTO_ROTATE_DEGREES_PER_SECOND = 18f }
}
