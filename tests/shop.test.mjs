// Tests for the TV shop listings, run under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { initShop, refreshShop, shouldRefresh, makeListing } from '../src/sim/shop.js';
import { CAR_BY_ID } from '../src/data/cars.js';
import { valueFactor } from '../src/sim/carstats.js';
import { test, eq, ok, done } from './harness.js';

// Condition with at most one decimal place (float-safe check).
function oneDecimal(c) {
	return Math.abs(c * 10 - Math.round(c * 10)) < 1e-9;
}

function noDuplicateModels(listings) {
	const seen = {};
	for (let i = 0; i < listings.length; i++) {
		if (seen[listings[i].modelId]) {
			return false;
		}
		seen[listings[i].modelId] = true;
	}
	return true;
}

// Check one whole shop board against the card's rules.
function checkBoard(state, label) {
	const listings = state.shop.listings;
	ok(listings.length === 8, label + ': 8 listings');
	ok(noDuplicateModels(listings), label + ': no duplicate modelIds');
	let sales = 0;
	let cheapSales = 0;
	let rents = 0;
	let poshRents = 0;
	for (let i = 0; i < listings.length; i++) {
		const l = listings[i];
		ok(l.listingId.charAt(0) === 'L', label + ': listingId starts with L');
		ok(l.mode === 'sale' || l.mode === 'rent', label + ': mode is sale or rent');
		ok(Number.isInteger(l.price) && l.price > 0, label + ': price is a positive integer');
		ok(l.condition >= 3.0 && l.condition <= 8.0 && oneDecimal(l.condition), label + ': condition 3.0-8.0, 1 decimal');
		if (l.mode === 'sale') {
			sales += 1;
			if (l.price <= 14000) {
				cheapSales += 1;
			}
			eq(l.owner, null, label + ': sale listing has owner null');
		} else {
			rents += 1;
			ok(typeof l.owner === 'string' && l.owner.length > 0, label + ': rent listing has a string owner');
			if (CAR_BY_ID[l.modelId].tier >= 2) {
				poshRents += 1;
			}
		}
	}
	ok(sales >= 3 && cheapSales >= 3, label + ': at least 3 sale listings priced <= 14000');
	ok(rents >= 2 && poshRents >= 2, label + ': at least 2 rent listings of tier 2+');
}

test('initShop boards over seeds 1..50 meet all the rules', () => {
	for (let seed = 1; seed <= 50; seed++) {
		const state = newGameState(seed);
		initShop(state);
		checkBoard(state, 'seed ' + seed);
	}
});

test('initShop sets refreshedDay to state.day', () => {
	const state = newGameState(7);
	state.day = 5;
	initShop(state);
	eq(state.shop.refreshedDay, 5, 'refreshedDay follows day');
});

test('sale price sits in the 0.9-1.1 band around round(basePrice * valueFactor)', () => {
	for (let seed = 1; seed <= 10; seed++) {
		const state = newGameState(seed);
		initShop(state);
		for (let i = 0; i < state.shop.listings.length; i++) {
			const l = state.shop.listings[i];
			if (l.mode !== 'sale') {
				continue;
			}
			const expected = Math.round(CAR_BY_ID[l.modelId].basePrice * valueFactor({ condition: l.condition }));
			ok(l.price >= expected * 0.9 - 1 && l.price <= expected * 1.1 + 1,
				'seed ' + seed + ' sale price band for ' + l.modelId);
		}
	}
});

test('rent price sits in the 0.9-1.1 band around baseRent', () => {
	for (let seed = 1; seed <= 10; seed++) {
		const state = newGameState(seed);
		initShop(state);
		for (let i = 0; i < state.shop.listings.length; i++) {
			const l = state.shop.listings[i];
			if (l.mode !== 'rent') {
				continue;
			}
			const baseRent = CAR_BY_ID[l.modelId].baseRent;
			ok(l.price >= baseRent * 0.9 - 1 && l.price <= baseRent * 1.1 + 1,
				'seed ' + seed + ' rent price band for ' + l.modelId);
		}
	}
});

test('shouldRefresh is true on day 8, 15, 22 and false on 1, 7, 9', () => {
	eq(shouldRefresh(1), false, 'day 1');
	eq(shouldRefresh(7), false, 'day 7');
	eq(shouldRefresh(8), true, 'day 8');
	eq(shouldRefresh(9), false, 'day 9');
	eq(shouldRefresh(15), true, 'day 15');
	eq(shouldRefresh(22), true, 'day 22');
});

