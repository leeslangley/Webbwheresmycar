[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC26 Office scene: draw Mark and Dave from sprites (vector fallback, hit areas unchanged)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC26
Needs (already merged into `dev`): GC23, GC24, W58, GE17
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The office hub shows the sprite Mark (sitting at the desk, facing us) and sprite Dave (leaning on the garage door with the tea) when `app.chars` is a ready char-sprites object (card GC24); otherwise it keeps drawing the old vector characters, so the game works while art is still being rendered. Dave talks his one daily line (the mouth follows the text); Mark shows a mood face and reacts to the day. No hit area changes. (Setting `app.chars` in boot.js is a separate wiring card, shared with the car sprites of S01, owned by the planner.)

## Read first
- src/ui/scenes/office.js (the whole file: draw() and the hit list)
- src/art/officelayout.js (OFFICE.mark, OFFICE.dave, OFFICE.desk)
- src/art/anim.js and src/art/charsprites.js (cards GC23, GC24: createActor, actor.at, drawActor)
- tests/scene_office.test.mjs (freshApp, tap helper, LAYOUT)
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)

## Files you may change (and nothing else)
- `src/ui/scenes/office.js`
- `tests/scene_office_chars.test.mjs`

## Steps
1. In `src/ui/scenes/office.js` add `import { createActor } from '../../art/anim.js';` and keep every old import. Add scene fields `markActor: null`, `daveActor: null`, `lastDay: 0`, all reset in `enter` (`null`, `null`, `0`). Add a module function `ensureActors(scene, app)`: when `app.chars` exists, `app.chars.ready` is true and `app.chars.character('mark')` and `app.chars.character('dave')` are truthy and the actors are still null, create `scene.markActor = createActor(chars.character('mark'), {seed: 1})` and `scene.daveActor = createActor(chars.character('dave'), {seed: 4})`. It returns true when both actors exist, else false.
2. In `draw`, replace ONLY the existing two calls `drawMark(...)` and `drawDave(...)` by: `if (ensureActors(this, app)) { <sprite branch> } else { <the two existing calls unchanged> }`. Keep the `mood` computation that exists. Sprite branch, in this order: (a) `this.markActor.setMood(mood === 'happy' ? 'happy' : (mood === 'worried' ? 'worried' : 'neutral'))`; (b) refresh the day line exactly as the existing code does (move the existing `dayLine` refresh block above the sprite branch; the `speechBubble` call stays where it is); then when `day !== this.lastDay`: set `this.lastDay = day`; `this.daveActor.talk(this.dayLine.line, t)`; Mark's reaction from `daveSit(state)` through the table `{breakdown: 'facepalm', broke: 'slump', newmonth: 'thumbs', auctionday: 'point'}`: when the situation is a key of the table call `this.markActor.react(table[sit], t)` (no reaction for other situations); (c) draw Mark with a clip: `ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1280, OFFICE.desk.y + 6); ctx.clip(); app.chars.drawActor(ctx, 'mark', this.markActor.at(t), OFFICE.mark.x + 60, OFFICE.desk.y + 64, 2); ctx.restore();` (the sprite frame is 144 px tall and its desk-top line is 112 art px down, so the frame bottom sits 32 art px = 64 px below the desk top; the clip hides everything below the desk edge); (d) `app.chars.drawActor(ctx, 'dave', this.daveActor.at(t), OFFICE.dave.x + 48, OFFICE.dave.y + OFFICE.dave.h + 22, 2);` (Dave's feet are 11 art px above his frame bottom).
3. Do NOT change the hit list, `OFFICE`, `LAYOUT`, `pointer`, `key` or the order of any other drawing call (the HUD stays last).
4. Create `tests/scene_office_chars.test.mjs` (fakectx and fakeapp as in tests/scene_office.test.mjs, state from `startGame(3)`). Fake `app.chars` = `{ready: true, character: (id) => CHARS[id], drawActor: (ctx, id, frame, x, y, s) => calls.push([id, x, y, s])}` where each fake character block has a one-frame `idle` clip, `heads` and `head_back` as in the fake of tests/anim.test.mjs. Assert: (1) with `app.chars` set, one `draw` makes exactly two drawActor calls: `['mark', 750, 484, 2]` and `['dave', 1048, 532, 2]`; (2) the number of `clip` calls on a ctx with chars is exactly one more than on a ctx without chars (draw both ways with fresh contexts); (3) without `app.chars` the draw still works and the vector fallback runs (`count(ctx, 'ellipse') > 0`); (4) the hit list is identical with and without chars: compare `JSON.stringify(officeScene.hits.list.map(h => [h.id, h.x, h.y, h.w, h.h]))` after each draw; (5) tapping the TV in the sprite branch still pushes 'tvshop' (down, draw again at another t, up); (6) after the first draw `officeScene.lastDay` equals the state's day; wrap `officeScene.daveActor.talk` with a counter, draw again at a later t on the same day and assert the counter is still 0.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_office` shows PASS for both `scene_office.test.mjs` and `scene_office_chars.test.mjs`.
- `git diff --stat` shows changes only in the two listed files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC26: Office scene: draw Mark and Dave from sprites (vector fallback, hit areas unchanged)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
