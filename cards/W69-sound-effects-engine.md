[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W69 Sound effects engine

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W69
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Synthesised sound effects with the Web Audio API (no audio files). Works on iPhone (audio starts after the first tap).

## Read first
- docs/DESIGN.md section 3 and 9.7
- No audio files may be added.

## Files you may change (and nothing else)
- `src/audio/sfx.js`
- `tests/sfx.test.mjs`

## Steps
1. Create `src/audio/sfx.js` exporting `createSfx(env)` where `env = {AudioContext, settings}` (`AudioContext` is the constructor, `settings.sound` is a boolean read at play time). Returns `{unlock(), play(name), setMusicDuck(on)}`. `unlock()` creates the context lazily (`new env.AudioContext()`) and calls `resume()` if it exists; `play` before unlock does nothing.
2. Define `SOUNDS` (export it): an object with the names `click, cash, fail, fanfare, ring, tada, crash, paper, bid`. Each is a list of note events `{type:'square'|'triangle'|'sawtooth'|'noise', freq, endFreq, start, dur, vol}` (times in seconds from now): `click` one 40ms square blip at 880Hz; `cash` two quick ascending notes 1200 then 1800Hz, 60ms each; `fail` three descending triangle notes 330, 262, 196Hz 120ms each; `fanfare` a 5-note rising arpeggio (262,330,392,523,659) on square, 100ms each; `ring` two 400Hz+450Hz bursts 150ms with a 100ms gap, repeated twice; `tada` chord of 392, 494, 587 for 400ms; `crash` noise 300ms with falling filter; `paper` noise 120ms short; `bid` single triangle 660Hz 80ms.
3. `play(name)`: returns false when `settings.sound` is false, the context is missing, or the name is unknown; otherwise schedules each event: an oscillator (or a buffer of noise for `noise`) through a gain node with an attack/release envelope to the destination, `start(ctx.currentTime + e.start)`, `stop(ctx.currentTime + e.start + e.dur + 0.02)`, returns true.
4. Write `tests/sfx.test.mjs` with a fake AudioContext class recording created nodes (`createOscillator` returns an object with `frequency:{setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}}`, `connect`, `start`, `stop`, `type`; `createGain` returns `{gain:{...same methods}, connect}`; `createBuffer`, `createBufferSource`, `createBiquadFilter` minimal; `destination`, `currentTime: 0`, `resume`, `sampleRate: 44100`): `SOUNDS` has exactly the 9 names; before `unlock` play returns false; after unlock `play('click')` returns true and created exactly 1 oscillator that was started and stopped; `play('fanfare')` creates 5 oscillators; `play('nope')` returns false; with `settings.sound = false` play returns false and creates nothing; `play('ring')` creates exactly as many oscillators as there are events in `SOUNDS.ring` (assert `oscillatorsCreated === SOUNDS.ring.length`).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No music (next card). No file loading.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W69: Sound effects engine`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
