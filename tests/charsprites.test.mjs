// Tests for src/art/charsprites.js, run under `jsc -m`. The env is faked: loadJson
// returns a character manifest, and loadImage resolves {width, height} objects for
// the sprites it knows and rejects for anything else (dave_idle_00 is the one
// deliberately missing image).

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { createCharSprites, customerPortrait } from '../src/art/charsprites.js';

const BASE = 'assets/art/characters/';

const MANIFEST = {
	version: 1,
	scale: { world: 2, bust: 2 },
	characters: {
		mark: {
			frame: { w: 144, h: 144 },
			head: { w: 80, h: 80, pivot: [40, 66] },
			clips: {
				idle: { view: 'front', fps: 3, loop: true, hold: 0, frames: [{ id: 'mark_idle_00', neck: [72, 75], angle: 'fwd' }] },
			},
			heads: { neutral: { fwd: 'mark_head_fwd_neutral' } },
			bust: { w: 96, h: 96 },
			busts: { neutral: 'mark_bust_neutral' },
		},
		// dave's body image is not in IMAGES, so it is a broken image that is skipped.
		dave: {
			frame: { w: 144, h: 144 },
			head: { w: 80, h: 80, pivot: [40, 66] },
			clips: {
				idle: { view: 'front', fps: 3, loop: true, hold: 0, frames: [{ id: 'dave_idle_00', neck: [72, 75], angle: 'fwd' }] },
			},
			heads: { neutral: { fwd: 'mark_head_fwd_neutral' } },
		},
	},
	customers: {
		wedding: { variants: 2, w: 144, h: 96, ids: ['cust_wedding_v0', 'cust_wedding_v1'] },
		x_family: { variants: 1, w: 144, h: 96, ids: ['cust_x_family_v0'] },
	},
};

const IMAGES = {};
IMAGES[BASE + 'mark_idle_00.png'] = { width: 144, height: 144 };
IMAGES[BASE + 'mark_head_fwd_neutral.png'] = { width: 80, height: 80 };
IMAGES[BASE + 'mark_bust_neutral.png'] = { width: 96, height: 96 };
IMAGES[BASE + 'cust_wedding_v0.png'] = { width: 144, height: 96 };
IMAGES[BASE + 'cust_wedding_v1.png'] = { width: 144, height: 96 };
IMAGES[BASE + 'cust_x_family_v0.png'] = { width: 144, height: 96 };

// fakeEnv(images): records every url asked for.
function fakeEnv(images) {
	const seen = [];
	return {
		seen: seen,
		loadJson: function (url) {
			seen.push(['json', url]);
			return Promise.resolve(MANIFEST);
		},
		loadImage: function (url) {
			seen.push(['img', url]);
			if (images[url]) {
				return Promise.resolve(images[url]);
			}
			return Promise.reject(new Error('missing ' + url));
		},
	};
}

// drawCalls(ctx): the argument lists of every drawImage call, in order.
function drawCalls(ctx) {
	return ctx.calls.filter((c) => c[0] === 'drawImage').map((c) => c[1]);
}

const env = fakeEnv(IMAGES);
const cs = createCharSprites(env);
eq(cs.ready, false, 'not ready before load');
await cs.load();

test('load() fetches the manifest and each named image once', () => {
	eq(env.seen[0], ['json', 'assets/art/characters/manifest.json'], 'manifest url');
	eq(env.seen.filter((s) => s[0] === 'img').length, 7, 'seven distinct sprite ids');
	eq(env.seen.length, 8, 'mark_head_fwd_neutral is requested once though two characters name it');
});

test('has(id) is true for loaded sprites and a broken image is skipped', () => {
	eq(cs.has('mark_idle_00'), true, 'body loaded');
	eq(cs.has('mark_head_fwd_neutral'), true, 'head loaded');
	eq(cs.has('cust_x_family_v0'), true, 'customer loaded');
	eq(cs.has('dave_idle_00'), false, 'broken image skipped');
	eq(cs.has('zzz'), false, 'unknown id');
	eq(cs.ready, true, 'ready after load');
});

test('size(id) reports the image size, or null', () => {
	eq(cs.size('mark_idle_00'), { w: 144, h: 144 }, 'body size');
	eq(cs.size('cust_wedding_v0'), { w: 144, h: 96 }, 'customer size');
	eq(cs.size('dave_idle_00'), null, 'skipped sprite');
	eq(cs.size('zzz'), null, 'unknown id');
});

test('character(id) is the manifest block, or null', () => {
	eq(cs.character('mark').frame, { w: 144, h: 144 }, 'frame of mark');
	eq(cs.character('zzz'), null, 'unknown character');
	eq(cs.character('constructor'), null, 'prototype names are not characters');
});

test('size(id) falls back to manifest dimensions when the image has no size', async () => {
	const bare = {};
	for (const url in IMAGES) {
		bare[url] = {};
	}
	const sp = createCharSprites(fakeEnv(bare));
	await sp.load();
	eq(sp.size('mark_head_fwd_neutral'), { w: 80, h: 80 }, 'head size from the manifest');
	eq(sp.size('mark_idle_00'), { w: 144, h: 144 }, 'body size from the manifest');
});

