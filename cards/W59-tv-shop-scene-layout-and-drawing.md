[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W59 TV shop scene: layout and drawing

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W59
Needs (already merged into `dev`): W45, W46, W47, W50c, W40, W09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First half of the TV shop screen: only the LOOK. It draws the TV frame, the scrolling list of shop listings, the selected car and its details. No tapping or keyboard yet (card W59b).

## Read first
- docs/DESIGN.md section 4.3, 4.4, 5, 9.5, 9.7
- src/sim/shop.js, carstats.js (valueFactor), src/data/cars.js, paint.js, src/art/cardraw.js (drawCar), src/ui/kit_draw.js (panel, label, button, bar), src/ui/kit_hits.js (makeHits, ScrollList), src/core/format.js
- tests/fakectx.js, tests/fakeapp.js, src/sim/newgame.js (startGame)
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). TAP RULE (obey exactly): the screen is redrawn many times between a finger-down and its finger-up, so NEVER reset the pressed state inside `draw`. On `'down'`: `const h = this.hits.hit(x, y); this.pressed = h ? h.id : null;`. On `'up'`: `const e = this.hits.hit(x, y); if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') e.onTap(e); this.pressed = null;`. The hit list (`makeHits()`) is rebuilt at the start of every `draw`.

## Files you may change (and nothing else)
- `src/ui/scenes/tvshop.js`
- `tests/scene_tvshop_draw.test.mjs`

## Steps
1. Create `src/ui/scenes/tvshop.js` exporting `LAYOUT = {list:{x:40,y:120,w:560,h:480}, rowH:60, detail:{x:620,y:120,w:620,h:480}, buy:{x:640,y:600,w:290,h:64}, rent:{x:950,y:600,w:290,h:64}, back:{x:40,y:640,w:200,h:56}}` and `tvshopScene` with `id: 'tvshop'`. Scene state on the object: `selected` (index, 0 at `enter`), `scroll` (a `ScrollList({viewH: LAYOUT.list.h, rowH: LAYOUT.rowH, count: n})` created in `enter` from `app.state.shop.listings.length`), `hits` (`makeHits()`), `pressed` (null). `enter(app)` resets those. `pointer` and `key` exist but do nothing yet (`pointer(app, type, x, y) {}`).
2. `draw(ctx, app, t)`: (1) background: a big old TV frame: a rounded rectangle bezel `PALETTE.darkgrey` filling x 12..1268, y 12..708 (use `panel` with fill `PALETTE.darkgrey`), the screen inside it filled `PALETTE.blue`, two knobs (circles) at the right edge (x 1250, y 300 and 360) and a scanline overlay (horizontal lines every 6px with `rgba('#000000', 0.06)`). (2) title `WEBB TV SHOPPING` (label, title font 24px, `PALETTE.yellow`, shadow) at (40,60). (3) the list: for each listing `i` visible in `scroll.visibleRange()` draw a row at `y = LAYOUT.list.y + i*rowH - scroll.offset`: row panel; car name (body font 30px); a tag `FOR SALE` (green) or `TO RENT` (orange) in a small panel; price on the right (`money(price)` for sale, `money(price) + '/mo'` for rent); the selected row (`i === this.selected`) gets a `PALETTE.lamp` outline (strokeRect, lineWidth 4) and a blinking `>` cursor at its left (visible when `Math.floor(t * 2) % 2 === 0`). Clip the list to `LAYOUT.list` (save, rect, clip, restore). (4) detail panel for the selected listing (`panel` at `LAYOUT.detail`): the car drawn with `drawCar(ctx, model.archetype, 930, 330, 1.15, {body: paintOf(model.id), cond: listing.condition, t})`; the model name (title font 22px) at the panel top; `year` and the `quip` below (body font 28px, wrapped with `paragraph`); three stat bars via `bar` with labels `STYLE`, `UPKEEP`, `GRIT` for desirability, maintenance, reliability (value out of 10, colours good, orange, lightblue); a `CONDITION n.n/10` bar using `oneDp(listing.condition)`; for rent listings the line `Owner: <owner>`. (5) buttons drawn with `button`: `BUY` (kind primary, enabled only when the selected listing is a sale, `cash >= price` and `cars.length < garageSlots`), `RENT` (enabled only for rent listings with the same money and slot checks), `BACK` (enabled). Empty shop: draw `Nothing on the telly. Try again next week.` centred.
3. The draw function must not change `app.state`. Register the hit entries in `draw` for the list rows, BUY, RENT and BACK (ids `'row0'`.. , `'buy'`, `'rent'`, `'back'`) with `onTap` handlers that do nothing yet (`() => {}`); card W59b fills them in.
4. Write `tests/scene_tvshop_draw.test.mjs` (makeCtx, texts, count, anySet, makeApp, startGame): with `app.state = startGame(5)`: `enter` then `draw` does not throw and the texts include `WEBB TV SHOPPING`, the name of the first listing's car and `money(price)` of a sale listing; the selected row's `>` cursor appears at t = 0 and not at t = 0.5; draw at several t values never throws and `app.state` JSON is unchanged by drawing; with `selected = 1` the detail texts show the second listing's car name; stat labels `STYLE`, `UPKEEP`, `GRIT` and the text `CONDITION` appear; for a rent listing the text `Owner:` appears; with `shop.listings = []` the text `Nothing on the telly. Try again next week.` appears; BUY is disabled (`PALETTE.midgrey` assigned) when cash is 0; `LAYOUT.buy` equals `{x:640,y:600,w:290,h:64}`; save/restore balanced.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No pointer or keyboard behaviour, no buying (W59b).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W59: TV shop scene: layout and drawing`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
