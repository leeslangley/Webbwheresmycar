class_name CoreRng
extends RefCounted

# Exact port of src/core/rng.js (DESIGN.md 9.3). The random state is state.rng (a uint32 held in an int)
# inside the state Dictionary. GDScript ints are 64-bit, so every result is masked with 0xFFFFFFFF.
# Pure: no host RNG, no Time.


static func _imul(a: int, b: int) -> int:
	return (a * b) & 0xFFFFFFFF


static func _step(state: Dictionary) -> int:
	state.rng = (int(state.rng) + 0x6D2B79F5) & 0xFFFFFFFF
	var t: int = state.rng
	t = _imul(t ^ (t >> 15), t | 1)
	t = (t ^ ((t + _imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
	return (t ^ (t >> 14)) & 0xFFFFFFFF


# Seed 0 is allowed; any number becomes a uint32 (-1 becomes 4294967295).
static func seed_rng(state: Dictionary, seed_value: int) -> void:
	state.rng = seed_value & 0xFFFFFFFF


# Uniform in [0, 1).
static func rand(state: Dictionary) -> float:
	return float(_step(state)) / 4294967296.0


# Integer in [lo, hi], inclusive at both ends.
static func rand_int(state: Dictionary, lo: int, hi: int) -> int:
	return lo + int(floor(rand(state) * float(hi - lo + 1)))


# True with probability p.
static func chance(state: Dictionary, p: float) -> bool:
	return rand(state) < p


# Uniform pick from an array. An empty array returns null and draws nothing.
static func pick(state: Dictionary, arr: Array) -> Variant:
	if arr.is_empty():
		return null
	return arr[rand_int(state, 0, arr.size() - 1)]


# Weighted pick from [{w, ...}] with numeric w >= 0. Draws ONE rand.
# No positive weight at all returns {} and draws nothing.
static func weighted(state: Dictionary, items: Array) -> Variant:
	var total: float = 0.0
	for item in items:
		total += float(item.w)
	if total <= 0.0:
		return {}
	var r: float = rand(state)
	for item in items:
		r -= float(item.w) / total
		if r < 0.0:
			return item
	# Rounding could leave the draw at exactly the total; fall back to the last item that carries weight.
	for i in range(items.size() - 1, -1, -1):
		if float(items[i].w) > 0.0:
			return items[i]
	return {}


# JS Math.round rounds halves UP, so floor(x + 0.5) is used here, not round().
static func round_to(x: float, step_size: float) -> float:
	return snappedf(floor(x / step_size + 0.5) * step_size, 0.000001)


static func clamp_value(x: float, lo: float, hi: float) -> float:
	return minf(hi, maxf(lo, x))
