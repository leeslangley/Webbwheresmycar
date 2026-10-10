// Text formatting helpers (DESIGN.md 4.2, 9.3): money, one-decimal numbers,
// day-of-year dates, star ratings and plurals. Pure: no DOM, no Date.

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Insert comma thousands separators into a digit string: '1234567' -> '1,234,567'.
function commaGroup(digits) {
	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// money(n) -> '£1,234'. Round to an integer first; negatives are '-£1,234';
// a value that rounds to 0 prints '£0' (never '-£0').
export function money(n) {
	const rounded = Math.round(n);
	const sign = rounded < 0 ? '-' : '';
	return sign + '£' + commaGroup(String(Math.abs(rounded)));
}

// oneDp(n) -> n.toFixed(1) with a tiny epsilon so halves land the right way.
export function oneDp(n) {
	return Number((n + 1e-9).toFixed(1)).toFixed(1);
}

// dateText(day) -> '24 February'. Day is an integer 1..365, else RangeError.
export function dateText(day) {
	if (typeof day !== 'number' || day % 1 !== 0 || day < 1 || day > 365) {
		throw new RangeError('day must be an integer 1..365, got ' + day);
	}
	let rest = day;
	for (let m = 0; m < 12; m++) {
		if (rest <= MONTH_LENGTHS[m]) {
			return rest + ' ' + MONTH_NAMES[m];
		}
		rest -= MONTH_LENGTHS[m];
	}
	throw new RangeError('day out of range: ' + day);
}

// stars(n) -> 10 characters, filled '★' then empty '☆'. n is clamped 0..10
// and rounded to the nearest integer.
export function stars(n) {
	const v = Math.min(10, Math.max(0, Math.round(n)));
	return '★'.repeat(v) + '☆'.repeat(10 - v);
}

// plural(n, one, many) -> '1 car' / '3 cars'.
export function plural(n, one, many) {
	return n + ' ' + (n === 1 ? one : many);
}
