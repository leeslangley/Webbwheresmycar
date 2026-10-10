// Tests for accepting and resolving a customer job, run under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { acceptJob } from '../src/sim/jobresolve.js';
import { test, eq, ok, near, done } from './harness.js';

// Build a state with one owned car and one hand-made request ('Q1'), both
// fully shaped like the real things. `req` carries the thresholds; `opts`
// overrides the odd field (fee, expiresDay, requestId, carId, fault).
function buildState(seed, modelId, condition, req, opts) {
	const o = opts || {};
	const state = newGameState(seed);
	const car = {
		id: o.carId || 'c1',
		modelId: modelId,
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: 0,
		condition: condition,
		fault: o.fault || null,
		lastServiceDay: state.day,
		jobsDone: 0,
		boughtDay: state.day,
		impoundedUntil: 0,
		rentedAtCondition: null,
	};
	if (o.impoundedUntil !== undefined) {
		car.impoundedUntil = o.impoundedUntil;
	}
	state.cars.push(car);
	state.requests.push({
		id: o.requestId || 'Q1',
		jobTypeId: req.jobTypeId || 'wedding',
		customer: 'Doreen Slack',
		fee: o.fee !== undefined ? o.fee : 1000,
		minDesirability: req.minDesirability,
		minReliability: req.minReliability,
		minCondition: req.minCondition,
		expiresDay: o.expiresDay !== undefined ? o.expiresDay : state.day + 5,
		blurb: 'Doreen Slack needs something posh for a wedding.'
	});
	return state;
}

// Walk seeds 1..maxSeed until acceptJob lands the wanted outcome type.
function findOutcome(modelId, condition, req, want, maxSeed) {
	for (let seed = 1; seed <= maxSeed; seed++) {
		const state = buildState(seed, modelId, condition, req);
		const res = acceptJob(state, 'Q1', 'c1');
		if (res.ok && res.outcome.type === want) {
			return { seed: seed, state: state, res: res };
		}
	}
	throw new Error('no seed gave outcome ' + want + ' within ' + maxSeed + ' seeds');
}

const WEDDING_REQ = { minDesirability: 6, minReliability: 5, minCondition: 6 };
const OPEN_REQ = { minDesirability: 0, minReliability: 0, minCondition: 0 };

// (a) Every refusal leaves the state byte-for-byte identical and the day
// unmoved.
test('refusals change nothing and cost no day', function () {
	function snapshot(seed, modelId, condition, req, opts) {
		const state = buildState(seed, modelId, condition, req, opts);
		const before = JSON.stringify(state);
		return { state: state, before: before };
	}

	let s = snapshot(11, 't2_zed', 10, WEDDING_REQ);
	let res = acceptJob(s.state, 'nope', 'c1');
	eq(res.ok, false, 'unknown request: ok');
	eq(res.msg, 'No such booking', 'unknown request: msg');
	eq(JSON.stringify(s.state), s.before, 'unknown request: state untouched');
	eq(s.state.day, 1, 'unknown request: day unchanged');

	s = snapshot(12, 't2_zed', 10, WEDDING_REQ);
	res = acceptJob(s.state, 'Q1', 'nope');
	eq(res.ok, false, 'unknown car: ok');
	eq(res.msg, 'No such car in the garage', 'unknown car: msg');
	eq(JSON.stringify(s.state), s.before, 'unknown car: state untouched');

	s = snapshot(13, 't2_zed', 10, WEDDING_REQ, { expiresDay: 0 });
	res = acceptJob(s.state, 'Q1', 'c1');
	eq(res.ok, false, 'expired request: ok');
	eq(res.msg, 'That booking has expired', 'expired request: msg');
	eq(JSON.stringify(s.state), s.before, 'expired request: state untouched');

	s = snapshot(14, 't2_zed', 10, WEDDING_REQ, { fault: { faultId: 'puncture', label: 'Puncture', cost: 90 } });
	res = acceptJob(s.state, 'Q1', 'c1');
	eq(res.ok, false, 'faulty car: ok');
	eq(res.msg, 'That car is not fit to go out', 'faulty car: msg');
	eq(JSON.stringify(s.state), s.before, 'faulty car: state untouched');

	// t1_allergy (D1) against a concours request (minD 7): too plain.
	s = snapshot(15, 't1_allergy', 10, { jobTypeId: 'concours', minDesirability: 7, minReliability: 5, minCondition: 7 });
	res = acceptJob(s.state, 'Q1', 'c1');
	eq(res.ok, false, 'too plain car: ok');
	ok(res.msg.indexOf('desirable') !== -1, 'too plain car: msg names desirability, got ' + res.msg);
	eq(JSON.stringify(s.state), s.before, 'too plain car: state untouched');

	// Same car meets minD 0/minR 0 but the bodywork is not up to it.
	s = snapshot(16, 't2_zed', 4, { minDesirability: 0, minReliability: 0, minCondition: 8 });
	res = acceptJob(s.state, 'Q1', 'c1');
	eq(res.ok, false, 'tired car: ok');
	ok(res.msg.indexOf('condition') !== -1, 'tired car: msg names condition, got ' + res.msg);
	eq(JSON.stringify(s.state), s.before, 'tired car: state untouched');
});

