// Tests for the car profile outline data, run under `jsc -m`.

import { PROFILES, PROFILE_KEYS, profileOf } from '../src/art/profiles.js';
import { test, eq, ok, throws, done } from './harness.js';

const KEYS = ['beetle', 'boxy', 'coupe', 'gullwing', 'hatch', 'limo', 'longnose', 'micro', 'roadster', 'saloon', 'tourer', 'trike', 'wedge'];
const KINDS = ['body', 'glass', 'dark', 'chrome', 'line'];

function isNum(x) {
	return typeof x === 'number' && isFinite(x);
}

test('PROFILES has exactly the 13 archetype keys', () => {
	eq(PROFILE_KEYS.slice().sort(), KEYS, 'sorted keys match');
	eq(PROFILE_KEYS.length, 13, '13 profiles');
});

test('every profile has the required top-level keys', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const p = PROFILES[PROFILE_KEYS[i]];
		for (const k of ['lengthPx', 'wheels', 'head', 'tail', 'parts']) {
			ok(Object.prototype.hasOwnProperty.call(p, k), PROFILE_KEYS[i] + ' has ' + k);
		}
		eq(typeof p.lengthPx, 'number', PROFILE_KEYS[i] + ' lengthPx is a number');
	}
});

test('lengthPx is between 280 and 500', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		ok(PROFILES[k].lengthPx >= 280 && PROFILES[k].lengthPx <= 500, k + ' lengthPx in range');
	}
});

test('wheels: at least 2, r in 6..12, x in -50..50', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const ws = PROFILES[k].wheels;
		ok(Array.isArray(ws) && ws.length >= 2, k + ' has at least 2 wheels');
		for (let j = 0; j < ws.length; j++) {
			ok(isNum(ws[j].x) && ws[j].x >= -50 && ws[j].x <= 50, k + ' wheel ' + j + ' x in range');
			ok(isNum(ws[j].r) && ws[j].r >= 6 && ws[j].r <= 12, k + ' wheel ' + j + ' r in range');
		}
	}
});

test('head and tail exist with numeric fields', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const h = PROFILES[k].head;
		const t = PROFILES[k].tail;
		for (const f of ['x', 'y', 'r']) {
			ok(isNum(h[f]), k + ' head.' + f + ' is a number');
		}
		for (const f of ['x', 'y', 'w', 'h']) {
			ok(isNum(t[f]), k + ' tail.' + f + ' is a number');
		}
	}
});

test('part kinds are body, glass, dark, chrome or line', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const parts = PROFILES[k].parts;
		ok(Array.isArray(parts) && parts.length >= 2, k + ' has parts');
		for (let j = 0; j < parts.length; j++) {
			ok(KINDS.indexOf(parts[j].k) !== -1, k + ' part ' + j + ' kind valid');
		}
	}
});

test('non-line parts have at least 4 points, line parts exactly 2', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const parts = PROFILES[k].parts;
		for (let j = 0; j < parts.length; j++) {
			const n = parts[j].pts.length;
			if (parts[j].k === 'line') {
				eq(n, 2, k + ' part ' + j + ' line has 2 points');
			} else {
				ok(n >= 4, k + ' part ' + j + ' (' + parts[j].k + ') has at least 4 points');
			}
		}
	}
});

test('all point x within -51..51 and y within 0..46', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const parts = PROFILES[k].parts;
		for (let j = 0; j < parts.length; j++) {
			const pts = parts[j].pts;
			for (let m = 0; m < pts.length; m++) {
				ok(Array.isArray(pts[m]) && pts[m].length === 2, k + ' part ' + j + ' point ' + m + ' is a pair');
				ok(isNum(pts[m][0]) && pts[m][0] >= -51 && pts[m][0] <= 51, k + ' part ' + j + ' point ' + m + ' x in range');
				ok(isNum(pts[m][1]) && pts[m][1] >= 0 && pts[m][1] <= 46, k + ' part ' + j + ' point ' + m + ' y in range');
			}
		}
	}
});

test('every profile has at least one body part and one glass part', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const parts = PROFILES[k].parts;
		let body = 0;
		let glass = 0;
		for (let j = 0; j < parts.length; j++) {
			if (parts[j].k === 'body') { body += 1; }
			if (parts[j].k === 'glass') { glass += 1; }
		}
		ok(body >= 1, k + ' has a body part');
		ok(glass >= 1, k + ' has a glass part');
	}
});

test('trike has exactly 3 wheels with one dim wheel (the middle one), others exactly 2', () => {
	for (let i = 0; i < PROFILE_KEYS.length; i++) {
		const k = PROFILE_KEYS[i];
		const ws = PROFILES[k].wheels;
		if (k === 'trike') {
			eq(ws.length, 3, 'trike has 3 wheels');
			// The verbatim spec data marks the middle wheel (index 1) dim,
			// not the third: [{x:-26},{x:-20,dim:true},{x:38}].
			eq(ws[1].dim, true, 'trike middle wheel is dim');
			ok(!ws[0].dim && !ws[2].dim, 'trike other wheels are not dim');
		} else {
			eq(ws.length, 2, k + ' has exactly 2 wheels');
		}
	}
});

test('profileOf returns profiles and throws on unknown archetypes', () => {
	eq(profileOf('micro').lengthPx, 300, 'profileOf micro lengthPx');
	eq(profileOf('trike'), PROFILES.trike, 'profileOf returns the profile object');
	throws(function () { profileOf('x'); }, 'unknown archetype throws');
	throws(function () { profileOf(''); }, 'empty archetype throws');
	throws(function () { profileOf('constructor'); }, 'prototype key does not resolve');
	throws(function () { profileOf('toString'); }, 'inherited key does not resolve');
	throws(function () { profileOf(undefined); }, 'undefined archetype throws');
	throws(function () { profileOf(null); }, 'null archetype throws');
	throws(function () { profileOf(13); }, 'numeric archetype throws');
});

test('spot check: saloon body part has 10 points', () => {
	eq(PROFILES.saloon.parts[0].pts.length, 10, 'saloon parts[0] pts length');
});

done();
