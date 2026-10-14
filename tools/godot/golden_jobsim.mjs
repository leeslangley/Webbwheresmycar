// Golden fixture for godot/sim/jobsim.gd (GDS06): expireRequests and generateRequests from src/sim/jobsim.js.
// Run by: sh tools/godot/golden_run.sh jobsim   (writes godot/tests/golden/jobsim.json)

import { expireRequests, generateRequests } from '../../src/sim/jobsim.js';
import { fresh, stateCase, emitCases } from './golden_sim.mjs';

function req(id, exp) {
	return { id: id, jobTypeId: 'wedding', customer: 'Mrs Test', fee: 500, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: exp, blurb: 'x' };
}

const cases = [];

// (a) expiry: only requests with expiresDay < day go.
const board = [req('Q1', 3), req('Q2', 5), req('Q3', 5), req('Q4', 9)];
cases.push(stateCase('expire_requests', 'mixed day 5', { day: 5, requests: board }, [], s => expireRequests(s)));
cases.push(stateCase('expire_requests', 'empty day 5', { day: 5, requests: [] }, [], s => expireRequests(s)));
cases.push(stateCase('expire_requests', 'all expired day 10', { day: 10, requests: board }, [], s => expireRequests(s)));

// (b) generation across seeds and (reputation, buzz) levels.
for (const seed of [1, 2, 3, 4, 5, 6]) {
	for (const [rep, buzz] of [[0, 0], [40, 0], [100, 100]]) {
		const st = fresh(seed);
		st.reputation = rep;
		st.buzz = buzz;
		cases.push(stateCase('generate_requests', 's' + seed + ' rep' + rep + ' buzz' + buzz, st, [], s => generateRequests(s)));
	}
}

// (c) the board cap: a full board (5 or 6 requests already) at the highest expectation.
for (const seed of [1, 2, 3]) {
	for (const n of [5, 6]) {
		const st = fresh(seed);
		st.reputation = 100;
		st.buzz = 100;
		st.requests = [];
		for (let i = 1; i <= n; i++) {
			st.requests.push(req('Q' + i, 99));
		}
		cases.push(stateCase('generate_requests', 'cap ' + n + ' seed' + seed, st, [], s => generateRequests(s)));
	}
}

emitCases('jobsim', cases);
