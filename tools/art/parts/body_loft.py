# CA04: the lofted car body. With --body loft the body is a loft of cross-sections
# taken along the length of the car (sills, shoulders, tumblehome and a crowned
# roof and bonnet, rounded nose and tail), so the wings and roof read as curved
# metal instead of an extruded side profile. Without --body loft the stage builds
# the same slab body that blender_car2 builds when no body stage exists (that
# fallback is skipped once a body stage is registered, so this stage must do it).
# Blender only: this module imports bpy.
import math

import bmesh
import bpy

import carlib
from parts import stage
from parts._common import U

N_STATIONS = 56  # cross-sections along the length, dense at both ends
N_RING = 14      # points per right-hand half-section (surface.Surface.ring)


def _build_slab(ctx):
    """The slab body, exactly as blender_car2.build_slab builds it."""
    d = ctx['dossier']
    body = carlib.extrude_polygon(d['side_profile'], d['plan']['width_units'],
                                  ctx['mats']['paint'], 'body')
    carlib.shape_body(body, d['plan'])
    carlib.finish_mesh(body)
    return body


def _stations(surf):
    """N stations from the tail to the nose, bunched at both ends by a cosine."""
    span = surf.xmax - surf.xmin
    return [surf.xmin + span * (0.5 - 0.5 * math.cos(math.pi * i / (N_STATIONS - 1)))
            for i in range(N_STATIONS)]


def _section(surf, x):
    """The closed loop of one cross-section at station x, as Blender (x, y, z)
    points. The right half runs from bottom centre up to top centre; the mirrored
    half runs back down. The two centre points are shared, so they appear once."""
    right = surf.ring(x, N_RING)  # (lat, y) from bottom centre to top centre
    loop = list(right) + [(-lat, y) for lat, y in right[-2:0:-1]]
    return [(x * U, lat * U, y * U) for lat, y in loop]


def _check(obj, surf, xs):
    """Compare the object's size with the profile and print LOFT CHECK OK or BAD."""
    bpy.context.view_layer.update()
    dx = obj.dimensions.x * 10.0
    dz = obj.dimensions.z * 10.0
    want_x = surf.xmax - surf.xmin
    # The body's height: some profiles start above y=0 (docs/cars/t1_chimp.json
    # starts at 4.6), so measure top to bottom, not the top height alone.
    want_z = max(surf.top(x) for x in xs) - min(surf.bottom(x) for x in xs)
    if abs(dx - want_x) <= 3.0 and abs(dz - want_z) <= 1.5:
        print('LOFT CHECK OK dx=%.2f want=%.2f dz=%.2f want=%.2f'
              % (dx, want_x, dz, want_z))
    else:
        print('LOFT CHECK BAD dx=%.2f want=%.2f dz=%.2f want=%.2f'
              % (dx, want_x, dz, want_z))


def _build_loft(ctx):
    surf = ctx['surf']
    xs = _stations(surf)
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in _section(surf, x)] for x in xs]
    count = len(rings[0])
    for s in range(N_STATIONS - 1):
        a, b = rings[s], rings[s + 1]
        for k in range(count):
            k2 = (k + 1) % count
            bm.faces.new((a[k], a[k2], b[k2], b[k]))
    bm.faces.new(rings[0])            # tail end cap
    bm.faces.new(rings[-1][::-1])     # nose end cap
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    me = bpy.data.meshes.new('body')
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new('body', me)
    ctx['scene'].collection.objects.link(obj)
    obj.data.materials.append(ctx['mats']['paint'])
    for p in me.polygons:
        p.use_smooth = True
    sub = obj.modifiers.new('Subsurf', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    ctx['body'] = obj
    print('LOFT stations=%d verts=%d' % (N_STATIONS, len(me.vertices)))
    _check(obj, surf, xs)


@stage('body')
def build_body(ctx):
    args = ctx.get('args') or {}
    if args.get('body') != 'loft':
        if ctx.get('body') is None:
            ctx['body'] = _build_slab(ctx)
        return
    _build_loft(ctx)
