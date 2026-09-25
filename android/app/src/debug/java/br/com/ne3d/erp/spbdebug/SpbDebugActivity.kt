package br.com.ne3d.erp.spbdebug

import android.os.Bundle
import android.os.SystemClock
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import br.com.ne3d.erp.spbcore.core.ShellRenderer
import java.util.Locale
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.delay

/**
 * Host de debug isolado da Fase B.
 *
 * Fica fora do manifest de producao (source set `debug`), nao toca na Home, no
 * WebView, em navegacao ERP nem em dados reais. Serve unicamente para validar
 * que o nucleo SPB roda, anima e mede frame-time dentro do APK do Simplifica.
 */
class SpbDebugActivity : ComponentActivity() {

    private var debugView: SpbDebugView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContent {
            SpbDebugScreen(
                onAttach = { debugView = it },
                onDetach = { candidate -> if (debugView === candidate) debugView = null },
            )
        }
    }

    override fun onPause() {
        super.onPause()
        debugView?.pauseRenderer()
    }

    override fun onResume() {
        super.onResume()
        debugView?.resumeRenderer()
    }

    override fun onDestroy() {
        debugView?.stopRenderer()
        debugView = null
        super.onDestroy()
    }
}

@Composable
private fun SpbDebugScreen(
    onAttach: (SpbDebugView) -> Unit,
    onDetach: (SpbDebugView) -> Unit,
) {
    var generation by remember { mutableIntStateOf(0) }
    var exitInfo by remember { mutableStateOf("") }
    var fps by remember { mutableStateOf("--.-") }
    var panelLabel by remember { mutableStateOf("-") }
    var motion by remember { mutableStateOf("-") }
    val frames = remember { AtomicInteger() }
    val host = remember { AtomicReference<SpbDebugView?>(null) }

    LaunchedEffect(generation) {
        frames.set(0)
        delay(1500)
        frames.set(0)
        var windowStart = SystemClock.elapsedRealtime()
        var sinceMetrics = 0L
        while (true) {
            delay(1000)
            val now = SystemClock.elapsedRealtime()
            val drawn = frames.getAndSet(0)
            val elapsed = (now - windowStart).coerceAtLeast(1L)
            fps = String.format(Locale.US, "%.1f fps", drawn * 1000f / elapsed)
            windowStart = now
            sinceMetrics += 1000
            if (sinceMetrics >= 15000) {
                sinceMetrics = 0
                host.get()?.let { view ->
                    motion = view.motionState()
                    panelLabel = view.selectedPanelLabel()
                    view.publishMetrics("debug-window-15s")
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF071019.toInt()))
    ) {
        key(generation) {
            AndroidView(
                factory = { context ->
                    val textures = SpbMockModules.all.map { module ->
                        ShellRenderer.PendingTexture(
                            module.id,
                            AtomicReference(SpbMockModules.tile(module)),
                        )
                    }.toTypedArray()
                    SpbDebugView(
                        context = context,
                        pendingTextures = textures,
                        panels = SpbMockModules.panels(),
                        onExit = { index ->
                            exitInfo = "exit -> ${SpbMockModules.all.getOrNull(index)?.title ?: "?"}"
                            generation++
                        },
                        onFrame = { frames.incrementAndGet() },
                    ).also { view ->
                        host.set(view)
                        onAttach(view)
                    }
                },
                update = { view ->
                    host.set(view)
                    panelLabel = view.selectedPanelLabel()
                    motion = view.motionState()
                },
                onRelease = { view ->
                    view.stopRenderer()
                    if (host.get() === view) host.set(null)
                    onDetach(view)
                },
                modifier = Modifier.fillMaxSize(),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopStart),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            DebugLine("SPB FASE B - host de debug (nao e producao)", Color(0xFF7FE7DC.toInt()))
            DebugLine("fps      $fps", Color.White)
            DebugLine("painel   $panelLabel", Color.White)
            DebugLine("estado   $motion", Color.White)
            if (exitInfo.isNotEmpty()) DebugLine(exitInfo, Color(0xFFFFC46B.toInt()))
        }

        Text(
            text = "arraste / fling / tap - 5 modulos mock",
            color = Color(0xFFB9D8E6.toInt()),
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
        )
    }
}

@Composable
private fun DebugLine(text: String, color: Color) {
    Text(
        text = text,
        color = color,
        fontSize = 13.sp,
        fontFamily = FontFamily.Monospace,
    )
}
