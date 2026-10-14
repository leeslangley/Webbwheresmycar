// Optional retro CRT overlay (DESIGN.md section 3): scanlines, a soft
// vignette and a faint flicker, drawn over the finished frame. Pure: no DOM,
// no Date, no Math.random. Draws via the passed-in ctx so it runs in tests
// with tests/fakectx.js. Not wired into the draw loop here (a later card does
// that when settings.crt is on).

import { rgba } from '../ui/theme.js';

// Draw the overlay over a w x h frame. t is the time in seconds; it only
// drives the flicker alpha.
export function drawCrt(ctx, w, h, t) {
	ctx.save();

	// (1) Scanlines: a 1px dark line on every 3rd pixel row.
	ctx.fillStyle = rgba('#000000', 0.18);
	for (let y = 0; y < h; y += 3) {
		ctx.fillRect(0, y, w, 1);
	}

	// (2) Vignette: clear in the middle, darker toward the corners. The
	// gradient reaches the corners at its outer radius.
	const cx = w / 2;
	const cy = h / 2;
	const reach = Math.sqrt(cx * cx + cy * cy);
	const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
	grad.addColorStop(0.55, rgba('#000000', 0));
	grad.addColorStop(1, rgba('#000000', 0.45));
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);

	// (3) Flicker: a faint white wash whose alpha moves with t.
	ctx.fillStyle = rgba('#ffffff', 0.012 + 0.008 * Math.sin(t * 53));
	ctx.fillRect(0, 0, w, h);

	ctx.restore();
}
