package br.com.ne3d.erp

import android.content.Intent
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.test.espresso.Espresso
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import br.com.ne3d.erp.spbcore.host.CarouselSurfaceView
import org.hamcrest.Description
import org.hamcrest.Matcher
import org.hamcrest.TypeSafeMatcher
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Valida em aparelho o gesto de pinca para dentro do carrossel nativo da Home.
 *
 * `sendevent` nao e permitido para o usuario shell (SELinux), entao os MotionEvents
 * de dois dedos sao despachados direto para a view do carrossel, atravessando o
 * mesmo caminho real: [CarouselSurfaceView] -> GestureController.onTouch -> onPinch
 * -> SimplificaCarousel3DPlugin -> WebView -> abrirPersonalizarAtalhos().
 *
 * A assercao final e feita no DOM da WebView (o modal "Personalizar atalhos" so
 * existe se a pinca atravessou toda a cadeia), porque o overlay de login pode
 * cobrir a tela mesmo com o modal ja aberto.
 */
@RunWith(AndroidJUnit4::class)
class CarouselPinchDeviceTest {

    private var captured: CarouselSurfaceView? = null

    @Test
    fun pinchInOpensTheQuickActionsEditor() {
        var ok = false
        var lastError: Throwable? = null
        var webView: WebView? = null

        fun attempt(): Boolean {
            val result = runCatching {
                Espresso.onView(webViewMatcher()).check { view, _ -> webView = view as WebView }
                Espresso.onView(carouselMatcher()).perform(pinchIn())
            }
            if (result.isSuccess) return true
            lastError = result.exceptionOrNull()
            return false
        }

        // O aparelho ja deve estar logado na Home: primeiro tenta sem relancar nada.
        var deadline = System.currentTimeMillis() + 8_000L
        while (System.currentTimeMillis() < deadline && !ok) {
            ok = attempt()
            if (!ok) SystemClock.sleep(500)
        }

        if (!ok) {
            val context = InstrumentationRegistry.getInstrumentation().targetContext
            val launch = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launch)
            deadline = System.currentTimeMillis() + 35_000L
            while (System.currentTimeMillis() < deadline && !ok) {
                ok = attempt()
                if (!ok) SystemClock.sleep(750)
            }
        }
        if (!ok) throw AssertionError(describe(lastError))

        val target = webView ?: throw AssertionError("WebView da aplicacao nao capturada")
        val opened = evaluate(target, EDITOR_MARKER_JS)
        assertTrue("A pinca nao abriu o editor de atalhos (DOM = $opened)", opened == "true")
    }

    private fun webViewMatcher(): Matcher<View> = object : TypeSafeMatcher<View>() {
        override fun describeTo(description: Description) {
            description.appendText("WebView")
        }

        override fun matchesSafely(item: View): Boolean = item is WebView
    }

    private fun carouselMatcher(): Matcher<View> = object : TypeSafeMatcher<View>() {
        override fun describeTo(description: Description) {
            description.appendText("CarouselSurfaceView")
        }

        override fun matchesSafely(item: View): Boolean = item is CarouselSurfaceView
    }

    private fun pinchIn() = object : ViewAction {
        override fun getConstraints(): Matcher<View> = isAssignableFrom(CarouselSurfaceView::class.java)
        override fun getDescription(): String = "pinca para dentro do carrossel"
        override fun perform(uiController: UiController, view: View) {
            val surface = view as CarouselSurfaceView
            captured = surface

            val unblocked = System.currentTimeMillis() + 12_000L
            while (surface.engine.blocksInput() && System.currentTimeMillis() < unblocked) {
                uiController.loopMainThreadForAtLeast(100)
            }

            val w = view.width.toFloat()
            val h = view.height.toFloat()
            require(w > 100f && h > 100f) { "Superficie do carrossel sem tamanho valido: ${w}x${h}" }

            val cy = h * 0.5f
            val leftStart = w * 0.28f
            val rightStart = w * 0.72f
            val leftEnd = w * 0.36f
            val rightEnd = w * 0.64f
            val downTime = SystemClock.uptimeMillis()

            fun event(action: Int, pointers: Int, xs: FloatArray): MotionEvent {
                val props = Array(pointers) { i ->
                    MotionEvent.PointerProperties().apply {
                        id = i
                        toolType = MotionEvent.TOOL_TYPE_FINGER
                    }
                }
                val coords = Array(pointers) { i ->
                    MotionEvent.PointerCoords().apply {
                        x = xs[i]
                        y = cy
                        pressure = 1f
                        size = 1f
                    }
                }
                return MotionEvent.obtain(
                    downTime, SystemClock.uptimeMillis(), action, pointers, props, coords,
                    0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
                )
            }

            fun dispatch(action: Int, pointers: Int, xs: FloatArray) {
                val ev = event(action, pointers, xs)
                view.dispatchTouchEvent(ev)
                ev.recycle()
                uiController.loopMainThreadForAtLeast(FRAME_MS)
            }

            dispatch(MotionEvent.ACTION_DOWN, 1, floatArrayOf(leftStart))

            val pointerDown = MotionEvent.ACTION_POINTER_DOWN or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT)
            dispatch(pointerDown, 2, floatArrayOf(leftStart, rightStart))

            repeat(6) { step ->
                val t = (step + 1) / 6f
                dispatch(
                    MotionEvent.ACTION_MOVE, 2,
                    floatArrayOf(
                        leftStart + (leftEnd - leftStart) * t,
                        rightStart + (rightEnd - rightStart) * t
                    )
                )
            }

            val pointerUp = MotionEvent.ACTION_POINTER_UP or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT)
            dispatch(pointerUp, 2, floatArrayOf(leftEnd, rightEnd))
            dispatch(MotionEvent.ACTION_UP, 1, floatArrayOf(leftEnd))

            uiController.loopMainThreadForAtLeast(900)
        }
    }

    private fun evaluate(webView: WebView, script: String): String {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val latch = CountDownLatch(1)
        var result = "null"
        instrumentation.runOnMainSync {
            webView.evaluateJavascript(script) { value ->
                result = value
                latch.countDown()
            }
        }
        if (!latch.await(10, TimeUnit.SECONDS)) return "timeout"
        return result
    }

    private fun describe(error: Throwable?): String {
        val chain = generateSequence(error) { it.cause }.joinToString(" -> ") {
            "${it.javaClass.simpleName}: ${it.message}"
        }
        return "Carrossel nativo nao encontrado ou gesto nao aceito: $chain"
    }

    private companion object {
        const val FRAME_MS = 60L

        /**
         * "O menu principal continua fixo" so entra no DOM quando
         * abrirPersonalizarAtalhos() roda; app.js e um arquivo externo, entao o
         * texto nao existe na pagina em repouso.
         */
        const val EDITOR_MARKER_JS =
            "(function(){return (document.body.innerText||'').indexOf('O menu principal continua fixo')>=0;})()"
    }
}
