// The day clock (DESIGN.md sections 4.1, 4.7, 4.8, 4.9). Every player
// action ends by calling advanceDay: it moves the calendar forward one day
// and runs everything that happens overnight -- decay, month-end bills,
// the phone, the TV shop, the plates and tomorrow's newspaper. Pure sim
// module: randomness only through state.rng, no DOM, no dates.

import { roundTo, pick } from '../core/rng.js';
import { isMonthStart, isAuctionDay, DAYS_IN_YEAR } from '../core/clock.js';
import { money } from '../core/format.js';
import { modelOf } from '../data/cars.js';
import { idleDecay, changeCondition } from './carstats.js';
import { monthEnd } from './month.js';
import { expireRequests, generateRequests } from './jobsim.js';
import { shouldRefresh, refreshShop } from './shop.js';
import { evaluatePlates, checkEnd, PLATE_INFO } from './endgame.js';
import { chooseHeadline } from './news.js';

// advanceDay(state) -> void. Mutates state in place: one day passes.
export function advanceDay(state) {
	// A finished game never moves.
	if (state.flags.gameOver) {
		return;
	}

	// (1) every car in the stable rots a little overnight.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		changeCondition(car, -idleDecay(modelOf(car.modelId)));
	}

	// (2) yesterday's hype fades by a tenth.
	state.buzz = Math.max(0, roundTo(state.buzz * 0.9, 0.1));

	// (3) tear the page off the calendar.
	state.day += 1;

	// (4) the actions' notes and situations move out of the tray.
	const events = [...state.pending];
	const sit = [...state.sit];
	state.pending = [];
	state.sit = [];
	let monthReport = null;

	// (5) past day 365 the year is over: no bills, no phone, no paper.
	if (state.day > DAYS_IN_YEAR) {
		state.today = { day: state.day, headline: '', events: events, monthReport: null };
		checkEnd(state);
		return;
	}

	// (6) the first of a month: last month's bills come in.
	if (isMonthStart(state.day)) {
		monthReport = monthEnd(state);
		events.push('Month end: bills of ' + money(monthReport.total));
		for (let i = 0; i < monthReport.newFaults.length; i++) {
			events.push(monthReport.newFaults[i]);
		}
		sit.push('monthend');
	}

	// (7) the phone: stale requests go, fresh ones ring in.
	expireRequests(state);
	if (generateRequests(state) > 0) {
		events.push('The phone rings: new booking request(s)!');
	}

	// (8) the telly gets a new batch of motors every seven days.
	if (shouldRefresh(state.day)) {
		refreshShop(state);
		events.push('New cars on the TV!');
	}

	// (9) any Gold Number Plates newly within reach.
	const newPlates = evaluatePlates(state);
	for (let i = 0; i < newPlates.length; i++) {
		events.push('GOLD NUMBER PLATE won: ' + PLATE_INFO[newPlates[i]].name + '!');
	}

	// (10) today's situations, for the reactive front page.
	if (state.cash < 1000) {
		sit.push('broke');
	}
	if (state.cash > 50000) {
		sit.push('rich');
	}
	if (state.cars.length >= state.garageSlots) {
		sit.push('fullgarage');
	}
	if (state.cars.length === 0) {
		sit.push('emptygarage');
	}
	if (isAuctionDay(state.day)) {
		sit.push('auctionday');
	}

	// (11) fill in the {car} and {customer} gossip, if there is any.
	const ctx = { cash: state.cash };
	if (state.cars.length > 0) {
		ctx.car = modelOf(pick(state, state.cars).modelId).name;
	}
	if (state.requests.length > 0) {
		ctx.customer = pick(state, state.requests).customer;
	}
	const headline = chooseHeadline(state, sit, ctx);

	// (12) today's paper goes up on the wall.
	state.today = { day: state.day, headline: headline, events: events, monthReport: monthReport };

	// (13) did we just win or lose?
	checkEnd(state);
}

// A tiny helper for the UI: what kind of day is it? Read-only.
export function startOfDayFlags(state) {
	return {
		isAuctionDay: isAuctionDay(state.day),
		isMonthStart: isMonthStart(state.day),
		daysLeftInYear: DAYS_IN_YEAR - state.day,
	};
}
