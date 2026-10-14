[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD13 Auction hall: stretch the warm glow band over the whole canvas

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD13
Needs (already merged into `dev`): WD05, GE21, CC16
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`drawHall` paints a 10 percent lamp-coloured band exactly as wide as the stage (`P.x - 120` .. `P.x + P.w + 120` is 0..1280): in the strips it would be missing, leaving a faint vertical step at the stage edges. Widen that one rectangle with a fixed overdraw (the hall function has no `app` argument, so use the constants -144 and 1424, the largest strip). The canvas crops what is not needed. ORDER: after WD05, GE21 and CC16 (GE21 and CC16 both rewrite drawHall: if the quoted line below no longer exists, because the plate replaced the band, change nothing, say so in your summary, and write only the test that the scene draws no full-stage-width alpha fill that stops at 0 and 1280).

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/scenes/auction.js (`drawHall`, the line `ctx.fillRect(P.x - 120, P.y - 40, P.w + 240, P.h + 120);` after `ctx.fillStyle = rgba(PALETTE.lamp, 0.10);`)
- tests/scene_auction_a.test.mjs and tests/scene_auction_b.test.mjs (their setup helpers; they must stay green)
- tests/fakeapp.js
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_view.test.mjs`

## Steps
1. In `drawHall` change that one `fillRect` to `ctx.fillRect(Math.min(P.x - 120, -144), P.y - 40, Math.max(P.x + P.w + 120, 1424) - Math.min(P.x - 120, -144), P.h + 120);` (with the default layout this is `[-144, 60, 1568, 380]`; the canvas of a 16:9 screen only shows 0..1280 of it, so nothing visible changes there). Nothing else in the file changes.
2. `tests/scene_auction_view.test.mjs` (copy the app/state setup of tests/scene_auction_a.test.mjs): draw once with the fake app; the `fillRect` whose fillStyle is 'rgba(255,210,122,0.1)' and whose height is 380 now satisfies x <= -144 and x + w >= 1424 (assert those two inequalities, not exact numbers, so a GE21 change of P keeps it valid); no `fillRect` with an rgba fillStyle of alpha below 1 has `x === 0 && x + w === 1280` and height >= 100 (the seam rule of WD15).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/scene_auction_view.test.mjs'` prints one line.
- `make test 2>&1 | grep -E 'PASS tests/scene_auction'` lists every auction test file as PASS.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything else in auction.js (layout, crowd, buttons, GE21 plate code).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD13: Auction hall: stretch the warm glow band over the whole canvas`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
