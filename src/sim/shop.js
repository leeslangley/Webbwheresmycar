// TV shop listings (DESIGN.md section 4.4). The telly in Webb's office
// scrolls eight motors for sale or rent, refreshed every seven days.
// Pure sim module: randomness only through state.rng, no DOM, no dates.

import { rand, randInt, chance, pick, weighted, roundTo } from '../core/rng.js';
import { CARS } from '../data/cars.js';
import { valueFactor } from './carstats.js';
import { ownerName } from '../data/owners.js';

// Sales patter shown under each listing. Affectionate British nonsense;
// the cars really are mostly terrible.
const BLURBS = [
	'One careful owner and four careless ones.',
	'Starts first time. Every other time is the problem.',
	'Smells faintly of chips and victory.',
	'Drives beautifully downhill.',
	'Only driven to church by a nun. Allegedly.',
	'The radio only gets one station. You will grow to love it.',
	'Passed its last test with a note from its mum.',
	'Goes from nought to sixty eventually.',
	'Handy little runabout. "Handy" being generous.',
	'For sale because the taxi rank said no.',
];

// Pick the catalogue cars of one tier that are not excluded.
function tierCandidates(tier, excludeModelIds) {
	const out = [];
	for (let i = 0; i < CARS.length; i++) {
		if (CARS[i].tier === tier && excludeModelIds.indexOf(CARS[i].id) === -1) {
			out.push(CARS[i]);
		}
	}
	return out;
}

// Build one shop listing, drawing in the DESIGN.md 4.4 order. When
// `opts.maxPrice` is set the price must fit, so the whole pick is retried
// (tier included, so a priced-out tier cannot doom the draw) up to 20 times.
export function makeListing(state, opts = {}) {
	const mode = opts.mode || (chance(state, 0.6) ? 'sale' : 'rent');
	const excludeModelIds = opts.excludeModelIds || [];
	const maxPrice = opts.maxPrice;

	for (let attempt = 0; attempt < 20; attempt++) {
		const tier = opts.tier || weighted(state, [
			{ tier: 1, w: 50 },
			{ tier: 2, w: 35 },
			{ tier: 3, w: 15 },
		]).tier;
		const candidates = tierCandidates(tier, excludeModelIds);
		if (candidates.length === 0) {
			continue;
		}
		const model = pick(state, candidates);
		const top = tier === 3 ? 7.0 : 8.0;
		const condition = roundTo(3.0 + rand(state) * (top - 3.0), 0.1);
		const price = mode === 'sale'
			? Math.round(model.basePrice * valueFactor({ condition: condition }) * state.market.priceMult * (0.9 + 0.2 * rand(state)))
			: Math.round(model.baseRent * (0.9 + 0.2 * rand(state)));
		if (maxPrice !== undefined && price > maxPrice) {
			continue;
		}
		return {
			listingId: 'L' + state.nextId++,
			modelId: model.id,
			mode: mode,
			price: price,
			condition: condition,
			owner: mode === 'rent' ? ownerName(state) : null,
			blurb: pick(state, BLURBS),
		};
	}
	throw new Error('makeListing: no car fits');
}

// Fill the shop with its opening eight: three cheap sales, two posh
// rentals, then three anything-goes. No two listings share a model.
export function initShop(state) {
	state.shop.listings = [];
	const excludeModelIds = [];
	for (let i = 0; i < 3; i++) {
		const listing = makeListing(state, { mode: 'sale', tier: 1, maxPrice: 14000, excludeModelIds: excludeModelIds });
		excludeModelIds.push(listing.modelId);
		state.shop.listings.push(listing);
	}
	for (let i = 0; i < 2; i++) {
		const listing = makeListing(state, { mode: 'rent', tier: randInt(state, 2, 3), excludeModelIds: excludeModelIds });
		excludeModelIds.push(listing.modelId);
		state.shop.listings.push(listing);
	}
	for (let i = 0; i < 3; i++) {
		const listing = makeListing(state, { excludeModelIds: excludeModelIds });
		excludeModelIds.push(listing.modelId);
		state.shop.listings.push(listing);
	}
	state.shop.refreshedDay = state.day;
}

// Listings refresh every 7 days (day % 7 === 1, but never on day 1).
export function shouldRefresh(day) {
	return day > 1 && day % 7 === 1;
}

// Swap out 1-3 random listings for the same number of fresh ones, keeping
// the board the same size and free of duplicate models.
export function refreshShop(state) {
	const listings = state.shop.listings;
	// Never try to remove more than the board holds, so the length always
	// comes back to exactly what it was (bought-off listings shrink it).
	const n = Math.min(randInt(state, 1, 3), listings.length);
	for (let i = 0; i < n; i++) {
		listings.splice(randInt(state, 0, listings.length - 1), 1);
	}
	const excludeModelIds = [];
	for (let i = 0; i < listings.length; i++) {
		excludeModelIds.push(listings[i].modelId);
	}
	for (let i = 0; i < n; i++) {
		const listing = makeListing(state, { excludeModelIds: excludeModelIds });
		excludeModelIds.push(listing.modelId);
		listings.push(listing);
	}
	state.shop.refreshedDay = state.day;
}
