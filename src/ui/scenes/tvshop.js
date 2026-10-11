// TV shop scene, look only (card W59, DESIGN.md sections 4.3, 4.4, 5, 9.5,
// 9.7): a big old telly showing the week's listings, the selected car and
// its details. No tapping or keyboard yet (card W59b): the hit entries
// exist but their onTap handlers do nothing. Pure: no DOM, no Date,
// everything drawn through the passed-in ctx so it runs in jsc tests with
// tests/fakectx.js. draw() never touches app.state.

import { PALETTE, font, rgba } from '../theme.js';
import { panel, label, paragraph, button, bar } from '../kit_draw.js';
import { makeHits, ScrollList } from '../kit_hits.js';
import { drawCar } from '../../art/cardraw.js';
import { paintOf } from '../../data/paint.js';
import { modelOf } from '../../data/cars.js';
import { money, oneDp } from '../../core/format.js';

// Rectangles in logical 1280x720 coordinates.
export const LAYOUT = {
	list: { x: 40, y: 120, w: 560, h: 480 },
	rowH: 60,
	detail: { x: 620, y: 120, w: 620, h: 480 },
	buy: { x: 640, y: 600, w: 290, h: 64 },
	rent: { x: 950, y: 600, w: 290, h: 64 },
	back: { x: 40, y: 640, w: 200, h: 56 },
};

// The telly: bezel, screen and knobs.
const BEZEL = { x: 12, y: 12, w: 1256, h: 696 };
const SCREEN = { x: 32, y: 32, w: 1208, h: 656 };
const KNOBS = [{ x: 1250, y: 300 }, { x: 1250, y: 360 }];
const KNOB_R = 14;

