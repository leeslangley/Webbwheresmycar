// The static painted office room (DESIGN.md sections 5, 7.2): wall and
// wallpaper, skirting, floor boards, window with drifting sun, auction
// poster, ledger cabinet, garage door, desk, rug, TV set on its stand,
// workshop board, kettle table and a warm lamp glow. Animated props (TV
// screen content, characters, calendar crossings) belong to later cards.
// Pure: no DOM, no Date, everything through the passed-in ctx, so it runs
// in jsc tests with tests/fakectx.js.

import { PALETTE, font, shade, rgba } from '../ui/theme.js';
import { vgrad, circle, roundedPoly } from './common.js';
import { OFFICE, FLOOR_Y, WALL_TOP } from './officelayout.js';

// Centred text helper: sets font and colour, draws one line, then puts
// textAlign back to 'left' so later painters are not surprised.
function centreText(ctx, str, cx, y, kind, px, colour) {
	ctx.font = font(kind, px);
	ctx.textAlign = 'center';
	ctx.fillStyle = colour;
	ctx.fillText(str, cx, y);
	ctx.textAlign = 'left';
}

function wall(ctx) {
	ctx.fillStyle = vgrad(ctx, WALL_TOP, FLOOR_Y,
		PALETTE.lightblue, shade(PALETTE.lightblue, -0.2));
	ctx.fillRect(0, WALL_TOP, 1280, FLOOR_Y - WALL_TOP);
	// Subtle wallpaper stripes, one every 40px, at 8% alpha.
	ctx.fillStyle = rgba(shade(PALETTE.lightblue, -0.35), 0.08);
	for (let x = 0; x < 1280; x += 40) {
		ctx.fillRect(x, WALL_TOP, 20, FLOOR_Y - WALL_TOP);
	}
}

function skirting(ctx) {
	ctx.fillStyle = PALETTE.brown;
	ctx.fillRect(0, FLOOR_Y - 14, 1280, 14);
}

function floorBoards(ctx) {
	for (let y = FLOOR_Y, i = 0; y < 720; y += 36, i++) {
		ctx.fillStyle = i % 2 ? shade(PALETTE.orange, -0.1) : PALETTE.orange;
		ctx.fillRect(0, y, 1280, Math.min(36, 720 - y));
		ctx.fillStyle = PALETTE.brown; // dark seam between boards
		ctx.fillRect(0, y, 1280, 2);
	}
}

function drawWindow(ctx, t) {
	const r = OFFICE.window;
	ctx.fillStyle = PALETTE.white; // frame
	ctx.fillRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16);
	ctx.fillStyle = vgrad(ctx, r.y, r.y + r.h, '#9fd3ff', '#e8f6ff');
	ctx.fillRect(r.x, r.y, r.w, r.h);
	// The sun drifts slowly across the sky as t moves.
	ctx.fillStyle = PALETTE.lamp;
	circle(ctx, r.x + r.w * (0.5 + 0.1 * Math.sin(t * 0.05)), r.y + r.h * 0.32, 14);
	ctx.fill();
	ctx.fillStyle = PALETTE.white; // cross bars
	ctx.fillRect(r.x + r.w / 2 - 3, r.y, 6, r.h);
	ctx.fillRect(r.x, r.y + r.h / 2 - 3, r.w, 6);
	ctx.fillStyle = shade(PALETTE.white, -0.15); // sill
	ctx.fillRect(r.x - 12, r.y + r.h + 8, r.w + 24, 10);
}

function poster(ctx) {
	const r = OFFICE.poster;
	ctx.fillStyle = PALETTE.brown; // frame
	ctx.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
	ctx.fillStyle = PALETTE.cream; // paper
	ctx.fillRect(r.x, r.y, r.w, r.h);
	const cx = r.x + r.w / 2;
	centreText(ctx, 'CLASSIC CAR', cx, r.y + 36, 'title', 9, PALETTE.ink);
	centreText(ctx, 'AUCTION', cx, r.y + 72, 'title', 14, PALETTE.bad);
	centreText(ctx, '24th of every month', cx, r.y + 112, 'body', 14, PALETTE.ink);
}

function cabinet(ctx) {
	const r = OFFICE.ledger;
	ctx.fillStyle = PALETTE.darkgrey; // body
	ctx.fillRect(r.x, r.y, r.w, r.h);
	ctx.fillStyle = PALETTE.cream; // label plate
	ctx.fillRect(r.x + 15, r.y + 6, 60, 18);
	centreText(ctx, 'LEDGER', r.x + r.w / 2, r.y + 20, 'title', 8, PALETTE.ink);
	for (let i = 0; i < 3; i++) {
		const dy = r.y + 34 + i * 62;
		ctx.fillStyle = PALETTE.midgrey; // drawer front
		ctx.fillRect(r.x + 6, dy, r.w - 12, 58);
		ctx.fillStyle = PALETTE.lightgrey; // handle
		ctx.fillRect(r.x + r.w / 2 - 14, dy + 26, 28, 6);
	}
}

