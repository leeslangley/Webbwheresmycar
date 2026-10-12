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
    bevel = obj.modifiers.new('Bevel', 'BEVEL')
    bevel.width = 0.9 * U
    bevel.segments = 3
    sub = obj.modifiers.new('Subsurf', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    for p in me.polygons:
        p.use_smooth = True
    return obj


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
