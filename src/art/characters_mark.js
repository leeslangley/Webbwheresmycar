// Mark Webb's head (DESIGN.md 7.3): an affectionate cartoon caricature with
// big tousled wavy light-brown hair, round dark-rimmed glasses, light
// stubble, wide surprised eyes and a lopsided half-smile.
// All coordinates are LOCAL units: the origin (0,0) is the seat position at
// the bottom centre, negative y is UP, and the head is drawn around (0,-132).
// The caller does the ctx.translate/ctx.scale; this function does neither.
// Pure: draws only via the passed-in ctx, so it runs in tests with
// tests/fakectx.js.

import { blink, circle } from './common.js';

// drawMarkHead(ctx, t, mood): draw the head at local coordinates. t is the
// time in seconds (drives the wandering pupils and the blink); mood is
// 'normal' (default), 'happy' or 'worried' and changes brows and mouth.
export function drawMarkHead(ctx, t, mood = 'normal') {
	ctx.save();

	// Neck.
	ctx.fillStyle = '#e2b88f';
	ctx.fillRect(-9, -108, 18, 16);

	// Ears.
	ctx.fillStyle = '#f1c9a5';
	ctx.beginPath();
	ctx.ellipse(-26, -130, 5, 8, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(26, -130, 5, 8, 0, 0, Math.PI * 2);
	ctx.fill();

	// Face.
	ctx.beginPath();
	ctx.ellipse(0, -132, 26, 31, 0, 0, Math.PI * 2);
	ctx.fill();

	// Light stubble across the jaw.
	ctx.fillStyle = 'rgba(60,40,30,0.35)';
	for (let i = 0; i < 14; i++) {
		circle(ctx, -16 + i * 2.4, -104 + Math.abs(Math.sin(i * 1.7)) * 5, 0.8);
		ctx.fill();
	}

	// Big tousled hair.
	ctx.fillStyle = '#8a6a46';
	const tufts = [
		[-24, -150, 10], [-14, -160, 11], [0, -165, 12], [14, -160, 11],
		[24, -150, 10], [-28, -138, 8], [28, -138, 8], [-8, -170, 8],
		[10, -171, 8], [-2, -152, 9],
	];
	for (let i = 0; i < tufts.length; i++) {
		circle(ctx, tufts[i][0], tufts[i][1], tufts[i][2]);
		ctx.fill();
	}

	// Darker strand arcs through the hair.
	ctx.strokeStyle = '#5a3b24';
	ctx.lineWidth = 2;
	const strands = [
		[-18, -158, 6], [-6, -166, 7], [8, -166, 6],
		[18, -156, 6], [-26, -146, 5], [26, -146, 5],
	];
	for (let i = 0; i < strands.length; i++) {
		ctx.beginPath();
		ctx.arc(strands[i][0], strands[i][1], strands[i][2], 3.6, 5.4);
		ctx.stroke();
	}

	// Eyes: wide and surprised, pupils wandering with t, blinking every 4 s.
	const eyes = [-11, 11];
	if (blink(t, 4)) {
		// Shut: a short horizontal line per eye, no white or pupil.
		ctx.strokeStyle = '#1a1a22';
		ctx.lineWidth = 2;
		for (let i = 0; i < eyes.length; i++) {
			ctx.beginPath();
			ctx.moveTo(eyes[i] - 4, -132);
			ctx.lineTo(eyes[i] + 4, -132);
			ctx.stroke();
		}
	} else {
		const dx = Math.sin(t * 0.7) * 1.5;
		for (let i = 0; i < eyes.length; i++) {
			ctx.fillStyle = '#ffffff';
			circle(ctx, eyes[i], -132, 4.2);
			ctx.fill();
			ctx.fillStyle = '#1a1a22';
			circle(ctx, eyes[i] + dx, -132, 2);
			ctx.fill();
		}
	}

	// Round dark-rimmed glasses: rims, bridge, arms and lens glints.
	ctx.strokeStyle = '#1a1a22';
	ctx.lineWidth = 2.6;
	for (let i = 0; i < eyes.length; i++) {
		circle(ctx, eyes[i], -132, 9.5);
		ctx.stroke();
	}
	ctx.beginPath();
	ctx.moveTo(-1.5, -133);
	ctx.lineTo(1.5, -133);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(-20.5, -132);
	ctx.lineTo(-26, -131);
	ctx.moveTo(20.5, -132);
	ctx.lineTo(26, -131);
	ctx.stroke();
	ctx.strokeStyle = 'rgba(255,255,255,0.7)';
	ctx.lineWidth = 1.2;
	for (let i = 0; i < eyes.length; i++) {
		ctx.beginPath();
		ctx.arc(eyes[i], -132, 6, 3.6, 4.4);
		ctx.stroke();
	}

	// Eyebrows.
	ctx.strokeStyle = '#5a3b24';
	ctx.lineWidth = 2.2;
	ctx.beginPath();
	if (mood === 'worried') {
		// Inner ends raised.
		ctx.moveTo(-19, -143);
		ctx.lineTo(-4, -149);
		ctx.moveTo(19, -143);
		ctx.lineTo(4, -149);
	} else if (mood === 'happy') {
		// Low gentle arcs.
		ctx.moveTo(-19, -143);
		ctx.quadraticCurveTo(-11, -146, -3, -143);
		ctx.moveTo(19, -143);
		ctx.quadraticCurveTo(11, -146, 3, -143);
	} else {
		// Arched and raised.
		ctx.moveTo(-19, -146);
		ctx.quadraticCurveTo(-11, -152, -3, -146);
		ctx.moveTo(19, -146);
		ctx.quadraticCurveTo(11, -152, 3, -146);
	}
	ctx.stroke();

	// Nose.
	ctx.strokeStyle = '#c9996f';
	ctx.lineWidth = 1.6;
	ctx.beginPath();
	ctx.moveTo(0, -130);
	ctx.lineTo(2, -122);
	ctx.lineTo(-1, -121);
	ctx.stroke();

	// Mouth.
	ctx.strokeStyle = '#8a3b2b';
	ctx.lineWidth = 2;
	ctx.beginPath();
	if (mood === 'happy') {
		// Wide open smile: fill the lower lens shape white (the teeth),
		// then stroke the grin on top.
		ctx.moveTo(-11, -112);
		ctx.quadraticCurveTo(0, -100, 11, -112);
		ctx.closePath();
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(-11, -112);
		ctx.quadraticCurveTo(0, -100, 11, -112);
	} else if (mood === 'worried') {
		// Small flat line.
		ctx.moveTo(-6, -110);
		ctx.lineTo(6, -111);
	} else {
		// Lopsided half-smile.
		ctx.moveTo(-8, -111);
		ctx.quadraticCurveTo(2, -106, 9, -114);
	}
	ctx.stroke();

	ctx.restore();
}
