# GC06: face parts for both characters: eyes, brows, mouths and glasses.
# build_face() draws one face from docs/characters/expressions.json on any head.
# The renderer deletes and rebuilds the face for each of the 16 faces; glasses
# are separate parts so they stay when the face changes.
# Run: /opt/homebrew/bin/blender --background --python-exit-code 1 \
#        --python tools/art/charface.py -- --spec mark --face panic --out <png> --report
# Nothing runs on import; main() runs only from the __main__ block.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse  # noqa: E402
import json  # noqa: E402

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import charlib  # noqa: E402
import mark_head  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CHARS_DIR = os.path.join(HERE, '..', '..', 'docs', 'characters')
EXPR_JSON = os.path.join(CHARS_DIR, 'expressions.json')
SPEC_FILES = {'mark': 'mark.json', 'dave': 'dave.json'}


def load_expressions():
    """The face and mouth tables from docs/characters/expressions.json."""
    with open(EXPR_JSON) as f:
        return json.load(f)


def _world(pivot, local):
    """Pivot-local point -> world point. The pivot is still at scale 1 while
    parts are built (see main), so only its location is added."""
    bpy.context.view_layer.update()
    return tuple(Vector(pivot.matrix_world.translation) + Vector(local))


def _add(pivot, fn, *args):
    """Call fn(*args), which creates Blender objects at world positions, then
    attach every object it created (a capsule makes three) to pivot."""
    before = set(o.name for o in bpy.data.objects)
    fn(*args)
    new = [o for o in bpy.data.objects if o.name not in before]
    for o in new:
        charlib.attach(o, pivot)
    return new


def build_face(spec, mats, pivot, face_name, expr=None):
    """Eyes, brows and mouth for one face on the head under pivot.
    expr is the face's entry in expressions.json (looked up by face_name when
    None). Returns {'parts': [...], 'mouth': <mouth key>}."""
    table = load_expressions()
    if expr is None:
        expr = table['faces'][face_name]
    f = spec['face']
    c = spec['head']['center_offset']
    eye = expr['eye']
    brow = expr['brow']
    openv = max(float(eye['open']), 0.08)
    rx, ry, rz = f['eye_radii']
    p = float(eye['pupil'])
    dx = float(eye['dx'])
    dz = float(eye['dz'])
    parts = []

    for sx in (-1.0, 1.0):
        ex = sx * f['eye_x']
        ez = c + f['eye_z']
        # Eye white, squashed vertically by the blink.
        parts += _add(pivot, charlib.sphere,
                      _world(pivot, (ex, f['eye_y'], ez)),
                      (rx, ry, rz * openv), mats['white'], 'eye')
        # Pupil, shifted by the gaze offset (same direction for both eyes).
        parts += _add(pivot, charlib.sphere,
                      _world(pivot, (ex + dx, f['eye_y'] - 0.027, ez + dz)),
                      (0.026 * p, 0.012, 0.03 * p * min(openv, 1.0)),
                      mats['pupil'], 'pupil')
        # Brow, from the outer end to the inner end.
        parts += _add(pivot, charlib.capsule,
                      _world(pivot, (sx * 0.175, f['eye_y'] + 0.005,
                                     c + 0.16 + float(brow['outer']))),
                      _world(pivot, (sx * 0.05, f['eye_y'] - 0.01,
                                     c + 0.185 + float(brow['inner']))),
                      f['brow_thick'], mats[f['brow_color']], 'brow')

    # Mouth.
    mouth_key = expr['mouth']
    m = table['mouths'][mouth_key]
    w = float(m['w'])
    h = float(m['h'])
    curve = float(m['curve'])
    my = f['mouth_y']
    mz = c + f['mouth_z']
    if h < 0.01 and curve != 0:
        # Line mouth: two capsules from the corners to the middle, no lip ellipse.
        for sx in (-1.0, 1.0):
            parts += _add(pivot, charlib.capsule,
                          _world(pivot, (sx * w, my, mz + curve * 0.025)),
                          _world(pivot, (0.0, my, mz - curve * 0.012)),
                          0.011, mats['lip'], 'mouth_line')
    else:
        parts += _add(pivot, charlib.sphere,
                      _world(pivot, (0.0, my, mz)),
                      (w, 0.02, max(h, 0.004)), mats['lip'], 'mouth')
    if m['teeth']:
        parts += _add(pivot, charlib.sphere,
                      _world(pivot, (0.0, my - 0.011, mz + h * 0.35)),
                      (w * 0.8, 0.012, h * 0.28), mats['white'], 'teeth')
    if m['tongue']:
        parts += _add(pivot, charlib.sphere,
                      _world(pivot, (0.0, my - 0.006, mz - h * 0.3)),
                      (w * 0.5, 0.01, h * 0.28), mats['lip'], 'tongue')

    return {'parts': parts, 'mouth': mouth_key}


