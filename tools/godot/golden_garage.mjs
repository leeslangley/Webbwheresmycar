// Golden fixture for godot/sim/garage.gd (GDS14): runs src/sim/garage.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh garage   (writes godot/tests/golden/garage.json)

import { serviceCar, fixFault, restoreCar } from '../../src/sim/garage.js';
import { fresh, addCar, stateCase, emitCases } from './golden_sim.mjs';

// A new game (seed) with one car of the given model and condition, plus optional fields and cash.
// Returns { state, carId }; the car is the only car in the stable.
function setup(seed, modelId, condition, extra, cash) {
	const s = fresh(seed);
	if (cash !== undefined) {
		s.cash = cash;
	}
	const car = addCar(s, modelId, Object.assign({ condition: condition }, extra || {}));
	return { state: s, carId: car.id };
}

// One case: setup(...) then stateCase(fn, name, state, [carId, ...rest], call).
function caseOf(fn, name, seed, modelId, condition, extra, cash, rest, call) {
	const a = setup(seed, modelId, condition, extra, cash);
	return stateCase(fn, name, a.state, [a.carId].concat(rest), call);
}

// A new game with no car added, for the unknown-car cases.
function noCar(seed) {
	return fresh(seed);
}

const FAULT_PUNCTURE = { faultId: 'puncture', label: 'Puncture', cost: 90 };
const FAULT_GEARBOX = { faultId: 'gearbox', label: 'Gearbox', cost: 1400 };

const cases = [];

// service_car
cases.push(caseOf('service_car', 'quick on condition 5', 1, 't2_serious', 5, null, undefined, ['quick'], serviceCar));
cases.push(caseOf('service_car', 'full on condition 5', 2, 't2_serious', 5, null, undefined, ['full'], serviceCar));
cases.push(caseOf('service_car', 'full on condition 9 clamps to 10', 3, 't2_serious', 9, null, undefined, ['full'], serviceCar));
cases.push(caseOf('service_car', 'quick on condition 10 is already perfect', 4, 't2_serious', 10, null, undefined, ['quick'], serviceCar));
cases.push(caseOf('service_car', 'full with cash 20 not enough', 1, 't2_serious', 5, null, 20, ['full'], serviceCar));
cases.push(caseOf('service_car', 'bogus treatment kind', 2, 't2_serious', 5, null, undefined, ['bogus'], serviceCar));
cases.push(stateCase('service_car', 'unknown car c99', noCar(3), ['c99', 'quick'], serviceCar));
cases.push(caseOf('service_car', 'quick on t3_porshe condition 2', 4, 't3_porshe', 2, null, undefined, ['quick'], serviceCar));

// fix_fault
cases.push(caseOf('fix_fault', 'puncture fixed with cash 5000', 1, 't2_serious', 5, { fault: FAULT_PUNCTURE }, 5000, [], fixFault));
cases.push(caseOf('fix_fault', 'puncture with cash 50 not enough', 2, 't2_serious', 5, { fault: FAULT_PUNCTURE }, 50, [], fixFault));
cases.push(caseOf('fix_fault', 'no fault to fix', 3, 't2_serious', 5, null, undefined, [], fixFault));
cases.push(stateCase('fix_fault', 'unknown car c99', noCar(4), ['c99'], fixFault));
cases.push(caseOf('fix_fault', 't3_porshe gearbox fault cost 1400', 1, 't3_porshe', 6, { fault: FAULT_GEARBOX }, 5000, [], fixFault));

// restore_car
cases.push(caseOf('restore_car', 'condition 3 with a fault', 1, 't2_serious', 3, { fault: FAULT_PUNCTURE }, undefined, [], restoreCar));
cases.push(caseOf('restore_car', 't3_porshe condition 4 cost from basePrice', 2, 't3_porshe', 4, null, 50000, [], restoreCar));
cases.push(caseOf('restore_car', 'condition 10 no fault already perfect', 3, 't2_serious', 10, null, undefined, [], restoreCar));
cases.push(caseOf('restore_car', 'condition 10 with a fault is allowed', 4, 't2_serious', 10, { fault: FAULT_PUNCTURE }, undefined, [], restoreCar));
cases.push(caseOf('restore_car', 'cash 100 not enough', 1, 't2_serious', 3, null, 100, [], restoreCar));
cases.push(caseOf('restore_car', 't1_allergy cost floor 1200', 3, 't1_allergy', 3, null, undefined, [], restoreCar));
cases.push(stateCase('restore_car', 'unknown car c99', noCar(2), ['c99'], restoreCar));

emitCases('garage', cases);
