# GC04: Mark's bare head, ears, nose and neck as toon-shaded Blender geometry.
# Hair, glasses and face parts are other cards.
# Run: /opt/homebrew/bin/blender --background --python-exit-code 1 \
#        --python tools/art/mark_head.py -- --out <png> --report
# Nothing runs on import; build_head() is called by the character rig.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse  # noqa: E402
import json  # noqa: E402

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import charlib  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MARK_JSON = os.path.join(HERE, '..', '..', 'docs', 'characters', 'mark.json')


def build_head(spec, mats, pivot):
    """Build Mark's head, ears, nose and neck, all attached to `pivot`.

    Local positions are relative to the pivot: world = pivot world location +
    local. The pivot's scale (head_scale) is set by the caller, not here.
    Returns {'head', 'ears', 'nose', 'neck', 'parts'}.
    """
    # A new empty's matrix_world is stale until the view layer updates.
    bpy.context.view_layer.update()
    base = Vector(pivot.matrix_world.translation)
    head_spec = spec['head']
    radii = head_spec['radii']
    c = head_spec['center_offset']

    def at(p):
        return tuple(base + Vector(p))

    parts = []

    # Head: skin everywhere, skin_shade (slot 1) on the jaw, chin and upper lip.
    head = charlib.sphere(at((0.0, 0.0, c)), radii, mats['skin'], 'mark_head',
                          seg=32)
    head.data.materials.append(mats['skin_shade'])
    charlib.attach(head, pivot)
    parts.append(head)
    for poly in head.data.polygons:
        px, py, pz = poly.center
        local_y = py * radii[1]
        local_z = c + pz * radii[2]
        if local_z < c - 0.11 and local_y < 0.02:
            poly.material_index = 1

    # Ears: one on each side of the head.
    ears = []
    for name, sx in (('mark_ear_l', -1.0), ('mark_ear_r', 1.0)):
        ear = charlib.sphere(at((sx * radii[0], 0.0, c - 0.02)),
                             (0.04, 0.045, 0.07), mats['ear'], name)
        charlib.attach(ear, pivot)
        ears.append(ear)
        parts.append(ear)

    # Nose: on the front of the face (characters face -Y).
    nose = charlib.sphere(at((0.0, -radii[1], c - 0.05)),
                          (0.045, 0.05, 0.06), mats['skin'], 'mark_nose')
    charlib.attach(nose, pivot)
    parts.append(nose)

    # Neck: a capsule (cylinder plus two sphere caps). The capsule helper makes
    # the caps as loose objects, so collect every object it creates and attach
    # them all.
    before = {o.name for o in bpy.data.objects}
    neck = charlib.capsule(at((0.0, 0.0, -0.10)), at((0.0, 0.0, 0.0)), 0.095,
                           mats['skin'], 'neck')
    for o in [o for o in bpy.data.objects if o.name not in before]:
        charlib.attach(o, pivot)
        parts.append(o)

    return {'head': head, 'ears': ears, 'nose': nose, 'neck': neck,
            'parts': parts}


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', default=None,
                        help='write the 80 x 80 front render to this PNG')
    parser.add_argument('--report', action='store_true',
                        help='print head size and stubble counts')
    args = parser.parse_args(argv)

    scene = charlib.clear_scene()
    with open(MARK_JSON) as f:
        spec = json.load(f)
    mats = charlib.make_mats(spec['palette'])

    # The pivot is made at scale 1 so the parts keep their radii while
    # attached; the head scale is applied afterwards, as the rig would.
    pivot = charlib.empty('mark_neck_pivot', tuple(spec['body']['neck_pivot']))
    res = build_head(spec, mats, pivot)
    hs = spec['head_scale']
    pivot.scale = (hs, hs, hs)

    if args.report:
        head = res['head']
        dx = head.dimensions.x * pivot.scale.x
        dz = head.dimensions.z * pivot.scale.z
        polys = len(head.data.polygons)
        stubble = sum(1 for p in head.data.polygons if p.material_index == 1)
        print('HEAD dx=%.3f dz=%.3f polys=%d stubble=%d'
              % (dx, dz, polys, stubble))

    charlib.setup_char_scene(scene, 'front', (0.0, 1.52), 1.25, 80, 80)
    if args.out:
        charlib.render_png(scene, args.out)


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
