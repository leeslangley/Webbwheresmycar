// Garage actions: quick tinker, full service, fix a fault and full
// restoration (DESIGN.md sections 4.5, 9.3). Each action costs money and
// one day: on failure nothing changes and no day passes; on success the
// message goes into state.pending and advanceDay runs last, so the night's
// decay, bills and phone calls follow the work. Pure sim module: no DOM,
// no randomness, no dates.

import { money, oneDp } from '../core/format.js';
import { modelOf } from '../data/cars.js';
import { changeCondition } from './carstats.js';
import { advanceDay } from './advance.js';

// Find a stable car by id, or null if there is no such car.
function findCar(state, carId) {
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].id === carId) {
			return state.cars[i];
		}
	}
	return null;
}

// The success ending: note it in the tray, then let the day pass.
function finish(state, msg) {
	state.pending.push(msg);
	advanceDay(state);
	return { ok: true, msg: msg };
}

// serviceCar(state, carId, kind): kind is 'quick' (+1.0 condition) or
// 'full' (+2.5 and lastServiceDay). Neither touches a fault.
export function serviceCar(state, carId, kind) {
	const car = findCar(state, carId);
	if (!car) {
		return { ok: false, msg: 'No such car' };
	}
	if (kind !== 'quick' && kind !== 'full') {
		return { ok: false, msg: 'No such treatment' };
	}
	const quick = kind === 'quick';
	const model = modelOf(car.modelId);
	const cost = quick
		? Math.round(40 + model.basePrice * 0.002)
		: Math.round(150 + model.basePrice * 0.008);
	if (car.condition >= 10) {
		return { ok: false, msg: 'Already perfect' };
	}
	if (state.cash < cost) {
		return { ok: false, msg: 'Not enough money' };
	}
	state.cash -= cost;
	const before = car.condition;
	const after = changeCondition(car, quick ? 1.0 : 2.5);
	let msg;
	if (quick) {
		msg = 'Quick tinker on the ' + model.name + ': condition '
			+ oneDp(before) + ' -> ' + oneDp(after) + '. Cost ' + money(cost) + '.';
	} else {
		car.lastServiceDay = state.day;
		msg = 'Full service on the ' + model.name + ': condition '
			+ oneDp(before) + ' -> ' + oneDp(after) + '. Cost ' + money(cost) + '.';
	}
	return finish(state, msg);
}

// fixFault(state, carId): pay the fault's own cost to clear it, plus a
// little condition for the car's dignity.
export function fixFault(state, carId) {
	const car = findCar(state, carId);
	if (!car) {
		return { ok: false, msg: 'No such car' };
	}
	if (car.fault === null) {
		return { ok: false, msg: 'Nothing to fix' };
	}
	const cost = car.fault.cost;
	if (state.cash < cost) {
		return { ok: false, msg: 'Not enough money' };
	}
	state.cash -= cost;
	const label = car.fault.label;
	const model = modelOf(car.modelId);
	car.fault = null;
	const after = changeCondition(car, 0.5);
	const msg = 'Fixed the ' + label + ' on the ' + model.name
		+ ' for ' + money(cost) + '. Condition now ' + oneDp(after) + '.';
	return finish(state, msg);
}

// restoreCar(state, carId): a bare-shell nut-and-bolt job. Condition back
// to 10, fault gone, service book signed today.
export function restoreCar(state, carId) {
	const car = findCar(state, carId);
	if (!car) {
		return { ok: false, msg: 'No such car' };
	}
	const model = modelOf(car.modelId);
	const cost = Math.max(1200, Math.round(model.basePrice * 0.06));
	if (car.condition >= 10 && car.fault === null) {
		return { ok: false, msg: 'Already perfect' };
	}
	if (state.cash < cost) {
		return { ok: false, msg: 'Not enough money' };
	}
	state.cash -= cost;
	car.fault = null;
	const after = changeCondition(car, 10 - car.condition);
	car.lastServiceDay = state.day;
	const msg = 'Full restoration of the ' + model.name + ': good as new, '
		+ oneDp(after) + ' condition. Cost ' + money(cost) + '.';
	return finish(state, msg);
}