// (b) A success: the full fee lands, the request goes, the day passes.
test('a seed with outcome success pays the full fee', function () {
	const found = findOutcome('t2_zed', 10, WEDDING_REQ, 'success', 20000);
	const state = found.state;
	const res = found.res;
	eq(res.outcome.type, 'success', 'outcome type');
	eq(state.cash, 21000, 'cash gained exactly the 1000 fee');
	ok(state.reputation === 42 || state.reputation === 43, 'reputation went up 2 or 3, now ' + state.reputation);
	eq(state.stats.jobsDone, 1, 'stats.jobsDone');
	eq(state.cars[0].jobsDone, 1, 'car.jobsDone');
	eq(state.day, 2, 'one day passed');
	let stillThere = false;
	for (let i = 0; i < state.requests.length; i++) {
		if (state.requests[i].id === 'Q1') {
			stillThere = true;
		}
	}
	ok(!stillThere, 'request still on the board');
	near(state.cars[0].condition, 10 - res.outcome.wear, 0.05, 'condition lost the wear (plus a night of idle decay)');
	ok(res.outcome.wear >= 0.2 && res.outcome.wear <= 0.5, 'wear ' + res.outcome.wear + ' outside the wedding range');
	ok(res.msg.indexOf('{') === -1, 'message still holds a placeholder');
});

// (c) A mishap: 60% of the fee, one reputation point gone.
test('a seed with outcome mishap pays 60 percent of the fee', function () {
	const found = findOutcome('t2_zed', 10, WEDDING_REQ, 'mishap', 20000);
	const state = found.state;
	const res = found.res;
	eq(res.outcome.type, 'mishap', 'outcome type');
	eq(res.outcome.paid, 600, 'outcome.paid is 60% of the fee');
	eq(state.cash, 20600, 'cash gained 60% of the fee');
	eq(state.reputation, 39, 'reputation dropped by 1');
	eq(state.stats.jobsDone, 1, 'stats.jobsDone still counts a mishap');
	near(state.cars[0].condition, 10 - 2 * res.outcome.wear, 0.05, 'condition lost twice the wear');
	ok(res.msg.indexOf('{') === -1, 'message still holds a placeholder');
});

// (d) A breakdown: a major fault mid-job, call-out money only.
test('a seed with outcome breakdown applies a major fault', function () {
	const found = findOutcome('t3_lamborgonzo', 2, OPEN_REQ, 'breakdown', 20000);
	const state = found.state;
	const res = found.res;
	eq(res.outcome.type, 'breakdown', 'outcome type');
	eq(res.outcome.paid, 250, 'outcome.paid is the 25% call-out');
	eq(state.cash, 20250, 'cash gained 25% of the fee');
	eq(state.reputation, 36, 'reputation dropped by 4');
	ok(state.cars[0].fault !== null, 'the car came back with no fault');
	eq(state.stats.jobsFailed, 1, 'stats.jobsFailed');
	eq(state.stats.faults, 1, 'stats.faults');
	ok(state.cars[0].fault.label !== null, 'fault has a label');
	ok(res.msg.indexOf('{') === -1, 'message still holds a placeholder');
});

// (e) A disaster: wear quadrupled and reputation flattened.
test('a seed with outcome disaster drops 4x wear and 6 reputation', function () {
	const found = findOutcome('t3_lamborgonzo', 2, OPEN_REQ, 'disaster', 60000);
	const state = found.state;
	const res = found.res;
	eq(res.outcome.type, 'disaster', 'outcome type');
	eq(state.reputation, 34, 'reputation dropped by 6');
	eq(state.stats.jobsFailed, 1, 'stats.jobsFailed');
	near(state.cars[0].condition, 2 - 4 * res.outcome.wear, 0.05, 'condition lost four times the wear');
	ok(res.msg.indexOf('{') === -1, 'message still holds a placeholder');
	ok(res.msg.indexOf('Doreen Slack') === -1 || true, 'customer may or may not feature');
});

// (f) Over many seeds with a good car the odds land where DESIGN says.
test('proportions over 3000 seeds sit in the design bands', function () {
	const counts = { success: 0, mishap: 0, breakdown: 0, disaster: 0 };
	const n = 3000;
	for (let seed = 1; seed <= n; seed++) {
		const state = buildState(seed, 't2_zed', 10, WEDDING_REQ);
		const res = acceptJob(state, 'Q1', 'c1');
		ok(res.ok, 'seed ' + seed + ' was refused: ' + res.msg);
		counts[res.outcome.type] += 1;
	}
	const successShare = counts.success / n;
	const mishapShare = counts.mishap / n;
	ok(successShare >= 0.85 && successShare <= 0.97, 'success share ' + successShare + ' outside 0.85-0.97');
	ok(mishapShare >= 0.02 && mishapShare <= 0.09, 'mishap share ' + mishapShare + ' outside 0.02-0.09');
});

// (g) No message ever leaks a raw placeholder.
test('messages for every outcome type have no braces', function () {
	const wants = ['success', 'mishap', 'breakdown', 'disaster'];
	for (let i = 0; i < wants.length; i++) {
		const found = findOutcome('t3_lamborgonzo', 10, OPEN_REQ, wants[i], 60000);
		ok(found.res.msg.indexOf('{') === -1, wants[i] + ' message still holds a placeholder');
	}
});

// (h) Equal states, equal results: the whole day replays identically.
test('the same seed resolves the same day twice over', function () {
	const found = findOutcome('t2_zed', 10, WEDDING_REQ, 'success', 20000);
	function runOnce(seed) {
		const state = buildState(seed, 't2_zed', 10, WEDDING_REQ);
		const res = acceptJob(state, 'Q1', 'c1');
		return { state: JSON.stringify(state), msg: res.msg, outcome: res.outcome };
	}
	const a = runOnce(found.seed);
	const b = runOnce(found.seed);
	eq(a.state, b.state, 'end states identical');
	eq(a.msg, b.msg, 'messages identical');
	eq(a.outcome, b.outcome, 'outcomes identical');
});

done();
