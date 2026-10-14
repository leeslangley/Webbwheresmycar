// Golden fixture for godot/sim/faultsim.gd (GDS04): runs src/sim/faultsim.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh faultsim   (writes godot/tests/golden/faultsim.json)

import { modelOf } from '../../src/data/cars.js';
import { rollFault, applyFault } from '../../src/sim/faultsim.js';
import { clone, pureCase, stateCase, emitCases } from './golden_sim.mjs';

const MODELS = ['t1_allergy', 't2_serious', 't3_porshe'];
const CONDS = [2, 6, 9.5];

const cases = [];
const kinds = { minor: 0, medium: 0, major: 0 };
let nonNull = 0;

function rollCase(m, c, seed, mult, tag) {
	const name = m + ' c' + c + ' seed' + seed + ' ' + tag;
	const k = stateCase('roll_fault', name, { rng: seed }, [m, c, mult],
		(st, mm, cc, mu) => rollFault(st, modelOf(mm), { condition: cc }, mu));
	cases.push(k);
	if (k.result !== null) {
		nonNull++;
		kinds[k.result.severity]++;
	}
}

for (const m of MODELS) {
	for (const c of CONDS) {
		for (let seed = 1; seed <= 30; seed++) {
			rollCase(m, c, seed, 1, 'x1');
		}
	}
}

for (const m of MODELS) {
	for (const c of CONDS) {
		for (let seed = 1; seed <= 10; seed++) {
			rollCase(m, c, seed, 0.5, 'x0.5');
		}
	}
}

if (nonNull < 40) {
	throw new Error('faultsim golden: only ' + nonNull + ' non-null rolls');
}
for (const sev of ['minor', 'medium', 'major']) {
	if (kinds[sev] === 0) {
		throw new Error('faultsim golden: no ' + sev + ' roll');
	}
}

function applyCase(name, car, fault) {
	const car2 = clone(car);
	const after = applyFault(car2, fault);
	cases.push(pureCase('apply_fault', name, [car, fault], after));
}

applyCase('free car, minor fault', { id: 'c1', condition: 5, fault: null },
	{ faultId: 'puncture', label: 'Puncture', cost: 90, severity: 'minor' });
applyCase('replaces an old fault with medium', { id: 'c1', condition: 5, fault: { faultId: 'puncture', label: 'Puncture', cost: 90 } },
	{ faultId: 'clutch', label: 'Slipping clutch', cost: 400, severity: 'medium' });
applyCase('replaces an old fault with major', { id: 'c1', condition: 5, fault: { faultId: 'puncture', label: 'Puncture', cost: 90 } },
	{ faultId: 'gearbox', label: 'Gearbox exploded', cost: 3200, severity: 'major' });

emitCases('faultsim', cases);
