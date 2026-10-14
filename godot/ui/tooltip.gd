class_name UiTooltip
extends Control

# Small label that appears next to a rectangle after a short delay (port of drawTooltip in src/ui/overlays.js).
# It is clamped to bounds and sits above the anchor, or below it when there is no room above.
# Time moves only through advance(dt). request() starts the delay, hide_tip() cancels it.

const DELAY := 0.4
const MARGIN := 8

var text: String = ""
var bounds: Vector2 = Vector2(1280, 720)
var _pending: bool = false
var _wait: float = 0.0
var _anchor: Rect2 = Rect2()


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	visible = false


func _process(dt: float) -> void:
	advance(dt)


static func measure(tip_text: String) -> Vector2:
	return Vector2(10.0 * tip_text.length() + 24.0, 40.0)


static func compute_position(anchor: Rect2, tip: Vector2, limit: Vector2) -> Vector2:
	var x: float = anchor.get_center().x - tip.x / 2.0
	var y: float = anchor.position.y - tip.y - MARGIN
	if y < 0.0:
		y = anchor.end.y + MARGIN
	x = clampf(x, 0.0, maxf(0.0, limit.x - tip.x))
	y = clampf(y, 0.0, maxf(0.0, limit.y - tip.y))
	return Vector2(x, y)


func request(tip_text: String, anchor: Rect2) -> void:
	text = tip_text
	_anchor = anchor
	_pending = true
	_wait = 0.0
	visible = false


func advance(dt: float) -> void:
	if not _pending:
		return
	_wait += dt
	if _wait >= DELAY:
		_pending = false
		size = measure(text)
		position = compute_position(_anchor, size, bounds)
		visible = true
		queue_redraw()


func hide_tip() -> void:
	_pending = false
	visible = false


func _draw() -> void:
	UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("night"), UiTheme.color("lamp"), 2, true)
	UiTheme.draw_text(self, text, Vector2(12, 8), "caption", UiTheme.color("cream"))
