# GE reference prototype: prop functions of the Blender room kit (becomes tools/art/roomkit.py).
# Every function takes SCREEN-px rects (see roomlib.py) and a materials dict M from make_materials().
import math
from roomlib import *

WALL_D = 0.25   # wall slab thickness behind the wall plane (metres)


def make_materials():
    return dict(
        wall=tex_mat('wall', 'stripes', '#3f6a75', '#477883', scale=14.0, rough=0.95, duty=0.5),
        skirt=mat('skirt', '#3a2315', 0.5), oak=mat('oak', '#7a4a26', 0.45), oakdark=mat('oakd', '#4d2e18', 0.5),
        floor=tex_mat('floor', 'planks', '#8c5a2b', '#c08a4c', scale=3.0, rough=0.55),
        cream=mat('cream', '#e3d9bd', 0.5), black=mat('black', '#15151c', 0.35), steel=mat('steel', '#8d9aa5', 0.35, 0.8),
        grey=mat('grey', '#6f7d72', 0.45), brass=mat('brass', '#c9983c', 0.3, 1.0), red=mat('red', '#a02a35', 0.6),
        green=mat('green', '#2f6b45', 0.4), paper=mat('paper', '#efe6c8', 0.9), blind=mat('blind', '#d9d2b8', 0.45),
        cork=tex_mat('cork', 'noise', '#9b6b3a', '#c99a5e', scale=90, rough=0.95),
        rug=tex_mat('rug', 'checker', '#7a2232', '#8c2b3c', scale=30, rough=0.95), rugb=mat('rugb', '#e3d9bd', 0.9),
        door=mat('door', '#7f8f9b', 0.4, 0.6), hazard=mat('hazard', '#e0b52a', 0.5), tyre=mat('tyre', '#1b1b1f', 0.85),
        screen=mat('screen', '#06080c', 0.2), glow=mat('glow', '#ffc680', 1.0, emit='#ffc07a', estr=6.0),
        plant=mat('plant', '#2e7d3a', 0.7), pot=mat('pot', '#b5532f', 0.7), tin=mat('tin', '#c7372b', 0.4, 0.5),
    )


# ---------------------------------------------------------------- shell (card GE04)
def wall_with_openings(M, openings, top_py=-300, left_px=-100, right_px=1380):
    """Back wall as slabs around the openings (rects). Transparent holes show the sky layer in the game."""
    ys = sorted(set([top_py, FLOOR_PY] + [o[1] for o in openings] + [o[1] + o[3] for o in openings]))
    for y0, y1 in zip(ys[:-1], ys[1:]):
        cuts = sorted([(o[0], o[0] + o[2]) for o in openings if o[1] <= y0 and o[1] + o[3] >= y1])
        x = left_px
        for a, b in cuts + [(right_px, right_px)]:
            if a > x:
                box('wall', wx(x), wx(a), 0, WALL_D, wz(y1), wz(y0), M['wall'], 0)
            x = max(x, b)


def floor_and_skirting(M):
    box('floor', -1, 14, -9, 0.0, -0.3, 0, M['floor'], 0)
    box('skirt', -1, 14, -0.04, 0.0, 0, 0.18, M['skirt'], 0.01)
    box('dado', -1, 14, -0.02, 0.0, 0.18, 0.2, M['oakdark'], 0.0)


def cornice(M, py=96):
    """Picture rail / cornice strip along the whole top of the wall."""
    wbox('cornice', -100, py, 1480, 10, 0.1, M['oakdark'], 0.0, 0.01)


