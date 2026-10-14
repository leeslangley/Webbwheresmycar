// Fixed stage tableaux the car stands in: a back wall, a floor band and a
// light, drawn inside a rect (like the fixed stage sets of the original
// game). Three kinds: showroom, garage and auction. drawStage returns where
// to stand the car. Pure: no DOM, no Math.random, no Date - all motion
// derives from t. Everything draws via the passed-in ctx, so it runs in tests
// with tests/fakectx.js.

import { PALETTE, font, rgba } from '../ui/theme.js';

const KINDS = ['showroom', 'garage', 'auction'];

// Spotlight cone from the top of the rect down to the floor, and a pool of
// light on the floor under the car.
function spotlight(ctx, r, centerX, floorY, groundY, coneAlpha, poolAlpha) {
	ctx.beginPath();
	ctx.moveTo(centerX, r.y);
	ctx.lineTo(centerX + r.w * 0.30, floorY);
	ctx.lineTo(centerX - r.w * 0.30, floorY);
	ctx.closePath();
	ctx.fillStyle = rgba(PALETTE.lamp, coneAlpha);
	ctx.fill();

	ctx.beginPath();
	ctx.ellipse(centerX, groundY, r.w * 0.28, 9, 0, 0, Math.PI * 2);
	ctx.fillStyle = rgba(PALETTE.lamp, poolAlpha);
	ctx.fill();
}

// Wall from the top of the rect down to the floor band.
function wall(ctx, r, floorY, colour) {
	ctx.fillStyle = colour;
	ctx.fillRect(r.x, r.y, r.w, floorY - r.y);
}

// Floor band from floorY to the bottom of the rect.
function floor(ctx, r, floorY, colour) {
	ctx.fillStyle = colour;
	ctx.fillRect(r.x, floorY, r.w, r.y + r.h - floorY);
}

function drawShowroom(ctx, r, geo) {
	wall(ctx, r, geo.floorY, '#3B3470');

	// Vertical panel seams every 64 px.
	ctx.fillStyle = '#2F2A5C';
	for (let x = r.x + 64; x < r.x + r.w; x += 64) {
		ctx.fillRect(x, r.y, 2, geo.floorY - r.y);
	}

	// Dado rail, 28 px above the floor.
	ctx.fillStyle = '#6C5EB5';
	ctx.fillRect(r.x, geo.floorY - 28, r.w, 4);

	// Two-tone tiles, 48 x 12, alternating by (col + row) parity.
	floor(ctx, r, geo.floorY, '#4A4180');
	const bottom = r.y + r.h;
	let row = 0;
	for (let y = geo.floorY; y < bottom; y += 12) {
		let col = 0;
		for (let x = r.x; x < r.x + r.w; x += 48) {
			ctx.fillStyle = (col + row) % 2 === 0 ? '#4A4180' : '#5A4F8F';
			ctx.fillRect(x, y, 48, 12);
			col += 1;
		}
		row += 1;
	}

	// Shop sign on the top left of the wall.
	ctx.font = font('title', 14);
	ctx.fillStyle = PALETTE.lamp;
	ctx.fillText('WEBB WHEELS', r.x + 16, r.y + 28);

	spotlight(ctx, r, geo.centerX, geo.floorY, geo.groundY, 0.16, 0.20);
}

function drawGarage(ctx, r, geo, t) {
	wall(ctx, r, geo.floorY, '#5B5F66');

	// Corrugated lines every 6 px across the wall.
	ctx.fillStyle = '#4D5158';
	for (let y = r.y + 6; y < geo.floorY; y += 6) {
		ctx.fillRect(r.x, y, r.w, 1);
	}

	// Pegboard on the left with three tool bars hanging from it.
	ctx.fillStyle = '#7A5C3A';
	ctx.fillRect(r.x + 24, r.y + 24, 120, 80);
	ctx.fillStyle = '#C9CCD2';
	for (let i = 0; i < 3; i++) {
		ctx.fillRect(r.x + 44 + i * 28, r.y + 36, 4, 40);
	}

	floor(ctx, r, geo.floorY, '#3A3D42');

	// Oil stain under the car.
	ctx.fillStyle = '#26282C';
	ctx.beginPath();
	ctx.ellipse(geo.centerX, geo.groundY, r.w * 0.18, 6, 0, 0, Math.PI * 2);
	ctx.fill();

	// Cool cone from the strip light down to the floor.
	ctx.beginPath();
	ctx.moveTo(geo.centerX - 60, r.y + 16);
	ctx.lineTo(geo.centerX + 60, r.y + 16);
	ctx.lineTo(geo.centerX + r.w * 0.20, geo.floorY);
	ctx.lineTo(geo.centerX - r.w * 0.20, geo.floorY);
	ctx.closePath();
	ctx.fillStyle = rgba('#C8E1FF', 0.12);
	ctx.fill();

	// Strip light bar. It dims to alpha 0.55 on the flicker frames.
	const flicker = Math.sin(t * 31) > 0.92;
	ctx.globalAlpha = flicker ? 0.55 : 1;
	ctx.fillStyle = '#E8F0FF';
	ctx.fillRect(geo.centerX - 60, r.y + 10, 120, 6);
}

function drawAuction(ctx, r, geo) {
	wall(ctx, r, geo.floorY, '#2E2433');

	// Curtains, 90 px wide, at each side, with fold stripes every 14 px.
	const curtain = function (x0) {
		ctx.fillStyle = '#8A1C2B';
		ctx.fillRect(x0, r.y, 90, geo.floorY - r.y);
		ctx.fillStyle = '#6E1422';
		for (let dx = 14; dx < 90; dx += 14) {
			ctx.fillRect(x0 + dx, r.y + 24, 3, geo.floorY - r.y - 24);
		}
	};
	curtain(r.x);
	curtain(r.x + r.w - 90);

	// Valance across the top.
	ctx.fillStyle = '#6E1422';
	ctx.fillRect(r.x, r.y, r.w, 24);

	// Plank floor with a seam every 12 px.
	floor(ctx, r, geo.floorY, '#433900');
	ctx.fillStyle = '#2B2400';
	for (let y = geo.floorY + 12; y < r.y + r.h; y += 12) {
		ctx.fillRect(r.x, y, r.w, 3);
	}

	spotlight(ctx, r, geo.centerX, geo.floorY, geo.groundY, 0.24, 0.24);
}

// drawStage(ctx, r, kind, t) -> {groundY, centerX, floorY}. Draws the stage
// for kind inside rect r. groundY is the car's tyres, floorY the top of the
// floor band, centerX the middle of r. Throws on an unknown kind.
export function drawStage(ctx, r, kind, t) {
	if (KINDS.indexOf(kind) < 0) {
		throw new Error('unknown stage ' + kind);
	}
	const geo = {
		centerX: r.x + r.w / 2,
		floorY: r.y + Math.round(r.h * 0.78),
		groundY: r.y + Math.round(r.h * 0.86),
	};

	ctx.save();
	ctx.beginPath();
	ctx.rect(r.x, r.y, r.w, r.h);
	ctx.clip();
	if (kind === 'showroom') {
		drawShowroom(ctx, r, geo);
	} else if (kind === 'garage') {
		drawGarage(ctx, r, geo, t);
	} else {
		drawAuction(ctx, r, geo);
	}
	ctx.restore();

	// The 4 px ink frame, inset so it sits inside r. Its own save/restore
	// keeps the caller's line state untouched.
	ctx.save();
	ctx.lineWidth = 4;
	ctx.strokeStyle = PALETTE.ink;
	ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
	ctx.restore();

	return geo;
}
