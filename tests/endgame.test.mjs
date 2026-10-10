// Tests for endgame maths: net worth, plates, score, ranks and the end
// check (DESIGN.md sections 4.11 and 9.3), run under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import {
	PLATE_INFO, netWorth, evaluatePlates, finalScore, rankOf, checkEnd
} from '../src/sim/endgame.js';
import { test, eq, ok, done } from './harness.js';

// A stable car with the fields from DESIGN.md section 4.3.
function car(id, modelId, owned, condition, extra) {
	const c = {
		id: id,
		modelId: modelId,
		owned: owned,
		owner: owned ? undefined : 'A. Owner',
		rentMonthly: owned ? undefined : 950,
		paid: owned ? 22000 : undefined,
		condition: condition,
		fault: null,
		lastServiceDay: 0,
		jobsDone: 0,
		boughtDay: owned ? 1 : undefined,
		impoundedUntil: 0,
		rentedAtCondition: owned ? undefined : condition,
	};
	if (extra) {
		const keys = Object.keys(extra);
		for (let i = 0; i < keys.length; i++) {
			c[keys[i]] = extra[keys[i]];
		}
	}
	return c;
}

test('PLATE_INFO names and texts', () => {
	eq(PLATE_INFO.fatcat, { name: 'Fat Cat', text: 'Net worth £100,000' }, 'fatcat');
	eq(PLATE_INFO.stable, { name: 'Stable Boy', text: 'Own 6 cars at once' }, 'stable');
	eq(PLATE_INFO.household, { name: 'Household Name', text: 'Reputation 85' }, 'household');
	eq(PLATE_INFO.hammer, { name: 'Hammer Time', text: 'Sell a car at auction for £100,000' }, 'hammer');
});

test('netWorth of a new game is the starting cash', () => {
	const state = newGameState();
	eq(netWorth(state), 20000, 'fresh game');
});

test('an owned t2_serious at condition 10 adds 22000', () => {
	const state = newGameState();
	state.cars.push(car('c1', 't2_serious', true, 10));
	eq(netWorth(state), 42000, '20000 + 22000');
});

test('a rented car adds 0 to netWorth', () => {
	const state = newGameState();
	state.cars.push(car('c1', 't2_serious', false, 10));
	eq(netWorth(state), 20000, 'rented counts 0');
});

test('fatcat triggers when cash reaches 100000, once, and stays', () => {
	const state = newGameState();
	eq(evaluatePlates(state), [], 'nothing yet');
	state.cash = 100000;
	eq(evaluatePlates(state), ['fatcat'], 'fatcat newly won');
	eq(evaluatePlates(state), [], 'no new plates next call');
	state.cash = 10;
	eq(state.plates.fatcat, true, 'fatcat stays true after cash drops');
});

test('stable needs 6 owned cars; rented ones do not count', () => {
	const state = newGameState();
	for (let i = 0; i < 5; i++) {
		state.cars.push(car('c' + i, 't2_serious', true, 10));
	}
	eq(evaluatePlates(state), [], '5 owned is not enough');
	state.cars.push(car('c5', 't1_allergy', true, 10));
	eq(evaluatePlates(state), ['stable'], '6 owned wins stable');

	const state2 = newGameState();
	for (let i = 0; i < 6; i++) {
		state2.cars.push(car('r' + i, 't2_serious', false, 10));
	}
	eq(evaluatePlates(state2), [], '6 rented does not count');
});

test('household triggers at reputation 85 but not 84', () => {
	const state = newGameState();
	state.reputation = 84;
	eq(evaluatePlates(state), [], '84 is not enough');
	state.reputation = 85;
	eq(evaluatePlates(state), ['household'], '85 wins household');
});

test('hammer triggers when bestAuctionSale reaches 100000 but not 99999', () => {
	const state = newGameState();
	state.stats.bestAuctionSale = 99999;
	eq(evaluatePlates(state), [], '99999 is not enough');
	state.stats.bestAuctionSale = 100000;
	eq(evaluatePlates(state), ['hammer'], '100000 wins hammer');
});

