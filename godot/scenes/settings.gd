class_name SettingsPanel
extends RoomBase

# The settings overlay (port of src/ui/scenes/settings.js). A dimmed, blurred-dark backdrop and a brass-edged
# night-blue panel with the outlined title, three toggles (CRT FILTER, SOUND, MUSIC; green when ON, each with
# a little switch), a two-tap ERASE SAVED GAME (red) and BACK. It only edits Game.settings and announces the change
# (setting_changed); the Flow applies it (GDR31). Erase needs a second tap within CONFIRM_MS.

signal closed
signal setting_changed(key: String, value: bool)

const CONFIRM_MS := 3000
const ROWS := [{"id": &"crt", "name": "CRT FILTER"}, {"id": &"sound", "name": "SOUND"}, {"id": &"music", "name": "MUSIC"}]
const R_PANEL := Rect2(240, 40, 800, 660)
const R_ERASE := Rect2(340, 378, 600, 64)
const R_BACK := Rect2(340, 484, 600, 64)

var confirm_until_ms := 0


func _ready() -> void:
	build_layers()
	var u := ui()
	var dim := ColorRect.new()
	dim.name = "Dim"
	dim.position = Vector2.ZERO
	dim.size = STAGE_SIZE
	dim.color = Color(0, 0, 0, 0.6)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	u.add_child(dim)
	u.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	var panel := RoomBase.add_panel(u, "Panel", R_PANEL, Color("14102A"))
	if UiSkin.box("panel_night9") != null:
		var sh := RoomBase.add_panel(u, "PanelShadow", Rect2(R_PANEL.position + Vector2(-16, -6), R_PANEL.size + Vector2(32, 34)))
		sh.add_theme_stylebox_override("panel", UiSkin.box("shadow9"))
		u.move_child(sh, panel.get_index())
		panel.add_theme_stylebox_override("panel", UiSkin.box("panel_night9"))
	var title := RoomBase.add_label(u, "Title", "SETTINGS", Vector2(240, 70), 32, Color("FFD27A"), 800.0, true)
	title.add_theme_font_override("font", UiSkin.display_font(900))
	title.add_theme_font_size_override("font_size", 48)
	title.add_theme_constant_override("outline_size", 14)
	title.add_theme_color_override("font_outline_color", UiTheme.INK)
	title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.5))
	title.add_theme_constant_override("shadow_offset_y", 5)
	title.add_theme_constant_override("shadow_outline_size", 14)
	title.size.y = 72.0
	for i in range(ROWS.size()):
		var row: Dictionary = ROWS[i]
		add_button(row["id"], Rect2(340, 150 + 76 * i, 600, 64), "", "normal")
	add_button(&"erase", R_ERASE, "", "normal")
	add_button(&"back", R_BACK, "BACK", "normal")
	get_node("Hotspots").add_child(UiPainter.make("Switches", _draw_switches))
	_build_footer(u)
	refresh()


# The foot of the panel: the little classic car parked on a strip of kerb, and the credit line.
func _build_footer(u: Control) -> void:
	if UiSkin.tex("title_car_paint") == null:
		return
	var foot := Node2D.new()
	foot.name = "Footer"
	foot.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	u.add_child(foot)
	foot.add_child(UiPainter.make("Kerb", func(on: CanvasItem) -> void:
		UiSkin.rrect(on, Rect2(300, 640, 680, 10), Color("4A4468"), 5, UiTheme.INK, 3)))
	var k := 0.5
	for part in [["Paint", "title_car_paint"], ["Detail", "title_car_detail"]]:
		var sp := Sprite2D.new()
		sp.name = part[0]
		sp.texture = UiSkin.tex(part[1])
		sp.centered = false
		sp.scale = Vector2(k, k)
		sp.position = Vector2(640.0 - 150.0 * k, 646.0 - 112.0 * k)
		if part[0] == "Paint":
			sp.modulate = Color("D8323A")
		foot.add_child(sp)
	var credit := RoomBase.add_label(u, "Credit", "WEBB'S WHEELS  -  FINE MOTORS, MOSTLY", Vector2(240, 574), 18, Color("B9B4E0"), 800.0, true)
	credit.add_theme_font_override("font", UiSkin.display_font(700))


