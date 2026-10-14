class_name UiToast
extends Control

# Stacked slide-in messages (port of the toast in src/ui/overlays.js). Up to MAX_VISIBLE toasts show at
# once, the rest wait in a queue. Time moves only through advance(dt), so tests step it by hand.
# Each item is {"text": String, "age": float, "hold": float}. The newest toast sits lowest.

const IN := 0.26
const OUT := 0.2
const MAX_VISIBLE := 3
const MAX_QUEUE := 8
const MAX_CHARS := 60
const ROW_H := 48
const GAP := 8

var items: Array = []
var queue: Array = []


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


func _process(dt: float) -> void:
	advance(dt)


func show_text(text: String, hold: float = 2.5) -> void:
	var t: String = UiText.ellipsize(text, MAX_CHARS)
	if t == "":
		return
	if not items.is_empty():
		var last: Dictionary = items.back()
		if last["text"] == t:
			last["age"] = 0.0
			return
	var item: Dictionary = {"text": t, "age": 0.0, "hold": hold}
	if items.size() >= MAX_VISIBLE:
		if queue.size() >= MAX_QUEUE:
			queue.pop_front()
		queue.append(item)
	else:
		items.append(item)
	queue_redraw()


func advance(dt: float) -> void:
	var keep: Array = []
	for it in items:
		var item: Dictionary = it
		var age: float = item["age"] + dt
		item["age"] = age
		var hold: float = item["hold"]
		if age <= IN + hold + OUT:
			keep.append(item)
	items = keep
	while items.size() < MAX_VISIBLE and not queue.is_empty():
		items.append(queue.pop_front())
	queue_redraw()


func alpha_of(item: Dictionary) -> float:
	var age: float = item["age"]
	var hold: float = item["hold"]
	if age < IN:
		return age / IN
	if age < IN + hold:
		return 1.0
	return clampf(1.0 - (age - IN - hold) / OUT, 0.0, 1.0)


func active_count() -> int:
	return items.size()


func queued_count() -> int:
	return queue.size()


func texts() -> Array[String]:
	var out: Array[String] = []
	for it in items:
		out.append(it["text"])
	return out


# Each toast is a white card with a gold stripe that springs up into place (outBack) and fades.
func _draw() -> void:
	var n: int = items.size()
	var ink: Color = UiTheme.color("ink")
	for i in range(n):
		var item: Dictionary = items[i]
		var text: String = item["text"]
		var a: float = alpha_of(item)
		var age: float = item["age"]
		var slide: float = 1.0 - UiTokens.ease_named("outBack", age / IN) if age < IN else 0.0
		if age >= IN:
			slide = -(1.0 - a) * 0.4
		var w: float = minf(size.x - 64.0, 12.0 * text.length() + 72.0)
		var x: float = (size.x - w) / 2.0
		var y: float = size.y - 140.0 - (n - i) * (ROW_H + GAP) + slide * 40.0
		var rect := Rect2(x, y, w, ROW_H)
		if UiSkin.tex("toast9") == null:
			UiTheme.draw_box(self, rect, _fade(UiTheme.color("paper"), a), _fade(ink, a), 4, false)
		else:
			UiSkin.nine(self, "shadow9", Rect2(rect.position + Vector2(-12, -6), rect.size + Vector2(24, 26)), Color(1, 1, 1, a * 0.8))
			UiSkin.nine(self, "toast9", rect, Color(1, 1, 1, a))
		var ty: float = y + (ROW_H - UiTheme.size_for("caption")) / 2.0
		UiTheme.draw_text(self, text, Vector2(x + 12.0, ty), "caption", _fade(ink, a), w - 12.0, HORIZONTAL_ALIGNMENT_CENTER)


static func _fade(c: Color, a: float) -> Color:
	return Color(c.r, c.g, c.b, c.a * a)
