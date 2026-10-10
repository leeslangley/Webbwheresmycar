[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W62 Bookings scene (the phone)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W62
Needs (already merged into `dev`): W45, W46, W47, W50c, W40, W17
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The phone: a list of customers wanting a car. The player picks a request, picks a car that meets the needs, and accepts.

## Read first
- docs/DESIGN.md section 4.7, 8.2, 9.5, 9.7
- src/sim/jobresolve.js, jobsim.js, carstats.js, src/data/jobtypes.js, src/data/cars.js, src/ui/kit_draw.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/bookings.js`
- `tests/scene_bookings.test.mjs`

## Steps
1. Create `src/ui/scenes/bookings.js` exporting `bookingsScene` (id `'bookings'`) and `LAYOUT = {requests:{x:40,y:110,w:560,h:360}, rowH:90, cars:{x:40,y:490,w:560,h:150}, carW:180, detail:{x:620,y:110,w:620,h:420}, accept:{x:620,y:550,w:620,h:70}, back:{x:40,y:650,w:200,h:50}}`.
2. Look: a `BOOKINGS` header with a phone icon. Requests list (max 6 rows, 90px each): job name, customer name, fee (`money`, green) and `n days left` (`expiresDay - day`; red when 1). Under the list a horizontal strip of the player's cars as small cards (180px wide, `drawCar` small with `cond`), greyed with a red reason line when the car is unavailable (`FAULT`, `IMPOUNDED`) or fails the selected request's needs (`TOO PLAIN`, `TOO FLAKY`, `TOO SCRUFFY`); selectable cars get a lamp outline when selected; horizontal drag scrolls the strip.
3. Detail panel: the request blurb (wrapped, body 28px), `Fee <money>`, three requirement lines `Style needed <minDesirability>` / `Reliability needed <minReliability>` / `Condition needed <minCondition>` with `OK` (green) or `NO` (red) comparing against the selected car's EFFECTIVE values (effD, effR, condition), the selected car's effective values printed next to them to one decimal. Button `ACCEPT JOB <money>` primary: enabled only with a request and a car selected that passes everything; otherwise tapping toasts the reason (`Pick a car first`, `That car is not fit to go out`, or the first failing need). Accept -> `app.act(() => acceptJob(app.state, requestId, carId))`; if `ok` is false toast its `msg`.
4. Empty state `No bookings. The phone is suspiciously quiet. Try advertising.`; empty stable `You need a car first.`
5. Write `tests/scene_bookings.test.mjs` using `startGame(6)` and hand-made requests/cars (`t2_zed` condition 10 owned) with a `wedding` request (minD 6, minR 5, minCond 6, fee 1000, expires day 8): job and customer names and `£1,000` appear; the car card shows; ACCEPT is rejected with a toast `Pick a car first` before selecting; after selecting the car and tapping ACCEPT the request is gone and `state.day === 2`; a too-plain car (`t1_allergy`) shows `TOO PLAIN` and ACCEPT toasts a reason and changes nothing; the requirement lines show `OK` for the good car; empty states appear; Escape pops.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to sim files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W62: Bookings scene (the phone)`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
