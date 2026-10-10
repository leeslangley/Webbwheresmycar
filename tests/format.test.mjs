// Tests for src/core/format.js, run under `jsc -m`.

import { test, eq, throws, done } from './harness.js';
import { money, oneDp, dateText, stars, plural } from '../src/core/format.js';

test('money formats card examples', () => {
	eq(money(1234), '£1,234', 'plain thousands');
	eq(money(0), '£0', 'zero');
	eq(money(1234567), '£1,234,567', 'millions');
	eq(money(12.6), '£13', 'rounds up first');
	eq(money(-1234), '-£1,234', 'negative');
	eq(money(-0.4), '£0', 'never -£0');
});

test('money edge cases', () => {
	eq(money(999), '£999', 'no separator needed');
	eq(money(1000), '£1,000', 'exactly one thousand');
	eq(money(12.4), '£12', 'rounds down');
	eq(money(-12.6), '-£13', 'negative rounds away from zero');
	eq(money(0.4), '£0', 'small positive rounds to zero');
	eq(money(1000000000), '£1,000,000,000', 'billions');
});

test('oneDp', () => {
	eq(oneDp(2), '2.0', 'integer gets .0');
	eq(oneDp(7.46), '7.5', 'rounds up');
	eq(oneDp(0), '0.0', 'zero');
	eq(oneDp(7.44), '7.4', 'rounds down');
	eq(oneDp(10), '10.0', 'ten');
	eq(oneDp(-1.25), '-1.2', 'negative (half away from zero not required)');
});

test('dateText day-of-year to date', () => {
	eq(dateText(1), '1 January', 'first day');
	eq(dateText(55), '24 February', 'card example');
	eq(dateText(31), '31 January', 'end of January');
	eq(dateText(32), '1 February', 'start of February');
	eq(dateText(365), '31 December', 'last day');
	eq(dateText(59), '28 February', 'end of non-leap February');
	eq(dateText(60), '1 March', 'first day of March');
});

test('dateText rejects bad input', () => {
	throws(() => dateText(0), 'day 0');
	throws(() => dateText(366), 'day 366');
	throws(() => dateText(-5), 'negative day');
	throws(() => dateText(1.5), 'non-integer day');
	throws(() => dateText('55'), 'string day');
});

test('stars renders 10 characters', () => {
	eq(stars(7), '★★★★★★★☆☆☆', 'card example');
	eq(stars(0), '☆☆☆☆☆☆☆☆☆☆', 'all empty');
	eq(stars(10), '★★★★★★★★★★', 'all filled');
	eq(stars(3.6), '★★★★☆☆☆☆☆☆', 'rounds to nearest');
	eq(stars(-3), '☆☆☆☆☆☆☆☆☆☆', 'clamped low');
	eq(stars(99), '★★★★★★★★★★', 'clamped high');
	eq(stars(7).length, 10, 'always ten characters');
});

test('plural picks the right form', () => {
	eq(plural(1, 'car', 'cars'), '1 car', 'singular');
	eq(plural(3, 'car', 'cars'), '3 cars', 'plural');
	eq(plural(0, 'car', 'cars'), '0 cars', 'zero is plural');
	eq(plural(21, 'car', 'cars'), '21 cars', 'twenty-one');
});

done();
