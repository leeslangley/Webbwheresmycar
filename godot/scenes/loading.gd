class_name LoadingRoom
extends RoomBase

# Loading scene (port of src/ui/scenes/loading.js). The painted night sky (moon, clouds, far skyline), the
# glossy logo, a 20-segment LED progress bar in a brass bezel, and a strip of wet road with a scrolling
# centre line and the little classic car (headlights on) driving along it as the progress marker.
# It requests preload_paths with threaded loading, never blocks for more than MAX_SHOW seconds, shows
# for at least MIN_SHOW once ready, and leaves at once when there is nothing to load. Emits finished once.

signal finished

const SEG_COUNT := 20
const SEG_W := 28.0
const SEG_GAP := 4.0
const SEG_Y := 486.0
const ROAD := Rect2(340, 520, 600, 28)
const MIN_SHOW := 0.6
const MAX_SHOW := 8.0
const DASH_SPEED := 90.0
const DASH_PERIOD := 40.0
const DASH_COUNT := 16
const CAR_Y := 508.0

const INK := Color("14102A")
const BLUE := Color("352879")
const CREAM := Color("F4E9C8")
const GREY := Color("959595")
const GOOD := Color("3FAE49")

var preload_paths: PackedStringArray = []
var progress_fn: Callable = Callable()
var elapsed := 0.0
var went := false


func _ready() -> void:
	build_layers()
	strip_color = INK
	_build_background()
	_build_ui()
	begin()


func _process(delta: float) -> void:
	tick(delta)


func begin() -> void:
	for p in preload_paths:
		ResourceLoader.load_threaded_request(p)


# {"done": int, "total": int, "ready": bool}. Tests inject progress_fn; otherwise threaded load status is read.
func progress() -> Dictionary:
	if progress_fn.is_valid():
		return progress_fn.call()
	var d := 0
	for p in preload_paths:
		if ResourceLoader.load_threaded_get_status(p) != ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			d += 1
	var n := preload_paths.size()
	return {"done": d, "total": n, "ready": d == n}


func tick(delta: float) -> void:
	elapsed += delta
	var p := progress()
	var total: int = int(p["total"])
	var done: int = int(p["done"])
	var ready: bool = bool(p["ready"])
	var frac := 0.0
	if ready:
		frac = 1.0
	elif total > 0:
		frac = clampf(float(done) / float(total), 0.0, 1.0)

	var lit := floori(frac * float(SEG_COUNT))
	for i in SEG_COUNT:
		var seg := _node("Seg%d" % i) as ColorRect
		seg.color = GOOD if i < lit else _seg_off()

	var car := _node("Car") as Node2D
	car.position = Vector2(ROAD.position.x + frac * ROAD.size.x, CAR_Y)

	var offs := fposmod(elapsed * DASH_SPEED, DASH_PERIOD)
	for k in DASH_COUNT:
		var dash := _node("Dash%d" % k) as ColorRect
		dash.position.x = float(k) * DASH_PERIOD - offs

	var status := _node("Status") as Label
	if elapsed >= MAX_SHOW and not ready:
		status.text = "STILL REVVING - GOING ANYWAY"
	else:
		var dots := ""
		for i in int(floor(elapsed * 3.0)) % 4:
			dots += "."
		status.text = "REVVING UP" + dots

	var leave := total == 0 or (ready and elapsed >= MIN_SHOW) or elapsed >= MAX_SHOW
	if leave and not went:
		went = true
		finished.emit()


func _node(node_name: String) -> Node:
	return find_child(node_name, true, false)


func _seg_off() -> Color:
	return INK.lightened(0.2)


func _build_background() -> void:
	var sky := Polygon2D.new()
	sky.name = "Sky"
	sky.polygon = PackedVector2Array([Vector2(0, 0), Vector2(1280, 0), Vector2(1280, 720), Vector2(0, 720)])
	sky.vertex_colors = PackedColorArray([INK, INK, BLUE, BLUE])
	placeholder("Background").add_child(sky)
	var art := UiSkin.tex("title_sky")
	if art != null:
		var sp := Sprite2D.new()
		sp.name = "SkyArt"
		sp.texture = art
		sp.centered = false
		sp.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		placeholder("Background").add_child(sp)
		var shade := ColorRect.new()
		shade.name = "Shade"
		shade.size = Vector2(1280, 720)
		shade.color = Color(0.03, 0.02, 0.1, 0.35)
		placeholder("Background").add_child(shade)


