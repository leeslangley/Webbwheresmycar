// Tests for the carworld_b headline pool, run under `jsc -m`.

import { HEADLINES_CARWORLD_B } from '../src/data/headlines_carworld_b.js';
import { test, eq, ok, done } from './harness.js';

test('HEADLINES_CARWORLD_B is an array of exactly 30 strings', () => {
	ok(Array.isArray(HEADLINES_CARWORLD_B), 'HEADLINES_CARWORLD_B is an array');
	eq(HEADLINES_CARWORLD_B.length, 30, 'exactly 30 headlines');
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		eq(typeof HEADLINES_CARWORLD_B[i], 'string', 'headline ' + i + ' is a string');
	}
});

test('all headlines are unique, case-insensitively', () => {
	const seen = {};
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		const key = HEADLINES_CARWORLD_B[i].toLowerCase();
		ok(!Object.prototype.hasOwnProperty.call(seen, key),
			'headline ' + i + ' is unique: "' + HEADLINES_CARWORLD_B[i] + '"');
		seen[key] = true;
	}
});

test('every headline is 20-110 characters', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		const len = HEADLINES_CARWORLD_B[i].length;
		ok(len >= 20 && len <= 110,
			'headline ' + i + ' length ' + len + ' in [20,110]: "' + HEADLINES_CARWORLD_B[i] + '"');
	}
});

test('no headline contains { or }', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		ok(HEADLINES_CARWORLD_B[i].indexOf('{') === -1 && HEADLINES_CARWORLD_B[i].indexOf('}') === -1,
			'headline ' + i + ' has no braces: "' + HEADLINES_CARWORLD_B[i] + '"');
	}
});

test('no headline is purely upper case', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		ok(HEADLINES_CARWORLD_B[i] !== HEADLINES_CARWORLD_B[i].toUpperCase(),
			'headline ' + i + ' is not all caps: "' + HEADLINES_CARWORLD_B[i] + '"');
	}
});

test('no headline ends with a space', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		ok(HEADLINES_CARWORLD_B[i].slice(-1) !== ' ',
			'headline ' + i + ' does not end with a space');
	}
});

test('every headline is printable ASCII only', () => {
	const ascii = /^[\x20-\x7e]+$/;
	for (let i = 0; i < HEADLINES_CARWORLD_B.length; i++) {
		ok(ascii.test(HEADLINES_CARWORLD_B[i]),
			'headline ' + i + ' is printable ASCII: "' + HEADLINES_CARWORLD_B[i] + '"');
	}
});

done();
