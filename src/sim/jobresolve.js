// Accepting a customer booking and resolving the job at once (DESIGN.md
// sections 4.6 and 4.7). A refusal changes nothing and costs no day; an
// acceptance pays out, marks the car up or down, and costs exactly one day
// (advanceDay as the very last step). Pure sim module: randomness only
// through state.rng, no DOM, no dates.

import { rand, randInt, pick, roundTo, clamp } from '../core/rng.js';
import { money } from '../core/format.js';
import { modelOf } from '../data/cars.js';
import { jobTypeOf, fillText } from '../data/jobtypes.js';
import { effD, effR, changeCondition, isAvailable } from './carstats.js';
import { rollFault, applyFault } from './faultsim.js';
import { faultsOfSeverity, TIER_MULT } from '../data/faults.js';
import { advanceDay } from './advance.js';

// Outcome odds for the customer event roll (DESIGN.md section 4.7).
const DISASTER_P = 0.007;
const MISHAP_P = 0.057;

// Find a booking request by id, or null.
function findRequest(state, requestId) {
	for (let i = 0; i < state.requests.length; i++) {
		if (state.requests[i].id === requestId) {
			return state.requests[i];
		}
	}
	return null;
}

// Find a car in the stable by id, or null.
function findCar(state, carId) {
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].id === carId) {
			return state.cars[i];
		}
	}
	return null;
}

// Remove one request by id. Returns true if it was on the board.
function removeRequest(state, requestId) {
	for (let i = 0; i < state.requests.length; i++) {
		if (state.requests[i].id === requestId) {
			state.requests.splice(i, 1);
			return true;
		}
	}
	return false;
}

// Reputation stays clamped to 0-100 (DESIGN.md section 4.12).
function bumpReputation(state, delta) {
	state.reputation = clamp(state.reputation + delta, 0, 100);
}

// acceptJob(state, requestId, carId) -> {ok, msg, outcome}. Refusals return
// {ok:false, msg} with the state untouched. A real job resolves immediately:
// outcome is {type, paid, wear, faultLabel}, where `paid` is the net cash
// the job itself brought in (negative when the customer demands money back).
export function acceptJob(state, requestId, carId) {
	const req = findRequest(state, requestId);
	if (!req) {
		return { ok: false, msg: 'No such booking' };
	}
	const car = findCar(state, carId);
	if (!car) {
		return { ok: false, msg: 'No such car in the garage' };
	}
	if (req.expiresDay < state.day) {
		return { ok: false, msg: 'That booking has expired' };
	}
	if (!isAvailable(state, car)) {
		return { ok: false, msg: 'That car is not fit to go out' };
	}
	const model = modelOf(car.modelId);
	const carD = effD(model, car);
	const carR = effR(model, car);
	if (carD < req.minDesirability) {
		return { ok: false, msg: 'The ' + model.name + ' is not desirable enough for this booking (needs ' + req.minDesirability + ').' };
	}
	if (carR < req.minReliability) {
		return { ok: false, msg: 'The ' + model.name + ' is not reliable enough for this booking (needs ' + req.minReliability + ').' };
	}
	if (car.condition < req.minCondition) {
		return { ok: false, msg: 'The ' + model.name + ' is in too poor condition for this booking (needs ' + req.minCondition + ').' };
	}

	const job = jobTypeOf(req.jobTypeId);
	const customer = req.customer;
	const fee = req.fee;

	// Resolution order (DESIGN.md section 4.7): the fault roll first, then
	// the customer event roll; a major fault mid-job turns any result into
	// a breakdown.
	const fault = rollFault(state, model, car, 1);
	const roll = rand(state);
	let type;
	if (roll < DISASTER_P) {
		type = 'disaster';
	} else if (roll < MISHAP_P) {
		type = 'mishap';
	} else {
		type = 'success';
	}
	if (fault && fault.severity === 'major') {
		type = 'breakdown';
	}

	// Wear, one decimal, from the job type's range.
	const wear = roundTo(job.wearMin + rand(state) * (job.wearMax - job.wearMin), 0.1);

	let paid = 0;
	let faultLabel = fault ? fault.label : null;
	let text = '';

	if (type === 'success') {
		paid = fee;
		state.cash += fee;
		bumpReputation(state, carD >= req.minDesirability + 2 ? 3 : 2);
		changeCondition(car, -wear);
		car.jobsDone += 1;
		state.stats.jobsDone += 1;
		text = fillText(pick(state, job.success), { customer: customer, car: model.name });
		if (fault && (fault.severity === 'minor' || fault.severity === 'medium')) {
			applyFault(car, fault);
			text += ' (Then the ' + fault.label + ' started.)';
		}
	} else if (type === 'mishap') {
		paid = Math.round(fee * 0.6);
		state.cash += paid;
		bumpReputation(state, -1);
		changeCondition(car, -wear * 2);
		car.jobsDone += 1;
		state.stats.jobsDone += 1;
		text = fillText(pick(state, job.mishap), { customer: customer, car: model.name });
		if (fault && (fault.severity === 'minor' || fault.severity === 'medium')) {
			applyFault(car, fault);
		}
	} else if (type === 'breakdown') {
		paid = Math.round(fee * 0.25);
		state.cash += paid;
		bumpReputation(state, -4);
		applyFault(car, fault);
		state.stats.jobsFailed += 1;
		state.stats.faults += 1;
		state.sit.push('breakdown');
		text = model.name + ' broke down: ' + fault.label + '. ' + customer + ' is not impressed.';
	} else {
		// Disaster: no fee, four lots of wear, and one of three flavours of
		// ruin. Reputation takes the biggest hit of the lot.
		changeCondition(car, -wear * 4);
		bumpReputation(state, -6);
		state.stats.jobsFailed += 1;
		state.sit.push('breakdown');
		const flavour = randInt(state, 1, 3);
		if (flavour === 1) {
			const major = pick(state, faultsOfSeverity('major'));
			const majorFault = {
				faultId: major.id,
				label: major.label,
				cost: roundTo(major.baseCost * TIER_MULT[model.tier], 10),
				severity: 'major'
			};
			applyFault(car, majorFault);
			faultLabel = majorFault.label;
			text = fillText(pick(state, job.disaster), { customer: customer, car: model.name }) +
				' The ' + model.name + ' went home on the back of a truck: ' + majorFault.label + '.';
		} else if (flavour === 2) {
			const compensation = Math.round(fee * 0.5);
			state.cash -= compensation;
			paid = -compensation;
			text = fillText(pick(state, job.disaster), { customer: customer, car: model.name }) +
				' ' + customer + ' demanded ' + money(compensation) + ' in compensation before the kettle boiled.';
		} else {
			car.impoundedUntil = state.day + 3;
			text = fillText(pick(state, job.disaster), { customer: customer, car: model.name }) +
				' The police impounded the ' + model.name + ' for three days.';
		}
	}

	// A fat fee on a success or mishap is front-page news (DESIGN.md 9.4).
	if (type === 'success' || type === 'mishap') {
		if (fee >= 2000) {
			state.sit.push('bigwin');
		}
	}

	removeRequest(state, requestId);
	state.pending.push(text);
	advanceDay(state);
	return { ok: true, msg: text, outcome: { type: type, paid: paid, wear: wear, faultLabel: faultLabel } };
}
