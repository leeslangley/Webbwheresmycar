# GC01: shared Blender helpers for character modelling (Mark, Dave, customers).
# This module is imported by the character builders; nothing runs on import.
# Colours are given as #rrggbb sRGB hex and converted to LINEAR before Blender
# sees them (the car code forgot this and renders washed out).
import bpy
import bmesh
import math
import sys
from mathutils import Vector


def lin(hexstr):
    """'#rrggbb' (sRGB) -> (r, g, b) linear floats."""
    s = str(hexstr).strip().lstrip('#')
    if len(s) != 6:
        print('Bad colour %r, expected #rrggbb' % hexstr)
        sys.exit(2)
    try:
        vals = [int(s[j:j + 2], 16) / 255.0 for j in (0, 2, 4)]
    except ValueError:
        print('Bad colour %r, expected #rrggbb' % hexstr)
        sys.exit(2)
    out = []
    for c in vals:
        if c <= 0.04045:
            out.append(c / 12.92)
        else:
            out.append(((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


def byte(x):
    """Linear float -> sRGB 0..255 int (inverse of lin, clamped and rounded)."""
    x = min(1.0, max(0.0, float(x)))
    if x <= 0.0031308:
        c = x * 12.92
    else:
        c = 1.055 * (x ** (1.0 / 2.4)) - 0.055
    return int(round(min(1.0, max(0.0, c)) * 255))


# --- materials ---------------------------------------------------------------

def _set_grey(node, value):
    node.color = (value, value, value, 1.0)


def _socket(sockets, identifier):
    """Find a socket by identifier (Mix node names repeat across types)."""
    for s in sockets:
        if s.identifier == identifier:
            return s
    print('Missing node socket %s' % identifier)
    sys.exit(2)


def toon_mat(name, hexc, ramp=(0.58, 0.86, 1.06), cuts=(0.30, 0.72)):
    """Three-step cel shading. Diffuse -> Shader to RGB -> constant Colour Ramp
    (grey steps ramp[0..2] at 0, cuts[0], cuts[1]) -> Multiply by the base colour
    -> Emission, so the bands are the only shading and the colour is exact."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    diffuse = nodes.new('ShaderNodeBsdfDiffuse')
    diffuse.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)

    to_rgb = nodes.new('ShaderNodeShaderToRGB')

    cramp = nodes.new('ShaderNodeValToRGB')
    cramp.color_ramp.interpolation = 'CONSTANT'
    els = cramp.color_ramp.elements
    els[0].position = 0.0
    _set_grey(els[0], ramp[0])
    e1 = els.new(cuts[0])
    _set_grey(e1, ramp[1])
    e2 = els.new(cuts[1])
    _set_grey(e2, ramp[2])

    mix = nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    r, g, b = lin(hexc)
    sock_b = _socket(mix.inputs, 'B_Color')
    sock_b.default_value = (r, g, b, 1.0)

    emit = nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = 1.0

    out = nodes.new('ShaderNodeOutputMaterial')

    links.new(diffuse.outputs['BSDF'], to_rgb.inputs['Shader'])
    links.new(to_rgb.outputs['Color'], cramp.inputs['Fac'])
    links.new(cramp.outputs['Color'], _socket(mix.inputs, 'A_Color'))
    links.new(_socket(mix.outputs, 'Result_Color'), emit.inputs['Color'])
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def flat_mat(name, hexc):
    """Emission only, exact colour, never shaded (pupils, outlines)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    emit = nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value = (*lin(hexc), 1.0)
    emit.inputs['Strength'].default_value = 1.0
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def make_mats(palette, flat=('pupil',)):
    """palette: {key: '#rrggbb'} -> {key: material}. Keys in `flat` use flat_mat."""
    mats = {}
    for key, hexc in palette.items():
        if key in flat:
            mats[key] = flat_mat(key, hexc)
        else:
            mats[key] = toon_mat(key, hexc)
    return mats


# --- shapes ------------------------------------------------------------------

def _scene():
    return bpy.context.scene


def _mesh_object(name, bm, mat, loc=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0),
                 rot=(0.0, 0.0, 0.0), smooth=True):
    if smooth:
        for f in bm.faces:
            f.smooth = True
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if mat is not None:
        me.materials.append(mat)
    obj = bpy.data.objects.new(name, me)
    obj.location = tuple(loc)
    obj.scale = tuple(scale)
    obj.rotation_euler = tuple(rot)
    _scene().collection.objects.link(obj)
    return obj


def sphere(loc, scale, mat, name, seg=24):
    """UV sphere of radius 1, then scaled by `scale` (x, y, z)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(3, seg // 2),
                              radius=1.0)
    return _mesh_object(name, bm, mat, loc=loc, scale=scale)


def capsule(a, b, r, mat, name):
    """Cylinder of radius r from point a to point b, with a sphere cap at each
    end (separate objects named name_a and name_b). Returns the cylinder."""
    a = Vector(a)
    b = Vector(b)
    d = b - a
    length = d.length
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=16,
                          radius1=r, radius2=r, depth=max(length, 1e-6))
    mid = (a + b) / 2.0
    obj = _mesh_object(name, bm, mat, loc=tuple(mid))
    if length > 1e-9:
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(d)
    sphere(tuple(a), (r, r, r), mat, name + '_a')
    sphere(tuple(b), (r, r, r), mat, name + '_b')
    return obj


def ring(loc, major, minor, mat, name):
    """Torus with 32 x 10 segments, facing the Y axis (rotation pi/2 about X)."""
    bm = bmesh.new()
    n_major, n_minor = 32, 10
    verts = []
    for i in range(n_major):
        u = 2.0 * math.pi * i / n_major
        for j in range(n_minor):
            v = 2.0 * math.pi * j / n_minor
            rr = major + minor * math.cos(v)
            verts.append(bm.verts.new((rr * math.cos(u), rr * math.sin(u),
                                       minor * math.sin(v))))
    for i in range(n_major):
        for j in range(n_minor):
            a = verts[i * n_minor + j]
            b = verts[((i + 1) % n_major) * n_minor + j]
            c = verts[((i + 1) % n_major) * n_minor + (j + 1) % n_minor]
            d = verts[i * n_minor + (j + 1) % n_minor]
            bm.faces.new((a, b, c, d))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return _mesh_object(name, bm, mat, loc=loc, rot=(math.pi / 2.0, 0.0, 0.0))


def rbox(loc, size, bevel, mat, name):
    """Cube of full size (sx, sy, sz), bevelled (width `bevel`, 4 segments) and
    subdivided once more (Subsurf level 2)."""
    sx, sy, sz = size
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    obj = _mesh_object(name, bm, mat, loc=loc)
    bev = obj.modifiers.new('Bevel', 'BEVEL')
    bev.width = bevel
    bev.segments = 4
    sub = obj.modifiers.new('Subsurf', 'SUBSURF')
    sub.levels = 2
    sub.render_levels = 2
    return obj


def empty(name, loc, parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.location = tuple(loc)
    _scene().collection.objects.link(obj)
    if parent is not None:
        attach(obj, parent)
    return obj


def attach(obj, parent):
    """Parent obj to parent, keeping its world position."""
    bpy.context.view_layer.update()
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()


def set_visible(objs, shown):
    for o in objs:
        o.hide_render = not shown
        o.hide_viewport = not shown


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


# --- scene -------------------------------------------------------------------

# Camera azimuth in degrees around the vertical axis. Characters face -Y, so the
# front camera sits at -Y. Positive azimuth turns the camera to the right.
VIEWS = {'front': 0, 'back': 180, 'q_left': -35, 'q_right': 35}


def _rot_z(v, deg):
    """Rotate vector v (x, y, z) about the Z axis by deg degrees."""
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    return Vector((v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]))


def _sun(scene, name, hexc, energy, vec, az):
    d = _rot_z(vec, az).normalized()
    data = bpy.data.lights.new(name, type='SUN')
    data.color = lin(hexc)
    data.energy = energy
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return obj


def setup_char_scene(scene, view, center, ortho, w, h):
    """Lights, world, camera and render settings for one character still.
    center = (x, z) world point at the middle of the image."""
    if view not in VIEWS:
        print('Unknown view %r, expected one of %s' % (view, sorted(VIEWS)))
        sys.exit(2)
    az = VIEWS[view]
    cx, cz = float(center[0]), float(center[1])

    # World: a mid-dark blue-grey, not white (white ambient flattens the shading).
    world = bpy.data.worlds.new('world')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = (0.16, 0.16, 0.20, 1.0)
    bg.inputs[1].default_value = 1.0
    scene.world = world
    scene.render.film_transparent = True

    # Warm key from upper left front (white colour: the warm tone comes from the
    # direction and the palette), and a cool rim from behind and above.
    key = _sun(scene, 'key', '#ffffff', 2.4, Vector((0.55, 0.75, -0.8)), az)
    rim = _sun(scene, 'rim', '#a8c4ff', 0.6, Vector((-0.4, -0.5, -0.3)), az)

    # Orthographic camera 10 units out in the azimuth direction, looking at the
    # centre of the frame.
    t = math.radians(az)
    cam_data = bpy.data.cameras.new('camera')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = float(ortho)
    cam = bpy.data.objects.new('camera', cam_data)
    cam.location = (cx + 10.0 * math.sin(t), -10.0 * math.cos(t), cz)
    scene.collection.objects.link(cam)
    look_at(cam, (cx, 0.0, cz))
    scene.camera = cam

    scene.render.engine = 'BLENDER_EEVEE'
    scene.view_settings.view_transform = 'Standard'
    scene.render.resolution_x = int(w)
    scene.render.resolution_y = int(h)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    return key, rim, cam


def render_png(scene, path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
