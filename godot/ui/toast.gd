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


func _draw() -> void:
	var n: int = items.size()
	var ink: Color = UiTheme.color("ink")
	var paper: Color = UiTheme.color("paper")
	for i in range(n):
		var item: Dictionary = items[i]
		var text: String = item["text"]
		var a: float = alpha_of(item)
		var w: float = minf(size.x - 64.0, 12.0 * text.length() + 48.0)
		var x: float = (size.x - w) / 2.0
		var y: float = size.y - 140.0 - (n - i) * (ROW_H + GAP) + (1.0 - a) * 16.0
		var rect := Rect2(x, y, w, ROW_H)
		# No hard shadow here: its alpha is fixed inside draw_box, so it would not fade with the toast.
		UiTheme.draw_box(self, rect, _fade(paper, a), _fade(ink, a), 4, false)
		var ty: float = y + (ROW_H - UiTheme.size_for("caption")) / 2.0
		UiTheme.draw_text(self, text, Vector2(x, ty), "caption", _fade(ink, a), w, HORIZONTAL_ALIGNMENT_CENTER)


static func _fade(c: Color, a: float) -> Color:
	return Color(c.r, c.g, c.b, c.a * a)
