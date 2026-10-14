[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD08 Blender: render any room script on a wider frame (roomwide.py)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD08
Needs (already merged into `dev`): GE02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One driver that renders a GE room script 1568x720 instead of 1280x720 WITHOUT editing the room scripts: the camera and image get 144 px more each side, `roomlib.project` still returns game-screen pixels, and every box that touches the old left or right frame edge (wall, floor, skirting, cornice, shop fronts, curtains) is stretched out to the new edge just before the render. The prototype of this driver was run on the office and title prototype scripts and looked at by a human: the code below is that code. ORDER: after GE02 (roomlib.py). WD10 uses it.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- tools/art/roomlib.py (GE02: `setup_camera`, `project`, `reset`, `wx`, `wz`, `box`, `mat`, `light`, `world`, `setup_render`) and docs/art/ge_proto/room_title.py (how a room script calls them)
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy; no PIL.

## Files you may change (and nothing else)
- `tools/art/roomwide.py`
- `tests/run_roomwide.sh`

## Steps
1. Create `tools/art/roomwide.py` with exactly this content (do not redesign; the render_pre handler is registered inside the patched `setup_camera` because `roomlib.reset()` clears all app handlers):
```python
# tools/art/roomwide.py: render any room script on a wider frame (card WD08).
# blender --background --python-exit-code 1 --python tools/art/roomwide.py -- <room_script.py> [the room script's own args]
import os, sys
import bpy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import roomlib

MARGIN = 144                    # extra screen px each side of the 1280 stage
STAGE_W, FRAME_H = 1280, 720
EDGE_TOL = 0.02                 # metres (2 px): a box this close to the old frame edge counts as touching it


def frame_w(margin=None):
    return STAGE_W + 2 * (MARGIN if margin is None else margin)


def extend_edges(margin=None):
    """Stretch every axis-aligned box that touches the old left or right frame edge out to the new edge. Returns how many."""
    m = MARGIN if margin is None else margin
    lo, hi = roomlib.wx(-m), roomlib.wx(STAGE_W + m)
    n = 0
    for ob in bpy.data.objects:
        if ob.type != 'MESH' or len(ob.data.vertices) == 0:
            continue
        if any(abs(ob.matrix_world[i][j] - (1.0 if i == j else 0.0)) > 1e-9 for i in range(4) for j in range(4)):
            continue            # only boxes made by roomlib.box (identity transform)
        xs = [v.co.x for v in ob.data.vertices]
        x0, x1 = min(xs), max(xs)
        changed = False
        if x0 <= roomlib.wx(0) + EDGE_TOL and x0 > lo + 1e-6:
            for v in ob.data.vertices:
                if v.co.x <= x0 + 1e-6:
                    v.co.x = lo
            changed = True
        if x1 >= roomlib.wx(STAGE_W) - EDGE_TOL and x1 < hi - 1e-6:
            for v in ob.data.vertices:
                if v.co.x >= x1 - 1e-6:
                    v.co.x = hi
            changed = True
        if changed:
            ob.data.update()
            n += 1
    return n


def install(margin=None):
    """Patch roomlib so room scripts render wide without any change: wider camera and image, project() still returns
    game-screen px (x minus the margin), and the edge boxes are stretched just before the render starts."""
    m = MARGIN if margin is None else margin
    fw = frame_w(m)
    orig_cam, orig_proj = roomlib.setup_camera, roomlib.project

    def setup_camera(scene, w=None, h=FRAME_H):
        orig_cam(scene, fw if w is None else w, h)
        scene.camera.data.ortho_scale = (fw if w is None else w) / 100.0
        # roomlib.reset() clears app handlers, and setup_camera always runs after reset: register here.
        bpy.app.handlers.render_pre[:] = [f for f in bpy.app.handlers.render_pre if getattr(f, '__name__', '') != 'wide_pre']

        def wide_pre(*a):
            print('WIDE extended=%d frame=%dx%d' % (extend_edges(m), fw, FRAME_H))
        bpy.app.handlers.render_pre.append(wide_pre)

    def project(scene, point):
        x, y = orig_proj(scene, point)
        return x - m, y

    roomlib.setup_camera, roomlib.project = setup_camera, project
    return m


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:]
    script, rest = args[0], args[1:]
    install()
    sys.argv = [script, '--'] + rest
    g = {'__name__': '__main__', '__file__': os.path.abspath(script)}
    exec(compile(open(script).read(), script, 'exec'), g)
```
2. Create `tests/run_roomwide.sh` (sh, `set -u`, `cd` to the repo root, `BLENDER=${BLENDER:-/opt/homebrew/bin/blender}`, `mkdir -p /tmp/wd08`). It writes this probe to `/tmp/wd08/probe.py` (a here-doc) and runs `$BLENDER --background --python-exit-code 1 --python /tmp/wd08/probe.py`, keeping only lines that contain `WD08` or `WIDE`:
```python
import sys, bpy
sys.path.insert(0, 'tools/art')
import roomlib as R, roomwide as W
W.install()
sc = R.reset()
R.setup_camera(sc)
R.setup_render(sc, '/tmp/wd08/probe.png', 4)
R.world(sc, '#808080', 1.0)
m = R.mat('g', '#c08040')
R.box('wall', 0.0, 12.8, 0.0, 0.3, R.wz(700), R.wz(-200), m, 0)
R.box('mid', R.wx(400), R.wx(500), -0.5, 0.0, R.wz(400), R.wz(300), m, 0)
R.light('SUN', 'sun', (0, 5, 8), 3.0, '#ffffff', 1.0, (1.0, 0, 0))
print('WD08 res', sc.render.resolution_x, sc.render.resolution_y, round(sc.camera.data.ortho_scale, 3))
bpy.ops.render.render(write_still=True)
xs = [v.co.x for v in bpy.data.objects['wall'].data.vertices]
print('WD08 wall', round(min(xs), 3), round(max(xs), 3))
xs = [v.co.x for v in bpy.data.objects['mid'].data.vertices]
print('WD08 mid', round(min(xs), 3), round(max(xs), 3))
print('WD08 proj0 %.1f' % R.project(sc, (R.wx(0), 0.0, R.wz(300)))[0])
print('WD08 proj1280 %.1f' % R.project(sc, (R.wx(1280), 0.0, R.wz(300)))[0])
im = bpy.data.images.load('/tmp/wd08/probe.png')
w, h = im.size
a = im.pixels[:]
def alpha(x, y):
    return a[((h - 1 - y) * w + x) * 4 + 3]
print('WD08 img', w, h, 'alphaL %.2f alphaR %.2f alphaC %.2f' % (alpha(10, 300), alpha(w - 10, 300), alpha(w // 2, 300)))
```
3. The shell script requires these numbers (use `awk`): `WD08 res 1568 720 15.68`; `WIDE extended=` with a number >= 1; `WD08 wall -1.44 14.24`; `WD08 mid 4.0 5.0`; `WD08 proj0` within 1 of 0 and `WD08 proj1280` within 1 of 1280 (so game-screen coordinates are unchanged); `WD08 img 1568 720` with `alphaL 1.00 alphaR 1.00 alphaC 1.00`. Print `ROOMWIDE OK` when all hold, otherwise print the captured lines and exit 1.
4. Also run it by hand on the real prototype room script as a smoke test and say in your summary what it printed: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/roomwide.py -- tools/art/room_title.py --out /tmp/wd08/title_wide.png --samples 8` (or `docs/art/ge_proto/room_title.py /tmp/wd08/title_wide.png 8` if the production script is not merged yet; the prototype takes the output as its first argument). It must print a `WIDE extended=` line with a number >= 4 and `RENDERED`, and the PNG must be 1568x720 (read the width and height from the PNG header: `struct.unpack('>II', data[16:24])`).

## Acceptance (all must pass; exact commands)
- `sh tests/run_roomwide.sh` prints `ROOMWIDE OK`.
- `python3 -c "import ast;ast.parse(open('tools/art/roomwide.py').read())"` prints nothing and exits 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- tools/art/roomlib.py and every room script (the driver patches them at run time).
- Do not commit PNGs (WD10 does).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD08: Blender: render any room script on a wider frame (roomwide.py)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
