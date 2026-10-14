[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC13 Mark poses B: shrug, point, thumbs up, panic, facepalm, celebrate, slump

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC13
Needs (already merged into `dev`): GC12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark's reaction one-shots and loops (front view), same format as poses A. Starting values only.

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- docs/characters/poses_mark_front_a.json (copy its `defaults` and format)
- tools/art/poselib.py

## Files you may change (and nothing else)
- `docs/characters/poses_mark_front_b.json`

## Steps
1. Create `docs/characters/poses_mark_front_b.json` with the same `character`, `view` and `defaults` as file A. Clips are written `name: fps, loop, frames[, hold]`: `shrug`: 8, false, 5, hold 0.6: keys [{},{"hand_L":"open","hand_R":"open","shoulder_L":[-20,20,0],"shoulder_R":[-20,-20,0],"elbow_L":[-70,0,0],"elbow_R":[-70,0,0],"root":[0,0,0.01]},{"hand_L":"open","hand_R":"open","shoulder_L":[-20,35,0],"shoulder_R":[-20,-35,0],"elbow_L":[-90,0,0],"elbow_R":[-90,0,0],"root":[0,0,0.02],"head":[0,6,0]}]; `point`: 8, false, 4, hold 0.8: keys [{},{"hand_R":"point","shoulder_R":[-70,-35,0],"elbow_R":[-10,0,0],"wrist_R":[0,0,0],"head":[0,0,8]}]; `thumbs`: 8, false, 4, hold 0.8: keys [{},{"hand_R":"thumbs","shoulder_R":[-55,-20,0],"elbow_R":[-100,0,0],"wrist_R":[0,0,10],"head":[-3,0,0]}].
2. `panic`: 12, true, 6, hold 0: hands on cheeks and shaking: every key "hand_L":"open","hand_R":"open","shoulder_L":[-35,50,0],"shoulder_R":[-35,-50,0],"elbow_L":[-140,0,0],"elbow_R":[-140,0,0]; keys with root dx alternating: [{"root":[0.02,0,0],"head":[0,6,0]},{"root":[-0.02,0,0],"head":[0,-6,0]},{"root":[0.02,0,0],"head":[0,6,0]},{"root":[-0.02,0,0],"head":[0,-6,0]}]; `facepalm`: 8, false, 5, hold 0.8: keys [{},{"hand_R":"flat","shoulder_R":[-60,-10,0],"elbow_R":[-140,0,0],"wrist_R":[-30,0,0],"head":[20,0,0],"chest":[10,0,0]}]; `celebrate`: 10, true, 6, hold 0: keys [{"hand_L":"fist","hand_R":"fist","shoulder_L":[-10,160,0],"shoulder_R":[-30,-20,0],"elbow_L":[-15,0,0],"elbow_R":[-80,0,0],"root":[0,0,0.03],"head":[-6,0,0]},{"hand_L":"fist","hand_R":"fist","shoulder_L":[-30,20,0],"shoulder_R":[-10,-160,0],"elbow_L":[-80,0,0],"elbow_R":[-15,0,0],"root":[0,0,0.0],"head":[-6,0,0]}]; `slump`: 6, false, 4, hold 1.0: keys [{},{"head":[28,0,0],"chest":[14,0,0],"root":[0,0,-0.03],"shoulder_L":[-10,4,0],"shoulder_R":[-10,-4,0],"elbow_L":[-30,0,0],"elbow_R":[-30,0,0]}].
3. Validate: `python3 tools/art/poselib.py check docs/characters/poses_mark_front_b.json` must print `POSES OK clips=7 frames=34`. Then render a numeric sanity check in /tmp with poselib alone: for clip `celebrate` expand to frames and assert shoulder_L ry >= 100 in at least one frame and shoulder_R ry <= -100 in at least one frame.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/poselib.py check docs/characters/poses_mark_front_b.json` prints `POSES OK clips=7 frames=34`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC13: Mark poses B: shrug, point, thumbs up, panic, facepalm, celebrate, slump`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
