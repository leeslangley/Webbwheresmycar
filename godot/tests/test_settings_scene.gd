extends "res://tests/harness.gd"

# SettingsPanel (GDR09): the settings overlay. The Game is a stub defined here, so the real autoload and the
# settings file are never touched. Tests run outside the scene tree, so _ready does not fire: _make calls it by hand.

const KEYS := [&"crt", &"sound", &"music", &"erase", &"back"]


class StubGame extends RefCounted:
	var settings := {"crt": false, "sound": true, "music": true}
	var saves := 0
	var erased := 0

	func save_settings() -> bool:
		saves += 1
		return true

	func erase_save() -> bool:
		erased += 1
		return true


func _make(stub: StubGame) -> SettingsPanel:
	var scene := load("res://scenes/settings.tscn") as PackedScene
	var room := scene.instantiate() as SettingsPanel
	room.game = stub
	room._ready()
	return room


func _done(room: SettingsPanel) -> void:
	room.free()


func _text(room: SettingsPanel, key: String) -> String:
	return (room.get_node("Hotspots/Btn_" + key) as UiButton).text


func test_layout_and_texts() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	eq(_text(room, "crt"), "CRT FILTER: OFF", "CRT row text at start")
	eq(_text(room, "sound"), "SOUND: ON", "SOUND row text at start")
	eq(_text(room, "music"), "MUSIC: ON", "MUSIC row text at start")
	eq(_text(room, "erase"), "ERASE SAVED GAME", "erase text at start")
	eq(_text(room, "back"), "BACK", "back text")
	eq((room.get_node("Ui/Title") as Label).text, "SETTINGS", "title text")
	var dim := room.get_node("Ui/Dim") as ColorRect
	ok(dim != null, "Ui/Dim exists")
	eq(dim.mouse_filter, Control.MOUSE_FILTER_STOP, "Dim blocks the room behind")
	var stage := Rect2(0, 0, 1280, 720)
	var rects: Array[Rect2] = []
	for k in KEYS:
		var b := room.hotspots[k] as UiButton
		var r := Rect2(b.position, b.size)
		ok(r.size.y >= 64.0, String(k) + " is at least 64 px tall")
		ok(stage.encloses(r), String(k) + " is inside the stage")
		rects.append(r)
	for i in range(rects.size()):
		for j in range(i + 1, rects.size()):
			ok(not rects[i].intersects(rects[j]), "buttons " + str(i) + " and " + str(j) + " do not overlap")
	_done(room)


func test_tap_crt_toggles_and_saves() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	var changes: Array = []
	room.setting_changed.connect(func(k, v): changes.append([k, v]))
	TapUtil.tap(room.hotspots[&"crt"])
	eq(changes, [["crt", true]], "tapping CRT emits setting_changed crt true")
	eq(_text(room, "crt"), "CRT FILTER: ON", "CRT text updates")
	eq(stub.settings["crt"], true, "stub crt is true")
	eq(stub.saves, 1, "settings saved once")
	TapUtil.tap(room.hotspots[&"sound"])
	eq(stub.settings["sound"], false, "tapping SOUND turns it off")
	eq(_text(room, "sound"), "SOUND: OFF", "SOUND text updates")
	_done(room)


func test_missing_keys_default_on_and_toggle() -> void:
	var stub := StubGame.new()
	stub.settings = {}
	var room := _make(stub)
	eq(_text(room, "crt"), "CRT FILTER: OFF", "missing crt reads OFF")
	eq(_text(room, "sound"), "SOUND: ON", "missing sound reads ON")
	eq(_text(room, "music"), "MUSIC: ON", "missing music reads ON")
	room.toggle("music")
	eq(stub.settings["music"], false, "toggling a missing music key turns it off")
	_done(room)


func test_tap_away_does_not_toggle() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	TapUtil.tap_away(room.hotspots[&"crt"])
	eq(stub.settings["crt"], false, "press inside, release outside leaves crt alone")
	eq(stub.saves, 0, "nothing saved")
	_done(room)


func test_erase_two_taps() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	var toasts: Array = []
	room.toast.connect(func(t): toasts.append(t))
	room.erase_tap(1000)
	ok(room.erase_armed(1500), "erase is armed 500 ms after the first tap")
	ok(room.erase_armed(3999), "erase is still armed just before 3 s")
	ok(not room.erase_armed(4000), "erase is not armed at 3 s")
	room.refresh(1500)
	eq(_text(room, "erase"), "TAP AGAIN TO CONFIRM", "armed erase text")
	eq(stub.erased, 0, "first tap does not erase")
	room.erase_tap(1500)
	eq(stub.erased, 1, "second tap inside 3 s erases")
	eq(toasts, ["Save erased"], "toast after erase")
	room.erase_tap(1000)
	ok(not room.erase_armed(4001), "erase is no longer armed after 3 s")
	_done(room)


func test_erase_expires() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	room.erase_tap(1000)
	room.refresh(4000)
	eq(_text(room, "erase"), "ERASE SAVED GAME", "text returns to normal once the window closes")
	room.erase_tap(4000)
	eq(stub.erased, 0, "a tap after the window only re-arms")
	_done(room)


func test_erase_by_real_taps() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	TapUtil.tap(room.hotspots[&"erase"])
	eq(stub.erased, 0, "first real tap on erase does not erase")
	eq(_text(room, "erase"), "TAP AGAIN TO CONFIRM", "first real tap arms the button")
	TapUtil.tap(room.hotspots[&"erase"])
	eq(stub.erased, 1, "second real tap erases")
	_done(room)


func test_back_and_escape_close() -> void:
	var stub := StubGame.new()
	var room := _make(stub)
	var closes: Array = []
	room.closed.connect(func(): closes.append(1))
	TapUtil.tap(room.hotspots[&"back"])
	eq(closes.size(), 1, "BACK emits closed")
	ok(room.handle_key(KEY_ESCAPE), "escape is handled")
	eq(closes.size(), 2, "escape emits closed")
	ok(not room.handle_key(KEY_A), "other keys are not handled")
	eq(closes.size(), 2, "other keys do not close")
	_done(room)
