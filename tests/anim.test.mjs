// Tests for src/art/anim.js, run under `jsc -m` (no console; print only).

import { test, eq, ok, near, done } from './harness.js';
import {
	clipFrame,
	clipDone,
	blinkClosed,
	visemeFor,
	mouthAt,
	talkSeconds,
	createActor
} from '../src/art/anim.js';

// Fake manifest character block: frames m_<clip>_00.. with neck [72 + i, 75].
function frameList(name, n) {
	const out = [];
	for (let i = 0; i < n; i++) {
		out.push({ id: 'm_' + name + '_0' + i, neck: [72 + i, 75], angle: 'fwd' });
	}
	return out;
}

function makeChar() {
	return {
		frame: { w: 144, h: 144 },
		head: { w: 80, h: 80, pivot: [40, 66] },
		clips: {
			idle: { view: 'front', fps: 3, loop: true, hold: 0, frames: frameList('idle', 6) },
			talk_a: { view: 'front', fps: 8, loop: true, hold: 0, frames: frameList('talk_a', 6) },
			shrug: { view: 'front', fps: 8, loop: false, hold: 0.6, frames: frameList('shrug', 5) },
			idle_back: { view: 'back', fps: 3, loop: true, hold: 0, frames: frameList('idle_back', 6) }
		},
		heads: {
			neutral: { fwd: 'h_n', down: 'h_nd' },
			blink: { fwd: 'h_b' },
			happy: { fwd: 'h_h' },
			talk_A: { fwd: 'h_a' },
			talk_O: { fwd: 'h_o' },
			talk_E: { fwd: 'h_e' },
			talk_M: { fwd: 'h_m' },
			worried: { fwd: 'h_w' }
		},
		head_back: 'h_back'
	};
}

const idleClip = makeChar().clips.idle;
const shrugClip = makeChar().clips.shrug;

test('clipFrame loops and holds', () => {
	eq(clipFrame(idleClip, 0), 0, 'idle at 0');
	eq(clipFrame(idleClip, 0.34), 1, 'idle at 0.34 s is frame 1 at 3 fps');
	eq(clipFrame(idleClip, 2.0), 0, 'idle wraps after 6 frames at 3 fps');
	eq(clipFrame(idleClip, -5), 0, 'negative time gives frame 0');
	eq(clipFrame(shrugClip, 100), 4, 'one-shot holds its last frame');
});

test('clipDone for one-shots and loops', () => {
	eq(clipDone(shrugClip, 0.5), false, 'shrug not done at 0.5 s');
	eq(clipDone(shrugClip, 5 / 8 + 0.6 + 0.01), true, 'shrug done after frames plus hold');
	eq(clipDone(idleClip, 1000), false, 'a loop is never done');
});

test('blinkClosed uses the seed period', () => {
	eq(blinkClosed(3.28, 0), true, 'seed 0 shut 0.12 s before the period ends');
	eq(blinkClosed(3.2, 0), false, 'seed 0 still open 0.2 s before the period ends');
	eq(blinkClosed(3.3, 0), true, 'seed 0 blinks at 3.3 s');
	eq(blinkClosed(3.0, 0), false, 'seed 0 open at 3.0 s');
	eq(blinkClosed(3.5, 1), false, 'seed 1 open at 3.5 s');
	eq(blinkClosed(3.6, 1), true, 'seed 1 blinks at 3.6 s');
});

test('visemeFor maps letters, case-insensitively', () => {
	eq(visemeFor('a'), 'talk_A', 'a');
	eq(visemeFor('M'), 'talk_M', 'M');
	eq(visemeFor(' '), 'neutral', 'space');
	eq(visemeFor('z'), 'talk_E', 'z');
	eq(visemeFor('f'), 'neutral', 'f');
	eq(visemeFor('7'), 'neutral', 'digit');
	eq(visemeFor('!'), 'neutral', 'punctuation');
	eq(visemeFor('O'), 'talk_O', 'O');
});

