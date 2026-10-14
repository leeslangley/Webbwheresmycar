class_name UiBanner
extends Control

# Dave's big peach speech banner (port of src/art/banner.js), painted: a rounded glossy peach bubble with
# a thick ink outline, soft halftone shading and a drop shadow (baked by tools/art/ui_bake.py), a comic
# tail pointing at the speaker, text typed out at CPS characters per second and a bouncing "more" arrow.
# The banner is TRANSIENT: it is invisible (alpha 0) while it has nothing to say, fades in on say(), and
# fades out HOLD seconds after the typing finishes, so it never hides the room for long. It never takes
# input (MOUSE_FILTER_IGNORE). Time is stepped with advance(dt); _process calls it in the scene tree.

signal char_revealed(count: int)
signal finished

const G := 4
const CHAR_W := 12
const LINE_H := 30
const MAX_LINES := 3
const CPS := 40.0
const PEACH := ["#F8DCB8", "#F2C9A0", "#E8B085", "#D99A6C"]
const FADE_IN := 0.18
const FADE_OUT := 0.35
const HOLD := 1.2
const TEXT_X := 26
const TEXT_Y := 12
const TAIL_J := 10

var full_text: String = ""
var lines: Array[String] = []
var tail_x: float = -1.0
var _reveal: float = 0.0
var _done: bool = true
var _t: float = 0.0
var _alpha: float = 0.0
var _since_done: float = 0.0


func _init() -> void:
	size = Vector2(1232, 112)
	mouse_filter = MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	modulate.a = 0.0


func max_chars() -> int:
	return maxi(1, int(floor((size.x - 6.0 * G) / CHAR_W)))


func say(text: String, tail: float = -1.0) -> void:
	full_text = text.to_upper()
	tail_x = tail
	lines = UiText.wrap(full_text, max_chars(), MAX_LINES)
	_reveal = 0.0
	_done = (total_chars() == 0)
	_since_done = 0.0
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
	else:
		_since_done += dt
	_step_fade(dt)
	queue_redraw()


# True while the banner wants to be on screen: it has text and is typing, or finished less than HOLD ago.
func wants_show() -> bool:
	if total_chars() == 0:
		return false
	return not _done or _since_done < HOLD


# 0 = hidden, 1 = fully shown.
func fade_alpha() -> float:
	return _alpha


func _step_fade(dt: float) -> void:
	if wants_show():
		_alpha = minf(1.0, _alpha + dt / FADE_IN)
	else:
		_alpha = maxf(0.0, _alpha - dt / FADE_OUT)
	modulate.a = _alpha


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
	_since_done = HOLD
	queue_redraw()


# Left x of the tail (multiple of G, 16 px left of the tail point, kept inside the banner).
static func tail_bx(tail: float, w: float) -> int:
	var bx := int(round(tail / G)) * G - 16
	return clampi(bx, 4 * G, int(w) - 7 * G)


func _draw() -> void:
	if _alpha <= 0.0:
		return
	var ink := UiTheme.color("ink")
	if UiSkin.tex("banner") != null:
		UiSkin.three(self, "banner", Rect2(-16, -16, size.x + 32.0, size.y + 32.0), 80.0)
		var bx := tail_bx(tail_x if tail_x >= 0.0 else size.x / 2.0, size.x)
		UiSkin.blit(self, "banner_tail", Vector2(bx - 2.0, size.y - 4.0 - TAIL_J))
	else:
		draw_rect(Rect2(Vector2.ZERO, size), Color(PEACH[1]))

	# text: the first visible_chars() characters, line by line
	var remaining := visible_chars()
	for k in range(lines.size()):
		var line: String = lines[k]
		var shown := mini(remaining, line.length())
		if shown > 0:
			UiTheme.draw_text(self, line.substr(0, shown), Vector2(TEXT_X, TEXT_Y + k * LINE_H), "body", ink)
		remaining = maxi(0, remaining - line.length())

	if not _done:
		# a chunky caret at the end of the text typed so far
		if int(_t * 4.0) % 2 == 0:
			var left := visible_chars()
			var cur_line := 0
			var cur_x := 0
			for k in range(lines.size()):
				cur_line = k
				cur_x = mini(left, lines[k].length())
				left -= lines[k].length()
				if left <= 0:
					break
			UiSkin.rrect(self, Rect2(TEXT_X + cur_x * CHAR_W + 2, TEXT_Y + 4 + cur_line * LINE_H, 10, 20), Color("D9483B"), 3)
	elif total_chars() > 0:
		_draw_more_arrow()


# The bouncing "more" arrow in the bottom-right corner once the line is fully typed.
func _draw_more_arrow() -> void:
	var bounce := absf(sin(_t * 5.0)) * 5.0
	var c := Vector2(size.x - 36.0, size.y - 24.0 + bounce)
	var tri := PackedVector2Array([c + Vector2(-10, -7), c + Vector2(10, -7), c + Vector2(0, 7)])
	var ring := PackedVector2Array(tri)
	ring.append(tri[0])
	draw_polyline(ring, UiTheme.color("ink"), 6.0, true)
	draw_colored_polygon(tri, Color("D9483B"))
	draw_colored_polygon(PackedVector2Array([c + Vector2(-6, -5), c + Vector2(1, -5), c + Vector2(-2, 0)]), Color(1, 1, 1, 0.6))
