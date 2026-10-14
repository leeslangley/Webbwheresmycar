# GE reference prototype: extra props for the garage, auction hall and title rooms (becomes tools/art/roomkit2.py).
import math
from roomlib import *


def make_materials2():
    return dict(
        block=tex_mat('block', 'checker', '#6f7c76', '#78857f', scale=22, rough=0.9),
        conc=tex_mat('conc', 'noise', '#55575b', '#6a6c70', scale=6, rough=0.85),
        peg=mat('peg', '#c9b48a', 0.8), strip=mat('strip', '#eaf6ff', 1.0, emit='#dff1ff', estr=8.0),
        drum=mat('drum', '#2f5b9e', 0.4, 0.5), yellow=mat('yellow', '#e0b52a', 0.5), orange=mat('orange', '#d9622b', 0.5),
        velvet=mat('velvet', '#6a1f2b', 0.95), panel=tex_mat('panel', 'stripes', '#3d2414', '#4a2c1a', scale=12, rough=0.6, duty=0.9),
        brass=mat('brass', '#c9983c', 0.3, 1.0), stage=tex_mat('stagef', 'planks', '#2a1a12', '#4a2f1d', scale=2.5, rough=0.5),
        seat=mat('seat', '#3a2a55', 0.8), hall=tex_mat('hall', 'noise', '#2b2230', '#352a3a', scale=5, rough=0.9),
        brick=tex_mat('brick', 'checker', '#6b3a30', '#7a4438', scale=40, rough=0.9), road=mat('road', '#23232e', 0.25),
        pave=tex_mat('pave', 'checker', '#3a3a46', '#444452', scale=24, rough=0.7), lampglow=mat('lampglow', '#ffd28a', 1.0, emit='#ffc66e', estr=10.0),
        shopwin=mat('shopwin', '#ffb85c', 1.0, emit='#ffb050', estr=1.1), black=mat('black', '#15151c', 0.35),
        steel=mat('steel', '#8d9aa5', 0.35, 0.8), oakdark=mat('oakd', '#4d2e18', 0.5), cream=mat('cream', '#e3d9bd', 0.5),
        red=mat('red', '#a02a35', 0.6), green=mat('green', '#2f6b45', 0.4), tyre=mat('tyre', '#1b1b1f', 0.85),
    )


def pegboard(M, r, tools=8):
    x, y, w, h = r
    wbox('peg', x, y, w, h, 0.04, M['peg'], 0.0, 0.0)
    for i in range(tools):                      # hanging spanners / hammers: thin dark boxes
        tx = x + 20 + i * (w - 40) / tools
        wbox('tool', tx, y + 6, 8, h * 0.55 + (i % 3) * 6, 0.03, M['steel'], 0.04, 0.0)
        wbox('toolh', tx - 3, y + 6 + h * 0.55 + (i % 3) * 6, 14, 10, 0.04, M['orange'] if i % 2 else M['black'], 0.04, 0.0)


def strip_light(M, r):
    wbox('strip', r[0], r[1], r[2], r[3], 0.08, M['strip'], 0.1, 0.01)


def oil_drum(M, px, depth, h=0.9):
    cyl('drum', wx(px), -depth, h / 2, 0.3, h, M['drum'], 'Z', 28, 0.01)
    cyl('drumring', wx(px), -depth, h * 0.3, 0.31, 0.04, M['steel'])


def bay_marks(M, bays, d0=1.2, d1=3.2):
    """Yellow parking-bay lines on the floor. bays = list of (px0, px1)."""
    for a, b in bays:
        for px in (a, b):
            box('bayline', wx(px) - 0.04, wx(px) + 0.04, -d1, -d0, 0.0, 0.012, M['yellow'], 0)
        box('bayback', wx(a), wx(b), -d0 - 0.08, -d0, 0.0, 0.012, M['yellow'], 0)


def curtain(M, px0, px1, py0, py1, folds=10):
    """Velvet stage curtain: vertical half-cylinders side by side."""
    w = (px1 - px0) / folds
    for i in range(folds):
        x = wx(px0 + (i + 0.5) * w)
        cyl('fold', x, -0.2 - (0.04 if i % 2 else 0), (wz(py0) + wz(py1)) / 2, wx(w) * 0.62, wz(py0) - wz(py1), M['velvet'], 'Z', 12)


def podium(M, px, depth):
    x = wx(px)
    box('pod', x - 0.45, x + 0.45, -depth - 0.3, -depth + 0.3, 0.0, 1.05, M['oakdark'], 0.03)
    box('podtop', x - 0.55, x + 0.55, -depth - 0.4, -depth + 0.1, 1.05, 1.12, M['brass'], 0.015)
    box('gavelblock', x - 0.08, x + 0.08, -depth - 0.2, -depth - 0.05, 1.12, 1.17, M['oakdark'], 0.01)


def stage(M, px0, px1, d0, d1, h=0.35):
    box('stage', wx(px0), wx(px1), -d1, -d0, 0.0, h, M['stage'], 0.01)


def dining_chair(M, px, depth):
    x = wx(px)
    box('chs', x - 0.25, x + 0.25, -depth - 0.25, -depth + 0.25, 0.4, 0.46, M['seat'], 0.03)
    box('chb', x - 0.25, x + 0.25, -depth + 0.2, -depth + 0.26, 0.46, 1.0, M['seat'], 0.03)
    for dx in (-0.22, 0.22):
        for dy in (-0.22, 0.22):
            box('chl', x + dx - 0.02, x + dx + 0.02, -depth + dy - 0.02, -depth + dy + 0.02, 0.0, 0.4, M['black'], 0)


def shop_front(M, px0, px1, h_m, window_mat='shopwin', depth=0.0):
    """Terrace shop: brick block with a glowing shop window and a door, standing on the pavement."""
    box('shop', wx(px0), wx(px1), -depth - 0.5, -depth, 0.0, h_m, M['brick'], 0.02)
    w = wx(px1) - wx(px0)
    box('shopwin', wx(px0) + 0.2, wx(px0) + w * 0.6, -depth - 0.52, -depth - 0.5, 0.35, 1.6, M[window_mat], 0)
    box('shopdoor', wx(px0) + w * 0.7, wx(px0) + w * 0.9, -depth - 0.52, -depth - 0.5, 0.0, 1.9, M['oakdark'], 0)
    for f in (0.3, 0.6):
        box('mullion', wx(px0) + 0.2 + (w * 0.6 - 0.2) * f, wx(px0) + 0.26 + (w * 0.6 - 0.2) * f, -depth - 0.55, -depth - 0.5, 0.35, 1.6, M['black'], 0)
    box('shopsign', wx(px0) + 0.1, wx(px1) - 0.1, -depth - 0.56, -depth - 0.5, 2.1, 2.6, M['oakdark'], 0.01)


def lamppost(M, px, depth, h=3.6):
    x = wx(px)
    cyl('post', x, -depth, h / 2, 0.05, h, M['black'])
    sphere('lamp', x, -depth, h + 0.1, 0.18, M['lampglow'])
    return (x, -depth, h + 0.1)


def lot_board(M, r):
    """Dark wood lot board with a brass frame: the game paints the car on it."""
    x, y, w, h = r
    wbox('lotboard', x, y, w, h, 0.05, M['panel'], 0.0, 0.0)
    for a in ((x - 6, y - 6, w + 12, 6), (x - 6, y + h, w + 12, 6), (x - 6, y - 6, 6, h + 12), (x + w, y - 6, 6, h + 12)):
        wbox('lotframe', a[0], a[1], a[2], a[3], 0.07, M['brass'], 0.0)
