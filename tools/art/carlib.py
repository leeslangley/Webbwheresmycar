# V01: shared Blender helpers for the car builders (blender_car.py, blender_car2.py).
# This module is imported by the builder scripts; nothing runs on import.
import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector


def hex_to_rgb(s):
    s = s.strip().lstrip('#')
    if len(s) != 6:
        print('Bad colour %r, expected #rrggbb' % s)
        sys.exit(2)
    try:
        return tuple(int(s[j:j + 2], 16) / 255.0 for j in (0, 2, 4))
    except ValueError:
        print('Bad colour %r, expected #rrggbb' % s)
        sys.exit(2)


def set_socket(node, name, value):
    sock = node.inputs.get(name)
    if sock is not None:
        sock.default_value = value


def make_mat(name, color, metallic=0.0, roughness=0.5, alpha=1.0,
             coat=0.0, coat_rough=0.05, emission=None, emission_strength=0.0,
             transmission=0.0, ior=1.45, blend=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    set_socket(node, 'Base Color', (*color, 1.0))
    set_socket(node, 'Metallic', metallic)
    set_socket(node, 'Roughness', roughness)
    set_socket(node, 'Alpha', alpha)
    set_socket(node, 'Coat Weight', coat)
    set_socket(node, 'Coat Roughness', coat_rough)
    set_socket(node, 'Transmission Weight', transmission)
    set_socket(node, 'IOR', ior)
    if emission is not None:
        set_socket(node, 'Emission Color', (*emission, 1.0))
        set_socket(node, 'Emission Strength', emission_strength)
    if blend is not None and hasattr(mat, 'blend_method'):
        mat.blend_method = blend
    return mat


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


# 1 car unit = 0.1 blender metre. Car faces +X, profile y becomes Z, width on Y.
U = 0.1


def extrude_polygon(pts, width, mat, name):
    bm = bmesh.new()
    half = -width / 2.0 * U
    verts = [bm.verts.new((x * U, half, y * U)) for x, y in pts]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    new_verts = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0.0, width * U, 0.0), verts=new_verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    me.materials.append(mat)
    return obj


# V02 tumblehome: how much the body narrows towards the roof, by plan value.
TUMBLEHOME_K = {'low': 0.04, 'medium': 0.10, 'high': 0.18}


