// Tests for src/art/characters_mark.js (drawMarkHead), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet, reset } from './fakectx.js';
import { drawMarkHead } from '../src/art/characters_mark.js';

const MOODS = ['normal', 'happy', 'worried'];

// Draw a head and return the recording context.
function draw(t, mood) {
	const ctx = makeCtx();
	drawMarkHead(ctx, t, mood);
	return ctx;
}

test('every mood at t=0 and t=2 draws without throwing, save/restore balanced', () => {
	for (let m = 0; m < MOODS.length; m++) {
		const times = [0, 2];
		for (let i = 0; i < times.length; i++) {
			const ctx = makeCtx();
			let threw = null;
			try {
				drawMarkHead(ctx, times[i], MOODS[m]);
			} catch (e) {
				threw = e;
			}
			eq(threw, null, MOODS[m] + ' at t=' + times[i] + ' does not throw');
			eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
		}
	}
});

test('default mood also draws without throwing', () => {
	const ctx = makeCtx();
	drawMarkHead(ctx, 1);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
});

test('at least 20 arc/ellipse calls per draw', () => {
	for (let m = 0; m < MOODS.length; m++) {
		const ctx = draw(0, MOODS[m]);
		ok(count(ctx, 'arc') + count(ctx, 'ellipse') >= 20, MOODS[m] + ' has 20+ arcs/ellipses');
	}
});

test('skin, glasses colours and glasses line width', () => {
	const ctx = draw(0, 'normal');
	ok(anySet(ctx, 'fillStyle', '#f1c9a5'), 'skin colour assigned to fillStyle');
	ok(anySet(ctx, 'strokeStyle', '#1a1a22'), 'glasses colour assigned to strokeStyle');
	ok(anySet(ctx, 'lineWidth', 2.6), 'glasses lineWidth 2.6');
});

test('blink: eyes shut at t=3.95, open at t=1', () => {
	const shut = draw(3.95, 'normal');
	ok(!anySet(shut, 'fillStyle', '#ffffff'), 'no white eye fill while blinking');
	const open = draw(1, 'normal');
	ok(anySet(open, 'fillStyle', '#ffffff'), 'white eye fill when open');
});

test('moods differ pairwise at the same t', () => {
	const logs = {};
	for (let m = 0; m < MOODS.length; m++) {
		logs[MOODS[m]] = JSON.stringify(draw(0, MOODS[m]).calls);
	}
	ok(logs.normal !== logs.worried, 'normal vs worried differ');
	ok(logs.normal !== logs.happy, 'normal vs happy differ');
	ok(logs.worried !== logs.happy, 'worried vs happy differ');
});

test('pupils move: same mood at t=0 and t=2 differ', () => {
	for (let m = 0; m < MOODS.length; m++) {
		const a = JSON.stringify(draw(0, MOODS[m]).calls);
		const b = JSON.stringify(draw(2, MOODS[m]).calls);
		ok(a !== b, MOODS[m] + ' differs between t=0 and t=2');
	}
});

test('reset empties the call log', () => {
	const ctx = draw(0, 'normal');
	ok(count(ctx, 'arc') > 0, 'has arcs before reset');
	reset(ctx);
	eq(count(ctx, 'arc'), 0, 'no arcs after reset');
});

done();
