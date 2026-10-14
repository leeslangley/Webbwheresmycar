// Golden fixture for CoreFormat (GDF07): the JS reference src/core/format.js, run under jsc -m.
// Run by: sh tools/godot/golden.sh format

import { emit } from './golden_common.mjs';
import { money, oneDp, dateText, stars, plural } from '../../src/core/format.js';

const MONEY_IN = [1234, 0, 1234567, 12.6, -1234, -0.4, 999, 1000, 12.4, -12.6, 0.4, 1000000000, 0.5, -0.5, 12.5, -12.5, -0.6, 100, 99999.5, 1000000000000];
const ONE_DP_IN = [2, 7.46, 0, 7.44, 10, -1.25, 0.05, 0.25, 2.675, -0.04, 99.95];
const STARS_IN = [0, 3.4, 3.5, 7, 10, 11, -2, 4.5];
const PLURAL_IN = [[1, 'car', 'cars'], [0, 'car', 'cars'], [2, 'day', 'days'], [-1, 'bill', 'bills'], [101, 'win', 'wins']];

const dates = [];
for (let d = 1; d <= 365; d++) {
	dates.push(dateText(d));
}

emit({
	money: MONEY_IN.map((n) => [n, money(n)]),
	oneDp: ONE_DP_IN.map((n) => [n, oneDp(n)]),
	dateText: dates,
	stars: STARS_IN.map((n) => [n, stars(n)]),
	plural: PLURAL_IN.map(([n, one, many]) => [n, one, many, plural(n, one, many)]),
});
