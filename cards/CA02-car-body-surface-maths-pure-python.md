[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA02 Car body surface maths (pure python)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA02
Needs (already merged into `dev`): V01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One pure-python class that answers 'where is the body surface?' (top, bottom, half width at any x and height). The lofted body and every detail part use it, so a lamp or a handle always sits ON the body. No Blender, so it is fast to test.

## Read first
- tests/fixtures/dossier_ok.json and docs/cars/t1_chimp.json (a dossier: `side_profile`, `plan`)
- docs/CAR_DOSSIER_SPEC.md (coordinates)

## Files you may change (and nothing else)
- `tools/art/surface.py`
- `tests/test_surface.py`

## Steps
1. `tools/art/surface.py`, python3 stdlib only. `class Surface(dossier, belt_y=None)`: `self.xmin/xmax` = min/max x of `side_profile`; `self.w0 = plan.width_units/2`; `self.belt` = belt_y or 0.62 * the max profile y. `top(x)`/`bottom(x)`: collect y for every polygon vertex with |vx-x| < 1e-6 plus the intersection y of every edge with (x1-x)*(x2-x) < 0; top = max, bottom = min; x is clamped to [xmin, xmax]; if nothing is found return the nearest end value.
2. `taper(x)`: `tt = (x-xmin)/(xmax-xmin)`; `f = 1.0`; if tt < 0.25: `f *= 1 - (1 - tail/100)*(0.25-tt)/0.25`; if tt > 0.75: `f *= 1 - (1 - nose/100)*(tt-0.75)/0.25` (tail = plan.tail_width_pct, nose = plan.nose_width_pct, default 100); end rounding: `e = min(tt, 1-tt)`; if e < 0.04: `f *= 0.55 + 0.45*sqrt(1 - ((0.04-e)/0.04)**2)`. Tumblehome constant `k`: low 0.08, medium 0.16, high 0.26 (plan.tumblehome).
3. `half_width(x, y)` -> units, 0.0 when y is outside [bottom, top]: `zb, zt = bottom(x), top(x)`; `w = w0 * taper(x)`; below the sill round-off: if y < zb+2: `w *= 1 - 0.25*((zb+2-y)/2)**2`; above the belt (only when zt > belt+0.5 and y > belt): `s = (y-belt)/(zt-belt)`; `w *= 1 - k * s**1.5`; roof/deck cap: `c = 1.2 if zt > belt+0.5 else 2.2`; if y > zt-c: `w *= sqrt(max(0.05, 1 - ((y-(zt-c))/c)**2))`. `ring(x, n=14)` -> list of (lat, y) for the right half-section from bottom centre to top centre: `[(0, zb)]` + `[(half_width(x, y_j), y_j) for y_j in n levels]` where `y_j = zb + (zt-zb)*(j/(n-1))**1.0` for j in 0..n-1, with y_0 nudged to `zb+0.01` and y_{n-1} nudged to `zt-0.01`, + `[(0, zt)]`. `lat_at(x, y)` = half_width(x, y) (alias used by parts).
4. `tests/test_surface.py` (plain python3 asserts, no pytest): load `docs/cars/t1_chimp.json`; `Surface(d, 25.3)`; assert `abs(top(0) - 37.97) < 0.1`, `abs(bottom(0) - 5.8) < 0.1`, `half_width(0, 20)` within 0.2 of 20.35, `half_width(0, 37.5) < 0.9*20.35`, `half_width(-49.9, 10) < 12`, `half_width(0, 80) == 0.0`, `len(ring(0)) == 16`, the ring lats never exceed 20.4, and ring y values are strictly increasing. Also `default_details(dossier)` (module function): a valid details dict for a car that has no details file: `version` 2, `id`, `belt_y` = lowest y of the dossier `greenhouse` points, `windows` = the dossier `greenhouse` polygons (it may be one polygon or a list of polygons: always return a list of polygons), `wheel` = `{'style': <style of the first dossier wheel>}`, `caricature` = eyes, mouth, wheels, bumper all 1.0, `parts` = []. Test it on t1_chimp: `parts == []`, `windows` non-empty, `belt_y` equals the lowest greenhouse y within 0.01. Print `SURFACE OK`. Run with `python3 tests/test_surface.py`.

## Acceptance (all must pass; exact commands)
- `python3 tests/test_surface.py` prints `SURFACE OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA02: Car body surface maths (pure python)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
