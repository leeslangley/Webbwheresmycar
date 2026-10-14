[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA09 CharFrames: SpriteFrames from the exported JSON

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA09
Needs (already merged into `dev`): GDA08, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`CharFrames` turns the JSON written by GDA08 (`res://art/chars/<char>.json`) into a `SpriteFrames` for an `AnimatedSprite2D`: one animation per clip with the right speed, loop flag and frame count, plus lookups for head faces and neck positions. Texture loading goes through a Callable so tests need no PNG files.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- tools/art/export_char_frames.py (GDA08: the JSON format: `frame`, `head`, `clips.<clip>.frames[].id/neck/angle`, `fps`, `loop`, `hold`, `view`, `heads.<face>.<angle>`, `head_back`, `busts`)
- godot/tests/harness.gd

## Files you may change (and nothing else)
- `godot/art/char_frames.gd`
- `godot/tests/test_char_frames.gd`

## Steps
1. `godot/art/char_frames.gd`: `class_name CharFrames`, `extends RefCounted`. `static func load_doc(char_id: String) -> Dictionary` (reads `res://art/chars/<char_id>.json`; `{}` when missing or invalid). `static func default_loader(char_id: String) -> Callable` returns `func(id: String) -> Texture2D: return load("res://art/chars/%s/%s.png" % [char_id, id]) as Texture2D`.
2. `static func build(doc: Dictionary, loader: Callable) -> SpriteFrames`: `var sf := SpriteFrames.new()`; remove the auto-created `default` animation (`sf.remove_animation("default")`); for each clip name in sorted order: `sf.add_animation(name)`, `sf.set_animation_speed(name, float(fps))`, `sf.set_animation_loop(name, bool(loop))`, then for each frame `sf.add_frame(name, loader.call(id), 1.0)`; the `hold` value (extra frames to stay on the last picture) is added to the LAST frame's duration: its duration is `1.0 + float(hold)`. Frames whose loader returns null are skipped. Return `sf`.
3. `static func build_char(char_id: String) -> SpriteFrames`: `build(load_doc(char_id), default_loader(char_id))`. `static func neck(doc: Dictionary, clip: String, frame: int) -> Vector2` (the `neck` of that frame; `Vector2.ZERO` when out of range). `static func clip_view(doc: Dictionary, clip: String) -> String` (`front` or `back`, default `front`). `static func head_id(doc: Dictionary, face: String, angle: String) -> String`: `doc.heads[face][angle]` when present, else `doc.heads["neutral"][angle]`, else `doc.heads["neutral"]["fwd"]`, else the empty string. `static func clip_names(doc: Dictionary) -> PackedStringArray` (sorted).
4. `godot/tests/test_char_frames.gd`: a fake doc written in the test as a Dictionary: clips `idle` (view front, fps 3, loop true, hold 0, frames ids `m_idle_00`, `m_idle_01` with necks (72,75) and (72,76), angle fwd), `talk` (fps 6, loop true, hold 2, 3 frames `m_talk_00..02`), `back_idle` (view back, fps 2, loop false, 1 frame); heads `neutral: {fwd: "m_head_fwd_neutral", tilt_l: "m_head_tilt_l_neutral"}`, `talk_A: {fwd: "m_head_fwd_talk_A"}`; loader `func(id): var img := Image.create(4, 4, false, Image.FORMAT_RGBA8); return ImageTexture.create_from_image(img)`. Check: `clip_names` is `["back_idle", "idle", "talk"]`; the SpriteFrames `get_animation_names()` has exactly those three (no `default`); `get_frame_count` is 2, 3, 1; `get_animation_speed` is 3.0, 6.0, 2.0; `get_animation_loop` is true, true, false; `get_frame_duration("talk", 2)` is 3.0 and `get_frame_duration("talk", 0)` is 1.0; `neck(doc, "idle", 1)` is `Vector2(72, 76)`; `neck(doc, "idle", 9)` is zero; `clip_view(doc, "back_idle")` is `back`; `head_id(doc, "talk_A", "fwd")` is `m_head_fwd_talk_A`; `head_id(doc, "talk_A", "tilt_l")` falls back to `m_head_tilt_l_neutral`; `head_id(doc, "zzz", "up")` falls back to `m_head_fwd_neutral`; `head_id({}, "neutral", "fwd")` is empty; a loader returning null for one id gives one frame fewer. `load_doc("nobody")` is `{}`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_char_frames` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No Actor scene (GDA10). No real PNG needed by the tests.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA09: CharFrames: SpriteFrames from the exported JSON`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
