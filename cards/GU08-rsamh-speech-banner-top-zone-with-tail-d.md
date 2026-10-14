[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU08 RSAMH speech banner: top zone with tail, dither and typewriter

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU08
Needs (already merged into `dev`): GU01, GU02, GU05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The big rounded speech-banner across the top 120px that carries all narration, Dave's chatter and headlines, as in Rock Star Ate My Hamster: peach-to-tan gradient, ordered-dither shade, thick ink outline, a pointed tail toward the speaker, ALL-CAPS pixel type revealed like a typewriter, paged when long.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/art/speech.js (the old small speech bubble: this replaces it as the main narration voice)

## Files you may change (and nothing else)
- `src/ui/banner.js`
- `tests/banner.test.mjs`

## Steps
1. `src/ui/banner.js` (imports COLOR, ZONES from tokens; textfit is NOT needed). Export `BANNER_RECT` = {x:16, y:8, w:1248, h:104}, `BANNER_TEXT` = {x:44, y:24, w:1192, lineH:28, perPage:3}. Export `bannerPages(ctx, text)` -> string[][]: uppercase the text, set `ctx.font = '16px "Press Start 2P", monospace'`, greedy-wrap to BANNER_TEXT.w (word by word, `measureText`, paragraphs split on newline), then chunk the lines in groups of 3: each group is one page. Export `typewriterChars(total, elapsedMs, cps = 40)` = Math.min(total, Math.floor(elapsedMs * cps / 1000)).
2. Export `drawBanner(ctx, text, opts)`: opts {tailX: 1040, tailY: 150, page: 0, reveal: 1 (0..1), tailBase: null}. Order: (1) the tail first: tb = tailBase !== null ? tailBase : clamp(tailX, 60, 1220); path moveTo(tb-22, 108), lineTo(tailX, tailY), lineTo(tb+22, 108), closePath; fillStyle COLOR.bannerBottom, fill; lineWidth 5, strokeStyle COLOR.ink, stroke. (2) the body: a rounded-rect path of BANNER_RECT with radius 22 (moveTo/lineTo/quadraticCurveTo like kit_draw's roundRectPath, written privately); gradient `ctx.createLinearGradient(0, 8, 0, 112)` with stops 0 -> COLOR.bannerTop and 1 -> COLOR.bannerBottom as fillStyle; fill; lineWidth 5; strokeStyle COLOR.ink; stroke (this stroke also covers the tail base). (3) ordered dither: fillStyle 'rgba(196,139,85,0.5)' (COLOR.bannerDither at half alpha); for yy = 64; yy < 104; yy += 4: row = (yy-64)/4; start xx = 28 + (row % 2) * 4; for (xx = start; xx <= 1244; xx += 8) fillRect(xx, yy, 2, 2). (4) the text of page `page` (clamped to the last page): lines = bannerPages(ctx, text)[page] (empty array for empty text); total = sum of line lengths; shown = Math.floor(total * clamp(reveal, 0, 1)); draw lines top to bottom at x BANNER_TEXT.x, y BANNER_TEXT.y + i*28, font 16px Press Start 2P, textBaseline 'top', textAlign 'left', fillStyle COLOR.ink, each line sliced to what remains of `shown`; when reveal < 1 also draw '_' (same font) right after the last visible character on its line. Return {pages: <page count, 1 for empty text>, page: <page used>, shown, total}.
3. `tests/banner.test.mjs`: bannerPages(ctx,'hello') is [['HELLO']]; a text of 7 wrapped lines gives 3 pages with line counts 3,3,1 (build it from 7 words of 60 chars each: 60*0.6*16=576 so two words never share a 1192 line... use 7 words of 80 chars: 768 wide, each on its own line); empty text gives []. drawBanner(ctx,'Hello world',{}) -> texts include 'HELLO WORLD'; exactly 1525 fillRects with fillStyle 'rgba(196,139,85,0.5)' (5 rows of 153 starts at 28 and 5 rows of 152 starts at 32: count them by filtering fillRect calls of size [2,2] that follow that fillStyle); a createLinearGradient call with args [0,8,0,112] whose stops are [[0,'#F6CFA0'],[1,'#D9A66F']]; the last stroke has lineWidth 5 and strokeStyle '#14102A'; the tail path contains lineTo(1040,150); with tailX 2000 the tail base is clamped to 1220 (a moveTo(1198,108)); reveal 0.5 on 'HELLO WORLD' draws 'HELLO' (floor(5.5)) plus a separate '_' text; reveal 1 draws no '_'; a 7-line text with page 1 draws the 4th, 5th and 6th lines and returns pages 3; page 99 clamps to 2; typewriterChars(11,100) is 4 and typewriterChars(11,10000) is 11; every fillRect lies inside [0,1280] x [0,200].

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/banner.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/art/speech.js stays as it is (the office switches to the banner in GU24).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU08: RSAMH speech banner: top zone with tail, dither and typewriter`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