function garageDoor(ctx) {
	const r = OFFICE.garageDoor;
	// Small sign above the door.
	ctx.fillStyle = PALETTE.brown;
	ctx.fillRect(r.x + 15, r.y - 26, r.w - 30, 22);
	centreText(ctx, 'GARAGE', r.x + r.w / 2, r.y - 9, 'title', 12, PALETTE.cream);
	// Door back and side posts.
	ctx.fillStyle = shade(PALETTE.midgrey, -0.2);
	ctx.fillRect(r.x, r.y, r.w, r.h);
	ctx.fillStyle = PALETTE.lightgrey;
	ctx.fillRect(r.x, r.y, 14, r.h);
	ctx.fillRect(r.x + r.w - 14, r.y, 14, r.h);
	// Window strip along the top.
	ctx.fillStyle = '#9fd3ff';
	ctx.fillRect(r.x + 14, r.y + 14, r.w - 28, 26);
	// Five rows of horizontal panels.
	for (let i = 0; i < 5; i++) {
		ctx.fillStyle = shade(PALETTE.midgrey, 0.15);
		ctx.fillRect(r.x + 22, r.y + 54 + i * 67, r.w - 44, 61);
	}
	// Handle.
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(r.x + r.w / 2 - 8, r.y + r.h - 60, 16, 8);
}

function desk(ctx) {
	const r = OFFICE.desk;
	ctx.fillStyle = PALETTE.brown; // legs
	ctx.fillRect(r.x + 8, r.y + 14, 14, r.h - 14);
	ctx.fillRect(r.x + r.w - 22, r.y + 14, 14, r.h - 14);
	ctx.fillStyle = shade(PALETTE.brown, -0.15); // front panel
	ctx.fillRect(r.x, r.y + 14, r.w, r.h - 22);
	ctx.fillStyle = shade(PALETTE.brown, 0.35); // top plank
	ctx.fillRect(r.x - 10, r.y, r.w + 20, 16);
}

function rug(ctx) {
	roundedPoly(ctx, [[540, 600], [980, 600], [980, 690], [540, 690]], 16);
	ctx.fillStyle = PALETTE.red;
	ctx.fill();
	ctx.strokeStyle = PALETTE.cream; // cream border
	ctx.lineWidth = 6;
	ctx.stroke();
}

function tvSet(ctx) {
	const r = OFFICE.tv, s = OFFICE.tvScreen;
	ctx.fillStyle = PALETTE.brown; // stand legs
	ctx.fillRect(r.x + 40, 440, 18, 70);
	ctx.fillRect(r.x + r.w - 58, 440, 18, 70);
	ctx.fillStyle = shade(PALETTE.brown, 0.25); // cabinet under the set
	ctx.fillRect(r.x + 15, 360, r.w - 30, 84);
	ctx.fillStyle = PALETTE.darkgrey; // two knobs
	circle(ctx, r.x + 45, 402, 8);
	ctx.fill();
	circle(ctx, r.x + 75, 402, 8);
	ctx.fill();
	ctx.fillStyle = PALETTE.darkgrey; // bezel around the screen
	ctx.fillRect(r.x + 8, 118, r.w - 16, 234);
	ctx.fillStyle = '#0a0a12'; // screen only; content is a later card
	ctx.fillRect(s.x, s.y, s.w, s.h);
}

function workshopBoard(ctx) {
	const r = OFFICE.workshop;
	ctx.fillStyle = PALETTE.brown; // frame
	ctx.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
	ctx.fillStyle = shade(PALETTE.orange, 0.25); // cork
	ctx.fillRect(r.x, r.y, r.w, r.h);
	centreText(ctx, 'WORKSHOP', r.x + r.w / 2, r.y + 26, 'title', 10, PALETTE.ink);
	// Two pinned slips of paper.
	for (const sx of [r.x + 16, r.x + 104]) {
		ctx.fillStyle = PALETTE.paper;
		ctx.fillRect(sx, r.y + 46, 70, 44);
		ctx.fillStyle = PALETTE.bad; // pin
		circle(ctx, sx + 35, r.y + 56, 4);
		ctx.fill();
	}
}

function kettleTable(ctx) {
	const r = OFFICE.kettle;
	ctx.fillStyle = shade(PALETTE.brown, 0.3); // table top
	ctx.fillRect(r.x, r.y, r.w, 10);
	ctx.fillStyle = PALETTE.brown; // legs
	ctx.fillRect(r.x + 8, r.y + 10, 10, r.h - 10);
	ctx.fillRect(r.x + r.w - 18, r.y + 10, 10, r.h - 10);
	// A kettle shape sits on top (the working kettle is a later card).
	roundedPoly(ctx, [
		[r.x + 32, r.y - 34], [r.x + 86, r.y - 34],
		[r.x + 80, r.y], [r.x + 38, r.y],
	], 6);
	ctx.fillStyle = PALETTE.lightgrey;
	ctx.fill();
	ctx.fillStyle = PALETTE.darkgrey; // spout
	ctx.fillRect(r.x + 86, r.y - 28, 12, 8);
	ctx.strokeStyle = PALETTE.darkgrey; // handle
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.arc(r.x + 59, r.y - 34, 13, Math.PI, Math.PI * 2);
	ctx.stroke();
}

function lampGlow(ctx) {
	const g = ctx.createRadialGradient(765, 475, 20, 765, 475, 280);
	g.addColorStop(0, rgba(PALETTE.lamp, 0.35));
	g.addColorStop(1, rgba(PALETTE.lamp, 0));
	ctx.fillStyle = g;
	ctx.fillRect(485, 195, 560, 525);
}

// drawOfficeStatic(ctx, t = 0): paints the whole fixed room, back to front.
// t (seconds) moves the sun in the window; everything else is still.
export function drawOfficeStatic(ctx, t = 0) {
	ctx.save();
	wall(ctx);
	skirting(ctx);
	floorBoards(ctx);
	drawWindow(ctx, t);
	poster(ctx);
	cabinet(ctx);
	garageDoor(ctx);
	desk(ctx);
	rug(ctx);
	tvSet(ctx);
	workshopBoard(ctx);
	kettleTable(ctx);
	lampGlow(ctx);
	ctx.restore();
}
