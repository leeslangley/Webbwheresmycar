[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W09 Car catalogue aggregator and paint

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W09
Needs (already merged into `dev`): W06, W07, W08
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Join the three tiers into one catalogue with lookups, and give every car a paint colour for the art code.

## Read first
- docs/DESIGN.md section 6, 7.1 and 9.3 (data/cars.js)
- src/data/cars_t1.js, cars_t2.js, cars_t3.js

## Files you may change (and nothing else)
- `src/data/cars.js`
- `src/data/paint.js`
- `tests/cars.test.mjs`

## Steps
1. Create `src/data/cars.js`: `export const CARS = [...CARS_T1, ...CARS_T2, ...CARS_T3]` (31 cars); `export const CAR_BY_ID` (object keyed by id); `export const ARCHETYPES` = `['micro','saloon','beetle','hatch','roadster','coupe','longnose','wedge','gullwing','tourer','limo','boxy','trike']`; `export function modelOf(id)` returns the model or throws `Error('unknown model ' + id)`.
2. Create `src/data/paint.js`: `export const PAINT = { <carId>: '#RRGGBB', ... }` with one entry per car id (31 entries). Colours should be period-appropriate classic car colours (British racing green, Rosso red, cream, powder blue, mustard, etc.). At least 12 distinct colours overall. Also `export function paintOf(id)` returning the colour or `'#888888'` if the id is unknown.
3. Write `tests/cars.test.mjs`: 31 cars; ids unique; `CAR_BY_ID['t3_aston'].basePrice === 320000`; `modelOf('t1_allergy').name === 'Austen Allergy'`; `modelOf('nope')` throws; every archetype in `ARCHETYPES` is used by at least one car and no car uses an archetype outside the list; tiers: exactly 10 cars of tier 1, 10 of tier 2, 11 of tier 3; `PAINT` has exactly the same 31 keys as the catalogue, every value matches `/^#[0-9A-Fa-f]{6}$/`, at least 12 distinct colours; `paintOf('zzz')` is `#888888`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit the three tier files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W09: Car catalogue aggregator and paint`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
