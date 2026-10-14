# GC10: Dave's bald head, ears, big nose, neck, grey side tufts, flat cap,
# moustache and face, as toon-shaded Blender geometry. Same pivot convention as
# mark_head.py; the face parts come from charface.build_face().
# Run: /opt/homebrew/bin/blender --background --python-exit-code 1 \
#        --python tools/art/dave_head.py -- --out <png> --face neutral --report
# Nothing runs on import; build_head(), build_cap() and build_moustache() are
# called by the character rig.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse  # noqa: E402
import json  # noqa: E402
import math  # noqa: E402

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import charface  # noqa: E402
import charlib  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
DAVE_JSON = os.path.join(HERE, '..', '..', 'docs', 'characters', 'dave.json')


def _grab(pivot, parts, fn, *args):
    """Call fn(*args), which makes Blender objects (a capsule makes three), attach
    every new object to pivot, add them to parts and return fn's result."""
    before = {o.name for o in bpy.data.objects}
    result = fn(*args)
    new = [o for o in bpy.data.objects if o.name not in before]
    for o in new:
        charlib.attach(o, pivot)
        parts.append(o)
    return result


def build_head(spec, mats, pivot):
    """Build Dave's bald head, ears, nose, grey side tufts and neck, all attached
    to `pivot`. Local positions are relative to the pivot; the pivot's scale
    (head_scale) is set by the caller, not here.
    Returns {'parts': [...], 'head': obj, 'nose': obj}."""
    bpy.context.view_layer.update()
    base = Vector(pivot.matrix_world.translation)
    head_spec = spec['head']
    radii = head_spec['radii']
    c = head_spec['center_offset']

    def at(p):
        return tuple(base + Vector(p))

    parts = []

    # Head: skin everywhere, skin_shade (slot 1) on the jaw and chin only, a
    # faint five-o'clock shadow.
    head = charlib.sphere(at((0.0, 0.0, c)), radii, mats['skin'], 'dave_head',
                          seg=32)
    head.data.materials.append(mats['skin_shade'])
    charlib.attach(head, pivot)
    parts.append(head)
    for poly in head.data.polygons:
        px, py, pz = poly.center
        local_y = py * radii[1]
        local_z = c + pz * radii[2]
        if local_z < c - 0.12 and local_y < 0.02:
            poly.material_index = 1

    # Ears: one on each side of the head.
    for name, sx in (('dave_ear_l', -1.0), ('dave_ear_r', 1.0)):
        ear = charlib.sphere(at((sx * radii[0], 0.0, c - 0.02)),
                             (0.05, 0.05, 0.085), mats['ear'], name)
        charlib.attach(ear, pivot)
        parts.append(ear)

    # Big round nose on the front of the face (characters face -Y).
    nose = charlib.sphere(at((0.0, -radii[1] - 0.005, c - 0.04)),
                          (0.075, 0.07, 0.07), mats['nose'], 'dave_nose')
    charlib.attach(nose, pivot)
    parts.append(nose)

    # Two grey side tufts above the ears.
    for name, sx in (('dave_tuft_l', -1.0), ('dave_tuft_r', 1.0)):
        tuft = charlib.sphere(at((sx * (radii[0] - 0.01), 0.02, c + 0.03)),
                              (0.05, 0.05, 0.07), mats['hair_grey'], name)
        charlib.attach(tuft, pivot)
        parts.append(tuft)

    # Neck: one capsule (cylinder plus two sphere caps), every object attached.
    _grab(pivot, parts, charlib.capsule, at((0.0, 0.0, -0.10)),
          at((0.0, 0.0, 0.0)), 0.12, mats['skin'], 'neck')

    return {'parts': parts, 'head': head, 'nose': nose}


