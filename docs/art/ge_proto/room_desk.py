# GE reference prototype: top-down desk-top plates (ledger / news). Camera tilt 62 deg; the desk surface is the "floor".
# blender --background --python room_desk.py -- /tmp/desk.png ledger|news [samples]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roomlib import *
from roomkit import *
args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]; VARIANT = args[1]; SAMPLES = int(args[2]) if len(args) > 2 and args[2].isdigit() else 48
set_view(62.0, 20.0)                      # wall edge above the frame; the whole frame is desk surface
sc = reset(); setup_camera(sc); setup_render(sc, OUT, SAMPLES, transparent=False)
world(sc, '#241c18', 0.4)
top = tex_mat('top', 'planks', '#4a2c18', '#6b4528', scale=2.2, rough=0.5) if VARIANT == 'news' else mat('lea', '#2b5a3c', 0.5)
box('desk', -1, 14, -12, 0.0, -0.3, 0.0, top, 0)
mug = mat('mug', '#e3d9bd', 0.4); tea = mat('tea', '#5a3318', 0.3); steel = mat('steel', '#8d9aa5', 0.3, 0.9); brass = mat('brass', '#c9983c', 0.3, 1.0)
paper = mat('paper', '#efe6c8', 0.9); ink = mat('ink', '#15151c', 0.4); red = mat('red', '#a02a35', 0.6)
def on_desk(px, py):                    # screen px of the desk surface -> world (x, y)
    return wx(px), fy(py)
x, y = on_desk(1100, 560); cyl('mug', x, y, 0.06, 0.16, 0.12, mug, 'Z', 24, 0.01); cyl('tea', x, y, 0.115, 0.14, 0.01, tea)
if VARIANT == 'ledger':
    x, y = on_desk(560, 420); box('book_l', x - 1.5, x, y - 0.9, y + 0.9, 0.0, 0.08, red, 0.01); box('book_r', x, x + 1.5, y - 0.9, y + 0.9, 0.0, 0.08, red, 0.01)
    box('pg_l', x - 1.45, x - 0.02, y - 0.85, y + 0.85, 0.08, 0.13, paper, 0.005); box('pg_r', x + 0.02, x + 1.45, y - 0.85, y + 0.85, 0.08, 0.13, paper, 0.005)
    x, y = on_desk(150, 200); cyl('lamp_b', x, y, 0.06, 0.3, 0.1, brass); cyl('lamp_a', x, y, 0.7, 0.03, 1.3, brass)
    sphere('lamp_s', x + 0.4, y, 1.45, 0.3, mat('green', '#2f6b45', 0.4), 1.2, 1, 0.6)
    light('POINT', 'lamp', (x + 0.4, y, 1.3), 500, '#ffab55', 0.2)
    x, y = on_desk(1150, 250); box('calc', x - 0.35, x + 0.35, y - 0.5, y + 0.5, 0.0, 0.1, mat('calc', '#c9b48a', 0.5), 0.02)
else:
    light('SUN', 'morning', (0, 5, 8), 3.0, '#cfe3ff', 1.0, Vector((0.4, -0.3, -0.9)).to_track_quat('-Z', 'Y').to_euler())
    x, y = on_desk(260, 500); cyl('glass1', x, y, 0.02, 0.24, 0.02, steel, 'Z', 24); cyl('glass2', x + 0.55, y, 0.02, 0.24, 0.02, steel, 'Z', 24)
light('AREA', 'fill', (6.4, -4, 7), 600, '#ffe6c8', 10.0, (math.radians(30), 0, 0))
bpy.ops.render.render(write_still=True); print('RENDERED', OUT)
