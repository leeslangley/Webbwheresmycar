[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W63 Newspaper and month report scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W63
Needs (already merged into `dev`): W45, W47, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
After every action the Daily Sprocket newspaper slides in with the day's headline and what happened. On the first day of a month a second page shows the bills.

## Read first
- docs/DESIGN.md section 4.9, 8.4, 9.4 (today), 9.5, 9.7
- src/core/format.js, src/ui/kit_draw.js (panel, label, paragraph, wrapLines)
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/news.js`
- `tests/scene_news.test.mjs`

## Steps
1. Create `src/ui/scenes/news.js` exporting `newsScene` (id `'news'`, `overlay: true`) and `LAYOUT = {paper:{x:240,y:40,w:800,h:640}, button:{x:480,y:610,w:320,h:56}}`.
2. Params: `{readOnly: false}`. State used: `app.state.today` (`headline`, `events`, `monthReport`) and `state.day`. Pages: page 1 = newspaper; page 2 = month report (only when `today.monthReport` exists and not `readOnly`).
3. Page 1: dim the whole screen with `rgba('#000000',0.6)`; the paper (`PALETTE.paper`, ink border, slight rotation of -2 degrees about its centre, and an entrance animation over 0.35s from enter time: scale 0.6->1 and rotation from -20 degrees -> -2 degrees, using `app.now() - enteredAt`; store `enteredAt` in `enter`). Masthead `THE DAILY SPROCKET` (title font 30px) with a rule, a dateline `<dateText(day)>  -  Price: one pound fifty`, the headline wrapped in big title font (24px, upper case) at the top, then a divider and `TODAY IN WEBB'S WHEELS:` followed by up to 6 event lines from `today.events` (body 26px, bullet `* `, events containing `GOLD NUMBER PLATE` drawn in `PALETTE.gold` shadowed); if more than 6, append `...and more`. Button `CONTINUE` (title font) at the bottom; if `readOnly` it says `BACK`.
4. Page 2 (month report): `MONTH END: <MONTHNAME in upper case>` heading and lines `Rent <money>`, `Running costs <money>`, `Garage lease <money>`, `TOTAL <money>` (bold/title font), `Cash now <money>`, and each of `newFaults` as `Fault: <text>` (max 4). Button `CONTINUE`.
5. Behaviour: tap (up event) anywhere or key Enter/Space/Escape advances: page 1 -> page 2 if present, otherwise `app.pop()`. For `readOnly` always pop on the first advance. Also call `app.audio.play('paper')` in `enter`. After popping, if `app.state.flags.gameOver` the game flow card handles the redirect; this scene does nothing extra.
6. Write `tests/scene_news.test.mjs` with a hand-made state `{day:5, today:{headline:'VICAR VANISHES: VERGER VEXED', events:['Bought the Mini for £9,000'], monthReport:null}, flags:{gameOver:false}}`: texts include `THE DAILY SPROCKET`, the dateline `5 January`, the headline text (or its wrapped pieces joined with spaces equals the headline), the event line; one tap pops (`['pop']` recorded); with a `monthReport` (`{month:1, monthName:'January', rent:1000, running:460, lease:400, total:1860, cashAfter:18140, newFaults:['Mini: Flat battery']}`) the first tap does NOT pop and the second does; page 2 texts include `MONTH END: JANUARY`, `£1,860`, `£18,140`, `Fault: Mini: Flat battery`; `readOnly` pops on the first tap and its button says `BACK`; GOLD NUMBER PLATE events are drawn with `PALETTE.gold` (check via `anySet`); 8 events show `...and more`; `enter` plays `paper` (`['play','paper']`); the animation: draw at `app.now = 0` and `app.now = 1000` gives different logs.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No sim changes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W63: Newspaper and month report scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