test('refreshShop keeps 8 listings, unique models, and sets refreshedDay', () => {
	const state = newGameState(3);
	initShop(state);
	state.day = 8;
	refreshShop(state);
	checkBoard(state, 'after refresh');
	eq(state.shop.refreshedDay, 8, 'refreshedDay updated');
});

test('refreshShop changes at least one listing id', () => {
	const state = newGameState(4);
	initShop(state);
	const before = {};
	for (let i = 0; i < state.shop.listings.length; i++) {
		before[state.shop.listings[i].listingId] = true;
	}
	refreshShop(state);
	let changed = 0;
	for (let i = 0; i < state.shop.listings.length; i++) {
		if (!before[state.shop.listings[i].listingId]) {
			changed += 1;
		}
	}
	ok(changed >= 1, 'at least one new listing id after refresh');
});

test('listingIds stay unique across 20 refreshes', () => {
	const state = newGameState(5);
	initShop(state);
	const ids = {};
	for (let i = 0; i < state.shop.listings.length; i++) {
		ids[state.shop.listings[i].listingId] = true;
	}
	for (let r = 0; r < 20; r++) {
		state.day += 1;
		const before = {};
		for (let i = 0; i < state.shop.listings.length; i++) {
			before[state.shop.listings[i].listingId] = true;
		}
		refreshShop(state);
		ok(state.shop.listings.length === 8, 'still 8 listings at refresh ' + (r + 1));
		for (let i = 0; i < state.shop.listings.length; i++) {
			const id = state.shop.listings[i].listingId;
			if (before[id]) {
				continue; // a surviving listing keeps its id
			}
			ok(!ids[id], 'listingId ' + id + ' is never reused (refresh ' + (r + 1) + ')');
			ids[id] = true;
		}
	}
});

test('makeListing with a maxPrice never exceeds it over 100 calls', () => {
	for (let seed = 1; seed <= 100; seed++) {
		const state = newGameState(seed);
		const l = makeListing(state, { mode: 'sale', maxPrice: 6000 });
		ok(l.mode === 'sale', 'mode forced to sale');
		ok(l.price <= 6000, 'seed ' + seed + ': price ' + l.price + ' <= 6000');
	}
});

test('makeListing honours forced mode and tier', () => {
	for (let seed = 1; seed <= 20; seed++) {
		const state = newGameState(seed);
		const l = makeListing(state, { mode: 'rent', tier: 3 });
		eq(l.mode, 'rent', 'rent mode');
		eq(CAR_BY_ID[l.modelId].tier, 3, 'tier 3 model');
		ok(l.condition >= 3.0 && l.condition <= 7.0, 'tier 3 condition tops out at 7.0');
		ok(typeof l.owner === 'string', 'rent listing has an owner');
	}
});

test('makeListing excludes models it is told to exclude', () => {
	const state = newGameState(6);
	const exclude = ['t1_allergy', 't1_robbin', 't1_chimp'];
	for (let i = 0; i < 20; i++) {
		const l = makeListing(state, { tier: 1, excludeModelIds: exclude.slice() });
		ok(exclude.indexOf(l.modelId) === -1, 'excluded model ' + l.modelId + ' not used');
	}
});

test('makeListing throws when nothing fits', () => {
	const state = newGameState(8);
	// Exclude every tier 1 car while forcing tier 1: no candidates exist.
	const exclude = [];
	for (const id in CAR_BY_ID) {
		if (CAR_BY_ID[id].tier === 1) {
			exclude.push(id);
		}
	}
	let threw = null;
	try {
		makeListing(state, { mode: 'sale', tier: 1, excludeModelIds: exclude });
	} catch (e) {
		threw = e;
	}
	ok(threw !== null && threw.message === 'makeListing: no car fits', 'throws makeListing: no car fits');
});

test('same seed gives the same shop, different seed differs', () => {
	const a = newGameState(42);
	initShop(a);
	const b = newGameState(42);
	initShop(b);
	const c = newGameState(43);
	initShop(c);
	eq(JSON.stringify(a.shop), JSON.stringify(b.shop), 'same seed, same shop');
	ok(JSON.stringify(a.shop) !== JSON.stringify(c.shop), 'different seed, different shop');
});

done();
