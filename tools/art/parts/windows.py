# CA06: the windows stage. Each greenhouse polygon becomes a glass pane cut from
# the body shell, so the glass lies on the curved cabin instead of sitting in a
# slab. Each window gets a thin frame rim (chrome, black or paint), and each
# pillar is a band of body paint between panes. Blender only: imports bpy.
import math

import bmesh
import bpy

import carlib
from parts import stage
from parts._common import U

# Scale (x, y, z) of the body copy each piece is cut from. Y is sideways and Z
# is height, both about the origin. A bigger scale lets a piece stand proud.
GLASS_SHELL = (1.0, 1.008, 1.004)
PILLAR_SHELL = (1.0, 1.012, 1.006)
FRAME_SHELL = (1.0, 1.006, 1.003)
FRAME_OFFSET = 0.35   # car units the frame rim stands out past the glass
PILLAR_OUT = 1.2      # a pillar runs out to 1.2 half widths, past the body


def extrude_polygon_range(pts, lat0, lat1, mat, name):
    """A prism of polygon pts (car x, y) spanning sideways from lat0 to lat1
    (car units). Like carlib.extrude_polygon, but not centred on the car."""
    bm = bmesh.new()
    verts = [bm.verts.new((x * U, lat0 * U, y * U)) for x, y in pts]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    new_verts = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0.0, (lat1 - lat0) * U, 0.0), verts=new_verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    me.materials.append(mat)
    return obj


def offset_polygon(pts, d):
    """The polygon pts pushed outward by d car units (a vertex-normal offset:
    each corner moves along the bisector of its two edge normals)."""
    pts = [(float(x), float(y)) for x, y in pts]
    n = len(pts)
    area = sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1]
               for i in range(n))
    sign = 1.0 if area >= 0 else -1.0  # CCW polygons: outward is right of the edge

    def out_normal(a, b):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy) or 1.0
        return (sign * dy / length, -sign * dx / length)

    out = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        n1 = out_normal(p0, p1)
        n2 = out_normal(p1, p2)
        mx, my = n1[0] + n2[0], n1[1] + n2[1]
        ml = math.hypot(mx, my) or 1.0
        mx, my = mx / ml, my / ml
        # Stretch the corner so each edge moves by d; clamp for sharp corners.
        cos = max(mx * n1[0] + my * n1[1], 0.5)
        out.append((p1[0] + mx * d / cos, p1[1] + my * d / cos))
    return out


def _shell(ctx, scale, name):
    """A copy of the body surface, scaled about the origin. The copy is taken
    from the evaluated body, so the subdivision of the body counts."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ctx['body'].evaluated_get(dg))
    sx, sy, sz = scale
    for v in me.vertices:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    obj = bpy.data.objects.new(name, me)
    ctx['scene'].collection.objects.link(obj)
    return obj


def _discard(obj):
    """Remove an object and its mesh."""
    me = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if me is not None and me.users == 0:
        bpy.data.meshes.remove(me)


def _cut(prism, shell, mat, name):
    """Boolean INTERSECT (EXACT) of prism with shell, applied to prism, which is
    then named and given mat. Returns the object, or None when nothing is left."""
    mod = prism.modifiers.new('cut', 'BOOLEAN')
    mod.operation = 'INTERSECT'
    mod.solver = 'EXACT'
    mod.object = shell
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(prism.evaluated_get(dg))
    prism.modifiers.remove(mod)
    old = prism.data
    prism.data = me
    bpy.data.meshes.remove(old)
    me.materials.clear()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    prism.name = name
    if len(me.vertices) == 0:
        _discard(prism)
        return None
    return prism


def _piece(ctx, prism, scale, mat, name):
    """Cut one prism against a shell at scale and return the result (or None)."""
    shell = _shell(ctx, scale, 'shell')
    obj = _cut(prism, shell, mat, name)
    _discard(shell)
    if obj is None:
        print('WARN %s empty' % name)
    return obj


def _frame_mat(ctx):
    """The window frame material from details['window_frame']."""
    kind = (ctx['details'] or {}).get('window_frame') or 'chrome'
    mats = ctx['mats']
    if kind == 'black':
        return mats['black']
    if kind == 'paint':
        return mats['paint']
    return mats['chrome']


def _usable(poly, label):
    """True when poly has at least 3 points, a face needs that many. A shorter
    polygon (a bare line in the dossier) prints a WARN and is skipped."""
    if len(poly) >= 3:
        return True
    print('WARN %s degenerate' % label)
    return False


@stage('windows')
def build_windows(ctx):
    details = ctx['details'] or {}
    width = float(ctx['dossier']['plan']['width_units'])
    half = width / 2.0
    mats = ctx['mats']
    frame_mat = _frame_mat(ctx)

    # Frame first, glass on top: the glass shell stands proud of the frame.
    for k, poly in enumerate(details.get('windows') or []):
        if not _usable(poly, 'window %d' % k):
            continue
        rim = carlib.extrude_polygon(offset_polygon(poly, FRAME_OFFSET),
                                     2.0 * width, frame_mat, 'prism')
        _piece(ctx, rim, FRAME_SHELL, frame_mat, 'frame_%d' % k)
        glass = carlib.extrude_polygon(poly, 2.0 * width, mats['glass'], 'prism')
        _piece(ctx, glass, GLASS_SHELL, mats['glass'], 'window_%d' % k)

    for k, pillar in enumerate(details.get('pillars') or []):
        poly = pillar['poly']
        if not _usable(poly, 'pillar %d' % k):
            continue
        lat_from = float(pillar.get('lat_from', 0.0))
        sides = (
            ('n', -PILLAR_OUT * half, -lat_from * half),
            ('f', lat_from * half, PILLAR_OUT * half),
        )
        for tag, lat0, lat1 in sides:
            prism = extrude_polygon_range(poly, lat0, lat1, mats['paint'], 'prism')
            _piece(ctx, prism, PILLAR_SHELL, mats['paint'],
                   'pillar_%d_%s' % (k, tag))
