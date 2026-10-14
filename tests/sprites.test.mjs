// Tests for src/art/sprites.js, run under `jsc -m`. The env is faked: a
// loadJson returning a manifest object (the V07 shape) and a loadImage
// returning objects that only have width/height, like a decoded <img>.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { createSprites } from '../src/art/sprites.js';

// Two good sprites and one whose image fails to load.
const MANIFEST = {
	a: { file: 'a.png', w: 40, h: 20 },
	b: { file: 'b.png', w: 60, h: 30 },
	bad: { file: 'bad.png', w: 10, h: 10 },
};

const IMAGES = {
	'assets/art/cars/a.png': { width: 40, height: 20 },
	'assets/art/cars/b.png': { width: 60, height: 30 },
};

// fakeEnv: records every url it is asked for; the 'bad.png' url always rejects.
function fakeEnv() {
	const seen = [];
	return {
		seen: seen,
		loadJson: function (url) {
			seen.push(['json', url]);
			return Promise.resolve(MANIFEST);
		},
		loadImage: function (url) {
			seen.push(['img', url]);
			if (IMAGES[url]) {
				return Promise.resolve(IMAGES[url]);
			}
			return Promise.reject(new Error('missing ' + url));
		},
	};
}

// drawArgs(ctx): the argument list of the first drawImage call, or null.
function drawArgs(ctx) {
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'drawImage') {
			return ctx.calls[i][1];
		}
	}
	return null;
}

// --- load everything ---------------------------------------------------------

const env = fakeEnv();
const sprites = createSprites(env);
eq(sprites.ready, false, 'not ready before load');
await sprites.load();

test('load() fetches the manifest and every listed sprite', () => {
	eq(env.seen[0], ['json', 'assets/art/cars/manifest.json'], 'manifest url');
	eq(env.seen[1], ['img', 'assets/art/cars/a.png'], 'first image url');
	eq(env.seen[2], ['img', 'assets/art/cars/b.png'], 'second image url');
	eq(env.seen[3], ['img', 'assets/art/cars/bad.png'], 'third image url');
	eq(env.seen.length, 4, 'one load per manifest entry');
});

test('has(id) is true for loaded sprites and false otherwise', () => {
	eq(sprites.has('a'), true, 'a loaded');
	eq(sprites.has('b'), true, 'b loaded');
	eq(sprites.has('zzz'), false, 'unknown id is not loaded');
});

test('a failing image is skipped, the rest still load, and ready is set', () => {
	eq(sprites.has('bad'), false, 'the failing sprite is skipped');
	eq(sprites.has('b'), true, 'a later sprite still loaded');
	eq(sprites.ready, true, 'ready after load');
});

test('size(id) reports the sprite pixel size, or null', () => {
	eq(sprites.size('a'), { w: 40, h: 20 }, 'size of a');
	eq(sprites.size('b'), { w: 60, h: 30 }, 'size of b');
	eq(sprites.size('bad'), null, 'size of a skipped sprite');
	eq(sprites.size('zzz'), null, 'size of an unknown id');
});

// --- drawing -----------------------------------------------------------------

test('draw() draws once, crisp, with the bottom centre at (x, y)', () => {
	const ctx = makeCtx();
	const ret = sprites.draw(ctx, 'a', 100, 200, 2, {});
	eq(ret, true, 'draw returns true for a known id');
	eq(count(ctx, 'drawImage'), 1, 'exactly one drawImage');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore (balanced)');
	ok(anySet(ctx, 'imageSmoothingEnabled', false), 'smoothing turned off');
	const args = drawArgs(ctx);
	ok(args[0] === IMAGES['assets/art/cars/a.png'], 'draws the loaded image');
	eq(args.slice(1), [60, 160, 80, 40], 'scale 2: x-80/2, y-40, 80x40');
});

test('draw() keeps whole-pixel scale and never goes below 1', () => {
	const ctx = makeCtx();
	sprites.draw(ctx, 'a', 10, 20, 0.4, {});
	eq(drawArgs(ctx).slice(1), [10 - 20, 0, 40, 20], 'scale 0.4 clamps to 1');
	const ctx2 = makeCtx();
	sprites.draw(ctx2, 'a', 10, 20, 3, {});
	eq(drawArgs(ctx2).slice(1), [10 - 60, -40, 120, 60], 'scale 3');
	// rounding is half-up, not truncating: 1.6 -> 2 (this kills Math.floor)
	const ctx3 = makeCtx();
	sprites.draw(ctx3, 'a', 100, 200, 1.6, {});
	eq(drawArgs(ctx3).slice(1), [60, 160, 80, 40], 'scale 1.6 rounds up to 2');
	// ...and not rounding up past the nearest integer: 2.4 -> 2 (kills Math.ceil)
	const ctx4 = makeCtx();
	sprites.draw(ctx4, 'a', 100, 200, 2.4, {});
	eq(drawArgs(ctx4).slice(1), [60, 160, 80, 40], 'scale 2.4 rounds down to 2');
});