def build_cap(spec, mats, pivot):
    """Flat cap on Dave's head: dome, band, peak and button, attached to pivot.
    Returns {'parts': [...]}."""
    bpy.context.view_layer.update()
    base = Vector(pivot.matrix_world.translation)
    c = spec['head']['center_offset']

    def at(p):
        return tuple(base + Vector(p))

    parts = []
    _grab(pivot, parts, charlib.sphere, at((0.0, 0.0, c + 0.19)),
          (0.31, 0.30, 0.13), mats['cap'], 'dave_cap_dome')

    band = _grab(pivot, parts, charlib.ring, at((0.0, 0.0, c + 0.14)), 0.28,
                 0.025, mats['cap_dark'], 'dave_cap_band')
    band.scale = (1.07, 1.0, 1.0)

    peak = _grab(pivot, parts, charlib.rbox, at((0.0, -0.30, c + 0.15)),
                 (0.30, 0.22, 0.03), 0.012, mats['cap_dark'], 'dave_cap_peak')
    peak.rotation_euler = (math.radians(-12), 0.0, 0.0)

    _grab(pivot, parts, charlib.sphere, at((0.0, 0.0, c + 0.32)),
          (0.025, 0.025, 0.025), mats['cap_dark'], 'dave_cap_button')

    return {'parts': parts}


def build_moustache(spec, mats, pivot):
    """Bushy moustache: one capsule from the centre to each side, with a drooping
    tip on each side. Returns {'parts': [...]}."""
    bpy.context.view_layer.update()
    base = Vector(pivot.matrix_world.translation)
    c = spec['head']['center_offset']
    s = float(spec['moustache']['span'])

    def at(p):
        return tuple(base + Vector(p))

    parts = []
    for sx in (-1.0, 1.0):
        _grab(pivot, parts, charlib.capsule, at((0.0, -0.26, c - 0.115)),
              at((sx * s, -0.245, c - 0.125)), 0.04, mats['moustache'],
              'dave_moustache')
        _grab(pivot, parts, charlib.capsule, at((sx * s, -0.245, c - 0.125)),
              at((sx * (s + 0.04), -0.23, c - 0.185)), 0.032,
              mats['moustache'], 'dave_moustache_tip')
    return {'parts': parts}


def _world_z_extent(objs):
    """Height of the world-space bounding box of objs, in metres."""
    zs = []
    for o in objs:
        for corner in o.bound_box:
            zs.append((o.matrix_world @ Vector(corner)).z)
    return max(zs) - min(zs)


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', default=None,
                        help='write the 80 x 80 front render to this PNG')
    parser.add_argument('--face', default='neutral',
                        help='face name from docs/characters/expressions.json')
    parser.add_argument('--report', action='store_true',
                        help='print head width and height, and the part count')
    args = parser.parse_args(argv)

    table = charface.load_expressions()
    if args.face not in table['faces']:
        print('Unknown face %r, expected one of %s'
              % (args.face, sorted(table['faces'])))
        sys.exit(2)

    scene = charlib.clear_scene()
    with open(DAVE_JSON) as f:
        spec = json.load(f)
    mats = charlib.make_mats(spec['palette'])

    # As in mark_head.py: the pivot is built at scale 1 and head_scale is set
    # last, so the parts keep their radii while attached.
    pivot = charlib.empty('dave_neck_pivot', tuple(spec['body']['neck_pivot']))
    head_res = build_head(spec, mats, pivot)
    cap_res = build_cap(spec, mats, pivot)
    moustache_res = build_moustache(spec, mats, pivot)
    face_res = charface.build_face(spec, mats, pivot, args.face)
    hs = spec['head_scale']
    pivot.scale = (hs, hs, hs)
    bpy.context.view_layer.update()

    if args.report:
        head = head_res['head']
        # dimensions already include the parent's scale (head_scale).
        dx = head.dimensions.x
        dz = _world_z_extent([head] + cap_res['parts'])
        n = (len(head_res['parts']) + len(cap_res['parts'])
             + len(moustache_res['parts']) + len(face_res['parts']))
        print('DAVE HEAD dx=%.3f dz=%.3f parts=%d' % (dx, dz, n))

    cz = spec['body']['neck_pivot'][2] + spec['head']['center_offset'] * hs
    charlib.setup_char_scene(scene, 'front', (0.0, cz), 1.25, 80, 80)
    if args.out:
        charlib.render_png(scene, args.out)


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