func _build_ui() -> void:
	ui().texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	var title := add_label(ui(), "Title", "WEBB, WHERE'S MY CAR?", Vector2(0, 220), 40, CREAM, 1280.0, true)
	title.add_theme_font_override("font", pixel_font("title"))
	var sub := add_label(ui(), "Sub", "A WEBB'S WHEELS PRODUCTION", Vector2(0, 290), 26, GREY, 1280.0, true)
	var status := add_label(ui(), "Status", "REVVING UP", Vector2(0, 590), 28, CREAM, 1280.0, true)
	if UiSkin.tex("title_sky") != null:
		title.add_theme_color_override("font_color", Color(0, 0, 0, 0))
		var logo := UiLogoText.new()
		logo.name = "Art"
		logo.size = Vector2(1280, 120)
		logo.position = Vector2(0, -30)
		logo.font_px = 64
		logo.baseline = 92.0
		logo.rim_px = 22
		logo.outline_px = 12
		logo.rim = Color("E8304A")
		logo.fill_bottom = Color("FF9C1A")
		logo.text = "WEBB, WHERE'S MY CAR?"
		title.add_child(logo)
		for l in [sub, status]:
			var lab := l as Label
			lab.add_theme_font_override("font", UiSkin.display_font(800))
			lab.add_theme_constant_override("outline_size", 8)
			lab.add_theme_color_override("font_outline_color", INK)
		sub.add_theme_font_size_override("font_size", 20)
		sub.add_theme_color_override("font_color", CREAM)
		status.add_theme_font_size_override("font_size", 22)
		status.add_theme_color_override("font_color", Color("FFD27A"))

	var seg_x := (1280.0 - (SEG_COUNT * SEG_W + (SEG_COUNT - 1) * SEG_GAP)) / 2.0
	var bezel := LoadBezel.new()
	bezel.name = "Bezel"
	bezel.position = Vector2(seg_x - 14.0, SEG_Y - 12.0)
	bezel.size = Vector2(SEG_COUNT * SEG_W + (SEG_COUNT - 1) * SEG_GAP + 28.0, 40.0)
	bezel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui().add_child(bezel)
	var pill: ShaderMaterial = null
	if ResourceLoader.exists("res://art/ui/pill.gdshader"):
		pill = ShaderMaterial.new()
		pill.shader = load("res://art/ui/pill.gdshader") as Shader
		pill.set_shader_parameter("size", Vector2(SEG_W, 16.0))
		pill.set_shader_parameter("radius", 5.0)
	for i in SEG_COUNT:
		var seg := add_box(ui(), "Seg%d" % i, Rect2(seg_x + i * (SEG_W + SEG_GAP), SEG_Y, SEG_W, 16), _seg_off())
		seg.material = pill

	var clip := Control.new()
	clip.name = "RoadClip"
	clip.position = ROAD.position
	clip.size = ROAD.size
	clip.clip_contents = true
	clip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui().add_child(clip)
	var road := add_box(clip, "Road", Rect2(0, 0, ROAD.size.x, ROAD.size.y), Color("1C1830"))
	add_box(road, "Kerb", Rect2(0, 0, ROAD.size.x, 3), Color("6A6490"))
	add_box(road, "Edge", Rect2(0, ROAD.size.y - 3, ROAD.size.x, 3), Color("0E0C1C"))
	for k in DASH_COUNT:
		add_box(clip, "Dash%d" % k, Rect2(float(k) * DASH_PERIOD, 12, 24, 4), Color(0.95, 0.9, 0.7, 0.85))
	var road_frame := LoadRoadFrame.new()
	road_frame.name = "RoadFrame"
	road_frame.position = ROAD.position - Vector2(6, 6)
	road_frame.size = ROAD.size + Vector2(12, 12)
	road_frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui().add_child(road_frame)

	var car := Node2D.new()
	car.name = "Car"
	placeholder("Props").add_child(car)
	car.position = Vector2(ROAD.position.x, CAR_Y)
	var body := add_box(car, "Body", Rect2(-30, -20, 60, 24), Color("C8102E"))
	for wheel in [["WheelL", Vector2(-15, 6)], ["WheelR", Vector2(15, 6)]]:
		var w := Polygon2D.new()
		w.name = wheel[0]
		w.polygon = _circle(7.0, wheel[1])
		w.color = INK
		car.add_child(w)
	if UiSkin.tex("title_car_paint") != null:
		body.visible = false
		(car.get_node("WheelL") as CanvasItem).visible = false
		(car.get_node("WheelR") as CanvasItem).visible = false
		car.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		var k := 0.34
		var off := Vector2(-150.0 * k, 34.0 - 110.0 * k)
		for part in [["Beam", "title_beam", Vector2(282, 6), 0.6], ["Paint", "title_car_paint", Vector2.ZERO, 1.0], ["Detail", "title_car_detail", Vector2.ZERO, 1.0]]:
			var sp := Sprite2D.new()
			sp.name = part[0]
			sp.texture = UiSkin.tex(part[1])
			sp.centered = false
			sp.scale = Vector2(k, k) * float(part[3]) if part[0] == "Beam" else Vector2(k, k)
			sp.position = off + (part[2] as Vector2) * k
			if part[0] == "Beam":
				sp.position = off + Vector2(282.0, 66.0 - 60.0 * float(part[3])) * k
			if part[0] == "Paint":
				sp.modulate = Color("D8323A")
			if part[0] == "Beam":
				var add := CanvasItemMaterial.new()
				add.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
				sp.material = add
			car.add_child(sp)


# Brass bezel behind the LED segments.
class LoadBezel extends Control:
	func _draw() -> void:
		var r := Rect2(Vector2.ZERO, size)
		UiSkin.rrect(self, Rect2(r.position + Vector2(0, 5), r.size), Color(0, 0, 0, 0.45), 14)
		UiSkin.rrect(self, r, Color("C9962E"), 14, UiTheme.INK, 3)
		UiSkin.rrect(self, r.grow(-3), Color("F2D98A"), 11)
		UiSkin.rrect(self, Rect2(r.position + Vector2(5, 6), r.size - Vector2(10, 10)), Color("8A6B1F"), 9)
		UiSkin.rrect(self, r.grow(-7), Color("0B0A1A"), 8, UiTheme.INK, 2)


# Ink outline and kerb shine around the strip of road.
class LoadRoadFrame extends Control:
	func _draw() -> void:
		var sb := StyleBoxFlat.new()
		sb.draw_center = false
		sb.set_border_width_all(6)
		sb.border_color = UiTheme.INK
		sb.set_corner_radius_all(10)
		sb.anti_aliasing = true
		draw_style_box(sb, Rect2(Vector2.ZERO, size))


func _circle(radius: float, centre: Vector2) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 16:
		var a := TAU * float(i) / 16.0
		pts.append(centre + Vector2(cos(a), sin(a)) * radius)
	return pts
