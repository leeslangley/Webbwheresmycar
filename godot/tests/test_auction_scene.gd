extends "res://tests/harness.gd"

# AuctionRoom (scenes/auction.tscn): the placeholder layers, the UI nodes and the rect contract the
# art cards and the behaviour cards rely on. Tests run outside the scene tree, so _ready does not fire:
# _room() calls it by hand. Each test frees its room at the end.

const SCENE := "res://scenes/auction.tscn"


func _room() -> AuctionRoom:
	var ps := load(SCENE) as PackedScene
	var room := ps.instantiate() as AuctionRoom
	room._ready()
	return room


func _release(room: AuctionRoom) -> void:
	room.free()


func _names(parent: Node) -> Array:
	var out: Array = []
	for c in parent.get_children():
		out.append(String(c.name))
	return out


func test_layer_order() -> void:
	var room := _room()
	eq(_names(room), ["Background", "Props", "Characters", "Lights", "Front", "Ui", "Hotspots"], "root children order")
	eq(room.size, Vector2(1280, 720), "root is the 1280x720 stage")
	eq(room.strip_color, Color("14102A"), "strip colour is set in _ready")
	_release(room)


func test_background() -> void:
	var room := _room()
	eq(_names(room.get_node("Background/Placeholder")), ["Hall", "Stage", "Plank1", "Plank2", "Plank3", "Plank4", "Plank5"], "background placeholder children")
	var hall := room.get_node("Background/Placeholder/Hall") as ColorRect
	eq(hall.position, Vector2(0, 0), "Hall position")
	eq(hall.size, Vector2(1280, 590), "Hall size")
	eq(hall.color, Color("14102A"), "Hall colour")
	var stage := room.get_node("Background/Placeholder/Stage") as ColorRect
	eq(stage.position, AuctionRoom.R_STAGE.position, "Stage position is R_STAGE")
	eq(stage.size, AuctionRoom.R_STAGE.size, "Stage size is R_STAGE")
	eq(stage.color, Color("433900"), "Stage colour")
	for i in range(1, 6):
		var plank := room.get_node("Background/Placeholder/Plank%d" % i) as ColorRect
		eq(plank.position, Vector2(170, 126 + (i - 1) * 32), "Plank%d position" % i)
		eq(plank.size, Vector2(940, 3), "Plank%d size" % i)
		eq(plank.color, Color("2B2400"), "Plank%d colour" % i)
	_release(room)


func test_props() -> void:
	var room := _room()
	eq(_names(room.get_node("Props/Placeholder")), ["CarViewSlot", "Gavel"], "props placeholder children")
	var slot := room.get_node("Props/Placeholder/CarViewSlot") as ColorRect
	eq(slot.position, AuctionRoom.R_CARVIEW.position, "CarViewSlot position is R_CARVIEW")
	eq(slot.size, AuctionRoom.R_CARVIEW.size, "CarViewSlot size is R_CARVIEW")
	eq(slot.color, Color("222222"), "CarViewSlot colour")
	ok(slot.get_node_or_null("Caption") is Label, "CarViewSlot has a caption")
	var gavel := room.get_node("Props/Placeholder/Gavel") as ColorRect
	eq(gavel.position, Vector2(1020, 140), "Gavel position")
	eq(gavel.size, Vector2(60, 16), "Gavel size")
	eq(gavel.color, Color("F4E9C8"), "Gavel colour")
	ok(AuctionRoom.R_STAGE.encloses(AuctionRoom.R_CARVIEW), "R_CARVIEW is enclosed by R_STAGE")
	_release(room)


func test_lights() -> void:
	var room := _room()
	var spot := room.get_node("Lights/Placeholder/Spotlight") as Polygon2D
	ok(spot != null, "Spotlight is a Polygon2D")
	eq(spot.polygon.size(), 3, "Spotlight has 3 points")
	eq(spot.polygon[0], Vector2(640, 120), "Spotlight apex")
	eq(spot.polygon[1], Vector2(350, 316), "Spotlight left foot")
	eq(spot.polygon[2], Vector2(930, 316), "Spotlight right foot")
	eq(spot.color, Color(1.0, 0.82, 0.48, 0.14), "Spotlight colour")
	_release(room)


