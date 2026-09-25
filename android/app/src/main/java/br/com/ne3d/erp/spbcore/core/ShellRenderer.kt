package br.com.ne3d.erp.spbcore.core

import android.opengl.*
import br.com.ne3d.erp.spbcore.camera.ShellCamera
import br.com.ne3d.erp.spbcore.carousel.CarouselLayout
import br.com.ne3d.erp.spbcore.carousel.MutablePanelTransform
import br.com.ne3d.erp.spbcore.effects.EffectInput
import br.com.ne3d.erp.spbcore.scene.MeshVertexLayout
import br.com.ne3d.erp.spbcore.scene.MirrorFloor
import br.com.ne3d.erp.spbcore.debug.FrameMetrics
import br.com.ne3d.erp.spbcore.texture.TextureManager
import android.graphics.Bitmap
import android.util.Log
import android.os.Debug
import java.nio.*
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.*
import java.util.concurrent.atomic.AtomicReference

/**
 * SPB core renderer (Simplifica port).
 *
 * Ported from launcher-3d `shell3d/core/ShellRenderer.kt` with one deliberate change:
 * the widget-scene draw pass and its `WidgetSceneController` dependency were removed,
 * because widget scenes are launcher-specific (weather/music/notifications/...).
 * Panel pass, mirror floor pass, focus/morph, texture upload and frame metrics are untouched.
 */
