// Golden fixture for godot/sim/actions.gd (GDS18): runs src/sim/actions.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh actions   (writes godot/tests/golden/actions.json)

import { buyCar, rentCar, returnRental, sellToDealer, buySlot, waitDay } from '../../src/sim/actions.js';
import { fresh, addCar, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

// First listing of a mode on the telly; the opening board always has both kinds.
function sale(s) {
	return need(s.shop.listings.find(l => l.mode === 'sale'), 'sale listing');
}

function rent(s) {
	return need(s.shop.listings.find(l => l.mode === 'rent'), 'rent listing');
}

function need(x, what) {
	if (!x) {
		throw new Error('golden actions: missing ' + what);
	}
	return x;
}

// Fill the garage to the given slot count with three default cars.
function fillGarage(s) {
	s.garageSlots = 3;
	addCar(s, 't1_allergy');
	addCar(s, 't1_robbin');
	addCar(s, 't2_serious');
}

// (1) buy_car: seeds 1..3 buy the first sale listing.
for (let seed = 1; seed <= 3; seed++) {
	const st = fresh(seed);
	cases.push(stateCase('buy_car', 'buy sale s' + seed, st, [sale(st).listingId], (s, id) => buyCar(s, id)));
}

// buying the rent listing is refused
{
	const st = fresh(1);
	cases.push(stateCase('buy_car', 'buy a rent listing refused', st, [rent(st).listingId], (s, id) => buyCar(s, id)));
}

// unknown listing id
{
	const st = fresh(2);
	if (st.shop.listings.some(l => l.listingId === 'L99')) {
		throw new Error('golden actions: L99 must not exist');
	}
	cases.push(stateCase('buy_car', 'unknown listing L99', st, ['L99'], (s, id) => buyCar(s, id)));
}

// no free garage slot
{
	const st = fresh(3);
	fillGarage(st);
	cases.push(stateCase('buy_car', 'no free slot', st, [sale(st).listingId], (s, id) => buyCar(s, id)));
}

// cash 100
{
	const st = fresh(4);
	st.cash = 100;
	cases.push(stateCase('buy_car', 'cash 100 refused', st, [sale(st).listingId], (s, id) => buyCar(s, id)));
}

// (2) rent_car: seeds 1..3 rent the first rent listing.
for (let seed = 1; seed <= 3; seed++) {
	const st = fresh(seed);
	cases.push(stateCase('rent_car', 'rent s' + seed, st, [rent(st).listingId], (s, id) => rentCar(s, id)));
}

// renting a sale listing is refused
{
	const st = fresh(1);
	cases.push(stateCase('rent_car', 'rent a sale listing refused', st, [sale(st).listingId], (s, id) => rentCar(s, id)));
}

// no free garage slot
{
	const st = fresh(2);
	fillGarage(st);
	cases.push(stateCase('rent_car', 'no free slot', st, [rent(st).listingId], (s, id) => rentCar(s, id)));
}

// cash 50
{
	const st = fresh(3);
	st.cash = 50;
	cases.push(stateCase('rent_car', 'cash 50 refused', st, [rent(st).listingId], (s, id) => rentCar(s, id)));
}

// (3) return_rental
// rented car, condition 6 against 8 when taken: damage 2
{
	const st = fresh(1);
	const car = addCar(st, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 8, condition: 6 });
	cases.push(stateCase('return_rental', 'rental damage 2', st, [car.id], (s, id) => returnRental(s, id)));
}

// rented car, condition 8 against 8: no damage
{
	const st = fresh(2);
	const car = addCar(st, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 8, condition: 8 });
	cases.push(stateCase('return_rental', 'rental no damage', st, [car.id], (s, id) => returnRental(s, id)));
}

// rented car, condition 9 against 8: above the start, still no fee
{
	const st = fresh(3);
	const car = addCar(st, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 8, condition: 9 });
	cases.push(stateCase('return_rental', 'rental above start, no fee', st, [car.id], (s, id) => returnRental(s, id)));
}

// an owned car is not a rental
{
	const st = fresh(4);
	const car = addCar(st, 't1_robbin', { condition: 6 });
	cases.push(stateCase('return_rental', 'owned car refused', st, [car.id], (s, id) => returnRental(s, id)));
}

// damage fee with no cash
{
	const st = fresh(5);
	const car = addCar(st, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 8, condition: 6 });
	st.cash = 0;
	cases.push(stateCase('return_rental', 'cash 0 refused', st, [car.id], (s, id) => returnRental(s, id)));
}

// unknown car id
{
	const st = fresh(6);
	cases.push(stateCase('return_rental', 'unknown car', st, ['cNOPE'], (s, id) => returnRental(s, id)));
}

// (4) sell_to_dealer
// owned t2_serious at condition 6
{
	const st = fresh(3);
	const car = addCar(st, 't2_serious', { condition: 6, paid: 20000 });
	cases.push(stateCase('sell_to_dealer', 'sell t2_serious cond 6', st, [car.id], (s, id) => sellToDealer(s, id)));
}

// a rented car cannot go to the dealer
{
	const st = fresh(4);
	const car = addCar(st, 't2_serious', { owned: false, owner: 'Rev Dawn Patrol', rentMonthly: 950, rentedAtCondition: 7, condition: 7 });
	cases.push(stateCase('sell_to_dealer', 'rental refused', st, [car.id], (s, id) => sellToDealer(s, id)));
}

// a consigned car must be withdrawn first
{
	const st = fresh(5);
	const car = addCar(st, 't2_serious', { condition: 6 });
	st.auction.consigned.push({ carId: car.id, reserve: 100 });
	cases.push(stateCase('sell_to_dealer', 'consigned refused', st, [car.id], (s, id) => sellToDealer(s, id)));
}

// unknown car id
{
	const st = fresh(6);
	cases.push(stateCase('sell_to_dealer', 'unknown car', st, ['cNOPE'], (s, id) => sellToDealer(s, id)));
}

// (5) buy_slot
{
	const st = fresh(4);
	st.garageSlots = 3;
	st.cash = 20000;
	cases.push(stateCase('buy_slot', 'slot 3 to 4', st, [], s => buySlot(s)));
}

{
	const st = fresh(5);
	st.garageSlots = 8;
	cases.push(stateCase('buy_slot', 'garage full-size refused', st, [], s => buySlot(s)));
}

{
	const st = fresh(6);
	st.cash = 2999;
	cases.push(stateCase('buy_slot', 'cash 2999 refused', st, [], s => buySlot(s)));
}

// (6) wait_day: seeds 1..3
for (let seed = 1; seed <= 3; seed++) {
	cases.push(stateCase('wait_day', 'wait s' + seed, fresh(seed), [], s => waitDay(s)));
}

emitCases('actions', cases);
