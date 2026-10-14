[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC06 Car effects: shadow, reflection, shine, steam, exhaust

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC06
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The small drawing effects that make a car sit in a room: contact shadow, floor reflection, glossy shine sweep, bonnet steam for a faulty car, exhaust smoke for a wreck. Every function draws through ctx only, so fakectx can check them.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/art/common.js (groundShadow, smokePuff for style)
- tests/fakectx.js (makeCtx, count, anySet)

## Files you may change (and nothing else)
- `src/art/carfx.js`
- `tests/carfx.test.mjs`

## Steps
1. `drawContactShadow(ctx, x, y, w, p)`: save; `fillStyle='rgba(0,0,0,0.22)'`, beginPath, `ctx.ellipse(x, y, w*0.52, p*5, 0, 0, Math.PI*2)`, fill; `fillStyle='rgba(0,0,0,0.35)'`, ellipse(x, y, w*0.42, p*3 ...), fill; restore. (x,y) is the ground point, w the sprite width, p the sprite pixel size.
2. `drawReflection(ctx, img, x, y, w, h)`: save; `imageSmoothingEnabled=false`; `globalAlpha=0.16`; beginPath, `rect(x - w/2, y, w, Math.round(h*0.4))`, clip; `translate(x, y)`; `scale(1, -1)`; `drawImage(img, -w/2, -h, w, h)`; restore. `drawShine(ctx, layer, x, y, w, h, t)`: `phase = (t % 4) / 0.7`; if `phase >= 1` return false. `bw = w*0.16`, `bx = x - w/2 - w*0.2 + phase * w*1.4`, `skew = h*0.5`; save; path (bx,y-h) (bx+bw,y-h) (bx+bw-skew,y) (bx-skew,y) closePath, clip; `globalAlpha=0.55`; `drawImage(layer, x - w/2, y - h, w, h)`; restore; return true.
3. `drawSteam(ctx, x, y, t, p)`: 5 puffs `i=0..4`: `ph = (t*0.8 + i/5) % 1`; `px = x + Math.sin((ph + i) * 5) * 3 * p`; `py = y - ph * 30 * p`; `s = p * (2 + ph*3)`; `fillStyle = 'rgba(235,235,235,' + ((1-ph)*0.5).toFixed(3) + ')'`; `fillRect(Math.round(px), Math.round(py), s, s)`. `drawExhaust(ctx, x, y, t, p, dir)`: same loop with 4 puffs, colour `rgba(40,40,44,a)` (a = (1-ph)*0.6), travelling `dir * ph * 26 * p` in x (dir is -1 for a car facing right, +1 when flipped) and up `ph * 8 * p`.
4. `tests/carfx.test.mjs` (makeCtx): shadow makes 2 `ellipse` and 2 `fill` calls and balanced save/restore (count save === count restore); reflection: one `drawImage` whose args are `(img, -w/2, -h, w, h)`, one `clip`, `imageSmoothingEnabled` set false and `globalAlpha` 0.16 before it; shine returns false at t=0.8 and true at t=0.2, with one `clip` and one `drawImage` of the layer when true, none when false; at t=0.2 the first path x is less than at t=0.6 (band moves right: read the `moveTo` x); steam draws exactly 5 `fillRect`, exhaust exactly 4; all fillRect positions are finite numbers (no NaN) for t in {0, 1.7, 99}.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep carfx` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC06: Car effects: shadow, reflection, shine, steam, exhaust`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
