// Auction hall scene (cards W65a/W65b, DESIGN.md sections 4.10, 5, 9.5, 9.7):
// the hall itself, the current lot's header (number, name, year, estimate range),
// browsing between the six lots with PREV/NEXT or the Left/Right keys, and the
// four stat rows. A stat reads ??? until the player pays to reveal it; the reveal
// costs no day, so it calls the sim directly and toasts the returned message.
// Pure UI: no DOM, no Math.random, no Date, everything through the passed-in ctx
// so it runs in jsc tests with tests/fakectx.js. draw() never writes to app.state.

import { PALETTE, font, shade, rgba } from '../theme.js';
import { panel, label, button, bar } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';
import { drawCar } from '../../art/cardraw.js';
import { paintOf } from '../../data/paint.js';
import { modelOf } from '../../data/cars.js';
import { money } from '../../core/format.js';
import { lotView, revealStat, placeBid, minBid, bidStep, attendAuction, AUCTION_REVEAL_COST, STATS } from '../../sim/auction.js';
import { isAuctionDay } from '../../core/clock.js';
import { drawHud } from '../../art/hud.js';
import { sunShaft, vignette } from '../../art/roomfx_light.js';

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

// Player-facing names for the four revealable stats, in STATS order, and the
// colour of each stat's bar. Stats run 0..10.
export const STAT_LABELS = ['STYLE', 'UPKEEP', 'GRIT', 'CONDITION'];

const STAT_COLORS = [PALETTE.lamp, PALETTE.lightred, PALETTE.lightgreen, PALETTE.cyan];

const STAT_MAX = 10;

// The YOUR LOTS panel, between the stat rows and the bid block. Kept out of
// the exported LAYOUT, whose shape the scene contract pins down.
const YOURS = { x: 370, y: 390, w: 300, h: 190 };

// True when the player currently leads at least one lot, and so must
// settle the day before leaving the hall.
function playerLeads(state) {
	const lots = state.auction.lots;
	for (let i = 0; i < lots.length; i++) {
		if (lots[i].leader === 'player') {
			return true;
		}
	}
	return false;
}

// The consigned cars as names and reserves, in consign order. A consigned
// car that is no longer in the stable is skipped.
function consignedViews(state) {
	const views = [];
	const consigned = state.auction.consigned;
	for (let i = 0; i < consigned.length; i++) {
		const carId = consigned[i].carId;
		for (let j = 0; j < state.cars.length; j++) {
			if (state.cars[j].id === carId) {
				views.push({ name: modelOf(state.cars[j].modelId).name, reserve: consigned[i].reserve });
				break;
			}
		}
	}
	return views;
}

// The YOUR LOTS panel: one row per consigned car (name left, reserve
// right), or Nothing consigned. Rows that do not fit are left out.
function drawYourLots(ctx, state) {
	const R = YOURS;
	panel(ctx, R.x, R.y, R.w, R.h, { fill: PALETTE.darkgrey });
	label(ctx, 'YOUR LOTS', R.x + 12, R.y + 10, {
		size: 16,
		font: 'title',
		color: PALETTE.lamp,
		shadow: true,
	});
	const mine = consignedViews(state);
	const rows = Math.floor((R.h - 46) / 28);
	if (mine.length === 0) {
		label(ctx, 'Nothing consigned', R.x + 12, R.y + 44, {
			size: 14,
			color: PALETTE.lightgrey,
			shadow: true,
		});
		return;
	}
	for (let i = 0; i < mine.length && i < rows; i++) {
		const rowY = R.y + 44 + i * 28;
		label(ctx, mine[i].name, R.x + 12, rowY, {
			size: 14,
			color: PALETTE.white,
			shadow: true,
			maxW: R.w - 110,
		});
		label(ctx, money(mine[i].reserve), R.x + R.w - 12, rowY, {
			size: 14,
			align: 'right',
			color: PALETTE.cream,
			shadow: true,
		});
	}
}

// The hall: dark room, a plank stage under the picture, a spotlight cone and a
// line of silhouette bidders along the bottom. Drawn back to front.
function drawHall(ctx, t, leading) {
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

	drawCrowd(ctx, t);

	// While the player leads, a few of the crowd wave paddles in the air,
	// rocking with t so a redraw with the same t always looks the same.
	if (leading) {
		for (let i = 0; i < 5; i++) {
			const x = 120 + i * 260;
			const wave = Math.sin(t * 5 + i * 1.7) * 0.5;
			ctx.save();
			ctx.translate(x, 648);
			ctx.rotate(wave);
			ctx.fillStyle = PALETTE.cream;
			ctx.fillRect(-3, -44, 6, 44);
			ctx.fillStyle = PALETTE.lightred;
			ctx.fillRect(-15, -66, 30, 24);
			ctx.restore();
		}
	}
}

