// The office hub scene (DESIGN.md sections 5, 9.5, 9.7): the main screen,
// Mark Webb's office. Every prop is a tap target that opens a part of the
// game, the kettle waits a day, and Dave leans on the garage door with one
// line of chatter per day. Pure UI: no DOM, no Math.random, no Date; all
// randomness goes through the chatter copy trick so the game's own RNG is
// never touched.

import { PALETTE, font } from '../theme.js';
import { makeHits } from '../kit_hits.js';
import { drawOfficeStatic } from '../../art/office.js';
import {
	drawTvStatic, drawPhone, drawLaptop, drawNewspaper, drawKettle, drawHotspotGlow,
} from '../../art/props.js';
import { drawWallCalendar } from '../../art/calendar.js';
import { drawMark, drawDave, speechBubble } from '../../art/characters.js';
import { blink } from '../../art/common.js';
import { drawHud, PLATE_RECTS } from '../../art/hud.js';
import { OFFICE } from '../../art/officelayout.js';
import { chatterFor } from '../../data/chatter.js';
import { waitDay } from '../../sim/actions.js';
import { PLATE_INFO } from '../../sim/endgame.js';
import { isAuctionDay, isMonthStart } from '../../core/clock.js';
import { dateText } from '../../core/format.js';

// The office situation Dave comments on: the first tag that applies.
function daveSit(state) {
	if (state.cash < 1000) {
		return 'broke';
	}
	if (state.cash > 50000) {
		return 'rich';
	}
	const events = state.today && state.today.events ? state.today.events : [];
	const last = events.length > 0 ? events[events.length - 1] : null;
	if (typeof last === 'string' && last.indexOf('broke down') !== -1) {
		return 'breakdown';
	}
	if (isMonthStart(state.day)) {
		return 'newmonth';
	}
	if (isAuctionDay(state.day)) {
		return 'auctionday';
	}
	let owned = 0;
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].owned === true) {
			owned += 1;
		}
	}
	if (owned >= state.garageSlots) {
		return 'fullgarage';
	}
	if (owned === 0) {
		return 'emptygarage';
	}
	return 'idle';
}

// Dave's line for the day, picked with a throwaway rng so the game's own
// state.rng (and therefore the whole run) stays deterministic.
function daveLine(state) {
	const sit = daveSit(state);
	return chatterFor({ rng: state.day * 7919 + 13 }, sit);
}

// Owned cars: rented cars sit in the stable but are not ours.
function ownedCount(state) {
	let n = 0;
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].owned === true) {
			n += 1;
		}
	}
	return n;
}

