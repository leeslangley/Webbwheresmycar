// Owner names for rented cars (DESIGN.md 4.4). Affectionate British
// slapstick: the people Webb's Wheels hires cars from. No real people.

import { pick } from '../core/rng.js';

export const OWNERS = [
	'Big Baz from the Boot Fair',
	'Maureen "The Key" Collymore',
	'Tarquin Bellingham-Hogg III',
	'Nan Nora of Netherbottom',
	'Colin Prong (semi-retired)',
	'Mrs. Prunella Wildgoose-Bath',
	"Terry 'Tomcat' Turvey",
	'Sister Bernadette Brakelight',
	'Uncle Wobbly (cars are his life)',
	'Petunia Grubb of the Co-op',
	'Sir Roderick Klaxon',
	'Brenda from Bus Stop Five',
	"Chalky White's Nephew Nigel",
	'Madge Coldwell (won it in a raffle)',
	'Reginald "Two Keys" Prewitt',
	'Doris Crankshaw and her Cats',
	'Vernon Onions (vehicle historian)',
	'Grandad Ted, 40 years motoring',
	'Fiona Biggs-Heywood (Esq.)',
	'Nobby Holdsworth (self-employed)',
	'The Widow Two-Carriage',
	'Barry "Brakes" Bedworth',
	'Auntie Jean and the Morris',
	'WPC Sandra Sump (retired)'
];

export function ownerName(state) {
	return pick(state, OWNERS);
}
