// Tests for the daily customer request generator and expiry, run under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { JOB_TYPES, JOB_BY_ID } from '../src/data/jobtypes.js';
import { generateRequests, expireRequests } from '../src/sim/jobsim.js';
import { test, eq, ok, done } from './harness.js';

// Run generateRequests `calls` times on a fresh seeded state, resetting the
// board each call (and bumping nextId so ids stay unique), and return the
// mean number of requests added per call.
function meanAdded(seed, reputation, buzz, calls) {
	const state = newGameState(seed);
	state.reputation = reputation;
	state.buzz = buzz;
	let total = 0;
	for (let i = 0; i < calls; i++) {
		state.requests = [];
		state.nextId += 10;
		total += generateRequests(state);
	}
	return total / calls;
}

// (a) Reputation 40, buzz 0: expected = 0.20 + 0.006*40 = 0.44 requests a day.
test('mean added at reputation 40 buzz 0 is 0.38-0.50', function () {
	const mean = meanAdded(20261010, 40, 0, 2000);
	ok(mean >= 0.38 && mean <= 0.50, 'mean ' + mean + ' outside 0.38-0.50');
});

// (b) Reputation 40, buzz 60: expected = 0.20 + 0.24 + 0.90 = 1.34.
test('mean added at reputation 40 buzz 60 is 1.28-1.40', function () {
	const mean = meanAdded(20261010, 40, 60, 2000);
	ok(mean >= 1.28 && mean <= 1.40, 'mean ' + mean + ' outside 1.28-1.40');
});

// (c) A full board (6 requests) takes nothing more.
test('no requests added when the board already holds 6', function () {
	const state = newGameState(2);
	state.reputation = 40;
	state.buzz = 60; // guarantees at least one attempt per call
	for (let i = 0; i < 6; i++) {
		state.requests.push({ id: 'X' + i, expiresDay: state.day + 5 });
	}
	const added = generateRequests(state);
	eq(added, 0, 'added with a full board');
	eq(state.requests.length, 6, 'board size after a full-board call');
	eq(state.requests[0].id, 'X0', 'existing requests untouched');
});

// (d) Shape of a request: ids, fee, expiry, blurb, thresholds.
test('request fields match the card rules', function () {
	const state = newGameState(3);
	state.reputation = 40;
	state.buzz = 60;
	state.day = 50;
	const reqs = [];
	for (let i = 0; i < 400 && reqs.length < 200; i++) {
		state.requests = [];
		generateRequests(state);
		for (let j = 0; j < state.requests.length; j++) {
			reqs.push(state.requests[j]);
		}
	}
	ok(reqs.length >= 200, 'collected only ' + reqs.length + ' requests');

	const seen = {};
	for (let i = 0; i < reqs.length; i++) {
		const r = reqs[i];
		const label = 'request ' + i;
		ok(typeof r.id === 'string' && r.id.charAt(0) === 'Q', label + ': id starts with Q');
		ok(!seen[r.id], label + ': duplicate id ' + r.id);
		seen[r.id] = true;
		const job = JOB_BY_ID[r.jobTypeId];
		ok(job !== undefined, label + ': jobTypeId resolves');
		ok(Number.isInteger(r.fee) && r.fee > 0, label + ': fee is a positive integer');
		ok(r.fee >= Math.floor(job.feeMin * 0.85) && r.fee <= Math.ceil(job.feeMax * 1.15),
			label + ': fee ' + r.fee + ' outside scaled range ' + job.feeMin + '-' + job.feeMax);
		ok(r.expiresDay >= state.day + 4 && r.expiresDay <= state.day + 9,
			label + ': expiresDay ' + r.expiresDay + ' not in day+4..day+9');
		ok(r.blurb.indexOf('{') === -1, label + ': blurb still has a placeholder');
		ok(r.blurb.indexOf(r.customer) !== -1, label + ': blurb missing the customer name');
		eq(r.minDesirability, job.minD, label + ': minDesirability');
		eq(r.minReliability, job.minR, label + ': minReliability');
		eq(r.minCondition, job.minCond, label + ': minCondition');
	}
});

// (e) Expiry removes exactly the requests with expiresDay < day.
test('expireRequests removes only requests expired before today', function () {
	const state = newGameState(4);
	state.day = 100;
	state.requests = [
		{ id: 'A', expiresDay: 96 },
		{ id: 'B', expiresDay: 99 },
		{ id: 'C', expiresDay: 100 },
		{ id: 'D', expiresDay: 101 },
		{ id: 'E', expiresDay: 99 }
	];
	const removed = expireRequests(state);
	eq(removed, 3, 'number removed');
	eq(state.requests, [{ id: 'C', expiresDay: 100 }, { id: 'D', expiresDay: 101 }], 'survivors');

	// An empty board is a clean no-op.
	state.requests = [];
	eq(expireRequests(state), 0, 'removal from an empty board');
});

// (f) The same seed produces the same requests.
test('same seed gives identical requests', function () {
	function run(seed) {
		const state = newGameState(seed);
		const made = [];
		for (let day = 1; day <= 30; day++) {
			state.day = day;
			generateRequests(state);
			for (let i = 0; i < state.requests.length; i++) {
				made.push(state.requests[i]);
			}
			expireRequests(state);
		}
		return { requests: state.requests, made: made };
	}
	const a = run(777);
	const b = run(777);
	eq(a.made, b.made, 'all requests generated over 30 days');
	eq(a.requests, b.requests, 'requests surviving to day 30');
	ok(a.made.length > 20, 'enough requests generated to make the test meaningful');
});

done();
