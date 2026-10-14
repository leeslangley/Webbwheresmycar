[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC14 Back-view poses: Mark and Dave seated watching the telly

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC14
Needs (already merged into `dev`): GC03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The seated-from-behind pictures that the Rock Star Ate My Hamster style uses: both characters in chairs with their backs to us, watching the telly. Camera is at +Y, characters face -Y (away from the camera), so a forward arm swing (negative rx) points at the telly. L is still the world -X side (screen-RIGHT in the back view).

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- tools/art/poselib.py
- docs/characters/poses_mark_front_a.json (format)

## Files you may change (and nothing else)
- `docs/characters/poses_mark_back.json`
- `docs/characters/poses_dave_back.json`

## Steps
1. Create `docs/characters/poses_mark_back.json`: `character` "mark", `view` "back", `defaults` {"shoulder_L":[-25,10,0],"shoulder_R":[-25,-10,0],"elbow_L":[-70,0,0],"elbow_R":[-70,0,0],"hand_L":"relaxed","hand_R":"relaxed"} (forearms on chair arms). Clips are written `name: fps, loop, frames[, hold]`: `idle_back`: 2, true, 4: keys [{},{"root":[0,0,0.016],"head":[0,0,2]},{"root":[0,0,0.016],"head":[0,0,-2]}]; `laugh_back`: 10, true, 4: shoulders shaking, head tipped up: keys [{"root":[0,0,0.02],"chest":[-3,0,0],"head":[-8,0,0]},{"root":[0,0,0.0],"chest":[3,0,0],"head":[-6,0,0]},{"root":[0,0,0.02],"chest":[-3,0,0],"head":[-8,0,0]},{"root":[0,0,0.0],"chest":[3,0,0],"head":[-6,0,0]}]; `scratch_back`: 6, false, 6, hold 0.4: right hand scratching the head: keys [{},{"hand_R":"open","shoulder_R":[0,-120,0],"elbow_R":[-100,0,0],"wrist_R":[0,0,0],"head":[0,0,3]},{"hand_R":"open","shoulder_R":[0,-120,0],"elbow_R":[-100,0,0],"wrist_R":[-25,0,0],"head":[0,0,-3]},{"hand_R":"open","shoulder_R":[0,-120,0],"elbow_R":[-100,0,0],"wrist_R":[0,0,0],"head":[0,0,3]},{}]; `point_back`: 8, false, 4, hold 0.8: keys [{},{"hand_R":"point","shoulder_R":[-80,-15,0],"elbow_R":[-5,0,0],"head":[0,0,-4]}]; `lean_back`: 4, false, 4, hold 0.8: keys [{},{"chest":[18,0,0],"head":[-4,0,0],"shoulder_L":[-40,8,0],"shoulder_R":[-40,-8,0]}] (leans in toward the telly).
2. Create `docs/characters/poses_dave_back.json`: `character` "dave", `view` "back", `defaults` {"root":[0,0,-0.42],"hip_L":[-90,4,0],"hip_R":[-90,-4,0],"knee_L":[90,0,0],"knee_R":[90,0,0],"shoulder_L":[-15,8,0],"shoulder_R":[-25,-8,0],"elbow_L":[-30,0,0],"elbow_R":[-85,0,0],"hand_R":"grip","prop_R":"mug","tilt":[0,0,0]} (sitting on the stool, mug in the right hand). Clips (same format): `idle_back`: 2, true, 4: keys [{},{"root":[0,0,-0.404],"chest":[-1.5,0,0]},{"root":[0,0,-0.404],"head":[0,0,3]}]; `laugh_back`: 10, true, 4: keys [{"root":[0,0,-0.40],"chest":[-3,0,0],"head":[-8,0,0]},{"root":[0,0,-0.42],"chest":[3,0,0],"head":[-5,0,0]},{"root":[0,0,-0.40],"chest":[-3,0,0],"head":[-8,0,0]},{"root":[0,0,-0.42],"chest":[3,0,0],"head":[-5,0,0]}]; `sip_back`: 6, false, 6, hold 0.4: keys [{},{"elbow_R":[-120,0,0],"shoulder_R":[-40,-10,0]},{"elbow_R":[-150,0,0],"shoulder_R":[-45,-10,0],"head":[-10,0,0]},{"elbow_R":[-150,0,0],"shoulder_R":[-45,-10,0],"head":[-10,0,0]},{"elbow_R":[-120,0,0],"shoulder_R":[-40,-10,0]},{}].
3. Validate both: `python3 tools/art/poselib.py check docs/characters/poses_mark_back.json` must print `POSES OK clips=5 frames=22`, and the Dave file `POSES OK clips=3 frames=14`.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/poselib.py check docs/characters/poses_mark_back.json` prints `POSES OK clips=5 frames=22`.
- `python3 tools/art/poselib.py check docs/characters/poses_dave_back.json` prints `POSES OK clips=3 frames=14`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC14: Back-view poses: Mark and Dave seated watching the telly`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
