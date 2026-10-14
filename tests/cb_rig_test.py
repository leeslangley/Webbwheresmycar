# CB02 test: studio world and colour management (run inside Blender).
#   /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_rig_test.py
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'tools', 'art'))
import cbrig  # noqa: E402

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

print('CB RIG OK')
# Blender prints "Blender quit" after the script returns; exit here so that
# CB RIG OK is the last line of output (the acceptance command reads tail -1).
sys.stdout.flush()
os._exit(0)
