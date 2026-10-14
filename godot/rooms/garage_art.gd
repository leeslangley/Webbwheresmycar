class_name GarageArt
extends RefCounted

# Placeholder art and UI layout of the garage room: concrete wall, painted floor, the car view slot,
# the hoist, three strip lights, the list and detail panels, the labels and the stat bars.
# Real art comes later (GDA cards); the node names here are the contract for those cards and the tests.


static func build(room: GarageRoom) -> void:
	_build_art(room)
	_build_ui(room)


static func _build_art(room: GarageRoom) -> void:
	var bg := room.placeholder("Background")
	RoomBase.add_box(bg, "Wall", Rect2(0, 0, 1280, 430), Color("5A5A5A"), "CONCRETE WALL")
	RoomBase.add_box(bg, "Floor", Rect2(0, 430, 1280, 290), Color("5B4A2E"), "PAINTED FLOOR")

	var props := room.placeholder("Props")
	RoomBase.add_box(props, "CarViewSlot", GarageRoom.R_CARVIEW, Color("222222"), "CAR VIEW")
	RoomBase.add_box(props, "Hoist", Rect2(1150, 300, 90, 110), Color("B3282D"), "HOIST")

	var lights := room.placeholder("Lights")
	RoomBase.add_box(lights, "StripLight0", Rect2(220, 124, 140, 12), Color("FFD27A"))
	RoomBase.add_box(lights, "StripLight1", Rect2(570, 124, 140, 12), Color("FFD27A"))
	RoomBase.add_box(lights, "StripLight2", Rect2(920, 124, 140, 12), Color("FFD27A"))


static func _build_ui(room: GarageRoom) -> void:
	var ui := room.ui()
	var cream := Color("F4E9C8")
	var ink := Color("14102A")

	RoomBase.add_panel(ui, "ListPanel", GarageRoom.R_LIST, Color(0.0784, 0.0627, 0.1647, 0.85))
	RoomBase.add_panel(ui, "DetailPanel", GarageRoom.R_DETAIL, Color(1.0, 0.969, 0.863, 0.92))

	RoomBase.add_label(ui, "StableLabel", "STABLE 0/0", Vector2(30, 560), 24, cream, 370.0)

	var empty := RoomBase.add_label(ui, "EmptyLabel", "The garage is empty. Mark weeps quietly.", Vector2(40, 210), 26, cream, 350.0)
	empty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	empty.size = Vector2(350, 80)
	empty.visible = false

	var name_label := RoomBase.add_label(ui, "NameLabel", "", Vector2(440, 132), 16, ink, 480.0)
	name_label.add_theme_font_override("font", RoomBase.pixel_font("title"))
	RoomBase.add_label(ui, "QuipLabel", "", Vector2(440, 162), 24, ink, 480.0)

	var des := RoomBase.add_label(ui, "DesLabel", "DESIRABILITY", Vector2(940, 132), 16, ink, 290.0)
	des.add_theme_font_override("font", RoomBase.pixel_font("title"))
	var rel := RoomBase.add_label(ui, "RelLabel", "RELIABILITY", Vector2(940, 184), 16, ink, 290.0)
	rel.add_theme_font_override("font", RoomBase.pixel_font("title"))
	var cond := RoomBase.add_label(ui, "CondLabel", "CONDITION", Vector2(940, 236), 16, ink, 290.0)
	cond.add_theme_font_override("font", RoomBase.pixel_font("title"))

	RoomBase.add_label(ui, "ValueLabel", "", Vector2(940, 292), 26, ink, 290.0)
	RoomBase.add_label(ui, "CostLabel", "", Vector2(940, 322), 26, ink, 290.0)

	var fault := RoomBase.add_label(ui, "FaultLabel", "", Vector2(940, 352), 24, Color("D9483B"), 290.0)
	fault.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	fault.size = Vector2(290, 70)

	_add_bar(ui, "Des", 158, Color("6C5EB5"))
	_add_bar(ui, "Rel", 210, Color("3FAE49"))
	_add_bar(ui, "Cond", 262, Color("FFD27A"))


static func _add_bar(ui: Control, stem: String, y: float, fill: Color) -> void:
	RoomBase.add_box(ui, stem + "Track", Rect2(GarageRoom.BAR_X, y, GarageRoom.BAR_W, 16), Color("6C6C6C"))
	RoomBase.add_box(ui, stem + "Bar", Rect2(GarageRoom.BAR_X, y, 0, 16), fill)
