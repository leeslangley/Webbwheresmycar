// Golden fixture for godot/sim/auction.gd (GDS09): lot generation, safe lot view, paid reveals, consigning.
// Runs src/sim/auction.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh auction_lots   (writes godot/tests/golden/auction_lots.json)

import { prepareAuction, lotView, revealStat, consignCar, unconsign } from '../../src/sim/auction.js';
import { fresh, addCar, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

// prepare_auction: seeds 1..6 on three days (18 cases).
for (let seed = 1; seed <= 6; seed++) {
	for (const day of [1, 40, 200]) {
		const st = fresh(seed);
		st.day = day;
		cases.push(stateCase('prepare_auction', 's' + seed + ' day' + day, st, [],
			(s) => prepareAuction(s)));
	}
}

// lot_view: every lot of fresh(3), then hand-made lot states.
const base = fresh(3);
for (let i = 0; i < base.auction.lots.length; i++) {
	cases.push(stateCase('lot_view', 'lot ' + i, base, [base.auction.lots[i].lotId],
		(s, id) => lotView(s, id)));
}
{
	const st = fresh(3);
	const lot = st.auction.lots[0];
	lot.revealed.desirability = true;
	lot.revealed.condition = true;
	lot.revealCount = 2;
	cases.push(stateCase('lot_view', 'revealed two', st, [lot.lotId], (s, id) => lotView(s, id)));
}
{
	const st = fresh(3);
	const lot = st.auction.lots[0];
	lot.currentBid = 800;
	lot.leader = 'ai';
	cases.push(stateCase('lot_view', 'bid placed', st, [lot.lotId], (s, id) => lotView(s, id)));
}
cases.push(stateCase('lot_view', 'unknown lot', fresh(3), ['A999'], (s, id) => lotView(s, id)));

// reveal_stat on fresh(3).
{
	const st = fresh(3);
	const id = st.auction.lots[0].lotId;
	cases.push(stateCase('reveal_stat', 'desirability', st, [id, 'desirability'], (s, l, x) => revealStat(s, l, x)));
	cases.push(stateCase('reveal_stat', 'condition', st, [id, 'condition'], (s, l, x) => revealStat(s, l, x)));
	cases.push(stateCase('reveal_stat', 'bogus stat', st, [id, 'bogus'], (s, l, x) => revealStat(s, l, x)));
}
{
	const st = fresh(3);
	const lot = st.auction.lots[0];
	lot.revealed.maintenance = true;
	cases.push(stateCase('reveal_stat', 'already revealed', st, [lot.lotId, 'maintenance'], (s, l, x) => revealStat(s, l, x)));
}
{
	const st = fresh(3);
	const lot = st.auction.lots[0];
	lot.revealCount = 2;
	cases.push(stateCase('reveal_stat', 'two reveals already', st, [lot.lotId, 'reliability'], (s, l, x) => revealStat(s, l, x)));
}
{
	const st = fresh(3);
	st.cash = 100;
	cases.push(stateCase('reveal_stat', 'cash 100', st, [st.auction.lots[0].lotId, 'condition'], (s, l, x) => revealStat(s, l, x)));
}
cases.push(stateCase('reveal_stat', 'unknown lot', fresh(3), ['A999', 'condition'], (s, l, x) => revealStat(s, l, x)));

// consign_car: owned and rented cars on day 10 (auction not yet due).
function garage(day) {
	const st = fresh(3);
	st.day = day;
	const owned = addCar(st, 't2_serious', { condition: 6 });
	const rented = addCar(st, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 200, rentedAtCondition: 5 });
	return { st: st, owned: owned.id, rented: rented.id };
}
{
	const g = garage(10);
	cases.push(stateCase('consign_car', 'owned, reserve 5000', g.st, [g.owned, 5000], (s, id, r) => consignCar(s, id, r)));
	cases.push(stateCase('consign_car', 'reserve 0', g.st, [g.owned, 0], (s, id, r) => consignCar(s, id, r)));
	cases.push(stateCase('consign_car', 'reserve 12.5', g.st, [g.owned, 12.5], (s, id, r) => consignCar(s, id, r)));
	cases.push(stateCase('consign_car', 'reserve -5', g.st, [g.owned, -5], (s, id, r) => consignCar(s, id, r)));
	cases.push(stateCase('consign_car', 'reserve as string', g.st, [g.owned, '800'], (s, id, r) => consignCar(s, id, r)));
	cases.push(stateCase('consign_car', 'rented car', g.st, [g.rented, 5000], (s, id, r) => consignCar(s, id, r)));
	cases.push(stateCase('consign_car', 'unknown car', g.st, ['c99', 5000], (s, id, r) => consignCar(s, id, r)));
}
{
	const g = garage(10);
	g.st.auction.consigned = [{ carId: g.owned, reserve: 100 }];
	cases.push(stateCase('consign_car', 'already consigned', g.st, [g.owned, 5000], (s, id, r) => consignCar(s, id, r)));
}
{
	const g = garage(24);
	cases.push(stateCase('consign_car', 'auction day refusal', g.st, [g.owned, 5000], (s, id, r) => consignCar(s, id, r)));
}

// unconsign: one consigned car, and one car that is not consigned.
{
	const g = garage(10);
	g.st.auction.consigned = [{ carId: g.owned, reserve: 5000 }];
	cases.push(stateCase('unconsign', 'consigned car', g.st, [g.owned], (s, id) => unconsign(s, id)));
}
{
	const g = garage(10);
	cases.push(stateCase('unconsign', 'not consigned', g.st, [g.owned], (s, id) => unconsign(s, id)));
}

emitCases('auction_lots', cases);
