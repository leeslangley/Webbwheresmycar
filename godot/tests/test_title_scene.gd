extends "res://tests/harness.gd"

# TitleRoom (scenes/title.tscn): stars, road, car and logo timing, the three buttons, the CONTINUE
# rule and the keys. Uses a real Game with its own save file. The runner does not run _ready for nodes
# added to the tree during _initialize, so the room is built by calling _ready() by hand; no frames
# are run, so _process never fires and apply_time is called directly.

const SAVE := "user://test_title_save.json"


func _game() -> Node:
	var g = load("res://autoload/game.gd").new()
	g.save_path = SAVE
	g.erase_save()
	return g


func _room(g: Node) -> TitleRoom:
	var room := (load("res://scenes/title.tscn") as PackedScene).instantiate() as TitleRoom
	room.game = g
	room._ready()
	return room


func _done(g: Node, room: TitleRoom) -> void:
	room.free()
	g.erase_save()
	g.free()


func test_stars() -> void:
	var g := _game()
	var room := _room(g)
	var stars := room.placeholder("Background").get_node("Stars")
	eq(stars.get_child_count(), 40, "40 stars")
	eq((stars.get_node("Star1") as Control).position, Vector2(190, 120), "Star1 position")
	eq((stars.get_node("Star39") as Control).position, Vector2(276, 502), "Star39 position")
	_done(g, room)


func test_continue_follows_save() -> void:
	var g := _game()
	var room := _room(g)
	eq(room.hotspots[&"continue"].enabled, false, "CONTINUE is greyed without a save")
	g.new_game(3)
	room.refresh()
	eq(room.hotspots[&"continue"].enabled, true, "CONTINUE is enabled with a save")
	_done(g, room)


func test_taps() -> void:
	var g := _game()
	var room := _room(g)
	var got: Array = []
	room.new_game.connect(func(): got.append("new"))
	room.continue_game.connect(func(): got.append("continue"))
	room.open_settings.connect(func(): got.append("settings"))
	TapUtil.tap(room.hotspots[&"new_game"])
	eq(got, ["new"], "NEW GAME tap emits new_game")
	TapUtil.tap(room.hotspots[&"settings"])
	eq(got, ["new", "settings"], "SETTINGS tap emits open_settings")
	TapUtil.tap(room.hotspots[&"continue"])
	eq(got, ["new", "settings", "continue"], "greyed CONTINUE tap still emits continue_game (blocked)")
	g.new_game(3)
	room.refresh()
	got.clear()
	TapUtil.tap(room.hotspots[&"continue"])
	eq(got, ["continue"], "CONTINUE tap emits continue_game with a save")
	_done(g, room)


func test_apply_time() -> void:
	var g := _game()
	var room := _room(g)
	var dash0 := room.placeholder("Background").get_node("Dashes/Dash0") as Control
	var car := room.placeholder("Props").get_node("Car") as Node2D
	var body := car.get_node("Body") as ColorRect
	var logo := room.ui().get_node("LogoWebb") as Control
	room.apply_time(0.0)
	eq(dash0.position.x, -60.0, "dash 0 at t=0")
	eq(car.position.x, -300.0, "car at t=0")
	eq(body.color, Color("9A2A2A"), "car colour 0 at t=0")
	room.apply_time(1.0)
	eq(dash0.position.x, 1220.0, "dash 0 at t=1")
	room.apply_time(3.0)
	near(car.position.x, 650.0, 0.001, "car at t=3")
	room.apply_time(6.0)
	near(car.position.x, -300.0, 0.001, "car wraps at t=6")
	eq(body.color, Color("1C2E5A"), "car colour 1 at t=6")
	room.apply_time(PI / 3.0)
	near(logo.position.y, 104.0, 0.001, "logo bobs 4 px down at t=PI/3")
	eq((room.ui().get_node("LogoWebb") as Label).text, "WEBB,", "logo text")
	_done(g, room)


func test_keys() -> void:
	var g := _game()
	var room := _room(g)
	var got: Array = []
	room.new_game.connect(func(): got.append("new"))
	room.continue_game.connect(func(): got.append("continue"))
	room.open_settings.connect(func(): got.append("settings"))
	eq(room.handle_key(KEY_ENTER), true, "ENTER is handled")
	eq(got, ["new"], "ENTER emits new_game")
	eq(room.handle_key(KEY_N), true, "N is handled")
	eq(room.handle_key(KEY_C), false, "C is not handled without a save")
	eq(room.handle_key(KEY_S), true, "S is handled")
	eq(got, ["new", "new", "settings"], "N and S emit; C without a save does not")
	eq(room.handle_key(KEY_Q), false, "Q is not handled")
	g.new_game(3)
	got.clear()
	eq(room.handle_key(KEY_C), true, "C is handled with a save")
	eq(got, ["continue"], "C emits continue_game with a save")
	_done(g, room)


func test_buttons_layout() -> void:
	var g := _game()
	var room := _room(g)
	var rects: Array = []
	for id in [&"new_game", &"continue", &"settings"]:
		var b := room.hotspots[id] as Control
		ok(b.size.y >= 64.0 and b.size.x >= 64.0, str(id) + " is at least 64 px")
		rects.append(Rect2(b.position, b.size))
	for i in range(rects.size()):
		for j in range(i + 1, rects.size()):
			ok(not rects[i].intersects(rects[j]), "buttons " + str(i) + " and " + str(j) + " do not intersect")
	_done(g, room)
