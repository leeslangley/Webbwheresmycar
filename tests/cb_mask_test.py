# CB05 test: game-mask render pass (run inside Blender).
#   /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_mask_test.py
# Plain asserts: any failure makes Blender exit non-zero.
import os
import sys

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'tools', 'art'))
import carlib  # noqa: E402
import cbmat  # noqa: E402
import cbrig  # noqa: E402

OUT = '/tmp/cb_mask.png'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
engine_before = scene.render.engine
samples_before = scene.cycles.samples

if hasattr(cbrig, 'setup_fixed_camera'):
    cbrig.setup_fixed_camera(scene, 's')
else:
    # CB04 not merged: ortho camera from the card, 400x200 px.
    scene.render.resolution_x = 400
    scene.render.resolution_y = 200
    scene.render.resolution_percentage = 100
    cam_data = bpy.data.cameras.new('cbcam')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 7.0
    cam = bpy.data.objects.new('cbcam', cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0.0, -20.0, 1.0)
    carlib.look_at(cam, (0.0, 0.0, 1.0))
    scene.camera = cam

# Paint cube on the left, chrome sphere on the right.
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.2, 0.0, 1.0))
cube = bpy.context.active_object
cube.data.materials.append(cbmat.make_paint('#C96F32'))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.6, location=(1.2, 0.0, 1.0))
ball = bpy.context.active_object
ball.data.materials.append(cbmat.make_chrome())

cbrig.render_mask(scene, OUT)

# The PNG must hold exact file values: load as data, not colour.
img = bpy.data.images.load(OUT, check_existing=False)
img.colorspace_settings.name = 'Non-Color'
w, h = img.size
flat = np.empty(w * h * 4, dtype=np.float32)
img.pixels.foreach_get(flat)
vals = np.rint(flat.reshape(h, w, 4) * 255).astype(int)
rgb = vals[:, :, :3]
alpha = vals[:, :, 3]

assert set(np.unique(alpha).tolist()) <= {0, 255}, np.unique(alpha)
opaque = alpha >= 128
op_rgb = rgb[opaque]
red = (op_rgb == [255, 0, 0]).all(axis=1)
green = (op_rgb == [0, 255, 0]).all(axis=1)
assert (red | green).all(), 'other colours in mask: %r' % np.unique(op_rgb, axis=0)[:5]
assert red.sum() >= 200, 'paint pixels %d' % red.sum()
assert green.sum() >= 200, 'chrome pixels %d' % green.sum()

# Paint (cube) on the left, chrome (sphere) on the right.
ys, xs = np.nonzero(opaque & (rgb[:, :, 0] == 255))
assert xs.mean() < w / 2, 'paint not on the left: %r' % xs.mean()
ys, xs = np.nonzero(opaque & (rgb[:, :, 1] == 255))
assert xs.mean() > w / 2, 'chrome not on the right: %r' % xs.mean()

# Everything restored: materials, engine, samples.
assert cube.material_slots[0].material.name == 'paint', cube.material_slots[0].material.name
assert ball.material_slots[0].material.name == 'chrome', ball.material_slots[0].material.name
assert not [m.name for m in bpy.data.materials if m.name.startswith('mask_')], 'temp materials left'
assert scene.render.engine == engine_before, scene.render.engine
assert scene.cycles.samples == samples_before, scene.cycles.samples

print('CB MASK OK')
# Blender prints "Blender quit" after the script returns; exit here so that
# CB MASK OK is the last line of output (the acceptance command reads tail -1).
sys.stdout.flush()
os._exit(0)
