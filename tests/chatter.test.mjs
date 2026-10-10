// Tests for the chatter table, run under `jsc -m`.

import { CHATTER, chatterFor } from '../src/data/chatter.js';
import { test, eq, ok, done } from './harness.js';

const COUNTS = {
	idle: 20,
	broke: 6,
	rich: 6,
	newmonth: 6,
	auctionday: 6,
	breakdown: 6,
	fullgarage: 4,
	emptygarage: 4
};

test('CHATTER has exactly the expected keys', () => {
	const keys = Object.keys(CHATTER).sort();
	eq(keys.join(','), Object.keys(COUNTS).sort().join(','), 'key list');
});

test('each situation has its exact line count', () => {
	for (const key in COUNTS) {
		ok(Array.isArray(CHATTER[key]), key + ' is an array');
		eq(CHATTER[key].length, COUNTS[key], key + ' count');
	}
});

test('every line is a 15-70 character string', () => {
	for (const key in CHATTER) {
		for (let i = 0; i < CHATTER[key].length; i++) {
			const line = CHATTER[key][i];
			ok(typeof line === 'string', key + '[' + i + '] is a string');
			ok(line.length >= 15 && line.length <= 70,
				'length 15-70 for ' + key + '[' + i + ']: ' + line.length);
		}
	}
});

test('all lines are unique across the whole object', () => {
	const seen = {};
	for (const key in CHATTER) {
		for (let i = 0; i < CHATTER[key].length; i++) {
			ok(!seen[CHATTER[key][i]], 'line is unique: ' + CHATTER[key][i]);
			seen[CHATTER[key][i]] = true;
		}
	}
});

test("chatterFor with sit 'broke' returns a broke line", () => {
	const state = { rng: 5 };
	const line = chatterFor(state, 'broke');
	ok(CHATTER.broke.indexOf(line) !== -1, 'line is in CHATTER.broke');
});

test("chatterFor with sit 'idle' returns an idle line", () => {
	const state = { rng: 5 };
	const line = chatterFor(state, 'idle');
	ok(CHATTER.idle.indexOf(line) !== -1, 'line is in CHATTER.idle');
});

test("chatterFor with an unknown sit returns an idle line", () => {
	const state = { rng: 5 };
	const line = chatterFor(state, 'whatever');
	ok(CHATTER.idle.indexOf(line) !== -1, 'line is in CHATTER.idle');
});

test('chatterFor with a missing sit returns an idle line', () => {
	const state = { rng: 5 };
	const line = chatterFor(state, undefined);
	ok(CHATTER.idle.indexOf(line) !== -1, 'line is in CHATTER.idle');
});

test('the same seed gives the same line twice', () => {
	const state = { rng: 5 };
	const first = chatterFor(state, 'broke');
	const second = chatterFor({ rng: 5 }, 'broke');
	eq(first, second, 'same seed, same line');
});

done();
