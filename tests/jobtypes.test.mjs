// Tests for the job type aggregator, run under `jsc -m`.

import { JOB_TYPES, JOB_BY_ID, jobTypeOf, fillText } from '../src/data/jobtypes.js';
import { test, eq, ok, done } from './harness.js';

// Expected id order straight from docs/DESIGN.md section 8.2 (sets A, B, C, D).
const EXPECTED_IDS = ['wedding', 'photoshoot', 'concours', 'period',
	'musicvideo', 'stag', 'prom', 'film',
	'surprise', 'estate', 'parade', 'hen',
	'proposal', 'vicar', 'panto', 'chef'];

test('JOB_TYPES has exactly 16 jobs', () => {
	ok(Array.isArray(JOB_TYPES), 'JOB_TYPES is an array');
	eq(JOB_TYPES.length, 16, 'length');
});

test('job ids are unique and appear in the section 8.2 order', () => {
	const ids = JOB_TYPES.map(function (j) { return j.id; });
	eq(ids, EXPECTED_IDS, 'ids in order');
	eq(new Set(ids).size, 16, 'ids unique');
});

test('JOB_BY_ID maps every id to the same object', () => {
	eq(Object.keys(JOB_BY_ID).length, 16, 'JOB_BY_ID size');
	for (let i = 0; i < JOB_TYPES.length; i++) {
		eq(JOB_BY_ID[JOB_TYPES[i].id], JOB_TYPES[i], JOB_TYPES[i].id + ' lookup');
	}
});

test('jobTypeOf returns the job for a known id', () => {
	eq(jobTypeOf('wedding'), JOB_BY_ID.wedding, 'wedding');
	eq(jobTypeOf('film'), JOB_BY_ID.film, 'film');
});

test('jobTypeOf(\'film\').feeMax is 3800', () => {
	eq(jobTypeOf('film').feeMax, 3800, 'film feeMax');
});

test('jobTypeOf throws on an unknown id', () => {
	let msg = '';
	try {
		jobTypeOf('zzz');
	} catch (e) {
		msg = String(e && e.message);
	}
	eq(msg, 'unknown job zzz', 'error message');
});

test('fillText replaces {customer} and {car} everywhere', () => {
	eq(fillText('{customer} drove {car}. {customer} smiled.', { customer: 'Bob', car: 'Mini' }),
		'Bob drove Mini. Bob smiled.', 'both vars, repeated');
});

test('fillText leaves a placeholder untouched when its var is undefined', () => {
	eq(fillText('{customer} x', {}), '{customer} x', 'empty vars');
	eq(fillText('{car} for {customer}', { customer: 'Sam' }), '{car} for Sam', 'one var missing');
});

test('fillText survives bad inputs', () => {
	eq(fillText('{car} x', null), '{car} x', 'null vars');
	eq(fillText('no placeholders here', { customer: 'Bob', car: 'Mini' }), 'no placeholders here', 'no placeholders');
});

test('every job has feeMin < feeMax and wearMin < wearMax', () => {
	for (let i = 0; i < JOB_TYPES.length; i++) {
		const j = JOB_TYPES[i];
		ok(j.feeMin < j.feeMax, j.id + ' feeMin < feeMax');
		ok(j.wearMin < j.wearMax, j.id + ' wearMin < wearMax');
	}
});

test('across all 16 jobs: 48 blurbs, 48 success, 48 mishap, 32 disaster', () => {
	let blurbs = 0, success = 0, mishap = 0, disaster = 0;
	for (let i = 0; i < JOB_TYPES.length; i++) {
		const j = JOB_TYPES[i];
		eq(j.blurbs.length, 3, j.id + ' blurbs');
		eq(j.success.length, 3, j.id + ' success');
		eq(j.mishap.length, 3, j.id + ' mishap');
		eq(j.disaster.length, 2, j.id + ' disaster');
		blurbs += j.blurbs.length;
		success += j.success.length;
		mishap += j.mishap.length;
		disaster += j.disaster.length;
	}
	eq(blurbs, 48, 'total blurbs');
	eq(success, 48, 'total success');
	eq(mishap, 48, 'total mishap');
	eq(disaster, 32, 'total disaster');
});

done();
