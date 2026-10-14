// Tests for src/audio/sfx.js, run under `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { SOUNDS, createSfx } from '../src/audio/sfx.js';

// Fake AudioContext that records every node it creates.
let constructed = 0;
let lastCtx = null;

function param() {
	return {
		setValueAtTime() {},
		linearRampToValueAtTime() {},
		exponentialRampToValueAtTime() {},
	};
}

class FakeAudioContext {
	constructor() {
		constructed += 1;
		lastCtx = this;
		this.currentTime = 0;
		this.sampleRate = 44100;
		this.destination = { name: 'destination' };
		this.resumed = 0;
		this.oscillatorsCreated = 0;
		this.oscillators = [];
		this.gains = [];
		this.buffers = [];
		this.sources = [];
		this.filters = [];
	}

	resume() {
		this.resumed += 1;
	}

	createOscillator() {
		this.oscillatorsCreated += 1;
		const o = {
			type: 'sine',
			frequency: param(),
			started: 0,
			stopped: 0,
			startAt: null,
			stopAt: null,
			connect() {},
			start(t) {
				o.started += 1;
				o.startAt = t;
			},
			stop(t) {
				o.stopped += 1;
				o.stopAt = t;
			},
		};
		this.oscillators.push(o);
		return o;
	}

	createGain() {
		const g = { gain: param(), connect() {} };
		this.gains.push(g);
		return g;
	}

	createBuffer(channels, length, rate) {
		const data = [];
		const b = {
			channels: channels,
			length: length,
			sampleRate: rate,
			getChannelData() {
				return data;
			},
		};
		this.buffers.push(b);
		return b;
	}

	createBufferSource() {
		const s = {
			buffer: null,
			started: 0,
			stopped: 0,
			connect() {},
			start() {
				s.started += 1;
			},
			stop() {
				s.stopped += 1;
			},
		};
		this.sources.push(s);
		return s;
	}

	createBiquadFilter() {
		const f = { type: 'lowpass', frequency: param(), connect() {} };
		this.filters.push(f);
		return f;
	}
}

function makeEnv(sound) {
	constructed = 0;
	lastCtx = null;
	return {
		AudioContext: FakeAudioContext,
		settings: { sound: sound },
	};
}

test('SOUNDS has exactly the 9 names', () => {
	eq(
		Object.keys(SOUNDS).sort(),
		['bid', 'cash', 'click', 'crash', 'fail', 'fanfare', 'paper', 'ring', 'tada'],
		'sound names'
	);
});

test('every SOUNDS event has a valid type and numeric timing', () => {
	const types = ['square', 'triangle', 'sawtooth', 'noise'];
	const names = Object.keys(SOUNDS);
	for (let i = 0; i < names.length; i++) {
		const events = SOUNDS[names[i]];
		ok(events.length > 0, names[i] + ' has events');
		for (let j = 0; j < events.length; j++) {
			const e = events[j];
			ok(types.indexOf(e.type) >= 0, names[i] + ' event type');
			ok(typeof e.freq === 'number' && typeof e.endFreq === 'number', names[i] + ' freq');
			ok(e.start >= 0 && e.dur > 0 && e.vol > 0 && e.vol <= 1, names[i] + ' timing and volume');
		}
	}
});

test('play before unlock returns false and creates no context', () => {
	const sfx = createSfx(makeEnv(true));
	eq(sfx.play('click'), false, 'play before unlock');
	eq(constructed, 0, 'no AudioContext before unlock');
});

test('unlock creates the context once and resumes it', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	sfx.unlock();
	eq(constructed, 1, 'AudioContext constructed once');
	ok(lastCtx.resumed >= 1, 'resume called');
});

test('after unlock play click returns true and makes one started and stopped oscillator', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	eq(sfx.play('click'), true, 'play click');
	eq(lastCtx.oscillatorsCreated, 1, 'one oscillator');
	eq(lastCtx.oscillators[0].started, 1, 'started');
	eq(lastCtx.oscillators[0].stopped, 1, 'stopped');
	eq(lastCtx.oscillators[0].type, 'square', 'click is square');
});

test('click starts at now and stops 20ms after its 40ms duration', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	sfx.play('click');
	near(lastCtx.oscillators[0].startAt, 0, 1e-9, 'start time');
	near(lastCtx.oscillators[0].stopAt, 0.06, 1e-9, 'stop time');
});

test('cash second note starts 60ms after the first', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	sfx.play('cash');
	eq(lastCtx.oscillatorsCreated, 2, 'two oscillators');
	near(lastCtx.oscillators[1].startAt, 0.06, 1e-9, 'second note start');
});

test('fanfare creates 5 oscillators', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	eq(sfx.play('fanfare'), true, 'play fanfare');
	eq(lastCtx.oscillatorsCreated, 5, 'five oscillators');
});

test('ring creates exactly one oscillator per SOUNDS.ring event', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	eq(sfx.play('ring'), true, 'play ring');
	eq(lastCtx.oscillatorsCreated, SOUNDS.ring.length, 'ring oscillator count');
});

test('crash uses a noise buffer and filter, not an oscillator', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	eq(sfx.play('crash'), true, 'play crash');
	eq(lastCtx.oscillatorsCreated, 0, 'no oscillators');
	eq(lastCtx.sources.length, 1, 'one buffer source');
	eq(lastCtx.sources[0].started, 1, 'source started');
	eq(lastCtx.sources[0].stopped, 1, 'source stopped');
	eq(lastCtx.filters.length, 1, 'one filter');
	ok(lastCtx.buffers[0].length > 0, 'noise buffer has samples');
});

test('play with an unknown name returns false and creates nothing', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	eq(sfx.play('nope'), false, 'unknown name');
	eq(sfx.play('toString'), false, 'inherited name');
	eq(lastCtx.oscillatorsCreated, 0, 'no oscillators');
	eq(lastCtx.sources.length, 0, 'no sources');
});

test('with settings.sound false play returns false and creates nothing', () => {
	const env = makeEnv(false);
	const sfx = createSfx(env);
	sfx.unlock();
	eq(sfx.play('click'), false, 'sound off');
	eq(lastCtx.oscillatorsCreated, 0, 'no oscillators');
});

test('settings.sound is read at play time', () => {
	const env = makeEnv(false);
	const sfx = createSfx(env);
	sfx.unlock();
	eq(sfx.play('click'), false, 'off at first');
	env.settings.sound = true;
	eq(sfx.play('click'), true, 'on after change');
	eq(lastCtx.oscillatorsCreated, 1, 'one oscillator after change');
});

test('without an AudioContext constructor unlock does not throw and play returns false', () => {
	const sfx = createSfx({ settings: { sound: true } });
	sfx.unlock();
	eq(sfx.play('click'), false, 'no context');
});

test('setMusicDuck accepts on and off without throwing', () => {
	const sfx = createSfx(makeEnv(true));
	sfx.unlock();
	sfx.setMusicDuck(true);
	sfx.setMusicDuck(false);
	eq(sfx.play('bid'), true, 'play still works');
});

done();
