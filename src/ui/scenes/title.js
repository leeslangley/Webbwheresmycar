// Title screen scene (card W57, DESIGN.md sections 1, 3, 9.5, 9.7): night
// sky with twinkling stars, a road with a moving car, the bobbing logo and
// the NEW GAME / CONTINUE / SETTINGS buttons. Pure: no DOM, no Date,
// everything drawn through the passed-in ctx so it runs in jsc tests with
// tests/fakectx.js.

import { PALETTE, font, rgba } from '../theme.js';
import { button, label } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';
import { drawCar } from '../../art/cardraw.js';

// Button rectangles in logical 1280x720 coordinates.
export const LAYOUT = {
	newGame: { x: 480, y: 420, w: 320, h: 64 },
	continueBtn: { x: 480, y: 500, w: 320, h: 64 },
	settings: { x: 480, y: 580, w: 320, h: 56 },
};

const CAR_ARCHETYPES = ['saloon', 'roadster', 'trike', 'wedge'];
const STAR_COUNT = 40;
const ROAD_TOP = 640;
const ROAD_BOTTOM = 720;

// Deterministic star positions: a fixed formula of the index, no Math.random.
function starAt(i) {
	return {
		x: (i * 137 + 53) % 1280,
		y: (i * 89 + 31) % 600, // keep stars above the road strip
	};
}

export const titleScene = {
	id: 'title',
	hits: null,
	pressed: null,

	enter: function () {
		this.hits = makeHits();
		this.pressed = null;
	},

	draw: function (ctx, app, t) {
		// Rebuild the hit list at the start of every draw so it always
		// matches what is on screen (DESIGN.md 9.7).
		const hits = makeHits();
		this.hits = hits;

		// Night-sky gradient: ink at the top fading to blue at the bottom.
		const sky = ctx.createLinearGradient(0, 0, 0, ROAD_BOTTOM);
		sky.addColorStop(0, PALETTE.ink);
		sky.addColorStop(1, PALETTE.blue);
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, app.w, ROAD_TOP);

		// Twinkling stars: alpha oscillates with t.
		for (let i = 0; i < STAR_COUNT; i++) {
			const s = starAt(i);
			const a = 0.5 + 0.5 * Math.sin(t + i);
			ctx.fillStyle = rgba('#FFFFFF', a);
			ctx.fillRect(s.x, s.y, 2, 2);
		}

		// Road strip along the bottom with a dashed centre line that
		// scrolls left as t grows.
		ctx.fillStyle = PALETTE.darkgrey;
		ctx.fillRect(0, ROAD_TOP, app.w, ROAD_BOTTOM - ROAD_TOP);
		const dash = 60;
		const gap = 40;
		const period = dash + gap;
		const speed = 120; // px per second
		const start = -((t * speed) % period);
		ctx.fillStyle = PALETTE.yellow;
		for (let x = start; x < app.w; x += period) {
			ctx.fillRect(x, 676, dash, 8);
		}

		// A car drives left-to-right across the road, cycling the
		// archetypes one every 6 seconds.
		const arch = CAR_ARCHETYPES[Math.floor(t / 6) % CAR_ARCHETYPES.length];
		const carX = -300 + ((t % 6) / 6) * 1900;
		drawCar(ctx, arch, carX, 660, 1, { body: '#9a2a2a', cond: 10 });

		// Logo: the whole block bobs gently.
		const bob = Math.sin(t * 1.5) * 4;
		label(ctx, 'WEBB,', app.w / 2, 120 + bob, {
			size: 64,
			color: PALETTE.lamp,
			align: 'center',
			font: 'title',
			shadow: true,
		});
		label(ctx, "WHERE'S MY CAR?", app.w / 2, 210 + bob, {
			size: 48,
			color: PALETTE.cream,
			align: 'center',
			font: 'title',
			shadow: true,
		});
		label(ctx, "A WEBB'S WHEELS PRODUCTION", app.w / 2, 300 + bob, {
			size: 30,
			color: PALETTE.lightgrey,
			align: 'center',
			font: 'body',
		});
		label(ctx, 'Starring Mark Webb', app.w / 2, 340 + bob, {
			size: 28,
			color: PALETTE.yellow,
			align: 'center',
			font: 'body',
		});

		// Buttons.
		button(ctx, { x: LAYOUT.newGame.x, y: LAYOUT.newGame.y, w: LAYOUT.newGame.w, h: LAYOUT.newGame.h, label: 'NEW GAME', kind: 'primary' });
		button(ctx, { x: LAYOUT.continueBtn.x, y: LAYOUT.continueBtn.y, w: LAYOUT.continueBtn.w, h: LAYOUT.continueBtn.h, label: 'CONTINUE', enabled: app.hasSave() });
		button(ctx, { x: LAYOUT.settings.x, y: LAYOUT.settings.y, w: LAYOUT.settings.w, h: LAYOUT.settings.h, label: 'SETTINGS' });

		hits.add('newGame', LAYOUT.newGame.x, LAYOUT.newGame.y, LAYOUT.newGame.w, LAYOUT.newGame.h, function () {
			app.newGame();
		});
		hits.add('continue', LAYOUT.continueBtn.x, LAYOUT.continueBtn.y, LAYOUT.continueBtn.w, LAYOUT.continueBtn.h, function () {
			app.continueGame();
		}, { enabled: app.hasSave() });
		hits.add('settings', LAYOUT.settings.x, LAYOUT.settings.y, LAYOUT.settings.w, LAYOUT.settings.h, function () {
			app.push('settings');
		});
	},

	// 'down' presses a button, 'up' commits the tap when it lands on the
	// same hit as the down (tap = same hit on down and up). The pressed
	// state remembers the hit ID, not the entry object: draw rebuilds the
	// hit list every frame, so between a down and its up the entries are
	// new objects but the IDs are stable.
	pointer: function (app, type, x, y) {
		if (!this.hits) return;
		if (type === 'down') {
			const h = this.hits.hit(x, y);
			this.pressed = h ? h.id : null;
			return;
		}
		if (type === 'up') {
			const e = this.hits.hit(x, y);
			if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
			this.pressed = null;
		}
	},

	key: function (app, key) {
		if (key === 'Enter' || key === 'n') {
			app.newGame();
		} else if (key === 'c') {
			if (app.hasSave()) {
				app.continueGame();
			}
		} else if (key === 's') {
			app.push('settings');
		}
	},
};
