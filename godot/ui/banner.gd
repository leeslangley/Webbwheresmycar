class_name UiBanner
extends Control

# Dave's big peach speech banner (port of src/art/banner.js): four peach bands with dithered
# boundaries, an ink outline cut at the corners, a tail pointing at the speaker, and text typed out
# at CPS characters per second. Time is stepped with advance(dt); _process calls it in the scene tree.

signal char_revealed(count: int)
signal finished

const G := 4
const CHAR_W := 12
const LINE_H := 30
const MAX_LINES := 3
const CPS := 40.0
const PEACH := ["#F8DCB8", "#F2C9A0", "#E8B085", "#D99A6C"]

var full_text: String = ""
var lines: Array[String] = []
var tail_x: float = -1.0
var _reveal: float = 0.0
var _done: bool = true
var _t: float = 0.0


func _init() -> void:
	size = Vector2(1232, 112)
	mouse_filter = MOUSE_FILTER_IGNORE


func max_chars() -> int:
	return maxi(1, int(floor((size.x - 6.0 * G) / CHAR_W)))


func say(text: String, tail: float = -1.0) -> void:
	full_text = text.to_upper()
	tail_x = tail
	lines = UiText.wrap(full_text, max_chars(), MAX_LINES)
	_reveal = 0.0
	_done = (total_chars() == 0)
	queue_redraw()


func total_chars() -> int:
	var n := 0
	for line in lines:
		n += line.length()
	return n


func visible_chars() -> int:
	return mini(int(floor(_reveal)), total_chars())


func advance(dt: float) -> void:
	_t += dt
	if not _done:
		var before := visible_chars()
		_reveal += CPS * dt
		if visible_chars() != before:
			char_revealed.emit(visible_chars())
		if visible_chars() >= total_chars():
			_done = true
			finished.emit()
	queue_redraw()


func _process(dt: float) -> void:
	advance(dt)


func skip() -> void:
	if not _done:
		_reveal = float(total_chars())
		_done = true
		char_revealed.emit(total_chars())
		finished.emit()
	queue_redraw()


func is_done() -> bool:
	return _done


func clear() -> void:
	full_text = ""
	lines.clear()
	_reveal = 0.0
	_done = true
	queue_redraw()


# Left x of the tail (multiple of G, 16 px left of the tail point, kept inside the banner).
static func tail_bx(tail: float, w: float) -> int:
	var bx := int(round(tail / G)) * G - 16
	return clampi(bx, 4 * G, int(w) - 7 * G)


func _draw() -> void:
	var band_h := size.y / 4.0
	var ink := UiTheme.color("ink")

	# (1) shadow
	draw_rect(Rect2(G, G, size.x, size.y), Color(0, 0, 0, 0.35))

	# (2) body: four peach bands, then a dithered row of squares on each boundary
	for i in range(4):
		draw_rect(Rect2(0, i * band_h, size.x, band_h), Color(PEACH[i]))
	for i in range(3):
		var y: float = (i + 1) * band_h
		for j in range(int(ceil(size.x / (2.0 * G)))):
			var col := Color(PEACH[i]) if (j + i) % 2 == 0 else Color(PEACH[i + 1])
			draw_rect(Rect2(j * 2 * G, y, G, G), col)

	# (3) ink outline, G px thick, cut at the corners
	draw_rect(Rect2(G, 0, size.x - 2 * G, G), ink)
	draw_rect(Rect2(G, size.y - G, size.x - 2 * G, G), ink)
	draw_rect(Rect2(0, G, G, size.y - 2 * G), ink)
	draw_rect(Rect2(size.x - G, G, G, size.y - 2 * G), ink)
	draw_rect(Rect2(G, G, G, G), ink)
	draw_rect(Rect2(size.x - 2 * G, G, G, G), ink)
	draw_rect(Rect2(G, size.y - 2 * G, G, G), ink)
	draw_rect(Rect2(size.x - 2 * G, size.y - 2 * G, G, G), ink)

	# (4) tail, leaning right, 5 * G tall
	var bx := tail_bx(tail_x if tail_x >= 0.0 else size.x / 2.0, size.x)
	for i in range(5):
		var ty: float = size.y + i * G
		draw_rect(Rect2(bx + i * G, ty, (5 - i) * G, G), Color(PEACH[3]))
		draw_rect(Rect2(bx + i * G, ty, G, G), ink)
		draw_rect(Rect2(bx + 4 * G, ty, G, G), ink)

	# (5) text: the first visible_chars() characters, line by line
	var remaining := visible_chars()
	for k in range(lines.size()):
		var line: String = lines[k]
		var shown := mini(remaining, line.length())
		if shown > 0:
			UiTheme.draw_text(self, line.substr(0, shown), Vector2(3 * G, 3 * G + k * LINE_H), "body", ink)
		remaining = maxi(0, remaining - line.length())

	# (6) blinking cursor at the end of the text typed so far, while still typing
	if not _done and int(_t * 4.0) % 2 == 0:
		var left := visible_chars()
		var cur_line := 0
		var cur_x := 0
		for k in range(lines.size()):
			cur_line = k
			cur_x = mini(left, lines[k].length())
			left -= lines[k].length()
			if left <= 0:
				break
		draw_rect(Rect2(3 * G + cur_x * CHAR_W, 3 * G + cur_line * LINE_H, 2 * G, 2 * G), ink)
