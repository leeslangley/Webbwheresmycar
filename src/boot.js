// Boot code (DESIGN.md sections 1, 3, 9.5, 9.7): connects the page's canvas,
// pointer/keyboard events and the requestAnimationFrame draw loop to the app
// object from ui/scenes.js. Runs in the browser only (main.js calls it); all
// game logic stays in the pure modules.

import { applyLayout, toLogical } from './ui/canvas.js';
import { createApp } from './ui/scenes.js';
import { PALETTE } from './ui/theme.js';
import { label } from './ui/kit_draw.js';

// Placeholder title scene (DESIGN.md 9.5): the W57 title screen replaces this.
const titleScene = {
	id: 'title',
	draw: function (ctx, app, t) {
		label(ctx, "WEBB, WHERE'S MY CAR?", app.w / 2, 280, {
			size: 36,
			color: PALETTE.cream,
			align: 'center',
			font: 'title',
			shadow: true,
		});
		label(ctx, "A WEBB'S WHEELS PRODUCTION", app.w / 2, 380, {
			size: 28,
			color: PALETTE.cream,
			align: 'center',
			font: 'body',
			shadow: true,
		});
	},
};

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

	const app = createApp({
		now: function () {
			return win.performance ? win.performance.now() : 0;
		},
	});
	app.register(titleScene);
	app.go('title');

	// Pointer events: convert screen coordinates to logical game coordinates
	// and hand them to the current scene. pointercancel counts as an 'up'.
	function onPointer(type, e) {
		e.preventDefault();
		const p = toLogical(layoutInfo.layout, e.clientX, e.clientY);
		if (p) {
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
