# GE reference prototype: assemble the office plate. Run:
#   blender --background --python-exit-code 1 --python room_office.py -- /tmp/office_full.png [samples] [--front]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roomlib import *
from roomkit import *
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]
SAMPLES = int(args[1]) if len(args) > 1 and args[1].isdigit() else 48
LAYER = 'front' if '--front' in args else 'back'   # back = whole room without chairs; front = the two chairs only (drawn over the characters)
CHAIRS = LAYER == 'front'

# Screen-px layout of the office tableau (the game's OFFICE rects follow these).
WINDOW = (30, 150, 160, 170)
POSTER = (205, 156, 100, 150)
BOARD = (320, 170, 110, 130)
TV_HOUSING = (450, 170, 350, 262)
TV_SCREEN = (482, 196, 286, 210)
TV_CAB = (452, 432, 346, 60)
CABINET = (960, 250, 100, 235)
GARAGE = (1086, 182, 158, 306)
KETTLE_TABLE = (815, 945)
DESK = (40, 410)
LAMP_X = 388

sc = reset()
setup_camera(sc)
setup_render(sc, OUT, SAMPLES)
world(sc, '#3a4660', 0.55)
M = make_materials()
wall_with_openings(M, [WINDOW])
floor_and_skirting(M)
cornice(M, 96)
window(M, WINDOW)
framed_poster(M, POSTER, [(7, 10, 86, 24, 'red'), (9, 64, 82, 40, 'green')])
corkboard(M, BOARD, [(12, 20, 40, 30), (60, 36, 40, 30), (20, 76, 40, 30)])
crt_tv(M, TV_HOUSING, TV_SCREEN)
tv_cabinet(M, TV_CAB)
filing_cabinet(M, CABINET)
roller_door(M, GARAGE)
desk(M, *DESK)
bulb = desk_lamp(M, LAMP_X, 0.4)
side_table(M, *KETTLE_TABLE)
radiator(M, (60, 408, 110, 70))
rug(M, 430, 850, 0.7, 2.9)
tyre_stack(M, 1200, 1.0)
potted_plant(M, 1070, 0.5)
bunting(M, 140)
if True:     # chairs are always built; the layer pass decides which ones render
    swivel_chair(M, 555, 1.9, mat('chair1', '#5a2c4d', 0.7))
    swivel_chair(M, 715, 1.9, mat('chair2', '#2f4b6b', 0.7))

for ob in bpy.data.objects:
    is_chair = ob.name.startswith('c_')
    if (LAYER == 'front') != is_chair and ob.type == 'MESH':
        ob.hide_render = True        # back pass hides chairs, front pass hides everything else
    elif LAYER == 'front' and is_chair:
        ob.hide_render = False
d = Vector((0.5, -0.55, -0.62)); d.normalize()
light('SUN', 'sun', (0, 5, 8), 2.6, '#ffe2b8', 1.0, d.to_track_quat('-Z', 'Y').to_euler())
light('POINT', 'lamp', bulb, 360, '#ffab55', 0.12)
light('AREA', 'tv', (6.25, -0.9, 2.6), 260, '#78b4ff', 2.2, (math.radians(-90) + 0.3, 0, 0))
light('AREA', 'fill', (6.4, -8, 6), 500, '#ffe6c8', 12.0, (math.radians(55), 0, 0))

# numeric self-check: the front face of the TV screen must land on TV_SCREEN (+-2 px)
o = bpy.data.objects['tv_scr']
xs = []; ys = []
for v in o.data.vertices:
    px, py = project(sc, o.matrix_world @ v.co)
    xs.append(px); ys.append(py)
print('PROJ tv_scr x %.1f..%.1f y %.1f..%.1f (want %d..%d, %d..%d)' % (min(xs), max(xs), min(ys), max(ys), TV_SCREEN[0], TV_SCREEN[0] + TV_SCREEN[2], TV_SCREEN[1], TV_SCREEN[1] + TV_SCREEN[3]))
for nm in ('desk_top', 'desk_l', 'lamp_bulb', 'st_top', 'st_l', 'cab', 'c_back', 'c_seat', 'tv_body', 'tv_cab', 'gd', 'rug', 'board', 'poster'):
    ob = bpy.data.objects[nm]; pp = [project(sc, ob.matrix_world @ v.co) for v in ob.data.vertices]
    print('PROJ %s x %.0f..%.0f y %.0f..%.0f' % (nm, min(p[0] for p in pp), max(p[0] for p in pp), min(p[1] for p in pp), max(p[1] for p in pp)))
if '--noRender' not in args:
    bpy.ops.render.render(write_still=True)
    print('RENDERED', OUT)
