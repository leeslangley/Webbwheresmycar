// Tests for src/art/assetenv.js, run under `jsc -m`. The window and document are
// faked: fetch, XMLHttpRequest, Image, setTimeout and createElement are tiny
// classes or functions that fire their callbacks in a microtask, like the browser.

import { test, eq, ok, done } from './harness.js';
import { makeAssetEnv } from '../src/art/assetenv.js';
import { createSprites } from '../src/art/sprites.js';

// settle(p): wait for a promise and report how it went, so each check can be a
// plain synchronous test() afterwards.
async function settle(p) {
	try {
		return { ok: true, value: await p };
	} catch (e) {
		return { ok: false, error: e };
	}
}

// fetchOk(url): a fetch that answers with {a:1}; records the urls it was given.
function fetchOk(seen) {
	return function (url) {
		seen.push(url);
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve({ a: 1 }),
		});
	};
}

// fetchFails(): a fetch that always rejects, like a dropped connection.
function fetchFails() {
	return function () {
		return Promise.reject(new Error('fetch failed'));
	};
}

// xhrClass(mode): a fake XMLHttpRequest. mode 'status0' fires onload with status 0
// and a body (the custom scheme case); 'error' fires onerror.
function xhrClass(mode, seen) {
	return class FakeXhr {
		constructor() {
			this.status = 0;
			this.responseText = '';
			this.onload = null;
			this.onerror = null;
		}
		open(method, url) {
			seen.push([method, url]);
		}
		send() {
			const self = this;
			Promise.resolve().then(function () {
				if (mode === 'error') {
					if (self.onerror) {
						self.onerror();
					}
					return;
				}
				self.status = 0;
				self.responseText = '{"b":2}';
				if (self.onload) {
					self.onload();
				}
			});
		}
	};
}

// makeWin(parts): a fake window with only the members the test gives it.
function makeWin(parts) {
	return Object.assign({}, parts);
}

// The fake image: setting src fires onload in a microtask. Subclasses below add
// decode() or make the load fail.
class FakeImage {
	constructor() {
		this.width = 0;
		this.height = 0;
		this.onload = null;
		this.onerror = null;
		this._src = '';
	}
	set src(v) {
		this._src = v;
		const self = this;
		Promise.resolve().then(function () {
			if (self.onload) {
				self.onload();
			}
		});
	}
	get src() {
		return this._src;
	}
}

class FakeImageWithDecode extends FakeImage {
	decode() {
		return Promise.resolve();
	}
}

class FakeImageDecodeFails extends FakeImage {
	decode() {
		return Promise.reject(new Error('decode failed'));
	}
}

class FakeImageBroken {
	constructor() {
		this.onload = null;
		this.onerror = null;
	}
	set src(v) {
		const self = this;
		Promise.resolve().then(function () {
			if (self.onerror) {
				self.onerror();
			}
		});
	}
}

// Fake document: createElement records the tag names it was asked for.
function makeDoc(tags) {
	return {
		createElement: function (tag) {
			tags.push(tag);
			return { tagName: tag, width: 0, height: 0 };
		},
	};
}

// ---- loadJson ----

const seenFetch = [];
const envFetch = makeAssetEnv(makeWin({ fetch: fetchOk(seenFetch) }), makeDoc([]));
const jsonFetch = await settle(envFetch.loadJson('assets/art/cars/manifest.json'));

test('loadJson uses fetch and parses the body', () => {
	ok(jsonFetch.ok, 'fetch path resolves: ' + (jsonFetch.error && jsonFetch.error.message));
	eq(jsonFetch.value, { a: 1 }, 'fetched json');
	eq(seenFetch[0], 'assets/art/cars/manifest.json', 'fetch got the url');
});

const seenXhr = [];
const envXhr = makeAssetEnv(
	makeWin({ fetch: fetchFails(), XMLHttpRequest: xhrClass('status0', seenXhr) }),
	makeDoc([])
);
const jsonXhr = await settle(envXhr.loadJson('assets/art/cars/manifest.json'));

test('loadJson falls back to XHR when fetch rejects', () => {
	ok(jsonXhr.ok, 'xhr path resolves: ' + (jsonXhr.error && jsonXhr.error.message));
	eq(jsonXhr.value, { b: 2 }, 'xhr json with status 0 and a body');
	eq(seenXhr[0], ['GET', 'assets/art/cars/manifest.json'], 'xhr opened as GET');
});

