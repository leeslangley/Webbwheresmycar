// The HUD strip along the top of the office screen (DESIGN.md sections
// 4.11 and 5): cash, reputation, buzz, the date and the four Gold Number
// Plates. Pure: no DOM, no Date. Draws via the passed-in ctx so it runs in
// tests with tests/fakectx.js.

import { PALETTE, font, shade } from '../ui/theme.js';
import { money, dateText } from '../core/format.js';

// The four Gold Number Plate icons, in PLATE_KEYS order (fatcat, stable,
// household, hammer). The office scene adds tap hints from these.
export const PLATE_RECTS = [
	{ key: 'fatcat', x: 1000, y: 14, w: 56, h: 28 },
	{ key: 'stable', x: 1066, y: 14, w: 56, h: 28 },
	{ key: 'household', x: 1132, y: 14, w: 56, h: 28 },
	{ key: 'hammer', x: 1198, y: 14, w: 56, h: 28 },
];

// The two-letter code painted on each plate.
const PLATE_CODES = {
	fatcat: 'FC',
	stable: 'SB',
	household: 'HN',
	hammer: 'HT',
};

// Date portion of the strip: '1 JANUARY', or 'YEAR END' once day 366 is
// reached (dateText only accepts 1..365).
function dateUpper(day) {
	if (typeof day !== 'number' || day % 1 !== 0 || day < 1 || day > 365) {
		return 'YEAR END';
	}
	return dateText(day).toUpperCase();
}

// drawHud(ctx, state, t): paint the 1280x56 strip at the top of the screen.
export function drawHud(ctx, state, t) {
	ctx.save();

	// Background: ink with a lighter bottom line.
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(0, 0, 1280, 56);
	ctx.fillStyle = shade(PALETTE.ink, 0.25);
	ctx.fillRect(0, 55, 1280, 1);

	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';

	// Cash panel.
	ctx.fillStyle = shade(PALETTE.ink, 0.12);
	ctx.fillRect(16, 8, 200, 40);
	ctx.font = font('title', 18);
	ctx.fillStyle = state.cash >= 0 ? PALETTE.good : PALETTE.bad;
	ctx.fillText(money(state.cash), 28, 28);

	// Reputation: label above a 100-wide bar.
	ctx.font = font('title', 12);
	ctx.fillStyle = PALETTE.white;
	ctx.fillText('REP ' + Math.round(state.reputation), 250, 22);
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(250, 34, 100, 6);
	ctx.fillStyle = PALETTE.good;
	ctx.fillRect(250, 34, Math.max(0, Math.min(100, state.reputation)), 6);

	// Buzz: rounded integer above a 100-wide bar.
	ctx.fillStyle = PALETTE.white;
	ctx.fillText('BUZZ ' + Math.round(state.buzz), 480, 22);
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(480, 34, 100, 6);
	ctx.fillStyle = PALETTE.orange;
	ctx.fillRect(480, 34, Math.max(0, Math.min(100, Math.round(state.buzz))), 6);

	// Date.
	ctx.font = font('title', 12);
	ctx.fillStyle = PALETTE.white;
	ctx.fillText('DAY ' + state.day + '  ' + dateUpper(state.day), 720, 28);

	// The four Gold Number Plates: gold when won, grey when not.
	for (let i = 0; i < PLATE_RECTS.length; i++) {
		const r = PLATE_RECTS[i];
		const won = state.plates !== null && state.plates !== undefined && state.plates[r.key] === true;
		ctx.fillStyle = won ? PALETTE.gold : PALETTE.midgrey;
		ctx.fillRect(r.x, r.y, r.w, r.h);
		ctx.strokeStyle = shade(won ? PALETTE.gold : PALETTE.midgrey, -0.4);
		ctx.lineWidth = 2;
		ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
		ctx.font = font('title', 10);
		ctx.textAlign = 'center';
		ctx.fillStyle = won ? PALETTE.ink : PALETTE.darkgrey;
		ctx.fillText(PLATE_CODES[r.key], r.x + r.w / 2, r.y + r.h / 2);
		ctx.textAlign = 'left';
	}

	ctx.restore();
}
