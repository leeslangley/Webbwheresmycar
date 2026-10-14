# GE reference prototype (14 Oct 2026): core of the Blender room kit.
# Not production code: the GE cards rebuild this as tools/art/roomlib.py. Blender 5.2 python (bpy, numpy; no PIL).
# World: X right (1 px = 0.01 m), Y = depth (back wall at y=0, camera side is negative y), Z up.
# Camera: orthographic, tilted down TILT degrees, frame 1280x720 = the game's logical canvas.
# Layout rule: all rectangles are in SCREEN px of the game canvas (0..1280, 0..720).
#   a point on the back-wall plane at screen (px, py) -> world (px/100, 0, wz(py))
#   a point on the floor at screen (px, py)           -> world (px/100, fy(py), 0)   (py > FLOOR_PY)
import math
import bmesh
import bpy
from mathutils import Vector

TILT = math.radians(16.0)
CT, ST = math.cos(TILT), math.sin(TILT)
FLOOR_PY = 480.0          # screen y where the wall meets the floor
FRAME_W, FRAME_H = 1280, 720


def wx(px):
    return px / 100.0


def wz(py):
    return (FLOOR_PY - py) / (100.0 * CT)


def fy(py):
    return -(py - FLOOR_PY) / (100.0 * ST)


def hexc(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def lin(c):
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def mat(name, col, rough=0.6, metal=0.0, emit=None, estr=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes['Principled BSDF']
    n.inputs['Base Color'].default_value = (*lin(hexc(col)), 1)
    n.inputs['Roughness'].default_value = rough
    n.inputs['Metallic'].default_value = metal
    if coat:
        n.inputs['Coat Weight'].default_value = coat
    if emit:
        n.inputs['Emission Color'].default_value = (*lin(hexc(emit)), 1)
        n.inputs['Emission Strength'].default_value = estr
    return m


def tex_mat(name, kind, c1, c2, scale=8.0, rough=0.7, duty=0.5):
    """Procedural two-colour material, driven by OBJECT coordinates (no UVs needed).
    kind: 'planks' | 'stripes' | 'noise' | 'checker'."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n = nt.nodes['Principled BSDF']
    n.inputs['Roughness'].default_value = rough
    coord = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*lin(hexc(c1)), 1)
    ramp.color_ramp.elements[1].color = (*lin(hexc(c2)), 1)
    nt.links.new(coord.outputs['Object'], mp.inputs['Vector'])
    if kind == 'planks':
        t = nt.nodes.new('ShaderNodeTexBrick')
        t.inputs['Scale'].default_value = scale
        t.inputs['Mortar Size'].default_value = 0.012
        t.inputs['Brick Width'].default_value = 2.2
        t.inputs['Row Height'].default_value = 0.25
        t.inputs['Color1'].default_value = (0.0, 0.0, 0.0, 1)
        t.inputs['Color2'].default_value = (1.0, 1.0, 1.0, 1)
        t.inputs['Mortar'].default_value = (0.0, 0.0, 0.0, 1)
        nt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        nt.links.new(t.outputs['Fac'], ramp.inputs['Fac'])
        nz = nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = 60
        nz.inputs['Detail'].default_value = 2
        nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
        mix = nt.nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Fac'].default_value = 0.25
        nt.links.new(ramp.outputs['Color'], mix.inputs['Color1'])
        nt.links.new(nz.outputs['Color'], mix.inputs['Color2'])
        nt.links.new(mix.outputs['Color'], n.inputs['Base Color'])
        return m
    if kind == 'stripes':
        t = nt.nodes.new('ShaderNodeTexWave')
        t.wave_type = 'BANDS'
        t.bands_direction = 'X'
        t.wave_profile = 'SAW'
        t.inputs['Scale'].default_value = scale
        t.inputs['Distortion'].default_value = 0
        t.inputs['Detail'].default_value = 0
        nt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        sm = nt.nodes.new('ShaderNodeMath')
        sm.operation = 'GREATER_THAN'
        sm.inputs[1].default_value = duty
        nt.links.new(t.outputs['Fac'], sm.inputs[0])
        nt.links.new(sm.outputs['Value'], ramp.inputs['Fac'])
    elif kind == 'noise':
        t = nt.nodes.new('ShaderNodeTexNoise')
        t.inputs['Scale'].default_value = scale
        t.inputs['Detail'].default_value = 4
        nt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        nt.links.new(t.outputs['Fac'], ramp.inputs['Fac'])
    elif kind == 'checker':
        t = nt.nodes.new('ShaderNodeTexChecker')
        t.inputs['Scale'].default_value = scale
        nt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        nt.links.new(t.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], n.inputs['Base Color'])
    return m


def _link(obj, bevel=0.0, m=None):
    bpy.context.scene.collection.objects.link(obj)
    if m:
        obj.data.materials.append(m)
    if bevel > 0:
        b = obj.modifiers.new('bev', 'BEVEL')
        b.width = bevel
        b.segments = 2
        b.limit_method = 'ANGLE'
    return obj


def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.012):
    """Axis-aligned box in world metres (x0<x1, y0<y1, z0<z1)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = (x0 + x1) / 2 + v.co.x * (x1 - x0)
        v.co.y = (y0 + y1) / 2 + v.co.y * (y1 - y0)
        v.co.z = (z0 + z1) / 2 + v.co.z * (z1 - z0)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return _link(bpy.data.objects.new(name, me), bevel, m)


def wbox(name, px, py, pw, ph, depth, m, y_front=0.0, bevel=0.01):
    """Box whose FRONT FACE appears exactly on the screen rect (px, py, pw, ph).
    y_front = how far the front face stands in front of the wall plane in metres (negative = recessed),
    depth = thickness behind the front face. The front face is lifted by y_front*tan(TILT) so that
    the camera tilt does not push it down the screen."""
    lift = y_front * math.tan(TILT)
    return box(name, wx(px), wx(px + pw), -y_front - depth, -y_front, wz(py + ph) + lift, wz(py) + lift, m, bevel)


def floor_box(name, px0, px1, d0, d1, h, m, bevel=0.012):
    """Floor-standing box: screen x extent px0..px1, from d0 to d1 metres out from the wall, h metres tall."""
    return box(name, wx(px0), wx(px1), -d1, -d0, 0.0, h, m, bevel)


def cyl(name, x, y, z, r, h, m, axis='Z', seg=24, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    o.location = (x, y, z)
    if axis == 'X':
        o.rotation_euler = (0, math.pi / 2, 0)
    if axis == 'Y':
        o.rotation_euler = (math.pi / 2, 0, 0)
    for p in me.polygons:
        p.use_smooth = True
    return _link(o, bevel, m)


def sphere(name, x, y, z, r, m, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=r)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    o.location = (x, y, z)
    o.scale = (sx, sy, sz)
    for p in me.polygons:
        p.use_smooth = True
    return _link(o, 0, m)


def setup_camera(scene, w=FRAME_W, h=FRAME_H):
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = 12.8          # 12.8 m across = 1280 px
    o = bpy.data.objects.new('cam', cam)
    scene.collection.objects.link(o)
    scene.camera = o
    f = Vector((0, CT, -ST))
    target = Vector((6.4, 0, ((FLOOR_PY - h / 2) / 100.0) / CT))
    o.location = target - f * 30
    o.rotation_euler = f.to_track_quat('-Z', 'Y').to_euler()
    cam.clip_start = 0.1
    cam.clip_end = 80
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = 100


def project(scene, point):
    """World point -> (px, py) in the 1280x720 frame (py down). Used by the numeric self-tests."""
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()   # without this the camera matrix is still the identity in background mode
    v = world_to_camera_view(scene, scene.camera, Vector(point))
    return v.x * scene.render.resolution_x, (1.0 - v.y) * scene.render.resolution_y


def setup_render(scene, out, samples=64, transparent=True):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.seed = 7
    scene.cycles.use_animated_seed = False
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.render.film_transparent = transparent
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = out


def light(kind, name, loc, energy, color='#ffffff', size=0.5, rot=None):
    d = bpy.data.lights.new(name, kind)
    d.energy = energy
    d.color = lin(hexc(color))
    if kind == 'AREA':
        d.size = size
    if kind == 'POINT':
        d.shadow_soft_size = size
    if kind == 'SUN':
        d.angle = math.radians(size)
    o = bpy.data.objects.new(name, d)
    o.location = loc
    if rot:
        o.rotation_euler = rot
    bpy.context.scene.collection.objects.link(o)
    return o


def world(scene, color='#1a2030', strength=0.6):
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*lin(hexc(color)), 1)
    bg.inputs['Strength'].default_value = strength
    scene.world = w
