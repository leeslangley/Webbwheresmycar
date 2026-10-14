[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU12 Small in-scene pop-up menu with arrow cursor

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU12
Needs (already merged into `dev`): GU01, GU03, GU05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
RSAMH's small boxed list (FORWARD / REWIND / SELECT) with a bobbing pixel arrow cursor, replacing full-screen menus for quick choices: pure model (selection, keys, hit rows) plus the draw.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/kit_hits.js (`makeHits().add(id,x,y,w,h,onTap,{enabled})`)
- docs/SCENE_RULES.md (TAP RULE)

## Files you may change (and nothing else)
- `src/ui/popmenu.js`
- `tests/popmenu.test.mjs`

## Steps
1. `src/ui/popmenu.js` (imports paperPanel from './panels2.js', COLOR from './tokens.js', PALETTE from './theme.js'). Export `makePopMenu(items, opts)`: items = [{id, label, enabled=true}], opts {x:0, y:0, w:240}; returns {items, x, y, w, h: 24 + 44*items.length, sel: first enabled index (0 when none)}. Export `popRowRect(m, i)` = {x: m.x+12, y: m.y+12+44*i, w: m.w-24, h: 44}. Export `popAt(m, px, py)` -> row index under the point or -1 (rows only, enabled or not). Export `popMove(m, dir)`: dir +1 or -1; step through the rows with wrap-around until an enabled row is found; if there is none leave sel unchanged. Export `popKey(m, key)`: 'ArrowDown' or 's' -> popMove(+1) and return 'move'; 'ArrowUp' or 'w' -> popMove(-1), 'move'; 'Enter' or ' ' -> return 'pick' (only when the selected row is enabled, else null); anything else null. Export `popAddHits(m, hits, onPick)`: for each row hits.add('pop:' + item.id, rect.x, rect.y, rect.w, rect.h, function () { onPick(item.id); }, {enabled: item.enabled !== false}).
2. Export `drawPopMenu(ctx, m, t)`: paperPanel(ctx, m.x, m.y, m.w, m.h); for each row i: r = popRowRect; when i === m.sel and the item is enabled: fillStyle 'rgba(255,210,122,0.55)', fillRect(r.x, r.y, r.w, r.h); text = item.label uppercased, font '16px "Press Start 2P", monospace', textAlign 'left', textBaseline 'middle', fillStyle (enabled ? COLOR.ink : PALETTE.midgrey), fillText(text, r.x + 40, r.y + 22). The cursor on the selected row: bitmap rows (8x8) ['...o....','...oo...','oooooo..','ooooooo.','ooooooo.','oooooo..','...oo...','...o....'] (32 'o' cells); off = (Math.floor(t*4) % 2) * 4; for each 'o' cell (cx, cy) fillStyle COLOR.ink, fillRect(r.x + 4 + off + cx*3, r.y + 10 + cy*3, 3, 3) (one fillRect per cell: exactly 32).
3. `tests/popmenu.test.mjs`: m = makePopMenu([{id:'fwd',label:'Forward'},{id:'rew',label:'Rewind'},{id:'sel',label:'Select',enabled:false}],{x:100,y:200,w:240}); m.h is 156; popRowRect(m,1) is {x:112,y:256,w:216,h:44}; popAt(m,120,260) is 1, popAt(m,99,260) is -1, popAt(m,120,10) is -1; m.sel starts 0; popMove(m,1) -> 1; popMove(m,1) -> 0 (row 2 disabled is skipped, wraps); popMove(m,-1) -> 1; popKey: 'ArrowDown' returns 'move', 'Enter' returns 'pick' on an enabled row and null when sel is the disabled row (set m.sel = 2 by hand), 'x' returns null. All-disabled menu: sel 0 and popMove leaves it 0. popAddHits makes 3 hits with ids 'pop:fwd','pop:rew','pop:sel', and `hits.tap(120, 220)` calls onPick('fwd') while tapping the disabled row calls nothing. drawPopMenu: texts are ['FORWARD','REWIND','SELECT']; exactly 32 cursor fillRects of size [3,3] with fillStyle '#14102A'; at t 0 the first cursor cell x is 112+4+9=125... compute from the formula (r.x+4+off+cx*3 with cx 3 for the first cell of row 0): [r.x+4+0+9, r.y+10, 3, 3] = [125, 222, 3, 3]; at t 0.25 (off 4) it is [129,222,3,3]; the disabled row's text colour is '#6C6C6C'; auditCtx from tests/uiaudit.js (GU03) reports no belowFloor, no overlaps.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/popmenu.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Any scene (wave 2 converts scenes to pop-ups).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU12: Small in-scene pop-up menu with arrow cursor`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
