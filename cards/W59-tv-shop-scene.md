[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W59 TV shop scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W59
Needs (already merged into `dev`): W45, W46, W47, W50, W40, W09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark's TV shows the list of classic cars for sale or to rent. The player scrolls the list, looks at stats, and buys or rents.

## Read first
- docs/DESIGN.md section 4.3, 4.4, 5, 9.5, 9.7
- src/sim/shop.js, actions.js, carstats.js, src/data/cars.js, paint.js, src/art/cardraw.js, src/core/format.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/tvshop.js`
- `tests/scene_tvshop.test.mjs`

## Steps
1. Create `src/ui/scenes/tvshop.js` exporting `tvshopScene` (id `'tvshop'`) and `LAYOUT = {list:{x:40,y:120,w:560,h:480}, rowH:60, detail:{x:620,y:120,w:620,h:480}, buy:{x:640,y:600,w:290,h:64}, back:{x:40,y:640,w:200,h:56}, rent:{x:950,y:600,w:290,h:64}}`.
2. Look: a big old TV frame around the whole screen (thick `PALETTE.darkgrey` rounded bezel, rounded corners, two knobs at the right, scanline overlay at 6% alpha), screen background `PALETTE.blue`. Title `WEBB TV SHOPPING` (title font 24px, `PALETTE.yellow`) at (40,60). The list (rows 60px tall, 9 visible) shows each listing as a row: the car name (body 30px), a tag `FOR SALE` (green) or `TO RENT` (orange), and its price (sale: `money(price)`; rent: `money(price)+'/mo'`), the selected row has a `PALETTE.lamp` outline and a blinking block cursor. Scrolling by dragging with `ScrollList`.
3. Detail panel for the selected listing: the car drawn large via `drawCar(ctx, model.archetype, 930, 300, 1.15, {body: paintOf(model.id), cond: listing.condition, t})`; the name (title font 22px), year and `quip` (body 28px, wrapped); three stat bars with labels `STYLE`, `UPKEEP`, `GRIT` for desirability, maintenance, reliability (value/10, using `bar`, colours good/orange/lightblue) showing the BASE model stats, plus `CONDITION n.n/10` using the listing condition with its own bar; for rent listings also show `Owner: <owner>`. Show the listing price only (no market value).
4. Buttons: BUY (primary, only enabled when the selected listing is a sale, `cash >= price` and the stable has a free slot) and RENT (only enabled for rent listings with `cash >= price` and a free slot); BACK pops. When a button is disabled but the player taps it, toast the reason (`Not enough money`, `No free garage slot`). Tap on BUY -> `app.act(() => buyCar(app.state, id))`; RENT -> `rentCar`. After a successful action the app handles the day screen; this scene just keeps its selection clamped. Keyboard: Up/Down select, Enter buy or rent, Escape back.
5. Empty state: if there are no listings draw `Nothing on the telly. Try again next week.`
6. Write `tests/scene_tvshop.test.mjs` using `startGame(5)`: the first listing's car name appears in `texts(ctx)` and `money(price)` of the first sale listing appears; selecting a row by tapping it (use ScrollList-derived row rects: row i at y = 120 + i*60) changes the detail text; BUY on an affordable sale listing makes `state.cars.length === 1` and `state.day === 2`; BUY with cash set to 0 leaves the state unchanged and toasts `Not enough money`; RENT enabled only for rent listings (select a rent listing, tap RENT -> an unowned car appears); with 3 cars the buy toasts `No free garage slot`; BACK records `['pop']`; Escape key pops; empty shop text appears when `shop.listings = []`; Up/Down changes selection.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to sim files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W59: TV shop scene`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
