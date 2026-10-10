[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W56 HUD strip

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W56
Needs (already merged into `dev`): W43, W44, W04, W05, W29
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The strip along the top of the screen: cash, reputation, buzz, the date, and the four Gold Number Plates.

## Read first
- docs/DESIGN.md section 4.11 and 5 (HUD)
- src/core/format.js, src/core/state.js, src/sim/endgame.js (PLATE_INFO)
- src/ui/theme.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/hud.js`
- `tests/hud.test.mjs`

## Steps
1. Create `src/art/hud.js` exporting `drawHud(ctx, state, t)`; the strip is `x 0, y 0, w 1280, h 56`. Background: ink with a lighter bottom line. Left to right: cash panel at x 16 (text `money(state.cash)`, title font 18px, colour `PALETTE.good` if cash >= 0 else `PALETTE.bad`); `REP <n>` with a small bar (100 wide) at x 250; `BUZZ <n>` (rounded integer) with a small bar at x 480 (bar colour `PALETTE.orange`); date text `DAY <day>  <dateText(day) in upper case>` at x 720 (for day 366 show `YEAR END`); four plate icons from x 1000, each 56x28: a number-plate rectangle (gold `PALETTE.gold` with ink text when won, `PALETTE.midgrey` with `PALETTE.darkgrey` text when not) containing the codes `FC`, `SB`, `HN`, `HT` in the order fatcat, stable, household, hammer.
2. Export `PLATE_RECTS` = array of 4 rects `{key, x, y, w, h}` for the plate icons (y 14, w 56, h 28, x = 1000 + i*66) so the office scene can add tap hints.
3. Write `tests/hud.test.mjs` using `newGameState(1)`: texts contain `£20,000`, `REP 40`, `BUZZ 0`, `DAY 1  1 JANUARY`, and the four codes; setting cash to -50 makes the cash text `-£50` and sets a fillStyle of `PALETTE.bad` before it (use `anySet`); winning a plate (`plates.fatcat = true`) causes `PALETTE.gold` to be assigned to fillStyle at least once more than with no plates; day 366 shows `YEAR END`; `PLATE_RECTS` has 4 entries with the stated geometry; save/restore balanced.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No tap handling.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W56: HUD strip`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
