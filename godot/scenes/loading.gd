class_name LoadingRoom
extends RoomBase

# Loading scene (port of src/ui/scenes/loading.js). Night sky, title, a 20-segment progress bar, and a
# road with a scrolling dashed centre line and a car that drives along it as the progress marker.
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


func _build_ui() -> void:
	var title := add_label(ui(), "Title", "WEBB, WHERE'S MY CAR?", Vector2(0, 220), 40, CREAM, 1280.0, true)
	title.add_theme_font_override("font", pixel_font("title"))
	add_label(ui(), "Sub", "A WEBB'S WHEELS PRODUCTION", Vector2(0, 290), 26, GREY, 1280.0, true)
	add_label(ui(), "Status", "REVVING UP", Vector2(0, 590), 28, CREAM, 1280.0, true)

	var seg_x := (1280.0 - (SEG_COUNT * SEG_W + (SEG_COUNT - 1) * SEG_GAP)) / 2.0
	for i in SEG_COUNT:
		add_box(ui(), "Seg%d" % i, Rect2(seg_x + i * (SEG_W + SEG_GAP), SEG_Y, SEG_W, 16), _seg_off())

	var clip := Control.new()
	clip.name = "RoadClip"
	clip.position = ROAD.position
	clip.size = ROAD.size
	clip.clip_contents = true
	clip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui().add_child(clip)
	add_box(clip, "Road", Rect2(0, 0, ROAD.size.x, ROAD.size.y), Color("444444"))
	for k in DASH_COUNT:
		add_box(clip, "Dash%d" % k, Rect2(float(k) * DASH_PERIOD, 12, 24, 4), Color("B8C76F"))

	var car := Node2D.new()
	car.name = "Car"
	placeholder("Props").add_child(car)
	car.position = Vector2(ROAD.position.x, CAR_Y)
	add_box(car, "Body", Rect2(-30, -20, 60, 24), Color("C8102E"))
	for wheel in [["WheelL", Vector2(-15, 6)], ["WheelR", Vector2(15, 6)]]:
		var w := Polygon2D.new()
		w.name = wheel[0]
		w.polygon = _circle(7.0, wheel[1])
		w.color = INK
		car.add_child(w)


func _circle(radius: float, centre: Vector2) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 16:
		var a := TAU * float(i) / 16.0
		pts.append(centre + Vector2(cos(a), sin(a)) * radius)
	return pts
