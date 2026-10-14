// Golden fixture for godot/sim/shop.gd (GDS05): runs the src/sim/shop.js TV shop listings under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh shop   (writes godot/tests/golden/shop.json)

import { makeListing, initShop, shouldRefresh, refreshShop } from '../../src/sim/shop.js';
import { fresh, stateCase, pureCase, emitCases } from './golden_sim.mjs';

const cases = [];

// (a) default options, seeds 1..8
for (let seed = 1; seed <= 8; seed++) {
	cases.push(stateCase('make_listing', 'default s' + seed, fresh(seed), [{}],
		(s, o) => makeListing(s, o)));
}

// (b) option sets, seeds 1..4 each (16 cases)
const OPTS = [
	{ mode: 'sale', tier: 1, maxPrice: 14000, excludeModelIds: ['t1_allergy', 't1_robbin'] },
	{ mode: 'rent', tier: 2 },
	{ tier: 3 },
	{ mode: 'sale', maxPrice: 6000 },
];
for (let k = 0; k < OPTS.length; k++) {
	for (let seed = 1; seed <= 4; seed++) {
		cases.push(stateCase('make_listing', 'opts' + k + ' s' + seed, fresh(seed), [OPTS[k]],
			(s, o) => makeListing(s, o)));
	}
}

// (c) opening board, seeds 1..5, on day 3
for (let seed = 1; seed <= 5; seed++) {
	const st = fresh(seed);
	st.day = 3;
	cases.push(stateCase('init_shop', 'opening s' + seed, st, [], s => initShop(s)));
}

// (d) refresh day rule
for (const d of [1, 2, 7, 8, 9, 15, 22, 29, 36, 365]) {
	cases.push(pureCase('should_refresh', 'day ' + d, [d], shouldRefresh(d)));
}

// (e) weekly refresh on day 8, seeds 1..6
for (let seed = 1; seed <= 6; seed++) {
	const st = fresh(seed);
	st.day = 8;
	cases.push(stateCase('refresh_shop', 'weekly s' + seed, st, [], s => refreshShop(s)));
}

// (f) short board (two listings left after bought-off cars)
{
	const st = fresh(2);
	st.day = 8;
	st.shop.listings.length = 2;
	cases.push(stateCase('refresh_shop', 'short board', st, [], s => refreshShop(s)));
}

// (g) empty board
{
	const st = fresh(3);
	st.day = 8;
	st.shop.listings = [];
	cases.push(stateCase('refresh_shop', 'empty board', st, [], s => refreshShop(s)));
}

emitCases('shop', cases);
