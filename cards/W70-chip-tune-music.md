[Project: Webbwheresmycar]
# Task: [GLM-SPARK] MiMo-v2.6-Flash W70 Chip-tune music

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W70
Needs (already merged into `dev`): W69
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (MiMo-v2.6-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A looping synthesised tune in the spirit of an 8-bit management game, built from a note pattern and the same Web Audio approach as the sound effects.

## Read first
- docs/DESIGN.md section 3
- src/audio/sfx.js (for the fake AudioContext pattern in tests/sfx.test.mjs)

## Files you may change (and nothing else)
- `src/audio/music.js`
- `tests/music.test.mjs`

## Steps
1. Create `src/audio/music.js` exporting `noteFreq(midi)` = `440 * Math.pow(2, (midi - 69) / 12)`; `PATTERN`: an object `{bpm: 132, bars: 8, lead: [...], bass: [...], hat: [...]}` where `lead` and `bass` are arrays of `{step, midi, len}` over 16 steps per bar x 8 bars (128 steps; lead mostly in midi 60-84 in a cheerful major key such as C major with a bouncy rhythm; bass in 36-52 on beats; `hat` steps every second step); `stepSeconds(bpm)` = `60 / bpm / 4`.
2. Export `createMusic(env)` with `env = {AudioContext, settings, getContext}` where the same context as the sound effects is reused if `env.getContext()` returns one. Returns `{start(), stop()}`. `start()` begins a lookahead scheduler: every 100ms (`setInterval` provided as `env.setInterval`, `env.clearInterval`) it schedules all events falling in the next 0.4 seconds, looping the 128 steps; lead = square wave vol 0.05, bass = triangle vol 0.08, hat = short noise burst vol 0.02. It does nothing when `settings.music` is false. `stop()` clears the interval.
3. Write `tests/music.test.mjs`: `noteFreq(69) === 440`, `noteFreq(81)` is 880 (near), `noteFreq(57)` is 220 (near); PATTERN has bpm 132, 8 bars; all lead midi values are between 60 and 84 and all bass between 36 and 52; every `step` is an integer 0..127 and `len >= 1`; lead has at least 40 notes and bass at least 32; `stepSeconds(120)` is 0.125; with fake timers (`setInterval` capturing the callback, `clearInterval` recording) and a fake AudioContext, `start()` followed by invoking the interval callback several times schedules oscillators (more than 0), `stop()` calls `clearInterval`, and with `settings.music = false` `start()` schedules nothing.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No file loading. No game wiring (a later card).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W70: Chip-tune music`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
