[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA01 Car details schema v2: validator and spec doc

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA01
Needs (already merged into `dev`): R00
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The dossier's free-text front/rear/side fields cannot be read by a script. Define a structured `details` file per car (one JSON per car in `docs/cars/details/<id>.json`) and a pure-python validator, so the Sparks can fill it and every number is checked.

## Read first
- docs/CAR_DOSSIER_SPEC.md (coordinates)
- tools/check_dossier.py (how the existing checker prints OK/FAIL lines: copy the style)
- tests/fixtures/dossier_ok.json

## Files you may change (and nothing else)
- `tools/art/details.py`
- `tests/fixtures/details_ok.json`
- `tests/fixtures/details_bad.json`
- `tests/run_details.sh`
- `docs/CAR_DETAILS_SPEC.md`

## Steps
1. `tools/art/details.py` (python3 stdlib only, NO bpy): a dict `KINDS` mapping kind -> {`req`: [field names], `opt`: {field: default}, `enums`: {field: [allowed]}, `doc`: one sentence}. Kinds (21): headlamp(req x,y,lat,r; opt shape round|square|oval|slanted|popup|quad=round, bezel chrome|paint|black=chrome, open=false, side=both); lamp(req x,y,role sidelamp|indicator|foglamp|driving|reverse|reflector; opt lat=0, r=1.2, w=0, h=0, shape round|rect=round, side=both); taillamp(req x,y,lat; opt shape round|rect|vertical|cat_eye|fin|wrap=rect, w=3, h=2, side=both); grille(req x,y,w,h; opt style oval_mesh|vertical_bars|horizontal_bars|egg_crate|kidney|shield|slat_panel|none=horizontal_bars, bars=7, surround chrome|paint|black=chrome, end front|rear=front, lat=0); bumper(req end front|rear; opt style blade|wrap|chunky|us|quarter=blade, y=8, h=2, w=0 (0 means full width), thick=1.2, overriders=0 (0..4), guards=false); plate(req end front|rear; opt y=8, w=12, h=3, lat=0, colour white|yellow=white); exhaust(opt style round|oval|twin|quad|sidepipe=round, x=-50, y=6, lat=6, r=1.0, side=near); strip(req x,x2,y; opt h=0.5, role sill|waist|sweep|rubbing|window=sweep, colour chrome|black|paint2=chrome, side=both); crease(req x,x2,y; opt depth=0.15, side=both); shutline(req path [[x,y],...] at least 2 points; opt role door|bonnet|boot|fuel|engine=door, side=both, across_x=null); handle(req x,y; opt style flap|push|bar|lever|boot|knob=flap, len=2.5, side=both); mirror(req x,y,lat; opt style round|rect|door|wing=door, size=2, side=both); badge(req x,y; opt shape disc|bar|shield|wings|script=disc, end front|rear|side=front, size=2, colour chrome|red|blue|gold|black=chrome); wiper(req x,y; opt len=10, n=2); aerial(req x,y,lat; opt len=14); fuelcap(req x,y; opt r=1.0, side=near); fin(req x,x2,y,h; opt thick=0.8, style fin|blade|rocket=fin); running_board(req x,x2,y; opt w=3, colour black|chrome|paint=black); vent(req where side|bonnet|boot|engine_lid, x,x2,y,w,h; opt style louvre|gill|scoop|bulge|grille_rect=louvre, n=5); spare(req mount boot|rear_door|side_well|bonnet|rear_wing, x,y,r; opt cover=false, lat=0); rack(req where roof|boot, x,x2,w; opt bars=4). Every part also accepts `side` (both|near|far|centre; default both when lat>0 else centre) and `note` (free text, ignored).
2. Top-level fields in the same file: `version` (must be 2), `id`, `belt_y` (float, height of the window sill line), `window_frame` (chrome|black|paint, default chrome), `caricature` ({eyes, mouth, wheels, bumper}, each 0.8..1.4, default 1.0: size multipliers that make the classic more characterful), `wheel` ({style steel|wire|knockoff|alloy|disc|spoked, hub chrome|paint|black, whitewall bool, trim_ring bool, hubcap_r float, spokes int}), `paint` ({colour2 '#rrggbb' (the ONE second paint colour; the main colour is the dossier's `typical_paint[0]`), finish solid|metallic = solid, zones: [{region roof|above_y|below_y|band|bonnet_stripe|centre_stripe, y, y2, x0, x1, w, use paint2|vinyl = paint2}]}), `roof` ({variant hard|soft_up|soft_down|targa|open|vinyl, colour, fold_x0, fold_x1}), `windows` (list of polygons, each a list of [x,y]: side-view outlines of each glass pane), `pillars` (list of {poly: [[x,y]..], lat_from: 0..1 fraction of half width}), `cockpit` ({x0, x1, floor_y, seat '#rrggbb', dash '#rrggbb'}; open cars only), `parts` (list).
3. Functions: `load(path)` (raises ValueError); `validate(details, dossier=None, strict=False)` returns a list of problem strings (unknown kind, missing req field, bad enum, non-number where number expected, side not allowed, a zone with `use` paint2 but no `paint.colour2`). With a dossier it also checks: |x| <= 51; 0 <= y <= height_units+1 (height_units = dims_mm.height/dims_mm.length*100); lat <= plan.width_units/2+1; `belt_y` between 0.35 and 0.95 of height_units; every window point inside x -51..51 and y 0..height_units+1; parts with an `end` field: bumper/plate/grille front need x omitted or >= 40 (rear <= -40). With strict=True it also requires: >= 24 parts, at least 1 headlamp, 1 taillamp, bumper end front AND rear, plate end front AND rear, 1 exhaust, `wheel` present, `belt_y` present, >= 3 badge/handle/strip/crease/shutline parts, shutline count >= 2*doors+2 (doors from the dossier) for non-open cars, `windows` has >= 2 polygons unless roof.variant is open or soft_down. CLI: `python3 tools/art/details.py <file> [--dossier <json>] [--strict]` prints `DETAILS OK <id> parts=<n> kinds=<m>` (m = number of distinct kinds used) and exits 0, else one `DETAILS FAIL <file>: <reason>` per problem and exit 1. `python3 tools/art/details.py --doc` prints a markdown reference of every kind (table: kind, required, optional with defaults, allowed values, doc) plus the top-level fields.
4. Write `tests/fixtures/details_ok.json` (version 2, id dossier_ok, belt_y 26.5, windows [[[-12,26.5],[-9,29],[6,29],[10,26.5]]], 8 parts: two headlamps via side both, one taillamp, front bumper, rear bumper, front plate, rear plate, one shutline) and `tests/fixtures/details_bad.json` (unknown kind `tailfin`, a headlamp missing `r`, a bad enum). `tests/run_details.sh` runs the CLI on both (ok must print `DETAILS OK dossier_ok parts=8 kinds=`, bad must exit 1 with at least 3 `DETAILS FAIL` lines), then `python3 tools/art/details.py --doc > docs/CAR_DETAILS_SPEC.md`, requires the doc to mention all 21 kind names, and prints `DETAILS TEST OK`. Commit the generated doc.

## Acceptance (all must pass; exact commands)
- `sh tests/run_details.sh` prints `DETAILS TEST OK`.
- `python3 tools/art/details.py tests/fixtures/details_ok.json --dossier tests/fixtures/dossier_ok.json` prints `DETAILS OK dossier_ok parts=8 kinds=`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA01: Car details schema v2: validator and spec doc`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
