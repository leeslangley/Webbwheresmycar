class_name StageFit
extends RefCounted

# Wide-screen helpers. The window shows more picture than the 1280x720 Stage on a tall phone or a 4:3
# iPad. add_strips() fills that extra picture with four ColorRects in a room's Background layer, so it is
# never empty. safe_rect() gives the part of the Stage that the safe-area insets leave free.

const STAGE := Vector2(1280, 720)


# The extra picture on each side of the Stage for a window of size vp (zero when the window is not larger).
static func strip_size(vp: Vector2) -> Vector2:
	return Vector2(maxf(0.0, (vp.x - STAGE.x) / 2.0), maxf(0.0, (vp.y - STAGE.y) / 2.0))


# The Stage minus the safe-area insets. ins has the keys left, right, top, bottom (like Main.stage_insets).
static func safe_rect(ins: Dictionary) -> Rect2:
	var left := float(ins["left"])
	var right := float(ins["right"])
	var top := float(ins["top"])
	var bottom := float(ins["bottom"])
	return Rect2(left, top, STAGE.x - left - right, STAGE.y - top - bottom)


# Adds StripL, StripR, StripT and StripB to the room's Background layer, in that order at the front
# (so the Plate and placeholders draw above them). Does nothing when they are already there.
static func add_strips(room: RoomBase, color: Color) -> void:
	room.build_layers()
	var bg := room.layer("Background")
	if bg.has_node("StripL"):
		return
	var left := RoomBase.add_box(bg, "StripL", Rect2(-640, 0, 640, 720), color)
	var right := RoomBase.add_box(bg, "StripR", Rect2(1280, 0, 640, 720), color)
	var top := RoomBase.add_box(bg, "StripT", Rect2(-640, -300, 2560, 300), color)
	var bottom := RoomBase.add_box(bg, "StripB", Rect2(-640, 720, 2560, 300), color)
	bg.move_child(left, 0)
	bg.move_child(right, 1)
	bg.move_child(top, 2)
	bg.move_child(bottom, 3)
