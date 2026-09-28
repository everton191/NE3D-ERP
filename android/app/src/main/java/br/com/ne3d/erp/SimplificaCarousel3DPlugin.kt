package br.com.ne3d.erp

import br.com.ne3d.erp.carousel3d.CarouselModule
import br.com.ne3d.erp.carousel3d.CarouselModuleMapper
import br.com.ne3d.erp.carousel3d.CarouselRect
import br.com.ne3d.erp.carousel3d.HomeCarouselHost
import br.com.ne3d.erp.carousel3d.NativeCarouselEditorDialog
import br.com.ne3d.erp.carousel3d.RawCarouselModule
import com.getcapacitor.JSArray
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
 * termina a animação de saída, para o web navegar ao módulo, e `editor` quando
 * a engrenagem do piso é acionada, para o web abrir o editor do carrossel.
 */
@CapacitorPlugin(name = "SimplificaCarousel3D")
class SimplificaCarousel3DPlugin : Plugin() {
    private var editorDialog: NativeCarouselEditorDialog? = null

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
        val background = readBackground(call)
        hostActivity.runOnUiThread {
            HomeCarouselHost.show(
                hostActivity, rect, viewWidth, viewHeight, background, modules,
                onSelect = { module -> notifySelect(module) },
                onEditor = { notifyEditor() },
            )
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
        val background = readBackground(call)
        hostActivity.runOnUiThread { HomeCarouselHost.updateRect(rect, viewWidth, viewHeight, background) }
        call.resolve()
    }

    @PluginMethod
    fun hide(call: PluginCall) {
        val hostActivity = activity ?: return
        hostActivity.runOnUiThread { HomeCarouselHost.hide() }
        call.resolve()
    }

    @PluginMethod
    fun openEditor(call: PluginCall) {
        val hostActivity = activity ?: run { call.reject("Activity indisponível."); return }
        val catalog = readModules(call, "catalog")
        val visible = call.getArray("visibleCardIds")?.let { ids ->
            (0 until ids.length()).mapNotNull { ids.optString(it).takeIf(String::isNotEmpty) }
        }.orEmpty()
        if (catalog.isEmpty() || visible.size < 5) { call.reject("Catálogo do carrossel inválido."); return }
        val light = (call.getString("theme") ?: "dark") == "light"
        hostActivity.runOnUiThread {
            editorDialog?.dismiss()
            editorDialog = NativeCarouselEditorDialog(hostActivity, catalog, visible, light,
                onChange = { ids -> notifyEditorChange(ids) },
                onClose = { editorDialog = null; notifyEditorClose() })
            editorDialog?.show()
        }
        call.resolve()
    }

    @PluginMethod
    fun closeEditor(call: PluginCall) {
        activity?.runOnUiThread { editorDialog?.dismiss() }
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
        editorDialog?.dismiss()
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

    private fun notifyEditor() = notifyListeners(EVENT_EDITOR, JSObject(), false)
    private fun notifyEditorChange(ids: List<String>) {
        // `JSObject.put` serializa uma List do Kotlin como texto. O WebView
        // precisa receber um JSONArray real para aplicar a quantidade e a
        // ordem dos painéis editados.
        val visibleCardIds = JSArray().apply { ids.forEach { put(it) } }
        notifyListeners(EVENT_EDITOR_CHANGE, JSObject().apply { put("visibleCardIds", visibleCardIds) }, false)
    }
    private fun notifyEditorClose() = notifyListeners(EVENT_EDITOR_CLOSE, JSObject(), false)

    private fun readBackground(call: PluginCall): Int {
        val theme = call.getString("theme") ?: "dark"
        return if (theme == "light") HomeCarouselHost.BACKGROUND_LIGHT else HomeCarouselHost.BACKGROUND_DARK
    }

    private fun readRect(call: PluginCall): CarouselRect? {
        val left = call.getDouble("left")?.toFloat() ?: return null
        val top = call.getDouble("top")?.toFloat() ?: return null
        val width = call.getDouble("width")?.toFloat() ?: return null
        val height = call.getDouble("height")?.toFloat() ?: return null
        if (width <= 0f || height <= 0f) return null
        return CarouselRect(left, top, width, height)
    }

    private fun readModules(call: PluginCall, key: String = "modules"): List<CarouselModule> {
        val array = call.getArray(key) ?: return emptyList()
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
        const val EVENT_EDITOR = "editor"
        const val EVENT_EDITOR_CHANGE = "editorChange"
        const val EVENT_EDITOR_CLOSE = "editorClose"
    }
}
