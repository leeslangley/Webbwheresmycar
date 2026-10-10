// Tests for the advertising gamble (DESIGN.md sections 4.8, 8.1), run
// under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { initShop } from '../src/sim/shop.js';
import { prepareAuction } from '../src/sim/auction.js';
import { advertise } from '../src/sim/adsim.js';
import { ADVERT_BY_ID } from '../src/data/adverts.js';
import { test, eq, ok, near, done } from './harness.js';

const START_CASH = 100000;

// A fresh state with the shop and the month-one auction already set up,
// and a fat wallet so cash never blocks the gamble.
function fresh(seed) {
	const state = newGameState(seed);
	initShop(state);
	prepareAuction(state);
	state.cash = START_CASH;
	return state;
}

// (a) paper costs exactly 150 and advances exactly one day.
test('paper costs 150 and advances one day', () => {
	const state = fresh(11);
	const r = advertise(state, 'paper');
	eq(r.ok, true, 'advertise ok');
	eq(state.cash, START_CASH - 150, 'cash down by exactly 150');
	eq(state.day, 2, 'day advanced exactly one day');
	eq(state.today.day, 2, 'today is day 2');
	eq(r.outcome.mediaId, 'paper', 'outcome names the medium');
});

// (b) unknown media and short cash refuse with day, cash and buzz unchanged.
test('unknown media and short cash refuse, nothing changes', () => {
	const state = fresh(12);
	const before = { day: state.day, cash: state.cash, buzz: state.buzz };

	let r = advertise(state, 'carrier-pigeon');
	eq(r.ok, false, 'unknown media refuses');
	eq(r.msg, 'No such advert', 'unknown media message');
	eq(state.day, before.day, 'unknown media: no day passed');
	eq(state.cash, before.cash, 'unknown media: cash unchanged');
	eq(state.buzz, before.buzz, 'unknown media: buzz unchanged');

	// Missing, null and wrong-case ids are all just unknown media.
	for (const bad of [undefined, null, '', 'PAPER', 'tv ']) {
		r = advertise(state, bad);
		eq(r.ok, false, 'bad id ' + JSON.stringify(bad) + ' refuses');
		eq(r.msg, 'No such advert', 'bad id message');
	}
	eq(state.day, before.day, 'bad ids: no day passed');

	state.buzz = 25;
	state.cash = 1000;
	r = advertise(state, 'billboard');
	eq(r.ok, false, 'short cash refuses');
	eq(r.msg, 'Not enough money', 'short cash message');
	eq(state.day, before.day, 'short cash: no day passed');
	eq(state.cash, 1000, 'short cash: cash unchanged');
	eq(state.buzz, 25, 'short cash: buzz unchanged');

	// Exact cash is enough: 150 covers the paper.
	state.cash = 150;
	r = advertise(state, 'paper');
	eq(r.ok, true, 'exact cash is enough');
});

// (c) over 2000 seeds the mean immediate buzz gain of tv is within 3 of 54.5.
test('tv mean buzz gain within 3 of 54.5 over 2000 seeds', () => {
	let total = 0;
	for (let seed = 1; seed <= 2000; seed++) {
		const state = fresh(seed);
		const r = advertise(state, 'tv');
		eq(r.ok, true, 'seed ' + seed + ': tv advert ok');
		total += r.outcome.buzz;
	}
	near(total / 2000, 54.5, 3, 'mean tv buzz gain');
});

// (d) youtube viral (buzz 80) frequency between 7.5% and 12.5% over 2000
// seeds; the cringe outcome (rep -3) never takes reputation below 0 when
// reputation starts at 1 (it becomes 0).
test('youtube viral frequency and cringe reputation floor', () => {
	let viral = 0;
	let cringe = 0;
	for (let seed = 1; seed <= 2000; seed++) {
		const state = fresh(seed);
		state.reputation = 1;
		const r = advertise(state, 'youtube');
		if (r.outcome.buzz === 80) {
			viral += 1;
		}
		if (r.outcome.rep === -3) {
			cringe += 1;
			eq(state.reputation, 0, 'seed ' + seed + ': cringe leaves reputation at 0, not below');
		}
		if (r.outcome.rep === 0) {
			eq(state.reputation, 1, 'seed ' + seed + ': rep 0 outcome leaves reputation alone');
		}
		ok(state.reputation >= 0, 'seed ' + seed + ': reputation never negative');
	}
	const freq = viral / 2000;
	ok(freq >= 0.075 && freq <= 0.125, 'viral frequency ' + freq + ' within 7.5%-12.5%');
	ok(cringe > 0, 'the cringe outcome was actually rolled at least once');
});

