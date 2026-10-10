[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W60 Garage scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W60
Needs (already merged into `dev`): W45, W46, W47, W50, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The stable: see every car you own or rent, with true condition, then service, fix, restore, sell, return or consign to the auction.

## Read first
- docs/DESIGN.md section 4.3, 4.5, 4.6, 4.10, 9.5, 9.7
- src/sim/garage.js, actions.js, auction.js (consignCar, unconsign), carstats.js, src/data/cars.js, paint.js, src/art/cardraw.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/garage.js`
- `tests/scene_garage.test.mjs`

## Steps
1. Create `src/ui/scenes/garage.js` exporting `garageScene` (id `'garage'`) and `LAYOUT = {list:{x:40,y:100,w:420,h:520}, rowH:70, detail:{x:480,y:100,w:760,h:520}, tinker:{x:480,y:560,w:240,h:56}, service:{x:730,y:560,w:240,h:56}, fix:{x:980,y:560,w:260,h:56}, restore:{x:480,y:626,w:240,h:56}, sell:{x:730,y:626,w:240,h:56}, consign:{x:980,y:626,w:260,h:56}, back:{x:40,y:640,w:200,h:56}}`.
2. Look: the garage interior (concrete wall gradient, painted floor, strip light). Title `THE STABLE  n/slots` (title font 22px). List rows: the car name, a tag `OWN` or `RENT`, `COND n.n`, a red `FAULT` tag when faulty and `IMPOUNDED` when `impoundedUntil > day`; rows scroll with ScrollList. Detail: `drawCar` large with the paint and `cond` (so rust and smoke are visible), the model name and quip, stat bars comparing EFFECTIVE (`effD`, `effR`) to the model's base (draw the base value as a thin marker line on the bar), a condition bar, text lines `Value <money>`, `Running cost/month <money>` (owned) or `Rent/month <money>` (rented), and the fault line `FAULT: <label> (fix <money>)` when present.
3. Buttons and labels: `TINKER <money>` (quick, cost from DESIGN 4.5), `SERVICE <money>` (full), `FIX FAULT <money>` (enabled only with a fault), `RESTORE <money>`, `SELL <money>` for owned cars (dealer price `roundTo(marketValue*0.6,10)`) or `RETURN <fee>` for rented cars (damage fee from DESIGN 4.4), and `CONSIGN` / `WITHDRAW` for owned cars (`CONSIGN` is disabled on auction day with the toast `Too late, the auction is today`). When consigning, use reserve = `roundTo(marketValue * 0.7, 10)` and toast `Consigned. Reserve <money>`. Tapping a disabled button toasts the reason. All paid actions go through `app.act`.
4. Keyboard: Up/Down select, `s` service, `t` tinker, `f` fix, Escape back. Empty stable text: `The garage is empty. Mark weeps quietly.`
5. Write `tests/scene_garage.test.mjs` using `startGame(2)` plus hand-made cars (fields per DESIGN 4.3) added to `state.cars`: names, `OWN`/`RENT` tags and `FAULT` tag appear; TINKER on a car at condition 5 makes it 6.0 and `state.day === 2`; FIX FAULT with no fault is disabled and toasts `Nothing to fix`; with a fault and enough cash it clears the fault; SELL removes an owned car and adds the dealer price to cash; RETURN on a rented car removes it; CONSIGN adds an entry to `state.auction.consigned` and the button becomes WITHDRAW; consign on day 24 toasts `Too late, the auction is today`; empty stable text; selecting the second car changes the detail text; Escape pops.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to sim files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W60: Garage scene`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
