// Tests for auction bidding, consigning and the auction-day visit
// (DESIGN.md section 4.10, card W38), run under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { initShop } from '../src/sim/shop.js';
import { prepareAuction, consignCar, unconsign, bidStep, minBid, placeBid, attendAuction } from '../src/sim/auction.js';
import { test, eq, ok, done } from './harness.js';

// A fresh state with the shop and the month-one auction already set up,
// as a player's first morning would look.
function fresh(seed) {
	const state = newGameState(seed);
	initShop(state);
	prepareAuction(state);
	return state;
}

// An owned car in the stable, made by hand so tests stay deterministic.
function ownCar(state, modelId, condition) {
	const car = {
		id: 'c' + state.nextId++,
		modelId: modelId,
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: 1000,
		condition: condition,
		fault: null,
		lastServiceDay: state.day,
		jobsDone: 0,
		boughtDay: state.day,
		impoundedUntil: 0,
		rentedAtCondition: null,
	};
	state.cars.push(car);
	return car;
}

// A rented car in the stable (owned: false), for refusal tests.
function rentedCar(state, modelId, condition) {
	const car = ownCar(state, modelId, condition);
	car.owned = false;
	car.owner = 'A. Motorist';
	car.rentMonthly = 500;
	car.rentedAtCondition = condition;
	return car;
}

// A hand-made lot with the given reserve and ceilings, plus real fields.
function handLot(state, lotId, opts) {
	const lot = {
		lotId: lotId,
		modelId: 't1_maurice',
		condition: 5.0,
		reserve: opts.reserve,
		revealCount: 0,
		revealed: { desirability: false, maintenance: false, reliability: false, condition: false },
		currentBid: opts.currentBid || 0,
		leader: opts.leader || 'house',
		ceilings: opts.ceilings,
	};
	state.auction.lots.push(lot);
	return lot;
}

// --- consignCar ---

test('consignCar refused on auction day', () => {
	const state = fresh(1);
	const car = ownCar(state, 't2_serious', 8.0);
	state.day = 24;
	const res = consignCar(state, car.id, 5000);
	eq(res.ok, false, 'refused on auction day');
	eq(state.auction.consigned.length, 0, 'nothing consigned');
	eq(state.day, 24, 'no day passed');
	eq(state.cars.length, 1, 'car still in the garage');
});

test('consignCar accepted on day 20, no day passes', () => {
	const state = fresh(2);
	const car = ownCar(state, 't2_serious', 6.0);
	state.day = 20;
	const res = consignCar(state, car.id, 5000);
	eq(res.ok, true, 'accepted before auction day');
	eq(state.day, 20, 'no day passed');
	eq(state.auction.consigned.length, 1, 'one entry');
	eq(state.auction.consigned[0].carId, car.id, 'right car id');
	eq(state.auction.consigned[0].reserve, 5000, 'right reserve');
	eq(state.cars.length, 1, 'car still in the garage until the sale');
});

test('consignCar duplicate refused', () => {
	const state = fresh(3);
	const car = ownCar(state, 't1_maurice', 5.0);
	eq(consignCar(state, car.id, 100).ok, true, 'first consign ok');
	const res = consignCar(state, car.id, 200);
	eq(res.ok, false, 'duplicate refused');
	eq(state.auction.consigned.length, 1, 'still one entry');
	eq(state.auction.consigned[0].reserve, 100, 'original reserve kept');
});

test('consignCar refuses rented cars and junk input', () => {
	const state = fresh(2);
	const rent = rentedCar(state, 't2_serious', 7.0);
	eq(consignCar(state, rent.id, 1000).ok, false, 'rented car refused');
	const owned = ownCar(state, 't1_maurice', 5.0);
	eq(consignCar(state, 'c999', 1000).ok, false, 'unknown car refused');
	for (const bad of [-1, 1.5, '1000', null, undefined, NaN]) {
		eq(consignCar(state, owned.id, bad).ok, false, 'bad reserve refused: ' + String(bad));
	}
	eq(state.auction.consigned.length, 0, 'nothing consigned');
	eq(consignCar(state, owned.id, 0).ok, true, 'reserve 0 is allowed');
});

