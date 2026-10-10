// Tests for src/core/rng.js, run under `jsc -m`.

import { test, eq, ok, near, throws, done } from './harness.js';
import {
	seedRng,
	rand,
	randInt,
	chance,
	pick,
	weighted,
	roundTo,
	clamp,
} from '../src/core/rng.js';

function state(seed) {
	const s = { rng: 0 };
	seedRng(s, seed);
	return s;
}

test('seed 12345: first three rand values match the reference outputs', () => {
	const s = state(12345);
	near(rand(s), 0.9797282677609473, 1e-12, 'first rand');
	near(rand(s), 0.3067522644996643, 1e-12, 'second rand');
	near(rand(s), 0.484205421525985, 1e-12, 'third rand');
});

test('seed 1: first two raw step outputs match', () => {
	const s = state(1);
	eq(Math.round(rand(s) * 4294967296), 2693262067, 'first raw draw');
	eq(Math.round(rand(s) * 4294967296), 11749833, 'second raw draw');
});

test('same seed gives the same 20 numbers, different seeds differ', () => {
	const a = state(12345);
	const b = state(12345);
	const c = state(54321);
	const seqA = [];
	const seqB = [];
	const seqC = [];
	for (let i = 0; i < 20; i++) {
		seqA.push(rand(a));
		seqB.push(rand(b));
		seqC.push(rand(c));
	}
	eq(seqA, seqB, 'same seed, same sequence');
	let differed = false;
	for (let i = 0; i < 20; i++) {
		if (seqA[i] !== seqC[i]) {
			differed = true;
		}
	}
	ok(differed, 'different seeds, different sequence');
});

test('seedRng accepts seed 0 and arbitrary numbers as uint32', () => {
	const s = state(0);
	eq(s.rng, 0, 'seed 0 stored as 0');
	const r0 = rand(s);
	ok(r0 >= 0 && r0 < 1, 'seed 0 produces a value in [0,1): ' + r0);
	const s2 = state(-7);
	eq(s2.rng, 4294967289, 'negative seed becomes uint32');
	const s3 = state(1.5);
	eq(s3.rng, 1, 'fractional seed becomes uint32');
});

test('10000 draws of rand are all in [0,1)', () => {
	const s = state(999);
	for (let i = 0; i < 10000; i++) {
		const r = rand(s);
		ok(r >= 0 && r < 1, 'rand in [0,1) draw ' + i + ' got ' + r);
	}
});

test('randInt(3,5) over 1000 draws only returns 3, 4 or 5, each at least once', () => {
	const s = state(42);
	const seen = { 3: 0, 4: 0, 5: 0 };
	for (let i = 0; i < 1000; i++) {
		const v = randInt(s, 3, 5);
		ok(seen[v] !== undefined, 'randInt returned ' + v + ', out of range');
		seen[v] += 1;
	}
	ok(seen[3] > 0 && seen[4] > 0 && seen[5] > 0, 'each value returned at least once: ' + JSON.stringify(seen));
});

test('randInt endpoints are inclusive and single-value ranges work', () => {
	const s = state(4);
	for (let i = 0; i < 100; i++) {
		eq(randInt(s, 7, 7), 7, 'single-value range');
	}
	const s2 = state(4);
	const lows = [];
	const highs = [];
	for (let i = 0; i < 500; i++) {
		const v = randInt(s2, 2, 4);
		lows.push(v === 2);
		highs.push(v === 4);
	}
	ok(lows.some(x => x), 'lo endpoint hit');
	ok(highs.some(x => x), 'hi endpoint hit');
});

test('chance(state,0) always false, chance(state,1) always true', () => {
	const s = state(77);
	for (let i = 0; i < 200; i++) {
		eq(chance(s, 0), false, 'chance 0 is false');
		eq(chance(s, 1), true, 'chance 1 is true');
	}
});

test('pick throws on an empty array, otherwise returns members only', () => {
	const s = state(11);
	throws(() => pick(s, []), 'empty array throws');
	const members = ['a', 'b', 'c'];
	for (let i = 0; i < 100; i++) {
		const v = pick(s, members);
		ok(members.indexOf(v) !== -1, 'picked non-member: ' + v);
	}
});

test('weighted: 1 vs 3 over 4000 draws gives b between 2800 and 3200', () => {
	const s = state(2024);
	const items = [{ w: 1, id: 'a' }, { w: 3, id: 'b' }];
	let b = 0;
	for (let i = 0; i < 4000; i++) {
		const item = weighted(s, items);
		if (item.id === 'b') {
			b += 1;
		}
	}
	ok(b >= 2800 && b <= 3200, 'b count ' + b + ' outside 2800..3200');
});

test('weighted: w:0 items are never picked', () => {
	const s = state(31);
	const items = [{ w: 0, id: 'never' }, { w: 2, id: 'yes' }];
	for (let i = 0; i < 500; i++) {
		const item = weighted(s, items);
		eq(item.id, 'yes', 'zero-weight item never picked');
	}
});

test('weighted throws when all weights are 0', () => {
	const s = state(3);
	throws(() => weighted(s, [{ w: 0, id: 'a' }, { w: 0, id: 'b' }]), 'all-zero weights throw');
	throws(() => weighted(s, []), 'empty items throw');
});

test('roundTo matches the spec values exactly', () => {
	eq(roundTo(2.34, 0.1), 2.3, 'roundTo(2.34,0.1)');
	eq(roundTo(1234, 10), 1230, 'roundTo(1234,10)');
	eq(roundTo(1235, 10), 1240, 'roundTo(1235,10)');
});

test('clamp pins to lo and hi, passes middles through', () => {
	eq(clamp(5, 0, 3), 3, 'clamp high');
	eq(clamp(-1, 0, 3), 0, 'clamp low');
	eq(clamp(2, 0, 3), 2, 'clamp middle');
});

done();
