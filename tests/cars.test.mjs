// Tests for the car catalogue aggregator and paint colours, run under `jsc -m`.

import { CARS, CAR_BY_ID, ARCHETYPES, modelOf } from '../src/data/cars.js';
import { PAINT, paintOf } from '../src/data/paint.js';
import { test, eq, ok, done } from './harness.js';

test('CARS has exactly 31 cars (10 + 10 + 11)', () => {
	ok(Array.isArray(CARS), 'CARS is an array');
	eq(CARS.length, 31, 'length');
});

test('car ids are unique', () => {
	const seen = {};
	for (let i = 0; i < CARS.length; i++) {
		ok(!seen[CARS[i].id], 'id ' + CARS[i].id + ' is unique');
		seen[CARS[i].id] = true;
	}
});

test('tiers split exactly 10 / 10 / 11', () => {
	const counts = { 1: 0, 2: 0, 3: 0 };
	for (let i = 0; i < CARS.length; i++) {
		ok(counts[CARS[i].tier] !== undefined, 'car ' + CARS[i].id + ' has a valid tier');
		counts[CARS[i].tier] += 1;
	}
	eq(counts[1], 10, 'tier 1 count');
	eq(counts[2], 10, 'tier 2 count');
	eq(counts[3], 11, 'tier 3 count');
});

test('CAR_BY_ID keys match the catalogue ids and values are the models', () => {
	eq(Object.keys(CAR_BY_ID).length, 31, 'CAR_BY_ID has 31 keys');
	for (let i = 0; i < CARS.length; i++) {
		eq(CAR_BY_ID[CARS[i].id], CARS[i], 'CAR_BY_ID[' + CARS[i].id + '] is the model');
	}
});

test('CAR_BY_ID t3_aston basePrice is 320000', () => {
	eq(CAR_BY_ID['t3_aston'].basePrice, 320000, 't3_aston basePrice');
});

test('modelOf returns the model object', () => {
	eq(modelOf('t1_allergy').name, 'Austen Allergy', 't1_allergy name');
	eq(modelOf('t1_allergy'), CAR_BY_ID['t1_allergy'], 'modelOf returns the model');
});

test('modelOf throws on an unknown id', () => {
	let msg = '';
	try {
		modelOf('nope');
	} catch (e) {
		msg = e.message;
	}
	ok(msg.indexOf('unknown model nope') !== -1, 'modelOf(nope) throws with the id in the message');
});

test('every archetype is used by at least one car', () => {
	const used = {};
	for (let i = 0; i < CARS.length; i++) {
		used[CARS[i].archetype] = true;
	}
	for (let i = 0; i < ARCHETYPES.length; i++) {
		ok(used[ARCHETYPES[i]], 'archetype ' + ARCHETYPES[i] + ' is used');
	}
});

test('no car uses an archetype outside the list', () => {
	for (let i = 0; i < CARS.length; i++) {
		ok(ARCHETYPES.indexOf(CARS[i].archetype) !== -1, 'car ' + CARS[i].id + ' archetype is in ARCHETYPES');
	}
});

test('PAINT has exactly the same 31 keys as the catalogue', () => {
	const paintKeys = Object.keys(PAINT);
	eq(paintKeys.length, 31, 'PAINT has 31 entries');
	for (let i = 0; i < CARS.length; i++) {
		ok(Object.prototype.hasOwnProperty.call(PAINT, CARS[i].id), 'PAINT has key ' + CARS[i].id);
	}
	for (let i = 0; i < paintKeys.length; i++) {
		ok(CAR_BY_ID[paintKeys[i]] !== undefined, 'PAINT key ' + paintKeys[i] + ' is a car id');
	}
});

test('every paint value is a #RRGGBB hex colour', () => {
	const keys = Object.keys(PAINT);
	for (let i = 0; i < keys.length; i++) {
		ok(/^#[0-9A-Fa-f]{6}$/.test(PAINT[keys[i]]), 'PAINT[' + keys[i] + '] matches #RRGGBB');
	}
});

test('at least 12 distinct paint colours', () => {
	const distinct = {};
	const keys = Object.keys(PAINT);
	for (let i = 0; i < keys.length; i++) {
		distinct[PAINT[keys[i]]] = true;
	}
	ok(Object.keys(distinct).length >= 12, 'at least 12 distinct colours, got ' + Object.keys(distinct).length);
});

test('paintOf returns the colour, and #888888 for unknown ids', () => {
	eq(paintOf('t3_aston'), PAINT['t3_aston'], 'paintOf returns the colour');
	eq(paintOf('zzz'), '#888888', 'paintOf(zzz) is #888888');
});

done();