test('unconsign removes the entry, refused when absent', () => {
	const state = fresh(3);
	const car = ownCar(state, 't1_maurice', 5.0);
	eq(unconsign(state, car.id).ok, false, 'not consigned yet');
	eq(consignCar(state, car.id, 750).ok, true, 'consigned');
	eq(state.day, 1, 'no day passed by either');
	const res = unconsign(state, car.id);
	eq(res.ok, true, 'unconsign ok');
	eq(state.auction.consigned.length, 0, 'entry gone');
	eq(unconsign(state, car.id).ok, false, 'second unconsign refused');
});

// --- bidStep and minBid ---

test('bidStep and minBid exact on hand-made lots', () => {
	eq(bidStep({ reserve: 10000, currentBid: 0 }), 500, '5% of 10000 rounded to 10 -> 500');
	eq(bidStep({ reserve: 400, currentBid: 0 }), 50, 'small reserve floors at 50');
	eq(bidStep({ reserve: 0, currentBid: 0 }), 50, 'zero reserve floors at 50');
	eq(minBid({ reserve: 10000, currentBid: 0, leader: 'house' }), 10000, 'no bids yet: minBid is the reserve');
	eq(minBid({ reserve: 400, currentBid: 0, leader: 'house' }), 400, 'no bids yet, small reserve');
	eq(minBid({ reserve: 10000, currentBid: 10000, leader: 'ai' }), 10500, 'after a bid: minBid is currentBid + step');
});

// --- placeBid ---

test('placeBid refused off auction day', () => {
	const state = fresh(4);
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [999999, 1, 1] });
	const res = placeBid(state, lot.lotId, 1);
	eq(res.ok, false, 'refused off auction day');
	eq(lot.currentBid, 0, 'lot untouched');
	eq(lot.leader, 'house', 'lot untouched');
});

test('placeBid refuses steps other than 1 or 3', () => {
	const state = fresh(5);
	state.day = 24;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [999999, 1, 1] });
	for (const bad of [0, 2, -1, 1.5, '1', null, undefined]) {
		eq(placeBid(state, lot.lotId, bad).ok, false, 'bad steps refused: ' + String(bad));
	}
	eq(lot.currentBid, 0, 'lot untouched');
});

test('placeBid refuses unknown lots and short cash', () => {
	const state = fresh(6);
	state.day = 24;
	handLot(state, 'A1', { reserve: 5000, ceilings: [999999, 1, 1] });
	eq(placeBid(state, 'A999', 1).ok, false, 'unknown lot refused');
	const cash = state.cash;
	state.cash = 100;
	const lot = state.auction.lots[0];
	eq(placeBid(state, lot.lotId, 1).ok, false, 'short cash refused');
	eq(state.cash, 100, 'cash unchanged');
	eq(lot.currentBid, 0, 'lot untouched');
	eq(cash > 0, true, 'sanity: started with cash');
});

test('placeBid refuses when already leading', () => {
	const state = fresh(7);
	state.day = 24;
	state.cash = 999999;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	eq(placeBid(state, lot.lotId, 1).ok, true, 'first bid leads');
	eq(lot.leader, 'player', 'player leads');
	const res = placeBid(state, lot.lotId, 1);
	eq(res.ok, false, 'second bid refused');
	eq(res.msg, 'You are already winning', 'message: ' + res.msg);
	eq(lot.currentBid, 5000, 'bid unchanged');
});

test('placeBid: all ceilings below the bid -> player leads at bid', () => {
	const state = fresh(8);
	state.day = 24;
	state.cash = 999999;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	const res = placeBid(state, lot.lotId, 1);
	eq(res.ok, true, 'bid accepted');
	eq(res.outbid, false, 'not outbid');
	eq(lot.currentBid, 5000, 'player leads at the minimum bid');
	eq(lot.leader, 'player', 'leader is player');
	eq(state.cash, 999999, 'no cash moves until the visit');
	eq(state.day, 24, 'no day passes');
});

test('placeBid: huge ceiling -> AI outbids by one step', () => {
	const state = fresh(9);
	state.day = 24;
	state.cash = 999999;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [999999, 1, 1] });
	const res = placeBid(state, lot.lotId, 1);
	eq(res.ok, true, 'bid accepted');
	eq(res.outbid, true, 'outbid flag set');
	eq(lot.leader, 'ai', 'leader is ai');
	eq(lot.currentBid, 5250, 'AI pays bid + one step (5000 + 250)');
});

