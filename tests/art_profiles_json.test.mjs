// Tests for the exported car profiles JSON (tools/art/profiles.json),
// which feeds the Blender pipeline (docs/ART_BIBLE.md). Run under `jsc -m`
// from the repo root (where `make test` runs): `read()` paths are relative
// to the repo root.

import { PROFILES, PROFILE_KEYS } from '../src/art/profiles.js';
import { test, eq, ok, done } from './harness.js';

// jsc global: read a file relative to the current working directory.
const RAW = read('tools/art/profiles.json');
const PARSED = JSON.parse(RAW);

// JSON.stringify with every object's keys sorted, so two structures that
// differ only in key order compare equal.
function stable(v) {
	if (Array.isArray(v)) {
		return '[' + v.map(stable).join(',') + ']';
	}
	if (v !== null && typeof v === 'object') {
		const keys = Object.keys(v).sort();
		return '{' + keys.map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
	}
	return JSON.stringify(v);
}

test('profiles.json parses and deep-equals the imported PROFILES', () => {
	eq(stable(PARSED), stable(PROFILES), 'sorted-key JSON of file matches PROFILES');
});

test('profiles.json has the same sorted archetype keys as PROFILES', () => {
	eq(Object.keys(PARSED).sort(), PROFILE_KEYS.slice().sort(), 'sorted keys match');
});

test('profiles.json has exactly 13 archetypes', () => {
	eq(Object.keys(PARSED).length, 13, '13 archetypes');
});

test('trike has 3 wheels in profiles.json', () => {
	ok(Object.prototype.hasOwnProperty.call(PARSED, 'trike'), 'trike exists');
	eq(PARSED.trike.wheels.length, 3, 'trike wheel count');
});

test('every archetype keeps lengthPx and at least one body and glass part', () => {
	const keys = Object.keys(PARSED);
	for (let i = 0; i < keys.length; i++) {
		const p = PARSED[keys[i]];
		eq(typeof p.lengthPx, 'number', keys[i] + ' lengthPx is a number');
		let body = 0;
		let glass = 0;
		for (let j = 0; j < p.parts.length; j++) {
			if (p.parts[j].k === 'body') { body += 1; }
			if (p.parts[j].k === 'glass') { glass += 1; }
		}
		ok(body >= 1, keys[i] + ' has a body part');
		ok(glass >= 1, keys[i] + ' has a glass part');
	}
});

done();