function drawKnob(ctx, x, y) {
	ctx.beginPath();
	ctx.arc(x, y, KNOB_R, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.black;
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = PALETTE.lightgrey;
	ctx.stroke();
}

// One listing row in the scroll list. y is the row's top on screen (it may
// sit partly outside the clipped view).
function drawRow(ctx, listing, y, selected, t) {
	const L = LAYOUT.list;
	const model = modelOf(listing.modelId);
	panel(ctx, L.x, y, L.w, LAYOUT.rowH, { shadow: false });
	// Car name, shrunk to fit the space left of the tag.
	label(ctx, model.name, L.x + 40, y + 14, { size: 30, maxW: 220 });
	// Sale/rent tag in a small panel.
	const sale = listing.mode === 'sale';
	const tagX = L.x + 268;
	panel(ctx, tagX, y + 15, 104, 30, { fill: sale ? PALETTE.green : PALETTE.orange, shadow: false, bw: 2 });
	label(ctx, sale ? 'FOR SALE' : 'TO RENT', tagX + 52, y + 21, {
		size: 12,
		align: 'center',
		font: 'title',
		color: PALETTE.white,
	});
	// Price on the right, shrunk if a big rent figure needs it.
	const priceText = money(listing.price) + (sale ? '' : '/mo');
	label(ctx, priceText, L.x + L.w - 12, y + 14, { size: 30, align: 'right', color: PALETTE.ink, maxW: 180 });
	// The selected row gets a lamp outline and a blinking cursor.
	if (selected) {
		ctx.lineWidth = 4;
		ctx.strokeStyle = PALETTE.lamp;
		ctx.strokeRect(L.x, y, L.w, LAYOUT.rowH);
		if (Math.floor(t * 2) % 2 === 0) {
			label(ctx, '>', L.x + 8, y + 18, { size: 24, color: PALETTE.lamp, font: 'title' });
		}
	}
}

// The detail panel for the selected listing: picture, name, quip, stat bars.
function drawDetail(ctx, listing, t) {
	const D = LAYOUT.detail;
	const model = modelOf(listing.modelId);
	panel(ctx, D.x, D.y, D.w, D.h);
	label(ctx, model.name, D.x + 20, D.y + 16, { size: 22, font: 'title', maxW: D.w - 40 });
	// Year and the salesman's patter, wrapped.
	paragraph(ctx, model.year + '. ' + model.quip, D.x + 20, D.y + 50, D.w - 40, { size: 28 });
	// The car itself, painted in its catalogue colour.
	drawCar(ctx, model.archetype, 930, 330, 1.15, { body: paintOf(model.id), cond: listing.condition, t: t });
	// Stat bars: STYLE, UPKEEP, GRIT then CONDITION.
	const rows = [
		{ text: 'STYLE', value: model.desirability, color: PALETTE.good },
		{ text: 'UPKEEP', value: model.maintenance, color: PALETTE.orange },
		{ text: 'GRIT', value: model.reliability, color: PALETTE.lightblue },
	];
	let y = 390;
	for (let i = 0; i < rows.length; i++) {
		label(ctx, rows[i].text, D.x + 20, y, { size: 26 });
		bar(ctx, D.x + 180, y + 4, 400, 22, rows[i].value, 10, rows[i].color);
		y += 40;
	}
	label(ctx, 'CONDITION ' + oneDp(listing.condition) + '/10', D.x + 20, y, { size: 26 });
	bar(ctx, D.x + 180, y + 4, 400, 22, listing.condition, 10, PALETTE.cyan);
	y += 40;
	if (listing.mode === 'rent') {
		label(ctx, 'Owner: ' + listing.owner, D.x + 20, y, { size: 28 });
	}
}

export const tvshopScene = {
	id: 'tvshop',
	selected: 0,
	scroll: null,
	hits: null,
	pressed: null,

	enter: function (app) {
		const listings = app.state.shop.listings;
		this.selected = 0;
		this.scroll = new ScrollList({ viewH: LAYOUT.list.h, rowH: LAYOUT.rowH, count: listings.length });
		this.hits = makeHits();
		this.pressed = null;
	},

	draw: function (ctx, app, t) {
		// Rebuild the hit list at the start of every draw so it always
		// matches what is on screen (DESIGN.md 9.7). Never touch the
		// pressed state here: it is managed by pointer() between the
		// finger-down and its finger-up.
		const hits = makeHits();
		this.hits = hits;
		const listings = app.state.shop.listings;
		const L = LAYOUT.list;

		// 1) The old telly: darkgrey bezel, blue screen, two knobs, scanlines.
		panel(ctx, BEZEL.x, BEZEL.y, BEZEL.w, BEZEL.h, { fill: PALETTE.darkgrey });
		panel(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, { fill: PALETTE.blue, shadow: false });
		for (let i = 0; i < KNOBS.length; i++) {
			drawKnob(ctx, KNOBS[i].x, KNOBS[i].y);
		}
		ctx.fillStyle = rgba('#000000', 0.06);
		for (let y = SCREEN.y; y < SCREEN.y + SCREEN.h; y += 6) {
			ctx.fillRect(SCREEN.x, y, SCREEN.w, 1);
		}

		// 2) Title.
		label(ctx, 'WEBB TV SHOPPING', 40, 60, {
			size: 24,
			color: PALETTE.yellow,
			font: 'title',
			shadow: true,
		});

		const listing = this.selected < listings.length ? listings[this.selected] : null;

		// 3) The scrolling list of listings, clipped to the list area.
		ctx.save();
		ctx.beginPath();
		ctx.rect(L.x, L.y, L.w, L.h);
		ctx.clip();
		const range = this.scroll.visibleRange();
		for (let i = range.first; i <= range.last; i++) {
			const shown = listings[i];
			if (!shown) continue;
			const y = L.y + i * LAYOUT.rowH - this.scroll.offset;
			drawRow(ctx, shown, y, i === this.selected, t);
		}
		ctx.restore();

		if (listings.length === 0) {
			label(ctx, 'Nothing on the telly. Try again next week.', app.w / 2, 360, {
				size: 30,
				align: 'center',
			});
		} else if (listing) {
			// 4) Detail panel for the selected listing.
			drawDetail(ctx, listing, t);
		}

		// 5) Buttons. BUY and RENT light up only when the selected listing
		// matches their mode and the money and garage slots allow it; W59b
		// wires the actual buying.
		const canAfford = listing ? app.state.cash >= listing.price : false;
		const hasRoom = app.state.cars.length < app.state.garageSlots;
		const buyOk = !!listing && listing.mode === 'sale' && canAfford && hasRoom;
		const rentOk = !!listing && listing.mode === 'rent' && canAfford && hasRoom;
		button(ctx, {
			x: LAYOUT.buy.x, y: LAYOUT.buy.y, w: LAYOUT.buy.w, h: LAYOUT.buy.h,
			label: 'BUY', kind: 'primary', enabled: buyOk,
		});
		button(ctx, {
			x: LAYOUT.rent.x, y: LAYOUT.rent.y, w: LAYOUT.rent.w, h: LAYOUT.rent.h,
			label: 'RENT', enabled: rentOk,
		});
		button(ctx, {
			x: LAYOUT.back.x, y: LAYOUT.back.y, w: LAYOUT.back.w, h: LAYOUT.back.h,
			label: 'BACK', enabled: true,
		});

		// Hit entries: rows, BUY, RENT, BACK. The handlers do nothing yet;
		// card W59b fills them in.
		for (let i = range.first; i <= range.last; i++) {
			if (!listings[i]) continue;
			const y = L.y + i * LAYOUT.rowH - this.scroll.offset;
			hits.add('row' + i, L.x, y, L.w, LAYOUT.rowH, function () {});
		}
		hits.add('buy', LAYOUT.buy.x, LAYOUT.buy.y, LAYOUT.buy.w, LAYOUT.buy.h, function () {}, { enabled: buyOk });
		hits.add('rent', LAYOUT.rent.x, LAYOUT.rent.y, LAYOUT.rent.w, LAYOUT.rent.h, function () {}, { enabled: rentOk });
		hits.add('back', LAYOUT.back.x, LAYOUT.back.y, LAYOUT.back.w, LAYOUT.back.h, function () {});
	},

	// No tapping or keyboard yet: card W59b fills these in.
	pointer: function (app, type, x, y) {},

	key: function (app, key) {},
};