test('placeBid steps 3 bids three steps above the minimum', () => {
	const state = fresh(10);
	state.day = 24;
	state.cash = 999999;
	const low = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	const res = placeBid(state, low.lotId, 3);
	eq(res.ok, true, 'three-step bid accepted');
	eq(low.currentBid, 5500, 'player leads at minBid + 2 steps (5000 + 500)');
	eq(low.leader, 'player', 'leader is player');

	const high = handLot(state, 'A2', { reserve: 8000, ceilings: [999999, 1, 1] });
	const res2 = placeBid(state, high.lotId, 3);
	eq(res2.outbid, true, 'AI answers a three-step bid');
	eq(high.currentBid, 9200, 'AI pays 8000 + 3 * 400');
});

test('placeBid slot limit counts leading lots', () => {
	const state = fresh(11);
	state.day = 24;
	state.cash = 999999;
	state.garageSlots = 3;
	ownCar(state, 't1_maurice', 5.0);
	ownCar(state, 't1_volksbeagle', 5.0);
	const a = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	const b = handLot(state, 'A2', { reserve: 5000, ceilings: [1, 1, 1] });
	eq(placeBid(state, a.lotId, 1).ok, true, 'first bid ok (2 cars, 1 slot free)');
	eq(a.leader, 'player', 'player leads lot A1');
	const res = placeBid(state, b.lotId, 1);
	eq(res.ok, false, 'second leading lot refused: garage full');
	eq(b.currentBid, 0, 'lot B untouched');
});

// --- attendAuction ---

test('attendAuction refused off auction day', () => {
	const state = fresh(12);
	const res = attendAuction(state);
	eq(res.ok, false, 'refused off auction day');
	eq(state.day, 1, 'no day passed');
	eq(state.auction.lots.length, 6, 'lots untouched');
});

test('attendAuction refused twice on the same day', () => {
	const state = fresh(13);
	state.day = 24;
	state.auction.lots = [];
	const first = attendAuction(state);
	eq(first.ok, true, 'first visit ok');
	eq(state.day, 25, 'the day advanced');
	state.day = 24; // force the guard: same calendar day again
	const second = attendAuction(state);
	eq(second.ok, false, 'second visit on the same day refused');
	eq(state.day, 24, 'refused visit passes no day');
});

test('attendAuction settles a winning player lot', () => {
	const state = fresh(14);
	state.day = 24;
	state.cash = 999999;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	eq(placeBid(state, lot.lotId, 1).ok, true, 'player leads');
	const res = attendAuction(state);
	eq(res.ok, true, 'visit ok');
	eq(state.day, 25, 'the day advanced by 1');
	eq(state.cars.length, 1, 'the won car is in the garage');
	eq(state.cars[0].modelId, 't1_maurice', 'right model');
	eq(state.cars[0].paid, 5000, 'paid equals the hammer price');
	eq(state.cars[0].owned, true, 'car is owned');
	eq(state.cash, 994999, 'cash reduced by the hammer price');
	eq(state.stats.carsBought, 1, 'carsBought incremented');
	eq(state.auction.lots.length, 0, 'lots emptied');
	ok(state.auction.lastResults.length === 1 && state.auction.lastResults[0].indexOf('You won') === 0,
		'lastResults hold the win: ' + JSON.stringify(state.auction.lastResults));
	ok(state.today.events.indexOf(state.auction.lastResults[0]) !== -1, 'result appears in today.events');
});

test('attendAuction sells a consigned car between 0.85 and 1.25 of value', () => {
	const state = fresh(14);
	state.cash = 10000;
	const car = ownCar(state, 't2_serious', 10);
	eq(consignCar(state, car.id, 0).ok, true, 'consigned with reserve 0');
	state.day = 24;
	const res = attendAuction(state);
	eq(res.ok, true, 'visit ok');
	const price = state.stats.bestAuctionSale;
	ok(price >= Math.round(22000 * 0.85) && price <= Math.round(22000 * 1.25),
		'price ' + price + ' in [18700, 27500]');
	const fee = Math.round(price * 0.08);
	eq(state.cash, 10000 + price - fee, 'cash rises by price minus fee');
	eq(state.stats.carsSold, 1, 'carsSold incremented');
	eq(state.cars.length, 0, 'the car left the garage');
	eq(state.auction.consigned.length, 0, 'consigned emptied');
	ok(state.auction.lastResults[0].indexOf('Sold') === 0, 'sold result: ' + state.auction.lastResults[0]);
	ok(state.today.events.indexOf(state.auction.lastResults[0]) !== -1, 'result appears in today.events');
});

