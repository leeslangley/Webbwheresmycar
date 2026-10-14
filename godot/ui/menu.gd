class_name UiMenu
extends Control

# The in-scene pop-up menu (RSAMH style section 4): a small boxed list of rows with a blinking
# arrow cursor beside the selected row. Rows are 64 px tall (touch rule). Emits chosen(index)
# when a row is picked, cancelled when the menu is backed out of. Public handle_event(ev) is the
# entry point; _gui_input forwards to it. Animation runs on advance(dt), so tests step time by hand.

signal chosen(index: int)
signal cancelled

const ROW := 64
const PAD := 8
const CHAR_W := 12

var items: Array[String] = []
var disabled: Dictionary = {}
var selected: int = 0
var _t: float = 0.0
var _tap := UiTap.new()


func _init() -> void:
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


func _process(dt: float) -> void:
	if visible:
		advance(dt)


static func width_for(list: Array) -> int:
	var longest := 0
	for item in list:
		longest = maxi(longest, str(item).length())
	return maxi(280, 44 + CHAR_W * longest + 24)


func open(list: Array[String], at: Vector2 = Vector2.ZERO) -> void:
	items = list
	disabled = {}
	position = at
	size = Vector2(width_for(list), ROW * list.size() + 2 * PAD)
	selected = first_enabled()
	_t = 0.0
	visible = true
	queue_redraw()


func close() -> void:
	visible = false


func set_item_enabled(i: int, on: bool) -> void:
	if on:
		disabled.erase(i)
	else:
		disabled[i] = true
	queue_redraw()


func first_enabled() -> int:
	for i in range(items.size()):
		if not disabled.has(i):
			return i
	return 0


func row_rect(i: int) -> Rect2:
	return Rect2(PAD, PAD + i * ROW, size.x - 2 * PAD, ROW)


func row_at(pos: Vector2) -> int:
	for i in range(items.size()):
		if row_rect(i).has_point(pos):
			return i
	return -1


func move(delta: int) -> void:
	var n := items.size()
	for _attempt in range(n):
		selected = posmod(selected + delta, n)
		if not disabled.has(selected):
			queue_redraw()
			return


func choose() -> void:
	if items.is_empty() or disabled.has(selected):
		return
	var i := selected
	close()
	chosen.emit(i)


func cancel() -> void:
	close()
	cancelled.emit()


func advance(dt: float) -> void:
	_t += dt
	queue_redraw()


func blink_on() -> bool:
	return int(_t * 4.0) % 2 == 0


func _gui_input(event: InputEvent) -> void:
	handle_event(event)


func handle_event(ev: InputEvent) -> void:
	var mb := ev as InputEventMouseButton
	if mb != null and mb.button_index == MOUSE_BUTTON_LEFT:
		if mb.pressed:
			var r := row_at(mb.position)
			_tap.press("row%d" % r if r >= 0 else "")
			if r >= 0 and not disabled.has(r):
				selected = r
			queue_redraw()
		else:
			var r := row_at(mb.position)
			if _tap.release("row%d" % r if r >= 0 else "") and r >= 0 and not disabled.has(r):
				selected = r
				choose()
		return
	var key := ev as InputEventKey
	if key != null and key.pressed:
		match key.keycode:
			KEY_UP:
				move(-1)
			KEY_DOWN:
				move(1)
			KEY_ENTER, KEY_KP_ENTER, KEY_SPACE:
				choose()
			KEY_ESCAPE:
				cancel()


# A paper card with a soft shadow; the selected row glows lamp-yellow and a glossy red arrow bobs beside it.
func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	if UiSkin.tex("panel_paper9") == null:
		UiTheme.draw_box(self, rect, UiTheme.color("paper"), UiTheme.color("ink"), 4, true)
	else:
		UiSkin.nine(self, "shadow9", Rect2(rect.position + Vector2(-12, -6), rect.size + Vector2(24, 28)))
		UiSkin.nine(self, "panel_paper9", rect)
	for i in range(items.size()):
		var row := row_rect(i)
		if i == selected and not disabled.has(i):
			UiSkin.nine(self, "row_hot9", row.grow_individual(-2, 0, -2, 0))
		var text_col := Color("A39C8C") if disabled.has(i) else UiTheme.color("ink")
		UiTheme.draw_text(self, items[i], row.position + Vector2(40, 17), "body", text_col)
		if i < items.size() - 1:
			var ly := row.end.y
			draw_line(Vector2(row.position.x + 14, ly), Vector2(row.end.x - 14, ly), Color(0.55, 0.42, 0.25, 0.25), 2.0)
	if items.size() > 0 and not disabled.has(selected):
		var cy := row_rect(selected).get_center().y
		var bob := 3.0 * sin(_t * 9.0)
		UiSkin.blit(self, "cursor", Vector2(6.0 + bob, cy - 16.0))
