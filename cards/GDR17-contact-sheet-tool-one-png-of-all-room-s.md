[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR17 Contact sheet tool: one PNG of all room scenes

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR17
Needs (already merged into `dev`): GDR02, GDR27, GDR28, GDR07, GDR08, GDR09, GDR10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`sh tools/godot/sheet.sh <out.png> [scenes] [frames]` renders every room scene on CASE (Xvfb) in ONE Godot process and writes a single contact-sheet PNG (thumbnails 640x360, three per row, each captioned with its scene name) so Lee and the reviewers can look at the whole game at once. Same mechanism as tools/godot/gshot.sh and shot.gd, but each scene is rendered in its own SubViewport and the captures are composed with Godot's own Image class (no PIL, no ImageMagick).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- tools/godot/gshot.sh, tools/godot/shot.gd, tools/godot/_common.sh (copy their style: `ship`, scp of the script, xvfb-run, the grep filter)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame.sample_state().cars`)

## Files you may change (and nothing else)
- `tools/godot/sheet.sh`
- `tools/godot/sheet.gd`

## Steps
1. `tools/godot/sheet.sh` (bash, header comment with usage): `. "$(dirname "$0")/_common.sh"`; `OUT="${1:?out.png}"; SCENES="${2:-title,office,garage,auction,endgame,settings,loading}"; FR="${3:-10}"`; `ship`; copy `sheet.gd` to `$HOST:$RDIR/_sheet.gd`; run on CASE: `cd $RDIR && rm -f _sheet.png && timeout 600 $GODOT_REMOTE --headless --path . --import >/dev/null 2>&1; GD_SCENES='$SCENES' GD_FRAMES=$FR GD_OUT=$RDIR/_sheet.png timeout 600 xvfb-run -a -s '-screen 0 1280x720x24' $GODOT_REMOTE --path . --resolution 1280x720 -s res://_sheet.gd 2>&1 | grep -E 'SHEET|ERROR|SCRIPT' | head -40`; copy `_sheet.png` back to `$OUT` and print `wrote $OUT` (or `no sheet produced` and exit 1), exactly like gshot.sh.
2. `tools/godot/sheet.gd`: `extends SceneTree`. `func _initialize() -> void` (a coroutine; use `await process_frame`): read `GD_SCENES` (split on ",", skip empties), `GD_FRAMES` (int, default 10), `GD_OUT`. Prepare a started game once with dynamic lookups (do not name the autoload in code): `var g = root.get_node("Game")`; `g.save_path = "user://sheet_save.json"`; `g.new_game(7)`; `g.state.cars = TestFakeGame.sample_state().cars` (so the garage has cars). Per scene `name`: set up the state: for `auction` set `g.state.day = 24`; for `endgame` set `g.state.flags = {"gameOver": true, "won": true, "reason": "won"}` and `g.state.plates.fatcat = true`; for the others leave it. Then render it: create a `SubViewport` (size 1280x720, `render_target_update_mode = SubViewport.UPDATE_ALWAYS`, `transparent_bg = false`), add to `root`; load `res://scenes/<name>.tscn` (if loading fails print `SHEET ERROR missing <name>` and use a magenta 1280x720 image instead); instantiate, add to the viewport, call `enter({})` if it has that method; add a caption (`ColorRect` 300x34 black at (0,0) plus a `Label` with the scene name, font size 22, white) as the LAST child of the viewport; `for i in frames: await process_frame`; take `vp.get_texture().get_image()`; free the viewport; reset the state changes you made (restore day 1 / flags). A scene named `main` is allowed too (the whole game through the Flow, which starts on the loading screen).
3. Compose: `n` captures, `cols = mini(3, n)`, `rows = ceili(n / float(cols))`; `var sheet := Image.create(cols * 640, rows * 360, false, Image.FORMAT_RGBA8)`; `sheet.fill(Color("14102A"))`; for each capture `img.convert(Image.FORMAT_RGBA8)`, `img.resize(640, 360, Image.INTERPOLATE_BILINEAR)`, `sheet.blit_rect(img, Rect2i(0, 0, 640, 360), Vector2i((i % cols) * 640, (i / cols) * 360))`. `sheet.save_png(out)`; `print("SHEET ", sheet.get_size(), " scenes=", n)`; `g.erase_save()`; `quit(0)`. An empty scene list prints `SHEET ERROR no scenes` and `quit(2)`.
4. Check by running it: `bash -n tools/godot/sheet.sh` (syntax), then the two commands below. LOOK at the PNGs with the Read tool and describe each tile (is the scene recognisable, anything blank or magenta, text readable).

## Acceptance (all must pass; exact commands)
- `bash -n tools/godot/sheet.sh && echo SYNTAX OK` prints `SYNTAX OK`.
- `sh tools/godot/sheet.sh /tmp/gdr17_sheet.png` prints `wrote /tmp/gdr17_sheet.png` (7 tiles, 1920x1080) and its output contains a line `SHEET (1920, 1080) scenes=7`.
- `sh tools/godot/sheet.sh /tmp/gdr17_two.png title,office 6` prints `wrote /tmp/gdr17_two.png` (output line `SHEET (1280, 360) scenes=2`).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files. Do not change gshot.sh, shot.gd or _common.sh.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR17: Contact sheet tool: one PNG of all room scenes`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
