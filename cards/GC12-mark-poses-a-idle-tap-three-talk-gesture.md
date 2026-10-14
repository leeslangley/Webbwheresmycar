[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC12 Mark poses A: idle, tap, three talk gestures, phone, reading

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC12
Needs (already merged into `dev`): GC03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The first half of Mark's front-view (sitting at the desk, facing us) animation, written as pose-table JSON in the joint conventions of tools/art/poselib.py. The numbers are first-guess starting values: a visual QA pass will send back fix notes.

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- tools/art/poselib.py (JOINTS, conventions, `check` command)
- docs/characters/expressions.json

## Files you may change (and nothing else)
- `docs/characters/poses_mark_front_a.json`

## Steps
1. Create `docs/characters/poses_mark_front_a.json` with `character` "mark", `view` "front" and `defaults` = {"shoulder_L":[-30,6,0],"shoulder_R":[-30,-6,0],"elbow_L":[-60,0,0],"elbow_R":[-60,0,0],"hand_L":"relaxed","hand_R":"relaxed","prop_L":"none","prop_R":"none"} (forearms resting on the desk). Each clip is {`fps`,`loop`,`hold`,`frames`,`keys`}; unspecified joints fall back to `defaults`. Clips are written `name: fps, loop, frames[, hold]` (hold is 0 unless stated; use exactly these names): `idle`: 3, true, 6, hold 0: keys [{},{"root":[0,0,0.016],"chest":[-1.5,0,0],"head":[-1,2,0]},{"root":[0,0,0.016],"chest":[-1.5,0,0],"head":[1,-2,0]}] (breathing, one pixel of rise, head drifts); `tap`: 8, true, 4: keys [{"wrist_R":[0,0,0]},{"wrist_R":[-14,0,0]},{"wrist_R":[0,0,0]},{"wrist_R":[10,0,0]}] (fingers drum, hand_R relaxed).
2. `talk_a`: 8, true, 6: right hand open, gesturing: every key has "hand_R":"open", keys [{"shoulder_R":[-50,-25,0],"elbow_R":[-85,0,0],"wrist_R":[0,0,-15],"head":[3,0,0]},{"shoulder_R":[-60,-30,0],"elbow_R":[-105,0,0],"wrist_R":[0,0,10],"head":[0,0,0]},{"shoulder_R":[-45,-22,0],"elbow_R":[-80,0,0],"wrist_R":[0,0,-10],"head":[4,0,0]}]; `talk_b`: 8, true, 6: both hands open and out: keys [{"hand_L":"open","hand_R":"open","shoulder_L":[-45,25,0],"shoulder_R":[-45,-25,0],"elbow_L":[-80,0,0],"elbow_R":[-80,0,0]},{"hand_L":"open","hand_R":"open","shoulder_L":[-50,33,0],"shoulder_R":[-50,-33,0],"elbow_L":[-90,0,0],"elbow_R":[-90,0,0],"head":[2,0,0]}]; `talk_c`: 8, true, 6: right index finger jabbing, head shaking: "hand_R":"point", keys [{"shoulder_R":[-60,-10,0],"elbow_R":[-60,0,0],"head":[0,0,6]},{"shoulder_R":[-65,-12,0],"elbow_R":[-80,0,0],"head":[0,0,-6]},{"shoulder_R":[-60,-10,0],"elbow_R":[-60,0,0],"head":[0,0,6]}].
3. `phone`: 4, true, 4: left hand holds the phone to the ear, right hand waves: keys [{"prop_L":"phone","hand_L":"phone","shoulder_L":[-20,35,10],"elbow_L":[-130,0,0],"wrist_L":[0,0,20],"head":[0,-8,0],"hand_R":"open","shoulder_R":[-40,-30,0],"elbow_R":[-80,0,0]},{"prop_L":"phone","hand_L":"phone","shoulder_L":[-20,35,10],"elbow_L":[-130,0,0],"wrist_L":[0,0,20],"head":[0,-8,0],"hand_R":"open","shoulder_R":[-45,-36,0],"elbow_R":[-95,0,0]}]; `read`: 2, true, 4, hold 0: newspaper in both hands, head down: keys [{"prop_R":"paper","hand_L":"grip","hand_R":"grip","shoulder_L":[-45,10,0],"shoulder_R":[-45,-10,0],"elbow_L":[-80,0,0],"elbow_R":[-80,0,0],"head":[14,0,0]},{"prop_R":"paper","hand_L":"grip","hand_R":"grip","shoulder_L":[-45,10,0],"shoulder_R":[-45,-10,0],"elbow_L":[-80,0,0],"elbow_R":[-80,0,0],"head":[16,0,0],"chest":[2,0,0]}].
4. Validate: `python3 tools/art/poselib.py check docs/characters/poses_mark_front_a.json` must print `POSES OK clips=7 frames=36`. Also write one extra assertion in your own /tmp script: expand each clip with `poselib.expand_clip` and confirm the frame counts equal `frames` and that for `idle` every frame's `root[2]` is between 0 and 0.016.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/poselib.py check docs/characters/poses_mark_front_a.json` prints `POSES OK clips=7 frames=36`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC12: Mark poses A: idle, tap, three talk gestures, phone, reading`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