# A little sliding switch at the right end of each toggle row (knob right and lit when ON).
func _draw_switches(on: CanvasItem) -> void:
	var s := settings()
	for i in range(ROWS.size()):
		var row: Dictionary = ROWS[i]
		var key := String(row["id"])
		var lit := bool(s.get(key, key != "crt"))
		var btn := hotspots.get(row["id"]) as UiButton
		if btn == null:
			continue
		var r := Rect2(btn.position.x + btn.size.x - 84.0, btn.position.y + 18.0 + (3.0 if btn.down else 0.0), 60.0, 26.0)
		UiSkin.rrect(on, r, Color("0E3B1E") if lit else Color("3A3550"), 13, UiTheme.INK, 3)
		var kx := r.end.x - 13.0 if lit else r.position.x + 13.0
		on.draw_circle(Vector2(kx, r.get_center().y), 10.0, UiTheme.INK)
		on.draw_circle(Vector2(kx, r.get_center().y), 8.0, Color("7CFF8A") if lit else Color("D8D4CC"))
		on.draw_circle(Vector2(kx - 3.0, r.get_center().y - 3.0), 3.0, Color(1, 1, 1, 0.7))


func settings() -> Dictionary:
	var g = get_game()
	return g.settings


# Redraws the button texts. now_ms -1 means the current engine clock.
func refresh(now_ms := -1) -> void:
	var now: int = now_ms
	if now < 0:
		now = Time.get_ticks_msec()
	var s := settings()
	for row in ROWS:
		var id: StringName = row["id"]
		var key := String(id)
		var on := bool(s.get(key, key != "crt"))
		var btn := hotspots[id] as UiButton
		btn.text = String(row["name"]) + ": " + ("ON" if on else "OFF")
		btn.kind = "primary" if on else "normal"
	var erase_btn := hotspots[&"erase"] as UiButton
	erase_btn.text = "TAP AGAIN TO CONFIRM" if erase_armed(now) else "ERASE SAVED GAME"
	erase_btn.kind = "danger"
	var sw := get_node_or_null("Hotspots/Switches") as CanvasItem
	if sw != null:
		sw.queue_redraw()


func erase_armed(now_ms: int) -> bool:
	return confirm_until_ms > now_ms


# Flips one setting, saves the settings file and announces the change.
func toggle(key: String) -> void:
	var v := not bool(settings().get(key, key != "crt"))
	settings()[key] = v
	var g = get_game()
	g.save_settings()
	setting_changed.emit(key, v)
	refresh()


# The first tap arms the erase for CONFIRM_MS; a tap while armed erases the save.
func erase_tap(now_ms: int) -> void:
	if erase_armed(now_ms):
		confirm_until_ms = 0
		var g = get_game()
		g.erase_save()
		toast.emit("Save erased")
	else:
		confirm_until_ms = now_ms + CONFIRM_MS
	refresh(now_ms)


func _on_hotspot(id: StringName) -> void:
	match id:
		&"crt", &"sound", &"music":
			toggle(String(id))
		&"erase":
			erase_tap(Time.get_ticks_msec())
		&"back":
			closed.emit()


# Escape closes the panel like BACK. Returns true when the key was used.
func handle_key(keycode: int) -> bool:
	if keycode == KEY_ESCAPE:
		closed.emit()
		return true
	return false


func _unhandled_key_input(event: InputEvent) -> void:
	var k := event as InputEventKey
	if k != null and k.pressed and not k.echo:
		if handle_key(k.keycode):
			get_viewport().set_input_as_handled()


func _process(_delta: float) -> void:
	if confirm_until_ms > 0 and not erase_armed(Time.get_ticks_msec()):
		confirm_until_ms = 0
		refresh()
