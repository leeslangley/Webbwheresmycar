// Synthesised sound effects (DESIGN.md 3). No audio files: every sound is a
// list of note events played with the Web Audio API. The AudioContext is made
// lazily in unlock(), which the game calls from the first tap or click,
// because iPhone Safari only starts audio after a user gesture.
// Not a pure module: it touches the browser audio API and Math.random.

// One note event. Times are seconds from now; endFreq equals freq unless the
// pitch (or, for noise, the lowpass filter) glides across the note.
function ev(type, freq, start, dur, vol, endFreq) {
	return {
		type: type,
		freq: freq,
		endFreq: endFreq === undefined ? freq : endFreq,
		start: start,
		dur: dur,
		vol: vol,
	};
}

// The ring is two 400+450Hz bursts with a 100ms gap, played twice.
function burst(start) {
	return [
		ev('square', 400, start, 0.15, 0.2),
		ev('square', 450, start, 0.15, 0.2),
	];
}

export const SOUNDS = {
	click: [ev('square', 880, 0, 0.04, 0.2)],
	cash: [
		ev('square', 1200, 0, 0.06, 0.2),
		ev('square', 1800, 0.06, 0.06, 0.2),
	],
	fail: [
		ev('triangle', 330, 0, 0.12, 0.3),
		ev('triangle', 262, 0.12, 0.12, 0.3),
		ev('triangle', 196, 0.24, 0.12, 0.3),
	],
	fanfare: [262, 330, 392, 523, 659].map(function (f, i) {
		return ev('square', f, i * 0.1, 0.1, 0.2);
	}),
	ring: burst(0).concat(burst(0.25), burst(0.5), burst(0.75)),
	tada: [
		ev('triangle', 392, 0, 0.4, 0.2),
		ev('triangle', 494, 0, 0.4, 0.2),
		ev('triangle', 587, 0, 0.4, 0.2),
	],
	crash: [ev('noise', 2400, 0, 0.3, 0.4, 200)],
	paper: [ev('noise', 3000, 0, 0.12, 0.25)],
	bid: [ev('triangle', 660, 0, 0.08, 0.25)],
};

// Noise is a random buffer, long enough to cover the note plus its stop tail.
function noiseBuffer(ctx, dur) {
	const rate = ctx.sampleRate || 44100;
	const n = Math.ceil(rate * (dur + 0.02));
	const buf = ctx.createBuffer(1, n, rate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < n; i++) {
		data[i] = Math.random() * 2 - 1;
	}
	return buf;
}

// Schedules one note: source -> gain envelope -> destination.
function scheduleNote(ctx, e) {
	const t0 = ctx.currentTime + e.start;
	const t1 = t0 + e.dur;
	const attack = Math.min(0.01, e.dur / 4);
	const release = Math.min(0.03, e.dur / 4);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0, t0);
	amp.gain.linearRampToValueAtTime(e.vol, t0 + attack);
	amp.gain.setValueAtTime(e.vol, t1 - release);
	amp.gain.linearRampToValueAtTime(0, t1);
	amp.connect(ctx.destination);

	let src;
	if (e.type === 'noise') {
		src = ctx.createBufferSource();
		src.buffer = noiseBuffer(ctx, e.dur);
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(e.freq, t0);
		if (e.endFreq !== e.freq) {
			filter.frequency.linearRampToValueAtTime(e.endFreq, t1);
		}
		src.connect(filter);
		filter.connect(amp);
	} else {
		src = ctx.createOscillator();
		src.type = e.type;
		src.frequency.setValueAtTime(e.freq, t0);
		if (e.endFreq !== e.freq) {
			src.frequency.linearRampToValueAtTime(e.endFreq, t1);
		}
		src.connect(amp);
	}
	src.start(t0);
	src.stop(t1 + 0.02);
}

// env = {AudioContext, settings}. settings.sound is read at each play().
// setMusicDuck only records the flag for the music card; it has no audible
// effect yet.
export function createSfx(env) {
	let ctx = null;
	let ducked = false;

	function unlock() {
		if (ctx === null && env.AudioContext) {
			try {
				ctx = new env.AudioContext();
			} catch (err) {
				ctx = null;
			}
		}
		if (ctx !== null && typeof ctx.resume === 'function') {
			ctx.resume();
		}
	}

	function play(name) {
		if (!env.settings || !env.settings.sound) {
			return false;
		}
		if (ctx === null) {
			return false;
		}
		if (!Object.prototype.hasOwnProperty.call(SOUNDS, name)) {
			return false;
		}
		const events = SOUNDS[name];
		for (let i = 0; i < events.length; i++) {
			scheduleNote(ctx, events[i]);
		}
		return true;
	}

	function setMusicDuck(on) {
		ducked = !!on;
	}

	return { unlock: unlock, play: play, setMusicDuck: setMusicDuck };
}
