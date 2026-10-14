extends SceneTree
# Contact sheet driver for tools/godot/sheet.sh. Renders each room scene named in GD_SCENES (comma list, "main" allowed)
# in its own SubViewport, GD_FRAMES frames each, and writes ONE PNG to GD_OUT: 640x360 tiles, three per row, each
# captioned with its scene name. Composed with Image only (no PIL, no ImageMagick).

const TILE_W := 640
const TILE_H := 360
const VIEW_SIZE := Vector2i(1280, 720)
const CAPTION_SIZE := Vector2(300, 34)
const BACKDROP := Color("14102A")

var frames := 10
var out := ""
var scene_names: Array[String] = []


func _initialize() -> void:
	# Autoloads (Game) are only reliable after the first frame, so wait for one before touching them.
	await process_frame
	frames = maxi(1, int(OS.get_environment("GD_FRAMES")))
	out = OS.get_environment("GD_OUT")
	for part in OS.get_environment("GD_SCENES").split(","):
		var s := part.strip_edges()
		if s != "":
			scene_names.append(s)
	if scene_names.is_empty():
		print("SHEET ERROR no scenes")
		quit(2)
		return
	var g = root.get_node("Game")
	g.save_path = "user://sheet_save.json"
	g.new_game(7)
	g.state.cars = TestFakeGame.sample_state().cars
	var base: Dictionary = g.state.duplicate(true)
	var captures: Array[Image] = []
	for name in scene_names:
		g.state = base.duplicate(true)
		_prepare_state(g, name)
		captures.append(await _render(name))
	_compose(captures, out)
	g.erase_save()
	quit(0)


func _prepare_state(g, name: String) -> void:
	if name == "auction":
		g.state.day = 24
	elif name == "endgame":
		g.state.flags = {"gameOver": true, "won": true, "reason": "won"}
		g.state.plates.fatcat = true


func _render(name: String) -> Image:
	var vp := SubViewport.new()
	vp.size = VIEW_SIZE
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.transparent_bg = false
	root.add_child(vp)
	var content: Node = null
	var ps := load("res://scenes/%s.tscn" % name) as PackedScene
	if ps == null:
		print("SHEET ERROR missing ", name)
		var fallback := ColorRect.new()
		fallback.color = Color(1, 0, 1, 1)
		fallback.size = Vector2(VIEW_SIZE)
		content = fallback
	else:
		content = ps.instantiate()
	vp.add_child(content)
	if content.has_method("enter"):
		content.enter({})
	vp.add_child(_caption(name))
	for i in frames:
		await process_frame
	var img := vp.get_texture().get_image()
	vp.queue_free()
	return img


func _caption(name: String) -> Control:
	var holder := Control.new()
	holder.position = Vector2.ZERO
	holder.size = CAPTION_SIZE
	var bar := ColorRect.new()
	bar.color = Color.BLACK
	bar.size = CAPTION_SIZE
	holder.add_child(bar)
	var label := Label.new()
	label.text = name
	label.position = Vector2(6, 2)
	label.add_theme_font_size_override("font_size", 22)
	label.add_theme_color_override("font_color", Color.WHITE)
	holder.add_child(label)
	return holder


func _compose(captures: Array[Image], path: String) -> void:
	var n := captures.size()
	var cols := mini(3, n)
	var rows := ceili(n / float(cols))
	var sheet := Image.create(cols * TILE_W, rows * TILE_H, false, Image.FORMAT_RGBA8)
	sheet.fill(BACKDROP)
	for i in n:
		var img := captures[i]
		img.convert(Image.FORMAT_RGBA8)
		img.resize(TILE_W, TILE_H, Image.INTERPOLATE_BILINEAR)
		sheet.blit_rect(img, Rect2i(0, 0, TILE_W, TILE_H), Vector2i((i % cols) * TILE_W, (i / cols) * TILE_H))
	sheet.save_png(path)
	print("SHEET ", sheet.get_size(), " scenes=", n)
