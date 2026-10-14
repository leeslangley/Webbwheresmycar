// Golden fixture for godot/sim/jobresolve.gd (GDS15): acceptJob from src/sim/jobresolve.js.
// Covers every outcome kind, the big-win flag and the refusals. The disaster kinds are in the fixture
// (the GDScript disaster branch is a stub until GDS16; its test skips them).
// Run by: sh tools/godot/golden_run.sh jobresolve   (writes godot/tests/golden/jobresolve.json)

import { acceptJob } from '../../src/sim/jobresolve.js';
import { fresh, addCar, clone, stateCase, sweepSeeds, emitCases } from './golden_sim.mjs';

const b = fresh(4);
addCar(b, 't2_serious', { condition: 8.5 });
b.requests = [{ id: 'Q900', jobTypeId: 'wedding', customer: 'Mrs Test', fee: 1200, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: b.day + 5, blurb: '' }];
const base = b;
const carId = base.cars[0].id;

function classify(w, r) {
	if (!r.ok) {
		return null;
	}
	const o = r.outcome;
	const car = w.cars[0];
	if (o.type === 'success') {
		return car.fault ? 'success_fault' : 'success';
	}
	if (o.type === 'mishap') {
		return car.fault ? 'mishap_fault' : 'mishap';
	}
	if (o.type === 'breakdown') {
		return 'breakdown';
	}
	return o.paid < 0 ? 'disaster_comp' : (car.impoundedUntil > 0 ? 'disaster_impound' : 'disaster_truck');
}

const found = sweepSeeds(base, 1, 30000, (w) => acceptJob(w, 'Q900', carId), classify, 2);
const kinds = ['success', 'success_fault', 'mishap', 'mishap_fault', 'breakdown', 'disaster_truck', 'disaster_comp', 'disaster_impound'];
for (const k of kinds) {
	if (!found[k] || found[k].length === 0) {
		throw new Error('no seed found for outcome kind ' + k);
	}
}

const cases = [];

for (const k of kinds) {
	for (const seed of found[k]) {
		const st = clone(base);
		st.rng = seed;
		cases.push(stateCase('accept_job', k + ' seed ' + seed, st, ['Q900', carId], (s, r, c) => acceptJob(s, r, c)));
	}
}

// Big win: the first success seed with a fee of 2400 (fee >= 2000 flags the front page).
{
	const seed = found['success'][0];
	const st = clone(base);
	st.rng = seed;
	st.requests[0].fee = 2400;
	cases.push(stateCase('accept_job', 'bigwin', st, ['Q900', carId], (s, r, c) => acceptJob(s, r, c)));
}

// Low fee: the first success seed with a fee of 1999 (no big-win flag).
{
	const seed = found['success'][0];
	const st = clone(base);
	st.rng = seed;
	st.requests[0].fee = 1999;
	cases.push(stateCase('accept_job', 'low fee', st, ['Q900', carId], (s, r, c) => acceptJob(s, r, c)));
}

// Refusals (rng 1 each).
function refusal(name, edit, requestId = 'Q900', cid = carId) {
	const st = clone(base);
	st.rng = 1;
	edit(st);
	cases.push(stateCase('accept_job', name, st, [requestId, cid], (s, r, c) => acceptJob(s, r, c)));
}
refusal('refuse unknown request', () => {}, 'Q1');
refusal('refuse unknown car', () => {}, 'Q900', 'c99');
refusal('refuse expired', (s) => { s.requests[0].expiresDay = s.day - 1; });
refusal('refuse fault', (s) => { s.cars[0].fault = { faultId: 'puncture', label: 'Puncture', cost: 90 }; });
refusal('refuse impounded', (s) => { s.cars[0].impoundedUntil = s.day + 2; });
refusal('refuse desirability', (s) => { s.requests[0].minDesirability = 99; });
refusal('refuse reliability', (s) => { s.requests[0].minReliability = 99; });
refusal('refuse condition', (s) => { s.requests[0].minCondition = 9.5; });

emitCases('jobresolve', cases);