def window(M, r, blinds=True):
    """Window with frame, middle bar, sill; NO glass (the opening stays transparent). r=(x,y,w,h)."""
    x0, y0, ww, wh = r
    for n, a in (('t', (x0 - 8, y0 - 8, ww + 16, 8)), ('b', (x0 - 8, y0 + wh, ww + 16, 6)),
                 ('l', (x0 - 8, y0, 8, wh)), ('r', (x0 + ww, y0, 8, wh)), ('m', (x0 + ww // 2 - 3, y0, 6, wh))):
        wbox('wf_' + n, a[0], a[1], a[2], a[3], 0.1, M['cream'], 0.0)
    wbox('sill', x0 - 14, y0 + wh + 6, ww + 28, 7, 0.22, M['cream'], 0.0)
    if blinds:
        n = 11
        for i in range(n):
            wbox('slat%d' % i, x0 + 4, y0 + 6 + i * (wh * 0.62 / n), ww - 8, 7, 0.07, M['blind'], -0.08, 0.004)
        wbox('blind_rail', x0 + 2, y0 - 2, ww - 4, 6, 0.1, M['steel'], -0.08)


def framed_poster(M, r, bands=()):
    """Paper poster with an oak frame; bands = list of (dx, dy, w, h, material_name) blocks painted on it."""
    x, y, w, h = r
    wbox('poster', x, y, w, h, 0.03, M['paper'], 0.0, 0.0)
    for a in ((x - 6, y - 6, w + 12, 6), (x - 6, y + h, w + 12, 6), (x - 6, y - 6, 6, h + 12), (x + w, y - 6, 6, h + 12)):
        wbox('pf', a[0], a[1], a[2], a[3], 0.05, M['oakdark'], 0.0)
    for dx, dy, bw, bh, mn in bands:
        wbox('pband', x + dx, y + dy, bw, bh, 0.015, M[mn], 0.045, 0.0)


def corkboard(M, r, slips=()):
    x, y, w, h = r
    wbox('board', x, y, w, h, 0.04, M['cork'], 0.0, 0.0)
    for a in ((x - 6, y - 6, w + 12, 6), (x - 6, y + h, w + 12, 6), (x - 6, y - 6, 6, h + 12), (x + w, y - 6, 6, h + 12)):
        wbox('bf', a[0], a[1], a[2], a[3], 0.07, M['oakdark'], 0.0)
    for dx, dy, sw, sh in slips:
        wbox('slip', x + dx, y + dy, sw, sh, 0.02, M['paper'], 0.05, 0.0)


def bunting(M, y_px, x0=20, step=62, n=20, sag=12, names=('red', 'cream', 'green')):
    for i in range(n):
        wbox('flag', x0 + i * step, y_px + sag * math.sin(i / n * math.pi), 18, 20, 0.02, M[names[i % len(names)]], 0.0, 0.0)


def radiator(M, r):
    wbox('rad', r[0], r[1], r[2], r[3], 0.12, M['cream'], 0.0, 0.02)


# ---------------------------------------------------------------- furniture A (card GE05)
def desk(M, px0, px1, depth=0.9, h=1.0):
    floor_box('desk_l', px0 + 10, px0 + 30, 0.1, depth, h, M['oakdark'])
    floor_box('desk_r', px1 - 30, px1 - 10, 0.1, depth, h, M['oakdark'])
    floor_box('desk_drw', px1 - 110, px1 - 10, 0.1, depth, h, M['oakdark'])
    box('desk_top', wx(px0), wx(px1), -depth - 0.1, -0.05, h, h + 0.08, M['oak'], 0.02)
    box('desk_back', wx(px0 + 10), wx(px1 - 10), -0.12, -0.1, 0.1, h, M['oakdark'], 0)
    for i in range(2):
        box('dd', wx(px1 - 105), wx(px1 - 15), -depth - 0.02, -depth, 0.12 + i * 0.4, 0.46 + i * 0.4, M['oak'], 0.01)
        box('dh', wx(px1 - 75), wx(px1 - 45), -depth - 0.05, -depth - 0.02, 0.28 + i * 0.4, 0.31 + i * 0.4, M['brass'], 0.005)


def desk_lamp(M, px, depth, h_desk=1.08, shade='green'):
    x = wx(px)
    cyl('lamp_b', x, -depth, h_desk + 0.02, 0.12, 0.05, M['brass'])
    cyl('lamp_a', x, -depth, h_desk + 0.32, 0.015, 0.6, M['brass'])
    sphere('lamp_s', x, -depth, h_desk + 0.7, 0.2, M[shade], 1, 1, 0.55)
    sphere('lamp_bulb', x, -depth, h_desk + 0.62, 0.07, M['glow'])
    return (x, -depth, h_desk + 0.62)   # bulb position, for the point light


def side_table(M, px0, px1, d0=0.15, d1=0.65, h=0.85):
    floor_box('st_l', px0, px0 + 12, d0 + 0.05, d1 - 0.05, h, M['oakdark'])
    floor_box('st_r', px1 - 12, px1, d0 + 0.05, d1 - 0.05, h, M['oakdark'])
    box('st_top', wx(px0 - 5), wx(px1 + 5), -d1, -d0, h, h + 0.07, M['oak'], 0.015)


def filing_cabinet(M, r, drawers=3):
    x, y, w, h = r
    wbox('cab', x, y, w, h, 0.6, M['grey'], 0.1, 0.02)
    dh = (h - 36) / drawers
    for i in range(drawers):
        wbox('drw', x + 6, y + 32 + i * dh, w - 12, dh - 6, 0.03, M['grey'], 0.7, 0.01)
        wbox('hdl', x + w / 2 - 18, y + 32 + i * dh + dh / 2 - 6, 36, 6, 0.05, M['steel'], 0.73, 0.005)
    wbox('lbl', x + 16, y + 8, w - 32, 16, 0.02, M['cream'], 0.7, 0.0)


def swivel_chair(M, px, depth, seat_mat):
    x = wx(px)
    cyl('c_stem', x, -depth, 0.3, 0.04, 0.5, M['steel'])
    cyl('c_base', x, -depth, 0.06, 0.34, 0.05, M['black'])
    box('c_seat', x - 0.32, x + 0.32, -depth - 0.32, -depth + 0.32, 0.5, 0.62, seat_mat, 0.06)
    box('c_back', x - 0.34, x + 0.34, -depth + 0.28, -depth + 0.38, 0.62, 1.35, seat_mat, 0.07)


# ---------------------------------------------------------------- furniture B (card GE06)
def crt_tv(M, housing, screen):
    """Big cream CRT set: housing rect, recessed screen rect (stays near black: the game draws live content there)."""
    x, y, w, h = housing
    sx, sy, sw, sh = screen
    wbox('tv_body', x, y, w, h, 0.5, M['cream'], 0.12, 0.03)
    wbox('tv_bez', x + 12, y + 12, w - 24, h - 24, 0.12, M['black'], 0.12 + 0.5 - 0.02, 0.02)
    wbox('tv_scr', sx, sy, sw, sh, 0.02, M['screen'], 0.12 + 0.5 + 0.08, 0.0)


def tv_cabinet(M, r, vhs=True):
    x, y, w, h = r
    wbox('tv_cab', x, y, w, h, 0.55, M['oak'], 0.18, 0.02)
    if vhs:
        wbox('vhs', x + 18, y + 10, 200, 28, 0.5, M['black'], 0.2 + 0.55 - 0.02, 0.01)
        wbox('vhs2', x + 26, y + 20, 120, 5, 0.52, M['steel'], 0.2 + 0.55 - 0.02, 0.0)


def rug(M, px0, px1, d0, d1):
    box('rug', wx(px0), wx(px1), -d1, -d0, 0.0, 0.02, M['rug'], 0.005)
    for a in ((px0 - 10, px1 + 10, d1, d1 + 0.1), (px0 - 10, px1 + 10, d0 - 0.1, d0)):
        box('rugb', wx(a[0]), wx(a[1]), -a[3], -a[2], 0.0, 0.022, M['rugb'], 0)
    for a in ((px0 - 10, px0), (px1, px1 + 10)):
        box('rugb', wx(a[0]), wx(a[1]), -d1 - 0.1, -d0 + 0.1, 0.0, 0.022, M['rugb'], 0)


def tyre_stack(M, px, depth, n=3):
    for i in range(n):
        cyl('tyre%d' % i, wx(px), -depth, 0.13 + i * 0.26, 0.38, 0.24, M['tyre'], 'Z', 28, 0.04)


def potted_plant(M, px, depth):
    x = wx(px)
    cyl('pot', x, -depth, 0.25, 0.22, 0.5, M['pot'])
    for i in range(7):
        a = i / 7 * 6.28
        sphere('leaf', x + math.cos(a) * 0.28, -depth + math.sin(a) * 0.12, 0.85 + (i % 3) * 0.22, 0.2, M['plant'], 0.5, 0.25, 1.4)


def roller_door(M, r, ribs=8):
    x, y, w, h = r
    wbox('gd_frame', x - 10, y - 10, w + 20, h + 10, 0.1, M['hazard'], 0.0, 0.01)
    wbox('gd', x, y, w, h, 0.06, M['door'], 0.1, 0.01)
    for i in range(ribs):
        wbox('rib', x, y + 38 + i * (h - 50) / ribs, w, 4, 0.08, M['steel'], 0.1, 0.004)
    wbox('gd_win', x + 10, y + 8, w - 20, 22, 0.075, M['glow'], 0.1, 0.0)
    wbox('gd_sign', x + 14, y - 40, w - 28, 26, 0.08, M['oakdark'], 0.0)
