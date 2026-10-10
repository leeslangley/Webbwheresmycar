[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W46 UI kit: hit areas and scrolling lists

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W46
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pure logic for tap areas and for touch-scrolling lists (no drawing).

## Read first
- docs/DESIGN.md section 9.5 and 9.7 (ui/kit_hits.js)

## Files you may change (and nothing else)
- `src/ui/kit_hits.js`
- `tests/kit_hits.test.mjs`

## Steps
1. Create `src/ui/kit_hits.js`. `makeHits()` returns an object with `list` (array), `add(id, x, y, w, h, onTap, opts = {})` (pushes `{id, x, y, w, h, onTap, enabled: opts.enabled !== false}` and returns the entry), `clear()` (empties the list in place), `hit(x, y)` (scans from the LAST added to the first, returns the first entry that is enabled and contains the point; edges inclusive on the left/top and exclusive on the right/bottom; returns `null` if none), `tap(x, y)` (calls `hit`; if found and `onTap` is a function calls it with the entry and returns true; else returns false).
2. Export `class ScrollList`: `constructor({viewH, rowH, count})`; fields `offset = 0`, `vel = 0`, `dragging = false`; `max()` = `Math.max(0, count * rowH - viewH)`; `setCount(n)` (updates and clamps offset); `scrollBy(dy)` (offset += dy, clamped to 0..max); `beginDrag(y, nowMs)` (records start y, last y, last time; `dragging = false`; `vel = 0`); `dragTo(y, nowMs)` (if `|y - startY| > 8` set `dragging = true`; when dragging: `scrollBy(lastY - y)` and `vel = (lastY - y) / Math.max(1, nowMs - lastT)`; update last y/time); `endDrag()` returns `{tapped: !dragging}` and sets dragging false (keep `vel` for fling only if it was a drag, else set `vel = 0`); `update(dtMs)`: if not currently dragging and `Math.abs(vel) > 0.01`: `scrollBy(vel * dtMs)`, `vel *= Math.pow(0.95, dtMs / 16)`; if the offset hit 0 or max set `vel = 0`; if `Math.abs(vel) <= 0.01` set `vel = 0`; `rowAt(localY)` returns `Math.floor((localY + offset) / rowH)` if that index is in 0..count-1 and localY in 0..viewH, else -1; `visibleRange()` returns `{first, last}` (inclusive indices of rows overlapping the view, last clamped to count-1; for count 0 return `{first: 0, last: -1}`).
3. Write `tests/kit_hits.test.mjs`: hits: topmost (last added) wins when two overlap; disabled entries are skipped; right/bottom edges exclusive; clear empties the same array object; tap calls onTap exactly once and returns true, a miss returns false. ScrollList with viewH 300, rowH 50, count 10: max 200; scrollBy(1000) clamps to 200; scrollBy(-1000) clamps to 0; setCount(4) makes max 0 and offset 0; rowAt(10) is 0 at offset 0, rowAt(60) is 1; at offset 100 rowAt(10) is 2; rowAt(-1) and rowAt(300) are -1; visibleRange at offset 0 is {first:0,last:5}; at offset 100 is {first:2,last:7} ; at offset 200 is {first:4,last:9}; a drag of 5px is a tap (`endDrag().tapped` true, offset unchanged), a drag of 60px upward (`beginDrag(200,0)`, `dragTo(140,100)`) moves the offset by 60 and `endDrag().tapped` is false; after that drag `update(16)` moves the offset further while vel is nonzero and eventually vel returns to 0 after repeated updates (loop 400 updates); fling never leaves 0..max.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No canvas code.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W46: UI kit: hit areas and scrolling lists`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
