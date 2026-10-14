[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA15 Sfx: overlapping sounds, sound setting, six art sounds

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA15
Needs (already merged into `dev`): GDF12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
GDF12 already synthesises the nine sounds of src/audio/sfx.js with ONE player, so a second sound cuts the first and the sound setting is ignored. Upgrade the Sfx autoload: four overlapping players, `Game.settings.sound` respected, an optional pitch, a duck volume, and six new synthesised sounds for the new art (engine, horn, steam, door, chime, thud).

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- godot/autoload/sfx.gd as GDF12 left it (SOUNDS Dictionary of event Dictionaries `{type, freq, end_freq, start, dur, vol}`, `sound_names()`, `duration_of()`, `build_stream()`, `play()`, `set_muted()`, `set_music_duck()`, `unlock()`, `muted`, `music_ducked`, `_player`, `_streams`) and godot/tests/test_sfx.gd
- godot/autoload/game.gd (GDF10: `Game.settings` Dictionary with keys `crt`, `sound`, `music`)
- godot/tests/harness.gd

## Files you may change (and nothing else)
- `godot/autoload/sfx.gd`
- `godot/tests/test_sfx.gd`

## Steps
1. Add six entries to `SOUNDS` (same event format; `end_freq` equals `freq` except where a glide is given): `engine`: triangle freq 55 end_freq 110 start 0 dur 0.6 vol 0.3, and square freq 82 end_freq 165 start 0 dur 0.6 vol 0.08. `horn`: square 440 and square 554, both start 0 dur 0.35 vol 0.2. `steam`: noise freq 4000 end_freq 1500 start 0 dur 0.5 vol 0.2. `door`: noise freq 800 end_freq 100 start 0 dur 0.18 vol 0.4, and triangle freq 90 end_freq 50 start 0 dur 0.18 vol 0.3. `chime`: triangle 1047 start 0, triangle 1319 start 0.12, triangle 1568 start 0.24, each dur 0.25 vol 0.2. `thud`: triangle freq 70 end_freq 35 start 0 dur 0.2 vol 0.5. Nothing else in the synthesis code changes: `build_stream` already handles every event type.
2. Overlap: replace the single `_player` by `var _players: Array[AudioStreamPlayer] = []` and `var _next := 0`. `const POOL := 4`. `func _ensure_players() -> void`: when `_players` is empty create `POOL` AudioStreamPlayer nodes (`add_child` each, works outside the tree) and store them. `func _pick_player() -> AudioStreamPlayer`: calls `_ensure_players()`, returns the first player whose `playing` is false, otherwise `_players[_next]` and then `_next = (_next + 1) % POOL`.
3. `func play(sound: String, pitch: float = 1.0) -> bool` (the extra parameter is optional so old calls still work): false when `muted`; false for an unknown name; false when the Game setting says sound is off (`var g := get_node_or_null("/root/Game")`; `if g != null and "settings" in g and not bool(g.settings.get("sound", true)): return false`); false when not inside the tree (`is_inside_tree()`). Otherwise `var p := _pick_player()`, `p.stream = build_stream(sound)`, `p.pitch_scale = clampf(pitch, 0.5, 2.0)`, `p.volume_db = -8.0 if music_ducked else 0.0`, `p.play()`, return true. Keep `set_muted`, `set_music_duck`, `unlock` exactly as they are.
4. Update `godot/tests/test_sfx.gd`: `test_names` now expects the sorted 15 names `bid, cash, chime, click, crash, door, engine, fail, fanfare, horn, paper, ring, steam, tada, thud`; `test_durations` gets these extra checks (eps 1e-9): engine 0.6, horn 0.35, steam 0.5, door 0.18, chime near 0.49, thud 0.2; `test_streams` loops over all 15 names (data size is `2 * int(ceil(duration_of(n) * 22050.0))`, not all zeros) and the peak of `thud` is at least 3000 and at most `0.5 * 32767 + 1`. New tests: `test_pool`: on a fresh instance `_ensure_players()` gives `_players.size()` 4 and `get_child_count()` 4, calling it twice keeps 4, `_pick_player()` returns `_players[0]` when none is playing; `test_settings`: a stand-in for the Game autoload cannot be added to the tree here, so only check the unchanged rules: `play("click")` and `play("click", 1.5)` are false outside the tree and `play("nope")` is false; `test_duck_flag`: `set_music_duck(true)` makes `music_ducked` true. Keep every existing GDF12 test passing.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_sfx` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` (everything) ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No music, no audio files, no buses. Do not rename or remove any existing public func or var of Sfx.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA15: Sfx: overlapping sounds, sound setting, six art sounds`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
