class_name GarageRoom
extends RoomBase

# The garage (the stable): the layout of src/ui/scenes/garage.js refitted to the tableau y 120..590.
# This card builds the room layout and placeholder art only. The list rows, buttons and behaviour
# come in later cards (GDR04, GDR27). Art comes from GarageArt (rooms/garage_art.gd).

const R_BACK := Rect2(30, 126, 150, 64)
const R_PAGE_UP := Rect2(190, 126, 100, 64)
const R_PAGE_DOWN := Rect2(300, 126, 100, 64)
const R_LIST := Rect2(30, 196, 370, 360)
const ROW_H := 72
const ROWS_PER_PAGE := 5
const R_DETAIL := Rect2(420, 126, 830, 300)
const R_CARVIEW := Rect2(440, 196, 480, 220)
const BAR_X := 940.0
const BAR_W := 290.0
const BTN_RECTS := {
	&"tinker": Rect2(420, 438, 270, 64),
	&"service": Rect2(700, 438, 270, 64),
	&"fix": Rect2(980, 438, 270, 64),
	&"restore": Rect2(420, 514, 270, 64),
	&"sell": Rect2(700, 514, 270, 64),
	&"consign": Rect2(980, 514, 270, 64),
}


static func row_rect(i: int) -> Rect2:
	return Rect2(30, 196 + i * ROW_H, 370, 68)


func _ready() -> void:
	build_layers()
	strip_color = Color("444444")
	GarageArt.build(self)
