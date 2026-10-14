// Golden fixture for godot/sim/endgame.gd (GDS08): runs src/sim/endgame.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh endgame   (writes godot/tests/golden/endgame.json)

import {
	PLATE_INFO, netWorth, evaluatePlates, finalScore, rankOf, checkEnd
} from '../../src/sim/endgame.js';
import { pureCase, stateCase, emitCases } from './golden_sim.mjs';

// A minimal endgame state; `over` replaces top-level keys.
function base(over) {
	return Object.assign({
		day: 100,
		cash: 0,
		reputation: 0,
		market: { priceMult: 1 },
		cars: [],
		plates: { fatcat: false, stable: false, household: false, hammer: false },
		stats: { bestAuctionSale: 0 },
		flags: { gameOver: false, won: false, reason: '' },
	}, over);
}

// An owned or rented car with only the fields the endgame maths reads.
function oc(modelId, cond, owned) {
	return { modelId: modelId, condition: cond, owned: owned };
}

const ALL_PLATES = { fatcat: true, stable: true, household: true, hammer: true };
const cases = [];

// (a) netWorth
cases.push(stateCase('net_worth', 'cash only', base({ cash: 500 }), [], s => netWorth(s)));
cases.push(stateCase('net_worth', 'one owned t1 at condition 10', base({ cash: 1000, cars: [oc('t1_allergy', 10, true)] }), [], s => netWorth(s)));
cases.push(stateCase('net_worth', 'price boost and rented car', base({ cash: 2500, market: { priceMult: 1.2 }, cars: [oc('t3_porshe', 5, true), oc('t2_serious', 8, false)] }), [], s => netWorth(s)));
cases.push(stateCase('net_worth', 'negative cash, fractional condition', base({ cash: -300, cars: [oc('t1_robbin', 3.5, true), oc('t1_allergy', 0, true)] }), [], s => netWorth(s)));

// (b) evaluatePlates
cases.push(stateCase('evaluate_plates', 'fatcat at 100000', base({ cash: 100000 }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'fatcat just short at 99999', base({ cash: 99999 }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'stable with six owned', base({ cars: Array.from({ length: 6 }, () => oc('t1_allergy', 0, true)) }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'stable not with five owned and one rented', base({ cars: [...Array.from({ length: 5 }, () => oc('t1_allergy', 0, true)), oc('t1_allergy', 0, false)] }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'household at 85', base({ reputation: 85 }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'household not at 84', base({ reputation: 84 }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'hammer at 100000', base({ stats: { bestAuctionSale: 100000 } }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'all four conditions at once', base({ cash: 100000, cars: Array.from({ length: 6 }, () => oc('t1_allergy', 0, true)), reputation: 85, stats: { bestAuctionSale: 100000 } }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'won plate never taken away', base({ cash: 0, plates: { fatcat: true, stable: false, household: false, hammer: false } }), [], s => evaluatePlates(s)));
cases.push(stateCase('evaluate_plates', 'nothing true', base({}), [], s => evaluatePlates(s)));

// (c) finalScore
cases.push(stateCase('final_score', 'cash and reputation', base({ cash: 12345, reputation: 33 }), [], s => finalScore(s)));
cases.push(stateCase('final_score', 'all four plates', base({ cash: 50000, reputation: 99, plates: ALL_PLATES }), [], s => finalScore(s)));
cases.push(stateCase('final_score', 'negative cash with two plates', base({ cash: -2000, plates: { fatcat: true, stable: false, household: true, hammer: false } }), [], s => finalScore(s)));
cases.push(stateCase('final_score', 'market drop and one car', base({ cash: 1000, reputation: 12, market: { priceMult: 0.85 }, cars: [oc('t3_aston', 6.5, true)] }), [], s => finalScore(s)));

// (d) rankOf
for (const v of [-1, 0, 29999, 30000, 79999, 80000, 149999, 150000, 299999, 300000, 1000000]) {
	cases.push(pureCase('rank_of', 'score ' + v, [v], rankOf(v)));
}

// (e) checkEnd
cases.push(stateCase('check_end', 'all four plates is won', base({ plates: ALL_PLATES }), [], s => checkEnd(s)));
cases.push(stateCase('check_end', 'day 366 is year-end', base({ day: 366 }), [], s => checkEnd(s)));
cases.push(stateCase('check_end', 'day 365 is still playing', base({ day: 365 }), [], s => checkEnd(s)));
cases.push(stateCase('check_end', 'game already over is unchanged', base({ day: 366, flags: { gameOver: true, won: false, reason: 'bankrupt' } }), [], s => checkEnd(s)));
cases.push(stateCase('check_end', 'won wins over year-end', base({ day: 366, plates: ALL_PLATES }), [], s => checkEnd(s)));

// (f) plate info
cases.push(pureCase('plate_info', 'plate info', [], PLATE_INFO));

emitCases('endgame', cases);
