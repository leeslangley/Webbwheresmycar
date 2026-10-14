class_name Wear
extends RefCounted

# Car weathering as numbers (port of the wear table in src/art/sprite_wear.js and src/art/sprite_paint.js).
# Wear level is a float 0..3: 0 mint, 1 worn, 2 tatty, 3 wreck. Tables are indexed by the whole step;
# values between steps are linear. Pure functions, no node access.

static var DIRT := PackedFloat32Array([0.0, 0.1, 0.24, 0.4])
static var RUST := PackedFloat32Array([0.0, 0.0, 0.10, 0.28])
static var PIT := PackedFloat32Array([0.0, 0.0, 0.08, 0.18])
static var FADE := PackedFloat32Array([0.0, 0.12, 0.30, 0.50])
static var DENT := PackedFloat32Array([0.0, 0.0, 0.0, 1.0])
static var CRACK := PackedFloat32Array([0.0, 0.0, 0.0, 1.0])
static var FADE_TOWARD := Color("b8aa96")


# Clamp a wear level to 0.0..3.0. NaN gives 0.0.
static func clamp_level(w: float) -> float:
	if is_nan(w):
		return 0.0
	return clampf(w, 0.0, 3.0)


# Linear interpolation in a 4-entry table at a wear level (level 3.0 gives t[3]).
static func lerp_table(t: PackedFloat32Array, level: float) -> float:
	var l: float = clamp_level(level)
	var i: int = mini(int(floorf(l)), 2)
	return lerpf(t[i], t[i + 1], l - float(i))


# All weathering amounts at a wear level, keyed by name.
static func at(level: float) -> Dictionary:
	var l: float = clamp_level(level)
	return {
		"dirt": lerp_table(DIRT, l),
		"rust": lerp_table(RUST, l),
		"pit": lerp_table(PIT, l),
		"fade": lerp_table(FADE, l),
		"dent": lerp_table(DENT, l),
		"crack": lerp_table(CRACK, l),
	}


# A paint colour mixed toward the faded grey-beige by the wear level.
static func faded(c: Color, level: float) -> Color:
	return c.lerp(FADE_TOWARD, lerp_table(FADE, level))


# Wear state 0..3 from a condition figure (0..10 scale). NaN gives 0.
static func state_from_condition(cond: float) -> int:
	if is_nan(cond):
		return 0
	if cond >= 8.0:
		return 0
	if cond >= 5.0:
		return 1
	if cond >= 2.5:
		return 2
	return 3
