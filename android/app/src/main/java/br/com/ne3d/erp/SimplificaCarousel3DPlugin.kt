package br.com.ne3d.erp

import br.com.ne3d.erp.carousel3d.CarouselModule
import br.com.ne3d.erp.carousel3d.CarouselModuleMapper
import br.com.ne3d.erp.carousel3d.CarouselRect
import br.com.ne3d.erp.carousel3d.HomeCarouselHost
import br.com.ne3d.erp.carousel3d.RawCarouselModule
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Bridge entre o card da Home (WebView) e o carrossel 3D nativo.
 *
 * O web envia o retângulo do card em CSS px + o tamanho do viewport (assim a
 * conversão para pixels é uma regra de três, sem depender da densidade) e a lista
 * real de módulos. Em contrapartida o nativo notifica `select` quando um painel
 * termina a animação de saída, para o web navegar ao módulo.
 */
@CapacitorPlugin(name = "SimplificaCarousel3D")
class SimplificaCarousel3DPlugin : Plugin() {

    @PluginMethod
    fun show(call: PluginCall) {
        val hostActivity = activity
        if (hostActivity == null) {
            call.reject("Activity indisponível.")
            return
        }
        val rect = readRect(call)
        val viewWidth = call.getFloat("viewWidth", 0f) ?: 0f
        val viewHeight = call.getFloat("viewHeight", 0f) ?: 0f
        if (rect == null || viewWidth <= 0f || viewHeight <= 0f) {
            call.reject("Retângulo do carrossel ausente.")
            return
        }
        val modules = readModules(call)
        if (modules.isEmpty()) {
            hostActivity.runOnUiThread { HomeCarouselHost.hide() }
            call.resolve()
            return
        }
        hostActivity.runOnUiThread {
            HomeCarouselHost.show(hostActivity, rect, viewWidth, viewHeight, modules) { module ->
                notifySelect(module)
            }
        }
        call.resolve()
    }

    @PluginMethod
    fun setRect(call: PluginCall) {
        val hostActivity = activity
        if (hostActivity == null) {
            call.reject("Activity indisponível.")
            return
        }
        val rect = readRect(call)
        val viewWidth = call.getFloat("viewWidth", 0f) ?: 0f
        val viewHeight = call.getFloat("viewHeight", 0f) ?: 0f
        if (rect == null || viewWidth <= 0f || viewHeight <= 0f) {
            call.reject("Retângulo do carrossel ausente.")
            return
        }
        hostActivity.runOnUiThread { HomeCarouselHost.updateRect(rect, viewWidth, viewHeight) }
        call.resolve()
    }

    @PluginMethod
    fun hide(call: PluginCall) {
        val hostActivity = activity ?: return
        hostActivity.runOnUiThread { HomeCarouselHost.hide() }
        call.resolve()
    }

    override fun handleOnPause() {
        HomeCarouselHost.onPause()
        super.handleOnPause()
    }

    override fun handleOnResume() {
        HomeCarouselHost.onResume()
        super.handleOnResume()
    }

    override fun handleOnDestroy() {
        HomeCarouselHost.hide()
        super.handleOnDestroy()
    }

    private fun notifySelect(module: CarouselModule) {
        val payload = JSObject().apply {
            put("id", module.id)
            put("title", module.title)
            put("targetScreen", module.targetScreen)
        }
        notifyListeners(EVENT_SELECT, payload, false)
    }

    private fun readRect(call: PluginCall): CarouselRect? {
        val left = call.getDouble("left")?.toFloat() ?: return null
        val top = call.getDouble("top")?.toFloat() ?: return null
        val width = call.getDouble("width")?.toFloat() ?: return null
        val height = call.getDouble("height")?.toFloat() ?: return null
        if (width <= 0f || height <= 0f) return null
        return CarouselRect(left, top, width, height)
    }

    private fun readModules(call: PluginCall): List<CarouselModule> {
        val array = call.getArray("modules") ?: return emptyList()
        val raw = ArrayList<RawCarouselModule>(array.length())
        for (index in 0 until array.length()) {
            val entry = array.optJSONObject(index) ?: continue
            raw += RawCarouselModule(
                id = entry.optString("id").takeIf { it.isNotEmpty() },
                title = entry.optString("title").takeIf { it.isNotEmpty() },
                targetScreen = entry.optString("targetScreen").takeIf { it.isNotEmpty() },
                detail = entry.optString("detail").takeIf { it.isNotEmpty() },
                live = entry.optJSONArray("live")?.let { lines ->
                    (0 until lines.length()).mapNotNull { position ->
                        lines.optString(position).takeIf { it.isNotEmpty() }
                    }
                },
            )
        }
        return CarouselModuleMapper.sanitize(raw)
    }

    companion object {
        const val EVENT_SELECT = "select"
    }
}
