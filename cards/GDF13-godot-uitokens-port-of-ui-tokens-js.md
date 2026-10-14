[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF13 Godot: UiTokens (port of ui/tokens.js)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF13
Needs (already merged into `dev`): GDF04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The design tokens in one GDScript class: palette (theme.js PALETTE plus tokens.js COLOR), spacing grid, screen zones, type scale, motion timings and easing curves, compared to the JS values by a golden fixture.

## Read first
- src/ui/tokens.js (read it all)
- src/ui/theme.js (PALETTE only, lines 1-30)
- tests/tokens.test.mjs
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- godot/tests/golden_util.gd (GDF04): `GoldenUtil.fixture(name) -> Variant` loads godot/tests/golden/<name>.json (whole JSON numbers come back as int, others float); `GoldenUtil.diff(a, b, eps = 1e-9) -> String` is "" when equal (numbers within eps) else a message naming the first difference; `GoldenUtil.same(a, b, eps = 1e-9) -> bool`
- Golden fixtures are made by the JS reference: `sh tools/godot/golden.sh <name>` (GDF04) runs `tools/godot/golden_<name>.mjs` under macOS `jsc -m` and writes `godot/tests/golden/<name>.json`. Run it yourself and commit both files; the JSON is never hand-edited

## Files you may change (and nothing else)
- `godot/ui/tokens.gd`
- `tools/godot/golden_tokens.mjs`
- `godot/tests/golden/tokens.json`
- `godot/tests/test_tokens.gd`

## Steps
1. `godot/ui/tokens.gd`: `class_name UiTokens`, `extends RefCounted`, static, typed. Colours are stored as hex STRINGS exactly as in the JS (upper-case digits as written there): `const PALETTE: Dictionary` (all 23 keys of theme.js PALETTE) and `const COLOR: Dictionary` (all 29 keys of tokens.js COLOR, camelCase key names kept, e.g. `woodLight`, `bannerTop`). `static func col(key: String) -> Color`: `Color(COLOR[key])` when the key is in COLOR, else `Color(PALETTE[key])` when in PALETTE, else `Color.MAGENTA` (and `push_error`). `const FONT_TITLE := "res://art/fonts/PressStart2P-Regular.ttf"` and `const FONT_BODY := "res://art/fonts/VT323-Regular.ttf"` (the art cards copy the fonts there).
2. `const SPACE: Dictionary = {1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48}`; `static func sp(n: int) -> int` (the value; for any n outside 1..7 `push_error("bad space")` and return 0). `const ZONES: Dictionary` with `banner {x:0,y:0,w:1280,h:120}`, `tableau {x:0,y:120,w:1280,h:470}`, `hud {x:0,y:590,w:1280,h:130}`. `const FLOOR: Dictionary = {"title": 16, "body": 22}`. `const TYPE: Dictionary` with the nine roles of the JS (`logo`, `h1`, `h2`, `h3`, `button`, `bannerText` (has `lineH`: 28), `hero`, `body`, `caption`), each `{"kind": ..., "px": ...}`. `static func font_path(role: String) -> String` (FONT_TITLE for kind `title`, FONT_BODY for `body`; `""` for an unknown role). `const MOTION: Dictionary` with all 16 timings of the JS.
3. Easing: `static func clamp01(u: float) -> float`, `static func lerp_to(a: float, b: float, u: float) -> float` (`a + (b - a) * u`, not clamped). `const EASE_NAMES: Array[String] = ["linear", "outQuad", "outCubic", "inOutQuad", "outBack", "outBounce"]`. `static func ease_named(curve: String, u: float) -> float`: clamp `u` with `clamp01` then apply the curve with the JS formulas: linear `u`; outQuad `1 - (1-u)*(1-u)`; outCubic `1 - pow(1-u, 3)`; inOutQuad `2*u*u` for u < 0.5 else `1 - pow(-2*u + 2, 2) / 2`; outBack with `C1 = 1.70158`, `C3 = C1 + 1`: `1 + C3*pow(u-1, 3) + C1*pow(u-1, 2)`; outBounce with `N1 = 7.5625`, `D1 = 2.75` and the four-branch formula of the JS (read EASE.outBounce). Unknown curve: `push_error("bad ease")` and return `u`. (Do not name anything `ease`: that is a GDScript built-in.)
4. `tools/godot/golden_tokens.mjs`: emit `{ PALETTE, COLOR, SPACE, ZONES, FLOOR, TYPE, MOTION, eases: { <name>: [[u, ease(name, u)] for u in [-0.5, 0, 0.1, 0.25, 0.5, 0.75, 0.9, 1, 1.5]] for each name in Object.keys(EASE) }, lerp: [[0,10,0.5,5],[2,4,0.25,2.5],[10,0,1.5,-5]] (a, b, u, lerp(a,b,u) computed by the JS), clamp01: [[-1,0],[0.3,0.3],[2,1]] }` (import `PALETTE` from `../../src/ui/theme.js`, the rest from `../../src/ui/tokens.js`).
5. `godot/tests/test_tokens.gd`: `test_palette_matches_js` (`GoldenUtil.same(UiTokens.PALETTE, fx.PALETTE)`, same for COLOR; COLOR has 29 keys, PALETTE 23; every value matches `^#[0-9A-Fa-f]{6}$` via `RegEx`), `test_col` (`UiTokens.col("ink")` equals `Color("#14102A")`; `col("gold")` equals `Color("#E8B923")`), `test_space` (for n 1..7 `sp(n) == fx.SPACE[str(n)]`), `test_zones_type_motion_floor` (GoldenUtil.same for ZONES, FLOOR, TYPE, MOTION), `test_zones_stack` (banner bottom 120 equals tableau y, tableau bottom 590 equals hud y, hud bottom 720), `test_eases` (every sample within 1e-9), `test_lerp_clamp`, `test_font_path` (`font_path("h1") == UiTokens.FONT_TITLE`, `font_path("body") == UiTokens.FONT_BODY`, `font_path("zzz") == ""`), `test_ascii_source` (godot/ui/tokens.gd has no byte >= 128).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden.sh tokens` prints `wrote godot/tests/golden/tokens.json`.
- `sh tools/godot/gtest.sh test_tokens | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- theme.tres, widgets, shaders (GDU cards). `shade`/`rgba` helpers (Godot has Color.lightened/darkened).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF13: Godot: UiTokens (port of ui/tokens.js)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
