// Tests for the money actions (DESIGN.md sections 4.1-4.4), run under
// `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { initShop } from '../src/sim/shop.js';
import { prepareAuction } from '../src/sim/auction.js';
import { CAR_BY_ID } from '../src/data/cars.js';
import { buyCar, rentCar, returnRental, sellToDealer, buySlot, waitDay } from '../src/sim/actions.js';
import { money } from '../src/core/format.js';
import { test, eq, ok, near, done } from './harness.js';

// A fresh state with the shop and the month-one auction already set up,
// as a player's first morning would look.
function fresh(seed) {
	const state = newGameState(seed);
	initShop(state);
	prepareAuction(state);
	return state;
}

// First sale listing in the shop, or null.
function findSale(state) {
	for (let i = 0; i < state.shop.listings.length; i++) {
		if (state.shop.listings[i].mode === 'sale') {
			return state.shop.listings[i];
		}
	}
	return null;
}

// First rent listing in the shop, or null.
function findRent(state) {
	for (let i = 0; i < state.shop.listings.length; i++) {
		if (state.shop.listings[i].mode === 'rent') {
			return state.shop.listings[i];
		}
	}
	return null;
}

// Hand-made sale listing dropped straight onto the board.
function addSaleListing(state, modelId, price, condition) {
	const listing = {
		listingId: 'Lz' + (state.nextId++),
		modelId: modelId,
		mode: 'sale',
		price: price,
		condition: condition,
		owner: null,
		blurb: 'A test listing.',
	};
	state.shop.listings.push(listing);
	return listing;
}

// Hand-made car dropped straight into the stable.
function addCar(state, fields) {
	const car = {
		id: 'c' + (state.nextId++),
		modelId: 't2_serious',
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: 0,
		condition: 10,
		fault: null,
		lastServiceDay: 1,
		jobsDone: 0,
		boughtDay: 1,
		impoundedUntil: 0,
		rentedAtCondition: null,
	};
	for (const k in fields) {
		car[k] = fields[k];
	}
	state.cars.push(car);
	return car;
}

// (a) Buying the first affordable sale listing: exact cash drop, one car,
// listing gone, day advanced, all car fields as specified.
test('buyCar: first affordable sale listing goes through exactly', () => {
	const state = fresh(1);
	const listing = findSale(state);
	ok(listing !== null && listing.price <= state.cash, 'seed 1 has an affordable sale listing');
	const cashBefore = state.cash;
	const r = buyCar(state, listing.listingId);
	ok(r.ok === true, 'buy ok');
	eq(state.cash, cashBefore - listing.price, 'cash drops by exactly the price');
	eq(state.cars.length, 1, 'one car in the garage');
	ok(findListing(state, listing.listingId) === null, 'listing removed from the shop');
	eq(state.day, 2, 'day is 2');
	const car = state.cars[0];
	// Car ids come from the shared state.nextId counter, which initShop and
	// prepareAuction have already advanced, so the first car is never 'c1'.
	ok(/^c\d+$/.test(car.id), 'car id matches /^c\\d+$/');
	eq(car.modelId, listing.modelId, 'car modelId matches listing');
	eq(car.owned, true, 'owned true');
	eq(car.owner, null, 'owner null');
	eq(car.rentMonthly, 0, 'rentMonthly 0');
	eq(car.paid, listing.price, 'paid the listing price');
	eq(car.fault, null, 'fault null');
	eq(car.lastServiceDay, 1, 'lastServiceDay today');
	eq(car.jobsDone, 0, 'jobsDone 0');
	eq(car.boughtDay, 1, 'boughtDay today');
	eq(car.impoundedUntil, 0, 'impoundedUntil 0');
	eq(car.rentedAtCondition, null, 'rentedAtCondition null');
	near(car.condition, listing.condition, 0.05, 'condition starts at the listing value');
	eq(state.stats.carsBought, 1, 'carsBought counted');
	eq(state.today.events[0], r.msg, 'action message leads today.events');
	eq(r.msg, 'Bought the ' + CAR_BY_ID[listing.modelId].name + ' for ' + money(listing.price), 'msg wording');
	ok(r.msg.indexOf('£') !== -1, 'msg shows the price through money()');
	// Two cars bought in a row must get different ids from the counter.
	const spare = addSaleListing(state, 't2_serious', 1, 6.0);
	const r2 = buyCar(state, spare.listingId);
	ok(r2.ok === true, 'second buy ok');
	ok(state.cars[1].id !== car.id, 'two cars bought in a row have different ids');
});

