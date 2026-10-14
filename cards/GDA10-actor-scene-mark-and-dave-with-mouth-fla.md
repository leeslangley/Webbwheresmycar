[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA10 Actor scene: Mark and Dave with mouth flaps

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA10
Needs (already merged into `dev`): GDA09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`Actor` is one character (Mark, Dave or a customer) on screen: a body `AnimatedSprite2D` playing a clip, with the head sprite placed on the neck position of the current frame and swapped between mouth shapes while `talk(text)` runs. Port of the idea of GC23 (animation clock, mouth shapes).

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- godot/art/char_frames.gd (GDA09 API)
- /Users/leelangley/wt/webbwheresmycar/_dev/cards/GC23-*.md (blink and mouth shape idea) and docs/characters/expressions.json (face names such as talk_A talk_E talk_O talk_M neutral blink)
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `godot/art/actor.gd`
- `godot/art/actor.tscn`
- `godot/art/previews/actor_demo.gd`
- `godot/art/previews/actor_demo.tscn`
- `godot/tests/test_actor.gd`

## Steps
1. `godot/art/actor.tscn`: root `Node2D` named `Actor`, `script = ExtResource("1")` (res://art/actor.gd), `texture_filter = 1` (nearest). `actor.gd`: `class_name Actor`, `extends Node2D`, `signal clip_finished(clip: String)`, `const MOUTH_SEC := 0.09`, `const BLINK_EVERY := 3.2`, `const BLINK_SEC := 0.12`. `build()` (idempotent, `_ready()` calls it) creates `Body` (AnimatedSprite2D, `centered = false`) and `Head` (Sprite2D, `centered = false`), in that order, and connects `Body.frame_changed` to `_place_head` and `Body.animation_finished` to `_on_finished`.
2. `setup(char_id: String) -> bool` loads the doc and `CharFrames.build_char(char_id)` and calls `setup_from(doc, loader)`; `setup_from(doc: Dictionary, loader: Callable) -> bool` (public, used by tests): false when the doc has no clips; otherwise stores `_doc`, `_loader`, sets `Body.sprite_frames = CharFrames.build(doc, loader)`, sets `scale = Vector2(float(doc.scale), float(doc.scale))`, and plays the clip `idle` (or the first clip) via `play`. Returns true.
3. `play(clip: String) -> bool`: false if the SpriteFrames has no such animation; else `Body.play(clip)`, store `clip_name`, call `_place_head()`, true. `_place_head()`: `neck := CharFrames.neck(_doc, clip_name, Body.frame)`, `pivot := Vector2(_doc.head.pivot[0], _doc.head.pivot[1])`, `Head.position = neck - pivot`; texture: if `CharFrames.clip_view(_doc, clip_name) == "back"` the id `_doc.head_back`, otherwise `CharFrames.head_id(_doc, _face, angle_of_frame)` where `angle_of_frame` is the `angle` of the current frame entry (default `fwd`); `Head.texture = _loader.call(id)` (empty id: `Head.texture = null`). `_on_finished()` emits `clip_finished(clip_name)`.
4. Mouth: `static func mouth_for(ch: String, prev: String) -> String`: lower-case letter a -> `talk_A`; e or i -> `talk_E`; o or u -> `talk_O`; m, b or p -> `talk_M`; space, comma, full stop, `!`, `?` -> `neutral`; any other letter or digit keeps `prev`. `static func mouth_schedule(text: String) -> PackedStringArray`: one entry per character, `prev` starts as `neutral` and is the previous entry. Example: `mouth_schedule("Oh no")` is `[talk_O, talk_O, neutral, neutral, talk_O]`. `talk(text: String) -> float` stores the schedule, resets `_talk_t = 0.0`, returns `text.length() * MOUTH_SEC`; `stop_talk()` clears it and sets face `neutral`; `is_talking() -> bool`. `set_face(name: String)` sets `_face` and refreshes the head. `_process(delta)`: advance a blink timer (every `BLINK_EVERY` seconds the face is `blink` for `BLINK_SEC` unless talking); while talking `_talk_t += delta`, face = schedule[int(_talk_t / MOUTH_SEC)], and when `_talk_t >= text.length() * MOUTH_SEC` stop talking. Each change calls `_place_head()`.
5. `godot/art/previews/actor_demo.gd` + `actor_demo.tscn` (root Node2D `ActorDemo`; `_ready()` adds a `ColorRect` 1280x720 colour `2b2550`, instantiates `res://art/actor.tscn` twice, `setup("mark")` at position (300, 160) and `setup("dave")` at (700, 160); if `setup` returns false for either, that actor is left out and a Label saying `no character art exported yet` is shown instead; calls `talk("Where is my car")` on Mark).
6. `godot/tests/test_actor.gd`: the fake doc of test_char_frames style (clips `idle` 2 frames, `talk` 3 frames, `back_idle` view back; heads neutral/talk_A/talk_E/talk_O/talk_M/blink at angle fwd; `head_back` id `m_head_back`; `head.pivot` [40, 66]; `scale` 2) and a loader returning a 4x4 `ImageTexture` per id, remembering the last id asked in a test-side Dictionary so the head texture can be compared by id. Check: `setup_from` true; `scale` is `Vector2(2, 2)`; `clip_name` is `idle`; `Head.position` equals neck minus pivot for frame 0; `play("talk")` true, `play("zzz")` false; `mouth_schedule("Oh no")` equals the example above; `mouth_for("x", "talk_A")` is `talk_A`; `talk("Mum")` returns near 0.27 and `is_talking()`; the schedule for "Mum" is `[talk_M, talk_O, talk_M]`; after `_process(0.1)` (`_talk_t` 0.1, index 1) the face is `talk_O`; after a further `_process(0.3)` `is_talking()` is false and the face is `neutral`; `play("back_idle")` makes the head texture the `m_head_back` one; `setup_from({}, loader)` is false. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_actor` last line is `GDTEST OK`.
- If `godot/art/chars/mark.json` exists: `sh tools/godot/gshot.sh art/previews/actor_demo.tscn /tmp/gda10.png 30` prints `wrote /tmp/gda10.png` with no `ERROR` line and you describe the picture; otherwise say `no character art exported yet, screenshot skipped`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No lip-sync from audio. No Game state access: callers decide what the actor says.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA10: Actor scene: Mark and Dave with mouth flaps`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
