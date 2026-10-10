[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W50 Car drawer core: flat shapes

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W50
Needs (already merged into `dev`): W48, W49
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First third of the car drawer: draw a side-on car from its profile using FLAT colours only (no gradients, clipping or wear effects yet; later cards add them). This card only gets the geometry, wheels, lights and bumpers right.

## Read first
- docs/ART_SPEC.md (profiles and the rendering recipe, steps 1, 4 (flat colours only), 6)
- src/art/profiles.js (PROFILES, profileOf), src/art/common.js (roundedPoly, wheel, groundShadow, circle)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/cardraw.js`
- `tests/cardraw.test.mjs`

## Steps
1. Create `src/art/cardraw.js` with this structure (imports: `profileOf` from `./profiles.js`; `roundedPoly, wheel, groundShadow, circle` from `./common.js`). Export `drawCar(ctx, archetype, x, y, scale, opts = {})`:
```js
export function drawCar(ctx, archetype, x, y, scale, opts = {}) {
  const p = profileOf(archetype);              // throws for an unknown archetype
  const o = { body: '#9a2a2a', roof: null, stripe: null, wheel: '#c9ccd2', cond: 10, t: 0 };
  for (const key in opts) o[key] = opts[key];  // plain copy of the options
  const k = p.lengthPx / 100 * scale;           // pixels per car unit
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, -k);                             // car units, y points up
  groundShadow(ctx, 0, 0, 52, 3, 0.35);
  // 1) parts in array order, flat colours
  // 2) wheels
  // 3) bumpers, headlight, tail light
  ctx.restore();
}
```
2. Part drawing (for each `part` of `p.parts`, in order): `body`: `roundedPoly(ctx, part.pts, part.r)` then `ctx.fillStyle = o.body; ctx.fill()`. `glass`: roundedPoly, fillStyle `#9fc5d6`, fill. `dark`: roundedPoly, fillStyle `#1a1a22`, fill. `chrome`: roundedPoly, fillStyle `#d8d8de`, fill. `line`: `ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.4; ctx.stroke();`.
3. Wheels: `for (const w of p.wheels) wheel(ctx, w.x, w.r, w.r, o.t, w.dim === true);` (the wheel centre is at `(w.x, w.r)` so it sits on the ground).
4. Bumpers: `ctx.fillStyle = '#d8d8de'; ctx.fillRect(-51, 6, 2, 4); ctx.fillRect(49, 6, 2, 4);`. Headlight: `circle(ctx, p.head.x, p.head.y, p.head.r)` then fillStyle `#fff6c0`, fill. Tail light: `ctx.fillStyle = '#c0282d'; ctx.fillRect(p.tail.x - p.tail.w / 2, p.tail.y - p.tail.h / 2, p.tail.w, p.tail.h);`.
5. Also export `carBounds(archetype, scale)` returning `{w, h}` in pixels: `w = p.lengthPx * scale`; `h = (maxY + 2) * (p.lengthPx / 100) * scale` where `maxY` is the largest y of any point of any part.
6. Write `tests/cardraw.test.mjs` (use `makeCtx`, `count`, `anySet` from `./fakectx.js`): for each of the 13 archetypes (micro, saloon, beetle, hatch, roadster, coupe, longnose, wedge, gullwing, tourer, limo, boxy, trike) `drawCar(ctx, a, 400, 300, 1, {})` does not throw and `count(ctx,'save') === count(ctx,'restore')`; the first `translate` call has args `[400, 300]` and the first `scale` call args are (use `near`) `[lengthPx/100, -lengthPx/100]` for scale 1 (saloon: 4.2 and -4.2); the number of `set:fillStyle` calls with value `#15151a` (the tyre colour) equals the number of wheels: 3 for `trike`, 2 for every other archetype; `anySet(ctx,'fillStyle','#9a2a2a')` is true by default and `anySet(ctx,'fillStyle','#112233')` is true when `opts.body = '#112233'`; an unknown archetype throws; `carBounds('micro', 1).w === 300`; `carBounds('saloon', 2).w === 840`; `carBounds('saloon', 1).h` is between 120 and 200; `drawCar` with scale 0.5 translates to the same x,y but scales by half.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No gradients, clip, roof, stripe, arches, rust or smoke (cards W50b and W50c). Do not edit profiles.js or common.js.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W50: Car drawer core: flat shapes`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
