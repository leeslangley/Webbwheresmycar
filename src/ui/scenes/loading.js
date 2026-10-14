// Loading scene (card CC09): shown while the car sprites and fonts load. A
// code-drawn car rides along a road track as the progress marker. It never
// blocks for more than 8 seconds and works with no sprites at all. Pure: no
// DOM, no Date, everything drawn through the passed-in ctx so it runs in jsc
// tests with tests/fakectx.js.

import { PALETTE, shade } from '../theme.js';
import { label } from '../kit_draw.js';
import { drawCar } from '../../art/cardraw.js';

// Logical 1280x720 layout.
const W = 1280;
const H = 720;
const ROAD = { x: 340, y: 520, w: 600, h: 28 };
const SEG_COUNT = 20;
const SEG_W = 28;
const SEG_GAP = 4;
const SEG_Y = 486;
const SEG_H = 16;
const SEG_ROW_W = SEG_COUNT * SEG_W + (SEG_COUNT - 1) * SEG_GAP;
const SEG_X = (W - SEG_ROW_W) / 2;
const DASH = 24;
const DASH_GAP = 16;
const DASH_PERIOD = DASH + DASH_GAP;
const DASH_SPEED = 90; // px per second, scrolling left
const DASH_H = 4;
const DASH_Y = ROAD.y + ROAD.h / 2 - DASH_H / 2;
const CAR_Y = 548;
const CAR_SCALE = 0.45;
const MIN_SHOW = 0.6; // seconds: leave early once assets are ready
const MAX_SHOW = 8; // seconds: never block longer than this

function clamp01(x) {
	return x < 0 ? 0 : x > 1 ? 1 : x;
}

export const loadingScene = {
	id: 'loading',
	start: null,
	went: false,

	enter: function (app) {
		this.start = null;
		this.went = false;
	},

	draw: function (ctx, app, t) {
		if (this.start === null) {
			this.start = t;
		}
		const assets = app.assets;
		let frac = 0;
		let ready = false;
		let timedOut = false;
		if (assets) {
			ready = assets.ready();
			timedOut = assets.timedOut();
			const p = assets.progress();
			frac = ready ? 1 : p.total > 0 ? clamp01(p.done / p.total) : 0;
		}

		// Night-sky gradient: ink at the top fading to blue at the bottom.
		const sky = ctx.createLinearGradient(0, 0, 0, H);
		sky.addColorStop(0, PALETTE.ink);
		sky.addColorStop(1, PALETTE.blue);
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, W, H);

		label(ctx, "WEBB, WHERE'S MY CAR?", W / 2, 220, {
			size: 40,
			color: PALETTE.cream,
			align: 'center',
			font: 'title',
			shadow: true,
		});
		label(ctx, "A WEBB'S WHEELS PRODUCTION", W / 2, 290, {
			size: 26,
			color: PALETTE.lightgrey,
			align: 'center',
			font: 'body',
		});

		// Segment row: the first floor(frac * 20) cells are lit.
		const lit = Math.floor(frac * SEG_COUNT);
		for (let i = 0; i < SEG_COUNT; i++) {
			ctx.fillStyle = i < lit ? PALETTE.good : shade(PALETTE.ink, 0.2);
			ctx.fillRect(SEG_X + i * (SEG_W + SEG_GAP), SEG_Y, SEG_W, SEG_H);
		}

		// Road with a yellow dashed centre line scrolling left.
		ctx.fillStyle = PALETTE.darkgrey;
		ctx.fillRect(ROAD.x, ROAD.y, ROAD.w, ROAD.h);
		const offset = ((t * DASH_SPEED) % DASH_PERIOD + DASH_PERIOD) % DASH_PERIOD;
		ctx.fillStyle = PALETTE.yellow;
		for (let x = ROAD.x - offset; x < ROAD.x + ROAD.w; x += DASH_PERIOD) {
			const x0 = Math.max(x, ROAD.x);
			const x1 = Math.min(x + DASH, ROAD.x + ROAD.w);
			if (x1 > x0) {
				ctx.fillRect(x0, DASH_Y, x1 - x0, DASH_H);
			}
		}

		// The car is the progress marker.
		drawCar(ctx, 'saloon', ROAD.x + frac * ROAD.w, CAR_Y, CAR_SCALE, { body: '#C8102E', cond: 10, t: t });

		// Status line under the road.
		if (timedOut) {
			label(ctx, 'STILL REVVING - GOING ANYWAY', W / 2, 590, {
				size: 28,
				color: PALETTE.cream,
				align: 'center',
				font: 'body',
			});
		} else {
			const dots = '.'.repeat(((Math.floor(t * 3) % 4) + 4) % 4);
			label(ctx, 'REVVING UP' + dots, W / 2, 590, {
				size: 28,
				color: PALETTE.cream,
				align: 'center',
				font: 'body',
			});
		}

		// Leave: no assets object means go at once; otherwise go when the
		// assets are ready (after a short minimum) or after MAX_SHOW seconds.
		const elapsed = t - this.start;
		const leave = !assets || (ready && elapsed >= MIN_SHOW) || elapsed >= MAX_SHOW;
		if (leave && !this.went) {
			this.went = true;
			app.go('title');
		}
	},

	pointer: function (app, type, x, y) {},

	key: function (app, key) {},
};