func test_characters() -> void:
	var room := _room()
	var crowd := room.get_node("Characters/Placeholder/Crowd") as Node2D
	ok(crowd != null, "Crowd exists")
	eq(crowd.get_child_count(), 9, "Crowd has 9 persons")
	for i in range(9):
		var person := crowd.get_node("Person%d" % i) as Node2D
		ok(person != null, "Person%d exists" % i)
		var head := person.get_node("Head") as Polygon2D
		ok(head != null, "Person%d has a Head Polygon2D" % i)
		eq(head.polygon.size(), 16, "Person%d head has 16 points" % i)
		eq(head.color, Color.BLACK, "Person%d head colour" % i)
		var x := 100.0 + i * 135.0
		var top := head.polygon[0]
		near(top.x, x + 30.0, 1e-3, "Person%d head centre x" % i)
		var torso := person.get_node("Torso") as ColorRect
		ok(torso != null, "Person%d has a Torso" % i)
		eq(torso.position, Vector2(x - 45, 530), "Person%d torso position" % i)
		eq(torso.size, Vector2(90, 60), "Person%d torso size" % i)
	for i in range(5):
		var paddle := room.get_node("Characters/Placeholder/Paddle%d" % i) as Node2D
		ok(paddle != null, "Paddle%d exists" % i)
		eq(paddle.visible, false, "Paddle%d is hidden" % i)
		ok(paddle.get_node("Stick") is ColorRect, "Paddle%d has a Stick" % i)
		ok(paddle.get_node("Board") is ColorRect, "Paddle%d has a Board" % i)
		var px := 120.0 + i * 260.0
		eq((paddle.get_node("Board") as ColorRect).position, Vector2(px - 15, 406), "Paddle%d board position" % i)
	_release(room)


func test_ui_panels() -> void:
	var room := _room()
	var ui := room.ui()
	var yours := ui.get_node("YoursPanel") as Panel
	ok(yours != null, "YoursPanel exists")
	eq(yours.position, AuctionRoom.R_YOURS.position, "YoursPanel position is R_YOURS")
	eq(yours.size, AuctionRoom.R_YOURS.size, "YoursPanel size is R_YOURS")
	var sb := yours.get_theme_stylebox("panel") as StyleBoxFlat
	eq(sb.bg_color, Color(0.267, 0.267, 0.267, 0.9), "YoursPanel fill")
	for i in range(4):
		var r: Rect2 = AuctionRoom.R_STAT_ROWS[i]
		var panel := ui.get_node("StatPanel%d" % i) as Panel
		ok(panel != null, "StatPanel%d exists" % i)
		eq(panel.position, r.position + Vector2(3, 3), "StatPanel%d inset 3 px" % i)
		eq(panel.size, r.size - Vector2(6, 6), "StatPanel%d size is the row less 6 px" % i)
	_release(room)


func test_ui_stat_rows() -> void:
	var room := _room()
	var ui := room.ui()
	var names := ["STYLE", "UPKEEP", "GRIT", "CONDITION"]
	var bar_colors := [Color("FFD27A"), Color("9A6759"), Color("9AD284"), Color("70A4B2")]
	for i in range(4):
		var r: Rect2 = AuctionRoom.R_STAT_ROWS[i]
		var sn := ui.get_node("StatName%d" % i) as Label
		eq(sn.text, names[i], "StatName%d text" % i)
		eq(sn.position, r.position + Vector2(12, 8), "StatName%d position" % i)
		var sv := ui.get_node("StatValue%d" % i) as Label
		eq(sv.text, "???", "StatValue%d text" % i)
		eq(sv.position, r.position + Vector2(12, 34), "StatValue%d position" % i)
		var hint := ui.get_node("StatHint%d" % i) as Label
		eq(hint.text, "REVEAL", "StatHint%d text" % i)
		eq(hint.position, r.position + Vector2(150, 8), "StatHint%d position" % i)
		eq(hint.size.x, 130.0, "StatHint%d width" % i)
		var track := ui.get_node("StatTrack%d" % i) as ColorRect
		eq(track.position, r.position + Vector2(78, 38), "StatTrack%d position" % i)
		eq(track.size, Vector2(160, 14), "StatTrack%d size" % i)
		eq(track.color, Color("6C6C6C"), "StatTrack%d colour" % i)
		var bar := ui.get_node("StatBar%d" % i) as ColorRect
		eq(bar.position, r.position + Vector2(78, 38), "StatBar%d position" % i)
		eq(bar.size, Vector2(0, 14), "StatBar%d starts at zero width" % i)
		eq(bar.color, bar_colors[i], "StatBar%d colour" % i)
	_release(room)


