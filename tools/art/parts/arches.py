# CA05: wheel arches cut into the body, with dark wheel wells. The 'arches' stage
# runs after the body stage and before the wheels stage (parts.STAGE_ORDER). It
# applies the body's modifiers, then cuts one arch per unique wheel x per side:
# a cylinder for round and flared, a bevelled box for squared. Each cut gets a
# dark well disc at its inner end; flared arches also get a painted half-ring lip.
# No arches for none-skirted and cycle-wing bodies, nor for the unique-x front
# wheel of a three-wheeler. Blender only: this module imports bpy through _common.
import math

import bmesh
import bpy

from . import stage
from ._common import U, box, cyl

_SKIP_ARCH = ('none-skirted', 'cycle-wing')


def apply_modifiers(obj):
    """Replace obj's mesh with its evaluated mesh (every modifier applied) and
    clear its modifier stack. Returns the new mesh."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    if old is not None and old.users == 0:
        bpy.data.meshes.remove(old)
    for p in me.polygons:
        p.use_smooth = True
    return me


def _delete(obj):
    """Remove an object and its mesh from the file."""
    me = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if me is not None and me.users == 0:
        bpy.data.meshes.remove(me)


def _boolean(body, cutter, solver):
    """Cut cutter out of body with one applied Boolean. Returns the face count."""
    body.modifiers.clear()
    mod = body.modifiers.new('ArchCut', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    mod.solver = solver
    apply_modifiers(body)
    return len(body.data.polygons)


def _cut_body(body, cutter):
    """Cut with the MANIFOLD solver, then EXACT if that leaves no faces. A failed
    attempt is undone from a copy of the mesh. True when a cut was made."""
    for solver in ('MANIFOLD', 'EXACT'):
        before = body.data.copy()
        if _boolean(body, cutter, solver) > 0:
            bpy.data.meshes.remove(before)
            return True
        old = body.data
        body.data = before
        body.modifiers.clear()
        if old.users == 0:
            bpy.data.meshes.remove(old)
    return False


def _lip(ctx, name, x, y, lat, R, mat):
    """A painted half-ring lip round an arch hole, at the outer face. A 0.45 tube
    circle at radius R on the rear side of the hole is spun 180 degrees round the
    lat axis through the wheel centre, so it covers the upper arc only."""
    bm = bmesh.new()
    seg = 12
    ring = []
    for k in range(seg):
        t = 2.0 * math.pi * k / seg
        px = (x - (R + 0.45 * math.cos(t))) * U
        pl = (lat + 0.45 * math.sin(t)) * U
        ring.append(bm.verts.new((px, pl, y * U)))
    edges = [bm.edges.new((ring[k], ring[(k + 1) % seg])) for k in range(seg)]
    bmesh.ops.spin(bm, geom=ring + edges, cent=(x * U, lat * U, y * U),
                   axis=(0.0, 1.0, 0.0), angle=math.pi, steps=12, use_merge=False)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    ctx['scene'].collection.objects.link(obj)
    obj.data.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    return obj


@stage('arches')
def build_arches(ctx):
    d = ctx['dossier']
    arch = d.get('wheel_arch') or 'round'
    if arch in _SKIP_ARCH:
        print('ARCH SKIP %s' % arch)
        return
    body = ctx.get('body')
    if body is None:
        print('ARCH SKIP no body')
        return
    if arch not in ('round', 'squared', 'flared'):
        print('ARCH WARN unknown wheel_arch %r, using round' % (arch,))

    width = float(d['plan']['width_units'])
    w0 = width / 2.0                 # half the body width
    depth = 0.30 * width             # depth of each cut, sideways
    mats = ctx['mats']
    mult = float(ctx['mult']('wheels'))
    wheels = d.get('wheels') or []
    xs = [float(w.get('x', 0.0)) for w in wheels]
    trike = len(wheels) == 3

    # One wheel per unique x: the first dossier entry with that x.
    picks = []
    seen = set()
    for w in wheels:
        x = float(w.get('x', 0.0))
        if x in seen:
            continue
        seen.add(x)
        if trike and xs.count(x) == 1:
            print('ARCH SKIP trike front')
            continue
        picks.append((x, float(w['r']) * mult))

    apply_modifiers(body)
    n_before = len(body.data.vertices)
    print('ARCH VERTS before=%d' % n_before)

    n = 0
    for x, r in picks:
        R = r * 1.13 + 0.3           # arch radius, a little over the wheel
        for s in (-1, 1):
            side = 'n' if s < 0 else 'f'
            lat = s * (w0 - depth / 2.0 + 0.5)   # cutter centre, sideways
            y = r
            name = 'archcut_%d_%s' % (n, side)
            if arch == 'squared':
                cutter = box(name, x, (R + r) / 2.0, lat, 2.0 * R, R + r, depth,
                             mats['dark'])
                bev = cutter.modifiers.new('ArchBevel', 'BEVEL')
                bev.width = 1.2 * U
                bev.segments = 2
                apply_modifiers(cutter)
            else:
                cutter = cyl(name, x, y, lat, R, depth, 'lat', mats['dark'])
            ok = _cut_body(body, cutter)
            _delete(cutter)
            if not ok:
                print('ARCH BOOL FAILED x=%.1f side=%s' % (x, side))
                continue
            # Dark well disc at the inner end of the cut. The cut floor is at
            # w0 - depth + 0.5 (sideways); the disc sits just proud of it, in the
            # void. A disc inside the solid body would never show.
            inner = s * (w0 - depth + 0.7)
            cyl('archwell_%d_%s' % (n, side), x, y, inner, R * 0.98, 0.4, 'lat',
                mats['dark'])
            if arch == 'flared':
                _lip(ctx, 'archlip_%d_%s' % (n, side), x, y, s * w0, R,
                     mats['paint'])
            n += 1

    print('ARCH VERTS after=%d' % len(body.data.vertices))
    print('ARCH OK n=%d' % n)
