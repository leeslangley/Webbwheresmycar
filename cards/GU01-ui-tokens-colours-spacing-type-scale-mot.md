[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU01 UI tokens: colours, spacing, type scale, motion, easing

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU01
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One file holding every number of the new UI language (palette additions, 4px spacing grid, the three screen zones, type scale with phone-safe minimum sizes, motion timings, easing functions) so later cards never invent numbers.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/tokens.js`
- `tests/tokens.test.mjs`

## Steps
1. `src/ui/tokens.js` (ES module, no imports needed except `font` from './theme.js'). Export `COLOR`, a frozen-style plain object with EXACTLY these 29 keys: ink '#14102A', night '#1B1735', well '#241E45', wood '#6B4423', woodLight '#8C5E34', woodDark '#3F2814', woodGrain '#4E3119', brass '#C9A24A', brassLight '#F2D98A', brassDark '#8A6B1F', enamelRed '#B3282D', enamelGreen '#1E5A3C', enamelNavy '#1C2E5A', paper '#FFF7DC', paperShade '#D9CBA0', paperFold '#C2B183', bannerTop '#F6CFA0', bannerBottom '#D9A66F', bannerDither '#C48B55', hudBg '#1B1735', hudEdge '#0B0818', chartWhite '#F8F6EE', cashGreen '#3FAE49', cashDark '#1F6B2E', rivet '#C9CCD2', phosphor '#7CFF8A', amber '#FFB84D', warn '#F2A93B', info '#70A4B2'.
2. Export `SPACE` = {1:4, 2:8, 3:12, 4:16, 5:24, 6:32, 7:48} and `sp(n)` returning SPACE[n] (throw Error('bad space') for any other n). Export `ZONES` = {banner:{x:0,y:0,w:1280,h:120}, tableau:{x:0,y:120,w:1280,h:470}, hud:{x:0,y:590,w:1280,h:130}}. Export `FLOOR` = {title:16, body:22} (smallest allowed px per font kind: on an iPhone held landscape the 1280x720 canvas is scaled by about 0.55, so 22px VT323 is about 12 CSS px and 16px Press Start 2P about 9 CSS px). Export `TYPE` = {logo:{kind:'title',px:64}, h1:{kind:'title',px:32}, h2:{kind:'title',px:24}, h3:{kind:'title',px:16}, button:{kind:'title',px:16}, bannerText:{kind:'title',px:16,lineH:28}, hero:{kind:'body',px:40}, body:{kind:'body',px:28}, caption:{kind:'body',px:24}}. Export `fontFor(role)` = font(TYPE[role].kind, TYPE[role].px) (throw Error('bad role') when unknown).
3. Export `MOTION` (milliseconds) = {tap:90, press:80, toast:260, toastHold:2500, toastOut:200, bar:450, count:700, page:320, slide:350, fade:250, iris:500, static:400, flip:700, shake:300, flash:180, dayChange:2400}. Export `clamp01(u)`, `lerp(a, b, u)` = a + (b - a) * u, and `EASE` = {linear, outQuad, outCubic, inOutQuad, outBack, outBounce}, each a function of u in 0..1 (callers clamp): outQuad = 1-(1-u)^2; outCubic = 1-(1-u)^3; inOutQuad = u<0.5 ? 2u^2 : 1-(-2u+2)^2/2; outBack uses c1=1.70158, c3=c1+1: 1 + c3*(u-1)^3 + c1*(u-1)^2; outBounce is the standard four-segment bounce (n1=7.5625, d1=2.75). Also export `ease(name, u)` = EASE[name](clamp01(u)), throwing Error('bad ease') for an unknown name.
4. `tests/tokens.test.mjs`: assert COLOR has 29 keys and every value matches /^#[0-9A-Fa-f]{6}$/; spot-check exact values for ink, brass, bannerTop, cashGreen; `sp(3)` is 12 and `sp(9)` throws; ZONES heights add up (banner.h + tableau.h + hud.h === 720) and each zone starts where the previous ends; `fontFor('button')` is '16px "Press Start 2P", monospace'; `fontFor('body')` is '28px VT323, monospace'; for every name in EASE, f(0) is 0 and f(1) is 1 within 1e-9 (outBack(0) may be 2.2e-16: use a tolerance); outQuad(0.5)=0.75, outCubic(0.5)=0.875, inOutQuad(0.25)=0.125, outBack(0.5) within 1e-6 of 1.0876975; `ease('outCubic', 2)` is 1 and `ease('outCubic', -1)` is 0; `ease('nope', 0)` throws.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/tokens.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/theme.js and every other existing file.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU01: UI tokens: colours, spacing, type scale, motion, easing`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
