// Golden fixture pattern: each tools/godot/golden_<name>.mjs runs the JS reference under jsc -m and calls emit() once.
// golden.sh stores that single JSON line as godot/tests/golden/<name>.json.
// A Godot test loads it with GoldenUtil.fixture() and compares the port with GoldenUtil.same() (ints equal, floats within 1e-9).
// SEEDS are the rng seeds that sim fixtures should cover.

export const SEEDS = [0, 1, 42, 12345, 987654321, 4294967295];

export function emit(obj) {
	print(JSON.stringify(obj));
}