test('finalScore of a fresh game with reputation 40 is 24000', () => {
	const state = newGameState();
	eq(finalScore(state), 24000, '20000 + 0 + 4000');
});

test('finalScore counts plates and reputation', () => {
	const state = newGameState();
	state.cash = 100000;
	state.plates.fatcat = true;
	state.plates.hammer = true;
	// 100000 + 2*5000 + 100*40 = 114000
	eq(finalScore(state), 114000, 'two plates, rep 40');
});

test('rankOf boundaries', () => {
	eq(rankOf(-1), 'Pavement Pete', '-1');
	eq(rankOf(0), 'Learner Driver', '0');
	eq(rankOf(29999), 'Learner Driver', '29999');
	eq(rankOf(30000), 'Weekend Mechanic', '30000');
	eq(rankOf(79999), 'Weekend Mechanic', '79999');
	eq(rankOf(80000), 'Gearbox Guru', '80000');
	eq(rankOf(149999), 'Gearbox Guru', '149999');
	eq(rankOf(150000), 'Concours Champion', '150000');
	eq(rankOf(299999), 'Concours Champion', '299999');
	eq(rankOf(300000), 'Legend of the Lay-by', '300000');
});

test('checkEnd: day 365 is not the end yet', () => {
	const state = newGameState();
	state.day = 365;
	checkEnd(state);
	ok(!state.flags.gameOver, 'day 365 still playing');
});

test('checkEnd: day 366 ends the year with a loss', () => {
	const state = newGameState();
	state.day = 366;
	checkEnd(state);
	eq(state.flags, { gameOver: true, won: false, reason: 'year-end' }, 'year-end flags');
});

test('checkEnd: all four plates wins at any time', () => {
	const state = newGameState();
	state.plates.fatcat = true;
	state.plates.stable = true;
	state.plates.household = true;
	state.plates.hammer = true;
	checkEnd(state);
	eq(state.flags, { gameOver: true, won: true, reason: 'won' }, 'won flags');
});

test('checkEnd does nothing once the game is over', () => {
	const state = newGameState();
	state.day = 366;
	checkEnd(state);
	checkEnd(state);
	eq(state.flags, { gameOver: true, won: false, reason: 'year-end' }, 'reason unchanged');
});

test('netWorth ignores cars whose owned field is not exactly true', () => {
	const state = newGameState();
	state.cars.push({ modelId: 't2_serious', condition: 10, fault: null, impoundedUntil: 0 });
	eq(netWorth(state), 20000, 'owned undefined counts 0');
});

test('finalScore and netWorth round market value to pounds', () => {
	const state = newGameState();
	state.market.priceMult = 1.03;
	state.cars.push(car('c1', 't2_serious', true, 10));
	// 22000 * 1.03 = 22660 exactly; with 1.033 -> 22726.6 -> 22727
	eq(netWorth(state), 42660, 'rounded market value');
	eq(finalScore(state) % 1, 0, 'finalScore is an integer');
});

test('rankOf extremes', () => {
	eq(rankOf(-100000), 'Pavement Pete', 'deep overdraft');
	eq(rankOf(1000000), 'Legend of the Lay-by', 'top rank');
});

test('all four plates win even after day 365', () => {
	const state = newGameState();
	state.day = 400;
	state.plates.fatcat = true;
	state.plates.stable = true;
	state.plates.household = true;
	state.plates.hammer = true;
	checkEnd(state);
	eq(state.flags, { gameOver: true, won: true, reason: 'won' }, 'plates branch wins first');
});

test('plates are awarded even after checkEnd would lose, plates first', () => {
	const state = newGameState();
	state.cash = 200000;
	eq(evaluatePlates(state), ['fatcat'], 'fatcat before checkEnd');
	checkEnd(state);
	ok(!state.flags.gameOver, 'one plate is not a win, day 1 not year end');
});
