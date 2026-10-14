# CB02 test: studio world and colour management (run inside Blender).
#   /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_rig_test.py
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'tools', 'art'))
import cbrig  # noqa: E402
import cbmat  # noqa: E402
import carlib  # noqa: E402

TOL = 1e-4

# Fresh empty scene.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

cbrig.setup_color_management(scene)
cbrig.setup_studio_world(scene)

# World: exactly one ColorRamp with the six stops, in order.
world = scene.world
assert world is not None, 'scene.world not set'
ramps = [n for n in world.node_tree.nodes if n.bl_idname == 'ShaderNodeValToRGB']
assert len(ramps) == 1, 'expected 1 ColorRamp, got %d' % len(ramps)
ramp = ramps[0]
elements = ramp.color_ramp.elements
assert len(elements) == 6, 'expected 6 ramp elements, got %d' % len(elements)
positions = [round(e.position, 6) for e in elements]
expected = [0.0, 0.44, 0.5, 0.58, 0.8, 1.0]
for got, want in zip(positions, expected):
    assert abs(got - want) < TOL, 'ramp positions %r != %r' % (positions, expected)

# The 0.50 stop (#e9dcc4) must hold the linear colour of that sRGB hex.
want_rgb = cbrig._lin('#e9dcc4')
got_rgb = tuple(elements[2].color[:3])
for g, w in zip(got_rgb, want_rgb):
    assert abs(g - w) < TOL, 'stop 0.50 colour %r != %r' % (got_rgb, want_rgb)

# Background strength.
bg_nodes = [n for n in world.node_tree.nodes if n.bl_idname == 'ShaderNodeBackground']
assert len(bg_nodes) == 1, 'expected 1 Background node'
strength = bg_nodes[0].inputs['Strength'].default_value
assert abs(strength - 0.22) < TOL, 'Background Strength %r != 0.22' % strength

# Colour management.
assert scene.view_settings.view_transform == 'Standard', scene.view_settings.view_transform
assert scene.view_settings.look == 'None', scene.view_settings.look
assert abs(scene.view_settings.exposure - (-0.2)) < TOL, scene.view_settings.exposure
assert scene.render.dither_intensity == 0.0, scene.render.dither_intensity
assert scene.render.film_transparent is True, 'film_transparent not set'

# ---- CB03 probe: a chrome ball lit by the studio rig, measured from a render. ----
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
cbrig.setup_color_management(scene)
cbrig.setup_studio_world(scene)
cbrig.setup_studio_lights(scene)

# Six area lights with the names, shape, energy and colour from the table.
lights = {o.name: o for o in scene.objects if o.type == 'LIGHT'}
assert sorted(lights) == sorted(row[0] for row in cbrig.STUDIO_LIGHTS), sorted(lights)
for name, hexs, watts, size_x, size_y, loc, target in cbrig.STUDIO_LIGHTS:
    data = lights[name].data
    assert data.type == 'AREA' and data.shape == 'RECTANGLE', name
    assert abs(data.energy - watts) < TOL, (name, data.energy, watts)
    assert abs(data.size - size_x) < TOL and abs(data.size_y - size_y) < TOL, name

# Chrome ball: UV sphere radius 1.0 at z=1.0, smooth shaded.
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 1.0))
ball = bpy.context.active_object
ball.data.materials.append(cbmat.make_chrome())
for poly in ball.data.polygons:
    poly.use_smooth = True

# Orthographic camera 20 m in front of the ball, looking at its centre.
cam_data = bpy.data.cameras.new('probe_cam')
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 3.0
cam = bpy.data.objects.new('probe_cam', cam_data)
cam.location = (0, -20, 1.0)
carlib.look_at(cam, (0, 0, 1.0))
scene.collection.objects.link(cam)
scene.camera = cam

# Cycles CPU, 32 samples, no denoise, 128x128 PNG.
rd = scene.render
rd.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = False
rd.resolution_x = 128
rd.resolution_y = 128
rd.resolution_percentage = 100
rd.image_settings.file_format = 'PNG'
rd.image_settings.color_mode = 'RGBA'
rd.filepath = '/tmp/cb_probe.png'
bpy.ops.render.render(write_still=True)

img = bpy.data.images.load('/tmp/cb_probe.png')
img.colorspace_settings.name = 'Non-Color'
w, h = img.size
assert (w, h) == (128, 128), (w, h)
px = list(img.pixels)  # RGBA floats, rows bottom-up (row 64 and up = upper half)

up, low, every = [], [], []
bright = dark = 0
for y in range(h):
    for x in range(w):
        i = (y * w + x) * 4
        r, g, b, a = px[i:i + 4]
        if a <= 0.5:
            continue
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
        every.append(luma)
        if y >= h // 2:
            up.append(luma)
        else:
            low.append(luma)
        if luma > 0.9:
            bright += 1
        if luma < 0.1:
            dark += 1
assert up and low, 'ball has no opaque pixels in one half'
total = len(every)
mean_up = sum(up) / len(up)
mean_low = sum(low) / len(low)
max_luma = max(every)
bright_frac = bright / total
dark_frac = dark / total
print('PROBE up=%.3f low=%.3f max=%.3f bright=%.3f dark=%.3f'
      % (mean_up, mean_low, max_luma, bright_frac, dark_frac))
assert mean_up >= 2.0 * mean_low, 'upper %.3f < 2 x lower %.3f' % (mean_up, mean_low)
assert max_luma >= 0.95, 'max luma %.3f < 0.95' % max_luma
assert bright_frac >= 0.05, 'bright fraction %.3f < 0.05' % bright_frac
assert dark_frac >= 0.10, 'dark fraction %.3f < 0.10' % dark_frac

print('CB RIG OK')
# Blender prints "Blender quit" after the script returns; exit here so that
# PROBE and CB RIG OK are the last two lines of output (the acceptance command reads tail -2).
sys.stdout.flush()
os._exit(0)
