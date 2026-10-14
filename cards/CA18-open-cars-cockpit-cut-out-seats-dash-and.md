[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA18 Open cars: cockpit cut-out, seats, dash and windscreen

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA18
Needs (already merged into `dev`): CA06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Roadsters (the Spitfire and its kin) show an open cockpit: a hole in the deck, leather seats, a dash and steering wheel, and a chrome-framed windscreen. Registered as the `cockpit` stage; runs when the details file has a `cockpit` block.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults (`cockpit`, `interior`)
- tools/art/parts/arches.py (CA05: copy `apply_modifiers` and the Boolean DIFFERENCE recipe)

## Files you may change (and nothing else)
- `tools/art/parts/cockpit.py`
- `tests/run_ca18.sh`

## Steps
1. `tools/art/parts/cockpit.py`, `@stage('cockpit')`: with `c = details['cockpit']`: cutter box from x0 to x1, lat +-(0.72*half_width at x mid), y from `c['floor_y']` up to `surf.top + 5`; Boolean DIFFERENCE on the body (EXACT, apply). Inside: floor box (dark, at floor_y), transmission tunnel (box 0.18*width wide, 3.5 high, material dark), two seats (each: base box 7 x 9 x 2.5 and back box 1.6 x 9 x 7 tilted 12 degrees, material leather with colour `c['seat']`) at x0 + 38% and lat +-0.2*width... names `seat_<s>`; dash = a box across the front of the cockpit (material dark, colour `c['dash']`) at x = x1 - 2, 3 high; steering wheel = chrome torus R 3.2 minor 0.35 tilted 30 degrees on a column at the driver side (UK right-hand drive: the driver sits on the car's right, which is the near side, so put the wheel at `lat = -0.2*width_units`).
2. Windscreen: when `windows` is non-empty it already provides the glass; here add a chrome frame (4 thin boxes) around the screen's base at x = x1 across the full cockpit width (the top bar is the screen header at `max y of windows`). Print `COCKPIT OK`.
3. Create `tests/run_ca18.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_cockpit.json` (create it: dossier_ok, `roof.variant` open, `cockpit` x0 -10 x1 12 floor_y 14 seat `#6a2c20` dash `#101010`) and `--body loft``), requires exit 0, `RENDERED`, `COCKPIT OK`, 2 `REPORT seat_` lines, and the `body` mesh vertex count larger than without the cockpit (print it in the stage and compare in the shell); prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca18.sh` prints `CA18 OK`.
- `sh tests/run_ca06.sh` still prints `CA06 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA18: Open cars: cockpit cut-out, seats, dash and windscreen`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
