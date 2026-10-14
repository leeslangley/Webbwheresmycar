[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE01 Stage zones: banner, tableau, HUD constants

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE01
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One place that says where the three screen zones are (like Rock Star Ate My Hamster: speech banner on top, one fixed tableau in the middle, HUD strip at the bottom) and how the art plates map to the 1280x720 canvas.

## Read first
- docs/art/GE.md section 'RSAMH echo' (the zones in px)
- src/art/officelayout.js (style of a pure constants module)

## Files you may change (and nothing else)
- `src/art/stage.js`
- `tests/stage.test.mjs`

## Steps
1. `src/art/stage.js` (pure data and tiny functions, no DOM): `export const STAGE = { w: 1280, h: 720, banner: {x:0,y:0,w:1280,h:120}, tableau: {x:0,y:120,w:1280,h:470}, hud: {x:0,y:590,w:1280,h:130} };` and `export const ART = { w: 640, h: 360, scale: 2 };` (art plates are 640x360 pixels drawn at x2 onto the 1280x720 canvas) and `export const ROOM_IDS = ['office','garage','auction','title','ledger','bookings'];`.
2. `export function inTableau(r)`: true when rect `r={x,y,w,h}` lies fully inside `STAGE.tableau` (x>=0, y>=120, x+w<=1280, y+h<=590). `export function artRect(r)`: returns `{x:r.x/2, y:r.y/2, w:r.w/2, h:r.h/2}` (screen rect to plate pixels). `export function bandRows()`: returns `{y0: 60, y1: 295}` (the plate rows that hold the tableau: (120/2) and (590/2)).
3. `tests/stage.test.mjs` (copy the import/harness style of tests/office_art.test.mjs): banner.h + tableau.h + hud.h is 720; the three zones touch (banner.y+banner.h === tableau.y, tableau.y+tableau.h === hud.y); `inTableau({x:0,y:120,w:1280,h:470})` is true; `inTableau({x:0,y:100,w:10,h:10})` false; `inTableau({x:1275,y:200,w:10,h:10})` false; `artRect(STAGE.tableau)` deep-equals `{x:0,y:60,w:640,h:235}`; `bandRows()` equals `{y0:60,y1:295}`; ROOM_IDS has 6 entries.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep stage` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE01: Stage zones: banner, tableau, HUD constants`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
