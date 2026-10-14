class_name Transitions
extends Control

# Full-screen transition layer (the Flow puts it on the Main root, above the Stage).
# play() changes screens: fade, slide-left/right/up/down and pageturn take a snapshot of the outgoing
# screen; iris and static are a dip-to-black placeholder until GDR23 replaces them with shaders.
# Headless, fx off, unknown kind, or already running: swap at once and emit finished (no awaits).
# The numbers come from TransMath (rooms/trans_math.gd).

signal finished(kind: String)

var running := false
var fx_enabled := true
var _from: TextureRect
var _edge: ColorRect
var _light: ColorRect
var _overlay: ColorRect
var _swap: Callable
var _swapped := false


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func play(kind: String, swap: Callable, shifter: Control = null) -> void:
	if kind == "" or not TransMath.is_kind(kind) or not fx_enabled or running or DisplayServer.get_name() == "headless":
		swap.call()
		finished.emit(kind)
		return
	_run(kind, swap, shifter)


func _run(kind: String, swap: Callable, shifter: Control) -> void:
	running = true
	mouse_filter = Control.MOUSE_FILTER_STOP
	_swap = swap
	_swapped = false
	var area := get_viewport_rect().size
	if kind != "iris" and kind != "static":
		await RenderingServer.frame_post_draw
		_take_snapshot(area)
		if kind == "pageturn":
			_edge = ColorRect.new()
			_edge.color = Color.BLACK
			add_child(_edge)
			_light = ColorRect.new()
			_light.color = Color(1.0, 0.969, 0.863, 0.8)
			add_child(_light)
		swap.call()
	var tw := create_tween()
	tw.tween_method(apply_progress.bind(kind, area, shifter), 0.0, 1.0, TransMath.duration_ms(kind) / 1000.0)
	await tw.finished
	_cleanup(shifter)
	finished.emit(kind)


func _take_snapshot(area: Vector2) -> void:
	var img := get_viewport().get_texture().get_image()
	_from = TextureRect.new()
	_from.texture = ImageTexture.create_from_image(img)
	_from.position = Vector2.ZERO
	_from.size = area
	_from.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_from.stretch_mode = TextureRect.STRETCH_SCALE
	_from.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_from)


# Public so the tests can drive it without rendering. u is 0..1 progress.
func apply_progress(u: float, kind: String, area: Vector2, shifter: Control) -> void:
	if kind == "fade":
		if _from != null:
			_from.modulate.a = 1.0 - TransMath.fade_alpha(u)
	elif kind.begins_with("slide-"):
		var off := TransMath.slide_offsets(kind, TransMath.ease_out_cubic(u), area)
		if _from != null:
			_from.position = off[0]
		if shifter != null:
			shifter.position = off[1]
	elif kind == "pageturn":
		var edge_x := TransMath.page_edge_x(u, area.x)
		if _from != null:
			_from.pivot_offset = Vector2.ZERO
			_from.scale = Vector2(TransMath.page_scale(u), 1.0)
		if _edge != null:
			_edge.position = Vector2(edge_x, 0.0)
			_edge.size = Vector2(24.0, area.y)
			_edge.modulate.a = TransMath.page_shadow_alpha(u) / 0.3
		if _light != null:
			_light.position = Vector2(edge_x - 3.0, 0.0)
			_light.size = Vector2(3.0, area.y)
	elif kind == "iris" or kind == "static":
		# Placeholder until GDR23: black dips in and out, the screen swaps at the midpoint.
		if _overlay == null:
			_overlay = ColorRect.new()
			_overlay.color = Color.BLACK
			_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
			_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
			add_child(_overlay)
		_overlay.modulate.a = TransMath.static_coverage(u)
		if u >= 0.5 and not _swapped and _swap.is_valid():
			_swapped = true
			_swap.call()


func _cleanup(shifter: Control) -> void:
	for node in [_from, _edge, _light, _overlay]:
		if is_instance_valid(node):
			node.queue_free()
	_from = null
	_edge = null
	_light = null
	_overlay = null
	if shifter != null:
		shifter.position = Vector2.ZERO
	running = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_swapped = false
	_swap = Callable()
