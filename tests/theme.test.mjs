// Tests for src/ui/theme.js, run under `jsc -m`.

import { test, eq, ok, throws, done } from './harness.js';
import { PALETTE, font, shade, rgba } from '../src/ui/theme.js';

test('PALETTE has 23 keys, all #rrggbb', () => {
	const keys = Object.keys(PALETTE);
	eq(keys.length, 23, '23 palette keys');
	for (const k of keys) {
		ok(/^#[0-9A-Fa-f]{6}$/.test(PALETTE[k]), 'hex format for ' + k);
	}
});

test('PALETTE holds the 16 C64 colours and accents', () => {
	eq(PALETTE.black, '#000000', 'black');
	eq(PALETTE.white, '#FFFFFF', 'white');
	eq(PALETTE.red, '#68372B', 'red');
	eq(PALETTE.cyan, '#70A4B2', 'cyan');
	eq(PALETTE.purple, '#6F3D86', 'purple');
	eq(PALETTE.green, '#588D43', 'green');
	eq(PALETTE.blue, '#352879', 'blue');
	eq(PALETTE.yellow, '#B8C76F', 'yellow');
	eq(PALETTE.orange, '#6F4F25', 'orange');
	eq(PALETTE.brown, '#433900', 'brown');
	eq(PALETTE.lightred, '#9A6759', 'lightred');
	eq(PALETTE.darkgrey, '#444444', 'darkgrey');
	eq(PALETTE.midgrey, '#6C6C6C', 'midgrey');
	eq(PALETTE.lightgreen, '#9AD284', 'lightgreen');
	eq(PALETTE.lightblue, '#6C5EB5', 'lightblue');
	eq(PALETTE.lightgrey, '#959595', 'lightgrey');
	eq(PALETTE.cream, '#F4E9C8', 'cream');
	eq(PALETTE.paper, '#FFF7DC', 'paper');
	eq(PALETTE.lamp, '#FFD27A', 'lamp');
	eq(PALETTE.ink, '#14102A', 'ink');
	eq(PALETTE.good, '#3FAE49', 'good');
	eq(PALETTE.bad, '#D9483B', 'bad');
	eq(PALETTE.gold, '#E8B923', 'gold');
});

test('font strings', () => {
	eq(font('title', 16), '16px "Press Start 2P", monospace', 'title font');
	eq(font('body', 24), '24px VT323, monospace', 'body font');
	throws(() => font('x', 1), 'unknown font kind');
	throws(() => font('heading', 10), 'another unknown kind');
});

test('shade positive mixes toward white', () => {
	eq(shade('#000000', 0.5), '#808080', 'black halfway to white');
	eq(shade('#336699', 0.5), '#99b3cc', 'blue halfway to white');
	eq(shade('#336699', 1), '#ffffff', 'full amount is white');
});

test('shade negative mixes toward black', () => {
	eq(shade('#ffffff', -0.5), '#808080', 'white halfway to black');
	eq(shade('#336699', -1), '#000000', 'full negative is black');
});

test('shade zero and clamping', () => {
	eq(shade('#336699', 0), '#336699', 'zero amount is unchanged');
	eq(shade('#336699', 2), '#ffffff', 'amount clamped high');
	eq(shade('#336699', -2), '#000000', 'amount clamped low');
});

test('shade is case-insensitive and rounds channels', () => {
	eq(shade('#ABCDEF', 0), '#abcdef', 'uppercase input, lowercase output');
	eq(shade('#123456', 0.25), '#4d6780', 'rounded channels');
});

test('rgba string', () => {
	eq(rgba('#ff0000', 0.5), 'rgba(255,0,0,0.5)', 'red with alpha');
	eq(rgba('#000000', 0.35), 'rgba(0,0,0,0.35)', 'shadow colour');
	eq(rgba('#FFFFFF', 1), 'rgba(255,255,255,1)', 'uppercase hex accepted');
});

test('bad inputs throw', () => {
	throws(() => font(null, 16), 'null font kind');
	throws(() => shade(null, 0), 'null hex');
	throws(() => shade(undefined, 0), 'undefined hex');
	throws(() => shade('#336699', NaN), 'NaN amount');
	throws(() => shade('#336699', '0.5'), 'string amount');
});

test('bad hex throws', () => {
	throws(() => shade('336699', 0.5), 'missing hash');
	throws(() => shade('#33669', 0.5), 'too short');
	throws(() => shade('#3366999', 0.5), 'too long');
	throws(() => shade('#3366zz', 0.5), 'not hex digits');
	throws(() => shade('', 0.5), 'empty string');
	throws(() => rgba('nope', 0.5), 'rgba bad hex');
});

done();
