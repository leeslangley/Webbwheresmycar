// Pure calendar maths for the 365-day game year (DESIGN.md 4.1).
// No leap years, no time zones, no Date object.

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const DAYS_IN_YEAR = 365;

export const AUCTION_DAY_OF_MONTH = 24;

// Cumulative day number of the 1st of each month (1-based).
const MONTH_STARTS = (() => {
	const starts = [];
	let day = 1;
	for (let i = 0; i < 12; i++) {
		starts.push(day);
		day += MONTH_LENGTHS[i];
	}
	return starts;
})();

function requireDay(day) {
	if (typeof day !== 'number' || !isFinite(day) || day % 1 !== 0 || day < 1 || day > DAYS_IN_YEAR) {
		throw new RangeError('day out of range');
	}
}

function requireMonth(month) {
	if (typeof month !== 'number' || !isFinite(month) || month % 1 !== 0 || month < 1 || month > 12) {
		throw new RangeError('month out of range');
	}
}

export function dateOf(day) {
	requireDay(day);
	let m = 12;
	while (day < MONTH_STARTS[m - 1]) {
		m -= 1;
	}
	return { month: m, dayOfMonth: day - MONTH_STARTS[m - 1] + 1, monthName: MONTH_NAMES[m - 1] };
}

export function dayOfYearStart(month) {
	requireMonth(month);
	return MONTH_STARTS[month - 1];
}

export function isMonthStart(day) {
	return dateOf(day).dayOfMonth === 1;
}

export function isAuctionDay(day) {
	return dateOf(day).dayOfMonth === AUCTION_DAY_OF_MONTH;
}

export function daysLeftInMonth(day) {
	const d = dateOf(day);
	return MONTH_LENGTHS[d.month - 1] - d.dayOfMonth;
}
