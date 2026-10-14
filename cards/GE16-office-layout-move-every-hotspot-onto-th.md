[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE16 Office layout: move every hotspot onto the new room (tableau)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE16
Needs (already merged into `dev`): GE01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The new office plate (docs/art/GE.md 'Office') puts every object in a new place inside the 470 px tableau (screen y 120 to 590). Move the hit rectangles to match. The SCENE LAYOUT constants move, so the tests that check them are updated here too.

## Read first
- src/art/officelayout.js
- tests/office_art.test.mjs and tests/scene_office.test.mjs (the checks that name coordinates)
- src/art/stage.js (GE01)
- docs/art/GE.md section 'RSAMH echo' (the Office paragraph)

## Files you may change (and nothing else)
- `src/art/officelayout.js`
- `tests/office_art.test.mjs`
- `tests/scene_office.test.mjs`

## Steps
1. In `src/art/officelayout.js` set `FLOOR_Y = 480`, `WALL_TOP = 120` and replace the `OFFICE` rectangles with exactly: hud {0,0,1280,56} (unchanged until the HUD card), banner {12,8,1256,104}, calendar {836,168,88,112}, workshop {320,170,110,130}, tv {450,170,350,322}, tvScreen {482,196,286,210}, poster {205,156,100,150}, window {30,150,160,170}, ledger {960,250,100,235}, garageDoor {1086,182,158,306}, desk {40,378,370,130}, phone {70,348,70,52}, laptop {150,334,130,66}, newspaper {310,372,70,28}, kettle {830,318,110,92}, mark {495,300,120,190}, dave {667,310,96,180}, bubble {640,14,620,92}. (Format: {x,y,w,h}.)
2. Also export `export const OFFICE_FX = { lamp: {x:388,y:328}, tvGlow: {x:482,y:196,w:286,h:210}, sunQuad: [[40,320],[190,320],[420,520],[120,520]], dustRect: {x:0,y:120,w:640,h:360}, labels: { posterCx: 255, ledgerCx: 1010, boardCx: 375, signCx: 1165 } };`.
3. Update `tests/office_art.test.mjs`: the floor/wall constants test expects 480 and 120; 'phone, laptop and newspaper sit on the desk' now checks `r.y + r.h <= d.y + 34`; add a test that every OFFICE rect except `hud`, `banner` and `bubble` passes `inTableau` (import from `../src/art/stage.js`) and that `tvScreen` lies inside `tv`; keep every other check. Run `make test`; if `tests/scene_office.test.mjs` fails because of a hard-coded coordinate, replace that number with the matching `LAYOUT.hits` rect (do not weaken what the test asserts).
4. Do not touch `src/art/office.js` (it stays as the fallback painter used when no plate is loaded; it will look rough with the new rectangles, that is accepted).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'office_art|scene_office'` shows PASS for both.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files. The HUD does not move in this card.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE16: Office layout: move every hotspot onto the new room (tableau)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
