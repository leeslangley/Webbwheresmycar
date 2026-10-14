// Golden fixture for godot/sim/auction.gd (GDS13): attend_auction, the auction-day settlement.
// Runs src/sim/auction.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh auction_attend   (writes godot/tests/golden/auction_attend.json)

import { attendAuction } from '../../src/sim/auction.js';
import { fresh, addCar, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];
const name = 'attend_auction';
const call = (s) => attendAuction(s);

// A new game on auction day with plenty of cash.
function day24(seed) {
	const st = fresh(seed);
	st.day = 24;
	st.cash = 50000;
	return st;
}

// A1: nothing consigned, nobody leads.
cases.push(stateCase(name, 'A1 nothing consigned, nobody leads', day24(1), [], call));

// A2-A5: one consigned car at a low reserve, on different seeds (different rng draws).
for (const s of [2, 3, 4, 5]) {
	const st = day24(s);
	const car = addCar(st, 't2_serious', { condition: 6 });
	st.auction.consigned = [{ carId: car.id, reserve: 100 }];
	cases.push(stateCase(name, 'A' + s + ' consigned car sells', st, [], call));
}

// A6: the same car, far above any price, fails the reserve.
{
	const st = day24(2);
	const car = addCar(st, 't2_serious', { condition: 6 });
	st.auction.consigned = [{ carId: car.id, reserve: 900000 }];
	cases.push(stateCase(name, 'A6 reserve not met', st, [], call));
}

// A7: a consigned entry whose car is no longer in the stable.
{
	const st = day24(2);
	st.auction.consigned = [{ carId: 'c99', reserve: 100 }];
	cases.push(stateCase(name, 'A7 consigned car missing', st, [], call));
}

// A8: the player leads lot 0 and can pay with a free slot.
{
	const st = day24(3);
	st.auction.lots[0].leader = 'player';
	st.auction.lots[0].currentBid = 1500;
	cases.push(stateCase(name, 'A8 won lot', st, [], call));
}

// A9: the same lot, but not enough cash.
{
	const st = day24(3);
	st.auction.lots[0].leader = 'player';
	st.auction.lots[0].currentBid = 1500;
	st.cash = 1000;
	cases.push(stateCase(name, 'A9 could not pay', st, [], call));
}

// A10: the same lot, but the garage is full.
{
	const st = day24(3);
	st.auction.lots[0].leader = 'player';
	st.auction.lots[0].currentBid = 1500;
	st.garageSlots = 1;
	addCar(st, 't1_maurice');
	cases.push(stateCase(name, 'A10 garage full', st, [], call));
}

// A11: two consigned cars and two won lots, with room for everything.
{
	const st = day24(7);
	const a = addCar(st, 't1_allergy', { condition: 7 });
	const b = addCar(st, 't3_porshe', { condition: 9 });
	st.auction.consigned = [{ carId: a.id, reserve: 100 }, { carId: b.id, reserve: 100 }];
	st.auction.lots[1].leader = 'player';
	st.auction.lots[1].currentBid = 2000;
	st.auction.lots[2].leader = 'player';
	st.auction.lots[2].currentBid = 2500;
	st.garageSlots = 5;
	cases.push(stateCase(name, 'A11 two sales and two wins', st, [], call));
}

// A12: refused, not auction day.
{
	const st = day24(2);
	st.day = 10;
	cases.push(stateCase(name, 'A12 not auction day', st, [], call));
}

// A13: refused, already attended today.
{
	const st = day24(4);
	st.auction.attendedDay = 24;
	cases.push(stateCase(name, 'A13 already attended', st, [], call));
}

// A14: a sale that sets a new best auction sale.
{
	const st = day24(8);
	const car = addCar(st, 't3_aston', { condition: 10 });
	st.auction.consigned = [{ carId: car.id, reserve: 100 }];
	st.stats.bestAuctionSale = 5;
	cases.push(stateCase(name, 'A14 new best sale', st, [], call));
}

// Guard: the cases must include a sale and a could-not-pay settlement, or the fixture is useless.
const text = JSON.stringify(cases.map((c) => c.result));
if (text.indexOf('Sold the') === -1 || text.indexOf('could not pay') === -1) {
	throw new Error('attend_auction cases must include a sale and a could-not-pay settlement');
}

emitCases('auction_attend', cases);
