// Car stats and condition maths (DESIGN.md section 4.3). A `model` is a
// catalogue entry (data/cars.js); a `car` is a stable instance with a
// numeric `condition` (0-10). Pure: no DOM, no randomness, no dates.

import { roundTo, clamp } from '../core/rng.js';

// Effective desirability: condition 10 -> D, condition 0 -> 0.4 * D.
export function effD(model, car) {
	return model.desirability * (0.40 + 0.06 * car.condition);
}

// Effective reliability: condition 10 -> R, condition 0 -> 0.3 * R.
export function effR(model, car) {
	return model.reliability * (0.30 + 0.07 * car.condition);
}

// Maintenance multiplier: condition 10 -> x1.0, condition 0 -> x1.8.
export function maintMult(car) {
	return 1 + (10 - car.condition) * 0.08;
}

// Value factor: condition 10 -> x1.0, condition 0 -> x0.5. Works on any
// object carrying a `condition` (a stable car or a shop listing).
export function valueFactor(car) {
	return 0.50 + 0.05 * car.condition;
}

// Market value of a car, rounded to the nearest pound.
export function marketValue(state, model, car) {
	return Math.round(model.basePrice * valueFactor(car) * state.market.priceMult);
}

// Monthly running cost of an owned car, rounded to the nearest pound.
export function runningCost(model, car) {
	return Math.round(model.maintenance * (60 + model.basePrice * 0.0025) * maintMult(car));
}

// Daily condition loss for an idle car, driven by the model's reliability.
export function idleDecay(model) {
	return 0.01 + (10 - model.reliability) * 0.002;
}

// Apply a condition delta, rounded to 0.01 and clamped to 0-10. Mutates
// the car and returns the new condition.
export function changeCondition(car, delta) {
	car.condition = clamp(roundTo(car.condition + delta, 0.01), 0, 10);
	return car.condition;
}

// A car is available when it has no fault and is not impounded.
export function isAvailable(state, car) {
	return car.fault === null && (car.impoundedUntil || 0) <= state.day;
}
