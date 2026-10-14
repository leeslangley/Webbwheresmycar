// Tests for ui/transitions.js (card GU15): timing, cross-fade, slides and iris.
// Runs under macOS `jsc -m`.

import { test, eq, near, throws, done } from './harness.js';
import { makeCtx, count, texts } from './fakectx.js';
import {
	makeTransition, transProgress, transDone, drawTransition,
} from '../src/ui/transitions.js';

const R_HALF = 734.3023900274328 * 0.5;

// Drawing callbacks that record a marker into the fake ctx.
function scenes(ctx) {
	const c = { from: 0, to: 0 };
	c.drawFrom = function () {
		c.from += 1;
		ctx.fillText('from', 0, 0);
	};
	c.drawTo = function () {
		c.to += 1;
		ctx.fillText('to', 0, 0);
	};
	return c;
}

function names(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		out.push(ctx.calls[i][0]);
	}
	return out;
}

function argsOf(ctx, name) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('makeTransition gives default durations from MOTION', () => {
	eq(makeTransition('fade', 1000), { kind: 'fade', start: 1000, dur: 250 }, 'fade');
	eq(makeTransition('slide-left', 0).dur, 350, 'slide-left dur');
	eq(makeTransition('slide-right', 0).dur, 350, 'slide-right dur');
	eq(makeTransition('slide-up', 0).dur, 350, 'slide-up dur');
	eq(makeTransition('slide-down', 0).dur, 350, 'slide-down dur');
	eq(makeTransition('iris', 0).dur, 500, 'iris dur');
});

test('makeTransition takes an explicit duration', () => {
	eq(makeTransition('fade', 0, 100).dur, 100, 'explicit dur');
});

test('makeTransition throws on an unknown kind', () => {
	throws(() => makeTransition('wipe', 0), 'wipe is not a kind yet');
});

test('transProgress and transDone follow start and dur', () => {
	const tr = makeTransition('fade', 1000);
	eq(transProgress(tr, 1125), 0.5, 'halfway');
	eq(transProgress(tr, 900), 0, 'before start clamps to 0');
	eq(transProgress(tr, 2000), 1, 'after end clamps to 1');
	eq(transDone(tr, 1249), false, 'not done just before end');
	eq(transDone(tr, 1250), true, 'done at start + dur');
});

test('fade at u 0.5 draws both screens, alpha inside save and restore', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('fade', 1000), 1125, c.drawFrom, c.drawTo);
	eq(c.from, 1, 'from once');
	eq(c.to, 1, 'to once');
	eq(names(ctx), ['fillText', 'save', 'set:globalAlpha', 'fillText', 'restore'], 'order');
	eq(ctx.globalAlpha, 0.5, 'alpha is inOutQuad(0.5)');
});

test('slide-left at u 0.5 offsets old and new screens', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('slide-left', 0), 175, c.drawFrom, c.drawTo);
	eq(argsOf(ctx, 'translate'), [[-1120, 0], [160, 0]], 'translates');
	eq(count(ctx, 'clip'), 2, 'each slide draw is clipped');
	eq(texts(ctx), ['from', 'to'], 'old then new');
});

test('slide-right at u 0.5 offsets old and new screens', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('slide-right', 0), 175, c.drawFrom, c.drawTo);
	eq(argsOf(ctx, 'translate'), [[1120, 0], [-160, 0]], 'translates');
	eq(count(ctx, 'clip'), 2, 'each slide draw is clipped');
});

test('slide-up at u 0.5 offsets old and new screens', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('slide-up', 0), 175, c.drawFrom, c.drawTo);
	eq(argsOf(ctx, 'translate'), [[0, -630], [0, 90]], 'translates');
	eq(count(ctx, 'clip'), 2, 'each slide draw is clipped');
});

