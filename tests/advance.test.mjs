// Tests for the day clock (DESIGN.md sections 4.1, 4.7-4.9), run under
// `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { initShop } from '../src/sim/shop.js';
import { prepareAuction } from '../src/sim/auction.js';
import { advanceDay, startOfDayFlags } from '../src/sim/advance.js';
import { test, eq, ok, near, done } from './harness.js';

// A fresh state with the shop and the month-one auction already set up,
// as a player's first morning would look.
function freshState() {
	const state = newGameState(7);
	initShop(state);
	prepareAuction(state);
	return state;
}

// (a) One advance from day 1 gives day 2 with a headline and no bills.
test('one advance: day 1 to 2, headline, no month report', () => {
	const state = freshState();
	advanceDay(state);
	eq(state.day, 2, 'day moved to 2');
	eq(state.today.day, 2, 'today is day 2');
	ok(typeof state.today.headline === 'string' && state.today.headline.length > 0, 'headline non-empty');
	eq(state.today.monthReport, null, 'no month report on day 2');
});

// (b) From day 31, one advance starts February and brings January's bills.
test('day 31 to 32: January month-end bills of 400', () => {
	const state = freshState();
	state.day = 31;
	const before = state.cash;
	advanceDay(state);
	eq(state.day, 32, 'day moved to 32');
	eq(state.today.monthReport.monthName, 'January', 'January report');
	eq(state.today.monthReport.total, 400, 'empty stable bills are the lease');
	eq(state.cash, before - 400, 'cash reduced by 400');
	eq(state.lastMonthReport.monthName, 'January', 'report also kept as lastMonthReport');
});

// (c) Buzz decays 10% a day, floored at 0 and kept to one decimal.
test('buzz decay: 100 to 90, tiny buzz never goes negative', () => {
	const state = freshState();
	state.buzz = 100;
	advanceDay(state);
	eq(state.buzz, 90, 'buzz 100 becomes 90');
	const low = freshState();
	low.buzz = 0.4;
	advanceDay(low);
	ok(low.buzz >= 0 && low.buzz <= 0.4, 'buzz 0.4 stays in [0, 0.4] after rounding');
	const none = freshState();
	none.buzz = 0;
	advanceDay(none);
	eq(none.buzz, 0, 'buzz stays at 0');
});

// (d) An idle car loses its model's idle decay, rounded to 0.01.
test('idle decay: t1_maurice condition 5 becomes 4.98', () => {
	const state = freshState();
	state.cars.push({
		id: 'c1', modelId: 't1_maurice', owned: true, owner: '',
		rentMonthly: 0, paid: 6500, condition: 5, fault: null,
		lastServiceDay: 0, jobsDone: 0, boughtDay: 1, impoundedUntil: 0,
		rentedAtCondition: 0,
	});
	advanceDay(state);
	eq(state.cars[0].condition, 4.98, 'condition lost exactly 0.02 (0.022 rounded)');
});

// (e) Strings an action left in pending land in today.events.
test('pending strings move into today.events, tray empties', () => {
	const state = freshState();
	state.pending.push('Kettle boiled: a lovely cuppa.');
	state.pending.push('The cat sat on the ledger.');
	advanceDay(state);
	ok(state.today.events.indexOf('Kettle boiled: a lovely cuppa.') !== -1, 'first pending string in events');
	ok(state.today.events.indexOf('The cat sat on the ledger.') !== -1, 'second pending string in events');
	eq(state.pending, [], 'pending emptied');
});

// (f) Situation tags in sit are cleared after the advance.
test('sit is emptied by the advance', () => {
	const state = freshState();
	state.sit.push('viral');
	advanceDay(state);
	eq(state.sit, [], 'sit emptied');
});

// (g) The year ends after day 365 and further advances do nothing.
test('365 advances: day 366, year-end game over, then frozen', () => {
	const state = freshState();
	state.cash = 1000000;
	state.reputation = 0;
	state.cars = [];
	for (let i = 0; i < 365; i++) {
		advanceDay(state);
	}
	eq(state.day, 366, 'day is 366 after 365 advances');
	eq(state.flags.gameOver, true, 'game over');
	eq(state.flags.reason, 'year-end', 'reason is year-end');
	eq(state.flags.won, false, 'not won');
	const paper = state.today;
	advanceDay(state);
	eq(state.day, 366, 'a further call changes nothing');
	eq(JSON.stringify(state.today), JSON.stringify(paper), 'today untouched');
});

// (h) The request board never holds more than six.
test('requests never exceed 6 over 100 advances', () => {
	const state = freshState();
	for (let i = 0; i < 100; i++) {
		advanceDay(state);
		ok(state.requests.length <= 6, 'request board capped at 6 on advance ' + (i + 1));
	}
});

// (i) The TV shop refreshes on day 8 (7 days after opening day).
test('shop refresh lands on day 8', () => {
	const state = freshState();
	eq(state.shop.refreshedDay, 1, 'opened on day 1');
	for (let i = 0; i < 7; i++) {
		advanceDay(state);
	}
	eq(state.day, 8, 'now day 8');
	eq(state.shop.refreshedDay, 8, 'shop refreshed on day 8');
});

// (j) Two identical states played 100 days apart behave identically.
test('determinism: 100 advances of identical states stay identical', () => {
	const a = freshState();
	const b = JSON.parse(JSON.stringify(freshState()));
	for (let i = 0; i < 100; i++) {
		advanceDay(a);
		advanceDay(b);
	}
	eq(JSON.stringify(a), JSON.stringify(b), 'states deep-equal after 100 days');
});

// (k) startOfDayFlags reports auction day, month start and days left.
test('startOfDayFlags: auction day 24, month start 32', () => {
	const state = freshState();
	state.day = 24;
	eq(startOfDayFlags(state), { isAuctionDay: true, isMonthStart: false, daysLeftInYear: 341 }, 'day 24 is auction day');
	state.day = 32;
	eq(startOfDayFlags(state), { isAuctionDay: false, isMonthStart: true, daysLeftInYear: 333 }, 'day 32 is a month start');
	state.day = 1;
	eq(startOfDayFlags(state), { isAuctionDay: false, isMonthStart: true, daysLeftInYear: 364 }, 'day 1 starts January');
});

done();
