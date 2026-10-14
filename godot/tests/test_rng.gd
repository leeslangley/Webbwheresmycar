extends "res://tests/harness.gd"

# Tests for godot/core/rng.gd: golden sequences from src/core/rng.js (tools/godot/golden_rng.mjs),
# known reference values and edge cases.

const POOL := ["a", "b", "c", "d"]
const WEIGHTS := [{"w": 1, "id": "x"}, {"w": 3, "id": "y"}, {"w": 0, "id": "z"}, {"w": 6, "id": "w"}]


func _seeded(seed_value: int) -> Dictionary:
	var s: Dictionary = {"rng": 0}
	CoreRng.seed_rng(s, seed_value)
	return s


# Numbers match within 1e-12 (GoldenUtil.diff has a fixed 1e-9 tolerance); everything else must be equal.
func _same_value(got: Variant, want: Variant, msg: String) -> void:
	var got_is_num: bool = typeof(got) == TYPE_FLOAT or typeof(got) == TYPE_INT
	var want_is_num: bool = typeof(want) == TYPE_FLOAT or typeof(want) == TYPE_INT
	if got_is_num and want_is_num:
		near(float(got), float(want), 1e-12, msg)
	else:
		eq(got, want, msg)


func _replay(s: Dictionary, op: String, args: Array) -> Variant:
	match op:
		"rand":
			return CoreRng.rand(s)
		"randInt":
			return CoreRng.rand_int(s, int(args[0]), int(args[1]))
		"chance":
			return CoreRng.chance(s, float(args[0]))
		"pick":
			return CoreRng.pick(s, POOL)
		"weighted":
			return CoreRng.weighted(s, WEIGHTS)["id"]
		"roundTo":
			return CoreRng.round_to(CoreRng.rand(s) * 100.0, float(args[0]))
	fail("unknown golden op " + op)
	return null


func test_golden_sequences() -> void:
	var fx: Variant = GoldenUtil.fixture("rng")
	if typeof(fx) != TYPE_DICTIONARY:
		fail("rng fixture missing")
		return
	var ops: Array = fx["ops"]
	var cases: Array = fx["cases"]
	eq(cases.size(), 6, "six seeds in the fixture")
	for c in cases:
		var s: Dictionary = _seeded(int(c["seed"]))
		var out: Array = []
		for op in ops:
			out.append(_replay(s, op["op"], op["args"]))
		var want: Array = c["out"]
		var label: String = "seed %d" % int(c["seed"])
		eq(out.size(), want.size(), label + " op count")
		for i in range(mini(out.size(), want.size())):
			_same_value(out[i], want[i], "%s op %d (%s)" % [label, i, str(ops[i]["op"])])
		eq(s["rng"], c["final"], label + " final state.rng")


func test_statics() -> void:
	var fx: Variant = GoldenUtil.fixture("rng")
	if typeof(fx) != TYPE_DICTIONARY:
		fail("rng fixture missing")
		return
	var statics: Array = fx["statics"]
	eq(statics.size(), 11, "eleven static cases in the fixture")
	for st in statics:
		var args: Array = st["args"]
		var label: String = "%s %s" % [st["fn"], str(args)]
		var got: Variant = null
		match st["fn"]:
			"roundTo":
				got = CoreRng.round_to(float(args[0]), float(args[1]))
			"clamp":
				got = CoreRng.clamp_value(float(args[0]), float(args[1]), float(args[2]))
			"seed":
				var s: Dictionary = {"rng": 0}
				CoreRng.seed_rng(s, int(args[0]))
				got = s["rng"]
			_:
				fail("unknown static fn " + str(st["fn"]))
				continue
		_same_value(got, st["out"], label)


func test_known_values() -> void:
	var s: Dictionary = _seeded(12345)
	near(CoreRng.rand(s), 0.9797282677609473, 1e-12, "seed 12345 first rand")
	near(CoreRng.rand(s), 0.3067522644996643, 1e-12, "seed 12345 second rand")
	near(CoreRng.rand(s), 0.484205421525985, 1e-12, "seed 12345 third rand")
	var s1: Dictionary = _seeded(1)
	eq(int(round(CoreRng.rand(s1) * 4294967296.0)), 2693262067, "seed 1 first raw draw")
	eq(int(round(CoreRng.rand(s1) * 4294967296.0)), 11749833, "seed 1 second raw draw")


func test_edge_cases() -> void:
	var s: Dictionary = _seeded(11)
	var before: int = s["rng"]
	eq(CoreRng.pick(s, []), null, "pick of an empty array is null")
	eq(s["rng"], before, "pick of an empty array draws nothing")
	eq(CoreRng.weighted(_seeded(5), [{"w": 0}]), {}, "weighted with no weight is {}")
	var only_last: Array = [{"w": 0, "id": "a"}, {"w": 0, "id": "b"}, {"w": 4, "id": "c"}]
	var s_last: Dictionary = _seeded(77)
	for i in range(200):
		eq(CoreRng.weighted(s_last, only_last)["id"], "c", "only the last item carries weight, draw %d" % i)
	var a: Dictionary = _seeded(12345)
	var b: Dictionary = _seeded(12345)
	var c: Dictionary = _seeded(54321)
	var seq_a: Array = []
	var seq_b: Array = []
	var seq_c: Array = []
	for i in range(20):
		seq_a.append(CoreRng.rand(a))
		seq_b.append(CoreRng.rand(b))
		seq_c.append(CoreRng.rand(c))
	eq(seq_a, seq_b, "same seed gives the same 20 numbers")
	ok(seq_a != seq_c, "different seeds give different numbers")
	var s_range: Dictionary = _seeded(999)
	for i in range(10000):
		var r: float = CoreRng.rand(s_range)
		ok(r >= 0.0 and r < 1.0, "rand in [0, 1) on draw %d, got %s" % [i, str(r)])
