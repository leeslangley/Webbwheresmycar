// Tests for the Garage scene plate path (card GE19), run under `jsc -m`.
// With app.rooms holding the 'garage' plate, the scene draws the plate, the
// strip lights, dust and vignette. Without it, the old gradient room is drawn.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { garageScene, LAYOUT } from '../src/ui/scenes/garage.js';
import { startGame } from '../src/sim/newgame.js';

// A stable car instance with every field DESIGN.md 4.3 requires.
function makeCar(id, modelId) {
	return {
		id: id,
		modelId: modelId,
		owned: true,
		owner: 'you',
		rentMonthly: 0,
		paid: 6500,
		condition: 5,
		fault: null,
		lastServiceDay: 0,
		jobsDone: 0,
		boughtDay: 1,
		impoundedUntil: 0,
		rentedAtCondition: null,
	};
}

// A fake rooms object: has() is true only for the ids given, and draw()
// records every call in rooms.calls.
function fakeRooms(ids) {
	const rooms = {
		calls: [],
		has: function (id) {
			return ids.indexOf(id) !== -1;
		},
		draw: function (ctx, id, opts) {
			rooms.calls.push(['draw', id, opts]);
			return true;
		},
	};
	return rooms;
}

// Set up the scene over a fresh game with one owned car.
function setup(rooms) {
	const state = startGame(2);
	state.cars = [makeCar('c1', 't1_maurice')];
	const app = makeApp(state);
	if (rooms !== undefined) {
		app.rooms = rooms;
	}
	garageScene.enter(app, null);
	return app;
}

// True when the log has a linear gradient made with exactly these arguments.
// The old garage room paints its wall with createLinearGradient(0, 0, 0, 460)
// and its floor with createLinearGradient(0, 460, 0, h).
function hasLinearGradient(ctx, args) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'createLinearGradient' && JSON.stringify(c[1]) === JSON.stringify(args)) {
			return true;
		}
	}
	return false;
}

// Number of 2x2 fillRect calls: the dust motes are the only 2x2 rects drawn.
function count2x2(ctx) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'fillRect' && c[1][2] === 2 && c[1][3] === 2) {
			n += 1;
		}
	}
	return n;
}

// Number of recorded assignments to prop with value v.
function countSet(ctx, prop, v) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'set:' + prop && c[1][0] === v) {
			n += 1;
		}
	}
	return n;
}

test('plate path: one room draw of the garage plate, no old gradient room', () => {
	const rooms = fakeRooms(['garage']);
	const app = setup(rooms);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0.5);
	eq(rooms.calls, [['draw', 'garage', { look: { x: 0, y: 0 } }]], 'one garage plate draw');
	ok(!hasLinearGradient(ctx, [0, 0, 0, 460]), 'old room wall gradient not drawn');
	ok(!hasLinearGradient(ctx, [0, 460, 0, 720]), 'old room floor gradient not drawn');
});

test('plate path: strip lights, dust and vignette are drawn', () => {
	const rooms = fakeRooms(['garage']);
	const app = setup(rooms);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0.5);
	ok(countSet(ctx, 'globalCompositeOperation', 'lighter') >= 3, 'three strip light glows drawn additively');
	ok(anySet(ctx, 'globalCompositeOperation', 'lighter'), 'lighter composite was used');
	ok(count2x2(ctx) >= 24, 'the 24 dust motes are drawn as 2x2 rects');
	ok(count(ctx, 'createRadialGradient') >= 4, 'three glows and the vignette use radial gradients');
});

test('fallback: rooms without the garage plate draws the old gradient room', () => {
	const rooms = fakeRooms([]);
	const app = setup(rooms);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0.5);
	eq(rooms.calls, [], 'no plate draw when the garage plate is not loaded');
	ok(hasLinearGradient(ctx, [0, 0, 0, 460]), 'old room wall gradient drawn');
	ok(hasLinearGradient(ctx, [0, 460, 0, 720]), 'old room floor gradient drawn');
});

test('fallback: no app.rooms at all still draws and uses the old gradient room', () => {
	const app = setup();
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0.5);
	ok(hasLinearGradient(ctx, [0, 0, 0, 460]), 'old room wall gradient drawn without app.rooms');
	ok(hasLinearGradient(ctx, [0, 460, 0, 720]), 'old room floor gradient drawn without app.rooms');
	ok(count(ctx, 'fillText') > 0, 'labels drawn');
});

test('tap rule: down on BACK, redraw with a different t, up pops the scene', () => {
	const app = setup(fakeRooms(['garage']));
	garageScene.draw(makeCtx(), app, 0);
	const bx = LAYOUT.back.x + LAYOUT.back.w / 2;
	const by = LAYOUT.back.y + LAYOUT.back.h / 2;
	garageScene.pointer(app, 'down', bx, by);
	garageScene.draw(makeCtx(), app, 0.25);
	garageScene.pointer(app, 'up', bx, by);
	eq(app.calls, [['pop']], 'BACK popped the scene exactly once');
});

done();
