[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA28 Details for t1_maurice (Morris Minor 1000)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA28
Needs (already merged into `dev`): CA01, D04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Fill the structured details file for the game car `t1_maurice` so the Blender builder can add its lamps, grille, bumpers, trim, handles and badges. This is data only.

## Read first
- docs/CAR_DETAILS_SPEC.md (CA01: every kind, field and default)
- docs/cars/t1_maurice.json (the dossier: coordinates and the free-text features you must translate)
- tests/fixtures/details_ok.json (a small valid example)
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `docs/cars/details/t1_maurice.json`

## Steps
1. Open `docs/cars/t1_maurice.json`. Write `docs/cars/details/t1_maurice.json` (create the folder): version 2, id, `belt_y`, `window_frame`, `caricature`, `wheel` (style and `hub`/`whitewall` from the dossier wheel style and the recognisers below), `roof`, `windows` and `pillars` (see rules). Then the FRONT parts: the headlamps, small lamps, grille, bumper, plate, badges. 
2. REAR parts: tail lamps, bumper, plate, exhaust, boot or hatch handle, badges, reversing lamp, fuel cap. SIDE parts: strips, creases, shut lines for EVERY door, bonnet and boot lid (a path per line), door handles, mirrors (only if the era had them: say in `note`), vents, fins or running boards if any. At least 24 parts in total.
3. Recognisers for this car (the things a person uses to know it: each must appear as a part, or as `wheel` / `paint` / `roof` setting): tall narrow chrome grille with vertical slats and a badge above it (`grille` vertical_bars, plus `badge` shield); round headlamps standing in bulged front wings (`headlamp` round, `bezel` chrome); small sidelamps below the headlamps (`lamp` role sidelamp); chrome blade bumpers with rounded ends and two overriders on each; chrome hubcaps r 5.4; the bonnet-to-wing seam as a shut line; small oval chrome tail lamps on the rear wings (`taillamp` vertical); one-piece curved windscreen (a single `windows` pane for the screen is not needed: use the greenhouse outline); chrome door handles; a thin chrome strip along the bonnet front edge.
4. Validate and fix until clean: `python3 tools/art/details.py docs/cars/details/t1_maurice.json --dossier docs/cars/t1_maurice.json --strict`. Rules for the details file: schema `docs/CAR_DETAILS_SPEC.md` (CA01). Read the dossier's `front`, `rear`, `side_features`, `special`, `side_profile`, `greenhouse`, `wheels`, `typical_paint` and TRANSLATE every feature there into a part with exact numbers from the dossier (never invent a number that the dossier gives). Mirror pairs use `side: both`. `belt_y` = the height of the lowest point of the greenhouse polygon on the doors. `windows` = split the greenhouse into side panes at the B pillar (one pane per door window; one rear quarter pane if any; the windscreen and rear glass stay in the side-view polygon as their slanted outline) with the pillar bands as `pillars` entries (A pillar: from the windscreen base up to the roof along the screen edge, `lat_from` 0.82). `caricature`: `eyes` 1.15, `mouth` 1.1, `wheels` 1.05, `bumper` 1.1 unless a note below says otherwise (the RSAMH-style comic exaggeration).

## Acceptance (all must pass; exact commands)
- `python3 tools/art/details.py docs/cars/details/t1_maurice.json --dossier docs/cars/t1_maurice.json --strict` prints `DETAILS OK t1_maurice parts=` with parts >= 24 and kinds >= 8.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files (do not edit the dossier; if a dossier number looks wrong write `note` and keep it).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA28: Details for t1_maurice (Morris Minor 1000)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
