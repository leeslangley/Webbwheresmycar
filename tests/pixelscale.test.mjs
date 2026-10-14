// Tests for the pixel scale, snapping and car motion helpers (CC01), run
// under `jsc -m`.

import {
	setDeviceScale, getDeviceScale, pixelK, pixelSize, snapPx,
	driveIn, driveOut, idleBob, makeTracker,
} from '../src/art/pixelscale.js';
import { test, eq, ok, near, done } from './harness.js';

function isWhole(x) {
	return Math.abs(x - Math.round(x)) <= 1e-9;
}

test('ds=1: pixelSize(2) is 2 and snapPx(10.4) is 10', () => {
	setDeviceScale(1);
	eq(pixelSize(2), 2, 'pixelSize(2)');
	eq(snapPx(10.4), 10, 'snapPx(10.4)');
});

test('ds=2: pixelSize(2) is 2 and snapPx(10.3) is 10.5', () => {
	setDeviceScale(2);
	eq(pixelSize(2), 2, 'pixelSize(2)');
	eq(snapPx(10.3), 10.5, 'snapPx(10.3)');
});

test('ds=1.6375 (iPhone 15 Pro): whole device pixels per sprite pixel', () => {
	setDeviceScale(1.6375);
	eq(pixelK(2), 3, 'pixelK(2)');
	near(pixelSize(2), 3 / 1.6375, 1e-9, 'pixelSize(2)');
	ok(isWhole(pixelSize(2) * 1.6375), 'pixelSize(2) * ds is a whole number');
});

test('ds=0.4: pixelK never drops below 1', () => {
	setDeviceScale(0.4);
	eq(pixelK(2), 1, 'pixelK(2)');
	eq(pixelK(1), 1, 'pixelK(1) rounds to 0 without the floor of 1');
});

test('setDeviceScale falls back to 1 for 0 and NaN', () => {
	setDeviceScale(0);
	eq(getDeviceScale(), 1, 'scale after 0');
	setDeviceScale(2);
	setDeviceScale(NaN);
	eq(getDeviceScale(), 1, 'scale after NaN');
});

test('driveIn starts at -dist, ends at 0 and then stays there', () => {
	setDeviceScale(1);
	eq(driveIn(0, 0.7, 600), -600, 'driveIn at 0');
	eq(driveIn(0.7, 0.7, 600), 0, 'driveIn at dur');
	eq(driveIn(5, 0.7, 600), 0, 'driveIn past dur');
});

test('driveIn strictly increases over 0.1, 0.3, 0.5', () => {
	setDeviceScale(1);
	const a = driveIn(0.1, 0.7, 600);
	const b = driveIn(0.3, 0.7, 600);
	const c = driveIn(0.5, 0.7, 600);
	ok(a < b, 'driveIn 0.1 < 0.3: ' + a + ' ' + b);
	ok(b < c, 'driveIn 0.3 < 0.5: ' + b + ' ' + c);
});

test('driveOut starts at 0 and ends at dist', () => {
	setDeviceScale(1);
	eq(driveOut(0, 0.7, 600), 0, 'driveOut at 0');
	eq(driveOut(0.7, 0.7, 600), 600, 'driveOut at dur');
});

test('idleBob alternates 0 and -p every 0.45 s', () => {
	eq(idleBob(0, 2), 0, 'idleBob(0,2)');
	eq(idleBob(0.5, 2), -2, 'idleBob(0.5,2)');
	eq(idleBob(0.95, 2), 0, 'idleBob(0.95,2)');
});

test('makeTracker counts seconds since the key changed', () => {
	const tr = makeTracker();
	eq(tr.update('a', 5), 0, 'first a');
	eq(tr.update('a', 5.5), 0.5, 'a after 0.5 s');
	eq(tr.update('b', 6), 0, 'key change to b');
	eq(tr.update('b', 6.25), 0.25, 'b after 0.25 s');
});

setDeviceScale(1);

done();
