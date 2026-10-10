[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W04 Text formatting helpers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W04
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Helpers that turn numbers and day numbers into display text. Used by every screen.

## Read first
- docs/DESIGN.md section 4.2 and 9.3 (core/format.js)
- src/core/clock.js is being written by another card; do NOT import it. Re-create the small month table you need inside format.js.

## Files you may change (and nothing else)
- `src/core/format.js`
- `tests/format.test.mjs`

## Steps
1. Create `src/core/format.js` exporting `money(n)`: round `n` to an integer first; format with `£` and comma thousands separators using a regex (do not use `Intl` or `toLocaleString`). Negatives are `-£1,234`. Never output `-£0` (a value that rounds to 0 prints `£0`). Examples: 1234 -> `£1,234`; 0 -> `£0`; 1234567 -> `£1,234,567`; 12.6 -> `£13`; -1234 -> `-£1,234`; -0.4 -> `£0`.
2. Export `oneDp(n)` = `n.toFixed(1)` after adding a tiny epsilon (`Number((n + 1e-9).toFixed(1)).toFixed(1)` is fine) so 2 -> `2.0`, 7.46 -> `7.5`, 0 -> `0.0`.
3. Export `dateText(day)`: `dateText(1)` -> `1 January`, `dateText(55)` -> `24 February`, `dateText(365)` -> `31 December`. Day must be an integer 1..365 else throw `RangeError`. Use a local `NAMES` array and a local `LENGTHS` array.
4. Export `stars(n)`: n is 0-10 (clamp it, round to nearest integer); returns 10 characters, `★` for filled and `☆` for empty. `stars(7)` -> `★★★★★★★☆☆☆`.
5. Export `plural(n, one, many)` -> `1 car` style: `plural(1,'car','cars')` -> `1 car`, `plural(3,'car','cars')` -> `3 cars`, `plural(0,'car','cars')` -> `0 cars`.
6. Write `tests/format.test.mjs` covering every example above plus `dateText(0)` throws, `stars(-3)` is all empty, `stars(99)` is all filled.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c 'Intl\|toLocaleString' src/core/format.js` prints `0`.

## Out of scope (do not touch)
- Do not import any other src file.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W04: Text formatting helpers`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
