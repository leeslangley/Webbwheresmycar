// Boot code (DESIGN.md sections 1, 3, 9.5, 9.7): connects the page's canvas,
// pointer/keyboard events and the requestAnimationFrame draw loop to the app
// object from ui/scenes.js. Runs in the browser only (main.js calls it); all
// game logic stays in the pure modules.

import { applyLayout, toLogical } from './ui/canvas.js';
import { createGame } from './game.js';
import { createRooms } from './art/rooms.js';

// bootGame(env) -> {app, getLayout}. env = {window, document, storage}.
export function bootGame(env) {
	const win = env.window;
	const doc = env.document;
	const canvas = doc.getElementById('game');

	let layoutInfo = applyLayout(canvas, win);
	function reapply() {
		layoutInfo = applyLayout(canvas, win);
	}
	win.addEventListener('resize', reapply);
	win.addEventListener('orientationchange', reapply);

	const app = createGame({
		storage: env.storage,
		now: function () {
			return win.performance ? win.performance.now() : 0;
		},
	});
	app.go('title');

	// Room plates (GE13): only when the browser has fetch and Image. Tests and
	// old browsers leave app.rooms undefined. look is the pointer as -1..1 from
	// the centre of the game view; it stays 0,0 until the pointer moves.
	app.look = { x: 0, y: 0 };
	if (typeof win.fetch === 'function' && typeof win.Image === 'function') {
		const loadJson = function (url) {
			return win.fetch(url).then(function (r) {
				if (!r.ok) {
					throw new Error('http ' + r.status);
				}
				return r.json();
			});
		};
		const loadImage = function (url) {
			return new Promise(function (res, rej) {
				const im = new win.Image();
				im.onload = function () {
					res(im);
				};
				im.onerror = function () {
					rej(new Error('image'));
				};
				im.src = url;
			});
		};
		app.rooms = createRooms({ loadJson: loadJson, loadImage: loadImage });
		app.rooms.load();
	}

	// Pointer events: convert screen coordinates to logical game coordinates
	// and hand them to the current scene. pointercancel counts as an 'up'.
	// Every pointer type also moves app.look (the parallax direction).
	function onPointer(type, e) {
		e.preventDefault();
		const p = toLogical(layoutInfo.layout, e.clientX, e.clientY);
		if (p) {
			app.look = {
				x: Math.max(-1, Math.min(1, (p.x - 640) / 640)),
				y: Math.max(-1, Math.min(1, (p.y - 360) / 360)),
			};
			app.pointer(type, p.x, p.y);
		}
	}
	canvas.addEventListener('pointerdown', function (e) {
		onPointer('down', e);
	});
	canvas.addEventListener('pointermove', function (e) {
		onPointer('move', e);
	});
	canvas.addEventListener('pointerup', function (e) {
		onPointer('up', e);
	});
	canvas.addEventListener('pointercancel', function (e) {
		onPointer('up', e);
	});

	win.addEventListener('keydown', function (e) {
		app.key(e.key);
	});

	// Ask the browser to fetch the two game fonts, but never wait for them:
	// the draw loop starts immediately and later frames pick the fonts up.
	if (doc.fonts && typeof doc.fonts.load === 'function') {
		try {
			doc.fonts.load('16px "Press Start 2P"');
		} catch (e) {}
		try {
			doc.fonts.load('16px VT323');
		} catch (e) {}
	}

	function frame(ms) {
		app.draw(layoutInfo.ctx, ms / 1000);
		win.requestAnimationFrame(frame);
	}
	win.requestAnimationFrame(frame);

	return {
		app: app,
		getLayout: function () {
			return layoutInfo;
		},
	};
}