test('slide-down at u 0.5 offsets old and new screens', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('slide-down', 0), 175, c.drawFrom, c.drawTo);
	eq(argsOf(ctx, 'translate'), [[0, 630], [0, -90]], 'translates');
	eq(count(ctx, 'clip'), 2, 'each slide draw is clipped');
});

test('slide clip is the full logical canvas rect', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('slide-left', 0), 175, c.drawFrom, c.drawTo);
	eq(argsOf(ctx, 'rect'), [[0, 0, 1280, 720], [0, 0, 1280, 720]], 'rect args');
});

test('iris at u 0.25 draws only the outgoing screen at half radius', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('iris', 0), 125, c.drawFrom, c.drawTo);
	eq(c.from, 1, 'from once');
	eq(c.to, 0, 'to never');
	eq(texts(ctx), ['from'], 'only from drawn');
	const arcs = argsOf(ctx, 'arc');
	eq(arcs.length, 1, 'one arc');
	eq(arcs[0][0], 640, 'centre x');
	eq(arcs[0][1], 360, 'centre y');
	near(arcs[0][2], R_HALF, 1e-6, 'radius at u 0.25');
});

test('iris at u 0.75 draws only the incoming screen at half radius', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('iris', 0), 375, c.drawFrom, c.drawTo);
	eq(c.from, 0, 'from never');
	eq(c.to, 1, 'to once');
	eq(texts(ctx), ['to'], 'only to drawn');
	const arcs = argsOf(ctx, 'arc');
	eq(arcs[0][0], 640, 'centre x');
	eq(arcs[0][1], 360, 'centre y');
	near(arcs[0][2], R_HALF, 1e-6, 'radius at u 0.75');
});

test('iris at u 0 has full radius, at u 0.5 radius 0', () => {
	const ctx0 = makeCtx();
	const c0 = scenes(ctx0);
	drawTransition(ctx0, makeTransition('iris', 0), 0, c0.drawFrom, c0.drawTo);
	near(argsOf(ctx0, 'arc')[0][2], 734.3023900274328, 1e-6, 'radius at u 0');

	const ctx1 = makeCtx();
	const c1 = scenes(ctx1);
	drawTransition(ctx1, makeTransition('iris', 0), 250, c1.drawFrom, c1.drawTo);
	near(argsOf(ctx1, 'arc')[0][2], 0, 1e-6, 'radius at u 0.5');
	eq(texts(ctx1), ['to'], 'incoming screen at u 0.5');
});

test('iris fills the frame black before the scene', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawTransition(ctx, makeTransition('iris', 0), 125, c.drawFrom, c.drawTo);
	eq(ctx.calls[0], ['set:fillStyle', ['#000000']], 'fillStyle black first');
	eq(ctx.calls[1], ['fillRect', [0, 0, 1280, 720]], 'then full-frame fillRect');
});

test('every kind at u >= 1 draws only drawTo with no transform', () => {
	const kinds = ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'iris'];
	for (let i = 0; i < kinds.length; i++) {
		const label = kinds[i];
		const tr = makeTransition(label, 0);
		const ctx = makeCtx();
		const c = scenes(ctx);
		drawTransition(ctx, tr, tr.dur, c.drawFrom, c.drawTo);
		eq(c.from, 0, label + ': from never at u 1');
		eq(c.to, 1, label + ': to once at u 1');
		eq(count(ctx, 'translate'), 0, label + ': no translate at u 1');
		eq(names(ctx), ['fillText'], label + ': only drawTo at u 1');

		const ctxLate = makeCtx();
		const cLate = scenes(ctxLate);
		drawTransition(ctxLate, tr, 10000, cLate.drawFrom, cLate.drawTo);
		eq(names(ctxLate), ['fillText'], label + ': only drawTo past the end');
	}
});

test('drawTransition throws on an unknown kind', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	throws(() => drawTransition(ctx, { kind: 'wipe', start: 0, dur: 100 }, 50, c.drawFrom, c.drawTo),
		'wipe is not drawable yet');
});

done();