def build_glasses(spec, mats, pivot):
    """Round rims, bridge and temple arms. Does nothing when spec['glasses'] is
    null. Returns {'parts': [...]}."""
    g = spec.get('glasses')
    if not g:
        return {'parts': []}
    f = spec['face']
    c = spec['head']['center_offset']
    skull_x = spec['head']['radii'][0]
    z = c + f['eye_z']
    rim = mats['rim']
    parts = []
    for sx in (-1.0, 1.0):
        parts += _add(pivot, charlib.ring,
                      _world(pivot, (sx * f['eye_x'], f['eye_y'] - 0.027, z)),
                      g['rim_radius'], g['rim_thickness'], rim, 'rim')
        parts += _add(pivot, charlib.capsule,
                      _world(pivot, (sx * (f['eye_x'] + 0.085), f['eye_y'],
                                     z + 0.005)),
                      _world(pivot, (sx * skull_x, f['eye_y'] + 0.085,
                                     z + 0.005)),
                      0.009, rim, 'temple')
    parts += _add(pivot, charlib.capsule,
                  _world(pivot, (-0.017, f['eye_y'] - 0.031, z + 0.005)),
                  _world(pivot, (0.017, f['eye_y'] - 0.031, z + 0.005)),
                  0.01, rim, 'bridge')
    return {'parts': parts}


def build_plain_head(spec, mats, pivot):
    """Stand-in head for Dave: one skin sphere (dave_head.py comes later)."""
    c = spec['head']['center_offset']
    _add(pivot, charlib.sphere,
         _world(pivot, (0.0, 0.0, c)), spec['head']['radii'],
         mats['skin'], 'dave_head')


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--spec', required=True, choices=sorted(SPEC_FILES))
    parser.add_argument('--face', required=True)
    parser.add_argument('--out', default=None,
                        help='write the 80 x 80 front render to this PNG')
    parser.add_argument('--report', action='store_true',
                        help='print the FACE line: part count and mouth key')
    args = parser.parse_args(argv)

    table = load_expressions()
    if args.face not in table['faces']:
        print('Unknown face %r, expected one of %s'
              % (args.face, sorted(table['faces'])))
        sys.exit(2)

    scene = charlib.clear_scene()
    with open(os.path.join(CHARS_DIR, SPEC_FILES[args.spec])) as f:
        spec = json.load(f)
    mats = charlib.make_mats(spec['palette'])

    # As in mark_head.py: the pivot is built at scale 1 and head_scale is set
    # last, so the parts keep their radii while attached.
    pivot = charlib.empty('head_pivot', tuple(spec['body']['neck_pivot']))
    if args.spec == 'mark':
        mark_head.build_head(spec, mats, pivot)
    else:
        build_plain_head(spec, mats, pivot)
    build_glasses(spec, mats, pivot)
    res = build_face(spec, mats, pivot, args.face)
    hs = spec['head_scale']
    pivot.scale = (hs, hs, hs)

    if args.report:
        print('FACE %s parts=%d mouth=%s'
              % (args.face, len(res['parts']), res['mouth']))
    if args.out:
        cz = spec['body']['neck_pivot'][2] + spec['head']['center_offset'] * hs
        charlib.setup_char_scene(scene, 'front', (0.0, cz), 1.25, 80, 80)
        charlib.render_png(scene, args.out)


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
