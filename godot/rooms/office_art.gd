class_name OfficeArt
extends RefCounted

# Flat-colour placeholders for the office room (GDR01). Built by OfficeRoom._ready.


static func build(room: OfficeRoom) -> void:
	var bg := room.placeholder("Background")
	RoomBase.add_box(bg, "Wall", Rect2(0, 0, 1280, 456), Color("6C5EB5"))
	RoomBase.add_box(bg, "Skirting", Rect2(0, 456, 1280, 14), Color("433900"))
	RoomBase.add_box(bg, "Floor", Rect2(0, 470, 1280, 250), Color("6F4F25"))
	RoomBase.add_box(bg, "Window", OfficeRoom.R_WINDOW, Color("9FD3FF"), "WINDOW")
	RoomBase.add_box(bg, "Poster", OfficeRoom.R_POSTER, Color("F4E9C8"), "POSTER")
	RoomBase.add_box(bg, "Calendar", OfficeRoom.R_CALENDAR, Color("FFF7DC"), "CALENDAR")
	RoomBase.add_box(bg, "GarageDoor", OfficeRoom.R_GARAGE_DOOR, Color("6C6C6C"), "GARAGE DOOR")

	var props := room.placeholder("Props")
	RoomBase.add_box(props, "Desk", OfficeRoom.R_DESK, Color("6B4423"), "DESK")
	RoomBase.add_box(props, "Phone", OfficeRoom.R_PHONE, Color("B3282D"), "PHONE")
	RoomBase.add_box(props, "Newspaper", OfficeRoom.R_NEWSPAPER, Color("F4E9C8"), "PAPER")
	RoomBase.add_box(props, "Kettle", OfficeRoom.R_KETTLE, Color("959595"), "KETTLE")

	# The TV is a child of the Props layer itself, not of its placeholder, so hiding placeholders never hides it.
	if ResourceLoader.exists("res://tv/tv.tscn"):
		var tv := (load("res://tv/tv.tscn") as PackedScene).instantiate() as Control
		tv.name = "Tv"
		room.layer("Props").add_child(tv)
		tv.position = OfficeRoom.R_TV.position
	else:
		RoomBase.add_box(room.layer("Props"), "Tv", OfficeRoom.R_TV, Color("222222"), "TV (tv.tscn missing)")

	var chars := room.placeholder("Characters")
	add_figure(chars, "Mark", OfficeRoom.R_MARK, Color("3F2814"), Color("B3282D"), Color("8C5E34"), "MARK")
	add_figure(chars, "Dave", OfficeRoom.R_DAVE, Color("3F2814"), Color("1C2E5A"), Color("D9A66F"), "DAVE")

	var lights := room.placeholder("Lights")
	add_poly(lights, "TvGlow", PackedVector2Array([Vector2(380, 500), Vector2(900, 500), Vector2(1040, 590), Vector2(240, 590)]), Color(0.5, 0.85, 1.0, 0.14))
	add_poly(lights, "WindowLight", PackedVector2Array([Vector2(1040, 234), Vector2(1150, 234), Vector2(1100, 420), Vector2(960, 420)]), Color(1.0, 0.95, 0.7, 0.10))

	RoomBase.add_box(room.placeholder("Front"), "FrontPlant", Rect2(1230, 520, 50, 70), Color("588D43"), "PLANT")


# A figure seen from behind: chair, torso (with caption) and a round head polygon. The head sits on the torso.
static func add_figure(parent: Node, fig_name: String, r: Rect2, chair: Color, body: Color, head: Color, caption: String) -> Node2D:
	var fig := Node2D.new()
	fig.name = fig_name
	parent.add_child(fig)
	RoomBase.add_box(fig, "Chair", Rect2(r.position.x - 10, r.position.y + 50, r.size.x + 20, r.size.y - 50), chair)
	RoomBase.add_box(fig, "Torso", Rect2(r.position.x + 10, r.position.y + 40, r.size.x - 20, r.size.y - 40), body, caption)
	var centre := Vector2(r.position.x + r.size.x / 2.0, r.position.y + 30)
	var pts := PackedVector2Array()
	for i in range(16):
		var a := TAU * float(i) / 16.0
		pts.append(centre + Vector2(cos(a), sin(a)) * 30.0)
	var head_poly := Polygon2D.new()
	head_poly.name = "Head"
	head_poly.polygon = pts
	head_poly.color = head
	fig.add_child(head_poly)
	return fig


static func add_poly(parent: Node, poly_name: String, pts: PackedVector2Array, colour: Color) -> Polygon2D:
	var poly := Polygon2D.new()
	poly.name = poly_name
	poly.polygon = pts
	poly.color = colour
	parent.add_child(poly)
	return poly
