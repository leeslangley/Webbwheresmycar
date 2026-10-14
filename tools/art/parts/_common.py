# CA03: shared geometry helpers for the part modules. Every helper takes CAR
# coordinates: x runs -50 (tail) to +50 (nose), y is HEIGHT above ground (Blender
# Z), lat is the sideways offset from the centre line (Blender Y). Sizes are in
# car units. Each helper links the object into the scene, smooth-shades it and
# returns it. Blender only: this module imports bpy.
import math

import bmesh
import bpy

U = 0.1  # 1 car unit = 0.1 Blender metre

_AXIS_ROT = {
    'h': (0.0, 0.0, 0.0),            # Blender Z: a plain cylinder's own axis
    'x': (0.0, math.pi / 2.0, 0.0),  # along the car's length
    'lat': (math.pi / 2.0, 0.0, 0.0),  # across the car (sideways)
}

_SIDE_LISTS = {'both': [-1, 1], 'near': [-1], 'far': [1], 'centre': [0]}


def side_list(part):
    """The sides a part is built on: [-1] near, [1] far, [-1, 1] both, [0] centre.
    A part with no 'side' is 'both' when its lat is above 0, else 'centre'.
    An unknown side value falls back to that same default."""
    lat = part.get('lat', 0)
    default = 'both' if isinstance(lat, (int, float)) and lat > 0 else 'centre'
    side = part.get('side', default)
    if side not in _SIDE_LISTS:
        side = default
    return list(_SIDE_LISTS[side])


def part_name(kind, i, s):
    """Object name for part i of a kind on side s: 'kind_i_n' / '_f' / '_c'."""
    return '%s_%d_%s' % (kind, i, {-1: 'n', 1: 'f', 0: 'c'}[s])


def _loc(x, y, lat):
    return (x * U, lat * U, y * U)


def _axis_rot(axis):
    if axis not in _AXIS_ROT:
        raise ValueError('bad axis %r, expected x, lat or h' % (axis,))
    return _AXIS_ROT[axis]


def _finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def box(name, x, y, lat, dx, dh, dl, mat):
    """A box dx long (along the car), dh high and dl wide (sideways)."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=_loc(x, y, lat))
    obj = bpy.context.active_object
    obj.dimensions = (dx * U, dl * U, dh * U)
    return _finish(obj, name, mat)


def cyl(name, x, y, lat, r, depth, axis, mat, seg=24):
    """A cylinder of radius r and length depth, its axis 'x', 'lat' or 'h'."""
    rot = _axis_rot(axis)
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r * U,
                                        depth=depth * U, location=_loc(x, y, lat))
    obj = bpy.context.active_object
    obj.rotation_euler = rot
    return _finish(obj, name, mat)


def torus(name, x, y, lat, R, r, axis, mat):
    """A ring of major radius R and tube radius r, its axis 'x', 'lat' or 'h'."""
    rot = _axis_rot(axis)
    bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=12,
                                     major_radius=R * U, minor_radius=r * U,
                                     location=_loc(x, y, lat))
    obj = bpy.context.active_object
    obj.rotation_euler = rot
    return _finish(obj, name, mat)


def sphere(name, x, y, lat, rx, rh, rl, mat):
    """An ellipsoid with radii rx (along the car), rh (height), rl (sideways)."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=24, ring_count=12,
                                         location=_loc(x, y, lat))
    obj = bpy.context.active_object
    obj.scale = (rx * U, rl * U, rh * U)
    return _finish(obj, name, mat)


def lathe(name, profile, x, y, lat, axis, mat, seg=32):
    """A solid of revolution. profile is a list of (radius, along) pairs, both in
    car units; 'along' runs along the axis from the part's origin. The solid is
    spun round its axis ('x', 'lat' or 'h') and placed at (x, y, lat)."""
    rot = _axis_rot(axis)
    pts = [(float(r), float(a)) for r, a in profile]
    if len(pts) < 2:
        raise ValueError('lathe %s needs at least 2 profile points' % name)
    bm = bmesh.new()
    verts = [bm.verts.new((r * U, 0.0, a * U)) for r, a in pts]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0.0, 0.0, 0.0),
                   axis=(0.0, 0.0, 1.0), angle=2.0 * math.pi, steps=seg,
                   use_merge=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = _loc(x, y, lat)
    obj.rotation_euler = rot
    return _finish(obj, name, mat)
