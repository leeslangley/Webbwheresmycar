// The money actions (DESIGN.md sections 4.1, 4.2, 4.3, 4.4): buying,
// renting, returning a rental, selling to a dealer, buying a garage slot
// and waiting a day. Every action returns {ok, msg}: on failure nothing
// changes at all; on success a note goes into state.pending and the day
// clock moves on exactly once, as the very last step. Pure sim module:
// randomness only through state.rng, no DOM, no dates.

import { roundTo } from '../core/rng.js';
import { money } from '../core/format.js';
import { modelOf } from '../data/cars.js';
import { marketValue } from './carstats.js';
import { advanceDay } from './advance.js';

const SLOT_COST = 3000;
const MAX_SLOTS = 8;
const DEALER_CUT = 0.6;

// Find a shop listing by id, or null.
function findListing(state, listingId) {
	const listings = state.shop.listings;
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].listingId === listingId) {
			return listings[i];
		}
	}
	return null;
}

// Find a car in the stable by id, or null.
function findCar(state, carId) {
	const cars = state.cars;
	for (let i = 0; i < cars.length; i++) {
		if (cars[i].id === carId) {
			return cars[i];
		}
	}
	return null;
}

// Remove one listing by id. Returns true if it was there.
function removeListing(state, listingId) {
	const listings = state.shop.listings;
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].listingId === listingId) {
			listings.splice(i, 1);
			return true;
		}
	}
	return false;
}

// Remove one car by id. Returns true if it was there.
function removeCar(state, carId) {
	const cars = state.cars;
	for (let i = 0; i < cars.length; i++) {
		if (cars[i].id === carId) {
			cars.splice(i, 1);
			return true;
		}
	}
	return false;
}

// The shared refusals for taking a car on: no slot, no money.
function slotAndCashRefusal(state, cost) {
	if (state.cars.length >= state.garageSlots) {
		return 'No free garage slot';
	}
	if (state.cash < cost) {
		return 'Not enough money';
	}
	return null;
}

// Push the note into the tray and move the clock on, as the last step of
// every successful action. Returns the {ok:true, msg} reply.
function succeed(state, msg) {
	state.pending.push(msg);
	advanceDay(state);
	return { ok: true, msg: msg };
}

// buyCar(state, listingId): pay the ticket price, the car is yours.
export function buyCar(state, listingId) {
	const listing = findListing(state, listingId);
	if (!listing || listing.mode !== 'sale') {
		return { ok: false, msg: 'No such car for sale on the telly' };
	}
	const refusal = slotAndCashRefusal(state, listing.price);
	if (refusal) {
		return { ok: false, msg: refusal };
	}
	const model = modelOf(listing.modelId);
	const car = {
		id: 'c' + state.nextId++,
		modelId: listing.modelId,
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: listing.price,
		condition: listing.condition,
		fault: null,
		lastServiceDay: state.day,
		jobsDone: 0,
		boughtDay: state.day,
		impoundedUntil: 0,
		rentedAtCondition: null,
	};
	state.cars.push(car);
	state.cash -= listing.price;
	removeListing(state, listingId);
	state.stats.carsBought += 1;
	return succeed(state, 'Bought the ' + model.name + ' for ' + money(listing.price));
}

// rentCar(state, listingId): one month's rent up front, the car stays
// the owner's. rentMonthly is what month-end will take from you.
export function rentCar(state, listingId) {
	const listing = findListing(state, listingId);
	if (!listing || listing.mode !== 'rent') {
		return { ok: false, msg: 'No such car for rent on the telly' };
	}
	const refusal = slotAndCashRefusal(state, listing.price);
	if (refusal) {
		return { ok: false, msg: refusal };
	}
	const model = modelOf(listing.modelId);
	const car = {
		id: 'c' + state.nextId++,
		modelId: listing.modelId,
		owned: false,
		owner: listing.owner,
		rentMonthly: listing.price,
		paid: 0,
		condition: listing.condition,
		fault: null,
		lastServiceDay: state.day,
		jobsDone: 0,
		boughtDay: state.day,
		impoundedUntil: 0,
		rentedAtCondition: listing.condition,
	};
	state.cars.push(car);
	state.cash -= listing.price;
	removeListing(state, listingId);
	return succeed(state, 'Rented the ' + model.name + ' from ' + listing.owner);
}

// returnRental(state, carId): hand the rented car back. The owner bills
// you for the condition it lost since you took it: 2% of basePrice per
// point of damage.
export function returnRental(state, carId) {
	const car = findCar(state, carId);
	if (!car || car.owned !== false) {
		return { ok: false, msg: 'That car is not one of your rentals' };
	}
	const model = modelOf(car.modelId);
	const damage = Math.max(0, car.rentedAtCondition - car.condition);
	const fee = Math.round(damage * 0.02 * model.basePrice);
	if (state.cash < fee) {
		return { ok: false, msg: 'Cannot afford the damage fee' };
	}
	state.cash -= fee;
	removeCar(state, carId);
	return succeed(state, 'Returned the ' + model.name + ' to ' + car.owner + '. Damage fee: ' + money(fee) + '.');
}

// sellToDealer(state, carId): the dealer offers 60% of market value,
// rounded to the nearest tenner. Rentals and consigned cars must not slip
// out through this door.
export function sellToDealer(state, carId) {
	const car = findCar(state, carId);
	if (!car || car.owned !== true) {
		return { ok: false, msg: 'You do not own that car' };
	}
	const consigned = state.auction.consigned;
	for (let i = 0; i < consigned.length; i++) {
		if (consigned[i].carId === carId) {
			return { ok: false, msg: 'Withdraw it from the auction first' };
		}
	}
	const model = modelOf(car.modelId);
	const price = roundTo(marketValue(state, model, car) * DEALER_CUT, 10);
	removeCar(state, carId);
	state.cash += price;
	state.stats.carsSold += 1;
	return succeed(state, 'Sold the ' + model.name + ' to the dealer for ' + money(price) + '.');
}

// buySlot(state): knock a wall down, another car fits. Up to 8 slots.
export function buySlot(state) {
	if (state.garageSlots >= MAX_SLOTS) {
		return { ok: false, msg: 'Garage is full-size already' };
	}
	if (state.cash < SLOT_COST) {
		return { ok: false, msg: 'Not enough money' };
	}
	state.cash -= SLOT_COST;
	state.garageSlots += 1;
	return succeed(state, 'Bought another garage slot for ' + money(SLOT_COST) + '.');
}

// waitDay(state): the honest do-nothing. Still costs a day.
export function waitDay(state) {
	return succeed(state, 'You put the kettle on. Nothing happens. Lovely.');
}
