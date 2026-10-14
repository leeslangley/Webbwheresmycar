[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC03 Expression table and pose library (pure python)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC03
Needs (already merged into `dev`): GC02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two pieces every later card uses: the shared table of faces (brows, eyes, mouths) and a pure-python pose library (joint names, limits, expand a short clip of key poses into per-frame poses, validate a pose file). No Blender needed here.

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)

## Files you may change (and nothing else)
- `docs/characters/expressions.json`
- `tools/art/poselib.py`
- `tests/run_poselib.sh`

## Steps
1. Create `docs/characters/expressions.json`: `{"faces": {...}, "mouths": {...}}`. `mouths` has exactly these 11 keys, each {`w`: half-width in units, `h`: open height in units, `curve`: -1..1 (positive = corners up), `teeth`: bool, `tongue`: bool}: closed {0.05,0.004,0,false,false}; smile {0.07,0.008,0.6,false,false}; grin {0.085,0.03,0.8,true,false}; frown {0.05,0.006,-0.7,false,false}; A {0.06,0.05,0,true,true}; E {0.07,0.022,0.2,true,false}; O {0.035,0.045,0,false,true}; M {0.05,0.004,0,false,false}; wobble {0.06,0.012,-0.3,false,false}; wide {0.08,0.07,0.3,true,true}; smirk {0.07,0.008,0.5,false,false}. `faces` has exactly these 16 keys, each {`brow`: {`inner`: raise of the inner end in units, `outer`: raise of the outer end}, `eye`: {`open`: 0..1, `dx`, `dz`: pupil offset in units, `pupil`: scale 0.6..1.4}, `mouth`: a key of `mouths`}. Values are given as brow inner/outer; eye open/dx/dz/pupil; mouth. neutral 0/0; 1/0/0/1; closed. blink 0/0; 0.08/0/0/1; closed. happy 0.01/0.03; 0.75/0/0/1; smile. grin 0.01/0.04; 0.7/0/0/1; grin. laugh 0.02/0.05; 0.25/0/0/1; wide. worried 0.07/-0.01; 1/0/0.005/0.9; wobble. panic 0.09/0.06; 1/0/0/0.6; wide. shock 0.08/0.08; 1/0/0/0.7; O. smug 0.0/0.02; 0.6/0.01/-0.005/1; smirk. sad 0.06/-0.03; 0.8/0/-0.01/1; frown. angry -0.05/0.02; 0.85/0/0/1; frown. think 0.03/0.0; 1/0.02/0.02/1; closed. talk_A, talk_E, talk_O and talk_M: all brow 0.01/0.02 and eye 1/0/0/1 with mouth A, E, O, M. That is exactly 16 faces: neutral blink happy grin laugh worried panic shock smug sad angry think talk_A talk_E talk_O talk_M.
2. Create `tools/art/poselib.py` (python3 standard library only; no bpy). Constants: `JOINTS = ['root','tilt','chest','head','shoulder_L','shoulder_R','elbow_L','elbow_R','wrist_L','wrist_R','hip_L','hip_R','knee_L','knee_R']` (`root` = [dx,dy,dz] translation in units, every other joint [rx,ry,rz] degrees; L is the -X side of the world, R the +X side; in the front view L is screen-left); `HANDS = ['relaxed','open','fist','point','thumbs','flat','phone','spread','grip']`; `PROPS = ['none','mug','phone','paper','spanner']`; `HEAD_ANGLES = {'fwd':[0,0,0],'tilt_l':[0,-10,0],'tilt_r':[0,10,0],'down':[20,0,0],'up':[-14,0,0],'turn_l':[0,0,-30],'turn_r':[0,0,30]}`; `LIMITS` = per joint a [lo,hi] per axis: shoulder [-180,180],[-180,180],[-90,90]; elbow [-150,5],[-20,20],[-20,20]; wrist [-70,70] each; chest [-35,35] each; head [-40,40] each; tilt [-15,15] each; hip [-120,30],[-40,40],[-30,30]; knee [-5,150],[-10,10],[-10,10]; root +-0.3 on each axis. Conventions (write them in a comment): chest and head positive rx = lean or nod FORWARD (toward -Y, the front camera); limbs hanging down (shoulder, elbow, wrist, hip, knee) negative rx = swing forward; shoulder ry positive swings the arm toward -X (outward for L, inward for R); head ry positive tilts the top toward +X; head rz positive turns the nose toward +X.
3. Functions in `poselib.py`: `merge_defaults(defaults, frame)` -> new dict (frame values override; hand/prop/face names are copied; missing joints take the default or [0,0,0]; `root` default [0,0,0]). `smooth(u)` = u*u*(3-2u). `expand_clip(clip, defaults)` -> list of full frame dicts, `clip['frames']` long: `clip['keys']` is a list of partial frame dicts; key i sits at position `i*(N-1)/(K-1)` for a non-looping clip and `i*N/K` for a looping clip (the last frames interpolate back toward key 0); numeric joint values are interpolated with `smooth` between the two surrounding keys; name fields (`hand_L hand_R prop_L prop_R face`) take the value of the earlier key (step); K == 1 repeats the key N times. `head_angle(rot, view)` -> name from HEAD_ANGLES: view 'back' -> 'back'; else rz >= 20 -> 'turn_r', rz <= -20 -> 'turn_l', rx >= 12 -> 'down', rx <= -10 -> 'up', ry >= 5 -> 'tilt_r', ry <= -5 -> 'tilt_l', else 'fwd'. `validate_pose_file(doc, face_names)` -> list of error strings (empty = fine): doc has `character`, `view` ('front' or 'back'), `defaults` (a frame dict), `clips` (dict); each clip has int `fps` 1..30, bool `loop`, number `hold` (>= 0), int `frames` 1..16, a non-empty `keys` list; every key joint name is in JOINTS with 3 numbers (root 3 numbers) inside LIMITS; hand names in HANDS, prop names in PROPS, `face` in `face_names`.
4. CLI: `python3 tools/art/poselib.py check <poses.json>` loads `docs/characters/expressions.json` for the face names, validates, prints `POSES OK clips=<c> frames=<f>` (f = sum of the clips' `frames`) and exits 0; otherwise it prints each error and exits 2. `python3 tools/art/poselib.py selftest` runs these asserts and prints `POSELIB OK`: a looping clip with keys [{root:[0,0,0]},{root:[0,0,0.02]}] and frames 4 expands to 4 frames whose root dz values are [0, 0.01, 0.02, 0.01] (to 6 decimals; key 1 sits at position 2, frames 1 and 3 are halfway); a non-looping clip with 2 keys and 3 frames has frame 0 equal to key 0, frame 2 equal to key 1 and a halfway middle frame; `head_angle([25,0,0],'front') == 'down'`, `head_angle([0,0,25],'front') == 'turn_r'`, `head_angle([0,0,0],'back') == 'back'`. `tests/run_poselib.sh`: runs selftest and a `python3 -c` that loads expressions.json and asserts `len(faces) == 16 and len(mouths) == 11` and every face's mouth is a key of mouths, then prints `POSELIB TESTS OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_poselib.sh` prints `POSELIB OK` and `POSELIB TESTS OK`.
- `python3 -c "import json;d=json.load(open('docs/characters/expressions.json'));print(len(d['faces']),len(d['mouths']))"` prints `16 11`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC03: Expression table and pose library (pure python)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
