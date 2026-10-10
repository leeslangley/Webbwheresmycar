// Customer name lists (DESIGN.md 4.7). Silly British names for the people
// who send booking requests to Webb's Wheels. Pure data plus one
// deterministic builder driven by state.rng.

import { rand, pick } from '../core/rng.js';

// 40 first names, old-fashioned and modern British mixed.
export const FIRST = [
	'Arthur', 'Betty', 'Brian', 'Celia', 'Clive', 'Dennis', 'Doris', 'Eddie',
	'Elsie', 'Frank', 'Gary', 'Gemma', 'Glen', 'Harold', 'Hayley', 'Irene',
	'Janet', 'Jason', 'Jean', 'Julie', 'Keith', 'Kevin', 'Kyle', 'Linda',
	'Malcolm', 'Megan', 'Nigel', 'Olivia', 'Pam', 'Peter', 'Reg', 'Rita',
	'Sharon', 'Sheila', 'Sid', 'Stan', 'Tracey', 'Trevor', 'Wayne', 'Wendy'
];

// 40 surnames, at least 10 of them amusing.
export const LAST = [
	'Crumpet', 'Bottomley', 'Sprocket', 'Noseworthy', 'Turnipseed', 'Pigden',
	'Fernsby', 'Cogsworthy', 'Muddiman', 'Beetlestone', 'Pumphrey', 'Prong',
	'Smith', 'Jones', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Evans',
	'Clarke', 'Wright', 'Hughes', 'Baker', 'Green', 'Hall', 'Wood',
	'Watson', 'Patel', 'Bennett', 'Gray', 'Rose', 'Hunt', 'Ward', 'Turner',
	'Phillips', 'Foster', 'Marsh', 'Doyle', 'Kane', 'Lane'
];

export const PREFIX = ['Mr', 'Mrs', 'Ms', 'Dr', 'Sir', 'Lady', 'Captain', 'Reverend'];

// 60% "First Last", 25% "Prefix Last", 15% "The Last Family".
// One rand decides the branch; each branch then picks first before last.
export function customerName(state) {
	const r = rand(state);
	if (r < 0.60) {
		return pick(state, FIRST) + ' ' + pick(state, LAST);
	}
	if (r < 0.85) {
		return pick(state, PREFIX) + ' ' + pick(state, LAST);
	}
	return 'The ' + pick(state, LAST) + ' Family';
}
