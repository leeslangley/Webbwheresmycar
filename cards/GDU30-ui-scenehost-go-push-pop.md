[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU30 UI: SceneHost (go, push, pop)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU30
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`SceneHost`: a plain node (NOT an autoload) that owns the room/scene stack. `go` replaces everything, `push` stacks a scene on top (the one below is hidden and paused), `pop` returns. Scenes may define optional hooks `enter(params)`, `exit()`, `resume()`.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- src/ui/scenes.js (the JS scene stack: go / push / pop)

## Files you may change (and nothing else)
- `godot/ui/scene_host.gd`
- `godot/tests/test_scene_host.gd`

## Steps
1. `godot/ui/scene_host.gd`: `class_name SceneHost`, `extends Control`. Signal `changed(scene: Node)`. `var _stack: Array[Node] = []`. `_init`: `mouse_filter = MOUSE_FILTER_IGNORE`. `func _make(scene: Variant) -> Node`: a `String` path -> `(load(scene) as PackedScene).instantiate()`; a `PackedScene` -> `instantiate()`; a `Node` -> itself; anything else (or a missing file) -> `push_error("SceneHost: cannot make scene")` and `null`. `func current() -> Node: return _stack.back() if not _stack.is_empty() else null`. `func depth() -> int: return _stack.size()`.
2. `func push(scene: Variant, params: Dictionary = {}) -> Node`: `var n := _make(scene)`; if null return null; if the stack is not empty hide the top: `top.visible = false` (when it is a CanvasItem) and `top.process_mode = Node.PROCESS_MODE_DISABLED`; `if n is Control: (n as Control).set_anchors_preset(Control.PRESET_FULL_RECT)`; `add_child(n)`; `_stack.append(n)`; `if n.has_method("enter"): n.call("enter", params)`; `changed.emit(n)`; return `n`. `func go(scene: Variant, params: Dictionary = {}) -> Node`: remove every stack entry (for each, in reverse: `if has_method("exit")` call it; `remove_child`; `queue_free()`), clear the stack, then `return push(scene, params)`. `func pop() -> Node`: if `_stack.size() <= 1` return `current()` unchanged; else take the top: `exit` hook, `remove_child`, `queue_free`; the new top: `visible = true`, `process_mode = Node.PROCESS_MODE_INHERIT`, call its `resume()` hook if present; `changed.emit(top)`; return the new top.
3. `godot/tests/test_scene_host.gd`: helper in the test file: `func _probe() -> Control:` builds a `GDScript` with `source_code = "extends Control\nvar events: Array = []\nfunc enter(p: Dictionary) -> void:\n\tevents.append(\"enter\")\nfunc exit() -> void:\n\tevents.append(\"exit\")\nfunc resume() -> void:\n\tevents.append(\"resume\")\n"`, `reload()`, creates a `Control`, `set_script(s)`, returns it. Tests (host `h := SceneHost.new()` added to `tree().root`, freed at the end): `test_go`: `var a := _probe()`; `h.go(a)` returns `a`; `h.current() == a`; `h.depth() == 1`; `a.events == ["enter"]`; `a.get_parent() == h`; a second `var b := _probe(); h.go(b)`: `a.events == ["enter", "exit"]`, `a.is_queued_for_deletion()`, `h.depth() == 1`, `h.current() == b`. `test_push_pop`: `go(a)`; `push(b)`: `h.depth() == 2`, `a.visible == false`, `a.process_mode == Node.PROCESS_MODE_DISABLED`, `h.current() == b`; `h.pop()` returns `a`: `a.visible == true`, `a.process_mode == Node.PROCESS_MODE_INHERIT`, `a.events == ["enter", "resume"]`, `b.events == ["enter", "exit"]`, `h.depth() == 1`; `h.pop()` again keeps `a` (depth stays 1). `test_signal_and_params`: collect `changed` emissions during `go(a)`, `push(b)`, `pop()` (3 emissions); a PackedScene also works: `var ps := PackedScene.new(); ps.pack(Control.new())`... use `ps.pack(c)` with a fresh Control `c` (call `c.free()` after packing), then `h.push(ps)` returns a Control. `test_bad_scene`: `h.push(42)` returns null and depth is unchanged.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_scene_host` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU30: UI: SceneHost (go, push, pop)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
