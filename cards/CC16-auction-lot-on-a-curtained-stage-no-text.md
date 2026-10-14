[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC16 Auction: lot on a curtained stage, no text on the car

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC16
Needs (already merged into `dev`): CC01, CC07, CC08, W65b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The auction stage becomes a curtained hall with the lot as the star. Today the lot name, year and estimate are written across the top of the car. Move that text into a lot card on the left and stand the car right of it. A hidden condition must not leak through the wear state.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- src/ui/scenes/auction.js (drawHall, the picture block in draw, LAYOUT.picture)
- tests/scene_auction_a.test.mjs
- src/art/modelcar.js, src/art/stage.js
- src/ui/kit_draw.js (panel, paragraph, label)
- tests/fakecarart.js (from CC07): installFakeCarArt() / uninstallFakeCarArt() give scene tests sprite-like drawImage calls

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_a.test.mjs`

## Steps
1. Replace the body of `drawHall(ctx, t)` below the first `ink` room fill with `drawStage(ctx, LAYOUT.picture, 'auction', t)` (keep the dark room fill, the glow rect and the gavel drawing exactly as they are; remove only the plank, seam and spotlight cone code). Import `drawStage`, `drawModelCar`, `makeTracker, driveIn`; drop `drawCar` and `paintOf`. `auctionScene.tr = makeTracker()` in `enter`.
2. Car: `g = drawStage(...)` (call once per frame; have drawHall return the stage result and use it), `el = tr.update(this.lotIndex + ':' + view.name, t)`, `dx = -driveIn(el, 0.8, 700)` (the lot rolls in from the right), then `drawModelCar(ctx, model.id, 720 + dx, g.groundY, 2, {cond: view.revealed.condition ? view.values.condition : 6, t, slot:{w: 620, h: g.groundY - LAYOUT.picture.y - 8}, bob: el > 0.8, reflect: true, shine: el > 0.8})` clipped to the picture rect. The unrevealed condition keeps the fixed value 6 (wear state 1) so the picture never reveals the hidden number.
3. Lot card: a `panel(ctx, 144, 124, 270, 150, {shadow:false})` on the stage left; inside: `LOT n/N` (title font 18, `PALETTE.lamp`), the lot name with `paragraph(ctx, view.name, 156, 150, 246, {size: 26})` (max 3 lines), year then `Estimate Lxx to Lyy` (same `money()` text as now) as two body-font lines size 24 at y 232 and 256 inside the card. Remove the old four centred `label` calls over the car. Keep every hit, button and bidding code untouched.
4. Tests (keep existing; adjust only assertions that read the old text positions): with fake art, drawing a lot makes one `drawImage` whose rect lies inside `LAYOUT.picture` and whose left edge is greater than 414 (never over the lot card); the lot name text is drawn at an x < 414; an unrevealed condition gives an image id ending `|1`; revealing condition 2.0 (set `revealed.condition` and `values.condition = 2`) gives `|3`; art uninstalled: no drawImage.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_auction` shows PASS for all auction test files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC16: Auction: lot on a curtained stage, no text on the car`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