func test_ui_yours_and_bid() -> void:
	var room := _room()
	var ui := room.ui()
	eq((ui.get_node("YoursTitle") as Label).text, "YOUR LOTS", "YoursTitle text")
	eq((ui.get_node("YoursTitle") as Label).position, Vector2(362, 330), "YoursTitle position")
	eq((ui.get_node("YoursEmpty") as Label).text, "Nothing consigned", "YoursEmpty text")
	eq((ui.get_node("YoursEmpty") as Label).position, Vector2(362, 372), "YoursEmpty position")
	for j in range(7):
		var row := ui.get_node("YoursRow%d" % j) as Label
		ok(row != null, "YoursRow%d exists" % j)
		eq(row.position, Vector2(362, 366 + j * 28), "YoursRow%d position" % j)
		eq(row.text, "", "YoursRow%d starts empty" % j)
		var res := ui.get_node("YoursRes%d" % j) as Label
		ok(res != null, "YoursRes%d exists" % j)
		eq(res.position, Vector2(535, 366 + j * 28), "YoursRes%d position" % j)
		eq(res.horizontal_alignment, HORIZONTAL_ALIGNMENT_RIGHT, "YoursRes%d is right aligned" % j)
		eq(res.text, "", "YoursRes%d starts empty" % j)
	var none := ui.get_node("NoLotsLabel") as Label
	eq(none.text, "No lots this month.", "NoLotsLabel text")
	eq(none.visible, false, "NoLotsLabel starts hidden")
	eq((ui.get_node("BidLabel") as Label).text, "Bid: none", "BidLabel text")
	eq((ui.get_node("BidLabel") as Label).position, Vector2(680, 326), "BidLabel position")
	eq((ui.get_node("LeaderLabel") as Label).text, "Nobody", "LeaderLabel text")
	eq((ui.get_node("LeaderLabel") as Label).position, Vector2(680, 358), "LeaderLabel position")
	ok(ui.get_node("MinLabel") is Label, "MinLabel exists")
	eq((ui.get_node("MinLabel") as Label).position, Vector2(680, 384), "MinLabel position")
	_release(room)


func test_tap_rects_are_big_and_separate() -> void:
	var tap: Array = [AuctionRoom.R_BACK, AuctionRoom.R_PREV, AuctionRoom.R_NEXT, AuctionRoom.R_BID1, AuctionRoom.R_BID3, AuctionRoom.R_LEAVE]
	tap.append_array(AuctionRoom.R_STAT_ROWS)
	var field := Rect2(0, 120, 1280, 470)
	for i in range(tap.size()):
		var r: Rect2 = tap[i]
		ok(r.size.x >= 64.0 and r.size.y >= 64.0, "tap rect %d is at least 64x64" % i)
		ok(field.encloses(r), "tap rect %d is inside the tableau" % i)
		for j in range(i + 1, tap.size()):
			ok(not r.intersects(tap[j]), "tap rects %d and %d do not intersect" % [i, j])


func test_other_rects_do_not_overlap_tap_rects() -> void:
	var others: Array = [AuctionRoom.R_YOURS, AuctionRoom.R_INFO, AuctionRoom.R_BID1, AuctionRoom.R_BID3, AuctionRoom.R_LEAVE]
	for i in range(4):
		var stat: Rect2 = AuctionRoom.R_STAT_ROWS[i]
		for j in range(others.size()):
			ok(not stat.intersects(others[j]), "stat row %d does not intersect other rect %d" % [i, j])
	eq(AuctionRoom.YOURS_ROWS, 7, "YOURS_ROWS")
	eq(AuctionRoom.STAT_LABELS, ["STYLE", "UPKEEP", "GRIT", "CONDITION"], "STAT_LABELS")