test('attendAuction: unmet reserve keeps the car', () => {
	const state = fresh(15);
	const car = ownCar(state, 't2_serious', 10);
	eq(consignCar(state, car.id, 999999).ok, true, 'consigned with a huge reserve');
	state.day = 24;
	const cash = state.cash;
	const res = attendAuction(state);
	eq(res.ok, true, 'visit ok');
	eq(state.cars.length, 1, 'the car stays');
	eq(state.cars[0].id, car.id, 'the same car');
	eq(state.auction.consigned.length, 0, 'entry removed even when unsold');
	eq(state.cash, cash, 'no money moved');
	eq(state.stats.carsSold, 0, 'carsSold unchanged');
	eq(state.stats.bestAuctionSale, 0, 'bestAuctionSale unchanged');
	ok(state.auction.lastResults[0].indexOf('failed to meet its reserve') !== -1,
		'unsold result: ' + state.auction.lastResults[0]);
});

test('attendAuction: cannot pay for a won lot costs reputation', () => {
	const state = fresh(16);
	state.day = 24;
	state.cash = 999999;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	eq(placeBid(state, lot.lotId, 1).ok, true, 'player leads at 5000');
	state.cash = 3000; // broke again before the hammer falls
	const rep = state.reputation;
	const res = attendAuction(state);
	eq(res.ok, true, 'visit ok');
	eq(state.cars.length, 0, 'no car arrived');
	eq(state.cash, 3000, 'cash untouched');
	eq(state.reputation, Math.max(0, rep - 2), 'reputation dropped by 2, clamped at 0');
	ok(state.auction.lastResults[0].indexOf('could not pay') !== -1,
		'failure result: ' + state.auction.lastResults[0]);
});

test('junk input to consignCar, unconsign and placeBid never changes state', () => {
	const state = fresh(17);
	for (const badId of ['cN', undefined, null, 3, '']) {
		eq(consignCar(state, badId, 100).ok, false, 'bad carId refused: ' + String(badId));
		eq(unconsign(state, badId).ok, false, 'bad unconsign refused: ' + String(badId));
	}
	eq(state.auction.consigned.length, 0, 'nothing consigned');
	state.day = 24;
	eq(placeBid(state, 'ZZZ', 1).ok, false, 'unknown lot refused');
	eq(placeBid(state, undefined, 1).ok, false, 'undefined lotId refused');
	eq(state.auction.lots[0].currentBid, 0, 'lots untouched');
	eq(state.day, 24, 'no day passed');
});

test('attendAuction: a consigned sale frees a slot for a won lot', () => {
	const state = fresh(18);
	state.garageSlots = 2; // bid time: 1 car + 0 leading < 2, so bidding is legal
	const car = ownCar(state, 't1_maurice', 10);
	eq(consignCar(state, car.id, 0).ok, true, 'consigned before auction day');
	state.day = 24;
	state.cash = 999999;
	const lot = handLot(state, 'A1', { reserve: 5000, ceilings: [1, 1, 1] });
	eq(placeBid(state, lot.lotId, 1).ok, true, 'player leads');
	const res = attendAuction(state);
	eq(res.ok, true, 'visit ok');
	// The consigned car sold, so its slot was free for the won lot.
	eq(state.cars.length, 1, 'one car: the won lot');
	eq(state.cars[0].modelId, 't1_maurice', 'the won lot is a t1_maurice');
	ok(state.cars[0].paid === 5000, 'won lot paid the hammer price');
	eq(state.stats.carsSold, 1, 'the consigned car sold');
	eq(state.stats.carsBought, 1, 'the lot was bought');
	ok(res.results.length === 2, 'two results: ' + JSON.stringify(res.results));
});

done();
