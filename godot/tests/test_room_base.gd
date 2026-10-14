extends "res://tests/harness.gd"

# RoomBase: the layered room root, plate and placeholder helpers, hotspots and buttons, and the static
# builders. Taps go through TapUtil. Nodes are not added to the scene tree, so _ready does not run.

const LAYERS := ["Background", "Props", "Characters", "Lights", "Front"]


func _subclass() -> GDScript:
	var s := GDScript.new()
	s.source_code = "extends RoomBase\nvar got := []\nvar blocked := []\nvar downs := []\nfunc _on_hotspot(i): got.append(i)\nfunc _on_button_blocked(i): blocked.append(i)\nfunc _on_button_down(i): downs.append(i)\n"
	s.reload()
	return s


func test_build_layers() -> void:
	var r := RoomBase.new()
	r.build_layers()
	var names: Array = []
	for c in r.get_children():
		names.append(c.name)
	eq(names, ["Background", "Props", "Characters", "Lights", "Front", "Ui", "Hotspots"], "child order of the root")
	for layer_name in LAYERS:
		var l := r.get_node(layer_name) as Node2D
		ok(l != null, layer_name + " is a Node2D")
		var plate := l.get_node("Plate") as Sprite2D
		ok(plate != null, layer_name + " has a Sprite2D Plate")
		eq(plate.centered, false, layer_name + " plate is not centred")
		ok(l.get_node_or_null("Placeholder") is Node2D, layer_name + " has a Placeholder")
	eq(r.size, Vector2(1280, 720), "root size is the stage")
	r.build_layers()
	eq(r.get_child_count(), 7, "a second build_layers adds no children")
	r.free()


func test_set_plate() -> void:
	var r := RoomBase.new()
	r.build_layers()
	var tex := ImageTexture.create_from_image(Image.create(4, 4, false, Image.FORMAT_RGBA8))
	r.set_plate("Props", tex)
	eq((r.get_node("Props/Plate") as Sprite2D).texture, tex, "set_plate sets the Plate texture")
	eq(r.placeholder("Props").visible, false, "set_plate hides the placeholder")
	r.set_plate("Props", null)
	eq(r.placeholder("Props").visible, true, "a null plate shows the placeholder again")
	r.free()


func test_add_box() -> void:
	var r := RoomBase.new()
	r.build_layers()
	var box := RoomBase.add_box(r.placeholder("Props"), "B", Rect2(10, 20, 30, 40), Color.BLACK, "HI")
	eq(box.position, Vector2(10, 20), "box position")
	eq(box.size, Vector2(30, 40), "box size")
	var cap := box.get_node("Caption") as Label
	ok(cap != null, "caption label is added")
	eq(cap.get_theme_color("font_color"), Color.WHITE, "dark box gets a white caption")
	var light := RoomBase.add_box(r.placeholder("Props"), "L", Rect2(0, 0, 10, 10), Color.WHITE, "HI")
	eq((light.get_node("Caption") as Label).get_theme_color("font_color"), Color("14102A"), "light box gets an ink caption")
	var plain := RoomBase.add_box(r.placeholder("Props"), "P", Rect2(0, 0, 10, 10), Color.BLACK)
	eq(plain.get_child_count(), 0, "no caption when caption is empty")
	r.free()


func test_hotspot_on_room() -> void:
	var s := _subclass()
	var r2 = s.new()
	r2.build_layers()
	var hs = r2.add_hotspot(&"k", Rect2(0, 0, 10, 10))
	ok(r2.hotspots.has(&"k"), "hotspot stored by id")
	eq(hs.get_parent(), r2.get_node("Hotspots"), "hotspot is a child of Hotspots")
	eq(hs.size, Vector2(64, 64), "hotspot grows to 64x64")
	TapUtil.tap(hs)
	eq(r2.got, [&"k"], "tap calls _on_hotspot with the id")
	eq(r2.downs, [&"k"], "press calls _on_button_down with the id")
	r2.free()


func test_add_button() -> void:
	var s := _subclass()
	var r2 = s.new()
	r2.build_layers()
	var b: UiButton = r2.add_button(&"b", Rect2(0, 0, 100, 70), "GO", "primary")
	eq(b.name, &"Btn_b", "button node name")
	eq(b.text, "GO", "button text")
	eq(b.kind, "primary", "button kind")
	eq(b.size, Vector2(100, 70), "button size")
	eq(b.get_parent(), r2.get_node("Hotspots"), "button is a child of Hotspots")
	TapUtil.tap(b)
	ok(r2.got.has(&"b"), "tapping an enabled button calls _on_hotspot")
	var before: int = r2.got.size()
	b.enabled = false
	TapUtil.tap(b)
	eq(r2.got.size(), before, "tapping a disabled button does not call _on_hotspot")
	eq(r2.blocked, [&"b"], "tapping a disabled button calls _on_button_blocked")
	r2.free()


func test_add_panel() -> void:
	var p := RoomBase.add_panel(RoomBase.new(), "P", Rect2(0, 0, 100, 50))
	var sb := p.get_theme_stylebox("panel") as StyleBoxFlat
	ok(sb != null, "panel has a StyleBoxFlat")
	eq(sb.border_width_left, 4, "panel border is 4 px")
	eq(sb.bg_color, Color("FFF7DC"), "panel default fill")
	p.get_parent().free()


func test_add_label() -> void:
	var host := Control.new()
	var l := RoomBase.add_label(host, "T", "HELLO", Vector2(1, 2), 20, Color.WHITE, 200.0, true)
	eq(l.size.x, 200.0, "label width")
	eq(l.horizontal_alignment, HORIZONTAL_ALIGNMENT_CENTER, "label is centred")
	eq(l.get_theme_font_size("font_size"), 20, "label font size")
	host.free()


func test_pixel_font() -> void:
	var t := RoomBase.pixel_font("title")
	var b := RoomBase.pixel_font("body")
	ok(t != null, "title font exists")
	ok(b != null, "body font exists")
	ok(t != b, "title and body fonts differ")


func test_get_game() -> void:
	var r := RoomBase.new()
	var fake := TestFakeGame.new()
	r.game = fake
	eq(r.get_game(), fake, "get_game returns the game when set")
	r.free()
