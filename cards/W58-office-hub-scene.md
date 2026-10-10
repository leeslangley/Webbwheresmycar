[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W58 Office hub scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W58
Needs (already merged into `dev`): W45, W46, W47, W52, W53, W54, W55, W56, W24, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The main screen. Mark's office with the calendar on the wall; every prop is a tap target that opens a part of the game.

## Read first
- docs/DESIGN.md section 5 (the office hub) and 9.5, 9.7
- src/art/office.js, officelayout.js, characters.js, props.js, calendar.js, hud.js
- src/data/chatter.js (chatterFor), src/core/clock.js, src/sim/actions.js (waitDay), src/sim/newgame.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/office.js`
- `tests/scene_office.test.mjs`

## Steps
1. Create `src/ui/scenes/office.js` exporting `officeScene` (id `'office'`). Draw in this order: `drawOfficeStatic(ctx,t)`; TV screen via `drawTvStatic(ctx, OFFICE.tvScreen, t)` with on top a small caption in the screen `WEBB TV` (title font 16px, `PALETTE.lightgreen`, blinking with `blink(t,2,0.4)` inverted) and the line `Tap me to shop!` (body 28px); `drawWallCalendar(ctx, OFFICE.calendar, state.day, t, crossAnim)` where `crossAnim = Math.min(1, (app.now() - app.dayChangedAt || 0) / 700)` (use `app.dayChangedAt` if present else 1); `drawPhone(ctx, OFFICE.phone, t, state.requests.length > 0)`; `drawLaptop`, `drawNewspaper`, `drawKettle`; `drawMark(ctx, OFFICE.mark.x + 60, OFFICE.mark.y + OFFICE.mark.h, 1, t, mood)` where mood is 'happy' if cash > 30000, 'worried' if cash < 1500, else 'normal'; `drawDave(ctx, OFFICE.dave.x + 48, OFFICE.dave.y + OFFICE.dave.h, 1, t)`; a speech bubble `speechBubble(ctx, OFFICE.bubble, line, t)` with Dave's line; the HUD last via `drawHud`.
2. Dave's line: chosen with `chatterFor(state, sit)` ONCE per day (cache `{day, line}` on the scene object; recompute when `state.day` changes). `sit` is the first of: 'broke' if cash < 1000, 'rich' if cash > 50000, 'breakdown' if the last event today mentions 'broke down', 'newmonth' if the day is a month start, 'auctionday' if `isAuctionDay`, 'fullgarage' if cars >= slots, 'emptygarage' if no cars, else 'idle'. Because `chatterFor` consumes the game's RNG, instead call it with a COPY: `chatterFor({rng: state.day * 7919 + 13}, sit)` so the main game stays deterministic.
3. Hit areas (`makeHits`, rebuilt each draw), all from `OFFICE`: tv -> `app.push('tvshop')`; phone -> `app.push('bookings')`; garageDoor -> `app.push('garage')`; laptop -> `app.push('adverts')`; newspaper -> `app.push('news', {readOnly: true})`; ledger -> `app.push('ledger')`; workshop -> `app.push('ledger', {tab: 'workshop'})`; kettle -> `app.act(() => waitDay(app.state))`; calendar -> `app.toast(dateText(day) + ' - ' + (365 - day) + ' days left')`; poster -> if `isAuctionDay(day)` `app.push('auction')` else `app.toast('Auction day is the 24th of every month')`; the 4 HUD plates (`PLATE_RECTS`) -> `app.toast(PLATE_INFO[key].name + ': ' + PLATE_INFO[key].text)`. Draw `drawHotspotGlow` over the phone when requests exist, over the poster when it is auction day, and over the TV when the player owns no cars.
4. Keyboard: `t` TV, `p` phone, `g` garage, `l` laptop, `n` newspaper, `k` kettle (wait a day), `a` auction (when available). Export `LAYOUT = {hits: <name -> rect>}` mapping each of the above names to its OFFICE rect for the tests.
5. Write `tests/scene_office.test.mjs` using `startGame(3)`: draw works, text includes `£20,000` (HUD) and `DAY 1`; tapping the centre of each rectangle calls the right push (tv -> `['push','tvshop',undefined]`, phone -> bookings, garageDoor -> garage, laptop -> adverts, ledger -> ledger, newspaper -> `['push','news',{readOnly:true}]`, workshop -> `['push','ledger',{tab:'workshop'}]`); tapping the kettle advances `state.day` to 2; tapping the poster on day 1 gives a toast containing `24th`, on day 24 pushes auction; Dave's line stays the same across two draws on one day and may change on another day; mood changes with cash (cash 40000 versus cash 1000 gives different logs); calendar tap toasts `1 January - 364 days left`; the calendar crossed-day animation arg: draw with `app.dayChangedAt` unset still works.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit art files. No sim logic changes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W58: Office hub scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
