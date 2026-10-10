// Tests for the set A job types table, run under `jsc -m`.

import { JOBS_A } from '../src/data/jobs_a.js';
import { test, eq, ok, done } from './harness.js';

// Expected numbers straight from docs/DESIGN.md section 8.2.
const EXPECTED = [
	{ id: 'wedding', name: 'Wedding', feeMin: 600, feeMax: 1400, minD: 6, minR: 5, minCond: 6, wearMin: 0.2, wearMax: 0.5 },
	{ id: 'photoshoot', name: 'Magazine photo shoot', feeMin: 400, feeMax: 1000, minD: 6, minR: 4, minCond: 5, wearMin: 0.1, wearMax: 0.3 },
	{ id: 'concours', name: 'Classic car show (concours)', feeMin: 500, feeMax: 1500, minD: 7, minR: 5, minCond: 7, wearMin: 0.1, wearMax: 0.4 },
	{ id: 'period', name: 'TV costume drama', feeMin: 900, feeMax: 2200, minD: 7, minR: 5, minCond: 5, wearMin: 0.3, wearMax: 0.8 }
];

test('JOBS_A has exactly 4 jobs', () => {
	ok(Array.isArray(JOBS_A), 'JOBS_A is an array');
	eq(JOBS_A.length, 4, 'length');
});

test('job ids appear in the order wedding, photoshoot, concours, period', () => {
	eq(JOBS_A.map(function (j) { return j.id; }), ['wedding', 'photoshoot', 'concours', 'period'], 'ids in order');
});

test('numeric fields match DESIGN.md section 8.2 exactly', () => {
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		eq(j.name, EXPECTED[i].name, EXPECTED[i].id + ' name');
		eq(j.feeMin, EXPECTED[i].feeMin, EXPECTED[i].id + ' feeMin');
		eq(j.feeMax, EXPECTED[i].feeMax, EXPECTED[i].id + ' feeMax');
		eq(j.minD, EXPECTED[i].minD, EXPECTED[i].id + ' minD');
		eq(j.minR, EXPECTED[i].minR, EXPECTED[i].id + ' minR');
		eq(j.minCond, EXPECTED[i].minCond, EXPECTED[i].id + ' minCond');
		eq(j.wearMin, EXPECTED[i].wearMin, EXPECTED[i].id + ' wearMin');
		eq(j.wearMax, EXPECTED[i].wearMax, EXPECTED[i].id + ' wearMax');
	}
});

test('every job has exactly the required keys', () => {
	for (let i = 0; i < JOBS_A.length; i++) {
		const keys = Object.keys(JOBS_A[i]).sort();
		eq(keys.join(','), 'blurbs,disaster,feeMax,feeMin,id,minCond,minD,minR,mishap,name,success,wearMax,wearMin', EXPECTED[i].id + ' keys');
	}
});

test('each job has 3 blurbs containing {customer}', () => {
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		eq(j.blurbs.length, 3, j.id + ' blurbs length');
		for (let b = 0; b < j.blurbs.length; b++) {
			ok(j.blurbs[b].indexOf('{customer}') !== -1, j.id + ' blurb ' + b + ' mentions {customer}');
		}
	}
});

test('each job has 3 success, 3 mishap and 2 disaster texts', () => {
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		eq(j.success.length, 3, j.id + ' success length');
		eq(j.mishap.length, 3, j.id + ' mishap length');
		eq(j.disaster.length, 2, j.id + ' disaster length');
	}
});

test('every outcome sentence mentions {customer} or {car}', () => {
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		const outcomes = j.success.concat(j.mishap, j.disaster);
		for (let s = 0; s < outcomes.length; s++) {
			const has = outcomes[s].indexOf('{customer}') !== -1 || outcomes[s].indexOf('{car}') !== -1;
			ok(has, j.id + ' outcome ' + s + ' mentions {customer} or {car}');
		}
	}
});

test('no string contains a placeholder other than {customer} or {car}', () => {
	const tokenRe = /\{(\w+)\}/g;
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		const all = [j.name].concat(j.blurbs, j.success, j.mishap, j.disaster);
		for (let s = 0; s < all.length; s++) {
			let m;
			tokenRe.lastIndex = 0;
			while ((m = tokenRe.exec(all[s])) !== null) {
				ok(m[1] === 'customer' || m[1] === 'car', j.id + ' token {' + m[1] + '} is customer or car');
			}
		}
	}
});

test('every sentence is 8-30 words long', () => {
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		const all = j.blurbs.concat(j.success, j.mishap, j.disaster);
		for (let s = 0; s < all.length; s++) {
			const words = all[s].split(/\s+/).length;
			ok(words >= 8 && words <= 30, j.id + ' sentence ' + s + ' has ' + words + ' words');
		}
	}
});

test('all strings in the table are unique', () => {
	const seen = {};
	for (let i = 0; i < JOBS_A.length; i++) {
		const j = JOBS_A[i];
		const all = [j.id, j.name].concat(j.blurbs, j.success, j.mishap, j.disaster);
		for (let s = 0; s < all.length; s++) {
			ok(!seen[all[s]], 'string is unique: ' + all[s]);
			seen[all[s]] = true;
		}
	}
});

done();
