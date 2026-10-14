// Golden fixture for godot/core/rng.gd (GDF05): runs src/core/rng.js under macOS jsc -m.
// Run by: sh tools/godot/golden.sh rng   (writes godot/tests/golden/rng.json)

import { emit, SEEDS } from './golden_common.mjs';
import { seedRng, rand, randInt, chance, pick, weighted, roundTo, clamp } from '../../src/core/rng.js';

const POOL = ['a', 'b', 'c', 'd'];
const WEIGHTS = [{ w: 1, id: 'x' }, { w: 3, id: 'y' }, { w: 0, id: 'z' }, { w: 6, id: 'w' }];

const OPS = [];
function addOps(op, args, n) {
	for (let i = 0; i < n; i++) {
		OPS.push({ op, args });
	}
}
addOps('rand', [], 5);
addOps('randInt', [1, 6], 5);
addOps('randInt', [-3, 3], 5);
addOps('randInt', [7, 7], 2);
addOps('chance', [0.3], 5);
addOps('pick', [], 5);
addOps('weighted', [], 8);
addOps('roundTo', [0.5], 3);
addOps('roundTo', [0.01], 3);

function run(s) {
	const out = [];
	for (const { op, args } of OPS) {
		if (op === 'rand') {
			out.push(rand(s));
		} else if (op === 'randInt') {
			out.push(randInt(s, args[0], args[1]));
		} else if (op === 'chance') {
			out.push(chance(s, args[0]));
		} else if (op === 'pick') {
			out.push(pick(s, POOL));
		} else if (op === 'weighted') {
			out.push(weighted(s, WEIGHTS).id);
		} else if (op === 'roundTo') {
			out.push(roundTo(rand(s) * 100, args[0]));
		} else {
			throw new Error('unknown op ' + op);
		}
	}
	return out;
}

const cases = [];
for (const seed of SEEDS) {
	const s = { rng: 0 };
	seedRng(s, seed);
	const out = run(s);
	cases.push({ seed, out, final: s.rng });
}

const statics = [];
function addStatic(fn, args, out) {
	statics.push({ fn, args, out });
}
addStatic('roundTo', [1.2345, 0.01], roundTo(1.2345, 0.01));
addStatic('roundTo', [2.5, 1], roundTo(2.5, 1));
addStatic('roundTo', [-2.5, 1], roundTo(-2.5, 1));
addStatic('roundTo', [0.125, 0.25], roundTo(0.125, 0.25));
addStatic('roundTo', [7, 5], roundTo(7, 5));
addStatic('clamp', [5, 0, 3], clamp(5, 0, 3));
addStatic('clamp', [-1, 0, 3], clamp(-1, 0, 3));
addStatic('clamp', [2, 0, 3], clamp(2, 0, 3));
for (const arg of [-1, 3.7, 4294967296]) {
	const s = { rng: 0 };
	seedRng(s, arg);
	addStatic('seed', [arg], s.rng);
}

emit({ ops: OPS, cases, statics });
