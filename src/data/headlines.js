// Daily Sprocket headline aggregator (DESIGN.md 8.4). Joins the four
// headline pools into two combined arrays and re-exports the reactive
// templates so callers only import this one module. Pure data, no
// randomness (DESIGN.md 9.1).

import { HEADLINES_GENERIC_A } from './headlines_generic_a.js';
import { HEADLINES_GENERIC_B } from './headlines_generic_b.js';
import { HEADLINES_CARWORLD_A } from './headlines_carworld_a.js';
import { HEADLINES_CARWORLD_B } from './headlines_carworld_b.js';
import { REACTIVE } from './headlines_reactive.js';

// Generic pool: nonsense news, generic_a then generic_b (80 strings).
export const GENERIC = HEADLINES_GENERIC_A.concat(HEADLINES_GENERIC_B);

// Carworld pool: classic-car silliness, carworld_a then carworld_b
// (60 strings).
export const CARWORLD = HEADLINES_CARWORLD_A.concat(HEADLINES_CARWORLD_B);

// Reactive templates keyed by game situation (DESIGN.md 9.4).
export { REACTIVE };