const envXhrErr = makeAssetEnv(
	makeWin({ fetch: fetchFails(), XMLHttpRequest: xhrClass('error', []) }),
	makeDoc([])
);
const jsonXhrErr = await settle(envXhrErr.loadJson('x.json'));

test('loadJson rejects when fetch and XHR both fail', () => {
	ok(!jsonXhrErr.ok, 'XHR onerror rejects the load');
});

const envNoFetch = makeAssetEnv(makeWin({ XMLHttpRequest: xhrClass('status0', []) }), makeDoc([]));
const jsonNoFetch = await settle(envNoFetch.loadJson('x.json'));

test('loadJson uses XHR when fetch is missing', () => {
	ok(jsonNoFetch.ok, 'no fetch: xhr path resolves');
	eq(jsonNoFetch.value, { b: 2 }, 'xhr json without fetch');
});

const envNone = makeAssetEnv(makeWin({}), makeDoc([]));
const jsonNone = await settle(envNone.loadJson('x.json'));

test('loadJson rejects when there is no loader at all', () => {
	ok(!jsonNone.ok, 'no fetch and no XHR rejects');
});

// ---- loadImage ----

const envImg = makeAssetEnv(makeWin({ Image: FakeImage }), makeDoc([]));
const img = await settle(envImg.loadImage('assets/art/cars/a.png'));

test('loadImage resolves with the image when there is no decode', () => {
	ok(img.ok, 'image loads');
	ok(img.value instanceof FakeImage, 'resolves with the same img object');
	eq(img.value.src, 'assets/art/cars/a.png', 'src was set');
	ok(!('crossOrigin' in img.value), 'crossOrigin is not set');
});

const envDec = makeAssetEnv(makeWin({ Image: FakeImageWithDecode }), makeDoc([]));
const imgDec = await settle(envDec.loadImage('a.png'));

test('loadImage waits for decode and resolves with the same img', () => {
	ok(imgDec.ok, 'decoded image resolves');
	ok(imgDec.value instanceof FakeImageWithDecode, 'same object after decode');
});

const envDecFail = makeAssetEnv(makeWin({ Image: FakeImageDecodeFails }), makeDoc([]));
const imgDecFail = await settle(envDecFail.loadImage('a.png'));

test('a rejected decode still resolves with the image', () => {
	ok(imgDecFail.ok, 'failed decode still resolves');
	ok(imgDecFail.value instanceof FakeImageDecodeFails, 'resolves with the img');
});

const envBroken = makeAssetEnv(makeWin({ Image: FakeImageBroken }), makeDoc([]));
const imgBroken = await settle(envBroken.loadImage('missing.png'));

test('loadImage rejects when the image fails to load', () => {
	ok(!imgBroken.ok, 'onerror rejects');
});

// ---- makeCanvas ----

const tags = [];
const envCanvas = makeAssetEnv(makeWin({}), makeDoc(tags));
const canvas = envCanvas.makeCanvas(40, 20);

test('makeCanvas creates a canvas of the given size', () => {
	eq(tags, ['canvas'], 'created a canvas element');
	eq(canvas.width, 40, 'canvas width');
	eq(canvas.height, 20, 'canvas height');
});

// ---- setTimeout ----

const timers = [];
const envTimer = makeAssetEnv(
	makeWin({
		setTimeout: function (fn, ms) {
			timers.push(ms);
			return 7;
		},
	}),
	makeDoc([])
);
const timerId = envTimer.setTimeout(function () {}, 50);

test('setTimeout forwards to win.setTimeout', () => {
	eq(timerId, 7, 'returns the window timer id');
	eq(timers, [50], 'window got the delay');
});

const envNoTimer = makeAssetEnv(makeWin({}), makeDoc([]));

test('setTimeout is undefined when win has none', () => {
	eq(envNoTimer.setTimeout, undefined, 'no setTimeout on the env');
});

// ---- contract with the sprite loader ----

const MANIFEST = { car: { file: 'car.png', w: 4, h: 2 } };
const winLoader = makeWin({
	fetch: function () {
		return Promise.resolve({ ok: true, json: () => Promise.resolve(MANIFEST) });
	},
	Image: FakeImageWithDecode,
});
const envLoader = makeAssetEnv(winLoader, makeDoc([]));
const sprites = createSprites(envLoader);
await sprites.load();

test('the env drives createSprites end to end', () => {
	ok(sprites.ready, 'loader finished');
	ok(sprites.has('car') === true, 'manifest sprite loaded');
});

done();
