// Golden fixture for the Godot CoreClock port (godot/core/clock.gd). Run by: sh tools/godot/golden.sh clock
// Emits the JS reference (src/core/clock.js) for every day 1..365 and the constants.

import { emit } from './golden_common.mjs';
import {
	MONTH_NAMES,
	MONTH_LENGTHS,
	DAYS_IN_YEAR,
	AUCTION_DAY_OF_MONTH,
	dateOf,
	dayOfYearStart,
	isMonthStart,
	isAuctionDay,
	daysLeftInMonth
} from '../../src/core/clock.js';

const dates = [];
const monthStartDays = [];
const auctionDays = [];
const daysLeft = [];

for (let day = 1; day <= DAYS_IN_YEAR; day++) {
	const d = dateOf(day);
	dates.push([day, d.month, d.dayOfMonth, d.monthName]);
	if (isMonthStart(day)) {
		monthStartDays.push(day);
	}
	if (isAuctionDay(day)) {
		auctionDays.push(day);
	}
	daysLeft.push(daysLeftInMonth(day));
}

const monthStarts = [];
for (let m = 1; m <= 12; m++) {
	monthStarts.push(dayOfYearStart(m));
}

emit({
	dates: dates,
	monthStarts: monthStarts,
	monthStartDays: monthStartDays,
	auctionDays: auctionDays,
	daysLeft: daysLeft,
	constants: {
		names: MONTH_NAMES,
		lengths: MONTH_LENGTHS,
		year: DAYS_IN_YEAR,
		auction: AUCTION_DAY_OF_MONTH
	}
});
