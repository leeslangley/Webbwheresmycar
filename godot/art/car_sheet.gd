class_name CarSheet
extends Control

# Review image of every car in res://art/cars/manifest.json on one 1280x720 sheet (GDA17).
# Each car gets two cells: cell 2*i is a side view at wear (i mod 4), cell 2*i+1 a three-quarter view at wear 0.
# Cell k sits in column k % COLS, row k / COLS. Each cell is a CarView with a "Tag" label (game name and wear).
# build() is idempotent; _ready() calls it.

const COLS := 4
const W := 1280.0
const H := 720.0


func _ready() -> void:
	build()


func build() -> void:
	if get_node_or_null("Back") != null:
		return
	size = Vector2(W, H)

	var back := ColorRect.new()
	back.name = "Back"
	back.color = Color("1b1740")
	back.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(back)

	var cars: Dictionary = CarView.manifest().get("cars", {})
	var ids: Array = cars.keys()
	ids.sort()
	var cells := ids.size() * 2
	var rows := ceili(float(cells) / COLS)
	var cell := Vector2(W / COLS, H / maxi(rows, 1))

	for i in ids.size():
		var car_id: String = ids[i]
		var entry: Dictionary = cars[car_id]
		var game_name := str(entry.get("game_name", car_id))
		_add_cell(2 * i, car_id, "side", float(i % 4), cell, game_name)
		_add_cell(2 * i + 1, car_id, "three_quarter", 0.0, cell, game_name)


func _add_cell(k: int, car_id: String, view: String, wear: float, cell: Vector2, game_name: String) -> void:
	var cv := CarView.new()
	cv.name = "Cell_%d" % k
	cv.position = Vector2(float(k % COLS) * cell.x, float(floori(float(k) / COLS)) * cell.y)
	cv.size = cell
	cv.custom_minimum_size = cell
	cv.build()
	cv.set_view(view)
	(cv.get_node("Box") as SubViewportContainer).stretch_shrink = 2
	cv.set_car(car_id)
	cv.set_wear(wear)

	var tag := Label.new()
	tag.name = "Tag"
	tag.position = Vector2(4, 2)
	tag.text = "%s w%d" % [game_name, int(wear)]
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", Color.WHITE)
	tag.add_theme_color_override("font_outline_color", Color.BLACK)
	tag.add_theme_constant_override("outline_size", 3)
	cv.add_child(tag)

	add_child(cv)