export const officeScene = {
	id: 'office',

	// Cached chatter: {day, line}. Recomputed only when the day changes,
	// so every draw on one day shows Dave saying the same thing.
	dayLine: { day: 0, line: '' },

	// Hit list, rebuilt at the start of every draw so it always matches
	// what is on screen.
	hits: null,

	enter: function () {},

	// Which hit (if any) is currently pressed, for tap = same hit on
	// down and up.
	_pressed: null,

	draw: function (ctx, app, t) {
		const state = app.state;

		// Hit list first: every tap below must match what this draw shows.
		const hits = makeHits();
		const day = state.day;
		hits.add('tv', OFFICE.tv.x, OFFICE.tv.y, OFFICE.tv.w, OFFICE.tv.h, function () {
			app.push('tvshop');
		});
		hits.add('phone', OFFICE.phone.x, OFFICE.phone.y, OFFICE.phone.w, OFFICE.phone.h, function () {
			app.push('bookings');
		});
		hits.add('garageDoor', OFFICE.garageDoor.x, OFFICE.garageDoor.y, OFFICE.garageDoor.w, OFFICE.garageDoor.h, function () {
			app.push('garage');
		});
		hits.add('laptop', OFFICE.laptop.x, OFFICE.laptop.y, OFFICE.laptop.w, OFFICE.laptop.h, function () {
			app.push('adverts');
		});
		hits.add('newspaper', OFFICE.newspaper.x, OFFICE.newspaper.y, OFFICE.newspaper.w, OFFICE.newspaper.h, function () {
			app.push('news', { readOnly: true });
		});
		hits.add('ledger', OFFICE.ledger.x, OFFICE.ledger.y, OFFICE.ledger.w, OFFICE.ledger.h, function () {
			app.push('ledger');
		});
		hits.add('workshop', OFFICE.workshop.x, OFFICE.workshop.y, OFFICE.workshop.w, OFFICE.workshop.h, function () {
			app.push('ledger', { tab: 'workshop' });
		});
		hits.add('kettle', OFFICE.kettle.x, OFFICE.kettle.y, OFFICE.kettle.w, OFFICE.kettle.h, function () {
			app.act(function () { return waitDay(app.state); });
		});
		hits.add('calendar', OFFICE.calendar.x, OFFICE.calendar.y, OFFICE.calendar.w, OFFICE.calendar.h, function () {
			app.toast(dateText(day) + ' - ' + (365 - day) + ' days left');
		});
		hits.add('poster', OFFICE.poster.x, OFFICE.poster.y, OFFICE.poster.w, OFFICE.poster.h, function () {
			if (isAuctionDay(day)) {
				app.push('auction');
			} else {
				app.toast('Auction day is the 24th of every month');
			}
		});
		for (let i = 0; i < PLATE_RECTS.length; i++) {
			const r = PLATE_RECTS[i];
			hits.add(r.key, r.x, r.y, r.w, r.h, function () {
				app.toast(PLATE_INFO[r.key].name + ': ' + PLATE_INFO[r.key].text);
			});
		}
		this.hits = hits;

		// The fixed room, back to front.
		drawOfficeStatic(ctx, t);

		// The TV: static, then the station caption and the shop hint.
		drawTvStatic(ctx, OFFICE.tvScreen, t);
		const screen = OFFICE.tvScreen;
		const cx = screen.x + screen.w / 2;
		if (!blink(t, 2, 0.4)) {
			ctx.font = font('title', 16);
			ctx.fillStyle = PALETTE.lightgreen;
			ctx.textAlign = 'center';
			ctx.fillText('WEBB TV', cx, screen.y + 70);
			ctx.textAlign = 'left';
		}
		ctx.font = font('body', 28);
		ctx.fillStyle = PALETTE.white;
		ctx.textAlign = 'center';
		ctx.fillText('Tap me to shop!', cx, screen.y + 130);
		ctx.textAlign = 'left';

		// Wall calendar; the cross-out scribble runs for 700ms after a day
		// passes (no dayChangedAt means no animation in progress).
		const anim = app.dayChangedAt === undefined
			? 1
			: Math.max(0, Math.min(1, (app.now() - app.dayChangedAt) / 700));
		drawWallCalendar(ctx, OFFICE.calendar, day, t, anim);

		// Desk props.
		drawPhone(ctx, OFFICE.phone, t, state.requests.length > 0);
		drawLaptop(ctx, OFFICE.laptop, t);
		drawNewspaper(ctx, OFFICE.newspaper, t);
		drawKettle(ctx, OFFICE.kettle, t);

		// The pair. Mark's mood follows the cash; Dave leans on the door.
		const mood = state.cash > 30000 ? 'happy' : (state.cash < 1500 ? 'worried' : 'normal');
		drawMark(ctx, OFFICE.mark.x + 60, OFFICE.mark.y + OFFICE.mark.h, 1, t, mood);
		drawDave(ctx, OFFICE.dave.x + 48, OFFICE.dave.y + OFFICE.dave.h, 1, t);

		// Dave's one line per day, cached across draws.
		if (this.dayLine.day !== day) {
			this.dayLine = { day: day, line: daveLine(state) };
		}
		speechBubble(ctx, OFFICE.bubble, this.dayLine.line, t);

		// Hotspot hints: things that want tapping today.
		if (state.requests.length > 0) {
			drawHotspotGlow(ctx, OFFICE.phone, t);
		}
		if (isAuctionDay(day)) {
			drawHotspotGlow(ctx, OFFICE.poster, t);
		}
		if (ownedCount(state) === 0) {
			drawHotspotGlow(ctx, OFFICE.tv, t);
		}

		// The HUD strip goes last, on top of everything.
		drawHud(ctx, state, t);
	},

	pointer: function (app, type, x, y) {
		if (this.hits === null) {
			return;
		}
		if (type === 'down') {
			this._pressed = this.hits.hit(x, y);
			return;
		}
		if (type === 'up') {
			const e = this.hits.hit(x, y);
			const pressed = this._pressed;
			this._pressed = null;
			if (e && e === pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
		}
	},

	key: function (app, k) {
		const state = app.state;
		if (k === 't') {
			app.push('tvshop');
		} else if (k === 'p') {
			app.push('bookings');
		} else if (k === 'g') {
			app.push('garage');
		} else if (k === 'l') {
			app.push('adverts');
		} else if (k === 'n') {
			app.push('news', { readOnly: true });
		} else if (k === 'k') {
			app.act(function () { return waitDay(state); });
		} else if (k === 'a' && isAuctionDay(state.day)) {
			app.push('auction');
		}
	},
};

// Hotspot rectangles for the tests: the same rects the scene taps use.
export const LAYOUT = {
	hits: {
		tv: OFFICE.tv,
		phone: OFFICE.phone,
		garageDoor: OFFICE.garageDoor,
		laptop: OFFICE.laptop,
		newspaper: OFFICE.newspaper,
		ledger: OFFICE.ledger,
		workshop: OFFICE.workshop,
		kettle: OFFICE.kettle,
		calendar: OFFICE.calendar,
		poster: OFFICE.poster,
		fatcat: PLATE_RECTS[0],
		stable: PLATE_RECTS[1],
		household: PLATE_RECTS[2],
		hammer: PLATE_RECTS[3],
	},
};

