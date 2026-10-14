[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU06 Chunky button with hover/press states, plus press and hover sound hooks

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU06
Needs (already merged into `dev`): GU01, GU02, GU04, GU05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A bevelled arcade button that visibly presses down (face drops 3px) and brightens on hover, with the label centred by formula (fixes labels sitting too high), and a tiny state tracker that fires `app.audio.play('hover'|'tap'|'click'|'deny')` hooks. Pure: the scene still owns hits.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/kit_draw.js (the existing `button` and its tests in tests/kit_draw.test.mjs: disabled = midgrey fill + darkgrey label, hot = lamp strokeStyle; GU21 will make `button` call the new one)
- src/ui/kit_hits.js (hit entries are {id,x,y,w,h,onTap,enabled})
- docs/SCENE_RULES.md (TAP RULE: pressed state is reset only on 'up', never in draw)

## Files you may change (and nothing else)
- `src/ui/button2.js`
- `src/ui/uistate.js`
- `tests/button2.test.mjs`

## Steps
1. `src/ui/button2.js` (imports panels2 chunkyRect, textfit fitOne, icons drawIcon, theme PALETTE/shade, tokens COLOR; must NOT import kit_draw.js). Export `drawButton2(ctx, b, st)`: b = {x,y,w,h,label,enabled=true,hot=false,kind='normal'|'primary'|'danger'|'gold',icon}, st = {hover:false, pressed:false}. fill by kind: normal PALETTE.lightblue, primary PALETTE.good, danger PALETTE.bad, gold COLOR.brass; disabled: PALETTE.midgrey; hover (and enabled, not pressed): shade(fill, 0.12). d = pressed ? 3 : 0. Draw in this order: (1) when not pressed, shadow chunkyRect(x+4, y+4, w, h, 'rgba(0,0,0,0.35)', 4); (2) edge chunkyRect(x, y, w, h, COLOR.ink, 4); (3) lip: fillStyle shade(fill, -0.35), fillRect(x+3, y+h-8, w-6, 5); (4) face: fillStyle fill, fillRect(x+3, y+3+d, w-6, h-11-d); (5) highlight: fillStyle shade(fill, 0.3), fillRect(x+3, y+3+d, w-6, 4); (6) label: size = Math.max(16, Math.min(24, Math.round(h*0.34))); r = fitOne(ctx, label, w-24-(icon?28:0), {kind:'title', maxPx:size}); font = `${r.px}px "Press Start 2P", monospace`, textAlign 'center', textBaseline 'middle', ly = y + d + Math.round((h-5)/2), lx = x + w/2 + (icon ? 14 : 0); unless disabled draw the text first in 'rgba(0,0,0,0.5)' at (lx+2, ly+2); then fillStyle (disabled ? PALETTE.darkgrey : PALETTE.white), fillText(r.text, lx, ly); (7) when icon: drawIcon(ctx, icon, x+12, y + d + Math.round((h-5)/2) - 12, 24); (8) when hot: lineWidth 3, strokeStyle PALETTE.lamp, strokeRect(x, y, w, h).
2. `src/ui/uistate.js`: export `makeUi(app)` -> {hot:null, pressed:null, pointer(type, hit), state(id)}. `pointer('move', hit)`: id = hit && hit.enabled !== false ? hit.id : null; when id !== this.hot set hot = id and, when id is not null, play 'hover'. `pointer('down', hit)`: pressed = hit ? hit.id : null (remember the ID, not the object); when hit is enabled play 'tap', when hit exists but is disabled play 'deny'. `pointer('up', hit)`: committed = hit !== null && hit.enabled !== false && this.pressed !== null && hit.id === this.pressed; pressed = null; when committed play 'click'; return committed (true/false) so the scene can run onTap. `state(id)` -> {hover: id === this.hot, pressed: id === this.pressed}. Playing a sound = `if (app.audio && typeof app.audio.play === 'function' && !(app.settings && app.settings.sound === false)) app.audio.play(name)`. Nothing here resets `pressed` except 'up'.
3. `tests/button2.test.mjs` (use tests/fakeapp.js `makeApp` for audio; its calls log is `app.calls` entries ['play', name]): normal 'START' button {x:10,y:10,w:120,h:40}: texts include 'START'; label fillText y is 10+0+Math.round(35/2)=28; the same button with st.pressed true draws the label at y 31 (exactly 3 lower) and has no shadow fillRect (the unpressed button's first fillRect is the shadow [18,14,112,40]; the pressed one's first fillRect is the edge [14,10,112,40]); fillStyles used include PALETTE.lightblue, shade(PALETTE.lightblue,0.3) and shade(PALETTE.lightblue,-0.35); kind 'primary' uses PALETTE.good; hover uses shade(PALETTE.lightblue,0.12) as the face; disabled uses PALETTE.midgrey for the face and PALETTE.darkgrey for the label; hot sets strokeStyle PALETTE.lamp; icon:'coin' adds drawIcon fillRects inside [x+12, x+36]; a button {x:0,y:0,w:120,h:64,label:'ABCDEFGH'} starts at size 22 and is drawn with font px 20 (96 = 8*0.6*20 fits w-24 = 96) while a 40-char label on the same button ends at px 16 with an ellipsis ('...' at the end of the drawn text). uistate: move over an enabled hit plays 'hover' once (moving again over the same id plays nothing); down on enabled plays 'tap'; up on the same id returns true and plays 'click'; up on a different id returns false and plays nothing; down on a disabled hit plays 'deny'; with app.settings.sound false nothing is played; calling `state` never changes `pressed`.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/button2.test.mjs'` prints one line.
- `grep -c "from './kit_draw.js'" src/ui/button2.js src/ui/uistate.js` prints 0 for both files.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/kit_draw.js (GU21).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU06: Chunky button with hover/press states, plus press and hover sound hooks`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