test('mouthAt follows the letters at 14 per second', () => {
	eq(mouthAt('Boss', 0), 'talk_M', 'first letter B');
	eq(mouthAt('Boss', 1 / 14 + 0.001), 'talk_O', 'second letter o');
	eq(mouthAt('Boss', 100), 'neutral', 'past the end');
	eq(mouthAt('Boss', -1), 'neutral', 'before the start');
});

test('talkSeconds is length over 14, capped at 4', () => {
	near(talkSeconds('Hello'), 5 / 14, 1e-9, 'Hello');
	eq(talkSeconds('x'.repeat(100)), 4, 'long line capped');
});

test('actor idles with a neutral face', () => {
	const actor = createActor(makeChar(), {});
	const p = actor.at(0.1);
	eq(p.clip, 'idle', 'clip');
	eq(p.bodyId, 'm_idle_00', 'body frame');
	eq(p.face, 'neutral', 'face');
	eq(p.headId, 'h_n', 'head');
});

test('actor talks: clip, mouth and head', () => {
	const actor = createActor(makeChar(), {});
	actor.talk('Hello', 1);
	const p = actor.at(1.0);
	eq(p.clip, 'talk_a', 'talk clip');
	eq(p.face, 'talk_E', 'first letter h');
	eq(p.headId, 'h_e', 'talk_E head');
	const after = actor.at(1 + 5 / 14 + 0.01);
	eq(after.clip, 'idle', 'back on idle after the line');
});

test('actor reacts with a one-shot, then returns to idle', () => {
	const actor = createActor(makeChar(), {});
	actor.react('shrug', 2, 'worried');
	const p = actor.at(2.0);
	eq(p.clip, 'shrug', 'react clip');
	eq(p.headId, 'h_w', 'react face head');
	const after = actor.at(2 + 5 / 8 + 0.6 + 0.01);
	eq(after.clip, 'idle', 'back on idle after the shrug');
});

test('idle_back gives the back head', () => {
	const actor = createActor(makeChar(), { idle: 'idle_back' });
	eq(actor.at(0.1).headId, 'h_back', 'back view head');
});

test('unknown face falls back to the neutral head', () => {
	const actor = createActor(makeChar(), {});
	actor.setMood('angry');
	eq(actor.at(0.1).headId, 'h_n', 'angry has no head: neutral fwd');
});

test('mood shows on the head when not blinking', () => {
	const actor = createActor(makeChar(), {});
	actor.setMood('happy');
	eq(actor.at(0.1).headId, 'h_h', 'happy head');
});

test('blink shows the blink head', () => {
	const actor = createActor(makeChar(), {});
	const p = actor.at(3.3);
	eq(p.face, 'blink', 'blink face');
	eq(p.headId, 'h_b', 'blink head');
});

test('talk clips rotate and skip missing names', () => {
	const actor = createActor(makeChar(), { talkClips: ['talk_b', 'talk_a'] });
	actor.talk('Hi', 0);
	eq(actor.at(0).clip, 'talk_a', 'talk_b is missing, so talk_a');
	actor.talk('Hi', 10);
	eq(actor.at(10).clip, 'talk_a', 'second sentence also talk_a');
});

test('talk falls back to idle when no talk clip exists', () => {
	const actor = createActor(makeChar(), { talkClips: ['talk_x'] });
	actor.talk('Hi', 0);
	eq(actor.at(0.1).clip, 'idle', 'no talk clip, so idle');
});

test('stop clears talk and reaction', () => {
	const actor = createActor(makeChar(), {});
	actor.talk('Hello', 0);
	actor.react('shrug', 0, 'happy');
	actor.stop();
	eq(actor.at(0.1).clip, 'idle', 'idle after stop');
	ok(actor.state.talk === null && actor.state.react === null, 'state cleared');
});

done();