// The listing lookup used by the tests above (local copy, keeps the
// import list to the actions under test).
function findListing(state, listingId) {
	for (let i = 0; i < state.shop.listings.length; i++) {
		if (state.shop.listings[i].listingId === listingId) {
			return state.shop.listings[i];
		}
	}
	return null;
}

// (b) Not enough money: nothing at all changes, not even the day.
test('buyCar with cash 0: refused, state untouched', () => {
	const state = fresh(1);
	const listing = findSale(state);
	state.cash = 0;
	const before = JSON.stringify(state);
	const r = buyCar(state, listing.listingId);
	eq(r.ok, false, 'refused');
	eq(r.msg, 'Not enough money', 'msg says why');
	eq(state.day, 1, 'day still 1');
	eq(state.cars.length, 0, 'no cars');
	ok(findListing(state, listing.listingId) !== null, 'listing still there');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (c) Garage limit: with the slots full, a 4th buy is refused.
test('buyCar with a full garage: refused, day unchanged', () => {
	const state = fresh(2);
	state.cash = 100000;
	for (let i = 0; i < 3; i++) {
		const listing = findSale(state);
		ok(listing !== null, 'sale listing ' + (i + 1) + ' available');
		const r = buyCar(state, listing.listingId);
		ok(r.ok === true, 'buy ' + (i + 1) + ' ok');
	}
	eq(state.cars.length, 3, 'garage now full (3 slots)');
	eq(state.day, 4, 'three buys moved day to 4');
	const spare = addSaleListing(state, 't2_serious', 5000, 6.0);
	const before = JSON.stringify(state);
	const r = buyCar(state, spare.listingId);
	eq(r.ok, false, '4th buy refused');
	eq(r.msg, 'No free garage slot', 'msg says why');
	eq(state.day, 4, 'day unchanged');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (d) Unknown listing ids are refused without touching anything.
test('buyCar and rentCar with an unknown listing id: refused', () => {
	const state = fresh(3);
	const before = JSON.stringify(state);
	const r1 = buyCar(state, 'nope');
	eq(r1.ok, false, 'buyCar refused');
	const r2 = rentCar(state, 'also-nope');
	eq(r2.ok, false, 'rentCar refused');
	eq(state.day, 1, 'day still 1');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (e) Renting: pays the first month up front, car is not owned.
test('rentCar: pays one month, car owned:false with owner and rent', () => {
	const state = fresh(4);
	const listing = findRent(state);
	ok(listing !== null && listing.price <= state.cash, 'seed 4 has an affordable rent listing');
	const cashBefore = state.cash;
	const r = rentCar(state, listing.listingId);
	ok(r.ok === true, 'rent ok');
	eq(state.cash, cashBefore - listing.price, 'cash drops by exactly the first rent');
	eq(state.day, 2, 'day is 2');
	ok(findListing(state, listing.listingId) === null, 'listing removed');
	eq(state.cars.length, 1, 'one car');
	const car = state.cars[0];
	eq(car.owned, false, 'owned false');
	eq(car.owner, listing.owner, 'owner is the listing owner');
	eq(car.rentMonthly, listing.price, 'rentMonthly is the listing price');
	eq(car.paid, 0, 'paid 0');
	eq(car.rentedAtCondition, listing.condition, 'rentedAtCondition recorded');
	near(car.condition, listing.condition, 0.05, 'condition starts at the listing value');
	ok(r.msg.indexOf('Rented the ') === 0 && r.msg.indexOf(listing.owner) !== -1, 'msg names car and owner');
});

// (f) Wrong mode: you cannot buy a rent listing or rent a sale listing.
test('wrong mode on the telly: refused, state untouched', () => {
	const state = fresh(5);
	const rentListing = findRent(state);
	const saleListing = findSale(state);
	const before = JSON.stringify(state);
	const r1 = buyCar(state, rentListing.listingId);
	eq(r1.ok, false, 'buying a rent listing refused');
	const r2 = rentCar(state, saleListing.listingId);
	eq(r2.ok, false, 'renting a sale listing refused');
	eq(state.day, 1, 'day still 1');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (g) Returning a rental with damage: exact fee of 880 for the hand-made
// case (7 -> 5 on a 22000 basePrice car).
test('returnRental: damage fee is exactly 880', () => {
	const state = fresh(5);
	const car = addCar(state, {
		owned: false,
		owner: 'Rev Dawn Patrol',
		rentMonthly: 950,
		condition: 5.0,
		rentedAtCondition: 7.0,
	});
	const cashBefore = state.cash;
	const r = returnRental(state, car.id);
	ok(r.ok === true, 'return ok');
	eq(state.cash, cashBefore - 880, 'cash drops by exactly 880');
	eq(state.cars.length, 0, 'car is gone');
	eq(state.day, 2, 'day is 2');
	ok(r.msg.indexOf('880') !== -1, 'msg mentions the fee');
});

// (h) Returning when the fee is unaffordable: refused, nothing changes.
test('returnRental with no money for the fee: refused, car stays', () => {
	const state = fresh(6);
	const car = addCar(state, {
		owned: false,
		owner: 'Rev Dawn Patrol',
		rentMonthly: 950,
		condition: 5.0,
		rentedAtCondition: 7.0,
	});
	state.cash = 100;
	const before = JSON.stringify(state);
	const r = returnRental(state, car.id);
	eq(r.ok, false, 'refused');
	eq(r.msg, 'Cannot afford the damage fee', 'msg says why');
	eq(state.cars.length, 1, 'car still there');
	eq(state.day, 1, 'day still 1');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (i) Returning with no damage: fee 0, car gone, cash untouched.
test('returnRental with no damage: fee 0, car gone', () => {
	const state = fresh(7);
	const car = addCar(state, {
		owned: false,
		owner: 'Rev Dawn Patrol',
		rentMonthly: 950,
		condition: 7.0,
		rentedAtCondition: 7.0,
	});
	const cashBefore = state.cash;
	const r = returnRental(state, car.id);
	ok(r.ok === true, 'return ok');
	eq(state.cash, cashBefore, 'no fee, cash untouched');
	eq(state.cars.length, 0, 'car is gone');
	eq(state.day, 2, 'day is 2');
	ok(r.msg.indexOf('£0') !== -1, 'msg shows a zero fee');
});

// (j) Selling to the dealer: exact price for t2_serious at condition 10.
test('sellToDealer: t2_serious condition 10 sells for exactly 13200', () => {
	const state = fresh(8);
	const car = addCar(state, { condition: 10.0, paid: 22000 });
	const cashBefore = state.cash;
	const r = sellToDealer(state, car.id);
	ok(r.ok === true, 'sell ok');
	eq(state.cash, cashBefore + 13200, 'cash rises by exactly 13200');
	eq(state.cars.length, 0, 'car is gone');
	eq(state.day, 2, 'day is 2');
	eq(state.stats.carsSold, 1, 'carsSold counted');
	ok(r.msg.indexOf('13,200') !== -1, 'msg mentions the price');
});

// (k) Selling a rented car is refused.
test('sellToDealer on a rented car: refused, nothing changes', () => {
	const state = fresh(9);
	const car = addCar(state, { owned: false, owner: 'Rev Dawn Patrol', rentMonthly: 950, rentedAtCondition: 7.0 });
	const before = JSON.stringify(state);
	const r = sellToDealer(state, car.id);
	eq(r.ok, false, 'refused');
	eq(state.cars.length, 1, 'car still there');
	eq(state.day, 1, 'day still 1');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (l) Selling a consigned car is refused until it is withdrawn.
test('sellToDealer on a consigned car: refused', () => {
	const state = fresh(10);
	const car = addCar(state, { condition: 10.0 });
	state.auction.consigned.push({ carId: car.id, reserve: 15000 });
	const before = JSON.stringify(state);
	const r = sellToDealer(state, car.id);
	eq(r.ok, false, 'refused');
	eq(r.msg, 'Withdraw it from the auction first', 'msg says why');
	eq(state.cars.length, 1, 'car still there');
	eq(state.day, 1, 'day still 1');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (m) Stats counters tick once per successful buy and sell.
test('stats counters: carsBought and carsSold', () => {
	const state = fresh(11);
	state.cash = 100000;
	const listing = findSale(state);
	ok(buyCar(state, listing.listingId).ok === true, 'buy ok');
	eq(state.stats.carsBought, 1, 'carsBought 1');
	eq(state.stats.carsSold, 0, 'carsSold still 0');
	// Never guess the id: it comes from the shared nextId counter.
	const r = sellToDealer(state, state.cars[0].id);
	ok(r.ok === true, 'sell ok');
	eq(state.stats.carsBought, 1, 'carsBought still 1');
	eq(state.stats.carsSold, 1, 'carsSold 1');
});

// (n) buySlot works up to 8 slots, then refuses.
test('buySlot: 3 to 8 slots, then full-size refusal', () => {
	const state = fresh(12);
	state.cash = 20000;
	for (let i = 0; i < 5; i++) {
		const slotsBefore = state.garageSlots;
		const cashBefore = state.cash;
		const r = buySlot(state);
		ok(r.ok === true, 'slot buy ' + (i + 1) + ' ok');
		eq(state.garageSlots, slotsBefore + 1, 'one more slot');
		eq(state.cash, cashBefore - 3000, 'cost exactly 3000');
	}
	eq(state.garageSlots, 8, '8 slots now');
	const dayBefore = state.day;
	const before = JSON.stringify(state);
	const r = buySlot(state);
	eq(r.ok, false, '9th slot refused');
	eq(r.msg, 'Garage is full-size already', 'msg says why');
	eq(state.day, dayBefore, 'day unchanged');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (o) buySlot also needs the money.
test('buySlot with no money: refused', () => {
	const state = fresh(13);
	state.cash = 100;
	const before = JSON.stringify(state);
	const r = buySlot(state);
	eq(r.ok, false, 'refused');
	eq(r.msg, 'Not enough money', 'msg says why');
	eq(JSON.stringify(state), before, 'state deep-equal before and after');
});

// (p) waitDay always works and costs exactly one day.
test('waitDay: kettle on, one day passes', () => {
	const state = fresh(14);
	const r = waitDay(state);
	ok(r.ok === true, 'wait ok');
	eq(r.msg, 'You put the kettle on. Nothing happens. Lovely.', 'msg wording');
	eq(state.day, 2, 'day is 2');
	ok(state.today.events.indexOf(r.msg) !== -1, 'msg in today.events');
});

// (q) Every successful action advances the day by exactly one.
test('each successful action advances the day by exactly 1', () => {
	const state = fresh(15);
	state.cash = 100000;
	const sale = findSale(state);
	ok(buyCar(state, sale.listingId).ok === true, 'buy ok');
	eq(state.day, 2, 'buy advanced 1 day');
	// Never guess ids: track the cars the actions actually created.
	const boughtCar = state.cars[0];
	const rent1 = findRent(state);
	ok(rent1 !== null, 'a rent listing is still there');
	ok(rentCar(state, rent1.listingId).ok === true, 'rent ok');
	eq(state.day, 3, 'rent advanced 1 day');
	const rentalCar = state.cars[state.cars.length - 1];
	const r3 = returnRental(state, rentalCar.id);
	ok(r3.ok === true, 'return ok');
	eq(state.day, 4, 'return advanced 1 day');
	const r4 = sellToDealer(state, boughtCar.id);
	ok(r4.ok === true, 'sell ok');
	eq(state.day, 5, 'sell advanced 1 day');
	const rent2 = findRent(state);
	ok(rent2 !== null, 'another rent listing is there');
	ok(rentCar(state, rent2.listingId).ok === true, 'second rent ok');
	eq(state.day, 6, 'second rent advanced 1 day');
	const rentalCar2 = state.cars[state.cars.length - 1];
	const r6 = returnRental(state, rentalCar2.id);
	ok(r6.ok === true, 'second return ok');
	eq(state.day, 7, 'second return advanced 1 day');
	ok(buySlot(state).ok === true, 'slot ok');
	eq(state.day, 8, 'slot advanced 1 day');
	ok(waitDay(state).ok === true, 'wait ok');
	eq(state.day, 9, 'wait advanced 1 day');
});

// (r) A successful action puts its message into today's events.
test('today.events carries the action message after a success', () => {
	const state = fresh(16);
	const listing = findSale(state);
	const r = buyCar(state, listing.listingId);
	ok(r.ok === true, 'buy ok');
	ok(state.today.events.indexOf(r.msg) !== -1, 'message is in today.events');
});

// (s) Every failed action leaves a deep-equal state, day included.
test('every failed action leaves the state deep-equal', () => {
	const state = fresh(17);
	state.cash = 0;
	const sale = findSale(state);
	const rent = findRent(state);
	ok(sale !== null && rent !== null, 'both listing kinds present');
	const checks = [
		buyCar(state, sale.listingId),
		buyCar(state, 'nope'),
		rentCar(state, rent.listingId),
		rentCar(state, 'nope'),
		returnRental(state, 'nope'),
		sellToDealer(state, 'nope'),
	];
	for (let i = 0; i < checks.length; i++) {
		eq(checks[i].ok, false, 'check ' + i + ' refused');
	}
	eq(state.day, 1, 'day still 1');
	eq(state.cars.length, 0, 'no cars');
	eq(state.cash, 0, 'cash unchanged');
	// Restore the starting cash and compare against a same-seed replay.
	state.cash = 20000;
	const replay = fresh(17);
	eq(JSON.stringify(state), JSON.stringify(replay), 'state equals a same-seed replay');
});

done();
