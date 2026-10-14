# GC07: Mark's torso (navy suit or hoodie) and the maroon office chair behind him.
# Built on charlib (GC01) from docs/characters/mark.json (GC02). All positions are
# world units, nothing is scaled. Characters face -Y; +Z is up.
# Run headless:
#   /opt/homebrew/bin/blender --background --python-exit-code 1 \
#     --python tools/art/mark_torso.py -- --out <png path> [--report] \
#     [--view front|back] [--outfit suit|hoodie]
# Args after --: --out <png path>  --report  --view front|back  --outfit suit|hoodie
import bpy
import json
import math
import os
import sys

from mathutils import Vector

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import charlib  # noqa: E402  (path must be set up first)

HERE = os.path.dirname(os.path.abspath(__file__))
SPEC_PATH = os.path.join(HERE, '..', '..', 'docs', 'characters', 'mark.json')


def _attach_capsule(cyl, root, parts):
    """charlib.capsule makes a cylinder plus two sphere caps (name_a, name_b).
    Attach all three to root; the cylinder is the part that gets counted."""
    charlib.attach(cyl, root)
    for suffix in ('_a', '_b'):
        cap = bpy.data.objects.get(cyl.name + suffix)
        if cap is None:
            print('Missing capsule cap %s' % (cyl.name + suffix))
            sys.exit(2)
        charlib.attach(cap, root)
    parts.append(cyl)


def build_torso(spec, mats, root):
    """Jacket or hoodie torso, shoulders, shirt, and either lapels + tie (suit)
    or hood + tee + drawstrings (hoodie). Returns {'parts': [...]}."""
    body = spec['body']
    outfit = body['outfit']
    if outfit not in ('suit', 'hoodie'):
        print('Unknown outfit %r, expected suit or hoodie' % outfit)
        sys.exit(2)
    hoodie = outfit == 'hoodie'
    parts = []

    # Body. Hoodie uses the hood colour; the shoulders match the body.
    body_mat = mats['hood'] if hoodie else mats['navy']
    torso = charlib.rbox(tuple(body['torso_center']), tuple(body['torso_size']),
                         0.12, body_mat, 'torso')
    charlib.attach(torso, root)
    parts.append(torso)

    sx = float(body['shoulder_x'])
    sz = float(body['shoulder_z'])
    for name, x in (('shoulder_px', sx), ('shoulder_nx', -sx)):
        sh = charlib.sphere((x, 0.0, sz), (0.15, 0.17, 0.15), body_mat, name)
        charlib.attach(sh, root)
        parts.append(sh)

    # Cream shirt front, built for both outfits (the card's spec).
    shirt = charlib.rbox((0.0, -0.215, 0.92), (0.30, 0.04, 0.40), 0.02,
                         mats['shirt'], 'shirt')
    charlib.attach(shirt, root)
    parts.append(shirt)

    if not hoodie:
        # Lapels, angled about Y: +14 degrees on +X, -14 on -X.
        for name, x, ang in (('lapel_px', 0.14, 14.0), ('lapel_nx', -0.14, -14.0)):
            lap = charlib.rbox((x, -0.22, 0.88), (0.14, 0.05, 0.42), 0.015,
                               mats['navy_dark'], name)
            lap.rotation_euler[1] = math.radians(ang)
            charlib.attach(lap, root)
            parts.append(lap)

        tie = charlib.rbox((0.0, -0.245, 0.84), (0.07, 0.025, 0.36), 0.01,
                           mats['tie'], 'tie')
        charlib.attach(tie, root)
        parts.append(tie)
        knot = charlib.sphere((0.0, -0.245, 1.0), (0.04, 0.025, 0.035),
                              mats['tie'], 'tie_knot')
        charlib.attach(knot, root)
        parts.append(knot)
    else:
        # Hood ring around the neck, flattened front to back.
        hood = charlib.ring((0.0, 0.02, 1.05), 0.20, 0.07, mats['hood'], 'hood')
        hood.scale = (1.0, 1.0, 0.7)
        charlib.attach(hood, root)
        parts.append(hood)

        tee = charlib.rbox((0.0, -0.225, 0.9), (0.26, 0.03, 0.30), 0.01,
                           mats['hood_tee'], 'hood_tee')
        charlib.attach(tee, root)
        parts.append(tee)

        # Two drawstrings, mirrored in X, in shirt colour.
        for name, s in (('drawstring_px', 1.0), ('drawstring_nx', -1.0)):
            cord = charlib.capsule((s * 0.05, -0.23, 1.0), (s * 0.06, -0.235, 0.82),
                                   0.012, mats['shirt'], name)
            _attach_capsule(cord, root, parts)

    return {'parts': parts}


