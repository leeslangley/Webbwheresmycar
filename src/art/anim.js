// Character animation timing (docs/art/GC.md): which frame of a clip is
// showing at time t, when the eyes blink, which mouth shape a spoken line
// needs at time t, and an actor that switches between idle, talk and
// one-shot reactions. Pure: no DOM, no clock reads, no random numbers.
// It reads the character block of the manifest:
// {head, head_back, clips: {name: {view, fps, loop, hold, frames}}, heads}.

const DEFAULT_TALK_CLIPS = ['talk_a', 'talk_b', 'talk_c'];

// Mouth shape for each letter (lower case). Letters not listed, digits,
// spaces and punctuation give 'neutral'.
const VISEME_FACE = {
	a: 'talk_A',
	e: 'talk_E', i: 'talk_E',
	o: 'talk_O', u: 'talk_O',
	m: 'talk_M', b: 'talk_M', p: 'talk_M',
	l: 'talk_E', t: 'talk_E', d: 'talk_E', n: 'talk_E', s: 'talk_E',
	z: 'talk_E', c: 'talk_E', k: 'talk_E', g: 'talk_E', r: 'talk_E',
	y: 'talk_E', h: 'talk_E', j: 'talk_E', q: 'talk_E', w: 'talk_E',
	x: 'talk_E',
	f: 'neutral', v: 'neutral'
};

// clipFrame(clip, t): index of the frame showing at t seconds into the clip.
// Loop clips wrap; one-shot clips hold their last frame. t < 0 gives 0.
export function clipFrame(clip, t) {
	if (t < 0) {
		return 0;
	}
	const n = clip.frames.length;
	const f = Math.floor(t * clip.fps);
	if (clip.loop) {
		return f % n;
	}
	return Math.min(n - 1, f);
}

// clipDone(clip, t): true when a one-shot clip has played and its hold is over.
// Loop clips are never done.
export function clipDone(clip, t) {
	return !clip.loop && t >= clip.frames.length / clip.fps + (clip.hold || 0);
}

// blinkClosed(t, seed): true while the eyes are shut. Each blink period is
// 3.4 to 4.6 s (by seed) and the eyes are shut for the last 0.14 s of it.
export function blinkClosed(t, seed) {
	const period = 3.4 + 0.3 * (seed % 5);
	return (t % period) >= period - 0.14;
}

// visemeFor(ch): the mouth face for one character, case-insensitive.
export function visemeFor(ch) {
	const face = VISEME_FACE[String(ch).toLowerCase()];
	return face === undefined ? 'neutral' : face;
}

// mouthAt(text, since, cps): the mouth face for a spoken line, 'since'
// seconds after it started, at cps letters per second.
export function mouthAt(text, since, cps = 14) {
	if (since < 0) {
		return 'neutral';
	}
	const i = Math.floor(since * cps);
	if (i >= text.length) {
		return 'neutral';
	}
	return visemeFor(text[i]);
}

// talkSeconds(text, cps): how long a spoken line lasts, at most 4 s.
export function talkSeconds(text, cps = 14) {
	return Math.min(text.length / cps, 4);
}

// createActor(char, opts): a character that idles, talks and reacts.
// opts: {seed, idle, talkClips}. state holds base, mood, talk and react.
export function createActor(char, opts) {
	const o = opts || {};
	const seed = o.seed === undefined ? 0 : o.seed;
	const talkClips = o.talkClips === undefined ? DEFAULT_TALK_CLIPS : o.talkClips;
	const state = {
		base: o.idle === undefined ? 'idle' : o.idle,
		mood: 'neutral',
		talk: null,
		react: null
	};
	let sentences = 0;

	// Body clip for the sentence number count: walk the talk clips from
	// count % length and take the first one this character has. If none,
	// the idle clip.
	function talkClipFor(count) {
		for (let j = 0; j < talkClips.length; j++) {
			const name = talkClips[(count + j) % talkClips.length];
			if (char.clips[name]) {
				return name;
			}
		}
		return state.base;
	}

	function reactActive(t) {
		if (!state.react) {
			return false;
		}
		return !clipDone(char.clips[state.react.clip], t - state.react.start);
	}

	function talkActive(t) {
		return state.talk !== null && t - state.talk.start < talkSeconds(state.talk.text);
	}

	return {
		state: state,

		setMood(m) {
			state.mood = m;
		},

		talk(text, t) {
			state.talk = { text: text, start: t, clip: talkClipFor(sentences) };
			sentences += 1;
		},

		// Plays clip from t. Unknown clip names are ignored. Replaces a talk.
		react(clip, t, face) {
			if (!char.clips[clip]) {
				return;
			}
			state.react = { clip: clip, start: t, face: face };
			state.talk = null;
		},

		stop() {
			state.talk = null;
			state.react = null;
		},

		// The pose at time t: {clip, index, bodyId, neck, angle, face, headId}.
		at(t) {
			const reacting = reactActive(t);
			const talking = !reacting && talkActive(t);
			let clip;
			let clipStart;
			if (reacting) {
				clip = state.react.clip;
				clipStart = state.react.start;
			} else if (talking) {
				clip = state.talk.clip;
				clipStart = state.talk.start;
			} else {
				clip = state.base;
				clipStart = 0;
			}
			const c = char.clips[clip];
			const index = clipFrame(c, t - clipStart);
			const frame = c.frames[index];

			let face;
			if (reacting && state.react.face) {
				face = state.react.face;
			} else if (talking) {
				face = mouthAt(state.talk.text, t - state.talk.start);
			} else if (blinkClosed(t, seed)) {
				face = 'blink';
			} else {
				face = state.mood;
			}

			let headId;
			if (c.view === 'back') {
				headId = char.head_back;
			} else {
				const set = char.heads[face];
				headId = (set && (set[frame.angle] || set.fwd)) || char.heads.neutral.fwd;
			}

			return {
				clip: clip,
				index: index,
				bodyId: frame.id,
				neck: frame.neck,
				angle: frame.angle,
				face: face,
				headId: headId
			};
		}
	};
}
