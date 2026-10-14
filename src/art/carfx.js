// Drawing effects that make a car sit in a room (CARS_ALIGN, CC06): a contact
// shadow, a floor reflection, a glossy shine sweep, bonnet steam for a faulty
// car and exhaust smoke for a wreck. Pure: no DOM, no Date, no Math.random.
// Everything draws via the passed-in ctx, so it runs in tests with
// tests/fakectx.js. The baked sprite shadow (CB) is drawn first when a car has
// one; drawContactShadow is the fallback.

// drawContactShadow(ctx, x, y, w, p): a two-layer dark ellipse on the ground.
// (x, y) is the ground point, w the sprite width, p the sprite pixel size.
export function drawContactShadow(ctx, x, y, w, p) {
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,0,0.22)';
	ctx.beginPath();
	ctx.ellipse(x, y, w * 0.52, p * 5, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = 'rgba(0,0,0,0.35)';
	ctx.beginPath();
	ctx.ellipse(x, y, w * 0.42, p * 3, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

// drawReflection(ctx, img, x, y, w, h): the car mirrored below its ground
// line, faint and clipped to 40% of the car height.
export function drawReflection(ctx, img, x, y, w, h) {
	ctx.save();
	ctx.imageSmoothingEnabled = false;
	ctx.globalAlpha = 0.16;
	ctx.beginPath();
	ctx.rect(x - w / 2, y, w, Math.round(h * 0.4));
	ctx.clip();
	ctx.translate(x, y);
	ctx.scale(1, -1);
	ctx.drawImage(img, -w / 2, -h, w, h);
	ctx.restore();
}

// drawShine(ctx, layer, x, y, w, h, t): a glossy band that sweeps across the
// car once every 4 seconds (the sweep takes the first 0.7 s of each cycle).
// layer is the car's highlight image. Returns true when it drew the band,
// false when the sweep is idle.
export function drawShine(ctx, layer, x, y, w, h, t) {
	const phase = (t % 4) / 0.7;
	if (phase >= 1) {
		return false;
	}
	const bw = w * 0.16;
	const bx = x - w / 2 - w * 0.2 + phase * w * 1.4;
	const skew = h * 0.5;
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(bx, y - h);
	ctx.lineTo(bx + bw, y - h);
	ctx.lineTo(bx + bw - skew, y);
	ctx.lineTo(bx - skew, y);
	ctx.closePath();
	ctx.clip();
	ctx.globalAlpha = 0.55;
	ctx.drawImage(layer, x - w / 2, y - h, w, h);
	ctx.restore();
	return true;
}

// drawSteam(ctx, x, y, t, p): five white puffs rising from the bonnet of a
// faulty car. Each puff fades as it rises.
export function drawSteam(ctx, x, y, t, p) {
	for (let i = 0; i < 5; i++) {
		const ph = (t * 0.8 + i / 5) % 1;
		const px = x + Math.sin((ph + i) * 5) * 3 * p;
		const py = y - ph * 30 * p;
		const s = p * (2 + ph * 3);
		ctx.fillStyle = 'rgba(235,235,235,' + ((1 - ph) * 0.5).toFixed(3) + ')';
		ctx.fillRect(Math.round(px), Math.round(py), s, s);
	}
}

// drawExhaust(ctx, x, y, t, p, dir): four dark grey puffs drifting out of the
// tailpipe of a wreck. dir is -1 for a car facing right (smoke trails left)
// and +1 when the car is flipped.
export function drawExhaust(ctx, x, y, t, p, dir) {
	for (let i = 0; i < 4; i++) {
		const ph = (t * 0.8 + i / 5) % 1;
		const px = x + dir * ph * 26 * p;
		const py = y - ph * 8 * p;
		const s = p * (2 + ph * 3);
		const a = ((1 - ph) * 0.6).toFixed(3);
		ctx.fillStyle = 'rgba(40,40,44,' + a + ')';
		ctx.fillRect(Math.round(px), Math.round(py), s, s);
	}
}
