[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W52 Office layout and static background

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W52
Needs (already merged into `dev`): W43, W44, W48
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The fixed painted office room: a layout table of where every prop sits, and a function that paints the room (wall, floor, window, desk, cabinet, garage door, posters, rug, lamp glow).

## Read first
- docs/DESIGN.md section 3, 5 and 7.2
- src/art/common.js, src/ui/theme.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/officelayout.js`
- `src/art/office.js`
- `tests/office_art.test.mjs`

## Steps
1. Create `src/art/officelayout.js` exporting `OFFICE` with EXACTLY these rectangles (`{x, y, w, h}`): `hud {0,0,1280,56}`, `calendar {36,84,190,240}`, `workshop {36,344,190,140}`, `tv {250,110,330,400}`, `tvScreen {276,136,278,206}`, `poster {620,100,120,170}`, `window {770,100,150,140}`, `ledger {900,290,90,230}`, `garageDoor {1060,110,190,400}`, `desk {600,420,330,110}`, `phone {618,372,70,52}`, `laptop {710,358,130,66}`, `newspaper {850,398,70,28}`, `kettle {300,530,120,100}`, `mark {690,250,120,190}`, `dave {1000,300,96,210}`, `bubble {900,200,300,90}`. Also export `FLOOR_Y = 520`, `WALL_TOP = 56`.
2. Create `src/art/office.js` exporting `drawOfficeStatic(ctx, t = 0)`. Paint, in this order: wall (vertical gradient `PALETTE.lightblue` at WALL_TOP to a darker `shade(...,-0.2)` at FLOOR_Y, with a repeating subtle vertical stripe wallpaper every 40px at 8% alpha), skirting board (y FLOOR_Y-14, height 14, `PALETTE.brown`), floor (FLOOR_Y to 720: horizontal boards 36px tall alternating `PALETTE.orange` and `shade(PALETTE.orange, -0.1)` with dark seams), window (frame `PALETTE.white`, sky gradient `#9fd3ff`->`#e8f6ff`, a sun circle at `0.5 + 0.1*sin(t*0.05)` of the window width, window cross bars, sill), poster (a framed auction poster: cream paper, text lines `CLASSIC CAR` / `AUCTION` / `24th of every month` using label), filing cabinet (grey body with 3 drawers, handles, a `LEDGER` label plate), garage door (panelled door: 5 rows of horizontal panels, a window strip at top, side posts, a handle, a small sign `GARAGE`), desk (top plank with front panel and legs, `PALETTE.brown` tones), a rug (rounded rectangle in `PALETTE.red` with cream border under the desk, x 540..980, y 600..690), TV unit and TV set body (cabinet, stand, bezel around `tvScreen`, knobs; the screen area itself is filled `#0a0a12` — a later card draws the screen content), workshop board (corkboard rect with `WORKSHOP` title and two pinned slips), kettle side table (small table with a kettle shape; kettle drawn by a later card), and a warm lamp glow: a radial gradient `rgba(255,210,122,0.35)` centred on the desk fading to 0.
3. Do not import `kit_draw.js` (it belongs to another card). Write text with `ctx.fillText` directly using `font('title', px)` / `font('body', px)` from `../ui/theme.js`.
4. Write `tests/office_art.test.mjs`: every OFFICE rectangle lies within 0..1280 x 0..720 (x+w <= 1280, y+h <= 720); `OFFICE.hud` is 1280x56; `tvScreen` lies inside `tv`; `phone`, `laptop`, `newspaper` lie within or touch `desk` horizontally/vertically (their bottom edge y+h <= desk.y + 8) ; `drawOfficeStatic(makeCtx(), 0)` does not throw, `count(ctx,'save') === count(ctx,'restore')`, makes at least 40 `fillRect`/`fill` calls, and includes the texts `AUCTION`, `LEDGER`, `WORKSHOP`, `GARAGE`; calling it at `t = 0` and `t = 50` produces different call logs (the sun moves) but the same number of `fillText` calls.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No characters, no animated props, no TV screen content, no calendar, no hotspots.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W52: Office layout and static background`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
