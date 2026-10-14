[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA16 App icon and launch image

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA16
Needs (already merged into `dev`): GDF01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A small python3 script draws the game's pixel icon and launch image from ONE rectangle list (a little orange two-door car on a purple night street) and writes `godot/icon.svg` (the Godot project icon, 512 px via viewBox) and `godot/art/launch.png` (1280x720, for the launch screen).

## Read first
- docs/GODOT.md (colours: night purple #14102a / #2b2550)
- tools/art/pixelate.py (to see what the repo already has; this script needs no Blender and no PIL)

## Files you may change (and nothing else)
- `tools/art/make_launch.py`
- `tools/art/test_make_launch.sh`
- `godot/icon.svg`
- `godot/art/launch.png`

## Steps
1. `tools/art/make_launch.py` (python3 standard library only; `python3 tools/art/make_launch.py [--check]`). Constant `CAR` is the list of rectangles `(x, y, w, h, colour)` on a 32 x 21 cell grid, drawn in this order: `(2, 20, 28, 1, '#0b0918')` shadow; `(1, 10, 30, 6, '#c96f32')` body; `(22, 8, 8, 2, '#c96f32')` bonnet; `(7, 4, 15, 6, '#c96f32')` cabin; `(8, 4, 13, 1, '#e8a070')` roof highlight; `(1, 14, 30, 2, '#9a4f22')` lower shade; `(9, 5, 5, 4, '#a8d0e0')` and `(15, 5, 6, 4, '#a8d0e0')` windows; `(0, 13, 2, 3, '#e8e8ee')` and `(30, 13, 2, 3, '#e8e8ee')` bumpers; `(28, 10, 2, 2, '#ffe9a8')` headlamp; `(1, 10, 2, 2, '#d82020')` tail lamp; `(5, 14, 6, 6, '#14102a')` and `(21, 14, 6, 6, '#14102a')` tyres; `(7, 16, 2, 2, '#e8e8ee')` and `(23, 16, 2, 2, '#e8e8ee')` hubs.
2. Icon: grid 32 x 32. Rectangles in order: `(0, 0, 32, 32, '#2b2550')` background; `(0, 27, 32, 5, '#14102a')` road; stars `(4, 3, 1, 1, '#ffffff')`, `(12, 6, 1, 1, '#ffffff')`, `(20, 2, 1, 1, '#ffffff')`, `(27, 8, 1, 1, '#ffffff')`; moon `(24, 3, 4, 4, '#ffe9a8')`; then every rectangle of `CAR` with y offset +7 (x offset 0). `godot/icon.svg`: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32" shape-rendering="crispEdges">` followed by one `<rect x= y= width= height= fill=/>` per rectangle (integers, one per line), `</svg>`, trailing newline, ASCII only.
3. Launch image: grid 64 x 36, scale 20 (1280 x 720). Rectangles in order: `(0, 0, 64, 18, '#14102a')`, `(0, 18, 64, 10, '#1d1840')`, `(0, 28, 64, 8, '#2b2550')` sky bands; ten stars `(5, 3)`, `(14, 8)`, `(22, 4)`, `(31, 10)`, `(40, 3)`, `(47, 7)`, `(55, 4)`, `(60, 11)`, `(9, 13)`, `(36, 14)` each `1 x 1` white; moon `(52, 5, 4, 4, '#ffe9a8')`; road `(0, 28, 64, 8, '#14102a')`; kerb line `(0, 28, 64, 1, '#6c5eb5')`; every rectangle of `CAR` with offset (16, 8) (the car is centred, 32 cells wide, its wheels on the road). Write `godot/art/launch.png` as an 8-bit RGB PNG (colour type 2) with `zlib` and `struct` (signature, IHDR, IDAT with filter byte 0 per row, IEND; correct CRC). Rasterise by filling pixel rows; do not draw anti-aliased edges.
4. `--check` re-reads the written PNG header and prints `LAUNCH OK 1280x720` and `ICON OK rects=<n>`; the plain run writes both files and prints `WROTE godot/icon.svg godot/art/launch.png`. Output is deterministic (running twice gives identical files).
5. `tools/art/test_make_launch.sh`: runs the script and then `--check`; requires `file godot/art/launch.png` to say `1280 x 720`; parses `godot/icon.svg` with python3 `xml.etree.ElementTree`, requires `viewBox` `0 0 32 32`, at least 25 `rect` elements, and no byte above 126 in the file; md5 of both outputs identical after a second run. Prints `LAUNCH ASSETS OK`. Commit the two generated files.

## Acceptance (all must pass; exact commands)
- `sh tools/art/test_make_launch.sh` last line is `LAUNCH ASSETS OK`.
- Open `godot/art/launch.png` with the Read tool and describe it in your reply (expected: dark purple night sky with white stars and a yellow moon, a purple road, a small orange two-door car with two light-blue windows in the middle).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Do not edit project.godot (GDF01 owns it; the planner-in-chief adds `config/icon="res://icon.svg"`). No text on the launch image.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA16: App icon and launch image`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
