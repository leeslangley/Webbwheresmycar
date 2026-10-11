[Project: Webbwheresmycar]
# Task: [GLM-SPARK] Sparks-alias-glm-5.3-flash W66 Year end and game over scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W66
Needs (already merged into `dev`): W45, W47, W29, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (Sparks-alias-glm-5.3-flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The end screen for winning, running out of year, or going bankrupt.

## Read first
- docs/DESIGN.md section 4.11, 9.5, 9.7
- src/sim/endgame.js (finalScore, rankOf, netWorth, PLATE_INFO)
- src/core/format.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. TAP RULE (a bug found in review of the title screen, obey it exactly): the screen is redrawn many times between a finger-down and its finger-up, so never keep the pressed hit as an object and NEVER reset the pressed state inside `draw`. On `'down'` do `const h = this.hits.hit(x, y); this.pressed = h ? h.id : null;` (remember the hit's ID). On `'up'` do `const e = this.hits.hit(x, y); if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') e.onTap(e); this.pressed = null;`. Reset `this.pressed` only in `enter` and after `'up'`. Scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up and treat `endDrag().tapped` as the tap signal. Every scene test file MUST contain a test that does down, then calls `draw` again with a different `t`, then up, and expects the action to fire exactly once.

## Files you may change (and nothing else)
- `src/ui/scenes/endgame.js`
- `tests/scene_endgame.test.mjs`

## Steps
1. Create `src/ui/scenes/endgame.js` exporting `endgameScene` (id `'endgame'`) and `LAYOUT = {again:{x:340,y:610,w:280,h:60}, title:{x:660,y:610,w:280,h:60}}`.
2. Heading by `state.flags.reason`: `'won'` -> `GOLD! MARK'S A LEGEND` with confetti (deterministic falling rectangles from `t`), `'year-end'` -> `THE YEAR IS UP`, `'bankrupt'` -> `BANKRUPT! THE BAILIFFS ARRIVE` (with a drifting grey cloud). A subline in body font: won: `All four Gold Number Plates in one year. Mark buys a round.`; year-end: `The bank manager is smiling politely.`; bankrupt: `Dave takes the kettle. Mark takes the bus.`
3. Below: `Final score <n>`, `Rank: <rankOf(score)>` (prefix `GOLD ` when won), `Net worth <money>`, `Reputation <n>`, `Jobs done <n>`, the four plates (name, `WON` gold or `missed` grey), and best auction sale. Buttons `PLAY AGAIN` (-> `app.newGame()`) and `TITLE` (-> `app.go('title')`).
4. Write `tests/scene_endgame.test.mjs`: with a state whose `flags = {gameOver:true, won:true, reason:'won'}` and all plates won the text includes `GOLD! MARK'S A LEGEND` and a rank starting `GOLD`; reason 'year-end' shows `THE YEAR IS UP`; 'bankrupt' shows `BANKRUPT! THE BAILIFFS ARRIVE`; final score and rank text match `finalScore(state)`/`rankOf(...)` for a fresh state with cash set to 50000 (compute the expected strings in the test with those functions and compare); PLAY AGAIN records `['newGame']`; TITLE records `['go','title',undefined]`; draw at two times gives different logs when won (confetti moves).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No sim changes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W66: Year end and game over scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