test('draw() with opts.flip mirrors the sprite about its own centre', () => {
	const ctx = makeCtx();
	const ret = sprites.draw(ctx, 'a', 100, 200, 1, { flip: true });
	eq(ret, true, 'flip returns true');
	eq(count(ctx, 'translate'), 1, 'translates to the anchor');
	eq(count(ctx, 'scale'), 1, 'flips horizontally');
	eq(ctx.calls.filter((c) => c[0] === 'scale')[0][1], [-1, 1], 'scale(-1, 1)');
	eq(drawArgs(ctx).slice(1), [-20, -20, 40, 20], 'mirrored about x');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore (balanced)');
});

test('draw() for an unknown id draws nothing and returns false', () => {
	const ctx = makeCtx();
	const ret = sprites.draw(ctx, 'zzz', 100, 200, 2, {});
	eq(ret, false, 'unknown id returns false');
	eq(count(ctx, 'drawImage'), 0, 'nothing drawn');
	eq(count(ctx, 'save'), 0, 'no save');
	eq(count(ctx, 'restore'), 0, 'no restore');
});

test('draw() treats a missing scale as 1', () => {
	const ctx = makeCtx();
	eq(sprites.draw(ctx, 'b', 50, 60, undefined, {}), true, 'draw returns true');
	eq(drawArgs(ctx).slice(1), [50 - 30, 30, 60, 30], 'defaults to scale 1');
});

// --- a broken manifest -------------------------------------------------------

const deadEnv = {
	loadJson: function () {
		return Promise.reject(new Error('no manifest'));
	},
	loadImage: function () {
		return Promise.reject(new Error('never called'));
	},
};
const dead = createSprites(deadEnv);
let threw = false;
try {
	await dead.load();
} catch (e) {
	threw = true;
}

test('a failing manifest is not fatal: load resolves with nothing loaded', () => {
	eq(threw, false, 'load() resolves');
	eq(dead.ready, true, 'ready is set even with no sprites');
	eq(dead.has('a'), false, 'nothing loaded');
	const ctx = makeCtx();
	eq(dead.draw(ctx, 'a', 0, 0, 1, {}), false, 'draw returns false');
	eq(count(ctx, 'drawImage'), 0, 'nothing drawn');
});

// --- loading twice -----------------------------------------------------------

const e2 = fakeEnv();
const sp2 = createSprites(e2);
await sp2.load();
await sp2.load();

test('load() can be called twice and the sprites stay loaded', () => {
	eq(sp2.ready, true, 'ready');
	eq(sp2.has('a'), true, 'still loaded');
	eq(sp2.size('a'), { w: 40, h: 20 }, 'size unchanged');
	eq(e2.seen.length, 8, 're-fetches but does not break');
});

// --- manifest v2: _meta, entry fields, masks, shadows, progress (CC02) ------

const META_MANIFEST = {
	_meta: { version: 2, ppm_hero: 48, ppm_mini: 24, ppm_face: 40, supersample: 4, outline: '#120a1e' },
	a: { car: 'a', view: 's', file: 'a.png', w: 40, h: 20, ax: 10, ay: 7, paint: '#c81e1e', mask: 'a_mask.png', shadow: 'a_sh.png' },
	b: { car: 'b', view: 's', file: 'b.png', w: 60, h: 30, ax: 30, ay: 15, paint: '#1e5fc8', mask: 'b_mask.png', shadow: null },
};

const META_IMAGES = {
	'assets/art/cars/a.png': { width: 40, height: 20, name: 'a' },
	'assets/art/cars/b.png': { width: 60, height: 30, name: 'b' },
	'assets/art/cars/b_mask.png': { name: 'b_mask' },
	'assets/art/cars/a_sh.png': { name: 'a_sh' },
};

