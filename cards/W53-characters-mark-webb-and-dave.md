[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W53 Characters: Mark Webb and Dave

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W53
Needs (already merged into `dev`): W48, W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Draw the two characters with idle animation, and a speech bubble.

## Read first
- docs/DESIGN.md section 5 and 7.3
- src/art/common.js (blink, pulse, roundedPoly, circle)
- src/art/officelayout.js is being written by another card: use the numbers in this card instead of importing it
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/characters.js`
- `tests/characters.test.mjs`

## Steps
1. Create `src/art/characters.js` exporting `drawMark(ctx, x, y, s, t, mood = 'normal', outfit = 'denim')` and `drawDave(ctx, x, y, s, t)`. `(x, y)` is the bottom-centre of the figure (for Mark: the seat position; his lower body is hidden behind the desk so draw only from the waist up), `s` is a scale (1 = about 190px tall for Mark's visible top half, 210px for Dave), `t` seconds.
2. Mark Webb (affectionate cartoon caricature, vector, friendly; the real Mark is a friend of the author): head (peach `#f1c9a5`, ear), big tousled wavy light-brown hair `#8a6a46` with darker strands `#5a3b24`, drawn as a messy cluster of curly blobs standing slightly out at the sides and a quiff on top; round dark-rimmed glasses (`#1a1a22`, thick round frames, clear lenses with a small white glint) sitting on a straight nose; light stubble (a few tiny dark dots along the jaw, alpha 0.35); wide open eyes (white with dark pupils that drift left and right slowly: `Math.sin(t*0.7)*1.5*s`; closed lines when `blink(t, 4)`); expressive eyebrows (raised and slightly arched for 'normal' = permanently surprised look, inner ends lifted for 'worried', lowered for 'happy'); mouth: slightly open lopsided half-smile for 'normal', big grin for 'happy', small flat line for 'worried'. Outfit: dark denim jacket (`#232f4a`, collar and a stitched seam) over a cream tee (`#f4e9c8`) with a dark ringer neckline. Shoulders bob `Math.sin(t*1.6)*1.5*s`; his right arm rests on the desk and the hand taps fingers: the hand moves up and down by `Math.max(0, Math.sin(t*5))*3*s`. Accept an optional 4th outfit `'hoodie'` (maroon `#6a1f2b` zip hoodie over a yellow `#e8d44a` tee) through `opts`: signature `drawMark(ctx, x, y, s, t, mood = 'normal', outfit = 'denim')`.
3. Dave 'Spanner' Dobbs: stockier, leaning (body tilted 6 degrees), oil-stained blue overalls `#2f5d9e` with a grease smudge, a flat cap `#444444`, a big moustache, one hand holding a mug of tea (`#e8e0cc` mug) with three steam wisps (small vertical wavy lines using `Math.sin(t*2 + i)` offsets and alpha fading), blinking every 3.3 seconds (`blink(t, 3.3)`), and a slow head bob.
4. Export `speechBubble(ctx, rect, text, t)`: draws a white rounded rectangle at `rect` ({x,y,w,h}) with an ink border (3px) and a small tail triangle pointing down-left toward the speaker, with `text` wrapped inside (body font 26px, ink colour, max 3 lines; truncate with an ellipsis if longer); the bubble gently bobs `Math.sin(t*2)*2` px vertically. Implement the wrapping locally (simple greedy by `measureText`), do not import kit_draw.
5. Write `tests/characters.test.mjs`: both draw functions run for t = 0, 1.3, 3.95 without throwing, with `save` count equal to `restore` count; the call logs for t = 0 and t = 1.3 differ (JSON.stringify of `ctx.calls` differs); `drawMark` with mood 'worried' differs from 'normal' at the same t, and outfit 'hoodie' differs from 'denim'; the blink moment (Mark at t = 3.95: blink true) differs from t = 3.0; `speechBubble` with a 200-char string draws at most 3 text lines and the last line ends with `...`; with a short string draws exactly 1 line containing the text.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No office background and no layout import.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W53: Characters: Mark Webb and Dave`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
