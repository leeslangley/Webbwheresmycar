[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W61 Advertising scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W61
Needs (already merged into `dev`): W45, W46, W47, W50, W40, W12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark's laptop: pick where to advertise. Shows the cost, how much it usually pays and how risky it is.

## Read first
- docs/DESIGN.md section 4.8, 8.1, 9.5, 9.7
- src/sim/adsim.js, src/data/adverts.js, src/ui/kit_draw.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/adverts.js`
- `tests/scene_adverts.test.mjs`

## Steps
1. Create `src/ui/scenes/adverts.js` exporting `advertsScene` (id `'adverts'`) and `LAYOUT = {list:{x:40,y:110,w:600,h:520}, rowH:70, detail:{x:660,y:110,w:580,h:420}, run:{x:660,y:560,w:580,h:70}, back:{x:40,y:650,w:200,h:50}}`.
2. Look: a laptop screen (bezel and a desktop-blue background). Title `ADVERTISING` and `BUZZ <n>` with a bar. Seven rows for the media: name (body 30px), cost (`money`) right-aligned, and two small indicator lines under the name: `PAYS` = stars (use `stars` from core/format with value `Math.round(expectedBuzz/10)` clipped to 10) where `expectedBuzz = sum(w*buzz)/100` and `RISK` = `Math.round(flopChance)` percent where `flopChance` = sum of weights of outcomes with `buzz <= 5`. Selected row outlined. Detail panel: the medium's `blurb` (wrapped), `Cost <money>`, `Typical buzz +<expectedBuzz rounded>`, `Chance of a flop <risk>%`, and a line about the best outcome (`Best case +<max buzz> buzz`).
3. Button `RUN ADVERT <money>` (primary) calls `app.act(() => advertise(app.state, mediaId))`; disabled with toast `Not enough money` when `cash < cost`. BACK pops. Keyboard Up/Down, Enter, Escape.
4. Write `tests/scene_adverts.test.mjs` using `startGame(4)`: all 7 media names appear; `PAYS` and `RISK` texts appear; selecting `tv` shows `Cost £4,000`; running paper advertising (select row 0, tap RUN) leaves `state.day === 2`, `stats.adsRun === 1` and cash 150 lower; running `tv` with cash 100 toasts `Not enough money` and changes nothing; the expected buzz text for `tv` shows `Typical buzz +55` (54.5 rounds to 55); the RISK shown for `youtube` is `55%`; Escape pops.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to sim files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W61: Advertising scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
