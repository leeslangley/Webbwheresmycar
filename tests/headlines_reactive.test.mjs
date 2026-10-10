// Tests for the reactive headline templates, run under `jsc -m`.

import { REACTIVE } from '../src/data/headlines_reactive.js';
import { test, eq, ok, done } from './harness.js';

const KEYS = ['broke', 'rich', 'breakdown', 'bigwin', 'viral',
	'fullgarage', 'emptygarage', 'monthend', 'auctionday'];

const all = [];
for (let k = 0; k < KEYS.length; k++) {
	for (let i = 0; i < REACTIVE[KEYS[k]].length; i++) all.push(REACTIVE[KEYS[k]][i]);
}

test('REACTIVE has exactly the required keys', () => {
	ok(typeof REACTIVE === 'object' && REACTIVE !== null, 'REACTIVE is an object');
	eq(Object.keys(REACTIVE).length, KEYS.length, 'exactly 9 keys');
	for (let k = 0; k < KEYS.length; k++) {
		ok(Object.prototype.hasOwnProperty.call(REACTIVE, KEYS[k]),
			'key "' + KEYS[k] + '" present');
	}
});

test('every situation has 5 string headlines', () => {
	for (let k = 0; k < KEYS.length; k++) {
		const arr = REACTIVE[KEYS[k]];
		ok(Array.isArray(arr), 'REACTIVE.' + KEYS[k] + ' is an array');
		eq(arr.length, 5, 'REACTIVE.' + KEYS[k] + ' has 5 headlines');
		for (let i = 0; i < arr.length; i++) {
			eq(typeof arr[i], 'string', KEYS[k] + '[' + i + '] is a string');
		}
	}
});

test('every headline is 20-110 characters', () => {
	for (let k = 0; k < KEYS.length; k++) {
		for (let i = 0; i < REACTIVE[KEYS[k]].length; i++) {
			const h = REACTIVE[KEYS[k]][i];
			ok(h.length >= 20 && h.length <= 110,
				KEYS[k] + '[' + i + '] length ' + h.length + ' in [20,110]: "' + h + '"');
		}
	}
});

test('headlines are unique within each situation and across all situations', () => {
	const seen = {};
	for (let k = 0; k < KEYS.length; k++) {
		const within = {};
		for (let i = 0; i < REACTIVE[KEYS[k]].length; i++) {
			const key = REACTIVE[KEYS[k]][i].toLowerCase();
			ok(!Object.prototype.hasOwnProperty.call(within, key),
				KEYS[k] + '[' + i + '] unique within situation');
			ok(!Object.prototype.hasOwnProperty.call(seen, key),
				KEYS[k] + '[' + i + '] unique across pool: "' + key + '"');
			within[key] = true;
			seen[key] = true;
		}
	}
});

test('only {car}, {customer}, {cash} placeholders are used', () => {
	const allowed = { '{car}': true, '{customer}': true, '{cash}': true };
	for (let i = 0; i < all.length; i++) {
		const tokens = all[i].match(/\{[^{}]*\}/g) || [];
		for (let t = 0; t < tokens.length; t++) {
			ok(Object.prototype.hasOwnProperty.call(allowed, tokens[t]),
				'headline ' + i + ' token ' + tokens[t] + ' is allowed');
		}
	}
});

test('breakdown headlines each contain {car}', () => {
	for (let i = 0; i < REACTIVE.breakdown.length; i++) {
		ok(REACTIVE.breakdown[i].indexOf('{car}') !== -1,
			'breakdown[' + i + '] contains {car}');
	}
});

test('bigwin headlines each contain {customer}', () => {
	for (let i = 0; i < REACTIVE.bigwin.length; i++) {
		ok(REACTIVE.bigwin[i].indexOf('{customer}') !== -1,
			'bigwin[' + i + '] contains {customer}');
	}
});

test('broke and rich headlines each contain {cash}', () => {
	for (let i = 0; i < REACTIVE.broke.length; i++) {
		ok(REACTIVE.broke[i].indexOf('{cash}') !== -1,
			'broke[' + i + '] contains {cash}');
	}
	for (let i = 0; i < REACTIVE.rich.length; i++) {
		ok(REACTIVE.rich[i].indexOf('{cash}') !== -1,
			'rich[' + i + '] contains {cash}');
	}
});

test('every headline is printable ASCII with no fancy punctuation', () => {
	const ascii = /^[\x20-\x7e]+$/;
	for (let i = 0; i < all.length; i++) {
		ok(ascii.test(all[i]),
			'headline ' + i + ' is printable ASCII: "' + all[i] + '"');
	}
});

test('headlines are 6-14 words each', () => {
	for (let i = 0; i < all.length; i++) {
		const words = all[i].split(/\s+/).filter(function (w) { return w.length > 0; }).length;
		ok(words >= 6 && words <= 14,
			'headline ' + i + ' has ' + words + ' words in [6,14]: "' + all[i] + '"');
	}
});

done();
