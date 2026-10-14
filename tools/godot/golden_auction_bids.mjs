// Golden fixture for godot/sim/auction.gd (GDS10): bid step, minimum bid and placing a bid.
// Runs src/sim/auction.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh auction_bids   (writes godot/tests/golden/auction_bids.json)

import { bidStep, minBid, placeBid } from '../../src/sim/auction.js';
import { fresh, addCar, pureCase, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

// A new game on auction day with plenty of cash.
function day24(seed) {
	const st = fresh(seed);
	st.day = 24;
	st.cash = 50000;
	return st;
}

// Lot 0 of a day-24 state, with a 700 reserve (bid step 50) unless the caller overrides fields.
function lot0(st, fields) {
	Object.assign(st.auction.lots[0], { reserve: 700 }, fields);
	return st;
}

// bid_step: a spread of reserves, from the 50 floor up to large reserves.
for (const r of [100, 700, 1234, 5000, 40000]) {
	cases.push(pureCase('bid_step', 'reserve ' + r, [r], bidStep({ reserve: r })));
}

// min_bid: no bid yet (reserve), and bids already placed.
for (const [name, lot] of [
	['no bid yet', { reserve: 700, currentBid: 0 }],
	['bid 800', { reserve: 700, currentBid: 800 }],
	['bid 5250 on reserve 5000', { reserve: 5000, currentBid: 5250 }],
]) {
	cases.push(pureCase('min_bid', name, [lot], minBid(lot)));
}

// place_bid: player leads, outbid, refusals and the garage-slot rule.
const placeCall = (s, id, n) => placeBid(s, id, n);
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10] });
	cases.push(stateCase('place_bid', 'lead one step', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10] });
	cases.push(stateCase('place_bid', 'lead three steps', st, [st.auction.lots[0].lotId, 3], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [999999, 1, 1] });
	cases.push(stateCase('place_bid', 'outbid one step', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [999999, 1, 1] });
	cases.push(stateCase('place_bid', 'outbid three steps', st, [st.auction.lots[0].lotId, 3], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10] });
	cases.push(stateCase('place_bid', 'steps 2 refused', st, [st.auction.lots[0].lotId, 2], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10], leader: 'player', currentBid: 700 });
	cases.push(stateCase('place_bid', 'already winning', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10] });
	st.cash = 50;
	cases.push(stateCase('place_bid', 'cash 50', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10] });
	st.day = 10;
	cases.push(stateCase('place_bid', 'not auction day', st, [st.auction.lots[0].lotId, 1], placeCall));
}
cases.push(stateCase('place_bid', 'unknown lot', lot0(day24(3), { ceilings: [10, 10, 10] }), ['A999', 1], placeCall));
{
	const st = lot0(day24(3), { ceilings: [10, 10, 10] });
	st.garageSlots = 3;
	addCar(st, 't1_maurice');
	addCar(st, 't1_maurice');
	addCar(st, 't1_maurice');
	cases.push(stateCase('place_bid', 'garage full', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	// Edge: bid 2050 and the step is 50, so the top ceiling 2100 equals bid + step and outbids.
	const st = lot0(day24(3), { ceilings: [2100, 1, 1], currentBid: 2000, leader: 'ai' });
	cases.push(stateCase('place_bid', 'edge ceiling equals bid + step', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	// Edge: the top ceiling 2099 is one short of bid + step, so the player leads at 2050.
	const st = lot0(day24(3), { ceilings: [2099, 1, 1], currentBid: 2000, leader: 'ai' });
	cases.push(stateCase('place_bid', 'edge ceiling one short', st, [st.auction.lots[0].lotId, 1], placeCall));
}
{
	// Lot 0 is already led by the player and takes the one slot left; a bid on lot 1 must be refused.
	const st = day24(3);
	st.auction.lots[0].leader = 'player';
	st.garageSlots = 3;
	addCar(st, 't1_maurice');
	addCar(st, 't1_maurice');
	cases.push(stateCase('place_bid', 'leading lots use free slots', st, [st.auction.lots[1].lotId, 1], placeCall));
}

emitCases('auction_bids', cases);
