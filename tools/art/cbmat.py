# CB01: the one material set for the car renders (paint, chrome, glass, rubber, lamps).
# Every number here is fixed on purpose: see docs/art/CB.md and docs/art/CARS_ALIGN.md.
# This module is imported by the builder scripts; nothing runs on import.
import bpy
import os
import re
import sys

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carlib  # noqa: E402  (path must be set up first)


def hex_lin(hexs):
    """sRGB '#rrggbb' -> LINEAR (r, g, b) tuple. Exits 2 with a message if bad.
    carlib.hex_to_rgb is not used here: it returns sRGB until card V06 lands."""
    s = str(hexs).strip().lstrip('#')
    if len(s) != 6 or any(ch not in '0123456789abcdefABCDEF' for ch in s):
        print('Bad colour %r, expected #rrggbb' % (hexs,))
        sys.exit(2)
    out = []
    for j in (0, 2, 4):
        c = int(s[j:j + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


# 8-bit FILE values for the game mask render (used by card CB05).
MASK_RGB = {
    'paint': (255, 0, 0),
    'chrome': (0, 255, 0),
    'glass': (0, 0, 255),
    'tyre': (255, 255, 0),
    'wall': (255, 255, 255),
    'lamp': (255, 0, 255),
    'trim': (0, 255, 255),
    'tail': (0, 0, 0),
    'paint2': (128, 0, 0),
}

# Every material name a part card may use -> one of the 9 mask classes.
MASK_CLASS = {
    'paint': 'paint',
    'paint2': 'paint2',
    'chrome': 'chrome',
    'glass': 'glass',
    'tyre': 'tyre',
    'wall': 'wall',
    'lamp': 'lamp',
    'trim': 'trim',
    'tail': 'tail',
    'alloy': 'chrome',
    'brass': 'chrome',
    'plate_white': 'wall',
    'plate_yellow': 'wall',
    'lamp_white': 'lamp',
    'lamp_amber': 'lamp',
    'lamp_red': 'tail',
    'black': 'trim',
    'dark': 'trim',
    'vinyl': 'trim',
    'fabric': 'trim',
    'leather': 'trim',
}


def class_of(name):
    """Mask class of a material name. Strips a Blender suffix such as '.001'.
    Unknown names give 'trim' (never 'paint')."""
    base = re.sub(r'\.\d{3}$', '', str(name))
    return MASK_CLASS.get(base, 'trim')


def make_paint(hexs, finish='solid', name='paint'):
    """Period paint: Principled BSDF with a facing colour flop. Solid finish keeps
    one colour; metallic adds 0.25 metallic and a lighter flop colour (+0.10)."""
    base = hex_lin(hexs)
    metallic = finish == 'metallic'
    if metallic:
        flop = tuple(min(1.0, c + 0.10) for c in base)
    else:
        flop = base
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    carlib.set_socket(bsdf, 'Roughness', 0.32)
    carlib.set_socket(bsdf, 'Coat Weight', 1.0)
    carlib.set_socket(bsdf, 'Coat Roughness', 0.02)
    carlib.set_socket(bsdf, 'Metallic', 0.25 if metallic else 0.0)
    layer = nt.nodes.new('ShaderNodeLayerWeight')
    layer.inputs['Blend'].default_value = 0.5
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.inputs[6].default_value = (*base, 1.0)
    mix.inputs[7].default_value = (*flop, 1.0)
    nt.links.new(layer.outputs['Facing'], mix.inputs[0])
    nt.links.new(mix.outputs[2], bsdf.inputs['Base Color'])
    return mat


def make_chrome():
    return carlib.make_mat('chrome', hex_lin('#f2f2f4'), metallic=1.0,
                           roughness=0.04)


def make_glass():
    # Opaque dark glass (alpha 1): keeps the pixel art crisp.
    return carlib.make_mat('glass', hex_lin('#1b2830'), roughness=0.02,
                           coat=1.0, coat_rough=0.0)


def make_tyre():
    return carlib.make_mat('tyre', hex_lin('#16161a'), roughness=0.85)


def make_whitewall():
    return carlib.make_mat('wall', hex_lin('#e8e2d0'), roughness=0.7)


def make_lamp():
    return carlib.make_mat('lamp', hex_lin('#fff1c0'), roughness=0.1,
                           emission=hex_lin('#ffe9a8'), emission_strength=6.0)


def make_trim():
    return carlib.make_mat('trim', hex_lin('#0e0e10'), roughness=0.55)


def make_tail():
    return carlib.make_mat('tail', hex_lin('#c01818'), roughness=0.2,
                           emission=hex_lin('#ff2010'), emission_strength=1.5)


def make_all(hexs, finish='solid', hex2=None):
    """The full material set for one car. 'paint2' only when hex2 is given."""
    mats = {
        'paint': make_paint(hexs, finish, 'paint'),
        'glass': make_glass(),
        'chrome': make_chrome(),
        'tyre': make_tyre(),
        'whitewall': make_whitewall(),
        'lamp': make_lamp(),
        'trim': make_trim(),
        'tail': make_tail(),
    }
    if hex2 is not None:
        mats['paint2'] = make_paint(hex2, finish, 'paint2')
    return mats
