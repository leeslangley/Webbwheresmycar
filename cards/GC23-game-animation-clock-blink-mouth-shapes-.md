[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC23 Game: animation clock, blink, mouth shapes and the actor state machine

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC23
Needs (already merged into `dev`): W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The pure animation logic for characters, testable with exact numbers: which frame of a clip at time t, when a blink happens, which mouth shape for a spoken text at time t, and an `actor` that switches between idle, talk and one-shot reactions. No drawing, no DOM, no Date, no Math.random. It consumes the character block of `assets/art/characters/manifest.json` (shape below).

## Read first
- tests/harness.js (test, eq, ok, near, done)
- src/art/common.js (the `blink` helper style)
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- Manifest character block: `{frame:{w,h}, head:{w,h,pivot:[40,66]}, clips:{<name>:{view,fps,loop,hold,frames:[{id,neck:[x,y],angle}]}}, heads:{<face>:{<angle>:<id>}}, head_back:<id>, busts:{<face>:<id>}}`

## Files you may change (and nothing else)
- `src/art/anim.js`
- `tests/anim.test.mjs`

## Steps
1. Create `src/art/anim.js` exporting: `clipFrame(clip, t)` -> frame index: loop clips `Math.floor(t * clip.fps) % n`; one-shots `Math.min(n - 1, Math.floor(t * clip.fps))`; t < 0 -> 0; `clipDone(clip, t)` -> true when `!clip.loop && t >= n / clip.fps + clip.hold`; `blinkClosed(t, seed)` -> `P = 3.4 + 0.3 * (seed % 5)`, true when `(t % P) >= P - 0.14`; `visemeFor(ch)` -> face name: letters `a` -> 'talk_A'; `e`,`i` -> 'talk_E'; `o`,`u` -> 'talk_O'; `m`,`b`,`p` -> 'talk_M'; letters `l t d n s z c k g r y h j q w x` -> 'talk_E'; `f`,`v`, space, digits and punctuation -> 'neutral' (case-insensitive); `mouthAt(text, since, cps = 14)` -> `i = Math.floor(since * cps)`; `since < 0` or `i >= text.length` -> 'neutral'; else `visemeFor(text[i])`; `talkSeconds(text, cps = 14)` -> `text.length / cps` capped at 4.
2. `createActor(char, opts)`: `char` = the manifest character block; `opts = {seed: 0, idle: 'idle', talkClips: ['talk_a','talk_b','talk_c']}`. State: `base` ('idle' clip name), `mood` ('neutral' | 'happy' | 'worried'), `talk` ({text, start} or null), `react` ({clip, start, face} or null). Methods: `setMood(m)`; `talk(text, t)` starts talking at time t (sentence number counts up; the body clip is `talkClips[count % 3]` skipping names missing from `char.clips`, falling back to the idle clip); `react(clip, t, face)` plays a one-shot or loop clip from t (replaces a talk); `stop()` clears talk and react; `at(t)` returns `{clip, index, bodyId, neck, angle, face, headId}` where: the clip is the react clip while `react` is active (a non-looping react ends at `clipDone` and then the actor returns to talk/idle automatically; a looping react runs until `stop()`), else the talk clip while `t - talk.start < talkSeconds(text)`, else the idle clip; `index = clipFrame(clip, t - clipStart)`; `bodyId`, `neck`, `angle` come from that frame; `face`: the react face if given, else while talking `mouthAt(text, t - start)`, else `blink` -> 'blink' when `blinkClosed(t, seed)` else the mood face ('neutral', 'happy' or 'worried'); `headId` = `char.heads[face][angle]`, falling back to `char.heads[face].fwd`, then `char.heads.neutral.fwd`; for a clip whose view is 'back' `headId = char.head_back`.
3. Create `tests/anim.test.mjs` with a fake character block: clips `idle` (fps 3, loop, 6 frames ids `m_idle_00..05`, necks [72,75]+index, angle 'fwd'), `talk_a` (fps 8, loop, 6 frames), `shrug` (fps 8, not loop, hold 0.6, 5 frames), `idle_back` (view 'back'); heads {neutral:{fwd:'h_n',down:'h_nd'}, blink:{fwd:'h_b'}, happy:{fwd:'h_h'}, talk_A:{fwd:'h_a'}, talk_O:{fwd:'h_o'}, talk_E:{fwd:'h_e'}, talk_M:{fwd:'h_m'}, worried:{fwd:'h_w'}}, head_back 'h_back'. Assertions: `clipFrame(idle, 0) == 0`, `(idle, 0.34) == 1`, `(idle, 2.0) == 0` (6 frames at 3 fps loop every 2 s), `(shrug, 100) == 4`; `clipDone(shrug, 0.5) == false`, `(shrug, 5/8 + 0.6 + 0.01) == true`, `clipDone(idle, 1000) == false`; `blinkClosed(3.3, 0) == true` (period 3.4, 3.3 >= 3.26), `blinkClosed(3.0, 0) == false`, `blinkClosed(3.5, 1) == false` and `blinkClosed(3.6, 1) == true` (period 3.7); `visemeFor('a') == 'talk_A'`, `('M') == 'talk_M'`, `(' ') == 'neutral'`, `('z') == 'talk_E'`; `mouthAt('Boss', 0) == 'talk_M'`, `mouthAt('Boss', 1/14 + 0.001) == 'talk_O'`, `mouthAt('Boss', 100) == 'neutral'`; `talkSeconds('Hello') == 5/14` (near) and `talkSeconds` of a 100 character text is 4; actor: idle at t 0.1 gives `bodyId 'm_idle_00'` and face 'neutral'; after `talk('Hello', 1)` at t = 1.0 the clip is `talk_a`, face `talk_E` (the first letter h) and `headId 'h_e'`; at t = 1 + 5/14 + 0.01 the actor is back on idle; `react('shrug', 2, 'worried')` at t 2.0 gives clip shrug and `headId 'h_w'`, and at t = 2 + 5/8 + 0.6 + 0.01 it is back on idle; the `idle_back` clip (an actor made with `opts.idle = 'idle_back'`) gives `headId 'h_back'`; an unknown face falls back to 'h_n'; `setMood('happy')` gives `headId 'h_h'` when not blinking (pick a t where `blinkClosed` is false).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep anim` shows `PASS tests/anim.test.mjs`.
- `grep -c 'Math.random\|Date' src/art/anim.js` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC23: Game: animation clock, blink, mouth shapes and the actor state machine`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
