// Tests for src/data/jobs_d.js, run under `jsc -m`.

import { JOBS_D } from '../src/data/jobs_d.js';
import { test, eq, ok, done } from './harness.js';

// DESIGN.md 8.2 rows for set D, exactly as the card table specifies.
const EXPECTED = [
	{ id: 'proposal', name: 'Marriage proposal', feeMin: 350, feeMax: 900, minD: 6, minR: 5, minCond: 6, wearMin: 0.1, wearMax: 0.3 },
	{ id: 'vicar', name: "Vicar's blessing tour", feeMin: 250, feeMax: 600, minD: 3, minR: 4, minCond: 4, wearMin: 0.1, wearMax: 0.3 },
	{ id: 'panto', name: 'Amateur panto', feeMin: 300, feeMax: 700, minD: 4, minR: 3, minCond: 3, wearMin: 0.5, wearMax: 1.5 },
	{ id: 'chef', name: 'Celebrity chef taxi', feeMin: 700, feeMax: 1800, minD: 7, minR: 6, minCond: 6, wearMin: 0.2, wearMax: 0.6 }
];

function collectStrings() {
	const out = [];
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		out.push(j.id, j.name);
		for (let k = 0; k < j.blurbs.length; k++) out.push(j.blurbs[k]);
		for (let k = 0; k < j.success.length; k++) out.push(j.success[k]);
		for (let k = 0; k < j.mishap.length; k++) out.push(j.mishap[k]);
		for (let k = 0; k < j.disaster.length; k++) out.push(j.disaster[k]);
	}
	return out;
}

test('JOBS_D has exactly 4 jobs with ids in the required order', () => {
	ok(Array.isArray(JOBS_D), 'JOBS_D is an array');
	eq(JOBS_D.length, 4, 'JOBS_D length');
	const ids = JOBS_D.map(function (j) { return j.id; });
	eq(ids, ['proposal', 'vicar', 'panto', 'chef'], 'ids in order');
});

test('every job has exactly the card object shape', () => {
	const keys = ['id', 'name', 'feeMin', 'feeMax', 'minD', 'minR', 'minCond', 'wearMin', 'wearMax', 'blurbs', 'success', 'mishap', 'disaster'];
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		eq(Object.keys(j).sort(), keys.slice().sort(), 'job ' + j.id + ' has exactly the card keys');
		eq(typeof j.name, 'string', 'job ' + j.id + ' name is a string');
	}
});

test('numeric fields match the design table exactly for every job', () => {
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		const e = EXPECTED[i];
		eq(j.name, e.name, 'job ' + e.id + ' name');
		eq(j.feeMin, e.feeMin, 'job ' + e.id + ' feeMin');
		eq(j.feeMax, e.feeMax, 'job ' + e.id + ' feeMax');
		eq(j.minD, e.minD, 'job ' + e.id + ' minD');
		eq(j.minR, e.minR, 'job ' + e.id + ' minR');
		eq(j.minCond, e.minCond, 'job ' + e.id + ' minCond');
		eq(j.wearMin, e.wearMin, 'job ' + e.id + ' wearMin');
		eq(j.wearMax, e.wearMax, 'job ' + e.id + ' wearMax');
	}
});

test('each job has 3 blurbs and every blurb contains {customer}', () => {
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		eq(j.blurbs.length, 3, 'job ' + j.id + ' blurbs length');
		for (let k = 0; k < j.blurbs.length; k++) {
			ok(j.blurbs[k].indexOf('{customer}') !== -1, 'job ' + j.id + ' blurb ' + k + ' contains {customer}');
		}
	}
});

test('each job has 3 success, 3 mishap and 2 disaster sentences', () => {
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		eq(j.success.length, 3, 'job ' + j.id + ' success length');
		eq(j.mishap.length, 3, 'job ' + j.id + ' mishap length');
		eq(j.disaster.length, 2, 'job ' + j.id + ' disaster length');
	}
});

test('every outcome sentence contains {customer} or {car}', () => {
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		const groups = [j.success, j.mishap, j.disaster];
		for (let g = 0; g < groups.length; g++) {
			for (let k = 0; k < groups[g].length; k++) {
				ok(groups[g][k].indexOf('{customer}') !== -1 || groups[g][k].indexOf('{car}') !== -1,
					'job ' + j.id + ' outcome ' + g + '.' + k + ' contains {customer} or {car}');
			}
		}
	}
});

test('no string contains any placeholder other than {customer} or {car}', () => {
	const re = /\{(\w+)\}/g;
	const texts = collectStrings();
	for (let i = 0; i < texts.length; i++) {
		let m;
		re.lastIndex = 0;
		while ((m = re.exec(texts[i])) !== null) {
			ok(m[1] === 'customer' || m[1] === 'car',
				'string ' + i + ' has placeholder {' + m[1] + '}: ' + texts[i]);
		}
	}
});

test('all strings in the file are unique', () => {
	const texts = collectStrings();
	for (let i = 0; i < texts.length; i++) {
		for (let j = i + 1; j < texts.length; j++) {
			ok(texts[i] !== texts[j], 'strings ' + i + ' and ' + j + ' are identical: ' + texts[i]);
		}
	}
});

test('outcome sentences are 8-30 words long', () => {
	for (let i = 0; i < JOBS_D.length; i++) {
		const j = JOBS_D[i];
		const groups = [j.success, j.mishap, j.disaster];
		for (let g = 0; g < groups.length; g++) {
			for (let k = 0; k < groups[g].length; k++) {
				const words = groups[g][k].split(/\s+/).filter(function (w) { return w.length > 0; });
				ok(words.length >= 8 && words.length <= 30,
					'job ' + j.id + ' sentence ' + g + '.' + k + ' has ' + words.length + ' words: ' + groups[g][k]);
			}
		}
	}
});

done();
