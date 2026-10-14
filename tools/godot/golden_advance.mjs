// Golden fixture for godot/sim/advance.gd (GDS12): runs src/sim/advance.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh advance   (writes godot/tests/golden/advance.json)

import { advanceDay, startOfDayFlags } from '../../src/sim/advance.js';
import { fresh, addCar, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

// S1-S8: one ordinary day from fresh games, seeds 1..8.
for (let seed = 1; seed <= 8; seed++) {
	cases.push(stateCase('advance_day', 'S' + seed + ' fresh game seed ' + seed, fresh(seed), [], s => advanceDay(s)));
}

// S9: month end on Feb 1 (day 31 -> 32) with two owned cars and one rented car.
{
	const s = fresh(2);
	s.day = 31;
	addCar(s, 't1_allergy', { condition: 6 });
	addCar(s, 't3_porshe', { condition: 8 });
	addCar(s, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 5, condition: 4 });
	cases.push(stateCase('advance_day', 'S9 month end on Feb 1 with owned and rented cars', s, [], x => advanceDay(x)));
}

// S10: the day before the auction (23 -> 24).
{
	const s = fresh(3);
	s.day = 23;
	cases.push(stateCase('advance_day', 'S10 auction day tomorrow', s, [], x => advanceDay(x)));
}

// S11: day 364 -> 365, last full day of the year.
{
	const s = fresh(4);
	s.day = 364;
	cases.push(stateCase('advance_day', 'S11 day 364 to 365', s, [], x => advanceDay(x)));
}

// S12: day 365 -> 366, the year is over: no bills, no phone, no paper.
{
	const s = fresh(5);
	s.day = 365;
	cases.push(stateCase('advance_day', 'S12 year over, no bills or phone', s, [], x => advanceDay(x)));
}

// S13: a finished game never moves.
{
	const s = fresh(6);
	s.flags.gameOver = true;
	cases.push(stateCase('advance_day', 'S13 game already over, nothing changes', s, [], x => advanceDay(x)));
}

// S14: reputation 85 wins the household plate.
{
	const s = fresh(7);
	s.reputation = 85;
	cases.push(stateCase('advance_day', 'S14 reputation 85 wins a plate', s, [], x => advanceDay(x)));
}

// S15: broke (cash under 1000).
{
	const s = fresh(8);
	s.cash = 500;
	cases.push(stateCase('advance_day', 'S15 broke', s, [], x => advanceDay(x)));
}

// S16: rich (cash over 50000).
{
	const s = fresh(9);
	s.cash = 60000;
	cases.push(stateCase('advance_day', 'S16 rich', s, [], x => advanceDay(x)));
}

// S17: full garage with pending notes and a situation tag already in the tray.
{
	const s = fresh(10);
	s.garageSlots = 3;
	addCar(s, 't1_allergy');
	addCar(s, 't2_serious');
	addCar(s, 't3_porshe');
	s.pending = ['A note'];
	s.sit = ['bigwin'];
	cases.push(stateCase('advance_day', 'S17 full garage, pending note and sit', s, [], x => advanceDay(x)));
}

// S18: a stale request expires (Q81, expiresDay 5) and a live one stays (Q82, expiresDay 20); shop refresh on day 8.
{
	const s = fresh(11);
	s.day = 7;
	s.requests = [
		{ id: 'Q81', jobTypeId: 'wedding', customer: 'Mrs Test', fee: 500, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: 5, blurb: 'x' },
		{ id: 'Q82', jobTypeId: 'wedding', customer: 'Mrs Test', fee: 500, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: 20, blurb: 'x' },
	];
	cases.push(stateCase('advance_day', 'S18 request expiry and shop refresh on day 8', s, [], x => advanceDay(x)));
}

// S19: bankrupt at month end (cash -3000 on Jan 31 -> Feb 1).
{
	const s = fresh(12);
	s.day = 31;
	s.cash = -3000;
	cases.push(stateCase('advance_day', 'S19 bankrupt at month end', s, [], x => advanceDay(x)));
}

// S20-S21: buzz fades a tenth a day and is rounded to one decimal (100 -> 90; 0.4 -> 0.36 -> 0.4).
{
	const s = fresh(13);
	s.buzz = 100;
	cases.push(stateCase('advance_day', 'S20 buzz 100 fades to 90', s, [], x => advanceDay(x)));
}
{
	const s = fresh(14);
	s.buzz = 0.4;
	cases.push(stateCase('advance_day', 'S21 tiny buzz rounds back to 0.4', s, [], x => advanceDay(x)));
}

// Sixty days in a row from a game with two cars.
{
	const s = fresh(2);
	addCar(s, 't1_allergy', { condition: 6 });
	addCar(s, 't2_serious', { condition: 7 });
	cases.push(stateCase('advance_seq', 'sixty days seed 2', s, [60], (w, n) => {
		const out = [];
		for (let i = 0; i < n; i++) {
			advanceDay(w);
			out.push([w.day, w.cash, w.reputation, w.buzz, w.today.headline, w.today.events.length, w.requests.length]);
		}
		return out;
	}));
}

// startOfDayFlags on a bare day number.
for (const d of [1, 10, 24, 365]) {
	cases.push(stateCase('start_of_day_flags', 'day ' + d, { day: d }, [], s => startOfDayFlags(s)));
}

emitCases('advance', cases);
