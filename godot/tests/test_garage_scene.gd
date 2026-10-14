extends "res://tests/harness.gd"

# GarageRoom (scenes/garage.tscn): the layout, the named placeholder and UI nodes, and the tap geometry.
# Tests run outside the scene tree, so _ready does not fire: the test calls it by hand (build_layers, GarageArt.build).

const TABLEAU := Rect2(0, 120, 1280, 470)


func _inside(r: Rect2, outer: Rect2) -> bool:
	return r.position.x >= outer.position.x and r.position.y >= outer.position.y \
		and r.end.x <= outer.end.x and r.end.y <= outer.end.y


func _tappables() -> Array:
	var list: Array = [GarageRoom.R_BACK, GarageRoom.R_PAGE_UP, GarageRoom.R_PAGE_DOWN]
	for i in range(5):
		list.append(GarageRoom.row_rect(i))
	for key in GarageRoom.BTN_RECTS:
		list.append(GarageRoom.BTN_RECTS[key])
	return list


func test_scene_layout() -> void:
	var packed := load("res://scenes/garage.tscn") as PackedScene
	ok(packed != null, "garage.tscn loads")
	var g := packed.instantiate() as GarageRoom
	ok(g != null, "garage.tscn root is a GarageRoom")
	g._ready()

	var names: Array = []
	for c in g.get_children():
		names.append(c.name)
	eq(names, ["Background", "Props", "Characters", "Lights", "Front", "Ui", "Hotspots"], "child order of the root")
	eq(g.size, Vector2(1280, 720), "room is the 1280x720 stage")

	for path in ["Background/Placeholder/Wall", "Background/Placeholder/Floor", "Props/Placeholder/CarViewSlot", \
			"Props/Placeholder/Hoist", "Lights/Placeholder/StripLight0", "Lights/Placeholder/StripLight1", \
			"Lights/Placeholder/StripLight2", "Ui/ListPanel", "Ui/DetailPanel", "Ui/StableLabel", "Ui/EmptyLabel", \
			"Ui/NameLabel", "Ui/QuipLabel", "Ui/DesLabel", "Ui/RelLabel", "Ui/CondLabel", "Ui/ValueLabel", \
			"Ui/CostLabel", "Ui/FaultLabel", "Ui/DesTrack", "Ui/RelTrack", "Ui/CondTrack", "Ui/DesBar", "Ui/RelBar", \
			"Ui/CondBar"]:
		ok(g.get_node_or_null(path) != null, path + " exists")

	eq(g.get_node("Background/Placeholder/Wall").size, Vector2(1280, 430), "wall size")
	eq(g.get_node("Background/Placeholder/Floor").position, Vector2(0, 430), "floor starts at the wall's bottom")
	eq(g.get_node("Props/Placeholder/CarViewSlot").position, GarageRoom.R_CARVIEW.position, "car view slot position")
	eq(g.get_node("Props/Placeholder/CarViewSlot").size, GarageRoom.R_CARVIEW.size, "car view slot size")
	eq((g.get_node("Ui/EmptyLabel") as Label).visible, false, "empty label starts hidden")
	eq((g.get_node("Ui/DesBar") as ColorRect).size.x, 0.0, "desirability bar starts at zero width")
	eq((g.get_node("Ui/RelBar") as ColorRect).size.x, 0.0, "reliability bar starts at zero width")
	eq((g.get_node("Ui/CondBar") as ColorRect).size.x, 0.0, "condition bar starts at zero width")
	eq((g.get_node("Ui/DesTrack") as ColorRect).size, Vector2(GarageRoom.BAR_W, 16), "bar track size")
	eq(g.strip_color, Color("444444"), "strip colour is set in _ready")

	ok(_inside(GarageRoom.R_CARVIEW, GarageRoom.R_DETAIL), "car view is inside the detail panel")

	g.free()


func test_tap_geometry() -> void:
	var rects := _tappables()
	for i in range(rects.size()):
		var r: Rect2 = rects[i]
		ok(r.size.x >= 64.0 and r.size.y >= 64.0, "tappable %d is at least 64x64" % i)
		ok(_inside(r, TABLEAU), "tappable %d is inside the tableau y 120..590" % i)
	for i in range(rects.size()):
		for j in range(i + 1, rects.size()):
			ok(not (rects[i] as Rect2).intersects(rects[j]), "tappables %d and %d do not intersect" % [i, j])
	ok(GarageRoom.row_rect(4).end.y <= 590.0, "the last row ends at or above y 590")
	eq(GarageRoom.ROWS_PER_PAGE, 5, "five rows per page")
	eq(GarageRoom.row_rect(0), Rect2(30, 196, 370, 68), "first row rect")
