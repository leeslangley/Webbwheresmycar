// Tests for src/art/characters_dave.js, run under jsc -m.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { drawDave } from '../src/art/characters_dave.js';

// First recorded call with the given method name, or undefined.
function first(ctx, name) {
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			return ctx.calls[i][1];
		}
	}
	return undefined;
}

// Every recorded call with the given method name.
function all(ctx, name) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('draws for t = 0, 1.3 and 3.2 without throwing, save/restore balanced', () => {
	for (const t of [0, 1.3, 3.2]) {
		const ctx = makeCtx();
		drawDave(ctx, 300, 520, 1, t);
		eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced at t=' + t);
		ok(count(ctx, 'fill') > 0, 'painted at t=' + t);
	}
});

test('rotates once by about 0.105 radians (the lean)', () => {
	const ctx = makeCtx();
	drawDave(ctx, 0, 0, 1, 0);
	const rots = all(ctx, 'rotate');
	eq(rots.length, 1, 'one rotate call');
	near(rots[0][0], 0.105, 1e-9, 'lean angle');
});

test('translate and scale come first, with the given x, y and s', () => {
	const ctx = makeCtx();
	drawDave(ctx, 1000, 510, 1.5, 0);
	eq(first(ctx, 'translate'), [1000, 510], 'first translate is x, y');
	eq(first(ctx, 'scale'), [1.5, 1.5], 'first scale is s, s');
});

test('paints the overalls and the cap', () => {
	const ctx = makeCtx();
	drawDave(ctx, 0, 0, 1, 0);
	ok(anySet(ctx, 'fillStyle', '#2f5d9e'), 'overalls blue assigned');
	ok(anySet(ctx, 'fillStyle', '#444444'), 'cap grey assigned');
});

test('paints the moustache', () => {
	const ctx = makeCtx();
	drawDave(ctx, 0, 0, 1, 0);
	ok(anySet(ctx, 'fillStyle', '#5a3b24'), 'moustache brown assigned');
});

test('blinks: the log at t = 3.25 differs from t = 1', () => {
	const a = makeCtx();
	drawDave(a, 0, 0, 1, 3.25);
	const b = makeCtx();
	drawDave(b, 0, 0, 1, 1);
	ok(JSON.stringify(a.calls) !== JSON.stringify(b.calls), 'blink changes the log');
});

test('the log at t = 0 differs from t = 1.3 (steam and bob move)', () => {
	const a = makeCtx();
	drawDave(a, 0, 0, 1, 0);
	const b = makeCtx();
	drawDave(b, 0, 0, 1, 1.3);
	ok(JSON.stringify(a.calls) !== JSON.stringify(b.calls), 'idle animation moves');
});

done();
