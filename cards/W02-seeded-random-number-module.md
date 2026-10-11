[Project: Webbwheresmycar]
# Task: [GLM-SPARK] Sparks-alias-glm-5.3-flash W02 Seeded random number module

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W02
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (Sparks-alias-glm-5.3-flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A deterministic random-number module. All game randomness comes from a uint32 stored in `state.rng`, so a saved game and a replay behave identically.

## Read first
- docs/DESIGN.md section 9.3 (core/rng.js) and 9.1
- tests/harness.js (how to write tests)

## Files you may change (and nothing else)
- `src/core/rng.js`
- `tests/rng.test.mjs`

## Steps
1. Create `src/core/rng.js` with exactly this core step (copy it, do not rewrite it):
```js
function step(state) {
  let t = (state.rng = (state.rng + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0);
}
```
2. Export `seedRng(state, seed)`: sets `state.rng = (seed >>> 0)` (so any number becomes a uint32). Seed 0 is allowed.
3. Export `rand(state)` = `step(state) / 4294967296` (always in [0,1)). Export `randInt(state, lo, hi)` = `lo + Math.floor(rand(state) * (hi - lo + 1))` (inclusive both ends). Export `chance(state, p)` = `rand(state) < p`.
4. Export `pick(state, arr)`: returns `arr[randInt(state, 0, arr.length-1)]`; throws `Error('pick: empty array')` if `arr.length === 0`.
5. Export `weighted(state, items)`: items are objects with a numeric `w >= 0`; total = sum of w; throws `Error('weighted: no weight')` if total <= 0; draws ONE `rand`, walks the items subtracting `w`, returns the item where the running value goes below zero; if rounding leaves nothing, return the last item with `w > 0`.
6. Export `roundTo(x, step)` = `Number((Math.round(x / step) * step).toFixed(6))` and `clamp(x, lo, hi)` = `Math.min(hi, Math.max(lo, x))`.
7. Write `tests/rng.test.mjs` with these tests (all deterministic): (a) seed 12345: the three first `step` outputs are 4207900869, 1317490944, 2079646450, so `rand` returns 0.9797282677609473, 0.3067522644996643, 0.484205421525985 (use `near` with eps 1e-12); (b) seed 1: first two `rand(state)*4294967296` values are 2693262067 and 11749833 (use `eq` after `Math.round`); (c) same seed gives the same 20 numbers, different seeds differ; (d) 10000 draws of `rand` are all in [0,1); (e) `randInt(state,3,5)` over 1000 draws only returns 3, 4 or 5 and returns each at least once; (f) `chance(state,0)` is always false and `chance(state,1)` always true over 200 draws; (g) `pick` throws on `[]`, otherwise returns members only; (h) `weighted` with weights `[{w:1,id:'a'},{w:3,id:'b'}]` over 4000 draws gives 'b' between 2800 and 3200 times; with `w:0` items they are never picked; throws when all weights are 0; (i) `roundTo(2.34,0.1)` is exactly 2.3, `roundTo(1234,10)` is 1230, `roundTo(1235,10)` is 1240; (j) `clamp(5,0,3)` is 3, `clamp(-1,0,3)` is 0, `clamp(2,0,3)` is 2.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c '^export' src/core/rng.js` prints `8`.
- `grep -c 'Math.random' src/core/rng.js` prints `0`.

## Out of scope (do not touch)
- No other files. Do not add exports beyond the 8 listed.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W02: Seeded random number module`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
