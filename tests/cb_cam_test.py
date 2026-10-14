# CB04 test: fixed-scale studio camera (run inside Blender).
#   /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_cam_test.py
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'tools', 'art'))
import cbrig  # noqa: E402

TOL = 1.0
# The spec numbers, written out (not read from cbrig) so the test guards them.
PPM = 192
OX, OY = 800, 680


def fresh_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def near(got, want, what):
    assert abs(got - want) <= TOL, '%s: got %.3f, want %.3f' % (what, got, want)


# View 's': world origin on the ground pixel, +x to the right, +z up.
scene = fresh_scene()
cbrig.setup_fixed_camera(scene, 's')
x, y = cbrig.project(scene, (0, 0, 0))
near(x, OX, 'origin x (s)')
near(y, OY, 'origin y (s)')
x, y = cbrig.project(scene, (1, 0, 0))
near(x, OX + PPM, 'x of (1,0,0) (s)')
x, y = cbrig.project(scene, (0, 0, 1))
near(y, OY - PPM * math.cos(math.radians(6.0)), 'y of (0,0,1) (s)')

# View 'q': nose (+x) to the right, and the side (+y) is also to the right.
scene = fresh_scene()
cbrig.setup_fixed_camera(scene, 'q')
x0, _ = cbrig.project(scene, (0, 0, 0))
x, _ = cbrig.project(scene, (1, 0, 0))
near(x - x0, PPM * math.cos(math.radians(25.0)), 'dx of (1,0,0) (q)')
x, _ = cbrig.project(scene, (0, 1, 0))
near(x - x0, PPM * math.sin(math.radians(25.0)), 'dx of (0,1,0) (q)')

# View 'front': head-on, +y is to the right.
scene = fresh_scene()
cbrig.setup_fixed_camera(scene, 'front')
x0, _ = cbrig.project(scene, (0, 0, 0))
x, _ = cbrig.project(scene, (0, 1, 0))
near(x - x0, PPM, 'dx of (0,1,0) (front)')

# View 'r': rear three-quarter, +y is to the left.
scene = fresh_scene()
cbrig.setup_fixed_camera(scene, 'r')
x0, _ = cbrig.project(scene, (0, 0, 0))
x, _ = cbrig.project(scene, (0, 1, 0))
near(x - x0, -PPM * math.sin(math.radians(25.0)), 'dx of (0,1,0) (r)')

# Calling setup twice re-aims and reuses the same camera: exactly one camera object.
scene = fresh_scene()
cbrig.setup_fixed_camera(scene, 's')
cbrig.setup_fixed_camera(scene, 'q')
cams = [o for o in bpy.data.objects if o.type == 'CAMERA']
assert len(cams) == 1, 'expected 1 camera object, got %d' % len(cams)
assert cams[0].name == 'cbcam', 'camera named %r' % cams[0].name
assert scene.camera is cams[0], 'scene.camera is not the cbcam object'
assert cams[0].data.type == 'ORTHO', cams[0].data.type
near(cams[0].data.ortho_scale, cbrig.CANVAS_W / PPM, 'ortho_scale')
assert scene.render.resolution_x == 1600 and scene.render.resolution_y == 800

# A bad view name exits non-zero.
raised = False
try:
    cbrig.setup_fixed_camera(scene, 'zz')
except SystemExit as e:
    raised = True
    assert e.code not in (0, None), 'bad view exit code %r' % (e.code,)
assert raised, 'bad view did not exit'

print('CB CAM OK')
# Blender prints "Blender quit" after the script returns; exit here so that
# CB CAM OK is the last line of output (the acceptance command reads tail -1).
sys.stdout.flush()
os._exit(0)
