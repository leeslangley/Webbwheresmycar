[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU02 Text-fit helpers so nothing overlaps or clips

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU02
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pure helpers that choose a font size and wrap lines so text fits a box (numbers, not eyeballing), plus a helper that fits a picture into a rectangle. Used by every later card and by the scene fixes.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/kit_draw.js (see `label` and `wrapLines`; the new file must NOT import kit_draw.js, because kit_draw will later re-export this file: copy the small greedy word-wrap idea into a private function)

## Files you may change (and nothing else)
- `src/ui/textfit.js`
- `tests/textfit.test.mjs`

## Steps
1. `src/ui/textfit.js` imports `font` from './theme.js' and `FLOOR` from './tokens.js'. Private `wrap(ctx, text, maxW, fontStr)` -> string[] (greedy by spaces, newline starts a paragraph, a word wider than maxW gets its own line). Export `ellipsize(ctx, text, maxW, fontStr)`: set `ctx.font = fontStr`; return text unchanged when `ctx.measureText(text).width <= maxW`; else the longest prefix p (cut from the end one char at a time) such that `p + '...'` fits (ASCII three dots); '' when even '...' does not fit.
2. Export `fitOne(ctx, text, maxW, opts)`: opts {kind:'body', maxPx:28, minPx: FLOOR[kind]}. Try px = maxPx, maxPx-1 ... minPx and return the first {px, text, w, truncated:false} whose measured width (with `font(kind, px)` set) is <= maxW. If none fits, return {px:minPx, text: ellipsize(...at minPx), w:<measured>, truncated:true}. Export `fitBlock(ctx, text, w, h, opts)`: opts {kind:'body', maxPx:28, minPx: FLOOR[kind], lineRatio:1.1, maxLines:Infinity}. For px from maxPx down to minPx: lines = wrap(...), lineH = Math.round(px*lineRatio); accept the first px with lines.length <= maxLines and lines.length*lineH <= h and every line width <= w; return {px, lines, lineH, h: lines.length*lineH, truncated:false}. If none fits: at minPx keep only the lines that fit (min(maxLines, floor(h/lineH)), at least 1), ellipsize the last kept line to w, return truncated:true.
3. Export `drawFitted(ctx, text, rect, opts)`: runs fitBlock(rect.w, rect.h, opts) then draws each line with ctx.fillText at x = rect.x (align 'left'), rect.x + rect.w/2 (opts.align 'center') or rect.x + rect.w (opts.align 'right'), y = rect.y + i*lineH (+ (rect.h - result.h)/2 when opts.valign is 'middle'), `textBaseline 'top'`, fillStyle opts.color (default '#14102A'); returns the fitBlock result. Export `fitInRect(srcW, srcH, rect, opts)`: opts {maxScale: Infinity, pad: 8}; scale = Math.min(maxScale, (rect.w - 2*pad)/srcW, (rect.h - 2*pad)/srcH); return {scale, x: rect.x + rect.w/2 (centre), y: rect.y + rect.h - pad (bottom, where a car's ground point goes), w: srcW*scale, h: srcH*scale}.
4. `tests/textfit.test.mjs` (numbers use the fake ctx width rule 0.6*px per char): fitOne(ctx,'Hello',100,{kind:'body',maxPx:28}) gives px 28 (5*16.8=84 <= 100) and w 84; fitOne(ctx,'A'.repeat(20),100,{kind:'body',maxPx:28}) gives px 22, truncated true, text 'AAAA...' (check: (4+3)*13.2=92.4 <= 100 and 8 chars would be 145); fitOne(ctx,'A'.repeat(5),100,{kind:'title',maxPx:24}) gives px 24 (72 wide); ellipsize(ctx,'abcdefghij',60,'20px X') is 'ab...' (each char is 12px: 5 chars = 60) and ellipsize(ctx,'abc',60,'20px X') is 'abc'; fitBlock for 'aaa bbb ccc ddd eee fff' in w 130 h 200 with maxPx 28: assert every line width <= 130, lines.length*lineH <= 200, truncated false; fitBlock with h 24 and maxPx 22 minPx 22 on a long text returns truncated true, lines.length 1 and the last line ends with '...'; drawFitted draws exactly lines.length fillText calls and none at y outside rect.y..rect.y+rect.h; fitInRect(480,170,{x:0,y:0,w:600,h:170},{pad:10,maxScale:1.15}) gives scale within 1e-9 of 150/170, x 300, y 160.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/textfit.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/kit_draw.js (GU21 wires this in).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU02: Text-fit helpers so nothing overlaps or clips`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
