[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W45 UI kit: drawing helpers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W45
Needs (already merged into `dev`): W43, W44, W04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Reusable drawing helpers every screen will use: panels, text labels, word wrap, buttons, bars.

## Read first
- docs/DESIGN.md section 3 and 9.7 (ui/kit_draw.js)
- src/ui/theme.js
- src/core/format.js (money)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/ui/kit_draw.js`
- `tests/kit_draw.test.mjs`

## Steps
1. Create `src/ui/kit_draw.js` importing `PALETTE, font, shade, rgba` from `./theme.js` and `money` from `../core/format.js`.
2. `panel(ctx, x, y, w, h, opts = {})`: opts `fill` (default PALETTE.cream), `border` (default PALETTE.ink), `radius` (10), `shadow` (true), `bw` (4, border width). If shadow: fill a rounded rect offset by (6,6) with `rgba('#000000', 0.35)`. Then a rounded rect path (use `ctx.moveTo/lineTo/quadraticCurveTo` or `arcTo`) filled with `fill`, then stroked with `border` at `lineWidth = bw`.
3. `label(ctx, text, x, y, opts = {})`: opts `size` (16), `color` (PALETTE.ink), `align` ('left'), `font` ('body' or 'title', default 'body'), `shadow` (false), `maxW` (none). Set `ctx.font = font(opts.font, size)`, `textAlign`, `textBaseline = 'top'`. If `maxW` is set, reduce `size` by 1 until `ctx.measureText(text).width <= maxW` or size is 8. If shadow, first draw the text offset (2,2) in `rgba('#000000', 0.5)`. Draw with `fillText`. Return the measured width.
4. `wrapLines(ctx, text, maxW, fontStr)`: sets `ctx.font = fontStr`; splits `text` on `\n` into paragraphs, each into words on spaces; greedy line fill using `measureText`; a word wider than maxW gets its own line; returns an array of line strings (no empty trailing line).
5. `paragraph(ctx, text, x, y, maxW, opts = {})`: opts `size` (24), `color`, `font` ('body'), `lineH` (default `Math.round(size * 1.1)`). Wraps with `wrapLines` using `font(opts.font, size)`, draws each line with `label`, returns the y just below the last line (`y + lines.length * lineH`).
6. `button(ctx, b)`: `b` = `{x, y, w, h, label, enabled = true, hot = false, kind = 'normal'}`. Fill colours: normal `PALETTE.lightblue`, primary `PALETTE.good`, danger `PALETTE.bad`; when `enabled` is false use `PALETTE.midgrey` and a `PALETTE.darkgrey` label. Draw a `panel` with that fill (no extra shadow offset beyond the panel default), then a highlight strip (top 25% of the button, `shade(fill, 0.3)`), then the label centred (title font, size `Math.max(10, Math.min(20, Math.round(h * 0.32)))`, shrunk to fit `w - 16`), colour `PALETTE.white` with shadow. When `hot` is true stroke an extra 3px `PALETTE.lamp` outline.
7. `bar(ctx, x, y, w, h, value, max, color)`: `frac = max > 0 ? clamp(value / max, 0, 1) : 0`; `fillRect(x, y, w, h)` in `PALETTE.darkgrey`; `fillRect(x + 2, y + 2, (w - 4) * frac, h - 4)` in `color`; `strokeRect(x, y, w, h)` in `PALETTE.ink`, lineWidth 2.
8. `moneyText(n)` returns `money(n)`.
9. Write `tests/kit_draw.test.mjs` with `makeCtx`: panel with default opts makes at least one fill and one stroke call and sets `strokeStyle` to PALETTE.ink; panel with `shadow:false` makes exactly one fill call fewer than with the shadow; label returns a positive width and the text appears in `texts(ctx)`; label with `maxW` 50 and a 40-char string at size 24 ends with a font size < 24 (inspect last `font` assigned: parse the number) and measured width <= 50; `wrapLines` with font `'20px X'` (12px per char) on `'aaa bbb ccc'`, maxW 90 returns `['aaa bbb','ccc']`; `'aaaaaaaaaaaaaaaaaaaa b'` with maxW 90 returns two lines; `'a\nb'` returns `['a','b']`; paragraph returns a y bigger than the start y by exactly lines*lineH (use a 3-line example); button draws its label text; a disabled button assigns `PALETTE.midgrey` to fillStyle; a hot button assigns `PALETTE.lamp` to strokeStyle; bar with value 5 of 10, `bar(ctx,10,10,100,20,5,10,'#f00')` includes a `fillRect` call with args `[12,12,48,16]`; bar with max 0 draws a fill of width 0; `moneyText(1234)` is `£1,234`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No hit-testing here (next card). No images.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W45: UI kit: drawing helpers`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
