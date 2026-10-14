// Golden fixture for godot/sim/carstats.gd (GDS03): runs src/sim/carstats.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh carstats   (writes godot/tests/golden/carstats.json)

import { modelOf } from '../../src/data/cars.js';
import {
	effD, effR, maintMult, valueFactor, marketValue, runningCost,
	idleDecay, changeCondition, isAvailable
} from '../../src/sim/carstats.js';
import { pureCase, stateCase, emitCases } from './golden_sim.mjs';

const MODELS = ['t1_allergy', 't1_robbin', 't2_serious', 't3_porshe', 't3_aston'];
const CONDS = [0, 2.5, 5, 7.3, 10];
const PRICE_MULTS = [0.85, 1, 1.25];
const COND_CHANGES = [
	[5, 1.0], [9.5, 2.5], [0.3, -1], [5.55, 0.01], [7.3, -0.1],
	[7.3, -0.3], [0, 0], [10, -0.04], [3.333, 0.004], [6.66, 1.005],
];
const AVAILABILITY = [
	['free', { fault: null, impoundedUntil: 0 }],
	['impounded field missing', { fault: null }],
	['impounded until day 10', { fault: null, impoundedUntil: 10 }],
	['impounded until day 11', { fault: null, impoundedUntil: 11 }],
	['faulted', { fault: { faultId: 'puncture', label: 'Puncture', cost: 90 }, impoundedUntil: 0 }],
];

const cases = [];

for (const m of MODELS) {
	for (const c of CONDS) {
		const name = m + ' ' + c;
		const model = modelOf(m);
		cases.push(pureCase('eff_d', name, [m, c], effD(model, { condition: c })));
		cases.push(pureCase('eff_r', name, [m, c], effR(model, { condition: c })));
		cases.push(pureCase('maint_mult', name, [m, c], maintMult({ condition: c })));
		cases.push(pureCase('value_factor', name, [m, c], valueFactor({ condition: c })));
		cases.push(pureCase('running_cost', name, [m, c], runningCost(model, { condition: c })));
		cases.push(pureCase('idle_decay', name, [m, c], idleDecay(model)));
	}
}

for (const m of MODELS) {
	for (const c of CONDS) {
		for (const p of PRICE_MULTS) {
			cases.push(stateCase('market_value', m + ' ' + c + ' x' + p, { market: { priceMult: p } }, [m, c],
				(s, mm, cc) => marketValue(s, modelOf(mm), { condition: cc })));
		}
	}
}

for (const [start, delta] of COND_CHANGES) {
	const car = { condition: start };
	const result = changeCondition(car, delta);
	cases.push(pureCase('change_condition', 'from ' + start + ' by ' + delta, [start, delta], result));
}

for (const [name, car] of AVAILABILITY) {
	cases.push(stateCase('is_available', name, { day: 10 }, [car],
		(s, c) => isAvailable(s, c)));
}

emitCases('carstats', cases);
