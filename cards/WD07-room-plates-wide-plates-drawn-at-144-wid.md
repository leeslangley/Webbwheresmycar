[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD07 Room plates: wide plates drawn at -144, wide manifest first

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD07
Needs (already merged into `dev`): GE13, WD01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The room plate loader learns wide plates: 784x360 art pixels drawn x2 is 1568x720, drawn at stage x -144 so the central 1280 is the old plate and 144 px of room continues on each side (the canvas crops what a narrower screen does not need). It loads `assets/art/rooms/wide/manifest.json` first and falls back per room to the narrow `assets/art/rooms/manifest.json`, so the game works with only narrow plates, only wide plates, or a mix. TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: after GE13 (it extends rooms.js) and WD01. The six GE scene cards (GE17 to GE23) need NO edit: they call `app.rooms.draw(ctx, id, {look})` which now handles both widths; the strips of a narrow plate are filled by WD04's smear.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/art/rooms.js (GE13: `createRooms(env)`, `PARALLAX`, `load`, `has`, `info`, `draw`, `drawFront`) and tests/rooms.test.mjs (its fake loaders and how it awaits `load()`: copy that style; every GE13 test must stay green)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/art/rooms.js`
- `tests/rooms_wide.test.mjs`

## Steps
1. In `src/art/rooms.js`: `load()` now reads TWO manifests with `env.loadJson`: first `assets/art/rooms/wide/manifest.json`, then `assets/art/rooms/manifest.json`; each may reject or be missing (ignore it, never reject). For every id the WIDE entry wins when it exists, and its images load from `assets/art/rooms/wide/<file>` (and `<front>`); an id only in the narrow manifest loads from `assets/art/rooms/<file>` exactly as in GE13. Keep a private map id -> {dir, entry}. `info(id)` still returns exactly `{w, h, scale, hasFront}` (do not add keys: GE13's test deep-equals it).
2. Add `plateX(id)`: unknown id or a plate whose `w * scale <= 1280` returns 0; otherwise `-((w * scale - 1280) / 2)` (784 wide at scale 2 gives -144). In `draw` replace the destination x `0` of the single `drawImage` by `plateX(id)` (still `(img, x, 0, w * scale, h * scale)`; a narrow plate still gives `(img, 0, 0, 1280, 720)`). In `drawFront` the x becomes `plateX(id) + Math.round(-look.x * PARALLAX.front.x)` (y unchanged).
3. `tests/rooms_wide.test.mjs` with fake loaders recording urls (images are `{url, width, height}`; the loaders resolve by url from two maps). Case A: wide manifest {office:{file:'office.png', w:784, h:360, scale:2, front:'office_front.png'}} and narrow manifest {office:{file:'office.png',w:640,h:360,scale:2,front:'office_front.png'}, garage:{file:'garage.png',w:640,h:360,scale:2}}: after `await load()` the office image url is 'assets/art/rooms/wide/office.png' and the garage url 'assets/art/rooms/garage.png'; `draw(ctx,'office')` makes one `drawImage` with args (officeImg,-144,0,1568,720); `draw(ctx,'garage')` (garageImg,0,0,1280,720); `plateX('office')` is -144, `plateX('garage')` 0, `plateX('zzz')` 0; `info('office')` deep-equals {w:784,h:360,scale:2,hasFront:true}; `drawFront(ctx,'office',{look:{x:1,y:-1}})` draws at x -150 and y 3; `drawFront(ctx,'office',{look:{x:0,y:0}})` at -144, 0.
4. Case B: the wide loader rejects: office draws at (0,0,1280,720) from the narrow url. Case C: the narrow manifest rejects but the wide exists: office draws wide, `has('garage')` is false and `draw(ctx,'garage')` returns false with no drawImage. Case D: both reject: `load()` still resolves, `has('office')` false. In every case `save` count equals `restore` count and `imageSmoothingEnabled` was set to false.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/rooms_wide.test.mjs'` prints one line.
- `make test 2>&1 | grep 'PASS tests/rooms.test.mjs'` prints one line (GE13's tests unchanged).
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- assets (WD10 builds the wide plates); any scene; boot.js.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD07: Room plates: wide plates drawn at -144, wide manifest first`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