class ShellRenderer(
    val engine: ShellEngine,
    private val onFrameDrawn: () -> Unit,
    private val onAutoWakeNeeded: () -> Unit,
    private val onEngineIdle: () -> Unit,
    private val onSurfaceReady: () -> Unit,
    private val onExitFinished: () -> Unit,
    private val onTextureUploadsDrained: () -> Unit,
    private val pendingTextures: Array<PendingTexture>,
    private val onEntryFrameReady: () -> Unit = {},
) : GLSurfaceView.Renderer {
    data class PendingTexture(val key: String, val bitmap: AtomicReference<Bitmap?>)
    private val camera = ShellCamera(engine.spec); private val textures = TextureManager(); private val vp = FloatArray(16); private val model = FloatArray(16); private val mvp = FloatArray(16)
    private val layout = CarouselLayout(engine.spec); private val metrics = FrameMetrics()
    private var program = 0; private var width = 1; private var height = 1; private var lastNanos = 0L
    private var positionLocation = -1; private var uvLocation = -1; private var matrixLocation = -1; private var textureLocation = -1; private var alphaLocation = -1; private var mirrorPassLocation = -1; private var colorLocation = -1; private var useTextureLocation = -1
    private var panelHalfHeight = engine.spec.panelAspectRatio
    private val panelTransform = MutablePanelTransform()
    private val effectInput = EffectInput()
    private var entryFrameDrawn = false
    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        // Fundo igual ao do tema escuro da Home (#0c1118) para o painel não ler como um buraco preto.
        GLES30.glClearColor(.047f,.067f,.094f,1f)
        GLES30.glEnable(GLES30.GL_DEPTH_TEST); GLES30.glEnable(GLES30.GL_BLEND)
        GLES30.glBlendFunc(GLES30.GL_SRC_ALPHA,GLES30.GL_ONE_MINUS_SRC_ALPHA)
        textures.resetForContext()
        entryFrameDrawn = false
        program = program()
        positionLocation = GLES30.glGetAttribLocation(program, "aPosition")
        uvLocation = GLES30.glGetAttribLocation(program, "aUv")
        matrixLocation = GLES30.glGetUniformLocation(program, "uMvp")
        textureLocation = GLES30.glGetUniformLocation(program, "uTexture")
        alphaLocation = GLES30.glGetUniformLocation(program, "uAlpha")
        mirrorPassLocation = GLES30.glGetUniformLocation(program, "uMirrorPass")
        colorLocation = GLES30.glGetUniformLocation(program, "uColor")
        useTextureLocation = GLES30.glGetUniformLocation(program, "uUseTexture")
        engine.state.panels.filter { it.textureKind == br.com.ne3d.erp.spbcore.scene.PanelTextureKind.STATIC }
            .forEach { metrics.textureUpload(textures.label(it.id, it.label, it.color).bytes) }
        lastNanos = System.nanoTime()
        onSurfaceReady()
    }
    override fun onSurfaceChanged(gl: GL10?, w: Int, h: Int) {
        width = w; height = h
        // Cards are vertical 9:16 faces regardless of the phone viewport.
        panelHalfHeight = engine.spec.panelAspectRatio
        GLES30.glViewport(0, 0, w, h)
    }
    override fun onDrawFrame(gl: GL10?) {
        val now = System.nanoTime()
        val frameCpuStart = Debug.threadCpuTimeNanos()
        val animationStart = Debug.threadCpuTimeNanos()
        // Entry/exit tracks are not active in this prototype yet; keep their cost separately visible.
        val animationNanos = Debug.threadCpuTimeNanos() - animationStart
        val physicsStart = Debug.threadCpuTimeNanos()
        val dtSeconds = ((now-lastNanos)/1_000_000_000f).coerceIn(0f,.05f)
        lastNanos=now
        val textureStart = Debug.threadCpuTimeNanos()
        var uploadedTexture = false
        for (pending in pendingTextures) {
            pending.bitmap.getAndSet(null)?.let { bitmap ->
                uploadedTexture = true
                metrics.textureUpload(textures.update(pending.key, bitmap).bytes)
                Log.i("Shell3D.Capture", "${pending.key} bitmap uploaded ${bitmap.width}x${bitmap.height}")
                bitmap.recycle()
            }
        }
        if (uploadedTexture && pendingTextures.none { it.bitmap.get() != null }) onTextureUploadsDrained()
        val textureNanos = Debug.threadCpuTimeNanos() - textureStart
        val selected = engine.state.panels.getOrNull(engine.selectedIndex)
        val textureReady = selected == null || textures.textureId(selected.id) != 0
        // Never spend the entry track while the selected real snapshot is being captured.
        val active = if (!textureReady) false else engine.tick(if (entryFrameDrawn) dtSeconds else 0f)
        val physicsNanos = Debug.threadCpuTimeNanos() - physicsStart - textureNanos
        val matrixStart = Debug.threadCpuTimeNanos()
        GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT or GLES30.GL_DEPTH_BUFFER_BIT)
        val exiting = engine.exit.started
        val morphing = exiting || engine.entry.active
        val focus = if (!morphing) 0f else if (exiting) engine.exit.focusProgress else engine.entry.focusProgress
        val cameraProgress = EffectivePanelRender.smoothstep(focus)
        val morphFov = engine.spec.cameraFov + (engine.spec.entryCameraFov - engine.spec.cameraFov) * cameraProgress
        val morphCameraZ = engine.spec.cameraZ + (engine.spec.entryCameraZ - engine.spec.cameraZ) * cameraProgress
        val morphCameraY = engine.cameraY + (engine.spec.lookAtY - engine.cameraY) * cameraProgress
        val focusZ = (layout.closedRadius(engine.state.panels.size) * layout.sizeScale(engine.state.panels.size) + .55f)
            .coerceAtMost(engine.spec.entryCameraZ - 2f)
        // A page snapshot has the viewport's aspect. Its plane restores that aspect at focus,
        // while ring faces retain their existing 9:16 geometry. No cropping at the handoff.
        val pageAspect = height.toFloat() / width.coerceAtLeast(1)
        val focusScale = EffectivePanelRender.calculateFocusScale(width, height, pageAspect,
            engine.spec.entryCameraFov, engine.spec.entryCameraZ - focusZ)
        camera.matrix(width, height, vp, morphFov, morphCameraZ, morphCameraY)
        val matrixNanos = Debug.threadCpuTimeNanos() - matrixStart
        GLES30.glUseProgram(program); val position=positionLocation; val uv=uvLocation; val matrix=matrixLocation; val texture=textureLocation; val alpha=alphaLocation
        GLES30.glUniform1i(useTextureLocation, 1); GLES30.glUniform4f(colorLocation,1f,1f,1f,1f)
        var drawn = 0
        var layoutNanos = 0L
        var panelMatrixNanos = 0L
        val drawStart = Debug.threadCpuTimeNanos()
        val count=engine.state.panels.size; engine.state.panels.forEachIndexed { index,panel ->
            val layoutStart = Debug.threadCpuTimeNanos()
            layout.transformInto(index, count, engine.carousel.angle, engine.spec.radius, 1f, panelTransform)
            panel.baseTransform.x = panelTransform.x
            panel.baseTransform.y = panelTransform.y
            panel.baseTransform.z = panelTransform.z
            panel.baseTransform.rotationY = panelTransform.rotationY
            panel.baseTransform.scaleX = panelTransform.scale
            panel.baseTransform.scaleY = panelTransform.scale
            panel.baseTransform.scaleZ = panelTransform.scale
            panel.baseTransform.alpha = panelTransform.alpha
            panel.baseTransform.visible = panelTransform.visible
            effectInput.panelIndex = index
            effectInput.selectedIndex = engine.selectedIndex
            effectInput.angle = panelTransform.angle
            effectInput.velocity = engine.carousel.velocity
            effectInput.progress = if (morphing && index == engine.selectedIndex) EffectivePanelRender.effectProgress(focus) else 0f
            effectInput.direction = 1f
            effectInput.phase = if (exiting && index == engine.selectedIndex) br.com.ne3d.erp.spbcore.effects.EffectPhase.CLOSING else br.com.ne3d.erp.spbcore.effects.EffectPhase.NONE
            panel.effectStack.apply(panel, effectInput)
            if (panel.deformerStack.isEmpty()) panel.resetRenderMesh() else panel.deformerStack.apply(panel, effectInput)
            layoutNanos += Debug.threadCpuTimeNanos() - layoutStart
            val transform = panel.renderTransform
            if (morphing) EffectivePanelRender.applyFocus(transform, index == engine.selectedIndex, focus,
                engine.spec.lookAtY, focusZ, focusScale, focusScale * pageAspect / panelHalfHeight)
            panel.effectiveScale = transform.scaleX
            panel.effectiveAlpha = transform.alpha
            if (!transform.visible || textures.textureId(panel.id) == 0) return@forEachIndexed
            panel.renderMesh.vertices.position(MeshVertexLayout.POSITION_FLOAT_OFFSET); GLES30.glVertexAttribPointer(position,MeshVertexLayout.POSITION_COMPONENTS,GLES30.GL_FLOAT,false,panel.renderMesh.strideBytes,panel.renderMesh.vertices); GLES30.glEnableVertexAttribArray(position)
            panel.renderMesh.vertices.position(MeshVertexLayout.UV_FLOAT_OFFSET); GLES30.glVertexAttribPointer(uv,MeshVertexLayout.UV_COMPONENTS,GLES30.GL_FLOAT,false,panel.renderMesh.strideBytes,panel.renderMesh.vertices); GLES30.glEnableVertexAttribArray(uv)
            val panelMatrixStart = Debug.threadCpuTimeNanos()
            Matrix.setIdentityM(model,0); Matrix.translateM(model,0,transform.x,transform.y,transform.z); Matrix.rotateM(model,0,transform.rotationY,0f,1f,0f); Matrix.scaleM(model,0,transform.scaleX,transform.scaleY,transform.scaleZ); Matrix.multiplyMM(mvp,0,vp,0,model,0)
            panelMatrixNanos += Debug.threadCpuTimeNanos() - panelMatrixStart
            GLES30.glUniformMatrix4fv(matrix,1,false,mvp,0); GLES30.glUniform1i(mirrorPassLocation,0); GLES30.glUniform1f(alpha,panel.effectiveAlpha); GLES30.glActiveTexture(GLES30.GL_TEXTURE0); GLES30.glBindTexture(GLES30.GL_TEXTURE_2D,textures.textureId(panel.id)); GLES30.glUniform1i(texture,0); panel.renderMesh.indices.position(0); GLES30.glDrawElements(GLES30.GL_TRIANGLES,panel.renderMesh.indexCount,GLES30.GL_UNSIGNED_SHORT,panel.renderMesh.indices); drawn++
        }; GLES30.glDisableVertexAttribArray(position); GLES30.glDisableVertexAttribArray(uv)
        // Mirror floor pass: every visible panel reuses the transform and mesh from the real pass.
        engine.state.panels.forEach { panel ->
            val transform = panel.renderTransform
            if (!transform.visible || textures.textureId(panel.id) == 0 || EffectivePanelRender.mirrorAlpha(focus) == 0f) return@forEach
            panel.renderMesh.vertices.position(MeshVertexLayout.POSITION_FLOAT_OFFSET); GLES30.glVertexAttribPointer(position,MeshVertexLayout.POSITION_COMPONENTS,GLES30.GL_FLOAT,false,panel.renderMesh.strideBytes,panel.renderMesh.vertices); GLES30.glEnableVertexAttribArray(position)
            panel.renderMesh.vertices.position(MeshVertexLayout.UV_FLOAT_OFFSET); GLES30.glVertexAttribPointer(uv,MeshVertexLayout.UV_COMPONENTS,GLES30.GL_FLOAT,false,panel.renderMesh.strideBytes,panel.renderMesh.vertices); GLES30.glEnableVertexAttribArray(uv)
            // Keep the floor separation equal to the ring's face-to-face gap.
            val floorY = -panelHalfHeight - engine.spec.panelGap
            Matrix.setIdentityM(model,0); Matrix.translateM(model,0,transform.x,MirrorFloor.mirroredY(floorY, transform.y),transform.z); Matrix.rotateM(model,0,transform.rotationY,0f,1f,0f); Matrix.scaleM(model,0,transform.scaleX,-transform.scaleY,transform.scaleZ); Matrix.multiplyMM(mvp,0,vp,0,model,0)
            GLES30.glUniformMatrix4fv(matrix,1,false,mvp,0); GLES30.glUniform1i(mirrorPassLocation,1); GLES30.glUniform1f(alpha,panel.effectiveAlpha * .30f * EffectivePanelRender.mirrorAlpha(focus)); GLES30.glActiveTexture(GLES30.GL_TEXTURE0); GLES30.glBindTexture(GLES30.GL_TEXTURE_2D,textures.textureId(panel.id)); GLES30.glUniform1i(texture,0); panel.renderMesh.indices.position(0); GLES30.glDrawElements(GLES30.GL_TRIANGLES,panel.renderMesh.indexCount,GLES30.GL_UNSIGNED_SHORT,panel.renderMesh.indices); drawn++
        }
        GLES30.glDisableVertexAttribArray(position); GLES30.glDisableVertexAttribArray(uv)
        val drawNanos = Debug.threadCpuTimeNanos() - drawStart
        metrics.record(now, Debug.threadCpuTimeNanos() - frameCpuStart, animationNanos, physicsNanos, layoutNanos, matrixNanos + panelMatrixNanos, drawNanos, textureNanos, drawn, drawn)
        if (textureReady && !entryFrameDrawn) { entryFrameDrawn = true; onEntryFrameReady() }
        if (engine.consumeExitCompleted()) {
            Log.i("Shell3D.Morph", "focus complete id=${selected?.id} x=${selected?.renderTransform?.x} scale=${selected?.effectiveScale} mirror=${EffectivePanelRender.mirrorAlpha(focus)}")
            onExitFinished()
        }
        if (engine.consumeAutoWakePending()) onAutoWakeNeeded()
        if (!active) onEngineIdle()
        onFrameDrawn()
    }
    fun beginMeasurement() = metrics.reset()
    fun publishMeasurement(label: String) = metrics.publish(label)
    fun release() { engine.releaseEffects(); for (pending in pendingTextures) pending.bitmap.getAndSet(null)?.recycle(); textures.destroy() }
    private fun program(): Int {
        fun shader(type: Int, source: String): Int {
            return GLES30.glCreateShader(type).also { handle ->
                GLES30.glShaderSource(handle, source)
                GLES30.glCompileShader(handle)
            }
        }
        val vertex = shader(GLES30.GL_VERTEX_SHADER, """
            #version 300 es
            in vec3 aPosition; in vec2 aUv; uniform mat4 uMvp; out vec2 vUv;
            void main(){vUv=aUv;gl_Position=uMvp*vec4(aPosition,1.);}
        """.trimIndent())
        val fragment = shader(GLES30.GL_FRAGMENT_SHADER, """
            #version 300 es
            precision mediump float; in vec2 vUv; uniform sampler2D uTexture; uniform float uAlpha; uniform int uMirrorPass; uniform vec4 uColor; uniform int uUseTexture; out vec4 color;
            void main(){color=uUseTexture==1?texture(uTexture,vUv):uColor;if(color.a<=.001)discard;float fade=uMirrorPass==1?smoothstep(.20,1.,vUv.y):1.;color.a*=uAlpha*fade;}
        """.trimIndent())
        return GLES30.glCreateProgram().also { handle ->
            GLES30.glAttachShader(handle, vertex); GLES30.glAttachShader(handle, fragment)
            GLES30.glLinkProgram(handle); GLES30.glDeleteShader(vertex); GLES30.glDeleteShader(fragment)
        }
    }
}




