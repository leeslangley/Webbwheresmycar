[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W50b Car drawer finish: paint, glass, arches

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W50b
Needs (already merged into `dev`): W50
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Second third of the car drawer: make the flat car look like a painted car: body gradient, roof colour, stripe, wheel arches, glass and chrome gradients.

## Read first
- docs/ART_SPEC.md (rendering recipe, steps 3 to 5)
- src/art/cardraw.js (existing from W50: build on it, do not rewrite)
- src/art/common.js (vgrad, roundedPoly), src/ui/theme.js (shade)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/cardraw.js`
- `tests/cardraw_finish.test.mjs`

## Steps
1. Edit `src/art/cardraw.js` (import `vgrad` from `./common.js` and `shade` from `../ui/theme.js`). Keep the existing structure and the existing exports. Change the part drawing like this:
- helper `yRange(pts)` returns `{minY, maxY}` of a point list.
- `body`: `roundedPoly`, then `ctx.fillStyle = vgrad(ctx, minY, maxY, shade(o.body, 0.25), shade(o.body, -0.25)); ctx.fill();` then a thin dark outline (`ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.35; ctx.stroke();`). Note `vgrad` takes y0 then y1 and the gradient runs from y0 (stop 0) to y1 (stop 1); because the car's y axis points up, pass `maxY` as y0 and `minY` as y1 so the light colour is at the top of the car.
- roof repaint: if `o.roof` is set, after the body fill do `ctx.save(); roundedPoly(ctx, part.pts, part.r); ctx.clip(); ctx.fillStyle = o.roof; ctx.fillRect(-51, minY + (maxY - minY) * 0.65, 102, maxY); ctx.restore();`.
- stripe: if `o.stripe` is set, `ctx.save(); roundedPoly(...); ctx.clip(); ctx.fillStyle = o.stripe; const sy = minY + (maxY - minY) * 0.6; ctx.fillRect(-51, sy - 1.2, 102, 2.4); ctx.restore();`.
- `glass`: fill with `vgrad(ctx, maxY, minY, '#cfe8f2', '#6f9fb4')`, then a faint diagonal highlight: `ctx.fillStyle = 'rgba(255,255,255,0.25)'` and a thin parallelogram using the glass part's bounding box (two moveTo/lineTo pairs, fill).
- `chrome`: fill with `vgrad(ctx, maxY, minY, '#f2f2f2', '#8d8d95')`.
- `dark` and `line` stay as they are.
2. Wheel arches: after ALL parts are drawn and BEFORE the wheels, for each wheel `w`: `ctx.save();` clip to the first `body` part polygon (`roundedPoly` + `ctx.clip()`), then `circle(ctx, w.x, w.r, w.r * 1.18); ctx.fillStyle = '#101014'; ctx.fill(); ctx.restore();`.
3. Wheel rim colour option: after drawing each wheel add a thin ring in the rim colour: `circle(ctx, w.x, w.r, w.r * 0.62); ctx.strokeStyle = o.wheel; ctx.lineWidth = w.r * 0.06; ctx.stroke();` (skip for `dim` wheels).
4. Write `tests/cardraw_finish.test.mjs` (makeCtx, count, anySet): for every archetype, drawing with default options still does not throw and save/restore stay balanced; default drawing creates at least one linear gradient (`count(ctx,'createLinearGradient') >= 2`) for every archetype (body and glass); with `opts.roof = '#ffffff'` the fillStyle `#ffffff` is assigned and `count(ctx,'clip')` is larger than without a roof; with `opts.stripe = '#ff0000'` the fillStyle `#ff0000` is assigned and `count(ctx,'clip')` is larger than without; the arch colour `#101014` is assigned for every archetype (2 wheels -> at least 2 times, trike -> at least 3 times); `opts.wheel = '#abcdef'` assigns strokeStyle `#abcdef`; a body colour `#336699` produces the lighter shade `shade('#336699', 0.25)` somewhere in a gradient's stops (`ctx.calls` contains a createLinearGradient call and the returned gradient is not accessible, so instead assert that `anySet(ctx,'fillStyle','#336699')` is FALSE (the body is now filled with a gradient object) when `opts.body = '#336699'` and `count(ctx,'createLinearGradient')` is at least 2).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `tests/cardraw.test.mjs` from W50 still passes, EXCEPT its assertion that the body colour string is assigned to fillStyle: update that one assertion to the new behaviour (the body is a gradient built from the colour, so check that `createLinearGradient` was called instead) and keep every other assertion.

## Out of scope (do not touch)
- No rust or smoke (W50c). Do not edit profiles.js or common.js.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W50b: Car drawer finish: paint, glass, arches`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
