// Car catalogue aggregator: joins the three tiers into one lookup.
// Pure data module: no DOM, no randomness, no dates (DESIGN.md section 9.1).

import { CARS_T1 } from './cars_t1.js';
import { CARS_T2 } from './cars_t2.js';
import { CARS_T3 } from './cars_t3.js';

// All 31 catalogue cars, tier 1 then tier 2 then tier 3 (DESIGN.md section 6).
export const CARS = CARS_T1.concat(CARS_T2, CARS_T3);

// Quick lookup by id. Built once here so callers never re-scan the array.
export const CAR_BY_ID = {};
for (let i = 0; i < CARS.length; i++) {
	CAR_BY_ID[CARS[i].id] = CARS[i];
}

// The 13 archetypes the parametric car drawer must support (DESIGN.md section 6).
export const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe', 'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

// Returns the model object for a car id, or throws on an unknown id.
export function modelOf(id) {
	if (!Object.prototype.hasOwnProperty.call(CAR_BY_ID, id)) {
		throw new Error('unknown model ' + id);
	}
	return CAR_BY_ID[id];
}
