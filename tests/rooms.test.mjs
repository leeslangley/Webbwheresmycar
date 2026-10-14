// Tests for src/art/rooms.js, run under `jsc -m`. The env is faked: a loadJson
// returning a manifest object and a loadImage returning objects that only have
// width/height, like a decoded <img>. Files not in IMAGES reject, like a missing file.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count } from './fakectx.js';
import { createRooms, PARALLAX } from '../src/art/rooms.js';

const MANIFEST = {
	office: { file: 'office.png', front: 'office_front.png' },
	garage: { file: 'garage.png' },
	broken: { file: 'broken.png' },
	_meta: { note: 'not a room' },
};

const IMAGES = {
	'assets/art/rooms/office.png': { width: 640, height: 360 },
	'assets/art/rooms/office_front.png': { width: 640, height: 360 },
	'assets/art/rooms/garage.png': { width: 640, height: 360 },
};

// fakeEnv: records every url it is asked for.
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
const rooms = createRooms(env);
eq(rooms.ready, false, 'not ready before load');
await rooms.load();

test('load() fetches the manifest, then the plates and front layers', () => {
	eq(env.seen[0], ['json', 'assets/art/rooms/manifest.json'], 'manifest url');
	eq(env.seen[1], ['img', 'assets/art/rooms/office.png'], 'office plate');
	eq(env.seen[2], ['img', 'assets/art/rooms/office_front.png'], 'office front layer');
	eq(env.seen.length, 5, 'manifest, office, office front, garage, broken');
	eq(rooms.ready, true, 'ready after load');
});

test('has(id) is true for loaded plates and false otherwise', () => {
	eq(rooms.has('office'), true, 'office loaded');
	eq(rooms.has('garage'), true, 'garage loaded');
	eq(rooms.has('zzz'), false, 'unknown id is not loaded');
	ok(rooms.has('constructor') === false, 'prototype names are not loaded');
	eq(rooms.has('_meta'), false, '_meta is not a room');
});

test('a failing plate is skipped and the rest still load', () => {
	eq(rooms.has('broken'), false, 'the failing plate is skipped');
	eq(rooms.has('garage'), true, 'a later plate still loaded');
	eq(rooms.info('broken'), null, 'no info for a skipped plate');
});

test('info(id) reports size, scale and front layer, or null', () => {
	eq(rooms.info('office'), { w: 640, h: 360, scale: 2, hasFront: true }, 'info of office');
	eq(rooms.info('garage'), { w: 640, h: 360, scale: 2, hasFront: false }, 'info of garage');
	eq(rooms.info('zzz'), null, 'unknown id');
});

test('draw(ctx, id) draws the plate once at x2 with smoothing off, balanced save/restore', () => {
	const ctx = makeCtx();
	const drawn = rooms.draw(ctx, 'office');
	eq(drawn, true, 'draw returns true for a loaded room');
	eq(count(ctx, 'drawImage'), 1, 'exactly one drawImage call');
	const args = drawArgs(ctx);
	ok(args !== null && args[0] === IMAGES['assets/art/rooms/office.png'], 'draws the office plate image');
	eq(args.slice(1), [0, 0, 1280, 720], 'drawn at 0,0 at 1280x720');
	eq(ctx.props.imageSmoothingEnabled, false, 'smoothing is off');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore');
});

test('draw(ctx, id) ignores look: the plate never moves', () => {
	const ctx = makeCtx();
	rooms.draw(ctx, 'office', { look: { x: 1, y: -1 } });
	eq(drawArgs(ctx).slice(1), [0, 0, 1280, 720], 'plate still at 0,0');
});

test('draw(ctx, id) for an unknown id draws nothing and returns false', () => {
	const ctx = makeCtx();
	eq(rooms.draw(ctx, 'zzz'), false, 'unknown id returns false');
	eq(count(ctx, 'drawImage'), 0, 'no drawImage');
	eq(ctx.calls.length, 0, 'no calls at all');
});

test('drawFront with look {x:1,y:-1} draws the front layer at (-6, 3)', () => {
	const ctx = makeCtx();
	eq(rooms.drawFront(ctx, 'office', { look: { x: 1, y: -1 } }), true, 'drawFront returns true');
	eq(count(ctx, 'drawImage'), 1, 'exactly one drawImage call');
	const args = drawArgs(ctx);
	ok(args[0] === IMAGES['assets/art/rooms/office_front.png'], 'draws the front layer image');
	eq(args.slice(1), [-6, 3, 1280, 720], 'at (-6, 3), 1280x720');
	eq(ctx.props.imageSmoothingEnabled, false, 'smoothing is off');
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save and restore balance');
});

test('drawFront clamps look to -1..1 and defaults to no shift', () => {
	const ctx = makeCtx();
	rooms.drawFront(ctx, 'office', { look: { x: 5, y: -9 } });
	eq(drawArgs(ctx).slice(1), [-6, 3, 1280, 720], 'clamped look gives the full shift');
	const ctx2 = makeCtx();
	rooms.drawFront(ctx2, 'office');
	eq(drawArgs(ctx2).slice(1), [0, 0, 1280, 720], 'no look means no shift');
});

test('drawFront for a room without a front layer draws nothing and returns false', () => {
	const ctx = makeCtx();
	eq(rooms.drawFront(ctx, 'garage', { look: { x: 1, y: 1 } }), false, 'garage has no front');
	eq(count(ctx, 'drawImage'), 0, 'no drawImage');
	eq(rooms.drawFront(ctx, 'zzz'), false, 'unknown id');
	eq(count(ctx, 'drawImage'), 0, 'still no drawImage');
});

// --- a missing front layer and a rejecting manifest --------------------------

const frontBrokenEnv = {
	loadJson: function () {
		return Promise.resolve({ shop: { file: 'shop.png', front: 'shop_front.png' } });
	},
	loadImage: function (url) {
		if (url === 'assets/art/rooms/shop.png') {
			return Promise.resolve({ width: 640, height: 360 });
		}
		return Promise.reject(new Error('missing ' + url));
	},
};
const shopRooms = createRooms(frontBrokenEnv);
await shopRooms.load();

test('a room whose front layer failed to load has hasFront false and no front draw', () => {
	eq(shopRooms.has('shop'), true, 'plate loaded');
	eq(shopRooms.info('shop').hasFront, false, 'hasFront is false');
	const ctx = makeCtx();
	eq(shopRooms.drawFront(ctx, 'shop'), false, 'drawFront returns false');
	eq(count(ctx, 'drawImage'), 0, 'no drawImage');
});

const rejectEnv = {
	loadJson: function () {
		return Promise.reject(new Error('no manifest'));
	},
	loadImage: function () {
		return Promise.resolve({ width: 640, height: 360 });
	},
};
const noRooms = createRooms(rejectEnv);
let resolved = false;
await noRooms.load().then(
	function () {
		resolved = true;
	},
	function () {
		resolved = false;
	}
);

test('a rejecting manifest loader still resolves load() with no rooms', () => {
	eq(resolved, true, 'load() resolves');
	eq(noRooms.ready, true, 'ready after a failed manifest');
	eq(noRooms.has('office'), false, 'no rooms without a manifest');
});

test('PARALLAX.front is 6 across and 3 down', () => {
	eq(PARALLAX.front, { x: 6, y: 3 }, 'front parallax');
});

done();
