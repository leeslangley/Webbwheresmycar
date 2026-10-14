// Tests for ui/icons.js (card GU04): the pixel icon set drawn in code.
// Runs under macOS `jsc -m`.

import { test, eq, ok, throws, done } from './harness.js';
import { makeCtx, count, anySet, lastSet } from './fakectx.js';
import {
	ICON_DATA, ICON_NAMES, ICON_PAL, iconCells, iconSize, drawIcon,
} from '../src/ui/icons.js';

const CELLS = {
	coin: 108, star: 72, buzz: 63, calendar: 130, wrench: 68, key: 69, phone: 114,
	paper: 120, tick: 50, cross: 64, padlock: 100, warning: 102, fuel: 106, tyre: 116,
	plate_fatcat: 208, plate_stable: 208, plate_household: 208, plate_hammer: 208,
};

// Every fillStyle value that drawIcon may legitimately set.
function palValues() {
	return Object.keys(ICON_PAL).map(function (k) { return ICON_PAL[k]; });
}

// All fillRect calls of a ctx as [x, y, w, h] arrays.
function rects(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

// Every value assigned to fillStyle, in order.
function fillStyles(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:fillStyle') {
			out.push(ctx.calls[i][1][0]);
		}
	}
	return out;
}

test('ICON_NAMES has 18 entries in card order', () => {
	eq(ICON_NAMES.length, 18, 'count');
	eq(ICON_NAMES[0], 'coin', 'first');
	eq(ICON_NAMES[8], 'tick', 'tick at 8');
	eq(ICON_NAMES[13], 'tyre', 'tyre at 13');
	eq(ICON_NAMES[17], 'plate_hammer', 'last');
});

test('ICON_DATA has exactly the 18 names', () => {
	eq(Object.keys(ICON_DATA).length, 18, 'key count');
	for (let i = 0; i < ICON_NAMES.length; i++) {
		ok(typeof ICON_DATA[ICON_NAMES[i]] === 'string', ICON_NAMES[i] + ' is a string');
	}
});

test('iconCells matches the transcription table', () => {
	for (let i = 0; i < ICON_NAMES.length; i++) {
		const name = ICON_NAMES[i];
		eq(iconCells(name), CELLS[name], name + ' cells');
	}
});

test('iconSize is 12 for utility icons and 16 for plates', () => {
	for (let i = 0; i < ICON_NAMES.length; i++) {
		const name = ICON_NAMES[i];
		const want = name.indexOf('plate_') === 0 ? 16 : 12;
		eq(iconSize(name), want, name + ' size');
	}
});

test('every row has the right length and count', () => {
	for (let i = 0; i < ICON_NAMES.length; i++) {
		const name = ICON_NAMES[i];
		const size = iconSize(name);
		const rows = ICON_DATA[name].split('|');
		eq(rows.length, size, name + ' row count');
		for (let r = 0; r < rows.length; r++) {
			eq(rows[r].length, size, name + ' row ' + r + ' length');
		}
	}
});

test('drawIcon coin makes 55 fillRect runs', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'coin', 0, 0, 24);
	eq(count(ctx, 'fillRect'), 55, 'coin runs');
});

test('drawIcon cross makes 44 fillRect runs', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'cross', 0, 0, 24);
	eq(count(ctx, 'fillRect'), 44, 'cross runs');
});

test('drawIcon tick makes 40 fillRect runs', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'tick', 0, 0, 24);
	eq(count(ctx, 'fillRect'), 40, 'tick runs');
});

test('drawIcon star makes 43 fillRect runs', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'star', 0, 0, 24);
	eq(count(ctx, 'fillRect'), 43, 'star runs');
});

test('every fillRect of every icon lies inside its box', () => {
	for (let i = 0; i < ICON_NAMES.length; i++) {
		const name = ICON_NAMES[i];
		const ctx = makeCtx();
		drawIcon(ctx, name, 0, 0, 24);
		const rs = rects(ctx);
		for (let j = 0; j < rs.length; j++) {
			const r = rs[j];
			ok(r[0] >= 0 && r[1] >= 0, name + ' origin ' + JSON.stringify(r));
			ok(r[0] + r[2] <= 24 + 1e-9 && r[1] + r[3] <= 24 + 1e-9, name + ' edge ' + JSON.stringify(r));
		}
	}
});

test('every fillStyle used is a value of ICON_PAL', () => {
	const pal = palValues();
	for (let i = 0; i < ICON_NAMES.length; i++) {
		const name = ICON_NAMES[i];
		const ctx = makeCtx();
		drawIcon(ctx, name, 0, 0, 24);
		const styles = fillStyles(ctx);
		for (let j = 0; j < styles.length; j++) {
			ok(pal.indexOf(styles[j]) >= 0, name + ' style ' + styles[j]);
		}
	}
});

test('plate_hammer at 48 uses cell 3 and stays in its box', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'plate_hammer', 100, 50, 48);
	const rs = rects(ctx);
	let found = false;
	for (let j = 0; j < rs.length; j++) {
		if (rs[j][3] === 3) {
			found = true;
		}
		ok(rs[j][0] >= 100 && rs[j][1] >= 50, 'origin ' + JSON.stringify(rs[j]));
		ok(rs[j][0] + rs[j][2] <= 148 + 1e-9 && rs[j][1] + rs[j][3] <= 98 + 1e-9, 'edge ' + JSON.stringify(rs[j]));
	}
	ok(found, 'some fillRect has height 3');
});

test('drawIcon grey uses grey plate colours and no brass yellow', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'plate_hammer', 0, 0, 48, { grey: true });
	const styles = fillStyles(ctx);
	ok(styles.indexOf('#B8B8B8') >= 0, 'has #B8B8B8');
	ok(styles.indexOf('#FFE27A') < 0, 'no #FFE27A');
});

test('drawIcon without grey uses brass highlight', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'plate_hammer', 0, 0, 48);
	const styles = fillStyles(ctx);
	ok(styles.indexOf('#FFE27A') >= 0, 'has #FFE27A');
});

test('drawIcon alpha 0.5 sets globalAlpha then restores', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'coin', 0, 0, 24, { alpha: 0.5 });
	ok(anySet(ctx, 'globalAlpha', 0.5), 'globalAlpha set to 0.5');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore');
	eq(lastSet(ctx, 'globalAlpha'), 0.5, 'last globalAlpha is the alpha');
});

test('drawIcon with default opts leaves globalAlpha alone', () => {
	const ctx = makeCtx();
	drawIcon(ctx, 'coin', 0, 0, 24);
	eq(count(ctx, 'save'), 0, 'no save');
	eq(lastSet(ctx, 'globalAlpha'), undefined, 'globalAlpha untouched');
});

test('drawIcon throws for an unknown name', () => {
	const ctx = makeCtx();
	throws(function () { drawIcon(ctx, 'nope', 0, 0, 12); }, 'unknown name');
	throws(function () { iconCells('nope'); }, 'iconCells unknown');
	throws(function () { iconSize('nope'); }, 'iconSize unknown');
});

done();
