[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE09 Auction hall plate: curtains, stage, podium, spotlight

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE09
Needs (already merged into `dev`): GE03, GE04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Render the auction hall background (docs/art/GE.md 'Auction'): dark wood-panelled hall, red velvet curtains either side, bunting, a lit lot board where the game paints the car, a stage with a brass-topped podium, rows of empty chairs in the dark, one warm spotlight.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- docs/art/GE.md (screen zones, pipeline, palettes, lighting) and the reference prototype folder docs/art/ge_proto/ (scripts that already run and were looked at by a human: copy them and tidy, do not redesign)
- docs/art/ge_proto/roomkit2.py (functions `curtain`, `podium`, `stage`, `dining_chair`)
- docs/art/ge_proto/room_auction.py
- tools/art/roomkit_shell.py, pixelbg.py, check_room.py
- Command line: `--out <png>` (raw 1280x720 render), `--samples <n>` (default 64).

## Files you may change (and nothing else)
- `tools/art/roomkit_auction.py`
- `tools/art/room_auction.py`
- `tests/run_room_auction.sh`
- `assets/art/rooms/auction.png`

## Steps
1. `tools/art/roomkit_auction.py`: `make_materials_auction()` with `velvet` #6a1f2b rough 0.95, `panel` (stripes #3d2414/#4a2c1a scale 12), `stage` (planks #2a1a12/#4a2f1d), `seat` #3a2a55, `hall` (noise #2b2230/#352a3a), `brass`; functions `curtain(M, px0, px1, py0, py1, folds=10)`, `podium(M, px, depth)`, `stage(M, px0, px1, d0, d1, h=0.35)`, `dining_chair(M, px, depth)` from the prototype, plus NEW `lot_board(M, r)`: a box with the `panel` material filling the rect `r` (front face on the rect, 0.05 m thick) with a 6 px `brass` frame made of four thin `wbox` strips. The lot board is DARK wood, not paper (cars are drawn on it).
2. `tools/art/room_auction.py` from the prototype (arguments `--out`, `--samples`; opaque): wall = panel, floor = hall; cornice at y 40; curtains (0,150,40,480) and (1130,1280,40,480); velvet valance wbox (0,36,1280,26); stage (100,1180) depth 0..2.2; podium at x 1040 depth 0.9; `lot_board` at (120,100,1040,260); bunting at y 70; two rows of 10 dining chairs (x = 130 + i*110 + row*55, depth 3.6 + row*1.2); one SPOT light #ffe2a0 energy 3500 at (6.4,-4,5.5) aimed at (6.4,-1.2,0.5), two warm point sconces (energy 90) at x 2.2 and 10.6, a cool fill area light energy 700.
3. `tests/run_room_auction.sh`: render (samples 48) to /tmp/ge09/auction_raw.png, `pixelbg.py --width 640 --colors 96 --dither 0.22 --out assets/art/rooms/auction.png`, then `check_room.py -- ... --size 640x360 --max-colors 96 --bright 300,380,700,80,25 --warm 520,200,240,60,15 --calm 0,0,1280,30,12 --solid 0,0,1280,720` must print `ROOM OK` (tune the spot energy by at most 30 percent if needed). Print `ROOM AUCTION OK`. Commit the PNG.

## Acceptance (all must pass; exact commands)
- `sh tests/run_room_auction.sh` prints `ROOM AUCTION OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE09: Auction hall plate: curtains, stage, podium, spotlight`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
