class_name TransMath
extends RefCounted

# Pure transition maths, ported from src/ui/transitions.js, transitions2.js and tokens.js (MOTION, EASE).
# No nodes, no randomness, no clock: the Transitions node and the shader only apply these numbers.

const KINDS := ["fade", "slide-left", "slide-right", "slide-up", "slide-down", "iris", "static", "pageturn"]
const DURATION_MS := {
	"fade": 250,
	"slide-left": 350,
	"slide-right": 350,
	"slide-up": 350,
	"slide-down": 350,
	"iris": 500,
	"static": 400,
	"pageturn": 320,
}
const STATIC_COLORS := [Color("101010"), Color("505050"), Color("A0A0A0"), Color("F0F0F0")]
const STATIC_CELL := 32


static func is_kind(kind: String) -> bool:
	return KINDS.has(kind)


static func duration_ms(kind: String) -> int:
	if not DURATION_MS.has(kind):
		return -1
	return int(DURATION_MS[kind])


static func progress(start_ms: int, dur_ms: int, now_ms: int) -> float:
	return clampf(float(now_ms - start_ms) / float(dur_ms), 0.0, 1.0)


static func is_done(start_ms: int, dur_ms: int, now_ms: int) -> bool:
	return now_ms >= start_ms + dur_ms


static func ease_in_out_quad(u: float) -> float:
	var v: float = clampf(u, 0.0, 1.0)
	if v < 0.5:
		return 2.0 * v * v
	return 1.0 - pow(-2.0 * v + 2.0, 2.0) / 2.0


static func ease_out_cubic(u: float) -> float:
	var v: float = clampf(u, 0.0, 1.0)
	return 1.0 - pow(1.0 - v, 3.0)


static func fade_alpha(u: float) -> float:
	return ease_in_out_quad(u)


# e is the eased progress (the caller passes ease_out_cubic(u)). Returns [old_offset, new_offset] or [] for other kinds.
static func slide_offsets(kind: String, e: float, size: Vector2) -> Array:
	var w: float = size.x
	var h: float = size.y
	if kind == "slide-left":
		return [Vector2(-e * w, 0.0), Vector2((1.0 - e) * w, 0.0)]
	if kind == "slide-right":
		return [Vector2(e * w, 0.0), Vector2(-(1.0 - e) * w, 0.0)]
	if kind == "slide-up":
		return [Vector2(0.0, -e * h), Vector2(0.0, (1.0 - e) * h)]
	if kind == "slide-down":
		return [Vector2(0.0, e * h), Vector2(0.0, -(1.0 - e) * h)]
	return []


static func iris(u: float, size: Vector2) -> Dictionary:
	# Computed in double precision: Vector2.length() is single precision and drifts from the JS hypot().
	var w: float = size.x
	var h: float = size.y
	var r: float = sqrt(w * w + h * h) / 2.0
	if u < 0.5:
		return {"radius": r * (1.0 - 2.0 * u), "showing": "from"}
	return {"radius": r * (2.0 * u - 1.0), "showing": "to"}


static func static_coverage(u: float) -> float:
	return 1.0 - absf(2.0 * u - 1.0)


# Returns Vector3i(i, j, level) for each cell that shows static this frame, row by row.
# Reproduces JavaScript's (Math.imul(...) ^ ... ) >>> 0 with 32-bit masks.
static func static_cells(cols: int, rows: int, coverage: float, frame: int) -> Array:
	var out: Array = []
	for j in range(rows):
		for i in range(cols):
			var h: int = (((i + 1) * 73856093) & 0xFFFFFFFF) ^ (((j + 1) * 19349663) & 0xFFFFFFFF) ^ (((frame + 1) * 83492791) & 0xFFFFFFFF)
			if float(h % 1000) / 1000.0 < coverage:
				out.append(Vector3i(i, j, (h >> 10) % 4))
	return out


static func page_scale(u: float) -> float:
	return 1.0 - ease_in_out_quad(u)


static func page_edge_x(u: float, width: float) -> float:
	return page_scale(u) * width


static func page_shadow_alpha(u: float) -> float:
	return 0.3 * (1.0 - u)
