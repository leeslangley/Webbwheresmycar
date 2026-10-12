// Auction hall scene (card W65a, DESIGN.md sections 4.10, 5, 9.5, 9.7): the
// hall itself, the current lot's header (number, name, year, estimate range) and
// browsing between the six lots with PREV/NEXT or the Left/Right keys. Reveals
// and bidding are other cards; this one only looks. Pure UI: no DOM, no
// Math.random, no Date, everything through the passed-in ctx so it runs in jsc
// tests with tests/fakectx.js. draw() never writes to app.state.

import { PALETTE, font, shade, rgba } from '../theme.js';
import { panel, label } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';
import { drawCar } from '../../art/cardraw.js';
import { paintOf } from '../../data/paint.js';
import { modelOf } from '../../data/cars.js';
import { money } from '../../core/format.js';
import { lotView } from '../../sim/auction.js';
import { isAuctionDay } from '../../core/clock.js';
import { drawHud } from '../../art/hud.js';

// Rectangles in logical 1280x720 coordinates.
export const LAYOUT = {
	prev: { x: 40, y: 300, w: 60, h: 80 },
	next: { x: 1180, y: 300, w: 60, h: 80 },
	picture: { x: 120, y: 100, w: 1040, h: 260 },
	reveals: [
		{ x: 60, y: 390, w: 280, h: 50 },
		{ x: 60, y: 446, w: 280, h: 50 },
		{ x: 60, y: 502, w: 280, h: 50 },
		{ x: 60, y: 558, w: 280, h: 50 },
	],
	bid1: { x: 700, y: 520, w: 260, h: 64 },
	bid3: { x: 980, y: 520, w: 260, h: 64 },
	leave: { x: 700, y: 600, w: 540, h: 70 },
	back: { x: 40, y: 650, w: 200, h: 50 },
};

// The hall: dark room, a plank stage under the picture, a spotlight cone and a
// line of silhouette bidders along the bottom. Drawn back to front.
function drawHall(ctx, t) {
	const P = LAYOUT.picture;

	// The room itself, darker than the stage.
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(0, 0, 1280, 720);

	// A warm glow behind the lot, as if the hall lights were on it.
	ctx.fillStyle = rgba(PALETTE.lamp, 0.10);
	ctx.fillRect(P.x - 120, P.y - 40, P.w + 240, P.h + 120);

	// The plank stage the car stands on.
	ctx.fillStyle = PALETTE.brown;
	ctx.fillRect(P.x, P.y, P.w, P.h);
	const plank = Math.round(P.h / 6);
	for (let i = 1; i < 6; i++) {
		ctx.fillStyle = shade(PALETTE.brown, -0.35);
		ctx.fillRect(P.x, P.y + i * plank, P.w, 3);
	}
	ctx.lineWidth = 6;
	ctx.strokeStyle = shade(PALETTE.brown, -0.5);
	ctx.strokeRect(P.x, P.y, P.w, P.h);

	// The spotlight cone falling from the ceiling onto the lot.
	ctx.beginPath();
	ctx.moveTo(640, 0);
	ctx.lineTo(P.x + 180, P.y + P.h);
	ctx.lineTo(P.x + P.w - 180, P.y + P.h);
	ctx.closePath();
	ctx.fillStyle = rgba(PALETTE.lamp, 0.14);
	ctx.fill();

	// The gavel, up in the top right corner: head and handle.
	ctx.save();
	ctx.translate(P.x + P.w - 90, P.y + 40);
	ctx.fillStyle = PALETTE.cream;
	ctx.fillRect(-30, -8, 60, 16);
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(-30, -8, 60, 3);
	ctx.fillStyle = shade(PALETTE.brown, 0.4);
	ctx.fillRect(26, -4, 40, 8);
	ctx.restore();

	// The crowd: silhouettes along the bottom, bobbing gently. t drives the
	// bob only, so a redraw with the same t always looks the same.
	for (let i = 0; i < 16; i++) {
		const x = 40 + i * 80;
		const bob = Math.round(Math.sin(t * 2 + i) * 3);
		const y = 660 + bob;
		ctx.fillStyle = PALETTE.black;
		ctx.beginPath();
		ctx.arc(x, y - 10, 13, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillRect(x - 18, y + 2, 36, 52);
	}
}

// The stage arrow button: a panel with a big glyph and a small caption under it.
function arrowButton(ctx, rect, glyph, caption, t) {
	panel(ctx, rect.x, rect.y, rect.w, rect.h, { fill: PALETTE.lightblue });
	ctx.fillStyle = shade(PALETTE.lightblue, 0.3);
	ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, Math.round((rect.h - 8) * 0.25));
	label(ctx, glyph, rect.x + rect.w / 2, rect.y + 14, {
		size: 34,
		font: 'title',
		align: 'center',
		color: PALETTE.white,
		shadow: true,
	});
	label(ctx, caption, rect.x + rect.w / 2, rect.y + rect.h - 24, {
		size: 12,
		font: 'title',
		align: 'center',
		color: PALETTE.white,
		shadow: true,
		maxW: rect.w - 8,
	});
}

