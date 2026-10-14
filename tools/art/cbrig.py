# CB02: studio world and colour management for the CB render rig.
# CB04: fixed-scale orthographic studio camera (same px per metre for every car).
# Imports carlib; nothing runs on import.
import math
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

import carlib  # noqa: F401  (shared helpers; the rig builders use them)
import cbmat  # noqa: F401  (MASK_RGB and class_of for render_mask)


def _lin(hexs):
    """sRGB hex string (#rrggbb) -> linear (r, g, b) tuple."""
    s = hexs.strip().lstrip('#')
    if len(s) != 6:
        raise ValueError('Bad colour %r, expected #rrggbb' % hexs)
    out = []
    for j in (0, 2, 4):
        c = int(s[j:j + 2], 16) / 255.0
        if c <= 0.04045:
            out.append(c / 12.92)
        else:
            out.append(((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


def setup_color_management(scene, exposure=-0.2):
    """Standard view transform, no look, fixed exposure, no dither, transparent film."""
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = exposure
    scene.render.dither_intensity = 0.0
    scene.render.film_transparent = True


# Studio sky ramp: (position, sRGB hex). Dark floor, warm horizon band, blue sky.
_SKY_STOPS = [
    (0.00, '#17121f'),
    (0.44, '#2a2432'),
    (0.50, '#e9dcc4'),
    (0.58, '#b4c8e6'),
    (0.80, '#5d80b8'),
    (1.00, '#2b4a86'),
]


def setup_studio_world(scene):
    """New world: object Z (normalised) -> Map Range -> colour ramp -> background."""
    world = bpy.data.worlds.new('studio_world')
    world.use_nodes = True
    nt = world.node_tree
    nodes = nt.nodes
    links = nt.links

    bg = nodes.get('Background')
    out = nodes.get('World Output')

    tex = nodes.new('ShaderNodeTexCoord')
    norm = nodes.new('ShaderNodeVectorMath')
    norm.operation = 'NORMALIZE'
    sep = nodes.new('ShaderNodeSeparateXYZ')
    mr = nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -1.0
    mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Min'].default_value = 0.0
    mr.inputs['To Max'].default_value = 1.0
    ramp = nodes.new('ShaderNodeValToRGB')

    # The default ramp has 2 elements: reuse them for the first and last stops.
    elements = ramp.color_ramp.elements
    first, last = _SKY_STOPS[0], _SKY_STOPS[-1]
    elements[0].position = first[0]
    elements[0].color = (*_lin(first[1]), 1.0)
    elements[1].position = last[0]
    elements[1].color = (*_lin(last[1]), 1.0)
    for pos, hexs in _SKY_STOPS[1:-1]:
        el = elements.new(pos)
        el.color = (*_lin(hexs), 1.0)

    bg.inputs['Strength'].default_value = 0.22

    links.new(tex.outputs['Object'], norm.inputs[0])
    links.new(norm.outputs[0], sep.inputs['Vector'])
    links.new(sep.outputs['Z'], mr.inputs['Value'])
    links.new(mr.outputs['Result'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bg.inputs['Color'])
    links.new(bg.outputs['Background'], out.inputs['Surface'])

    scene.world = world
    return world


# CB03: the studio light rig. Each entry: (name, hex colour, watts, size_x, size_y,
# location, aim target). All six are RECTANGLE area lights (see docs/art/CB.md).
STUDIO_LIGHTS = [
    ('top', '#fff6e6', 900, 9.0, 1.6, (0, -1.0, 7.5), (0, 0, 1.2)),
    ('key', '#ffe9cc', 1400, 4.5, 3.0, (-6.5, -8.5, 5.5), (0, 0, 1.5)),
    ('rim', '#a9c6ff', 800, 7.0, 1.2, (7.5, 6.5, 4.5), (0, 0, 1.5)),
    ('fill', '#dfe8ff', 220, 7.0, 1.5, (8.0, -7.5, 1.2), (0, 0, 1.5)),
    ('stripL', '#ffffff', 400, 1.2, 5.0, (-10, -3, 2.0), (0, 0, 1.0)),
    ('stripR', '#ffffff', 300, 1.2, 5.0, (10, -3, 2.0), (0, 0, 1.0)),
]


def setup_studio_lights(scene):
    """Add the STUDIO_LIGHTS area lights to the scene, each aimed at its target."""
    objs = []
    for name, hexs, watts, size_x, size_y, loc, target in STUDIO_LIGHTS:
        data = bpy.data.lights.new(name, 'AREA')
        data.shape = 'RECTANGLE'
        data.size = size_x
        data.size_y = size_y
        data.color = _lin(hexs)
        data.energy = watts
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        carlib.look_at(obj, target)
        scene.collection.objects.link(obj)
        objs.append(obj)
    return objs
# CB04: fixed-scale studio camera. One orthographic camera with a fixed px per
# metre, so a 3.5 m car is drawn smaller than a 5.5 m car, and the ground point
# (world origin) always lands on the same canvas pixel (the sprite anchor).
# (yaw degrees, pitch degrees). s = pure side, nose right: the DEFAULT hero view.
VIEWS = {
    's': (0.0, 6.0),
    'q': (25.0, 10.0),
    'front': (90.0, 4.0),
    'r': (-25.0, 10.0),
}
CANVAS_W, CANVAS_H = 1600, 800
PX_PER_M = 192            # 48 sprite px per metre x 4 supersampling
ORIGIN_PX = (800, 680)    # where world (0, 0, 0), the car's ground centre, lands
CAM_NAME = 'cbcam'
CAM_DIST = 20.0

# The world origin sits this many metres below the frame centre (in the view plane).
_GROUND_DROP = (ORIGIN_PX[1] - CANVAS_H / 2.0) / PX_PER_M


def setup_fixed_camera(scene, view):
    """Aim the fixed-scale ortho camera at view `view` (a key of VIEWS) and make it
    the scene camera. Reuses the 'cbcam' camera when it exists. Exits 2 on a bad view."""
    if view not in VIEWS:
        print('Unknown view %r, expected one of: %s' % (view, ', '.join(sorted(VIEWS))))
        sys.exit(2)
    yaw_deg, pitch_deg = VIEWS[view]
    ya = math.radians(yaw_deg)
    p = math.radians(pitch_deg)

    scene.render.resolution_x = CANVAS_W
    scene.render.resolution_y = CANVAS_H
    scene.render.resolution_percentage = 100

    cam = bpy.data.objects.get(CAM_NAME)
    if cam is None or cam.type != 'CAMERA':
        cam = bpy.data.objects.new(CAM_NAME, bpy.data.cameras.new(CAM_NAME))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = CANVAS_W / PX_PER_M

    target = (0.0, 0.0, _GROUND_DROP / math.cos(p))
    d = (math.sin(ya) * math.cos(p), -math.cos(ya) * math.cos(p), math.sin(p))
    cam.location = (target[0] + CAM_DIST * d[0],
                    target[1] + CAM_DIST * d[1],
                    target[2] + CAM_DIST * d[2])
    carlib.look_at(cam, target)

    if CAM_NAME not in scene.collection.objects:
        scene.collection.objects.link(cam)
    scene.camera = cam
    bpy.context.view_layer.update()
    return cam


def project(scene, point):
    """World point -> (px, py) canvas pixel from the top-left, using the scene camera."""
    co = world_to_camera_view(scene, scene.camera, Vector(point))
    return (co.x * CANVAS_W, (1.0 - co.y) * CANVAS_H)
def _flat_mat(name, rgb8):
    """Emission -> Material Output, strength 1.0. rgb8 is the 8-bit FILE colour."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for node in list(nt.nodes):
        nt.nodes.remove(node)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*cbmat.hex_lin('#%02x%02x%02x' % rgb8), 1.0)
    em.inputs['Strength'].default_value = 1.0
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return mat


def render_mask(scene, out_png):
    """Game-mask pass (CB05): every mesh material becomes a flat emission colour
    of its class (cbmat.MASK_RGB), so out_png holds exact class colours.
    Every setting and material changed here is restored before returning."""
    rs = scene.render
    cy = scene.cycles
    vs = scene.view_settings
    bg = None
    if scene.world is not None and scene.world.use_nodes:
        bgs = [n for n in scene.world.node_tree.nodes
               if n.bl_idname == 'ShaderNodeBackground']
        bg = bgs[0] if bgs else None

    saved = {
        'engine': rs.engine,
        'film_transparent': rs.film_transparent,
        'dither': rs.dither_intensity,
        'file_format': rs.image_settings.file_format,
        'color_mode': rs.image_settings.color_mode,
        'color_depth': rs.image_settings.color_depth,
        'samples': cy.samples,
        'use_denoising': cy.use_denoising,
        'filter_width': cy.filter_width,
        'view_transform': vs.view_transform,
        'look': vs.look,
        'exposure': vs.exposure,
        'bg_strength': bg.inputs['Strength'].default_value if bg else None,
    }

    swaps = []        # (object, slot index, original material)
    added = []        # objects that got a temporary slot
    flat = {}         # class -> temporary emission material
    catchers = []     # (object, previous visible_camera)
    seen_meshes = set()
    try:
        for ob in scene.objects:
            if ob.type != 'MESH':
                continue
            if ob.name == 'shadow_catcher':
                catchers.append((ob, ob.visible_camera))
                ob.visible_camera = False
                continue
            if ob.name.startswith('cut_') or ob.data.name in seen_meshes:
                continue
            seen_meshes.add(ob.data.name)
            if len(ob.data.materials) == 0:
                ob.data.materials.append(None)
                added.append(ob)
            for idx, slot in enumerate(ob.material_slots):
                orig = slot.material
                cls = cbmat.class_of(orig.name if orig is not None else '')
                if cls not in flat:
                    flat[cls] = _flat_mat('mask_' + cls, cbmat.MASK_RGB[cls])
                swaps.append((ob, idx, orig))
                slot.material = flat[cls]

        rs.engine = 'CYCLES'
        cy.samples = 1
        cy.use_denoising = False
        cy.filter_width = 0.01
        vs.view_transform = 'Standard'
        vs.look = 'None'
        vs.exposure = 0.0
        rs.dither_intensity = 0.0
        rs.film_transparent = True
        if bg is not None:
            bg.inputs['Strength'].default_value = 0.0
        rs.image_settings.file_format = 'PNG'
        rs.image_settings.color_mode = 'RGBA'
        rs.image_settings.color_depth = '8'

        bpy.ops.render.render(write_still=False)
        bpy.data.images['Render Result'].save_render(out_png, scene=scene)
    finally:
        for ob, idx, orig in reversed(swaps):
            ob.material_slots[idx].material = orig
        for ob in added:
            ob.data.materials.pop()
        for mat in flat.values():
            bpy.data.materials.remove(mat)
        for ob, vis in catchers:
            ob.visible_camera = vis
        rs.engine = saved['engine']
        rs.film_transparent = saved['film_transparent']
        rs.dither_intensity = saved['dither']
        rs.image_settings.file_format = saved['file_format']
        rs.image_settings.color_mode = saved['color_mode']
        rs.image_settings.color_depth = saved['color_depth']
        cy.samples = saved['samples']
        cy.use_denoising = saved['use_denoising']
        cy.filter_width = saved['filter_width']
        vs.view_transform = saved['view_transform']
        vs.look = saved['look']
        vs.exposure = saved['exposure']
        if bg is not None:
            bg.inputs['Strength'].default_value = saved['bg_strength']
    return out_png
