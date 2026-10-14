class_name SettingsPanel
extends RoomBase

# The settings overlay (port of src/ui/scenes/settings.js). A dimmed panel with three toggles (CRT FILTER,
# SOUND, MUSIC), a two-tap ERASE SAVED GAME and BACK. It only edits Game.settings and announces the change
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
	RoomBase.add_panel(u, "Panel", R_PANEL, Color("14102A"))
	var title := RoomBase.add_label(u, "Title", "SETTINGS", Vector2(240, 76), 32, Color("FFD27A"), 800.0, true)
	title.add_theme_font_override("font", RoomBase.pixel_font("title"))
	for i in range(ROWS.size()):
		var row: Dictionary = ROWS[i]
		add_button(row["id"], Rect2(340, 150 + 76 * i, 600, 64), "", "normal")
	add_button(&"erase", R_ERASE, "", "normal")
	add_button(&"back", R_BACK, "BACK", "normal")
	refresh()


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
	var erase_btn := hotspots[&"erase"] as UiButton
	erase_btn.text = "TAP AGAIN TO CONFIRM" if erase_armed(now) else "ERASE SAVED GAME"


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
