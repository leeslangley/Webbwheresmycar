[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC25 Game: speech banner and portrait frame in the Rock Star Ate My Hamster style

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC25
Needs (already merged into `dev`): W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The big rounded speech banner of the original (peach gradient with an ordered-dither edge, thick dark pixel outline, a stepped tail, small ALL-CAPS text that types itself out) and the framed portrait box with a name plaque. Everything is drawn with `fillRect` on a 4 px grid so it reads as chunky pixel art and is testable with the fake canvas.

## Read first
- docs/art/RSAMH_STYLE.md (the look)
- src/art/speech.js (the old bubble: keep it, do not change it; copy its wrapLines idea)
- src/ui/theme.js (PALETTE, font, shade, rgba)
- tests/fakectx.js (makeCtx, texts, count, lastSet, anySet)

## Files you may change (and nothing else)
- `src/art/banner.js`
- `tests/art_banner.test.mjs`

## Steps
1. Create `src/art/banner.js` exporting `drawBanner(ctx, rect, text, t, opts)` with `rect = {x,y,w,h}` (all multiples of 4) and `opts = {tailX, reveal}`; constants `G = 4` (the grid), `INK = '#14102a'`, `PEACH = ['#f8dcb8', '#f2c9a0', '#e8b085', '#d99a6c']`. Draw order: (1) shadow: `fillRect(rect.x + G, rect.y + G, rect.w, rect.h)` in `rgba('#000000', 0.35)`; (2) body: 4 horizontal bands, band i is `rect.h / 4` tall in `PEACH[i]` (top lightest), as `fillRect`s; between each two bands one row of height `G` is dithered: `fillRect` squares `G` x `G` at every second grid column starting at `rect.x`, the colour alternating between the upper and the lower band colour from row to row; (3) outline `G` px thick: 4 `fillRect`s in INK (top and bottom shortened by `G` at both ends, left and right shortened by `G` at both ends) plus four INK corner squares `G` x `G`, each one grid step diagonally inside its corner (this gives the cut pixel corner); (4) tail, leaning right: `bx = Math.round(opts.tailX / G) * G - 16` clamped to `rect.x + 4*G .. rect.x + rect.w - 7*G`; for row i = 0..4: `fillRect(bx + i*G, rect.y + rect.h + i*G, (5 - i)*G, G)` in `PEACH[3]`, then INK squares `G` x `G` at the left end and at the right end of that row; the last row (width G) is all INK. The tail is 5*G = 20 px tall.
2. Text: `ctx.font = font('body', 28)`, `fillStyle = INK`, `textAlign = 'left'`, `textBaseline = 'top'`; ALL CAPS (`text.toUpperCase()`); wrap greedily with `ctx.measureText` to the width `rect.w - 6*G`, at most 3 lines, the last line cut and ended with '...' when more is needed; line i is drawn at `x = rect.x + 3*G`, `y = rect.y + 3*G + i*30`. Typewriter: when `opts.reveal` is a number only the first `Math.floor(opts.reveal * 40)` characters of the UPPER-CASED text are shown (take the prefix BEFORE wrapping; do not trim it); `reveal` undefined shows everything. While characters are still hidden draw a cursor: INK `fillRect` of `2*G` x `2*G` just after the last visible character's line end, only when `Math.floor(t * 4) % 2 === 0`.
3. `drawPortraitFrame(ctx, rect, name)`: shadow like the banner; INK outline `2*G` px thick (4 fillRects); inside fill `PALETTE.lightblue` with a dithered row every `rect.h / 4` like the banner; under the frame a name plaque: `fillRect` `PALETTE.cream` of width `rect.w`, height `7*G`, at `y = rect.y + rect.h + G`, with an INK outline `G` thick (4 fillRects), and the text `name.toUpperCase()` in `font('title', 12)`, `textAlign = 'center'` at the plaque centre, INK. The caller draws the bust sprite on top. Returns the inner rect `{x: rect.x + 2*G, y: rect.y + 2*G, w: rect.w - 4*G, h: rect.h - 4*G}`.
4. Create `tests/art_banner.test.mjs` (fake ctx). (1) `drawBanner(ctx, {x:100,y:40,w:600,h:96}, 'Boss, the kettle has a plan.', 0, {tailX:160})`: no throw; `save`/`restore` balanced (draw inside save/restore); `texts(ctx).join('')` contains `'BOSS, THE KETTLE HAS A PLAN.'`; `anySet(ctx,'fillStyle','#14102a')` and `anySet(ctx,'fillStyle','#f8dcb8')` are true; every `fillRect` call has x >= 100, y >= 40, x + w <= 704 and y + h <= 160, and x, y, w, h all multiples of 4. (2) `reveal: 0.25` draws exactly 10 characters: `texts(ctx).join('')` equals `'BOSS, THE '`; `reveal: 0` draws no text at all. (3) The lowest `fillRect` bottom (excluding the shadow, which is the first fillRect) is `40 + 96 + 20 = 156`. (4) `drawPortraitFrame(ctx, {x:60,y:60,w:160,h:160}, 'Dave')` returns `{x:68,y:68,w:144,h:144}`, draws `'DAVE'`, and every fillRect has multiples of 4 in x, y, w, h.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep art_banner` shows `PASS tests/art_banner.test.mjs`.
- `grep -c 'Math.random\|Date' src/art/banner.js` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC25: Game: speech banner and portrait frame in the Rock Star Ate My Hamster style`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
