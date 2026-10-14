class_name AuctionArt
extends RefCounted

# Placeholder art and UI nodes for the auction hall (AuctionRoom). Flat colour boxes and polygons only;
# the real plates and sprites come with the GDA cards. Every node name here is a contract for the tests
# and the art cards. Rects come from AuctionRoom's constants.

const CROWD_COUNT := 9
const PADDLE_COUNT := 5
const STAT_COUNT := 4
const STAT_BAR_COLORS := [Color("FFD27A"), Color("9A6759"), Color("9AD284"), Color("70A4B2")]
const LAMP := Color("FFD27A")
const CREAM := Color("F4E9C8")
const PANEL_FILL := Color(0.267, 0.267, 0.267, 0.9)
const TRACK := Color("6C6C6C")


static func build(room: AuctionRoom) -> void:
	_build_background(room)
	_build_props(room)
	_build_lights(room)
	_build_characters(room)
	_build_ui(room)


static func _build_background(room: AuctionRoom) -> void:
	var bg := room.placeholder("Background")
	RoomBase.add_box(bg, "Hall", Rect2(0, 0, 1280, 590), Color("14102A"), "HALL")
	RoomBase.add_box(bg, "Stage", AuctionRoom.R_STAGE, Color("433900"), "STAGE")
	for i in range(5):
		RoomBase.add_box(bg, "Plank%d" % (i + 1), Rect2(170, 126 + i * 32, 940, 3), Color("2B2400"))


static func _build_props(room: AuctionRoom) -> void:
	var props := room.placeholder("Props")
	RoomBase.add_box(props, "CarViewSlot", AuctionRoom.R_CARVIEW, Color("222222"), "LOT CAR VIEW")
	RoomBase.add_box(props, "Gavel", Rect2(1020, 140, 60, 16), CREAM)


static func _build_lights(room: AuctionRoom) -> void:
	var lights := room.placeholder("Lights")
	var spot := Polygon2D.new()
	spot.name = "Spotlight"
	spot.polygon = PackedVector2Array([Vector2(640, 120), Vector2(350, 316), Vector2(930, 316)])
	spot.color = Color(1.0, 0.82, 0.48, 0.14)
	lights.add_child(spot)


static func _build_characters(room: AuctionRoom) -> void:
	var chars := room.placeholder("Characters")
	var crowd := Node2D.new()
	crowd.name = "Crowd"
	chars.add_child(crowd)
	for i in range(CROWD_COUNT):
		var x := 100.0 + i * 135.0
		var person := Node2D.new()
		person.name = "Person%d" % i
		crowd.add_child(person)
		var head := Polygon2D.new()
		head.name = "Head"
		var pts := PackedVector2Array()
		for k in range(16):
			var a := TAU * k / 16.0
			pts.append(Vector2(x + 30.0 * cos(a), 500.0 + 30.0 * sin(a)))
		head.polygon = pts
		head.color = Color.BLACK
		person.add_child(head)
		RoomBase.add_box(person, "Torso", Rect2(x - 45, 530, 90, 60), Color.BLACK)
	for i in range(PADDLE_COUNT):
		var x := 120.0 + i * 260.0
		var paddle := Node2D.new()
		paddle.name = "Paddle%d" % i
		paddle.visible = false
		chars.add_child(paddle)
		RoomBase.add_box(paddle, "Stick", Rect2(x - 3, 430, 6, 44), CREAM)
		RoomBase.add_box(paddle, "Board", Rect2(x - 15, 406, 30, 24), Color("9A6759"))


static func _build_ui(room: AuctionRoom) -> void:
	var ui := room.ui()
	RoomBase.add_panel(ui, "YoursPanel", AuctionRoom.R_YOURS, PANEL_FILL)
	for i in range(STAT_COUNT):
		var r: Rect2 = AuctionRoom.R_STAT_ROWS[i]
		RoomBase.add_panel(ui, "StatPanel%d" % i, Rect2(r.position + Vector2(3, 3), r.size - Vector2(6, 6)), PANEL_FILL)

	_title(ui, "LotNo", "", Vector2(180, 132), 16, LAMP)
	_title(ui, "LotName", "", Vector2(170, 132), 16, Color.WHITE, 940.0, true)
	RoomBase.add_label(ui, "LotInfo", "", Vector2(170, 160), 26, CREAM, 940.0, true)
	var no_lots := RoomBase.add_label(ui, "NoLotsLabel", "No lots this month.", Vector2(170, 230), 34, CREAM, 940.0, true)
	no_lots.visible = false

	for i in range(STAT_COUNT):
		var r: Rect2 = AuctionRoom.R_STAT_ROWS[i]
		_title(ui, "StatName%d" % i, AuctionRoom.STAT_LABELS[i], Vector2(r.position.x + 12, r.position.y + 8), 16, LAMP)
		_title(ui, "StatValue%d" % i, "???", Vector2(r.position.x + 12, r.position.y + 34), 18, Color.WHITE)
		RoomBase.add_label(ui, "StatHint%d" % i, "REVEAL", Vector2(r.position.x + 150, r.position.y + 8), 24, CREAM, 130.0)
		RoomBase.add_box(ui, "StatTrack%d" % i, Rect2(r.position.x + 78, r.position.y + 38, 160, 14), TRACK)
		RoomBase.add_box(ui, "StatBar%d" % i, Rect2(r.position.x + 78, r.position.y + 38, 0, 14), STAT_BAR_COLORS[i])

	_title(ui, "YoursTitle", "YOUR LOTS", Vector2(362, 330), 16, LAMP)
	RoomBase.add_label(ui, "YoursEmpty", "Nothing consigned", Vector2(362, 372), 24, CREAM)
	for j in range(AuctionRoom.YOURS_ROWS):
		RoomBase.add_label(ui, "YoursRow%d" % j, "", Vector2(362, 366 + j * 28), 22, Color.WHITE, 170.0)
		var res := RoomBase.add_label(ui, "YoursRes%d" % j, "", Vector2(535, 366 + j * 28), 22, CREAM, 105.0)
		res.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	_title(ui, "BidLabel", "Bid: none", Vector2(680, 326), 20, Color.WHITE)
	_title(ui, "LeaderLabel", "Nobody", Vector2(680, 358), 16, LAMP)
	RoomBase.add_label(ui, "MinLabel", "", Vector2(680, 384), 24, CREAM)


# A title-font label: add_label with the pixel title font swapped in.
static func _title(parent: Node, node_name: String, text: String, pos: Vector2, font_px: int, color: Color, width := 0.0, center := false) -> Label:
	var label := RoomBase.add_label(parent, node_name, text, pos, font_px, color, width, center)
	label.add_theme_font_override("font", RoomBase.pixel_font("title"))
	return label
