// Dave "Spanner" Dobbs, Mark's sidekick (DESIGN.md 5, 7.3): a stocky
// mechanic in blue overalls leaning on the garage door with a mug of tea.
// Pure canvas drawing via the passed-in ctx only, so it runs in jsc tests
// with tests/fakectx.js. No DOM, no Date.

import { blink } from './common.js';

// drawDave(ctx, x, y, s, t): x, y is the bottom centre of the figure,
// s scales the whole figure (about 210 local units tall), t is time in
// seconds. Lean of about 6 degrees against the door frame; rotate after
// scale so the lean stays 6 degrees at any size.
export function drawDave(ctx, x, y, s, t) {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(s, s);
	ctx.rotate(0.105);

	const bob = Math.sin(t * 1.1) * 1.2;

	// Legs and boots.
	ctx.fillStyle = '#2f5d9e';
	ctx.fillRect(-26, -70, 22, 70);
	ctx.fillRect(4, -70, 22, 70);
	ctx.fillStyle = '#222222';
	ctx.fillRect(-30, -8, 28, 8);
	ctx.fillRect(2, -8, 28, 8);

	// Torso (overalls) with bib, straps and shirt sleeves.
	ctx.fillStyle = '#2f5d9e';
	ctx.beginPath();
	ctx.moveTo(-36, -72);
	ctx.lineTo(36, -72);
	ctx.lineTo(32, -140 + bob);
	ctx.lineTo(-32, -140 + bob);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = '#3a6fb5';
	ctx.fillRect(-18, -130 + bob, 36, 40);
	ctx.strokeStyle = '#2f5d9e';
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.moveTo(-18, -130 + bob);
	ctx.lineTo(-24, -146 + bob);
	ctx.moveTo(18, -130 + bob);
	ctx.lineTo(24, -146 + bob);
	ctx.stroke();
	ctx.fillStyle = '#d9d2c0';
	ctx.fillRect(-46, -140 + bob, 12, 36);
	ctx.fillRect(34, -140 + bob, 12, 36);
	ctx.fillStyle = 'rgba(20,20,20,0.45)';
	ctx.beginPath();
	ctx.ellipse(-8, -100 + bob, 7, 4, 0, 0, Math.PI * 2);
	ctx.fill();

	// Head: face, flat cap with peak, moustache, eyes, nose.
	ctx.fillStyle = '#e8bf98';
	ctx.beginPath();
	ctx.ellipse(0, -168 + bob, 24, 27, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#444444';
	ctx.beginPath();
	ctx.ellipse(0, -172 + bob, 26, 16, 0, Math.PI, Math.PI * 2);
	ctx.fill();
	ctx.fillRect(-4, -176 + bob, 34, 6);
	ctx.fillStyle = '#5a3b24';
	ctx.beginPath();
	ctx.ellipse(-9, -158 + bob, 11, 5, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(9, -158 + bob, 11, 5, 0, 0, Math.PI * 2);
	ctx.fill();
	if (blink(t, 3.3)) {
		// Eyes shut: two short lines.
		ctx.strokeStyle = '#222222';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(-12, -170 + bob);
		ctx.lineTo(-6, -170 + bob);
		ctx.moveTo(6, -170 + bob);
		ctx.lineTo(12, -170 + bob);
		ctx.stroke();
	} else {
		ctx.fillStyle = '#222222';
		ctx.beginPath();
		ctx.arc(-9, -170 + bob, 2.2, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(9, -170 + bob, 2.2, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.fillStyle = '#d8a67e';
	ctx.beginPath();
	ctx.ellipse(0, -164 + bob, 4, 5, 0, 0, Math.PI * 2);
	ctx.fill();

	// Right hand holding a mug of tea, with three steam wisps.
	ctx.fillStyle = '#e8bf98';
	ctx.beginPath();
	ctx.ellipse(50, -110 + bob, 8, 7, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#e8e0cc';
	ctx.fillRect(46, -134 + bob, 16, 20);
	ctx.strokeStyle = '#e8e0cc';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(62, -124 + bob, 6, -Math.PI / 2, Math.PI / 2);
	ctx.stroke();
	ctx.lineWidth = 2;
	for (let i = 0; i < 3; i++) {
		ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 - i * 0.12) + ')';
		ctx.beginPath();
		ctx.moveTo(54 + i * 5 + Math.sin(t * 2 + i) * 3, -138 + bob);
		ctx.lineTo(54 + i * 5 + Math.sin(t * 2 + i + 1.7) * 3, -148 + bob);
		ctx.lineTo(54 + i * 5 + Math.sin(t * 2 + i + 3.4) * 3, -158 + bob);
		ctx.stroke();
	}

	ctx.restore();
}
