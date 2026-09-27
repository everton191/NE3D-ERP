package br.com.ne3d.erp.carousel3d

import android.app.Activity
import android.app.Dialog
import android.graphics.Color as AndroidColor
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

/** Organizador nativo: os cartões são os mesmos bitmaps entregues à Home 3D. */
class NativeCarouselEditorDialog(
    private val activity: Activity,
    private val catalog: List<CarouselModule>,
    activeIds: List<String>,
    private val light: Boolean,
    private val onChange: (List<String>) -> Unit,
    private val onClose: () -> Unit,
) : Dialog(activity) {
    private var closed = false
    private val initial = activeIds.filter { id -> catalog.any { it.id == id } }.take(10)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window?.setBackgroundDrawable(ColorDrawable(AndroidColor.TRANSPARENT))
        setContentView(ComposeView(activity).apply { setContent { Organizer(initial) } })
    }

    override fun dismiss() {
        super.dismiss()
        if (!closed) { closed = true; onClose() }
    }

    @Composable
    private fun Organizer(initialIds: List<String>) {
        var active by remember { mutableStateOf(initialIds) }
        val activeScroll = rememberLazyListState(); val floorScroll = rememberLazyListState()
        var activeBounds by remember { mutableStateOf(Rect.Zero) }; var floorBounds by remember { mutableStateOf(Rect.Zero) }
        var rootOrigin by remember { mutableStateOf(Offset.Zero) }; val bounds = remember { mutableStateMapOf<String, Rect>() }
        var dragging by remember { mutableStateOf<CarouselModule?>(null) }; var position by remember { mutableStateOf(Offset.Zero) }
        val haptics = LocalHapticFeedback.current; val density = LocalDensity.current
        val floor = catalog.filterNot { item -> active.contains(item.id) }
        LaunchedEffect(dragging?.id) { while (dragging != null) {
            val target = if (floorBounds.contains(position)) floorBounds else activeBounds
            val list = if (floorBounds.contains(position)) floorScroll else activeScroll
            val edge = with(density) { 36.dp.toPx() }; val delta = when { position.x < target.left + edge -> -edge * .22f; position.x > target.right - edge -> edge * .22f; else -> 0f }
            if (delta != 0f) list.scrollBy(delta); delay(16)
        } }
        fun commit() {
            val item = dragging ?: return; val current = active.toMutableList()
            if (floorBounds.contains(position) && current.contains(item.id) && current.size > 5) current.remove(item.id)
            else if (activeBounds.contains(position)) {
                val source = current.indexOf(item.id); if (source >= 0) current.removeAt(source) else if (current.size >= 10) { dragging = null; return }
                val ordered = current.mapIndexedNotNull { index, id -> bounds[id]?.let { index to it } }
                val insert = ordered.firstOrNull { position.x < it.second.center.x }?.first ?: current.size
                current.add(insert.coerceIn(0, current.size), item.id)
            }
            if (current != active) { active = current; onChange(current) }; dragging = null
        }
        @Composable fun Tile(item: CarouselModule) {
            val context = LocalContext.current
            val bitmap = remember(item.id, light) { CarouselTileBitmap.render(context, item, light) }
            Box(Modifier.width(104.dp).onGloballyPositioned { bounds[item.id] = it.boundsInRoot() }
                .graphicsLayer { alpha = if (dragging?.id == item.id) .25f else 1f }
                .pointerInput(item.id) { detectDragGesturesAfterLongPress(
                    onDragStart = { point -> haptics.performHapticFeedback(HapticFeedbackType.LongPress); dragging = item; position = bounds[item.id]?.topLeft?.plus(point) ?: point },
                    onDrag = { change, amount -> change.consume(); position += amount }, onDragEnd = { commit() }, onDragCancel = { dragging = null }) }) {
                androidx.compose.foundation.Image(bitmap = bitmap.asImageBitmap(), contentDescription = item.title,
                    modifier = Modifier.size(100.dp, 148.dp).clipToBounds().border(1.dp, Color(0xFF57D7E2)))
            }
        }
        Box(Modifier.fillMaxSize().background(if (light) Color(0xFFF2F7F8) else Color(0xFF07151B)).padding(14.dp)
            .onGloballyPositioned { rootOrigin = it.boundsInRoot().topLeft }) {
            Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Editar carrossel", color = if (light) Color(0xFF10242B) else Color.White, fontSize = 20.sp); Text("Fechar", color = Color(0xFF10AAB7), modifier = Modifier.clickable { dismiss() }) }
                Text("Carrossel (${active.size}) · segure e arraste", color = Color(0xFF60AAB1), fontSize = 12.sp)
                LazyRow(state = activeScroll, modifier = Modifier.fillMaxWidth().height(190.dp).onGloballyPositioned { activeBounds = it.boundsInRoot() }.background(Color(0x2210AAB7)), contentPadding = PaddingValues(10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) { items(active, key = { it }) { id -> catalog.firstOrNull { it.id == id }?.let { Tile(it) } } }
                Text(if (dragging != null && floorBounds.contains(position)) "Piso · solte para remover" else "Piso · arraste para o carrossel", color = Color(0xFF60AAB1), fontSize = 12.sp)
                LazyRow(state = floorScroll, modifier = Modifier.fillMaxWidth().weight(1f).onGloballyPositioned { floorBounds = it.boundsInRoot() }.background(Color(0x33252929)), contentPadding = PaddingValues(10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) { items(floor, key = { it.id }) { Tile(it) } }
            }
            dragging?.let { item -> Box(Modifier.offset { IntOffset((position.x - rootOrigin.x - 50.dp.toPx(density)).roundToInt(), (position.y - rootOrigin.y - 74.dp.toPx(density)).roundToInt()) }.size(100.dp, 148.dp).background(Color(0xEE34585B)).border(2.dp, Color(0xFFFFD36D)), contentAlignment = Alignment.Center) { Text(item.title, color = Color.White) } }
        }
    }
}

private fun androidx.compose.ui.unit.Dp.toPx(density: androidx.compose.ui.unit.Density) = with(density) { toPx() }
