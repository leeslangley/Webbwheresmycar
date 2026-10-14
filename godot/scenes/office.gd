class_name OfficeRoom
extends RoomBase

# The office: the Webb TV dead centre, Mark and Dave in chairs in front of its lower corners, and
# flat-colour placeholders around it. Layout only; hotspots and the menu come in GDR02.

const R_TV := Rect2(260, 60, 760, 560)
const R_GARAGE_DOOR := Rect2(30, 124, 200, 160)
const R_WINDOW := Rect2(1040, 124, 110, 110)
const R_POSTER := Rect2(1164, 124, 96, 110)
const R_CALENDAR := Rect2(1060, 244, 130, 140)
const R_DESK := Rect2(1020, 464, 260, 126)
const R_PHONE := Rect2(1046, 400, 72, 64)
const R_NEWSPAPER := Rect2(1122, 408, 78, 56)
const R_KETTLE := Rect2(1208, 396, 56, 70)
const R_MARK := Rect2(300, 470, 110, 150)
const R_DAVE := Rect2(870, 470, 110, 150)
const R_MENU := Rect2(8, 290, 280, 272)


func _ready() -> void:
	build_layers()
	strip_color = Color("6C5EB5")
	OfficeArt.build(self)