def build_chair(spec, mats, root):
    """Maroon office chair behind Mark, seen from the back of the seat.
    Returns {'parts': [...]}."""
    parts = []
    back = charlib.rbox((0.0, 0.32, 0.80), (0.95, 0.14, 0.85), 0.07,
                        mats['chair'], 'chair_back')
    charlib.attach(back, root)
    parts.append(back)

    head = charlib.rbox((0.0, 0.32, 1.34), (0.5, 0.12, 0.22), 0.05,
                        mats['chair'], 'chair_head')
    charlib.attach(head, root)
    parts.append(head)

    for name, x in (('arm_rest_px', 0.55), ('arm_rest_nx', -0.55)):
        arm = charlib.capsule((x, -0.05, 0.58), (x, 0.30, 0.58), 0.045,
                              mats['chair_dark'], name)
        _attach_capsule(arm, root, parts)

    post = charlib.capsule((0.0, 0.1, -0.4), (0.0, 0.1, 0.2), 0.05,
                           mats['chair_dark'], 'chair_post')
    _attach_capsule(post, root, parts)

    return {'parts': parts}


def parse_args(argv):
    args = {'out': None, 'report': False, 'view': 'front', 'outfit': None}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--out', '--view', '--outfit'):
            if i + 1 >= len(argv):
                print('Missing value after %s' % a)
                sys.exit(2)
            args[a[2:]] = argv[i + 1]
            i += 2
        elif a == '--report':
            args['report'] = True
            i += 1
        else:
            print('Unknown argument: %s' % a)
            sys.exit(2)
    if not args['out']:
        print('Missing required --out <png path>')
        sys.exit(2)
    if args['view'] not in ('front', 'back'):
        print('Bad --view %r, expected front or back' % args['view'])
        sys.exit(2)
    if args['outfit'] is not None and args['outfit'] not in ('suit', 'hoodie'):
        print('Bad --outfit %r, expected suit or hoodie' % args['outfit'])
        sys.exit(2)
    return args


def world_extent(obj):
    """World-space (dx, dz) of the evaluated object, modifiers included."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    pts = [ev.matrix_world @ Vector(c) for c in ev.bound_box]
    xs = [p.x for p in pts]
    zs = [p.z for p in pts]
    return max(xs) - min(xs), max(zs) - min(zs)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    args = parse_args(argv)

    if not os.path.isfile(SPEC_PATH):
        print('Missing spec %s' % SPEC_PATH)
        sys.exit(2)
    with open(SPEC_PATH) as f:
        spec = json.load(f)
    if args['outfit'] is not None:
        spec['body']['outfit'] = args['outfit']

    scene = charlib.clear_scene()
    mats = charlib.make_mats(spec['palette'])
    root = charlib.empty('root', (0.0, 0.0, 0.0))

    torso = build_torso(spec, mats, root)
    build_chair(spec, mats, root)

    frame = spec['frames']['world']
    charlib.setup_char_scene(scene, args['view'], tuple(frame['center']),
                             frame['ortho'], frame['w'], frame['h'])
    charlib.render_png(scene, args['out'])
    print('RENDERED %s' % args['out'])

    if args['report']:
        torso_obj = bpy.data.objects.get('torso')
        if torso_obj is None:
            print('Missing torso object')
            sys.exit(1)
        dx, dz = world_extent(torso_obj)
        print('TORSO dx=%.3f dz=%.3f parts=%d' % (dx, dz, len(torso['parts'])))
        if not (0.80 <= dx <= 0.90 and 1.0 <= dz <= 1.2):
            print('FAIL torso size outside dx 0.80..0.90, dz 1.0..1.2 '
                  '(spec ignored?)')
            sys.exit(1)


if __name__ == '__main__':
    main()
