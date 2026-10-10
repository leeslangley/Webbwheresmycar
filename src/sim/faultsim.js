// Fault roll (DESIGN.md section 4.6). Decides whether a car develops a
// fault, how bad it is and what it costs to fix. `rollFault` does NOT
// modify the car; the caller applies the result with `applyFault`.
// Pure apart from the seeded rng in state and the car passed to applyFault.

import { chance, pick, weighted, roundTo, clamp } from '../core/rng.js';
import { effR } from './carstats.js';
import { faultsOfSeverity, TIER_MULT } from '../data/faults.js';

// Roll for a fault. `mult` scales the chance (month-end uses 0.5, per
// DESIGN.md section 4.6). Returns null when no fault, else
// {faultId, label, cost, severity}.
export function rollFault(state, model, car, mult = 1) {
	const p = clamp(0.02 + (1 - effR(model, car) / 10) * 0.35, 0.02, 0.60) * mult;
	if (!chance(state, p)) {
		return null;
	}
	const c = car.condition;
	const severity = weighted(state, [
		{ w: Math.max(20, 70 - (10 - c) * 5), s: 'minor' },
		{ w: 25 + (10 - c) * 2, s: 'medium' },
		{ w: 5 + (10 - c) * 3, s: 'major' }
	]).s;
	const fault = pick(state, faultsOfSeverity(severity));
	const cost = roundTo(fault.baseCost * TIER_MULT[model.tier], 10);
	return { faultId: fault.id, label: fault.label, cost: cost, severity: severity };
}

// Attach a rolled fault to a car. Copies the fields into a fresh object so
// the car never shares an object with the fault table or the roll result.
export function applyFault(car, fault) {
	car.fault = { faultId: fault.faultId, label: fault.label, cost: fault.cost };
	return car;
}
