[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W53d Speech bubble

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W53d
Needs (already merged into `dev`): W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The speech bubble that shows Dave's comment of the day in the office.

## Read first
- docs/DESIGN.md section 5
- src/ui/theme.js (PALETTE, font)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/speech.js`
- `tests/speech.test.mjs`

## Steps
1. Create `src/art/speech.js` exporting `speechBubble(ctx, rect, text, t)` where `rect = {x, y, w, h}`. Imports `PALETTE, font` from `../ui/theme.js`. Do not import kit_draw.js. Steps: `bob = Math.sin(t*2) * 2`; `ctx.save()`; rounded rectangle (use `quadraticCurveTo` corners, radius 12) at `(rect.x, rect.y + bob, rect.w, rect.h)` filled `PALETTE.white`, stroked `PALETTE.ink` lineWidth 3; a small tail triangle below the left part of the bubble: points (rect.x+30, rect.y+rect.h+bob), (rect.x+52, rect.y+rect.h+bob), (rect.x+22, rect.y+rect.h+22+bob), filled white with the two slanted edges stroked ink; text: set `ctx.font = font('body', 26)`, `fillStyle = PALETTE.ink`, `textAlign = 'left'`, `textBaseline = 'top'`; wrap greedily with `ctx.measureText` to the width `rect.w - 24`; at most 3 lines; if the text needs more than 3 lines, cut the third line down (drop trailing characters) until `line + '...'` fits and end it with `...`; draw each line with `fillText` at x = rect.x+12, y = rect.y+10+bob + i*28; `ctx.restore()`.
2. Write `tests/speech.test.mjs` (makeCtx, texts, count): a short text like `Boss, tea?` draws exactly one text line containing it; a 200-character text of repeated words draws at most 3 text lines and the last line ends with `...`; a text that wraps into exactly 3 lines is NOT truncated (no `...`): with the fake measureText a 26px body font gives 15.6px per character, and with `rect.w = 300` the available width is 276px, so 17 characters fit per line; build the text from three words of 15 characters each (separated by single spaces) so it wraps into exactly 3 lines; save/restore balanced; the first stroke uses `PALETTE.ink`; log at t = 0 differs from t = 0.4 (the bubble bobs) but the text content is identical; empty text draws the bubble and no text lines.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No characters.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W53d: Speech bubble`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