// The crowd: silhouettes along the bottom, bobbing gently. t drives the
// bob only, so a redraw with the same t always looks the same.
function drawCrowd(ctx, t) {
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

// The hall when the Blender plate is loaded: the plate itself, the spotlight
// light over the lot, the code-drawn crowd and a vignette. The lot picture,
// buttons and hit areas stay where LAYOUT puts them.
function drawHallPlate(ctx, app, t) {
	const P = LAYOUT.picture;
	app.rooms.draw(ctx, 'auction', { look: app.look || { x: 0, y: 0 } });
	sunShaft(ctx, [[640, 0], [P.x + 180, P.y + P.h], [P.x + P.w - 180, P.y + P.h], [640, 0]], t);
	drawCrowd(ctx, t);
	vignette(ctx, 1280, 720, 0.3);
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

// One stat row: the stat's name, then ??? in grey while it is hidden or its
// value with a bar once revealed. A hidden row carries a REVEAL button on the
// right; the whole row is the tap target for it.
function drawStatRow(ctx, rect, i, view) {
	panel(ctx, rect.x, rect.y, rect.w, rect.h, { fill: PALETTE.darkgrey });
	const stat = STATS[i];
	const known = view.revealed[stat];
	label(ctx, STAT_LABELS[i], rect.x + 10, rect.y + 8, {
		size: 14,
		font: 'title',
		color: PALETTE.lamp,
		shadow: true,
	});
	if (known) {
		const value = view.values[stat];
		label(ctx, String(value), rect.x + 10, rect.y + 30, {
			size: 18,
			font: 'title',
			color: PALETTE.white,
			shadow: true,
		});
		bar(ctx, rect.x + 70, rect.y + 26, 60, 14, value, STAT_MAX, STAT_COLORS[i]);
	} else {
		label(ctx, '???', rect.x + 10, rect.y + 30, {
			size: 18,
			font: 'title',
			color: PALETTE.lightgrey,
			shadow: true,
		});
		button(ctx, {
			x: rect.x + rect.w - 130,
			y: rect.y + 7,
			w: 120,
			h: 36,
			label: 'REVEAL ' + money(AUCTION_REVEAL_COST),
		});
	}
}

export const auctionScene = {
	id: 'auction',

	// Which lot the hall is showing. Set to 0 on enter; draw keeps it wrapped.
	lotIndex: 0,

	// Hit list, rebuilt at the start of every draw; pressed is the id of the
	// hit pressed on 'down' and pressedLot is the lot showing at that moment.
	// Both are reset only by enter and 'up'.
	hits: null,
	pressed: null,
	pressedLot: null,
	shownLotId: null,

	enter: function (app) {
		this.hits = null;
		this.pressed = null;
		this.pressedLot = null;
		this.shownLotId = null;
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

		// The current lot, read before the hit list is built so the REVEAL hits
		// know which lot they belong to.
		const lot = n > 0 ? lots[this.lotIndex] : null;
		const view = lot ? lotView(state, lot.lotId) : null;
		this.shownLotId = lot ? lot.lotId : null;

		// Hit list first, so every tap below matches what this draw shows. A
		// REVEAL only exists while its stat is still hidden; the sim checks the
		// lot's remaining allowance and the cash.
		const hits = makeHits();
		hits.add('prev', LAYOUT.prev.x, LAYOUT.prev.y, LAYOUT.prev.w, LAYOUT.prev.h, () => {
			this.step(n, -1);
		});
		hits.add('next', LAYOUT.next.x, LAYOUT.next.y, LAYOUT.next.w, LAYOUT.next.h, () => {
			this.step(n, 1);
		});
		hits.add('back', LAYOUT.back.x, LAYOUT.back.y, LAYOUT.back.w, LAYOUT.back.h, () => {
			// While the player leads a lot they must settle the day first.
			if (playerLeads(state)) {
				app.toast('You are winning a lot. Settle first');
				return;
			}
			app.pop();
		});
		// Leaving the hall settles the whole day: consigned cars under the
		// hammer, then lots the player leads. The app handles the day from
		// there, so nothing else is shown here.
		hits.add('leave', LAYOUT.leave.x, LAYOUT.leave.y, LAYOUT.leave.w, LAYOUT.leave.h, () => {
			const res = app.act(function () {
				return attendAuction(app.state);
			});
			if (res && res.ok === false) {
				app.toast(res.msg);
			}
		});
		if (view) {
			// The two bid buttons. A bid costs no day, so it is not an app.act:
			// it calls the sim directly and toasts its message. Like the
			// reveals, only the lot on screen when the finger went down may
			// take the bid.
			const lotId = lot.lotId;
			hits.add('bid1', LAYOUT.bid1.x, LAYOUT.bid1.y, LAYOUT.bid1.w, LAYOUT.bid1.h, () => {
				if (this.pressedLot !== lotId) {
					return;
				}
				const res = placeBid(app.state, lotId, 1);
				app.toast(res.msg);
			});
			hits.add('bid3', LAYOUT.bid3.x, LAYOUT.bid3.y, LAYOUT.bid3.w, LAYOUT.bid3.h, () => {
				if (this.pressedLot !== lotId) {
					return;
				}
				const res = placeBid(app.state, lotId, 3);
				app.toast(res.msg);
			});
			for (let i = 0; i < STATS.length; i++) {
				if (view.revealed[STATS[i]]) {
					continue;
				}
				const r = LAYOUT.reveals[i];
				const lotId = lot.lotId;
				const stat = STATS[i];
				hits.add('reveal' + i, r.x, r.y, r.w, r.h, () => {
					// Only the lot that was on screen when the player pressed
					// may be revealed: if the hall moved on before the release,
					// the tap was not for this lot and must not spend cash.
					if (this.pressedLot !== lotId) {
						return;
					}
					// A reveal costs no day, so it is not an app.act.
					const res = revealStat(app.state, lotId, stat);
					app.toast(res.msg);
				});
			}
		}
		this.hits = hits;

		if (app.rooms && app.rooms.has('auction')) {
			drawHallPlate(ctx, app, t);
		} else {
			drawHall(ctx, t, view ? view.leader === 'player' : false);
		}
		arrowButton(ctx, LAYOUT.prev, '<', 'PREV');
		arrowButton(ctx, LAYOUT.next, '>', 'NEXT');

		if (n === 0) {
			label(ctx, 'No lots this month.', 640, LAYOUT.picture.y + 120, {
				size: 34,
				align: 'center',
				color: PALETTE.cream,
				shadow: true,
			});
		} else if (view) {
			const model = modelOf(view.modelId);
			// The car stands on the stage, painted in its catalogue colour. Its
			// wear only shows once the player has paid to know the condition.
			drawCar(ctx, model.archetype, 640, LAYOUT.picture.y + LAYOUT.picture.h - 24, 1.7, {
				body: paintOf(model.id),
				cond: view.revealed.condition ? view.values.condition : 6,
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

		// The four stat rows: ??? until paid for, then the value with a bar and
		// a REVEAL button while the stat is still hidden.
		if (view) {
			for (let i = 0; i < STATS.length; i++) {
				drawStatRow(ctx, LAYOUT.reveals[i], i, view);
			}
		}

		// The bidding block: the current bid, who leads and the next minimum,
		// then the two bid buttons. The amounts come from the sim's minBid and
		// bidStep: BID +1 bids the minimum, BID +3 bids two steps above it.
		if (view) {
			const leaderText = view.leader === 'player' ? 'You' : view.leader === 'ai' ? 'Rival bidder' : 'Nobody';
			label(ctx, 'Bid: ' + (view.currentBid > 0 ? money(view.currentBid) : 'none'), LAYOUT.bid1.x, LAYOUT.bid1.y - 88, {
				size: 22,
				font: 'title',
				color: PALETTE.white,
				shadow: true,
			});
			label(ctx, leaderText, LAYOUT.bid1.x, LAYOUT.bid1.y - 58, {
				size: 18,
				font: 'title',
				color: PALETTE.lamp,
				shadow: true,
			});
			label(ctx, 'Min next ' + money(minBid(lot)), LAYOUT.bid1.x, LAYOUT.bid1.y - 32, {
				size: 16,
				color: PALETTE.cream,
				shadow: true,
			});
			button(ctx, {
				x: LAYOUT.bid1.x,
				y: LAYOUT.bid1.y,
				w: LAYOUT.bid1.w,
				h: LAYOUT.bid1.h,
				label: 'BID +1 ' + money(minBid(lot)),
				kind: 'primary',
			});
			button(ctx, {
				x: LAYOUT.bid3.x,
				y: LAYOUT.bid3.y,
				w: LAYOUT.bid3.w,
				h: LAYOUT.bid3.h,
				label: 'BID +3 ' + money(minBid(lot) + 2 * bidStep(lot)),
				kind: 'primary',
			});
		}

		// The player's consigned cars, then the hall's own buttons and the
		// leave-and-settle button, then the HUD strip on top of everything.
		drawYourLots(ctx, state);
		button(ctx, {
			x: LAYOUT.leave.x,
			y: LAYOUT.leave.y,
			w: LAYOUT.leave.w,
			h: LAYOUT.leave.h,
			label: 'LEAVE & SETTLE',
			kind: 'primary',
		});
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
			// Tap rule: remember the hit's id, never the hit object. The lot
			// showing now is remembered too, so a reveal cannot land on a lot
			// the player never saw.
			const h = this.hits.hit(x, y);
			this.pressed = h ? h.id : null;
			this.pressedLot = this.shownLotId;
			return;
		}
		if (type === 'up') {
			const e = this.hits.hit(x, y);
			const pressed = this.pressed;
			this.pressed = null;
			if (e && pressed !== null && e.id === pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
			this.pressedLot = null;
		}
	},

	key: function (app, k) {
		const state = app.state;
		if (!state) {
			return;
		}
		if (k === 'Escape') {
			// Same rule as the BACK button: no leaving while leading a lot.
			if (playerLeads(state)) {
				app.toast('You are winning a lot. Settle first');
				return;
			}
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
