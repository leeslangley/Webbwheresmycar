class_name UiList
extends Control

# A vertical list that scrolls by dragging (phones), flinging, the mouse wheel and the keys, and
# selects a row by TAP (a tap is a press and release on the same row with no drag). Port of the
# ScrollList model in src/ui/kit_hits.js. The owner draws each row through row_painter.
# Public handle_event(ev) is the entry point; _gui_input forwards to it.

signal row_tapped(index: int)

var row_h: int = 72
var count: int = 0
var offset: float = 0.0
var selected: int = -1
var row_painter: Callable
var vel: float = 0.0
var dragging: bool = false
var _start_y: float = 0.0
var _last_y: float = 0.0
var _last_t: float = 0.0
var _tap := UiTap.new()
var _press_row: int = -1


func _init() -> void:
	size = Vector2(300, 320)
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_STOP


func max_offset() -> float:
	return maxf(0.0, count * row_h - size.y)


func set_count(n: int) -> void:
	count = n
	offset = clampf(offset, 0.0, max_offset())
	selected = mini(selected, n - 1)
	queue_redraw()


func scroll_by(dy: float) -> void:
	offset = clampf(offset + dy, 0.0, max_offset())
	queue_redraw()


func begin_drag(y: float, now_ms: float) -> void:
	_start_y = y
	_last_y = y
	_last_t = now_ms
	dragging = false
	vel = 0.0


func drag_to(y: float, now_ms: float) -> void:
	if absf(y - _start_y) > 8.0:
		dragging = true
	if not dragging:
		return
	scroll_by(_last_y - y)
	vel = (_last_y - y) / maxf(1.0, now_ms - _last_t)
	_last_y = y
	_last_t = now_ms


# True when the gesture was a tap (never became a drag).
func end_drag() -> bool:
	var tapped := not dragging
	if tapped:
		vel = 0.0
	dragging = false
	return tapped


func advance_ms(dt_ms: float) -> void:
	if dragging:
		return
	if absf(vel) <= 0.01:
		vel = 0.0
		return
	scroll_by(vel * dt_ms)
	vel *= pow(0.95, dt_ms / 16.0)
	if offset <= 0.0 or offset >= max_offset():
		vel = 0.0
	if absf(vel) <= 0.01:
		vel = 0.0


func advance(dt: float) -> void:
	advance_ms(dt * 1000.0)


func _process(dt: float) -> void:
	advance(dt)


# Index of the row under a y coordinate local to the list, or -1.
func row_at(local_y: float) -> int:
	if local_y < 0.0 or local_y >= size.y:
		return -1
	var idx := floori((local_y + offset) / row_h)
	if idx < 0 or idx >= count:
		return -1
	return idx


func row_rect(i: int) -> Rect2:
	return Rect2(0.0, i * row_h - offset, size.x, row_h)


# Inclusive range of row indices overlapping the view; (0, -1) when there are no rows.
func visible_range() -> Vector2i:
	if count == 0:
		return Vector2i(0, -1)
	var first := floori(offset / row_h)
	var last := mini(count - 1, ceili((offset + size.y) / row_h) - 1)
	return Vector2i(first, last)


func ensure_visible(i: int) -> void:
	var top := i * row_h
	if top < offset:
		scroll_by(top - offset)
	elif top + row_h > offset + size.y:
		scroll_by(top + row_h - offset - size.y)


func select(i: int, emit: bool = false) -> void:
	selected = clampi(i, -1, count - 1)
	if selected >= 0:
		ensure_visible(selected)
	queue_redraw()
	if emit and selected >= 0:
		row_tapped.emit(selected)


func move_selection(d: int) -> void:
	if count == 0:
		return
	select(clampi(selected + d, 0, count - 1))


func _gui_input(event: InputEvent) -> void:
	handle_event(event)


func handle_event(ev: InputEvent) -> void:
	var now := float(Time.get_ticks_msec())
	var mb := ev as InputEventMouseButton
	if mb != null:
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_press_row = row_at(mb.position.y)
				_tap.press("r%d" % _press_row if _press_row >= 0 else "")
				begin_drag(mb.position.y, now)
			else:
				var tapped := end_drag()
				var r := row_at(mb.position.y)
				var hit := _tap.release("r%d" % r if r >= 0 else "")
				if tapped and hit:
					select(r, true)
		elif mb.pressed and mb.button_index == MOUSE_BUTTON_WHEEL_UP:
			scroll_by(-row_h / 2.0)
		elif mb.pressed and mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			scroll_by(row_h / 2.0)
		return
	var mm := ev as InputEventMouseMotion
	if mm != null:
		if (mm.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
			drag_to(mm.position.y, now)
		return
	var k := ev as InputEventKey
	if k != null and k.pressed:
		if k.keycode == KEY_UP:
			move_selection(-1)
		elif k.keycode == KEY_DOWN:
			move_selection(1)


func _draw() -> void:
	var rng := visible_range()
	for i in range(rng.x, rng.y + 1):
		if row_painter.is_valid():
			row_painter.call(self, i, row_rect(i), i == selected)
		else:
			draw_string(ThemeDB.fallback_font, row_rect(i).position + Vector2(8, 24), str(i))
	if max_offset() > 0.0:
		var thumb_h := maxf(24.0, size.y * size.y / (count * row_h))
		var thumb_y := offset / max_offset() * (size.y - thumb_h)
		UiSkin.rrect(self, Rect2(size.x - 8.0, 0.0, 8.0, size.y), Color(0, 0, 0, 0.18), 4)
		UiSkin.rrect(self, Rect2(size.x - 8.0, thumb_y, 8.0, thumb_h), Color("C9A24A"), 4, UiTheme.INK, 2)
