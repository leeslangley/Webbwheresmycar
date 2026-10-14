# CB01 test: run under Blender, not under jsc.
#   /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_mat_test.py
# Plain asserts: any failure makes Blender exit non-zero.
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(ROOT, 'tools', 'art'))

import bpy  # noqa: E402
import cbmat  # noqa: E402


def close(a, b, msg=''):
    assert abs(a - b) < 1e-6, '%s: %r != %r' % (msg, a, b)


def close3(a, b, msg=''):
    for i in range(3):
        close(a[i], b[i], '%s[%d]' % (msg, i))


def principled(mat):
    node = mat.node_tree.nodes.get('Principled BSDF')
    assert node is not None, mat.name
    return node


def val(mat, socket):
    return principled(mat).inputs[socket].default_value


def check_mat(mat, base_hex, roughness, metallic=0.0, coat=0.0,
              coat_rough=None, emission_hex=None, emission=0.0):
    close3(val(mat, 'Base Color'), cbmat.hex_lin(base_hex), mat.name + ' base')
    close(val(mat, 'Roughness'), roughness, mat.name + ' roughness')
    close(val(mat, 'Metallic'), metallic, mat.name + ' metallic')
    close(val(mat, 'Coat Weight'), coat, mat.name + ' coat')
    if coat_rough is not None:
        close(val(mat, 'Coat Roughness'), coat_rough, mat.name + ' coat_rough')
    if emission_hex is not None:
        close3(val(mat, 'Emission Color'), cbmat.hex_lin(emission_hex),
               mat.name + ' emission')
    close(val(mat, 'Emission Strength'), emission, mat.name + ' emission str')


def paint_nodes(mat):
    """Return (layer weight node, mix node) feeding Base Color."""
    link = principled(mat).inputs['Base Color'].links
    assert len(link) == 1, mat.name
    mix = link[0].from_node
    assert mix.type == 'MIX', mix.type
    assert mix.data_type == 'RGBA', mix.data_type
    assert mix.outputs[2].name == 'Result'
    assert link[0].from_socket == mix.outputs[2]
    fac = mix.inputs[0].links
    assert len(fac) == 1, 'Factor not linked'
    layer = fac[0].from_node
    assert layer.type == 'LAYER_WEIGHT', layer.type
    assert fac[0].from_socket.name == 'Facing', fac[0].from_socket.name
    close(layer.inputs['Blend'].default_value, 0.5, 'layer blend')
    return layer, mix


bpy.ops.wm.read_factory_settings(use_empty=True)

mats = cbmat.make_all('#C96F32', 'metallic', '#202020')

# Keys and names
expected_keys = {'paint', 'glass', 'chrome', 'tyre', 'whitewall', 'lamp',
                 'trim', 'tail', 'paint2'}
assert set(mats.keys()) == expected_keys, sorted(mats.keys())
assert mats['whitewall'].name == 'wall', mats['whitewall'].name
assert mats['chrome'].name == 'chrome'
assert mats['glass'].name == 'glass'
assert mats['tyre'].name == 'tyre'
assert mats['lamp'].name == 'lamp'
assert mats['trim'].name == 'trim'
assert mats['tail'].name == 'tail'
assert mats['paint'].name == 'paint'
assert mats['paint2'].name == 'paint2'

# Paint: Principled values and the colour flop
p = mats['paint']
close(val(p, 'Metallic'), 0.25, 'paint metallic')
close(val(p, 'Roughness'), 0.32, 'paint roughness')
close(val(p, 'Coat Weight'), 1.0, 'paint coat')
close(val(p, 'Coat Roughness'), 0.02, 'paint coat rough')
layer, mix = paint_nodes(p)
A = mix.inputs[6].default_value
B = mix.inputs[7].default_value
lin = cbmat.hex_lin('#C96F32')
close3(A, lin, 'paint A')
close3(B, tuple(min(1.0, c + 0.10) for c in lin), 'paint B')

p2 = mats['paint2']
close(val(p2, 'Metallic'), 0.25, 'paint2 metallic')
lin2 = cbmat.hex_lin('#202020')
_, mix2 = paint_nodes(p2)
close3(mix2.inputs[6].default_value, lin2, 'paint2 A')
close3(mix2.inputs[7].default_value, tuple(min(1.0, c + 0.10) for c in lin2),
       'paint2 B')

# Fixed materials
check_mat(mats['chrome'], '#f2f2f4', 0.04, metallic=1.0)
check_mat(mats['glass'], '#1b2830', 0.02, coat=1.0, coat_rough=0.0)
close(mats['glass'].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value,
      1.0, 'glass alpha')
check_mat(mats['tyre'], '#16161a', 0.85)
check_mat(mats['whitewall'], '#e8e2d0', 0.7)
check_mat(mats['lamp'], '#fff1c0', 0.1, emission_hex='#ffe9a8', emission=6.0)
check_mat(mats['trim'], '#0e0e10', 0.55)
check_mat(mats['tail'], '#c01818', 0.2, emission_hex='#ff2010', emission=1.5)

# Solid finish: metallic 0, B equals A
s = cbmat.make_paint('#C96F32', 'solid', 'solidpaint')
close(val(s, 'Metallic'), 0.0, 'solid metallic')
_, smix = paint_nodes(s)
close3(smix.inputs[6].default_value, smix.inputs[7].default_value, 'solid A=B')
close3(smix.inputs[6].default_value, lin, 'solid A')

# Cap at 1.0: near-white metallic paint
w = cbmat.make_paint('#ffffff', 'metallic', 'whitepaint')
_, wmix = paint_nodes(w)
close3(wmix.inputs[7].default_value, (1.0, 1.0, 1.0), 'white B capped')

# Mask colours
assert len(cbmat.MASK_RGB) == 9, len(cbmat.MASK_RGB)
assert len(set(cbmat.MASK_RGB.values())) == 9, 'mask colours not distinct'
for k in cbmat.MASK_RGB:
    assert cbmat.MASK_CLASS[k] == k, k
for v in cbmat.MASK_CLASS.values():
    assert v in cbmat.MASK_RGB, v

# class_of
assert cbmat.class_of('paint.001') == 'paint'
assert cbmat.class_of('lamp_red') == 'tail'
assert cbmat.class_of('plate_yellow') == 'wall'
assert cbmat.class_of('zzz') == 'trim'
assert cbmat.class_of('alloy.012') == 'chrome'
assert cbmat.class_of('leather') == 'trim'

print('CB MAT OK')
# Blender prints its "Blender quit" banner at normal exit, which would be the
# last line and hide the marker from `| tail -1`. All checks above have run
# already; a failed assert exits non-zero before this point.
sys.stdout.flush()
sys.stderr.flush()
os._exit(0)
