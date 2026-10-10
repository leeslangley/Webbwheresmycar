// Tests for core/clock.js, run under `jsc -m` (no console; print only).

import { test, eq, ok, throws, done } from './harness.js';
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
} from '../src/core/clock.js';

test('constants', () => {
	eq(MONTH_NAMES, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], 'month names');
	eq(MONTH_LENGTHS, [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], 'month lengths');
	eq(MONTH_LENGTHS.reduce((a, b) => a + b, 0), 365, 'sum of MONTH_LENGTHS is 365');
	eq(DAYS_IN_YEAR, 365, 'days in year');
	eq(AUCTION_DAY_OF_MONTH, 24, 'auction day of month');
});

test('month start days', () => {
	const starts = [];
	for (let m = 1; m <= 12; m++) {
		starts.push(dayOfYearStart(m));
	}
	eq(starts, [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], 'month start days 1..12');
});

test('dateOf spot checks', () => {
	eq(dateOf(1), { month: 1, dayOfMonth: 1, monthName: 'January' }, 'day 1 is Jan 1');
	eq(dateOf(31), { month: 1, dayOfMonth: 31, monthName: 'January' }, 'day 31 is January 31');
	eq(dateOf(32), { month: 2, dayOfMonth: 1, monthName: 'February' }, 'day 32 is Feb 1');
	eq(dateOf(59), { month: 2, dayOfMonth: 28, monthName: 'February' }, 'day 59 is Feb 28');
	eq(dateOf(60), { month: 3, dayOfMonth: 1, monthName: 'March' }, 'day 60 is Mar 1');
	eq(dateOf(365), { month: 12, dayOfMonth: 31, monthName: 'December' }, 'day 365 is Dec 31');
	eq(dateOf(24).dayOfMonth, 24, 'day 24 is the 24th');
	eq(dateOf(358).dayOfMonth, 24, 'day 358 is the 24th');
});

test('dateOf rejects bad input', () => {
	throws(() => dateOf(0), 'day 0 throws');
	throws(() => dateOf(366), 'day 366 throws');
	throws(() => dateOf(1.5), 'day 1.5 throws');
	throws(() => dateOf(-1), 'negative day throws');
	throws(() => dateOf(NaN), 'NaN throws');
	throws(() => dateOf(Infinity), 'Infinity throws');
	throws(() => dateOf('3'), 'string throws');
});

test('dayOfYearStart rejects bad input', () => {
	throws(() => dayOfYearStart(0), 'month 0 throws');
	throws(() => dayOfYearStart(13), 'month 13 throws');
	throws(() => dayOfYearStart(2.5), 'month 2.5 throws');
	throws(() => dayOfYearStart('March'), 'string month throws');
});

test('isMonthStart flags exactly 12 days', () => {
	const starts = [];
	for (let d = 1; d <= DAYS_IN_YEAR; d++) {
		if (isMonthStart(d)) {
			starts.push(d);
		}
	}
	eq(starts, [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], 'isMonthStart days');
	ok(starts.length === 12, 'exactly 12 month starts');
});

test('isAuctionDay flags exactly 12 days, first 24 and last 358', () => {
	const days = [];
	for (let d = 1; d <= DAYS_IN_YEAR; d++) {
		if (isAuctionDay(d)) {
			days.push(d);
		}
	}
	ok(days.length === 12, 'exactly 12 auction days');
	eq(days[0], 24, 'first auction day is 24');
	eq(days[days.length - 1], 358, 'last auction day is 358');
	for (let i = 0; i < days.length; i++) {
		eq(dateOf(days[i]).dayOfMonth, AUCTION_DAY_OF_MONTH, 'each auction day is day-of-month 24');
	}
});

test('daysLeftInMonth', () => {
	eq(daysLeftInMonth(1), 30, 'Jan 1 leaves 30');
	eq(daysLeftInMonth(31), 0, 'Jan 31 leaves 0');
	eq(daysLeftInMonth(365), 0, 'Dec 31 leaves 0');
	eq(daysLeftInMonth(32), 27, 'Feb 1 leaves 27');
	eq(daysLeftInMonth(59), 0, 'Feb 28 leaves 0');
	eq(daysLeftInMonth(60), 30, 'Mar 1 leaves 30');
	throws(() => daysLeftInMonth(366), 'day 366 throws');
});

done();