test('drawActor draws the body and the head on the neck anchor, crisp, in one save', () => {
	const ctx = makeCtx();
	const frame = { bodyId: 'mark_idle_00', neck: [72, 75], headId: 'mark_head_fwd_neutral' };
	eq(cs.drawActor(ctx, 'mark', frame, 640, 500, 2), true, 'returns true');
	const calls = drawCalls(ctx);
	eq(calls.length, 2, 'exactly two drawImage calls');
	ok(calls[0][0] === IMAGES[BASE + 'mark_idle_00.png'], 'body image first');
	eq(calls[0].slice(1), [496, 212, 288, 288], 'body args');
	ok(calls[1][0] === IMAGES[BASE + 'mark_head_fwd_neutral.png'], 'head image second');
	eq(calls[1].slice(1), [560, 230, 160, 160], 'head args');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore (balanced)');
	ok(anySet(ctx, 'imageSmoothingEnabled', false), 'smoothing turned off');
});

test('drawActor with a missing body draws nothing and returns false', () => {
	const ctx = makeCtx();
	const frame = { bodyId: 'dave_idle_00', neck: [72, 75], headId: 'mark_head_fwd_neutral' };
	eq(cs.drawActor(ctx, 'dave', frame, 640, 500, 2), false, 'returns false');
	eq(count(ctx, 'drawImage'), 0, 'nothing drawn');
	eq(count(ctx, 'save'), 0, 'no save');
});

test('drawActor with a missing head still draws the body', () => {
	const ctx = makeCtx();
	const frame = { bodyId: 'mark_idle_00', neck: [72, 75], headId: 'nope' };
	eq(cs.drawActor(ctx, 'mark', frame, 640, 500, 2), true, 'returns true');
	const calls = drawCalls(ctx);
	eq(calls.length, 1, 'only the body');
	eq(calls[0].slice(1), [496, 212, 288, 288], 'body args');
});

test('drawBust uses the face bust, falling back to neutral', () => {
	const ctx = makeCtx();
	eq(cs.drawBust(ctx, 'mark', 'neutral', 640, 500, 2), true, 'neutral returns true');
	let calls = drawCalls(ctx);
	eq(calls.length, 1, 'one drawImage');
	ok(calls[0][0] === IMAGES[BASE + 'mark_bust_neutral.png'], 'bust image');
	eq(calls[0].slice(1), [544, 308, 192, 192], 'bust args');
	ok(anySet(ctx, 'imageSmoothingEnabled', false), 'smoothing turned off');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore (balanced)');

	const ctx2 = makeCtx();
	eq(cs.drawBust(ctx2, 'mark', 'angry', 640, 500, 2), true, 'unknown face falls back');
	calls = drawCalls(ctx2);
	ok(calls[0][0] === IMAGES[BASE + 'mark_bust_neutral.png'], 'fallback is the neutral bust');
	eq(cs.drawBust(makeCtx(), 'zzz', 'neutral', 0, 0, 2), false, 'unknown character returns false');
});

test('drawCustomer uses variant % ids.length and returns false for unknown jobs', () => {
	const ctx = makeCtx();
	eq(cs.drawCustomer(ctx, 'wedding', 3, 640, 500, 2), true, 'returns true');
	const calls = drawCalls(ctx);
	eq(calls.length, 1, 'one drawImage');
	ok(calls[0][0] === IMAGES[BASE + 'cust_wedding_v1.png'], 'variant 3 is v1');
	eq(calls[0].slice(1), [496, 308, 288, 192], 'customer args');
	const ctx2 = makeCtx();
	eq(cs.drawCustomer(ctx2, 'nope', 0, 640, 500, 2), false, 'unknown job returns false');
	eq(count(ctx2, 'drawImage'), 0, 'nothing drawn');
});

const CUSTOMERS = MANIFEST.customers;
const WEDDING_IDS = ['cust_wedding_v0', 'cust_wedding_v1'];

test('customerPortrait is deterministic and picks from the job ids', () => {
	const a = customerPortrait(CUSTOMERS, 'Arthur Crumpet', 'wedding');
	eq(customerPortrait(CUSTOMERS, 'Arthur Crumpet', 'wedding'), a, 'same name, same id');
	ok(WEDDING_IDS.indexOf(a) >= 0, 'one of the wedding ids');
	const seen = {};
	for (let i = 0; i < 20; i++) {
		seen[customerPortrait(CUSTOMERS, 'Person ' + i, 'wedding')] = true;
	}
	ok(seen.cust_wedding_v0 === true && seen.cust_wedding_v1 === true, 'different names reach both variants');
});

test('customerPortrait uses x_family for names like The Smith Family', () => {
	eq(customerPortrait(CUSTOMERS, 'The Smith Family', 'wedding'), 'cust_x_family_v0', 'family entry');
});

test('customerPortrait returns null when there are no customers', () => {
	eq(customerPortrait({}, 'x', 'wedding'), null, 'empty customers');
	eq(customerPortrait(undefined, 'x', 'wedding'), null, 'missing customers');
});

done();
