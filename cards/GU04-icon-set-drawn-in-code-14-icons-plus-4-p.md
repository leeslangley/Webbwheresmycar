[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU04 Icon set drawn in code: 14 icons plus 4 plate discs

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU04
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pixel icons stored as text bitmaps and drawn with merged fillRect runs: money, rep star, buzz bolt, calendar, wrench, key, telephone, newspaper, tick, cross, padlock, warning, fuel can, tyre, and the four Gold Number Plate discs (fat cat, stable horseshoe, household house, hammer mallet). Designed by the planner and checked by eye already: copy the bitmaps EXACTLY.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/icons.js`
- `tests/icons.test.mjs`

## Steps
1. `src/ui/icons.js` (no imports needed). Const `ICON_DATA`: each entry is `name: 12 rows` (utility icons, 12x12 cells) or `16 rows` (plate_* icons, 16x16 cells), rows separated by `|`, a '.' is transparent. Copy EXACTLY (one string per name, any quoting you like):
coin: ...oooooo...|..oYYYYYyo..|.oYYyyooyyo.|.oYyyoyyyyd.|.oYyyoyyyyd.|.oYyooooyyd.|.oYyyoyyyyd.|.oYyyoyyyyd.|.oYyoooooyd.|.oyyyyyyydo.|..oddddddo..|...oooooo...
star: ............|.....oo.....|....oYyo....|....oYyo....|ooooyYyyoooo|.oYYYyyyyyo.|..oYYyyyyo..|...oyyyyo...|...oyyddo...|..oyyoodyo..|..oyo..oyo..|..ooo..ooo..
buzz: .......oooo.|......oYYyo.|.....oYYyo..|....oYYyo...|...oYYyoooo.|..oYYYYyyYo.|..ooooYYyo..|.....oYYo...|....oYyo....|...oYyo.....|..oyyo......|..ooo.......
calendar: ..o......o..|.oloooooolo.|ooRRRRRRRRoo|orRRRRRRRRRo|ocwwwwwwwwco|ocwoowowowco|ocwwwwwwwwco|ocwowowoowco|ocwwwwwwwwco|ocwoowowrwco|ocwwwwwwwwco|.oooooooooo.
wrench: ......ooo...|....oollllo.|...olloooll.|...ollo.olo.|....olloll..|...oolllo...|..oolllo....|.oollko.....|.olllko.....|oollko......|olkko.......|.oo.........
key: ...oooo.....|..olllllo...|.olloooll...|.oloo.ool...|.oll.ollo...|..olllloo...|....olko....|....olko....|....olkooo..|....olkllo..|....olkooo..|.....ooo....
phone: ..oooooooo..|.orrrrrrrrro|orrrRRRRrrro|oooooooooooo|.oRRRooRRRo.|..oRRoooRo..|...ooooooo..|..oowwwwoo..|.owwwwwwwwo.|.owowowowwo.|.owwwwwwwwo.|..oooooooo..
paper: ............|.ooooooooooo|.occccccccco|.ocoooccccco|.occccccccco|.ocooooooooo|.occccccccco|.ocooooocooo|.occccccccco|.ocooooooooo|.occccccccco|.oooooooooo.
tick: ............|..........oo|.........ogo|........oggo|........oggo|oo.....oggo.|ogo...oggo..|ogGo.oggo...|.ogGoggo....|..ogggo.....|...ogo......|....o.......
cross: ............|.oo......oo.|.orro..orro.|..orro.orro.|...orrorro..|....orrro...|....orrro...|...orrorro..|..orro.orro.|.orro..orro.|.oo......oo.|............
padlock: ...oooooo...|..olllllko..|..ol....ko..|..ol....ko..|.oooooooooo.|.oyYYYYYYdo.|.oyYYooYYdo.|.oyYYooYYdo.|.oyYYYoYYdo.|.oyyyyyyydo.|.oddddddddo.|..oooooooo..
warning: .....oo.....|....oyyo....|...oyyyyo...|...oyooyo...|..oyyooyyo..|..oyyooyyo..|.oyyyooyyyo.|.oyyyyyyyyo.|oyyyyooyyyyo|oyyyyooyyyyo|oyyyyyyyyyyo|oooooooooooo
fuel: ..oooooo....|.orrrrrRo.o.|.orwwwwRooRo|.orwwwwRo.Ro|.orwwwwRo.Ro|.orrrrrRo.Ro|.orrrrrRooRo|.orrrmrRo.o.|.orrrmrRo...|.orrrrrRo...|.oRRRRRRo...|..oooooo....
tyre: ....oooo....|..ooookoooo.|.ookkkkkkkoo|.okkoooookko|okkoollloko.|okkolwwlokko|okkolwwlokko|okkoollloko.|.okkoooookko|.ookkkkkkkoo|..ooookoooo.|....oooo....
plate_fatcat: .....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.oooYYYYyyyyooo.|.oYooYYyyyyoodo.|oYYooooooooooydo|oYYooooooooooydo|oYYooyoooyoooddo|oYYooooooooooddo|oYyooooyyooooddo|oyyooooooooooddo|.oyoyoooooyoodo.|.ooyoooooooodoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....
plate_stable: .....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.ooooYYYyyyoooo.|.oYooYYyyyyoodo.|oYYooYyyyyyooydo|oYYooyyyyyyooydo|oYYooyyyyyyooddo|oYYooyyyyyyooddo|oYyyooyyyyoodddo|oyyyyooooooddddo|.oyyyyooooddddo.|.ooyyyyydddddoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....
plate_household: .....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.ooYYYYooyyyyoo.|.oYYYYooooyyydo.|oYYYYooooooyyydo|oYYYooooooooyydo|oYYooooooooooddo|oYYyoooooooodddo|oYyyoooyyooodddo|oyyyoooyyooodddo|.oyyoooyyoooddo.|.ooyoooooooodoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....
plate_hammer: .....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.ooYYooooooyyoo.|.oYYooooooooydo.|oYYYooooooooyydo|oYYYYooooooyyydo|oYYYyyyooyyyyddo|oYYyyyyooyyydddo|oYyyyyyooyyddddo|oyyyyyyooydddddo|.oyyyoooooodddo.|.ooyyooooooddoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....
Split each string on '|' into a rows array once at module load. Export `ICON_NAMES` = the 18 names in the order listed above (coin, star, buzz, calendar, wrench, key, phone, paper, tick, cross, padlock, warning, fuel, tyre, plate_fatcat, plate_stable, plate_household, plate_hammer).
2. Const `ICON_PAL` mapping the letters to colours: o '#14102A', w '#FFFFFF', y '#E8B923', Y '#FFE27A', d '#A57A12', g '#3FAE49', G '#1F6B2E', r '#D9483B', R '#8E2A22', l '#C9CCD2', k '#6C6C6C', c '#F4E9C8', m '#F2A93B'. Grey variant (used for plates not yet won): when opts.grey is true map Y -> '#B8B8B8', y -> '#959595', d -> '#6C6C6C' (all other letters unchanged).
3. Export `iconCells(name)` -> number of non-'.' cells (throw Error('bad icon') for an unknown name) and `iconSize(name)` -> 12 or 16. Export `drawIcon(ctx, name, x, y, size, opts)`: opts {alpha:1, grey:false}; cell = size / iconSize(name); for each row, merge horizontal runs of the SAME letter into one `ctx.fillRect(x + cx*cell, y + row*cell, runLen*cell, cell)`, setting `ctx.fillStyle` only when the colour differs from the previous run; when opts.alpha < 1 wrap everything in save, `globalAlpha = alpha`, restore. Returns nothing.
4. `tests/icons.test.mjs`: ICON_NAMES has 18 entries; iconCells equals this exact table (a transcription check): coin 108, star 72, buzz 63, calendar 130, wrench 68, key 69, phone 114, paper 120, tick 50, cross 64, padlock 100, warning 102, fuel 106, tyre 116, plate_fatcat 208, plate_stable 208, plate_household 208, plate_hammer 208. Every row of every icon has the right length (12 or 16) and the right row count. drawIcon(ctx,'coin',0,0,24) makes exactly 55 fillRect calls (runs), 'cross' 44, 'tick' 40, 'star' 43; every fillRect lies inside [0,24] x [0,24]; every fillStyle used is a value of ICON_PAL. drawIcon(ctx,'plate_hammer',100,50,48) uses cell 3 (some fillRect has height 3) and stays inside [100,148] x [50,98]; with {grey:true} the fillStyles include '#B8B8B8' and not '#FFE27A'; without grey they include '#FFE27A'. drawIcon with alpha 0.5 sets globalAlpha 0.5 then back (last `set:globalAlpha` is 1 or restore is called). drawIcon(ctx,'nope',0,0,12) throws.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/icons.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Any scene or HUD (later cards use the icons).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU04: Icon set drawn in code: 14 icons plus 4 plate discs`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
