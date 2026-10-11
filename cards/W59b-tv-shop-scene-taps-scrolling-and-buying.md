[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W59b TV shop scene: taps, scrolling and buying

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W59b
Needs (already merged into `dev`): W59
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Second half of the TV shop screen: make it work. Selecting rows by tap or keyboard, scrolling the list by dragging, buying and renting, going back.

## Read first
- src/ui/scenes/tvshop.js (existing from W59: build on it, keep its drawing)
- src/sim/actions.js (buyCar, rentCar), src/ui/kit_hits.js (ScrollList), docs/DESIGN.md 9.5 and 9.7
- tests/fakectx.js, tests/fakeapp.js, src/sim/newgame.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). TAP RULE (obey exactly): the screen is redrawn many times between a finger-down and its finger-up, so NEVER reset the pressed state inside `draw`. On `'down'`: `const h = this.hits.hit(x, y); this.pressed = h ? h.id : null;`. On `'up'`: `const e = this.hits.hit(x, y); if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') e.onTap(e); this.pressed = null;`. The hit list (`makeHits()`) is rebuilt at the start of every `draw`.

## Files you may change (and nothing else)
- `src/ui/scenes/tvshop.js`
- `tests/scene_tvshop_input.test.mjs`

## Steps
1. Fill in the scene's behaviour (do not change what is drawn, except highlighting). Row taps: the row hit entries registered in `draw` get `onTap: () => { this.selected = i; }` (clamped to the number of listings). BUY button `onTap`: `const l = listings[this.selected]; if (!l || l.mode !== 'sale') return; const r = app.act(() => buyCar(app.state, l.listingId)); if (r && r.ok) { this.selected = Math.min(this.selected, Math.max(0, app.state.shop.listings.length - 1)); this.scroll.setCount(app.state.shop.listings.length); }`; RENT button similarly with `rentCar` for `mode === 'rent'`. BACK: `app.pop()`. A DISABLED button must not fire, but tapping it must call `app.toast(reason)` where reason is `'Not enough money'` or `'No free garage slot'` (decide from cash and slots) or `'That one is not for sale'` / `'That one is not for rent'`: implement by registering the hit entry for disabled buttons with `enabled: true` and an `onTap` that toasts.
2. Pointer routing in `pointer(app, type, x, y)`: the TAP RULE above for buttons and rows, PLUS list scrolling: on 'down' inside `LAYOUT.list` call `this.scroll.beginDrag(y, app.now())` as well as remembering the pressed id; on 'move' call `this.scroll.dragTo(y, app.now())`; on 'up': `const r = this.scroll.endDrag(); if (r.tapped) {apply the tap rule} else { /* it was a drag: do not fire a tap */ }` and `this.pressed = null`. Call `this.scroll.update(16)` once per `draw` so a fling coasts.
3. Keyboard in `key(app, k)`: `'ArrowDown'` selects the next row, `'ArrowUp'` the previous (clamped; scroll the list to keep the selection visible by calling `this.scroll.scrollBy(...)` so the selected row is inside the view); `'Enter'` triggers BUY for a sale listing or RENT for a rent listing; `'Escape'` pops.
4. Write `tests/scene_tvshop_input.test.mjs` (makeCtx, makeApp, startGame): for every interaction use the REAL sequence `scene.pointer(app,'down',x,y)`, `scene.draw(makeCtx(), app, 1)` (a redraw), `scene.pointer(app,'up',x,y)`: tapping row 1 (centre at y = 120 + 60 + 30) sets `selected` to 1; BUY on an affordable sale listing (select it first) makes `state.cars.length === 1`, `state.day === 2` and removes the listing; BUY with cash 0 leaves state unchanged and `app.toasts` contains `Not enough money`; with 3 cars the toast is `No free garage slot`; RENT on a rent listing adds an unowned car; BACK records `['pop']`; mismatched down/up (down on BUY, up on BACK) does nothing; an orphan up does nothing; a drag of 60px up inside the list scrolls (`scroll.offset > 0`) and does NOT select a row; keys: ArrowDown/ArrowUp change `selected` and clamp at the ends, Enter buys, Escape pops; after buying the last listing the scene does not crash and shows the empty text.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `tests/scene_tvshop_draw.test.mjs` from W59 still passes.

## Out of scope (do not touch)
- Do not change the drawing (W59) other than what the card says.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W59b: TV shop scene: taps, scrolling and buying`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
