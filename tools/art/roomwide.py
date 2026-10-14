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