def finish_mesh(obj, bevel_width=1.2 * U):
    """Bevel the edges, smooth with Catmull-Clark and shade smooth (the finish
    extrude_polygon used to apply itself). Call after any vertex shaping.
    bevel_width overrides the default body bevel (the glass uses a smaller one)."""
    bevel = obj.modifiers.new('Bevel', 'BEVEL')
    bevel.width = bevel_width
    bevel.segments = 4
    sub = obj.modifiers.new('Subsurf', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def shape_body(obj, plan):
    """V02: taper the body's width towards the nose and tail and pull the roof in
    (tumblehome) so it reads as a car body instead of an extruded slab. The mesh
    runs x from tail (-50) to nose (+50) and is centred on y; only y is scaled.
    Call this straight after the body mesh is built, before any modifier."""
    plan = plan or {}
    verts = obj.data.vertices
    if not verts:
        return obj
    xs = [v.co.x for v in verts]
    zs = [v.co.z for v in verts]
    xmin, xmax = min(xs), max(xs)
    zmin, zmax = min(zs), max(zs)
    span_x = xmax - xmin
    span_z = zmax - zmin
    nose_pct = plan.get('nose_width_pct', 100)
    tail_pct = plan.get('tail_width_pct', 100)
    k = TUMBLEHOME_K.get(plan.get('tumblehome', 'medium'), 0.10)
    for v in verts:
        t = (v.co.x - xmin) / span_x if span_x else 0.5
        f = 1.0
        if t < 0.25:
            f *= 1 - (1 - tail_pct / 100.0) * (0.25 - t) / 0.25
        if t > 0.75:
            f *= 1 - (1 - nose_pct / 100.0) * (t - 0.75) / 0.25
        h = (v.co.z - zmin) / span_z if span_z else 0.5
        if h > 0.55:
            f *= 1 - k
        v.co.y *= f
    return obj


def build_glass(dossier, body_obj, mats):
    """V03: extrude each greenhouse polygon as the glass sitting inside the
    narrower roof. A soft-top-up roof gets dark fabric instead of glass.
    body_obj is unused so far (kept so builders pass the body they shape).
    Returns the new objects; none if the dossier has no greenhouse."""
    roof = dossier.get('roof') or {}
    mat = mats['fabric'] if roof.get('type') == 'soft-top-up' else mats['glass']
    width = dossier['plan']['width_units'] * 0.86
    objs = []
    for i, poly in enumerate(polygons(dossier.get('greenhouse'))):
        obj = extrude_polygon(poly, width, mat, 'glass%d' % i)
        finish_mesh(obj, 0.4 * U)
        objs.append(obj)
    return objs


def _add_cyl(name, radius, depth, loc, mat, rot=(0.0, 0.0, 0.0)):
    """A cylinder primitive centred on loc; rot is an Euler triple. A plain
    cylinder's axis is Z, so callers pass rot to lay it along another axis."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius,
                                        depth=depth, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    return obj


def _wheel_detail(style, pair, loc, s, r, depth, mats):
    """V04: the centre detail that tells the wheel styles apart, added proud of
    the rim's outer face (side s) so it shows from outside the wheel.
    depth is the tyre depth in car units; loc is the wheel centre."""
    face = (depth + 0.2) / 2.0  # rim outer face, car units from the wheel plane
    objs = []
    if style == 'wire':
        # 24 thin spokes from hub to rim, lying in the wheel plane.
        for k in range(24):
            a = k * math.pi / 12.0
            spoke = _add_cyl(
                'spoke_%s_%d' % (pair, k), 0.05 * r * U, 0.62 * r * U,
                (loc[0] + 0.31 * r * U * math.sin(a),
                 loc[1] + s * (face + 0.025 * r) * U,
                 loc[2] + 0.31 * r * U * math.cos(a)),
                mats['chrome'], rot=(0.0, a, 0.0))
            objs.append(spoke)
    elif style == 'alloy':
        # 5 box spokes.
        for k in range(5):
            a = k * 2.0 * math.pi / 5.0
            bpy.ops.mesh.primitive_cube_add(
                location=(loc[0] + 0.31 * r * U * math.cos(a),
                          loc[1] + s * (face + 0.025 * r) * U,
                          loc[2] - 0.31 * r * U * math.sin(a)))
            obj = bpy.context.active_object
            obj.name = 'spoke_%s_%d' % (pair, k)
            obj.rotation_euler = (0.0, a, 0.0)
            obj.dimensions = (0.62 * r * U, 0.05 * r * U, 0.16 * r * U)
            obj.data.materials.append(mats['chrome'])
            objs.append(obj)
    elif style == 'knockoff':
        # A centre-lock knock-off hub nut, apex pointing out of the wheel.
        bpy.ops.mesh.primitive_cone_add(
            vertices=24, radius1=0.16 * r * U, radius2=0.04 * r * U,
            depth=0.24 * r * U,
            location=(loc[0], loc[1] + s * (face + 0.12 * r) * U, loc[2]))
        obj = bpy.context.active_object
        obj.name = 'nut_' + pair
        obj.rotation_euler.x = -s * math.pi / 2.0
        obj.data.materials.append(mats['chrome'])
        objs.append(obj)
    else:
        # steel and anything else: a chrome hub disc with a small dark centre.
        objs.append(_add_cyl(
            'hub_%s' % pair, 0.30 * r * U, 0.3 * U,
            (loc[0], loc[1] + s * (face + 0.15) * U, loc[2]), mats['chrome']))
        objs.append(_add_cyl(
            'hub_centre_%s' % pair, 0.07 * r * U, 0.2 * U,
            (loc[0], loc[1] + s * (face + 0.35) * U, loc[2]), mats['tyre']))
    return objs


def build_wheels(dossier, mats):
    """V04: the wheels from the dossier's wheels list, one rim detail per
    style. Each wheel gets a tyre and a rim on both sides of the car; in a
    three-wheel dossier the single wheel (the one whose x is unique) sits only
    on the centreline. Returns the new objects."""
    width = dossier['plan']['width_units']
    wheels = dossier.get('wheels') or []
    # With three wheels, the one whose x differs from the other two is the solo.
    solo = -1
    if len(wheels) == 3:
        xs = [w.get('x', 0.0) for w in wheels]
        for i, x in enumerate(xs):
            if xs.count(x) == 1:
                solo = i
    objs = []
    for i, w in enumerate(wheels):
        r = w['r']
        depth = max(2.2, 0.8 * r)  # tyre depth in car units
        style = w.get('style', 'steel')
        for s in ([0] if i == solo else (-1, 1)):
            loc = (w['x'] * U, s * (width / 2.0 - depth / 2.0 - 0.4) * U,
                   r * U)
            pair = '%d_%d' % (i, s)
            tyre = _add_cyl('tyre_' + pair, r * U, depth * U, loc,
                            mats['tyre'])
            bev = tyre.modifiers.new('Bevel', 'BEVEL')
            bev.width = 0.5 * U
            objs.append(tyre)
            # The rim is a little wider than the tyre so its face shows.
            objs.append(_add_cyl('rim_' + pair, 0.62 * r * U,
                                 (depth + 0.2) * U, loc, mats['chrome']))
            objs += _wheel_detail(style, pair, loc, s, r, depth, mats)
    return objs


# --- V05: headlamps, tail lamps and number plates ---
# Positions are in car units (x along the car, profile y is Z, width on Y);
# each one is converted with U when it is placed in the Blender scene.

HEADLAMP_SHAPES = ('round', 'square', 'oval', 'pop-up', 'slanted')


def _number(d, key, default, positive=False):
    """A finite number from d[key], or default when it is missing or unusable.
    positive=True also rejects zero and negative numbers."""
    v = d.get(key, default) if isinstance(d, dict) else default
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        return float(default)
    if positive and v <= 0:
        return float(default)
    return float(v)


def _profile_points(profile):
    """The valid [x, y] pairs of a side profile, as float tuples."""
    pts = []
    for p in profile if isinstance(profile, list) else []:
        if (isinstance(p, (list, tuple)) and len(p) == 2
                and all(isinstance(v, (int, float)) and not isinstance(v, bool)
                        and math.isfinite(v) for v in p)):
            pts.append((float(p[0]), float(p[1])))
    return pts


def _headlamp_settings(dossier):
    """The headlamp settings from front.headlamps, with the V05 defaults for any
    field that is missing or unusable. Returns (count, shape, x, y, r, y_offset)."""
    front = dossier.get('front')
    h = front.get('headlamps') if isinstance(front, dict) else None
    if not isinstance(h, dict):
        h = {}
    count = int(_number(h, 'count', 2))
    if count not in (1, 2, 4):
        count = 2
    shape = h.get('shape', 'round')
    if shape not in HEADLAMP_SHAPES:
        shape = 'round'
    return (count, shape,
            _number(h, 'x', 47.0),
            _number(h, 'y', 17.0),
            _number(h, 'r', 2.6, positive=True),
            _number(h, 'y_offset_from_centre', 11.0))


def _headlamp_lateral(count, y_off):
    """Sideways (Y) offsets in car units for each headlamp."""
    if count == 1:
        return [0.0]
    if count == 2:
        return [-y_off, y_off]
    return [-y_off, y_off, -0.55 * y_off, 0.55 * y_off]


def _smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def _lamp_box(name, loc, dims, mat, rot=(0.0, 0.0, 0.0)):
    """A box of size dims (Blender units) centred on loc (Blender units)."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dims
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    return obj


def _lamp_ring(name, loc, major, minor, mat):
    """A torus ring (Blender units) whose axis runs along X, the car's length."""
    bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=12,
                                     major_radius=major, minor_radius=minor,
                                     location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = (0.0, math.pi / 2.0, 0.0)
    obj.data.materials.append(mat)
    return _smooth(obj)


def _lamp_sphere(name, loc, radius, scale, mat):
    """A sphere (Blender units) stretched by scale."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=24,
                                         ring_count=12, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return _smooth(obj)


def _headlamp_parts(i, shape, loc, r, mats):
    """The objects for headlamp i at loc (Blender units); r is in car units."""
    name = 'headlamp_%d' % i
    R = r * U
    if shape == 'square':
        # A chrome housing 2r wide and high, with its lens set into the front.
        housing = _lamp_box(name, loc, (0.6 * R, 2.0 * R, 2.0 * R), mats['chrome'])
        lens = _lamp_box(name + '_lens', (loc[0] + 0.15 * R, loc[1], loc[2]),
                         (0.3 * R, 1.6 * R, 1.6 * R), mats['lens'])
        return [housing, lens]
    if shape == 'oval':
        return [_lamp_sphere(name, loc, R, (0.45, 1.4, 1.0), mats['lens'])]
    if shape == 'pop-up':
        # Hidden lamps: a flat dark lid (the tyre material is the dark one).
        return [_lamp_box(name, loc, (0.3 * R, 2.4 * R, 1.8 * R), mats['tyre'])]
    if shape == 'slanted':
        return [_lamp_box(name, loc, (0.4 * R, 2.2 * R, 1.2 * R), mats['lens'],
                          rot=(0.0, 0.35, 0.0))]
    # round (and anything else): a chrome ring with a flattened glass lens inside.
    ring = _lamp_ring(name, loc, R, 0.22 * R, mats['chrome'])
    lens = _lamp_sphere(name + '_lens', loc, 0.78 * R, (0.45, 1.0, 1.0), mats['lens'])
    return [ring, lens]


def build_lamps(dossier, mats):
    """V05: the headlamps from front.headlamps (defaults for anything missing),
    two red tail lamps and a number plate on the front and rear faces.
    Objects are named headlamp_<i>, taillamp_<i> and plate_front / plate_rear.
    Needs mats 'chrome', 'lens', 'tail', 'plate' and 'tyre'. Returns the new objects."""
    count, shape, hx, hy, r, y_off = _headlamp_settings(dossier)
    objs = []
    for i, lat in enumerate(_headlamp_lateral(count, y_off)):
        objs += _headlamp_parts(i, shape, (hx * U, lat * U, hy * U), r, mats)

    pts = _profile_points(dossier.get('side_profile'))
    if not pts:
        return objs  # no body outline to hang the rear lamps and plates on
    xs = [x for x, _ in pts]
    ys = [y for _, y in pts]
    xmin, xmax, ymin, ymax = min(xs), max(xs), min(ys), max(ys)
    # The rear lamps sit at 0.62 of the height of the rear-most outline points.
    tail_top = max(y for x, y in pts if x < xmin + 6.0)
    width = _number(dossier.get('plan'), 'width_units', 40.0, positive=True)

    for idx, s in enumerate((-1.0, 1.0)):
        loc = ((xmin + 0.5) * U, s * width * 0.38 * U, 0.62 * tail_top * U)
        objs.append(_lamp_box('taillamp_%d' % idx, loc,
                              (1.5 * U, 4.0 * U, 3.0 * U), mats['tail']))

    # Number plates, centred, at 0.35 of the body height above its bottom.
    z = (ymin + 0.35 * (ymax - ymin)) * U
    dims = (1.2 * U, 12.0 * U, 4.0 * U)
    objs.append(_lamp_box('plate_front', ((xmax + 0.6) * U, 0.0, z), dims,
                          mats['plate']))
    objs.append(_lamp_box('plate_rear', ((xmin - 0.6) * U, 0.0, z), dims,
                          mats['plate']))
    return objs


def load_dossier(path):
    """Read one car dossier JSON. Exits 2 with a clear message if it is unusable."""
    if not os.path.isfile(path):
        print('Cannot read dossier %s: no such file' % path)
        sys.exit(2)
    try:
        with open(path) as f:
            d = json.load(f)
    except ValueError as e:
        print('Cannot read dossier %s: not valid JSON (%s)' % (path, e))
        sys.exit(2)
    except OSError as e:
        print('Cannot read dossier %s: %s' % (path, e))
        sys.exit(2)
    if not isinstance(d, dict):
        print('Cannot read dossier %s: the top level must be a JSON object' % path)
        sys.exit(2)
    for key in ('id', 'side_profile', 'plan', 'wheels'):
        if key not in d:
            print('Cannot read dossier %s: missing required field %r' % (path, key))
            sys.exit(2)
    return d


def polygons(greenhouse):
    """A single list of [x,y] pairs becomes a one-polygon list; a list of
    polygons is returned unchanged."""
    pts = greenhouse or []
    if pts and all(isinstance(p, (list, tuple)) and len(p) == 2
                   and not isinstance(p[0], (list, tuple)) for p in pts):
        return [pts]
    return pts


# --- scene setup: copied from blender_car.py's main(), split into functions ---

def setup_world(scene):
    # World: dark purple to feed the reflections, film stays transparent.
    world = bpy.data.worlds.new('world')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = (*hex_to_rgb('#2a2150'), 1.0)
    bg.inputs[1].default_value = 0.6
    scene.world = world
    scene.render.film_transparent = True


def setup_lights(scene):
    # Lights: warm key upper-left-front, cool rim behind and above, fill right.
    lights = [
        ('key', '#fff0d8', 3000, 6.0, (-9, -11, 10)),
        ('rim', '#a8c4ff', 1200, 4.0, (10, 9, 9)),
        ('fill', '#ffffff', 300, 5.0, (11, -7, 3)),
    ]
    for name, col, energy, size, loc in lights:
        ld = bpy.data.lights.new(name, type='AREA')
        ld.color = hex_to_rgb(col)
        ld.energy = energy
        ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        scene.collection.objects.link(lo)
        look_at(lo, (0, 0, 1.5))


def setup_camera(scene, w, h):
    # Camera: orthographic from the right-hand side, car facing image right.
    # It frames the bounding box of every mesh object except the shadow catcher.
    xmin = ymin = zmin = 1e9
    xmax = ymax = zmax = -1e9
    found = False
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.name == 'shadow_catcher':
            continue
        found = True
        for corner in obj.bound_box:
            wx, wy, wz = obj.matrix_world @ Vector(corner)
            xmin, xmax = min(xmin, wx), max(xmax, wx)
            ymin, ymax = min(ymin, wy), max(ymax, wy)
            zmin, zmax = min(zmin, wz), max(zmax, wz)
    if not found:
        print('No mesh objects to frame; there is nothing to render')
        sys.exit(2)
    zmin = min(zmin, -0.2)  # leave a little room below for the shadow
    zc = (zmin + zmax) / 2.0
    cam_data = bpy.data.cameras.new('camera')
    cam_data.type = 'ORTHO'
    need_w = (xmax - xmin) * 1.12
    need_h = (zmax - zmin) * 1.15
    cam_data.ortho_scale = max(11.0, need_w, need_h * float(w) / float(h))
    cam = bpy.data.objects.new('camera', cam_data)
    # Ortho + 6 degree pitch: the frame centre is where the view axis meets the
    # car plane, so lift the camera by 20*tan(6) to keep that point at zc.
    pitch_drop = 20.0 * math.tan(math.radians(6.0))
    cam.location = (0, -20, zc + pitch_drop)
    scene.collection.objects.link(cam)
    look_at(cam, (0, 0, zc))
    scene.camera = cam


def render(scene, out, w, h):
    # Render: Cycles on CPU, 64 samples, denoised, transparent PNG.
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
