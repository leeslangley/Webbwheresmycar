# CB02: studio world and colour management for the CB render rig.
# Imports carlib; nothing runs on import.
import bpy

import carlib  # noqa: F401  (shared helpers; the rig builders use them)


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
