class_name AuctionRoom
extends RoomBase

# The auction hall (port of src/ui/scenes/auction.js, layout only). Every rect here is a contract for
# the art cards (GDA) and the scene test: the lot's car sits in R_CARVIEW on the plank stage, the four
# stat rows and the YOUR LOTS panel sit on the left, the bid block and the leave button on the right.
# Behaviour (lot browsing, reveals, bids, settling) is GDR06 and GDR28.

const R_BACK := Rect2(30, 126, 120, 64)
const R_PREV := Rect2(30, 200, 120, 100)
const R_NEXT := Rect2(1130, 200, 120, 100)
const R_STAGE := Rect2(170, 126, 940, 190)
const R_CARVIEW := Rect2(440, 184, 400, 130)
const R_STAT_ROWS := [Rect2(40, 322, 290, 64), Rect2(40, 386, 290, 64), Rect2(40, 450, 290, 64), Rect2(40, 514, 290, 64)]
const R_YOURS := Rect2(350, 322, 300, 256)
const R_INFO := Rect2(680, 322, 560, 80)
const R_BID1 := Rect2(680, 410, 270, 64)
const R_BID3 := Rect2(970, 410, 270, 64)
const R_LEAVE := Rect2(680, 490, 560, 64)
const STAT_LABELS := ["STYLE", "UPKEEP", "GRIT", "CONDITION"]
const YOURS_ROWS := 7


func _ready() -> void:
	build_layers()
	strip_color = Color("14102A")
	AuctionArt.build(self)