export const auctionScene = {
	id: 'auction',

	// Which lot the hall is showing. Set to 0 on enter; draw keeps it wrapped.
	lotIndex: 0,

	// Hit list, rebuilt at the start of every draw; pressed is the id of the
	// hit pressed on 'down' and is reset only by enter and 'up'.
	hits: null,
	pressed: null,

	enter: function (app) {
		this.hits = null;
		this.pressed = null;
		this.lotIndex = 0;
		const state = app.state;
		if (!state || !isAuctionDay(state.day)) {
			app.toast('The auction is only on the 24th');
			app.pop();
		}
	},

	draw: function (ctx, app, t) {
		const state = app.state;
		if (!state) {
			return;
		}
		const lots = state.auction.lots;

		// The lot list can be empty (after a visit) or change size; keep the
		// index inside it with wrap-around.
		const n = lots.length;
		if (n > 0) {
			this.lotIndex = ((this.lotIndex % n) + n) % n;
		} else {
			this.lotIndex = 0;
		}

		// Hit list first, so every tap below matches what this draw shows.
		const hits = makeHits();
		hits.add('prev', LAYOUT.prev.x, LAYOUT.prev.y, LAYOUT.prev.w, LAYOUT.prev.h, () => {
			this.step(n, -1);
		});
		hits.add('next', LAYOUT.next.x, LAYOUT.next.y, LAYOUT.next.w, LAYOUT.next.h, () => {
			this.step(n, 1);
		});
		hits.add('back', LAYOUT.back.x, LAYOUT.back.y, LAYOUT.back.w, LAYOUT.back.h, () => {
			app.pop();
		});
		this.hits = hits;

		drawHall(ctx, t);
		arrowButton(ctx, LAYOUT.prev, '<', 'PREV');
		arrowButton(ctx, LAYOUT.next, '>', 'NEXT');

		// The current lot and its header.
		const lot = n > 0 ? lots[this.lotIndex] : null;
		const view = lot ? lotView(state, lot.lotId) : null;
		if (n === 0) {
			label(ctx, 'No lots this month.', 640, LAYOUT.picture.y + 120, {
				size: 34,
				align: 'center',
				color: PALETTE.cream,
				shadow: true,
			});
		} else if (view) {
			const model = modelOf(view.modelId);
			// The car stands on the stage, painted in its catalogue colour.
			drawCar(ctx, model.archetype, 640, LAYOUT.picture.y + LAYOUT.picture.h - 24, 1.7, {
				body: paintOf(model.id),
				cond: 6,
				t: t,
			});
			// Header over the stage: lot number, name (title font 22px), year,
			// then the estimate range.
			label(ctx, 'LOT ' + (this.lotIndex + 1) + '/' + n, LAYOUT.picture.x + 24, LAYOUT.picture.y + 16, {
				size: 20,
				font: 'title',
				color: PALETTE.lamp,
				shadow: true,
			});
			label(ctx, view.name, 640, LAYOUT.picture.y + 14, {
				size: 22,
				font: 'title',
				align: 'center',
				color: PALETTE.white,
				shadow: true,
				maxW: LAYOUT.picture.w - 80,
			});
			label(ctx, String(view.year), 640, LAYOUT.picture.y + 46, {
				size: 22,
				align: 'center',
				color: PALETTE.cream,
				shadow: true,
			});
			label(ctx, 'Estimate ' + money(view.estLow) + ' to ' + money(view.estHigh), 640, LAYOUT.picture.y + 76, {
				size: 24,
				align: 'center',
				color: PALETTE.white,
				shadow: true,
				maxW: LAYOUT.picture.w - 80,
			});
		}

		// The hall's own buttons, then the HUD strip on top of everything.
		arrowButton(ctx, LAYOUT.back, '<', 'BACK');
		drawHud(ctx, state, t);
	},

	// Move the lot index by delta places, wrapping around both ends.
	step: function (n, delta) {
		if (n <= 0) {
			return;
		}
		this.lotIndex = ((this.lotIndex + delta) % n + n) % n;
	},

	pointer: function (app, type, x, y) {
		if (this.hits === null) {
			return;
		}
		if (type === 'down') {
			// Tap rule: remember the hit's id, never the hit object.
			const h = this.hits.hit(x, y);
			this.pressed = h ? h.id : null;
			return;
		}
		if (type === 'up') {
			const e = this.hits.hit(x, y);
			const pressed = this.pressed;
			this.pressed = null;
			if (e && pressed !== null && e.id === pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
		}
	},

	key: function (app, k) {
		const state = app.state;
		if (!state) {
			return;
		}
		if (k === 'Escape') {
			app.pop();
			return;
		}
		const n = state.auction.lots.length;
		if (n === 0) {
			return;
		}
		if (k === 'ArrowLeft' || k === 'Left') {
			this.step(n, -1);
		} else if (k === 'ArrowRight' || k === 'Right') {
			this.step(n, 1);
		}
	},
};
