// Tests for src/art/stage.js, run under jsc -m.

import { test, eq, ok, done } from './harness.js';
import { STAGE, ART, ROOM_IDS, inTableau, artRect, bandRows } from '../src/art/stage.js';

test('banner, tableau and hud heights add up to 720', () => {
	eq(STAGE.banner.h + STAGE.tableau.h + STAGE.hud.h, 720, 'zone heights sum');
});

test('the three zones touch with no gap or overlap', () => {
	eq(STAGE.banner.y + STAGE.banner.h, STAGE.tableau.y, 'banner meets tableau');
	eq(STAGE.tableau.y + STAGE.tableau.h, STAGE.hud.y, 'tableau meets hud');
});

test('inTableau accepts the whole tableau rect', () => {
	ok(inTableau({ x: 0, y: 120, w: 1280, h: 470 }), 'full tableau is inside');
});

test('inTableau rejects a rect that pokes into the banner', () => {
	ok(!inTableau({ x: 0, y: 100, w: 10, h: 10 }), 'rect starting at y 100 is outside');
});

test('inTableau rejects a rect past the right edge', () => {
	ok(!inTableau({ x: 1275, y: 200, w: 10, h: 10 }), 'rect ending at x 1285 is outside');
});

test('artRect maps the tableau onto plate pixels', () => {
	eq(artRect(STAGE.tableau), { x: 0, y: 60, w: 640, h: 235 }, 'tableau in plate px');
});

test('bandRows gives the plate rows of the tableau', () => {
	eq(bandRows(), { y0: 60, y1: 295 }, 'band rows');
});

test('ART is 640x360 at scale 2', () => {
	eq([ART.w, ART.h, ART.scale], [640, 360, 2], 'plate size and scale');
});

test('ROOM_IDS has 6 entries', () => {
	eq(ROOM_IDS.length, 6, 'six rooms');
});

done();