// a_mask.png is corrupt: its load always rejects.
function metaEnv() {
	const seen = [];
	return {
		seen: seen,
		loadJson: function (url) {
			seen.push(['json', url]);
			return Promise.resolve(META_MANIFEST);
		},
		loadImage: function (url) {
			seen.push(['img', url]);
			if (url === 'assets/art/cars/a_mask.png') {
				return Promise.reject(new Error('corrupt mask'));
			}
			if (META_IMAGES[url]) {
				return Promise.resolve(META_IMAGES[url]);
			}
			return Promise.reject(new Error('missing ' + url));
		},
	};
}

const menv = metaEnv();
const msp = createSprites(menv);
eq(msp.progress(), { done: 0, total: 0 }, 'progress is zero before load');
eq(msp.keys(), [], 'no keys before load');
const ticks = [];
await msp.load({
	onProgress: function (d, t) {
		ticks.push([d, t]);
	},
});

test('onProgress is called once per finished download, done counts 1..total', () => {
	eq(
		ticks.map((x) => x[0]),
		[1, 2, 3, 4, 5],
		'done values'
	);
	eq(
		ticks.every((x) => x[1] === 5),
		true,
		'total is 5 on every call'
	);
	eq(msp.progress(), { done: 5, total: 5 }, 'progress() after load');
	eq(msp.timedOut, false, 'no timeout without timeoutMs');
	eq(msp.ready, true, 'ready after load');
});

test('keys() lists the loaded sprites in manifest order and _meta is never loaded', () => {
	eq(msp.keys(), ['a', 'b'], 'keys are a and b');
	eq(menv.seen.length, 6, 'manifest plus 5 image files (a, a mask, a shadow, b, b mask)');
	eq(msp.has('_meta'), false, '_meta is not a sprite');
});

test('meta(id) is a shallow copy of the manifest entry, or null', () => {
	eq(msp.meta('a').ax, 10, 'ax of a');
	eq(msp.meta('a').ay, 7, 'ay of a');
	eq(msp.meta('a').paint, '#c81e1e', 'paint of a');
	const copy = msp.meta('a');
	copy.ax = 99;
	eq(msp.meta('a').ax, 10, 'changing the copy leaves the table alone');
	eq(msp.meta('_meta'), null, '_meta is not a sprite');
	eq(msp.meta('zzz'), null, 'unknown id');
});

test('image, maskImage and shadowImage return the loaded image or null', () => {
	ok(msp.image('a') === META_IMAGES['assets/art/cars/a.png'], 'image of a');
	ok(msp.maskImage('a') === null, 'a mask failed: null');
	ok(msp.shadowImage('a') === META_IMAGES['assets/art/cars/a_sh.png'], 'shadow of a');
	ok(msp.maskImage('b') === META_IMAGES['assets/art/cars/b_mask.png'], 'mask of b');
	ok(msp.shadowImage('b') === null, 'b has no shadow');
	ok(msp.image('zzz') === null, 'unknown id');
	ok(msp.maskImage('constructor') === null, 'prototype names are not loaded');
	eq(msp.size('a'), { w: 40, h: 20 }, 'size of a is unchanged by its masks');
});

// --- timeout: a slow image never blocks the game ----------------------------

const timers = [];
let releaseSlow = null;
const slowImage = new Promise(function (resolve) {
	releaseSlow = resolve;
});
const slowEnv = {
	loadJson: function () {
		return Promise.resolve({
			slow: { file: 'slow.png', w: 10, h: 10 },
			quick: { file: 'quick.png', w: 10, h: 10 },
		});
	},
	loadImage: function (url) {
		if (url === 'assets/art/cars/slow.png') {
			return slowImage; // stays pending until releaseSlow is called
		}
		return Promise.resolve({ width: 10, height: 10 });
	},
	setTimeout: function (fn) {
		timers.push(fn);
	},
};
const ssp = createSprites(slowEnv);
const timedLoad = ssp.load({ timeoutMs: 100 });
eq(timers.length, 1, 'one timer is started at the start of load()');
timers[0]();
await timedLoad;

test('a timed-out load resolves with ready and timedOut set, slow sprite not loaded', () => {
	eq(ssp.ready, true, 'ready after the timeout');
	eq(ssp.timedOut, true, 'timedOut after the timeout');
	eq(ssp.has('slow'), false, 'the slow sprite is not loaded yet');
});

// The slow image arrives after the timeout and still lands in the table.
releaseSlow({ width: 10, height: 10 });
for (let i = 0; i < 10; i++) {
	await null;
}

test('an image that arrives after the timeout still lands', () => {
	eq(ssp.has('slow'), true, 'late sprite is loaded');
	eq(ssp.size('slow'), { w: 10, h: 10 }, 'late sprite size');
});

done();