// (e) buzz never exceeds 100 even when starting at 90 and winning 90.
test('buzz clamped at 100 when starting at 90', () => {
	let won90 = 0;
	for (let seed = 1; seed <= 2000; seed++) {
		const state = fresh(seed);
		state.buzz = seed % 2 === 0 ? 90 : 100;
		const r = advertise(state, 'tv');
		ok(state.buzz <= 100, 'seed ' + seed + ': buzz never above 100');
		ok(state.buzz >= 80, 'seed ' + seed + ': a full buzz bar cannot drop below a big win');
		if (r.outcome.buzz === 90) {
			won90 += 1;
			// 90 + 90 clamps to exactly 100, then decays 10% overnight to 90.
			eq(state.buzz, 90, 'seed ' + seed + ': 90 + 90 clamped at 100 before the overnight decay');
		}
	}
	ok(won90 > 0, 'a 90-buzz outcome was actually rolled at least once');
});

// (f) a viral outcome feeds the sit list into advanceDay: the headline
// pipeline still works (day advanced, today.headline non-empty).
test('viral outcome still produces the next morning paper', () => {
	let virals = 0;
	for (let seed = 1; seed <= 2000; seed++) {
		const state = fresh(seed);
		const r = advertise(state, 'youtube');
		eq(state.day, 2, 'seed ' + seed + ': day advanced');
		ok(typeof state.today.headline === 'string' && state.today.headline.length > 0, 'seed ' + seed + ': headline non-empty');
		if (r.outcome.buzz >= 80) {
			virals += 1;
		}
	}
	ok(virals > 0, 'a viral outcome was actually rolled at least once');
});

// (g) stats.adsRun increments once per successful advert (and only then).
test('stats.adsRun increments on success only', () => {
	const state = fresh(13);
	eq(state.stats.adsRun, 0, 'starts at 0');
	advertise(state, 'paper');
	eq(state.stats.adsRun, 1, 'one successful advert');
	advertise(state, 'radio');
	eq(state.stats.adsRun, 2, 'two successful adverts');
	advertise(state, 'no-such-medium');
	eq(state.stats.adsRun, 2, 'a refused advert does not count');
	state.cash = 0;
	advertise(state, 'paper');
	eq(state.stats.adsRun, 2, 'a broke advert does not count');
});

// (h) no {medium} placeholder is left in any message, across all media.
test('messages have no {medium} placeholder left', () => {
	const mediaIds = Object.keys(ADVERT_BY_ID);
	eq(mediaIds.length, 7, 'seven media');
	for (let s = 0; s < 30; s++) {
		for (let m = 0; m < mediaIds.length; m++) {
			const state = fresh(100 + s * 7 + m);
			const r = advertise(state, mediaIds[m]);
			eq(r.ok, true, 'advert ok');
			ok(r.msg.indexOf('{medium}') === -1, mediaIds[m] + ': message has no {medium} left: ' + r.msg);
			ok(state.pending.length === 0, 'advanceDay moved the note out of the tray');
			ok(state.today.events.indexOf(r.msg) !== -1, 'the note reached the paper');
		}
	}
});

// (i) deterministic for the same seed, and different seeds differ.
test('same seed gives the same result, different seeds differ', () => {
	function run(seed, mediaId) {
		const state = fresh(seed);
		const r = advertise(state, mediaId);
		return JSON.stringify({ msg: r.msg, outcome: r.outcome, day: state.day, cash: state.cash, buzz: state.buzz, rep: state.reputation });
	}
	for (let seed = 1; seed <= 20; seed++) {
		eq(run(seed, 'radio'), run(seed, 'radio'), 'seed ' + seed + ': identical rerun');
	}
	const seen = {};
	for (let seed = 1; seed <= 10; seed++) {
		seen[run(seed, 'tv')] = true;
	}
	ok(Object.keys(seen).length > 1, 'different seeds give different results');
});

done();
