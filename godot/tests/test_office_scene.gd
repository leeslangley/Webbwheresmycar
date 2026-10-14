extends "res://tests/harness.gd"

# The office scene (GDR01): layer tree, TV placement and centring, back-of-head figures, layout rects.
# The scene is added to the root, then _ready is called by hand (it does not fire under the runner).


func _room() -> OfficeRoom:
	var ps := load("res://scenes/office.tscn") as PackedScene
	var room := ps.instantiate() as OfficeRoom
	tree().root.add_child(room)
	room._ready()
	return room


func _names(parent: Node) -> Array:
	var out: Array = []
	for c in parent.get_children():
		out.append(c.name)
	return out


func _has_all(parent: Node, wanted: Array, label: String) -> void:
	var names := _names(parent)
	for w in wanted:
		ok(names.has(w), label + " has " + str(w))


func test_layer_tree() -> void:
	var room := _room()
	eq(_names(room), ["Background", "Props", "Characters", "Lights", "Front", "Ui", "Hotspots", "Parallax"], "root children")
	_has_all(room.placeholder("Background"), ["Wall", "Skirting", "Floor", "Window", "Poster", "Calendar", "GarageDoor"], "Background/Placeholder")
	_has_all(room.placeholder("Props"), ["Desk", "Phone", "Newspaper", "Kettle"], "Props/Placeholder")
	_has_all(room.placeholder("Lights"), ["TvGlow", "WindowLight"], "Lights/Placeholder")
	ok(room.get_node_or_null("Front/Placeholder/FrontPlant") != null, "Front/Placeholder/FrontPlant exists")
	eq(room.strip_color, Color("6C5EB5"), "strip colour")
	tree().root.remove_child(room)
	room.free()


func test_tv_placement() -> void:
	var room := _room()
	var tv := room.get_node_or_null("Props/Tv") as Control
	ok(tv != null, "Props/Tv exists")
	ok(tv is Tv, "Props/Tv is the real Tv scene")
	if tv != null:
		eq(tv.position, Vector2(260, 60), "Tv position")
		eq(tv.size, Vector2(760, 560), "Tv size")
	eq(OfficeRoom.R_TV.get_center().x, 640.0, "TV is centred on x 640")
	tree().root.remove_child(room)
	room.free()


func test_figures() -> void:
	var room := _room()
	var centres := {}
	for fig_name in ["Mark", "Dave"]:
		var fig := room.get_node_or_null("Characters/Placeholder/" + fig_name) as Node2D
		ok(fig != null, fig_name + " exists")
		if fig == null:
			continue
		_has_all(fig, ["Chair", "Torso", "Head"], fig_name)
		var head := fig.get_node_or_null("Head") as Polygon2D
		ok(head != null, fig_name + " Head is a Polygon2D")
		if head == null:
			continue
		eq(head.polygon.size(), 16, fig_name + " head has 16 points")
		var sum := 0.0
		for p in head.polygon:
			sum += p.x
		centres[fig_name] = sum / head.polygon.size()
	if centres.has("Mark"):
		ok(centres["Mark"] < 640.0, "Mark's head is left of the TV centre")
	if centres.has("Dave"):
		ok(centres["Dave"] > 640.0, "Dave's head is right of the TV centre")
	tree().root.remove_child(room)
	room.free()


func test_rects_inside_stage() -> void:
	var stage := Rect2(0, 0, 1280, 720)
	var rects := {
		"R_TV": OfficeRoom.R_TV, "R_GARAGE_DOOR": OfficeRoom.R_GARAGE_DOOR, "R_WINDOW": OfficeRoom.R_WINDOW,
		"R_POSTER": OfficeRoom.R_POSTER, "R_CALENDAR": OfficeRoom.R_CALENDAR, "R_DESK": OfficeRoom.R_DESK,
		"R_PHONE": OfficeRoom.R_PHONE, "R_NEWSPAPER": OfficeRoom.R_NEWSPAPER, "R_KETTLE": OfficeRoom.R_KETTLE,
		"R_MARK": OfficeRoom.R_MARK, "R_DAVE": OfficeRoom.R_DAVE, "R_MENU": OfficeRoom.R_MENU,
	}
	for key in rects:
		var r: Rect2 = rects[key]
		# Inclusive bounds: Rect2.encloses is strict at the far edge, and R_DESK ends exactly on x 1280.
		var inside := r.position.x >= stage.position.x and r.position.y >= stage.position.y \
			and r.end.x <= stage.end.x and r.end.y <= stage.end.y
		ok(inside, key + " lies inside the 1280x720 stage")


func test_menu_clear_of_figures_and_door() -> void:
	ok(not OfficeRoom.R_MENU.intersects(OfficeRoom.R_MARK.grow(10)), "R_MENU clear of Mark")
	ok(not OfficeRoom.R_MENU.intersects(OfficeRoom.R_GARAGE_DOOR), "R_MENU clear of the garage door")
