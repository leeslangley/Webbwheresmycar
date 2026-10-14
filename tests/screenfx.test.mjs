// Tests for src/ui/screenfx.js, run under `jsc -m` (no console; print only).

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, count, lastSet, reset } from './fakectx.js';
import {
	makeScreenFx,
	fxShake,
	fxFlash,
	fxFreeze,
	fxFrozen,
	fxActive,
	fxDisaster,
	fxGood,
	fxBump,
	shakeOffset,
	flashAlpha,
	fxBegin,
	fxEnd
} from '../src/ui/screenfx.js';

// Arguments of every recorded call with the given method name, in order.
function argsOf(ctx, name) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('fresh state has no shake, no flash, not frozen, not active', function () {
	const fx = makeScreenFx();
	eq(fx.shake, null, 'shake null');
	eq(fx.flash, null, 'flash null');
	eq(fx.freezeUntil, 0, 'freezeUntil 0');
	eq(fxActive(fx, 0), false, 'not active');
	eq(fxFrozen(fx, 0), false, 'not frozen');
});

test('shake offset at start, mid-way and after the end', function () {
	const fx = makeScreenFx();
	fxShake(fx, 10, 300, 0);
	eq(shakeOffset(fx, 0), { dx: 0, dy: 10 }, 'offset at 0');
	eq(shakeOffset(fx, 100), { dx: 3, dy: 6 }, 'offset at 100');
	eq(shakeOffset(fx, 300), { dx: 0, dy: 0 }, 'offset at 300');
	eq(shakeOffset(fx, 1000), { dx: 0, dy: 0 }, 'offset after end');
});

test('weaker shake does not replace a running stronger one', function () {
	const fx = makeScreenFx();
	fxShake(fx, 10, 300, 0);
	fxShake(fx, 2, 300, 100);
	eq(fx.shake.mag, 10, 'still mag 10');
	eq(fx.shake.start, 0, 'still start 0');
});

test('stronger shake replaces a running weaker one', function () {
	const fx = makeScreenFx();
	fxShake(fx, 10, 300, 0);
	fxShake(fx, 14, 500, 290);
	eq(fx.shake.mag, 14, 'now mag 14');
	eq(fx.shake.ms, 500, 'now ms 500');
	eq(fx.shake.start, 290, 'start 290');
});

test('shake replaces an expired shake of any strength', function () {
	const fx = makeScreenFx();
	fxShake(fx, 10, 300, 0);
	fxShake(fx, 2, 150, 400);
	eq(fx.shake.mag, 2, 'new mag 2');
	eq(fx.shake.start, 400, 'start 400');
});

test('flash alpha: peak at start, quarter at halfway, zero at end', function () {
	const fx = makeScreenFx();
	fxFlash(fx, '#FFFFFF', 180, 0, 0.8);
	near(flashAlpha(fx, 0), 0.8, 1e-9, 'alpha at 0');
	near(flashAlpha(fx, 90), 0.2, 1e-9, 'alpha at 90');
	eq(flashAlpha(fx, 180), 0, 'alpha at 180');
	eq(flashAlpha(fx, 500), 0, 'alpha after end');
});

test('fxBegin saves once and translates by a non-zero shake offset', function () {
	const fx = makeScreenFx();
	const ctx = makeCtx();
	fxShake(fx, 10, 300, 0);
	fxBegin(ctx, fx, 0);
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'translate'), 1, 'one translate');
	eq(argsOf(ctx, 'translate')[0], [0, 10], 'translate 0,10');
});

test('fxBegin does not translate when the offset is zero', function () {
	const fx = makeScreenFx();
	const ctx = makeCtx();
	fxShake(fx, 10, 300, 0);
	fxBegin(ctx, fx, 300);
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'translate'), 0, 'no translate');
});

test('fxEnd restores once and paints the disaster flash over the overdrawn rect', function () {
	const fx = makeScreenFx();
	const ctx = makeCtx();
	fxDisaster(fx, 0);
	fxEnd(ctx, fx, 0);
	eq(count(ctx, 'restore'), 1, 'one restore');
	const rects = argsOf(ctx, 'fillRect');
	eq(rects.length, 1, 'one fillRect');
	eq(rects[0], [-144, 0, 1568, 720], 'overdrawn rect');
	const style = lastSet(ctx, 'fillStyle');
	ok(String(style).indexOf('rgba(217,72,59,0.6') === 0, 'disaster fill colour, got ' + style);
});

test('fxEnd after the flash expired draws nothing and clears the flash', function () {
	const fx = makeScreenFx();
	const ctx = makeCtx();
	fxFlash(fx, '#D9483B', 260, 0, 0.6);
	fxEnd(ctx, fx, 260);
	eq(count(ctx, 'fillRect'), 0, 'no fillRect');
	eq(fx.flash, null, 'flash cleared');
});

test('fxEnd clears an expired shake and keeps a running one', function () {
	const fx = makeScreenFx();
	const ctx = makeCtx();
	fxShake(fx, 10, 300, 0);
	fxEnd(ctx, fx, 100);
	ok(fx.shake !== null, 'running shake kept');
	fxEnd(ctx, fx, 300);
	eq(fx.shake, null, 'expired shake cleared');
});

test('fxEnd leaves no fillRect when the flash is still zero-alpha', function () {
	const fx = makeScreenFx();
	const ctx = makeCtx();
	reset(ctx);
	fxEnd(ctx, fx, 0);
	eq(count(ctx, 'fillRect'), 0, 'no fillRect with no flash');
	eq(count(ctx, 'restore'), 1, 'still restores');
});

test('disaster freezes for 80 ms', function () {
	const fx = makeScreenFx();
	fxDisaster(fx, 1000);
	eq(fx.freezeUntil, 1080, 'freezeUntil 1080');
	eq(fxFrozen(fx, 1079), true, 'frozen at +79');
	eq(fxFrozen(fx, 1080), false, 'not frozen at +80');
});

test('fxFreeze sets freezeUntil to now plus ms', function () {
	const fx = makeScreenFx();
	fxFreeze(fx, 50, 200);
	eq(fx.freezeUntil, 250, 'freezeUntil 250');
});

test('good-news preset has a gold flash and no shake', function () {
	const fx = makeScreenFx();
	fxGood(fx, 0);
	eq(fx.shake, null, 'no shake');
	eq(fx.flash.color, '#FFD27A', 'gold colour');
	eq(fx.flash.ms, 200, 'flash 200 ms');
	eq(fx.flash.peak, 0.35, 'peak 0.35');
});

test('bump preset is a light 4 px shake for 150 ms', function () {
	const fx = makeScreenFx();
	fxBump(fx, 0);
	eq(fx.shake.mag, 4, 'mag 4');
	eq(fx.shake.ms, 150, 'ms 150');
});

test('fxActive is true while a shake or flash runs, false after', function () {
	const fx = makeScreenFx();
	fxDisaster(fx, 0);
	eq(fxActive(fx, 0), true, 'active at 0');
	eq(fxActive(fx, 499), true, 'active at 499');
	eq(fxActive(fx, 500), false, 'inactive at 500');
});

done();
