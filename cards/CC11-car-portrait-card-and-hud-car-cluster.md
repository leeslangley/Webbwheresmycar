[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC11 Car portrait card and HUD car cluster

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC11
Needs (already merged into `dev`): CC07, CC08
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The 'band of faces' of our game: classic cars as big framed portraits. `drawCarPortrait` is the reusable card for lists, the HUD and the TV; `drawHudCar` is the persistent HUD slot (the selected car in front, the other owned cars peeking out behind it like the group of faces in the original's bottom strip).

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- docs/art/RSAMH_STYLE.md (point 3: the HUD portrait cluster)
- src/art/modelcar.js (drawModelCar, CC07)
- src/ui/kit_draw.js (label)
- src/data/cars.js (modelOf: tier, name)

## Files you may change (and nothing else)
- `src/art/carportrait.js`
- `tests/carportrait.test.mjs`

## Steps
1. `src/art/carportrait.js`: `drawCarPortrait(ctx, r, modelId, opts = {})`, opts `{cond, paint, name:true, selected, dim, fault, t}`. Draw: 3 px `PALETTE.ink` frame (`fillRect` ink, then inner rect inset 3), backdrop vertical gradient from `shade(c, 0.25)` to `shade(c, -0.25)` where `c` = tier colour (`PALETTE.lightblue` tier 1, `PALETTE.lightred` tier 2, `PALETTE.gold` tier 3), a floor strip `rgba(0,0,0,0.28)` over the bottom 24% of the inner rect, then `drawModelCar(ctx, modelId, r.x + r.w/2, r.y + Math.round(r.h*0.76), 1, {paint, cond, t, sheet:'S', slot:{w: r.w - 12, h: Math.round(r.h*0.58)}, shadow:true})`. When `opts.name !== false` draw the model name with `label` (size 10, title font, centred, maxW r.w - 8) at `y = r.y + r.h - 16`, preceded by a dark strip `rgba(0,0,0,0.45)` 16 px high. Condition pips: 5 squares 6x6 at the top-left (`r.x + 8 + i*9, r.y + 8`), filled `PALETTE.good` for `i < Math.round(cond/2)` else `PALETTE.darkgrey`. `fault`: red `!` badge (`PALETTE.bad` 16x16 square with white `!` text) top-right. `selected`: 3 px `PALETTE.lamp` outline outside the frame. `dim`: finish with `fillRect` `rgba(20,16,42,0.45)` over the card.
2. `hudCarOf(cars, selectedId, t)` (pure): returns the car object whose `id === selectedId`; when none matches returns `cars[Math.floor(t / 6) % cars.length]`; returns null for an empty list. `drawHudCar(ctx, r, cars, selectedId, t)`: `main = hudCarOf(...)`. With no cars: dashed frame (`setLineDash([6,6])`, `PALETTE.midgrey`, `strokeRect`) and centred text `NO CAR` size 12 title font, return. Otherwise draw up to 2 other cars as dim portraits first (`i = 2` then `1`): rect `{x: r.x - 28*i, y: r.y + 6*i, w: r.w, h: r.h - 6*i}`, `name:false, dim:true`; then the main portrait over them with `selected: true`.
3. `tests/carportrait.test.mjs` (fake art from tests/fakecarart.js, ds=1; makeCtx): portrait rect `{x:100,y:100,w:168,h:104}` for `t2_zed` cond 9: exactly one `drawImage`, drawn image id starts with `t2_zed_s|` (S sheet forced) with width <= 156 and height <= 60; the name text appears (`texts`) and 5 pip fillRects exist; `fault:true` adds the text `!`; `dim:true` ends with a `fillRect` of colour `rgba(20,16,42,0.45)`; no `fillRect` outside the rect expanded by 4 px (selected outline excepted: assert for `selected` false); uninstall art: no `drawImage`, still no throw. `hudCarOf([{id:'c1'},{id:'c2'}], 'c2', 0).id === 'c2'`; with `'zz'` at t=0 returns c1 and at t=6.5 returns c2; empty list returns null. `drawHudCar` with 3 cars: 3 `drawImage` calls (one per car), the last one is the selected car; with `[]`: text `NO CAR` and zero drawImage.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep carportrait` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC11: Car portrait card and HUD car cluster`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
