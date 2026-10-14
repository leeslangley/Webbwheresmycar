extends "res://tests/harness.gd"


# The runner does not fire _ready on add_child, so the root scene is built by hand here, and so are the
# HUD's children (the cash bar makes its counter in its own _ready, as in test_ui_hud).
func _main() -> Main:
	var ps := load("res://scenes/main.tscn") as PackedScene
	var m := ps.instantiate() as Main
	tree().root.add_child(m)
	m._ready()
	var h: UiHud = m.get_node("Stage/Hud")
	h.build()
	var cash: UiCashBar = h.get_node("Cash")
	if cash.get_node_or_null("Counter") == null:
		cash._ready()
	return m


func test_static_math() -> void:
	eq(Main.stage_position(Vector2(1280, 720)), Vector2.ZERO, "no offset at base size")
	eq(Main.stage_position(Vector2(1600, 720)), Vector2(160, 0), "wide window centres the stage")
	eq(Main.stage_position(Vector2(1281, 721)), Vector2(0, 0), "offset is floored")

	var ins: Dictionary = Main.safe_insets(Vector2(2400, 1080), Rect2(400, 0, 1600, 1080), Vector2(1600, 720))
	near(float(ins["left"]), 266.667, 0.01, "safe left")
	near(float(ins["right"]), 266.667, 0.01, "safe right")
	near(float(ins["top"]), 0.0, 0.01, "safe top")

	var cut: Dictionary = Main.stage_insets(ins, Vector2(160, 0))
	near(float(cut["left"]), 106.667, 0.01, "safe area cuts into the stage")
	near(float(cut["top"]), 0.0, 0.01, "no top cut")

	var small: Dictionary = Main.safe_insets(Vector2(2400, 1080), Rect2(100, 0, 2200, 1080), Vector2(1600, 720))
	var none: Dictionary = Main.stage_insets(small, Vector2(160, 0))
	eq(float(none["left"]), 0.0, "a safe area inside the side strip does not cut the stage")


func test_tree() -> void:
	var m := _main()
	for node_path in ["Backdrop", "Stage", "Stage/Scenes", "Stage/Hud", "Stage/Banner", "Stage/Toasts", "Stage/Tooltip", "Stage/Fade"]:
		ok(m.get_node_or_null(node_path) != null, node_path + " exists")
	var stage: Control = m.get_node("Stage")
	eq(stage.size, Vector2(1280, 720), "stage size")
	var hud: Control = m.get_node("Stage/Hud")
	eq(hud.position, Vector2(0, 590), "hud position")
	var banner: Control = m.get_node("Stage/Banner")
	eq(banner.position, Vector2(24, 4), "banner position")
	ok(m.scenes() is SceneHost, "scenes() is a SceneHost")
	m.show_hud(false)
	eq(hud.visible, false, "show_hud(false) hides the HUD")
	m.show_hud(true)
	eq(hud.visible, true, "show_hud(true) shows the HUD")
	m.free()


func test_fade() -> void:
	var m := _main()
	var r = m.fade_to(0.5, 0.0)
	ok(r == null, "an instant fade returns null")
	var fade: ColorRect = m.get_node("Stage/Fade")
	near(fade.color.a, 0.5, 0.001, "instant fade alpha")
	m.free()


func test_bind_fake() -> void:
	var m := _main()
	var g := TestFakeGame.new()
	m.bind_game(g)
	g.toast_requested.emit("Hi")
	eq(m.get_node("Stage/Toasts").texts(), ["Hi"], "toast from the game shows on the stage")
	var calendar: UiCalendarSheet = m.get_node("Stage/Hud/Calendar")
	eq(calendar.day, g.state["day"], "HUD shows the fake state's day")
	UiCashHistory.reset()
	m.free()


func test_say() -> void:
	var m := _main()
	m.say("hello")
	var banner: UiBanner = m.get_node("Stage/Banner")
	eq(banner.full_text, "HELLO", "say puts the text on the banner in capitals")
	UiCashHistory.reset()
	m.free()
