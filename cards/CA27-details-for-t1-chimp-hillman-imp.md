[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA27 Details for t1_chimp (Hillman Imp)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA27
Needs (already merged into `dev`): CA01, D03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Fill the structured details file for the game car `t1_chimp` so the Blender builder can add its lamps, grille, bumpers, trim, handles and badges. This is data only.

## Read first
- docs/CAR_DETAILS_SPEC.md (CA01: every kind, field and default)
- docs/cars/t1_chimp.json (the dossier: coordinates and the free-text features you must translate)
- tests/fixtures/details_ok.json (a small valid example)
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `docs/cars/details/t1_chimp.json`

## Steps
1. Open `docs/cars/t1_chimp.json`. Write `docs/cars/details/t1_chimp.json` (create the folder): version 2, id, `belt_y`, `window_frame`, `caricature`, `wheel` (style and `hub`/`whitewall` from the dossier wheel style and the recognisers below), `roof`, `windows` and `pillars` (see rules). Then the FRONT parts: the headlamps, small lamps, grille, bumper, plate, badges. 
2. REAR parts: tail lamps, bumper, plate, exhaust, boot or hatch handle, badges, reversing lamp, fuel cap. SIDE parts (the side view is the DEFAULT picture of every car, so do these most carefully): strips, creases, shut lines for EVERY door, bonnet and boot lid (a path per line), door handles, mirrors (only if the era had them: say in `note`), vents, fins or running boards if any. At least 24 parts in total.
3. Recognisers for this car (the things a person uses to know it: each must appear as a part, or as `wheel` / `paint` / `roof` setting): rear engine: NO grille (use `grille` style none only if the dossier asks for a recess; otherwise only the chrome trim strip and the front luggage lid shut line); round headlamps low and wide; five louvres on the engine cover (a `vent` where engine_lid, n 5); an engine cover shut line; chrome waist strip; chrome sill strip; thin chrome blade bumpers; very large glass area; fuel filler cap behind the rear side window; steel wheels with small chrome nave plates.
4. Validate and fix until clean: `python3 tools/art/details.py docs/cars/details/t1_chimp.json --dossier docs/cars/t1_chimp.json --strict`. Rules for the details file: schema `docs/CAR_DETAILS_SPEC.md` (CA01). Read the dossier's `front`, `rear`, `side_features`, `special`, `side_profile`, `greenhouse`, `wheels`, `typical_paint` and TRANSLATE every feature there into a part with exact numbers from the dossier (never invent a number that the dossier gives). Mirror pairs use `side: both`. `belt_y` = the height of the lowest point of the greenhouse polygon on the doors. `windows` = split the greenhouse into side panes at the B pillar (one pane per door window; one rear quarter pane if any; the windscreen and rear glass stay in the side-view polygon as their slanted outline) with the pillar bands as `pillars` entries (A pillar: from the windscreen base up to the roof along the screen edge, `lat_from` 0.82). `caricature`: `eyes` 1.15, `mouth` 1.1, `wheels` 1.05, `bumper` 1.1 unless a note below says otherwise (the RSAMH-style comic exaggeration). Paint: the main colour always comes from the dossier (`typical_paint[0]`); write `paint.colour2` and `paint.zones` (`use` paint2 or vinyl) only for a two-tone car, a vinyl roof or stripes that the dossier lists, and `paint.finish` metallic only when the dossier says so. The DEFAULT picture of every car is the SIDE view (Lee, 14 Oct 2026): flank, windows, pillars, arches and wheels must be right first; front and rear parts feed the head-on face portrait and the extra three-quarter view.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/details.py docs/cars/details/t1_chimp.json --dossier docs/cars/t1_chimp.json --strict` prints `DETAILS OK t1_chimp parts=` with parts >= 24 and kinds >= 8.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files (do not edit the dossier; if a dossier number looks wrong write `note` and keep it).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA27: Details for t1_chimp (Hillman Imp)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
