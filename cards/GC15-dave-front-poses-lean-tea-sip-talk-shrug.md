[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC15 Dave front poses: lean, tea sip, talk, shrug, point, thumbs, panic, facepalm, celebrate

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC15
Needs (already merged into `dev`): GC03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Dave leaning on the garage door with his mug (front view), idle and reactions, as pose-table JSON. Starting values; QA will adjust.

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- tools/art/poselib.py
- docs/characters/poses_mark_front_a.json (format)

## Files you may change (and nothing else)
- `docs/characters/poses_dave_front.json`

## Steps
1. Create `docs/characters/poses_dave_front.json`: `character` "dave", `view` "front", `defaults` {"tilt":[0,6,0],"shoulder_L":[-10,5,0],"elbow_L":[-10,0,0],"shoulder_R":[-25,-8,0],"elbow_R":[-85,0,0],"hand_R":"grip","prop_R":"mug","hand_L":"relaxed"}. Clips are written `name: fps, loop, frames[, hold]`, then keys: `idle`: 3, true, 6: [{},{"root":[0,0,0.016],"chest":[-1.5,0,0]},{"root":[0,0,0.016],"head":[0,0,3]}]; `sip`: 6, false, 8, hold 0: the mug goes up and back down so the clip ends where it began: [{},{"elbow_R":[-110,0,0],"shoulder_R":[-35,-10,0]},{"elbow_R":[-145,0,0],"shoulder_R":[-45,-10,0],"head":[-8,0,0]},{"elbow_R":[-110,0,0],"shoulder_R":[-35,-10,0]},{}]; `talk`: 8, true, 6: left arm waving, mug stays: [{"hand_L":"open","shoulder_L":[-45,25,0],"elbow_L":[-80,0,0]},{"hand_L":"open","shoulder_L":[-55,32,0],"elbow_L":[-100,0,0],"head":[3,0,0]},{"hand_L":"open","shoulder_L":[-40,22,0],"elbow_L":[-75,0,0]}]; `shrug`: 8, false, 5, hold 0.6: [{},{"hand_L":"open","shoulder_L":[-20,35,0],"elbow_L":[-90,0,0],"root":[0,0,0.02],"head":[0,6,0]}].
2. `point`: 8, false, 4, hold 0.8: the left hand points with the spanner: [{},{"prop_L":"spanner","hand_L":"grip","shoulder_L":[-75,30,0],"elbow_L":[-10,0,0],"head":[0,0,-6]}]; `thumbs`: 8, false, 4, hold 0.8: [{},{"hand_L":"thumbs","shoulder_L":[-55,25,0],"elbow_L":[-100,0,0],"head":[-3,0,0]}]; `panic`: 12, true, 6: both arms up, mug held aloft: every key "hand_L":"open","shoulder_L":[-10,140,0],"elbow_L":[-20,0,0],"shoulder_R":[-10,-140,0],"elbow_R":[-20,0,0]; keys [{"root":[0.02,0,0],"head":[0,6,0]},{"root":[-0.02,0,0],"head":[0,-6,0]}]; `facepalm`: 8, false, 5, hold 0.8: [{},{"hand_L":"flat","shoulder_L":[-60,12,0],"elbow_L":[-140,0,0],"wrist_L":[-30,0,0],"head":[20,0,0],"chest":[8,0,0]}]; `celebrate`: 10, true, 6: [{"hand_L":"fist","shoulder_L":[-10,160,0],"elbow_L":[-15,0,0],"shoulder_R":[-30,-20,0],"root":[0,0,0.03]},{"hand_L":"fist","shoulder_L":[-30,20,0],"shoulder_R":[-10,-160,0],"elbow_R":[-15,0,0],"root":[0,0,0.0]}].
3. Validate: `python3 tools/art/poselib.py check docs/characters/poses_dave_front.json` must print `POSES OK clips=9 frames=50`.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/poselib.py check docs/characters/poses_dave_front.json` prints `POSES OK clips=9 frames=50`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC15: Dave front poses: lean, tea sip, talk, shrug, point, thumbs, panic, facepalm, celebrate`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
