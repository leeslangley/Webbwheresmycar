[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF12 Godot: Sfx autoload (procedural sounds)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF12
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The `Sfx` singleton: the same nine sounds as `src/audio/sfx.js` (names click, cash, fail, fanfare, ring, tada, crash, paper, bid), synthesised in code into `AudioStreamWAV` buffers. No audio files.

## Read first
- src/audio/sfx.js (read it all: the SOUNDS table is the spec)
- tests/sfx.test.mjs
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`

## Files you may change (and nothing else)
- `godot/autoload/sfx.gd`
- `godot/tests/test_sfx.gd`

## Steps
1. `godot/autoload/sfx.gd` (replace the stub): `extends Node`. `const RATE := 22050`. `var muted: bool = false`, `var music_ducked: bool = false`, `var _player: AudioStreamPlayer`, `var _streams: Dictionary = {}` (cache). `const SOUNDS: Dictionary` with the exact JS events, each event a Dictionary `{"type": "square"|"triangle"|"noise", "freq": float, "end_freq": float, "start": float, "dur": float, "vol": float}` (`end_freq` equals `freq` except for noise). Values: click: square 880, start 0, dur 0.04, vol 0.2. cash: square 1200 (0, 0.06, 0.2) and square 1800 (0.06, 0.06, 0.2). fail: triangle 330 (0, 0.12, 0.3), 262 (0.12, 0.12, 0.3), 196 (0.24, 0.12, 0.3). fanfare: square at 262, 330, 392, 523, 659 starting at 0, 0.1, 0.2, 0.3, 0.4, each dur 0.1 vol 0.2. ring: four bursts starting 0, 0.25, 0.5, 0.75; each burst = square 400 and square 450 at that start, dur 0.15, vol 0.2 (8 events). tada: triangle 392, 494, 587 all at start 0, dur 0.4, vol 0.2. crash: noise freq 2400 end_freq 200, start 0, dur 0.3, vol 0.4. paper: noise freq 3000 end 3000, dur 0.12, vol 0.25. bid: triangle 660, dur 0.08, vol 0.25.
2. `func sound_names() -> Array`: the keys of SOUNDS. `func duration_of(sound: String) -> float`: the largest `start + dur` of its events (0.0 when unknown).
3. `func build_stream(sound: String) -> AudioStreamWAV` (null when the name is unknown): `n = int(ceil(duration_of(sound) * RATE))` samples as a `PackedFloat32Array` of zeros; for each event add `vol * wave * envelope` into samples `[int(start * RATE), int((start + dur) * RATE))`. Per sample: time `u = (i - first) / RATE`; frequency `f = freq + (end_freq - freq) * (u / dur)` (linear glide) accumulated as `phase += TAU * f / RATE`. Waves: square = `1.0 if sin(phase) >= 0.0 else -1.0`; triangle = `asin(sin(phase)) * 2.0 / PI`; noise = a deterministic white noise `w` from the generator `seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF` (seed starts at 12345 per event, `w = seed / 2147483648.0 - 1.0`) passed through a one-pole lowpass `y += a * (w - y)` with `a = clampf(TAU * f / RATE, 0.0, 1.0)`. Envelope (seconds): `attack = minf(0.01, dur / 4.0)`, `release = minf(0.03, dur / 4.0)`; gain rises linearly 0 to 1 over the attack, stays 1, falls linearly to 0 over the last `release` seconds. Convert to 16-bit little endian PCM (`clampf(sample, -1.0, 1.0) * 32767.0` as int, written with `PackedByteArray.encode_s16`), then `var w := AudioStreamWAV.new()`, `w.format = AudioStreamWAV.FORMAT_16_BITS`, `w.mix_rate = RATE`, `w.stereo = false`, `w.data = bytes`; return it. Cache by name in `_streams`.
4. `func play(sound: String) -> bool`: false when `muted`, when the name is unknown, or when the node is not inside the scene tree; else create `_player` on first use (`AudioStreamPlayer`, `add_child`), set `_player.stream = build_stream(sound)`, `_player.play()`, return true. `func set_muted(on: bool) -> void`, `func set_music_duck(on: bool) -> void` (just stores the flag, like the JS), `func unlock() -> void` (empty; kept so call sites match the JS).
5. `godot/tests/test_sfx.gd`: `var s: Node = load("res://autoload/sfx.gd").new()` (free it at the end). `test_names`: `sound_names()` sorted equals `["bid", "cash", "click", "crash", "fail", "fanfare", "paper", "ring", "tada"]`. `test_durations`: `duration_of` near 0.04 (click), 0.12 (cash), 0.36 (fail), 0.5 (fanfare), 0.9 (ring), 0.4 (tada), 0.3 (crash), 0.12 (paper), 0.08 (bid), eps 1e-9; unknown is 0. `test_streams`: for every name `build_stream` is not null, `format == FORMAT_16_BITS`, `mix_rate == 22050`, `data.size() == 2 * int(ceil(duration_of(n) * 22050.0))`, and the data is not all zeros; peak absolute sample for `click` is at most `0.2 * 32767 + 1` and at least 3000; `build_stream("nope")` is null. `test_deterministic`: two builds of `crash` have identical `data`. `test_mute`: `play("click")` is false when `muted` is true, false for an unknown name, and false while the node is outside the tree.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_sfx | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Music. Mixing buses. Sound files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF12: Godot: Sfx autoload (procedural sounds)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
