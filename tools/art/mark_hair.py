# GC05: Mark's big tousled curly brown hair as a seeded cluster of toon-shaded
# curls. The curls cover the crown, sides, fringe and back of the head.
# Run: /opt/homebrew/bin/blender --background --python-exit-code 1 \
#        --python tools/art/mark_hair.py -- --out <png> --report [--view back]
# Nothing runs on import; build_hair() is called by the character rig.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse  # noqa: E402
import json  # noqa: E402
import math  # noqa: E402
import random  # noqa: E402

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import charlib  # noqa: E402
import mark_head  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MARK_JSON = os.path.join(HERE, '..', '..', 'docs', 'characters', 'mark.json')

SECTORS = 8
MIN_PER_SECTOR = 3


def _surface_point(th, ph, radii, c, factor):
    """Local point on the head ellipsoid (scaled by factor), lifted 0.01."""
    rx, ry, rz = radii
    return (math.sin(th) * math.cos(ph) * rx * factor,
            math.sin(th) * math.sin(ph) * ry * factor,
            c + math.cos(th) * rz * factor + 0.01)


def _pick_mat(rng, mats):
    """One rng draw per curl: 65% hair, 25% hair_dark, 10% hair_light."""
    r = rng.random()
    if r < 0.65:
        return mats['hair']
    if r < 0.90:
        return mats['hair_dark']
    return mats['hair_light']


def build_hair(spec, mats, pivot):
    """Build Mark's hair as curls attached to `pivot`.

    Local positions are relative to the pivot: world = pivot world location +
    local. The pivot's scale (head_scale) is set by the caller, not here.
    Returns {'curls': [records], 'parts': [objects]}; each record is
    {'obj', 'local' (x, y, z), 'radius'}.
    """
    # A new empty's matrix_world is stale until the view layer updates.
    bpy.context.view_layer.update()
    base = Vector(pivot.matrix_world.translation)
    hair = spec['hair']
    rx, ry, rz = spec['head']['radii']
    c = spec['head']['center_offset']
    radii = (rx, ry, rz)
    rng = random.Random(hair['seed'])
    records = []

    def add(local, s, mat):
        name = 'mark_curl_%02d' % len(records)
        obj = charlib.sphere(tuple(base + Vector(local)), (s, s, s * 0.92),
                             mat, name, seg=12)
        charlib.attach(obj, pivot)
        records.append({'obj': obj, 'local': tuple(local), 'radius': s})

    # (a) 46 crown curls. Samples on the low front (y < -0.10, th > 0.9) are
    # skipped so the forehead stays clear; skipped samples do not count.
    n_crown = 0
    while n_crown < 46:
        th = rng.uniform(0, 0.62 * math.pi)
        ph = rng.uniform(0, 2 * math.pi)
        local = _surface_point(th, ph, radii, c, 1.05)
        if local[1] < -0.10 and th > 0.9:
            continue
        s = rng.uniform(*hair['radius'])
        mat = _pick_mat(rng, mats)
        add(local, s, mat)
        n_crown += 1

    # (b) 12 nape curls on the back half (y > 0).
    for _ in range(12):
        th = rng.uniform(0.5 * math.pi, 0.8 * math.pi)
        ph = rng.uniform(0.15 * math.pi, 0.85 * math.pi)
        local = _surface_point(th, ph, radii, c, 0.95)
        s = rng.uniform(*hair['radius'])
        mat = _pick_mat(rng, mats)
        add(local, s, mat)

    # (c) 6 fringe curls over the forehead.
    for i, x in enumerate((-0.19, -0.11, -0.04, 0.04, 0.11, 0.19)):
        local = (x, -ry * 0.77, c + rz * 0.70 + 0.012 * (i % 2))
        mat = _pick_mat(rng, mats)
        add(local, 0.07, mat)

    # (d) 2 sideburn curls at the sides of the head.
    for sx in (rx * 0.98, -rx * 0.98):
        local = (sx, -0.02, c - 0.08)
        mat = _pick_mat(rng, mats)
        add(local, 0.06, mat)

    if len(records) != hair['curls']:
        print('HAIR COUNT FAIL %d expected %d'
              % (len(records), hair['curls']))
        sys.exit(2)

    return {'curls': records, 'parts': [r['obj'] for r in records]}


def cover_check(records):
    """Azimuth coverage: 8 sectors of 45 degrees around the vertical axis.
    Returns (None, counts) if every sector has at least MIN_PER_SECTOR curls,
    else (start angle in degrees of the first short sector, counts)."""
    counts = [0] * SECTORS
    width = 2 * math.pi / SECTORS
    for r in records:
        x, y, _ = r['local']
        az = math.atan2(y, x)
        idx = int(math.floor((az + math.pi) / width)) % SECTORS
        counts[idx] += 1
    for i, n in enumerate(counts):
        if n < MIN_PER_SECTOR:
            return -180 + i * 45, counts
    return None, counts


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', default=None,
                        help='write the 80 x 80 render to this PNG')
    parser.add_argument('--report', action='store_true',
                        help='print the HAIR report line')
    parser.add_argument('--view', default='front', choices=['front', 'back'],
                        help='camera view for the render')
    args = parser.parse_args(argv)

    scene = charlib.clear_scene()
    with open(MARK_JSON) as f:
        spec = json.load(f)
    mats = charlib.make_mats(spec['palette'])

    # The pivot is made at scale 1 so the parts keep their radii while
    # attached; the head scale is applied afterwards, as the rig would.
    pivot = charlib.empty('mark_neck_pivot', tuple(spec['body']['neck_pivot']))
    mark_head.build_head(spec, mats, pivot)
    hair = build_hair(spec, mats, pivot)
    hs = spec['head_scale']
    pivot.scale = (hs, hs, hs)

    bad, _counts = cover_check(hair['curls'])
    if bad is not None:
        print('HAIR COVER FAIL %d' % bad)
        sys.exit(2)
    print('HAIR COVER OK')

    if args.report:
        bpy.context.view_layer.update()
        top_z = max(r['obj'].matrix_world.translation.z + r['radius'] * hs
                    for r in hair['curls'])
        back = sum(1 for r in hair['curls'] if r['local'][1] > 0.05)
        print('HAIR curls=%d top_z=%.3f back_cover=%d'
              % (len(hair['curls']), top_z, back))

    charlib.setup_char_scene(scene, args.view, (0.0, 1.52), 1.25, 80, 80)
    if args.out:
        charlib.render_png(scene, args.out)


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
