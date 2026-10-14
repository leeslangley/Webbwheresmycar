"""ui_bake.py: bakes the painted-cartoon UI chrome PNGs into godot/art/ui/ (numpy only, deterministic).

Usage: python3 tools/art/ui_bake.py [name ...]   (no names = everything)
Every texture is drawn from distance fields at 4x and box-filtered down, so edges are smooth.
The Godot widgets draw these textures (often as 3-slice / 9-slice) and put the live text on top.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from uipaint import Canvas, blur, grad, hexc, mix, sd_circle, sd_ellipse, sd_poly, sd_rrect, sd_segment, shade, smin, value_noise  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "godot", "art", "ui")

INK = hexc("#1A1030")
WHITE = hexc("#FFFFFF")
LIGHT = np.array([-0.55, -0.83])  # light comes from the top-left
LIGHT = LIGHT / np.linalg.norm(LIGHT)

BAKES = {}


def bake(fn):
    BAKES[fn.__name__] = fn
    return fn


def out(name):
    return os.path.join(OUT, name)


def up(c, n):
    """Noise array at output res -> canvas res (nearest repeat)."""
    return np.repeat(np.repeat(n, c.ss, axis=0), c.ss, axis=1)


def vgrad(c, y0, y1, stops):
    return grad((c.Y - y0) / max(y1 - y0, 1e-6), stops)


def bevel_light(sd, c, width):
    """-1..1 lighting of a bevel band of the given width inside a shape: + faces the light."""
    gy, gx = np.gradient(sd, 1.0 / c.ss)
    n = np.sqrt(gx * gx + gy * gy) + 1e-6
    return -(gx * LIGHT[0] + gy * LIGHT[1]) / n


def gloss(c, sd_inner, top, bottom, a0=0.55, a1=0.0):
    """Soft white sheen over the upper part of a shape."""
    t = np.clip((c.Y - top) / max(bottom - top, 1e-6), 0, 1)
    a = (a0 + (a1 - a0) * t) * (c.Y < bottom)
    c.paint(c.cov(sd_inner) * a, WHITE)


def outlined(c, sd, fill, ow=4.0, ink=INK):
    """Ink outline (ow px, centred outside the edge) then the fill."""
    c.paint(c.cov(sd - ow), ink)
    c.paint(c.cov(sd), fill)


# ============================================================== HUD strip panel

@bake
def hud_panel():
    W, H, PAD = 1280, 130, 16
    c = Canvas(W, H + PAD, ss=2)
    X, Y = c.X, c.Y - PAD
    # soft shadow the strip casts up onto the room
    t = np.clip(-Y / PAD, 0, 1)
    c.paint((1 - t) ** 2 * 0.55 * (Y < 0), hexc("#000000"))
    # walnut body with grain
    nz = value_noise((H + PAD, W), 90, 11, 4)
    fib = value_noise((H + PAD, W // 16), 2, 12, 2)
    fib = np.repeat(fib, 16, axis=1)[:, :W]
    nz, fib = up(c, nz), up(c, fib)
    rings = 0.5 + 0.5 * np.sin(Y * 0.55 + nz * 16.0 + np.sin(c.X * 0.004) * 3.0)
    g = np.clip(0.55 * rings + 0.45 * fib, 0, 1)
    dark, mid, light = hexc("#3A1F0D"), hexc("#6A3B1A"), hexc("#94592B")
    wood = grad(g, [(0.0, dark), (0.55, mid), (1.0, light)])
    vert = np.clip(Y / H, 0, 1)[..., None]
    wood[..., :3] *= (1.12 - 0.42 * vert)  # warm light from above, darker at the bottom
    c.paint(np.ones_like(Y) * (Y >= 0), wood)
    # varnish sheen band
    c.paint(np.clip(1 - np.abs(Y - 26) / 22, 0, 1) * 0.10 * (Y >= 0), hexc("#FFE2B0"))
    # brass trim along the top edge
    trim = (Y >= 0) & (Y < 7)
    tg = grad(np.clip(Y / 7, 0, 1), [(0, hexc("#FFF1BE")), (0.35, hexc("#E2B552")), (0.75, hexc("#A87622")), (1, hexc("#6B4510"))])
    c.paint(trim.astype(np.float32), tg)
    c.paint(((Y >= 7) & (Y < 9)).astype(np.float32), INK)
    c.paint(((Y >= 9) & (Y < 13)).astype(np.float32) * 0.35, hexc("#000000"))
    c.paint(((Y >= -1.5) & (Y < 0)).astype(np.float32), INK)
    # bottom lip
    c.paint(np.clip((Y - (H - 6)) / 6, 0, 1) * 0.6, hexc("#120804"))
    # brass screws along the trim
    for sx in [12, 316, 632, 778, 1114, 1268]:
        screw(c, sx, PAD + 3.5, 3.2)
    # REP / BUZZ gauge well
    well(c, 1114, PAD + 12, 1268, PAD + 122, 10)
    # little screws on the well
    for sx, sy in [(1121, PAD + 19), (1261, PAD + 19), (1121, PAD + 115), (1261, PAD + 115)]:
        screw(c, sx, sy, 2.6)
    c.save(out("hud_panel.png"))


def screw(c, x, y, r):
    sd = sd_circle(c.X, c.Y, x, y, r)
    c.paint(c.cov(sd - 1.0), INK)
    t = np.clip(((c.X - x) * -0.6 + (c.Y - y) * -0.8) / (2 * r) + 0.5, 0, 1)
    c.paint(c.cov(sd), grad(1 - t, [(0, hexc("#FFF0B8")), (0.5, hexc("#C9962E")), (1, hexc("#5E3D0C"))]))
    c.paint(c.cov(sd_segment(c.X, c.Y, x - r * 0.7, y + r * 0.7, x + r * 0.7, y - r * 0.7, 0.45)), hexc("#3A2506"))


def well(c, x0, y0, x1, y1, r):
    """A recessed dark well with a brass bezel."""
    sd = sd_rrect(c.X, c.Y, x0, y0, x1, y1, r)
    c.shadow(sd - 1, 3, 0.45)
    c.paint(c.cov(sd - 1.5), INK)
    b = bevel_light(sd, c, 4)
    bez = grad(0.5 + 0.5 * b, [(0, hexc("#6B4510")), (0.5, hexc("#C9962E")), (1, hexc("#FFF0B8"))])
    c.paint(c.cov(sd) * (sd > -4.5), bez)
    inner = sd + 4.5
    c.paint(c.cov(inner + 1.2), INK)
    c.paint(c.cov(inner), vgrad(c, y0, y1, [(0, hexc("#0D0A18")), (1, hexc("#221C38"))]))
    # inner shadow at the top
    ish = np.clip(1 - (c.Y - (y0 + 4)) / 10, 0, 1) * 0.6
    c.paint(c.cov(inner) * ish, hexc("#000000"))


# ============================================================== gold number plate discs

def icon_sd(c, key, cx, cy, k=1.3):
    """Icon distance field, drawn k times larger than its design size (about 24 px)."""
    X = cx + (c.X - cx) / k
    Y = cy + (c.Y - cy) / k
    return _icon(X, Y, key, cx, cy) * k


def _icon(X, Y, key, cx, cy):
    if key == "fatcat":
        head = sd_ellipse(X, Y, cx, cy + 2, 9.5, 8.0)
        e1 = sd_poly(X, Y, [(cx - 9.5, cy - 1), (cx - 8.0, cy - 11), (cx - 2.5, cy - 5)])
        e2 = sd_poly(X, Y, [(cx + 9.5, cy - 1), (cx + 8.0, cy - 11), (cx + 2.5, cy - 5)])
        s = np.minimum(head, np.minimum(e1, e2))
        # eyes and nose cut out as grooves
        eyes = np.minimum(sd_ellipse(X, Y, cx - 3.6, cy + 0.5, 1.6, 2.1), sd_ellipse(X, Y, cx + 3.6, cy + 0.5, 1.6, 2.1))
        nose = sd_poly(X, Y, [(cx - 1.6, cy + 4), (cx + 1.6, cy + 4), (cx, cy + 5.8)])
        return np.maximum(s, -np.minimum(eyes, nose))
    if key == "stable":
        ring = np.abs(np.hypot(X - cx, Y - cy + 1) - 8.0) - 2.6
        gap = sd_poly(X, Y, [(cx - 5, cy + 12), (cx + 5, cy + 12), (cx + 2.6, cy + 2), (cx - 2.6, cy + 2)])
        s = np.maximum(ring, -gap)
        tips = np.minimum(sd_circle(X, Y, cx - 5.6, cy + 6.6, 2.4), sd_circle(X, Y, cx + 5.6, cy + 6.6, 2.4))
        s = np.minimum(s, tips)
        holes = np.full_like(X, 1e9)
        for a in [-2.4, -1.6, -0.8, 0.0, 0.8, 1.6, 2.4]:
            ang = -np.pi / 2 + a * 0.55
            holes = np.minimum(holes, sd_circle(X, Y, cx + np.cos(ang) * 8.0, cy - 1 + np.sin(ang) * 8.0, 0.9))
        return np.maximum(s, -holes)
    if key == "household":
        body = sd_rrect(X, Y, cx - 8, cy - 2, cx + 8, cy + 10, 1.0)
        roof = sd_poly(X, Y, [(cx - 11.5, cy - 1), (cx, cy - 11.5), (cx + 11.5, cy - 1)])
        chim = sd_rrect(X, Y, cx + 4.5, cy - 11, cx + 7.5, cy - 4, 0.5)
        s = np.minimum(np.minimum(body, roof), chim)
        door = sd_rrect(X, Y, cx - 2.2, cy + 3, cx + 2.2, cy + 10.5, 1.0)
        win = sd_rrect(X, Y, cx - 6.5, cy + 1, cx - 3.5, cy + 4, 0.4)
        return np.maximum(s, -np.minimum(door, win))
    if key == "hammer":
        # auction gavel: barrel head with end bands, diagonal handle, sound block
        ang = 0.62
        ca, sa = np.cos(ang), np.sin(ang)
        hx, hy = cx - 2.5, cy - 4.0
        lx = (X - hx) * ca + (Y - hy) * sa
        ly = -(X - hx) * sa + (Y - hy) * ca
        head = sd_rrect(lx, ly, -3.6, -8.0, 3.6, 8.0, 1.6)
        bands = np.minimum(np.abs(ly + 5.2) - 0.55, np.abs(ly - 5.2) - 0.55)
        head = np.maximum(head, -np.maximum(bands, -(np.abs(lx) - 2.4)))
        handle = sd_rrect(lx, ly, 2.5, -1.3, 14.0, 1.3, 1.2)
        block = sd_rrect(X, Y, cx - 9.5, cy + 7.5, cx + 3.5, cy + 11.0, 1.2)
        return np.minimum(np.minimum(head, handle), block)
    raise ValueError(key)


def plate_disc(key, won):
    c = Canvas(64, 64, ss=4)
    X, Y = c.X, c.Y
    cx, cy = 32.0, 32.0
    # socket in the wood
    sock = sd_circle(X, Y, cx, cy + 1, 30.5)
    c.paint(c.cov(sock), hexc("#120A04", 0.85))
    c.paint(c.cov(sd_circle(X, Y, cx + 1.5, cy + 3, 29)) * 0.5, hexc("#000000"))
    disc = sd_circle(X, Y, cx, cy, 27.0)
    if won:
        hi, mid, lo, deep = hexc("#FFF6C8"), hexc("#F6C93A"), hexc("#C08A14"), hexc("#7A4E06")
    else:
        hi, mid, lo, deep = hexc("#C9C3B6"), hexc("#8E877A"), hexc("#625C52"), hexc("#3A3630")
    c.paint(c.cov(disc - 2.5), INK)
    # radial body lit from the top-left
    d = np.hypot(X - (cx - 9), Y - (cy - 10)) / 44.0
    body = grad(d, [(0, hi), (0.35, mid), (0.8, lo), (1, deep)])
    c.paint(c.cov(disc), body)
    # bevelled rim
    rim = (disc > -4.0)
    b = bevel_light(disc, c, 4)
    rimc = grad(0.5 + 0.5 * b, [(0, deep), (0.5, mid), (1, hi)])
    c.paint(c.cov(disc) * rim * c.cov(-disc - 4.0, soft=0.6), rimc)
    c.paint(c.cov(np.abs(disc + 4.2) - 0.45) * 0.55, shade(deep, 0.8))
    # record grooves on the field
    r = np.hypot(X - cx, Y - cy)
    grooves = 0.5 + 0.5 * np.sin(r * 2.6)
    field = c.cov(disc + 4.6)
    c.paint(field * grooves * 0.10, shade(deep, 0.6))
    # embossed icon
    ic = icon_sd(c, key, cx, cy + 0.5)
    c.paint(c.cov(ic - 0.6) * 0.75, shade(hi, 1.05) if won else hexc("#D8D2C6"))
    c.paint(c.cov(np.maximum(ic, -(ic + 0.0))) * 0, WHITE)
    # emboss: highlight offset towards the light, shadow away from it
    ic_sh = icon_sd(c, key, cx + 1.0, cy + 1.7)
    c.paint(c.cov(ic_sh) * (1 - c.cov(ic)) * 0.65, deep)
    c.paint(c.cov(ic), grad(np.clip((Y - (cy - 12)) / 24, 0, 1), [(0, shade(hi, 1.0)), (1, mid if won else lo)]))
    edge_hi = c.cov(ic) * (1 - c.cov(icon_sd(c, key, cx + 0.6, cy + 1.2)))
    c.paint(edge_hi * 0.8, hexc("#FFFFFF") if won else hexc("#E8E4DA"))
    # specular sheen and glint
    sheen = sd_ellipse(X, Y, cx - 8, cy - 12, 13, 7)
    c.paint(c.cov(sheen, soft=6.0) * c.cov(disc) * (0.55 if won else 0.25), WHITE)
    if won:
        for (gx, gy, s) in [(cx - 13, cy - 15, 1.0)]:
            star = np.minimum(np.abs(X - gx) * 6 + np.abs(Y - gy), np.abs(X - gx) + np.abs(Y - gy) * 6) - 5.0 * s
            c.paint(c.cov(star / 4.0), WHITE)
    c.save(out(("plate_%s_%s.png") % (key, "gold" if won else "dull")))


@bake
def plates():
    for k in ["fatcat", "stable", "household", "hammer"]:
        plate_disc(k, True)
        plate_disc(k, False)


# ============================================================== CASH bar

@bake
def cash():
    W, H = 280, 44
    # frame: brass rim, dark glass tube
    c = Canvas(W, H, ss=4)
    outer = sd_rrect(c.X, c.Y, 1, 1, W - 1, H - 1, 13)
    c.paint(c.cov(outer), INK)
    rim = outer + 2.5
    b = bevel_light(rim, c, 3)
    c.paint(c.cov(rim), grad(0.5 + 0.5 * b, [(0, hexc("#5E3D0C")), (0.5, hexc("#C9962E")), (1, hexc("#FFF0B8"))]))
    tube = sd_rrect(c.X, c.Y, 6, 6, W - 6, H - 6, 9)
    c.paint(c.cov(tube + 1.2), INK)
    c.paint(c.cov(tube), vgrad(c, 6, H - 6, [(0, hexc("#020A05")), (0.6, hexc("#06200F")), (1, hexc("#0B331A"))]))
    # faint unlit LED cells
    cells = (np.mod(c.X, 6.0) < 1.0) * 0.18
    c.paint(c.cov(tube) * cells, hexc("#000000"))
    c.save(out("cash_frame.png"))
    # fill: glowing green liquid crystal
    f = Canvas(W, H, ss=4)
    f.paint(f.cov(tube), vgrad(f, 6, H - 6, [(0, hexc("#B9FFB0")), (0.18, hexc("#4FF06A")), (0.55, hexc("#1FBF45")), (1, hexc("#0C7A2C"))]))
    f.paint(f.cov(tube) * (np.mod(f.X, 6.0) < 1.0) * 0.22, hexc("#05310F"))
    # bright leading glow line at the top
    f.paint(f.cov(tube) * np.clip(1 - np.abs(f.Y - 10) / 2.0, 0, 1) * 0.6, WHITE)
    f.save(out("cash_fill.png"))
    # glass overlay: readout plate for the digits and a highlight streak
    g = Canvas(W, H, ss=4)
    plate = sd_rrect(g.X, g.Y, 128, 9, W - 9, H - 9, 6)
    g.shadow(plate - 0.5, 1.5, 0.5)
    g.paint(g.cov(plate), hexc("#03140A", 0.82))
    g.paint(g.cov(np.abs(plate) - 0.6) * 0.8, hexc("#2D7A45"))
    streak = sd_rrect(g.X, g.Y, 12, 8.5, W - 12, 14.5, 3)
    g.paint(g.cov(streak, soft=2.0) * 0.30 * g.cov(tube), WHITE)
    g.paint(g.cov(tube) * np.clip((g.Y - (H - 12)) / 6, 0, 1) * 0.25, hexc("#000000"))
    g.save(out("cash_glass.png"))


# ============================================================== calendar sheet

@bake
def calendar():
    W, H, P = 130, 114, 8
    c = Canvas(W + 2 * P, H + 2 * P, ss=4)
    X, Y = c.X - P, c.Y - P
    sheet = sd_rrect(X, Y, 3, 10, W - 3, H - 3, 6)
    # page stack and drop shadow
    c.shadow(sd_rrect(X, Y, 5, 14, W - 1, H + 2, 6), 3, 0.5)
    for k, sh in [(2, 0.80), (1, 0.88)]:
        s2 = sd_rrect(X, Y, 3 + k, 10 + k * 2.5, W - 3 + k * 0.5, H - 3 + k * 2.5, 6)
        c.paint(c.cov(s2 - 2), INK)
        c.paint(c.cov(s2), shade(hexc("#F3E6C4"), sh))
    c.paint(c.cov(sheet - 2.5), INK)
    paper = vgrad(c, 10, H, [(0, hexc("#FFFBEE")), (1, hexc("#F1E2BE"))])
    fib = up(c, value_noise((H + 2 * P, W + 2 * P), 6, 21, 3))
    paper[..., :3] *= (0.96 + 0.06 * fib)[..., None]
    c.paint(c.cov(sheet), paper)
    # red band
    band = sd_rrect(X, Y, 6, 15, W - 6, 41, 4)
    c.paint(c.cov(band - 1.5), hexc("#5E0E12"))
    c.paint(c.cov(band), vgrad(c, 15 + P, 41 + P, [(0, hexc("#F0585A")), (0.45, hexc("#D2262E")), (1, hexc("#9C1720"))]))
    c.paint(c.cov(sd_rrect(X, Y, 9, 17, W - 9, 24, 3), soft=1.5) * 0.35, WHITE)
    # binding strip and rings
    strip = sd_rrect(X, Y, 1, 2, W - 1, 13, 4)
    c.paint(c.cov(strip - 2), INK)
    c.paint(c.cov(strip), vgrad(c, 2 + P, 13 + P, [(0, hexc("#5A5872")), (0.5, hexc("#34314A")), (1, hexc("#1E1B2E"))]))
    for rx in np.linspace(16, W - 16, 6):
        hole = sd_circle(X, Y, rx, 8, 2.6)
        c.paint(c.cov(hole), hexc("#07050D"))
        ring = sd_rrect(X, Y, rx - 2.2, -2, rx + 2.2, 11, 2.2)
        ring = np.maximum(ring, -sd_rrect(X, Y, rx - 0.7, 0.5, rx + 0.7, 8.5, 0.7))
        c.paint(c.cov(ring - 1.2), INK)
        c.paint(c.cov(ring), grad(np.clip((X - rx + 2.2) / 4.4, 0, 1), [(0, hexc("#FFFFFF")), (0.4, hexc("#C7CCD8")), (1, hexc("#6B7084"))]))
    # perforation under the strip
    for px in np.arange(8, W - 6, 5.0):
        c.paint(c.cov(sd_circle(X, Y, px, 13.5, 0.9)) * 0.5, hexc("#6B5A3A"))
    # dog-ear curl at the bottom right
    k = 16
    fold = sd_poly(X, Y, [(W - 3 - k, H - 3), (W - 3, H - 3 - k), (W - 3 - k * 0.15, H - 3 - k * 0.15)])
    c.paint(c.cov(sd_poly(X, Y, [(W - 3 - k, H - 3), (W - 3, H - 3 - k), (W + 4, H + 4)])), hexc("#000000", 0.0))
    cut = sd_poly(X, Y, [(W - 3 - k, H - 2), (W + 2, H - 3 - k - 1), (W + 6, H + 6)])
    c.px *= (1 - c.cov(cut)[..., None] * (1 - c.cov(sheet + 100)[..., None]))
    c.shadow(fold + 1, 1.5, 0.45)
    c.paint(c.cov(fold - 2), INK)
    c.paint(c.cov(fold), grad(np.clip(((X - (W - 3 - k)) + (Y - (H - 3 - k))) / (1.6 * k), 0, 1), [(0, hexc("#C9B88E")), (1, hexc("#FFF8E4"))]))
    c.save(out("calendar.png"))


# ============================================================== SALES chart card

@bake
def chart():
    W, H, P = 320, 114, 8
    c = Canvas(W + 2 * P, H + 2 * P, ss=4)
    X, Y = c.X - P, c.Y - P
    card = sd_rrect(X, Y, 2, 2, W - 2, H - 2, 10)
    c.shadow(sd_rrect(X, Y, 4, 6, W, H + 2, 10), 3, 0.5)
    c.paint(c.cov(card - 3), INK)
    paper = vgrad(c, P, H + P, [(0, hexc("#FFFFFF")), (1, hexc("#ECE8DC"))])
    fib = up(c, value_noise((H + 2 * P, W + 2 * P), 5, 31, 3))
    paper[..., :3] *= (0.975 + 0.04 * fib)[..., None]
    c.paint(c.cov(card), paper)
    # header ribbon
    head = np.maximum(card, Y - 30)
    c.paint(c.cov(head), vgrad(c, P, 30 + P, [(0, hexc("#3E66C8")), (1, hexc("#24418F"))]))
    c.paint(c.cov(np.maximum(card + 3, np.abs(Y - 9) - 4), soft=2.0) * 0.25, WHITE)
    c.paint(c.cov(np.maximum(card, np.abs(Y - 30.5) - 1.2)), INK)
    # top-left sheen on the card
    c.paint(c.cov(card) * np.clip(1 - (X + Y) / 260, 0, 1) * 0.10, WHITE)
    c.save(out("chart_card.png"))


# ============================================================== car portrait frame, backdrop, plaque

@bake
def portrait():
    # 9-slice gold frame, 96x96, margins 18
    S = 96
    c = Canvas(S, S, ss=4)
    outer = sd_rrect(c.X, c.Y, 1, 1, S - 1, S - 1, 12)
    c.paint(c.cov(outer), INK)
    fr = outer + 2.5
    b = bevel_light(fr, c, 4)
    gold = grad(0.5 + 0.5 * b, [(0, hexc("#6E4608")), (0.45, hexc("#D8A537")), (0.75, hexc("#F7D57A")), (1, hexc("#FFF8D8"))])
    c.paint(c.cov(fr), gold)
    # inner groove
    c.paint(c.cov(np.abs(fr + 5.0) - 0.8) * 0.6, hexc("#7A4E06"))
    c.paint(c.cov(np.abs(fr + 6.2) - 0.5) * 0.6, hexc("#FFF0C0"))
    hole = sd_rrect(c.X, c.Y, 11, 11, S - 11, S - 11, 6)
    c.paint(c.cov(hole + 1.5), INK)
    c.px *= (1 - c.cov(hole))[..., None]
    # inner shadow cast by the frame onto the picture
    ish = blur(1 - c.cov(hole + 0), 3 * c.ss) * c.cov(hole)
    c.paint(ish * 0.85, hexc("#000000"))
    c.save(out("frame9.png"))

    # showroom backdrop, stretched to the picture
    W, H = 300, 114
    c = Canvas(W, H, ss=2)
    X, Y = c.X, c.Y
    wall = vgrad(c, 0, H * 0.68, [(0, hexc("#0F1A3A")), (0.7, hexc("#21407A")), (1, hexc("#2F5A94"))])
    c.paint(np.ones_like(X), wall)
    # spotlight pool on the wall
    spot = np.clip(1 - np.hypot((X - W / 2) / 120, (Y - 40) / 60), 0, 1) ** 1.6
    c.paint(spot * 0.45, hexc("#9FD0FF"))
    # light shafts
    for sx in [W * 0.3, W * 0.7]:
        shaft = np.clip(1 - np.abs(X - sx - (Y - 0) * (W / 2 - sx) / 140) / (10 + Y * 0.25), 0, 1) * np.clip(1 - Y / (H * 0.7), 0, 1)
        c.paint(shaft * 0.12, WHITE)
    # floor with reflection
    fl = Y > H * 0.68
    c.paint(fl.astype(np.float32), vgrad(c, H * 0.68, H, [(0, hexc("#3A3550")), (1, hexc("#15122A"))]))
    c.paint(fl * np.clip(1 - np.hypot((X - W / 2) / 130, (Y - H * 0.8) / 14), 0, 1) * 0.35, hexc("#BFD8FF"))
    c.paint(np.clip(1 - np.abs(Y - H * 0.68) / 1.2, 0, 1) * 0.7, hexc("#8FB4E8"))
    c.save(out("portrait_bg.png"))

    # brass name plaque, 3-slice 64x26, caps 12
    W, H = 64, 26
    c = Canvas(W, H, ss=4)
    pl = sd_rrect(c.X, c.Y, 1, 1, W - 1, H - 1, 6)
    c.paint(c.cov(pl), INK)
    p2 = pl + 2
    c.paint(c.cov(p2), vgrad(c, 3, H - 3, [(0, hexc("#FFF2BE")), (0.45, hexc("#E7BD58")), (1, hexc("#A87622"))]))
    c.paint(c.cov(np.maximum(p2 + 1, c.Y - 9), soft=1.5) * 0.4, WHITE)
    for sx in [7.5, W - 7.5]:
        screw(c, sx, H / 2, 2.2)
    c.save(out("plaque.png"))


# ============================================================== speech banner + tail

BANNER_W, BANNER_H, BANNER_P = 1232, 112, 16
B_TOP, B_MID, B_BOT = hexc("#FFF3DF"), hexc("#FFD9A8"), hexc("#F2B07A")


@bake
def banner():
    W, H, P = BANNER_W, BANNER_H, BANNER_P
    c = Canvas(W + 2 * P, H + 2 * P, ss=2)
    X, Y = c.X - P, c.Y - P
    body = sd_rrect(X, Y, 4, 4, W - 4, H - 4, 26)
    c.shadow(sd_rrect(X, Y, 6, 10, W - 2, H + 4, 26), 5, 0.5)
    c.paint(c.cov(body - 4.0), INK)
    c.paint(c.cov(body), grad(np.clip(Y / H, 0, 1), [(0, B_TOP), (0.45, B_MID), (1, B_BOT)]))
    # soft halftone dots in the lower half: a nod to the 1989 dither
    gx = np.mod(X, 7.0) - 3.5
    gy = np.mod(Y + np.floor(X / 7.0) % 2 * 3.5, 7.0) - 3.5
    dr = np.clip((Y - H * 0.45) / (H * 0.5), 0, 1) * 1.6
    dots = c.cov(np.hypot(gx, gy) - dr) * (Y < H - 8)
    c.paint(dots * c.cov(body + 3) * 0.22, hexc("#D98A52"))
    # glossy sheen across the top
    sheen = np.maximum(sd_rrect(X, Y, 14, 6, W - 14, H * 0.42, 18), -(Y - 6))
    t = np.clip((Y - 6) / (H * 0.42 - 6), 0, 1)
    c.paint(c.cov(sheen, soft=1.0) * (0.55 - 0.5 * t), WHITE)
    # inner rim light and bottom inner shade
    c.paint(c.cov(np.abs(body + 2.0) - 0.8) * np.clip(1 - Y / 40, 0, 1) * 0.8, WHITE)
    c.save(out("banner.png"))


def bez(p0, p1, p2, n=12):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2 = np.array(p0), np.array(p1), np.array(p2)
    return list(map(tuple, (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2))


@bake
def banner_tail():
    # Its junction row (y = J) sits on the banner body's bottom edge; the patch above J hides the outline there.
    W, H, J = 64, 46, 10
    c = Canvas(W, H, ss=4)
    X, Y = c.X, c.Y
    tip = (18.0, H - 5.0)
    right = bez((46.0, J), (34.0, J + 8.0), tip)
    left = bez(tip, (18.0, J + 14.0), (12.0, J))
    pts = [(12.0, -4.0), (46.0, -4.0)] + right + left[1:]
    sd = sd_poly(X, Y, pts)
    c.shadow(sd_poly(X - 3, Y - 5, pts) * 1.0 + (Y < J + 4) * 50, 2.5, 0.35)
    c.paint(c.cov(sd - 4.0) * (Y > J - 4.0), INK)
    c.paint(c.cov(sd), B_BOT)
    c.save(out("banner_tail.png"))


# ============================================================== buttons (9-slice), shadow, glow

BUTTONS = {
    "normal": (hexc("#FFF9EA"), hexc("#F6DEAE"), hexc("#C99A5C")),
    "primary": (hexc("#9BF07E"), hexc("#34B54E"), hexc("#1A6A2E")),
    "remote": (hexc("#6E6A88"), hexc("#34304C"), hexc("#16132A")),
    "card": (hexc("#FFFFFF"), hexc("#F1E8D2"), hexc("#C4B48C")),
    "disabled": (hexc("#D8D4CC"), hexc("#AFA99F"), hexc("#7E786F")),
    "danger": (hexc("#FF9A84"), hexc("#E0443A"), hexc("#8E1E1E")),
}


def button_face(c, x0, y0, x1, y1, top, mid, lip, down):
    lip_h = 3.0 if down else 7.0
    shift = 4.0 if down else 0.0
    outer = sd_rrect(c.X, c.Y, x0, y0 + shift, x1, y1, 16)
    c.paint(c.cov(outer), INK)
    inner = outer + 3.5
    # lip (the side of the chunky key)
    c.paint(c.cov(inner), shade(lip, 1.0))
    face = sd_rrect(c.X, c.Y, x0 + 3.5, y0 + 3.5 + shift, x1 - 3.5, y1 - 3.5 - lip_h, 13)
    c.paint(c.cov(face), vgrad(c, y0 + shift, y1 - lip_h, [(0, top), (0.55, mid), (1, shade(mid, 0.9))]))
    # gloss
    gl = sd_rrect(c.X, c.Y, x0 + 9, y0 + 6 + shift, x1 - 9, (y0 + y1 - lip_h) * 0.5 + shift * 0.5, 9)
    t = np.clip((c.Y - (y0 + 6 + shift)) / ((y1 - y0 - lip_h) * 0.45), 0, 1)
    c.paint(c.cov(gl, soft=1.0) * (0.55 - 0.45 * t) * (0.4 if down else 1.0), WHITE)
    # lip highlight line
    c.paint(c.cov(np.maximum(np.abs(c.Y - (y1 - 3.5 - lip_h + 0.5)) - 0.6, inner)) * 0.35, hexc("#000000"))


@bake
def buttons():
    for kind, (top, mid, lip) in BUTTONS.items():
        for down in (False, True):
            c = Canvas(96, 64, ss=4)
            button_face(c, 0.5, 0.5, 95.5, 63.5, top, mid, lip, down)
            c.save(out("btn_%s%s.png" % (kind, "_down" if down else "")))
    # soft shadow (9-slice, 64x64, margins 24)
    c = Canvas(64, 64, ss=2)
    c.shadow(sd_rrect(c.X, c.Y, 14, 14, 50, 50, 10), 5, 0.6)
    c.save(out("shadow9.png"))
    # hot glow ring (9-slice 96x96, margins 32)
    c = Canvas(96, 96, ss=2)
    r = sd_rrect(c.X, c.Y, 16, 16, 80, 80, 18)
    glow = blur(c.cov(np.abs(r) - 3), 6 * c.ss)
    c.paint(np.clip(glow * 2.2, 0, 1), hexc("#FFD24A"))
    c.paint(c.cov(np.abs(r) - 2.0), hexc("#FFE89A"))
    c.save(out("glow9.png"))


# ============================================================== menu, toast, tooltip panels

@bake
def panels():
    # paper card (9-slice 96x96, margins 24)
    c = Canvas(96, 96, ss=4)
    card = sd_rrect(c.X, c.Y, 0.5, 0.5, 95.5, 95.5, 18)
    c.paint(c.cov(card), INK)
    inner = card + 4
    c.paint(c.cov(inner), vgrad(c, 0, 96, [(0, hexc("#FFFDF4")), (1, hexc("#F5E6C4"))]))
    c.paint(c.cov(np.abs(inner + 2.5) - 0.8) * np.clip(1 - c.Y / 30, 0, 1) * 0.9, WHITE)
    c.save(out("panel_paper9.png"))
    # night panel (settings): deep navy glass with a brass edge
    c = Canvas(96, 96, ss=4)
    card = sd_rrect(c.X, c.Y, 0.5, 0.5, 95.5, 95.5, 22)
    c.paint(c.cov(card), INK)
    b = bevel_light(card + 3, c, 3)
    c.paint(c.cov(card + 3), grad(0.5 + 0.5 * b, [(0, hexc("#6B4510")), (0.5, hexc("#D1A040")), (1, hexc("#FFF0B8"))]))
    inner = card + 9
    c.paint(c.cov(inner + 1.5), INK)
    c.paint(c.cov(inner), vgrad(c, 0, 96, [(0, hexc("#2C2660")), (1, hexc("#151231"))]))
    c.save(out("panel_night9.png"))
    # selected menu row (9-slice 64x64, margins 20)
    c = Canvas(64, 64, ss=4)
    row = sd_rrect(c.X, c.Y, 1, 3, 63, 61, 14)
    c.paint(c.cov(row - 2), hexc("#C77A12"))
    c.paint(c.cov(row), vgrad(c, 3, 61, [(0, hexc("#FFF0B0")), (0.5, hexc("#FFD25A")), (1, hexc("#F2A93B"))]))
    c.paint(c.cov(np.maximum(sd_rrect(c.X, c.Y, 6, 6, 58, 30, 9), 0), soft=1.0) * 0.45, WHITE)
    c.save(out("row_hot9.png"))
    # cursor arrow
    c = Canvas(32, 32, ss=4)
    tri = smin(sd_poly(c.X, c.Y, [(5, 5), (28, 16), (5, 27)]), sd_poly(c.X, c.Y, [(5, 5), (28, 16), (5, 27)]), 0.1) - 1.5
    c.shadow(tri - 1, 1.5, 0.4)
    c.paint(c.cov(tri - 2.5), INK)
    c.paint(c.cov(tri), vgrad(c, 5, 27, [(0, hexc("#FF8A6A")), (0.5, hexc("#E8352C")), (1, hexc("#9C1720"))]))
    c.paint(c.cov(sd_poly(c.X, c.Y, [(8, 9), (20, 15), (8, 15)])) * 0.5, WHITE)
    c.save(out("cursor.png"))
    # toast card (9-slice 96x64, margins 24): white card with a gold left stripe
    c = Canvas(96, 64, ss=4)
    card = sd_rrect(c.X, c.Y, 0.5, 0.5, 95.5, 63.5, 16)
    c.paint(c.cov(card), INK)
    inner = card + 3.5
    c.paint(c.cov(inner), vgrad(c, 0, 64, [(0, hexc("#FFFFFF")), (1, hexc("#F3E9D2"))]))
    stripe = np.maximum(inner, c.X - 14)
    c.paint(c.cov(stripe), vgrad(c, 0, 64, [(0, hexc("#FFE38A")), (1, hexc("#E09A1A"))]))
    c.paint(c.cov(np.maximum(inner, np.abs(c.X - 14.5) - 1.2)), INK)
    c.paint(c.cov(np.maximum(sd_rrect(c.X, c.Y, 18, 5, 90, 22, 8), 0), soft=1.0) * 0.5, WHITE)
    c.save(out("toast9.png"))
    # tooltip (9-slice 64x48, margins 16)
    c = Canvas(64, 48, ss=4)
    card = sd_rrect(c.X, c.Y, 0.5, 0.5, 63.5, 47.5, 12)
    c.paint(c.cov(card), hexc("#FFD27A"))
    c.paint(c.cov(card + 2.5), INK)
    c.paint(c.cov(card + 4), vgrad(c, 0, 48, [(0, hexc("#3A3470")), (1, hexc("#1B1735"))]))
    c.paint(c.cov(np.maximum(sd_rrect(c.X, c.Y, 7, 6, 57, 20, 6), 0), soft=1.0) * 0.18, WHITE)
    c.save(out("tip9.png"))


# ============================================================== title: night sky, town, car

TW, TH = 1280, 720
XPAD = 200  # extra painted picture each side for wide phones; the images are drawn at x = -XPAD


def wide_canvas(ss):
    c = Canvas(TW + 2 * XPAD, TH, ss=ss)
    c.X -= XPAD  # helpers then work in stage coordinates
    return c


@bake
def title_sky():
    c = wide_canvas(1)
    X, Y = c.X, c.Y
    sky = grad(Y / 600.0, [(0, hexc("#070720")), (0.35, hexc("#15124A")), (0.62, hexc("#33206A")), (0.8, hexc("#7A2F74")), (0.92, hexc("#D9576A")), (1.0, hexc("#FF9A5C"))])
    c.paint(np.ones_like(X), sky)
    # moon halo and moon
    mx, my, mr = 1050.0, 120.0, 44.0
    d = np.hypot(X - mx, Y - my)
    c.paint(np.clip(1 - d / 330, 0, 1) ** 2.2 * 0.45, hexc("#9FB4FF"))
    c.paint(np.clip(1 - d / 110, 0, 1) ** 1.5 * 0.5, hexc("#FFF4D8"))
    moon = wide_canvas(4)
    md = sd_circle(moon.X, moon.Y, mx, my, mr)
    mt = np.clip(((moon.X - mx) * 0.6 + (moon.Y - my) * 0.8) / (2 * mr) + 0.5, 0, 1)
    moon.paint(moon.cov(md), grad(mt, [(0, hexc("#FFFDF0")), (0.6, hexc("#FFF0C8")), (1, hexc("#E8C88A"))]))
    for (cx, cy, r) in [(mx - 14, my - 10, 9), (mx + 16, my + 8, 12), (mx - 4, my + 22, 6), (mx + 20, my - 20, 5)]:
        moon.paint(moon.cov(sd_circle(moon.X, moon.Y, cx, cy, r)) * moon.cov(md) * 0.18, hexc("#B89A60"))
    mp = moon.px.reshape(TH, 4, TW + 2 * XPAD, 4, 4).mean(axis=(1, 3))
    c.px = mp + c.px * (1 - mp[..., 3:4])
    # wispy clouds lit by the moon
    n = value_noise((TH, TW + 2 * XPAD), 160, 5, 5)
    band = np.clip(1 - np.abs(Y - 230) / 70, 0, 1) + np.clip(1 - np.abs(Y - 390) / 50, 0, 1) * 0.8
    cl = np.clip((n - 0.52) * 4.0, 0, 1) * band
    c.paint(cl * 0.55, hexc("#3B2E78"))
    rim = np.clip((n - 0.62) * 5.0, 0, 1) * band * np.clip(1 - np.abs(X - mx) / 700, 0, 1)
    c.paint(rim * 0.35, hexc("#C9B8FF"))
    # far skyline silhouette with a few lit dots
    rng = np.random.default_rng(3)
    far = np.full_like(X, 1e9)
    x = -XPAD - 10.0
    while x < TW + XPAD:
        w = rng.uniform(30, 90)
        h = rng.uniform(40, 140)
        far = np.minimum(far, sd_rrect(X, Y, x, 600 - h, x + w, 760, 1))
        x += w - 4
    far = np.minimum(far, sd_poly(X, Y, [(286, 600), (300, 380), (314, 600)]))
    far = np.minimum(far, sd_rrect(X, Y, 270, 450, 330, 760, 2))
    gas = np.abs(sd_rrect(X, Y, 690, 470, 820, 760, 6)) - 3
    far = np.minimum(far, gas)
    c.paint(c.cov(far), grad(np.clip((Y - 440) / 280, 0, 1), [(0, hexc("#3A2462")), (0.5, hexc("#4A2862")), (1, hexc("#1A1030"))]))
    dots = (rng.random((TH // 6 + 1, (TW + 2 * XPAD) // 5 + 1)) > 0.88).astype(np.float32)
    dm = np.repeat(np.repeat(dots, 6, 0), 5, 1)[:TH, :TW + 2 * XPAD]
    win = ((np.mod(X, 5) < 2) & (np.mod(Y, 6) < 3)).astype(np.float32) * dm * c.cov(far + 3) * np.clip((640 - Y) / 80, 0, 1)
    c.paint(win * 0.8, hexc("#FFC46A"))
    c.save(out("title_sky.png"))


def lit_window(c, L, x0, y0, x1, y1, lit, warm=True, rng=None):
    sd = sd_rrect(c.X, c.Y, x0, y0, x1, y1, 1.5)
    c.paint(c.cov(sd - 2.0), INK)
    if lit:
        col = grad(np.clip((c.Y - y0) / max(y1 - y0, 1), 0, 1), [(0, hexc("#FFF2B0")), (1, hexc("#FFB347"))]) if warm else grad(np.clip((c.Y - y0) / max(y1 - y0, 1), 0, 1), [(0, hexc("#CFF4FF")), (1, hexc("#5AA8E8"))])
        c.paint(c.cov(sd), col)
        # curtains
        cw = (x1 - x0) * 0.22
        cur = np.minimum(sd_rrect(c.X, c.Y, x0, y0, x0 + cw, y1, 1), sd_rrect(c.X, c.Y, x1 - cw, y0, x1, y1, 1))
        c.paint(c.cov(np.maximum(cur, sd)) * 0.55, hexc("#B5432E") if warm else hexc("#2A4C8A"))
        L.append((sd, hexc("#FFB04A") if warm else hexc("#6FC0FF")))
    else:
        c.paint(c.cov(sd), grad(np.clip((c.Y - y0) / max(y1 - y0, 1), 0, 1), [(0, hexc("#3C3A78")), (1, hexc("#17143A"))]))
        c.paint(c.cov(np.maximum(sd, (c.X - x0) - (c.Y - y0) * 0.6 - (x1 - x0) * 0.35)) * 0.25, hexc("#9DB0FF"))
    # sill
    c.paint(c.cov(sd_rrect(c.X, c.Y, x0 - 3, y1, x1 + 3, y1 + 4, 1) - 1.5), INK)
    c.paint(c.cov(sd_rrect(c.X, c.Y, x0 - 3, y1, x1 + 3, y1 + 4, 1)), hexc("#8C86B8"))


def building(c, sd, base, top_y, bot_y, rim=0.0):
    c.paint(c.cov(sd - 3.0), INK)
    col = grad(np.clip((c.Y - top_y) / max(bot_y - top_y, 1), 0, 1), [(0, shade(base, 1.25)), (1, shade(base, 0.7))])
    c.paint(c.cov(sd), col)
    if rim > 0:
        # moonlight catching the right-hand edges
        gy, gx = np.gradient(sd, 1.0 / c.ss)
        edge = c.cov(sd) * (sd > -5) * np.clip(gx, 0, 1)
        c.paint(edge * rim, hexc("#B9C2FF"))


def bricks(c, sd, x0, y0, col, a=0.18):
    row = np.floor((c.Y - y0) / 7.0)
    bx = np.mod(c.X - x0 + row * 9.0, 18.0)
    by = np.mod(c.Y - y0, 7.0)
    m = ((bx < 1.2) | (by < 1.2)).astype(np.float32)
    c.paint(m * c.cov(sd + 2) * a, col)


@bake
def title_town():
    c = wide_canvas(2)
    X, Y = c.X, c.Y
    L = []
    rng = np.random.default_rng(9)
    G = 604.0  # pavement line
    # --- warehouse, left
    wh = sd_rrect(X, Y, -XPAD - 20, 330, 160, 720, 2)
    building(c, wh, hexc("#4A2B4E"), 330, G, 0.5)
    bricks(c, wh, 0, 330, hexc("#1E1028"))
    tank = np.minimum(sd_rrect(X, Y, 40, 262, 110, 312, 6), np.minimum(sd_rrect(X, Y, 48, 312, 54, 332, 1), sd_rrect(X, Y, 96, 312, 102, 332, 1)))
    building(c, tank, hexc("#3A3060"), 262, 332, 0.6)
    c.paint(c.cov(np.abs(c.Y - 280) - 1.2) * c.cov(tank), INK)
    for wy in [350, 420, 490]:
        for wx in [-190, -138, -86, -34, 10, 62, 114]:
            lit_window(c, L, wx, wy, wx + 36, wy + 48, rng.random() > 0.55, True)
    # --- terraced houses
    for i, x0 in enumerate([160, 262]):
        house = np.minimum(sd_rrect(X, Y, x0, 450, x0 + 104, 720, 1), sd_poly(X, Y, [(x0 - 6, 452), (x0 + 30, 400), (x0 + 74, 400), (x0 + 110, 452)]))
        building(c, house, hexc("#6A3A52") if i == 0 else hexc("#5A3A62"), 400, G, 0.6)
        bricks(c, sd_rrect(X, Y, x0, 452, x0 + 104, G, 1), x0, 452, hexc("#2A1630"))
        roof = sd_poly(X, Y, [(x0 - 6, 452), (x0 + 30, 400), (x0 + 74, 400), (x0 + 110, 452)])
        c.paint(c.cov(roof), grad(np.clip((Y - 400) / 52, 0, 1), [(0, hexc("#4A4878")), (1, hexc("#26244A"))]))
        c.paint(c.cov(np.maximum(roof, np.abs(np.mod(Y - 400, 8.0) - 4) - 3.4)) * 0.5, hexc("#15122E"))
        ch = sd_rrect(X, Y, x0 + 70, 372, x0 + 88, 412, 1)
        building(c, ch, hexc("#7A3E3A"), 372, 412, 0.6)
        for px_ in [x0 + 73, x0 + 80]:
            pot = sd_rrect(X, Y, px_, 362, px_ + 5, 374, 1)
            building(c, pot, hexc("#B0603A"), 362, 374)
        lit_window(c, L, x0 + 14, 468, x0 + 44, 508, rng.random() > 0.3)
        lit_window(c, L, x0 + 60, 468, x0 + 90, 508, rng.random() > 0.5)
        door = sd_rrect(X, Y, x0 + 62, 540, x0 + 88, G, 2)
        building(c, door, hexc("#1F6B4A") if i == 0 else hexc("#A3243A"), 540, G)
        c.paint(c.cov(sd_circle(X, Y, x0 + 82, 574, 1.8)), hexc("#FFD27A"))
        lit_window(c, L, x0 + 12, 532, x0 + 50, 584, True)
    # --- shop parade (centre, calm behind the buttons)
    par = sd_rrect(X, Y, 366, 486, 900, 720, 1)
    building(c, par, hexc("#3E3266"), 486, G, 0.4)
    c.paint(c.cov(np.maximum(par, np.abs(Y - 492) - 4)), hexc("#2A2050"))
    for k, x0 in enumerate(np.arange(380, 890, 85)):
        awn = sd_poly(X, Y, [(x0, 536), (x0 + 74, 536), (x0 + 80, 552), (x0 - 6, 552)])
        stripes = np.mod(np.floor((X - x0) / 10.0), 2)
        acol = [hexc("#C2384A"), hexc("#2E6FB8"), hexc("#3E9A5A"), hexc("#D98A2A"), hexc("#7A3E9A"), hexc("#C2384A"), hexc("#2E6FB8")][k % 7]
        c.paint(c.cov(awn - 2.5), INK)
        c.paint(c.cov(awn), mix(acol, shade(acol, 0.55), stripes[..., None] * 0.0 + 0.0) * 0 + acol)
        c.paint(c.cov(awn) * stripes * 0.75, hexc("#F4E9C8"))
        lit = k % 3 != 1
        lit_window(c, L, x0 + 4, 556, x0 + 70, 598, lit, k % 2 == 0)
        lit_window(c, L, x0 + 10, 504, x0 + 30, 524, rng.random() > 0.6)
        lit_window(c, L, x0 + 44, 504, x0 + 64, 524, rng.random() > 0.6)
    # --- the garage (Webb's Wheels) with a lit roller door
    gar = np.minimum(sd_rrect(X, Y, 900, 470, 1060, 720, 2), sd_poly(X, Y, [(894, 474), (980, 440), (1066, 474)]))
    building(c, gar, hexc("#2F4A6E"), 440, G, 0.6)
    c.paint(c.cov(np.maximum(gar, -(Y - 474))) * 0.0, INK)
    door = sd_rrect(X, Y, 918, 512, 1042, G, 3)
    c.paint(c.cov(door - 3), INK)
    c.paint(c.cov(door), grad(np.clip((Y - 512) / 92, 0, 1), [(0, hexc("#FFE6A0")), (1, hexc("#FF9E3A"))]))
    slats = (np.mod(Y - 512, 9.0) < 1.6) * c.cov(np.maximum(door, -(Y - 540)))
    c.paint(slats * 0.5, hexc("#B86A1A"))
    c.paint(c.cov(np.maximum(door, -(Y - 540)) - 0) * 0.0, INK)
    rd = sd_rrect(X, Y, 918, 512, 1042, 540, 3)
    c.paint(c.cov(rd), grad(np.clip((Y - 512) / 28, 0, 1), [(0, hexc("#C9B48A")), (1, hexc("#8C7650"))]))
    c.paint(c.cov(np.maximum(rd, np.abs(np.mod(Y - 512, 6.0) - 3) - 2.2)) * 0.6, hexc("#5A4A30"))
    L.append((door, hexc("#FFB04A")))
    # a little car silhouette inside the garage
    inside = np.minimum(sd_rrect(X, Y, 944, 572, 1018, 596, 8), sd_rrect(X, Y, 958, 556, 1000, 578, 8))
    c.paint(c.cov(inside) * c.cov(door), hexc("#5A2A1A", 0.75))
    c.paint(c.cov(np.minimum(sd_circle(X, Y, 958, 596, 7), sd_circle(X, Y, 1004, 596, 7))) * c.cov(door), hexc("#2A1408", 0.85))
    # sign board above the door (the neon lettering is drawn live in Godot)
    sb = sd_rrect(X, Y, 916, 478, 1044, 506, 4)
    c.paint(c.cov(sb - 3), INK)
    c.paint(c.cov(sb), grad(np.clip((Y - 478) / 28, 0, 1), [(0, hexc("#24204A")), (1, hexc("#120F2A"))]))
    # --- tower block
    tb = sd_rrect(X, Y, 1060, 250, 1160, 720, 2)
    building(c, tb, hexc("#3A3A6A"), 250, G, 0.8)
    c.paint(c.cov(np.maximum(tb, np.abs(np.mod(Y - 250, 34.0) - 31) - 1.4)) * 0.6, hexc("#1A1838"))
    for row in range(10):
        for col_ in range(4):
            wx = 1068 + col_ * 23
            wy = 260 + row * 34
            if wy + 18 < G - 40:
                lit_window(c, L, wx, wy, wx + 15, wy + 18, rng.random() > 0.45, rng.random() > 0.3)
    # --- pub, right
    # terrace beyond the pub (wide phones only) and a red phone box
    for x0 in [1300, 1392]:
        house = np.minimum(sd_rrect(X, Y, x0, 450, x0 + 92, 720, 1), sd_poly(X, Y, [(x0 - 6, 452), (x0 + 26, 404), (x0 + 66, 404), (x0 + 98, 452)]))
        building(c, house, hexc("#4E3A62"), 404, G, 0.5)
        bricks(c, sd_rrect(X, Y, x0, 452, x0 + 92, G, 1), x0, 452, hexc("#241430"))
        lit_window(c, L, x0 + 14, 470, x0 + 40, 506, rng.random() > 0.4)
        lit_window(c, L, x0 + 52, 470, x0 + 78, 506, rng.random() > 0.6)
        lit_window(c, L, x0 + 12, 532, x0 + 48, 584, rng.random() > 0.3)
    box = sd_rrect(X, Y, 1330, 520, 1362, 604, 4)
    building(c, box, hexc("#C8202A"), 520, 604, 0.6)
    lit_window(c, L, 1336, 534, 1356, 584, True)
    pub = np.minimum(sd_rrect(X, Y, 1160, 440, 1300, 720, 2), sd_poly(X, Y, [(1154, 444), (1230, 396), (1306, 444)]))
    building(c, pub, hexc("#5A3A34"), 396, G, 0.5)
    roof = sd_poly(X, Y, [(1154, 444), (1230, 396), (1306, 444)])
    c.paint(c.cov(roof), grad(np.clip((Y - 396) / 48, 0, 1), [(0, hexc("#4A4878")), (1, hexc("#26244A"))]))
    c.paint(c.cov(np.maximum(sd_rrect(X, Y, 1160, 520, 1300, 720, 1), -sd_rrect(X, Y, 1160, 520, 1300, 720, 1) - 400)), hexc("#1E4A34"))
    building(c, sd_rrect(X, Y, 1160, 520, 1300, 720, 1), hexc("#235A3E"), 520, G)
    lit_window(c, L, 1176, 540, 1236, 590, True)
    lit_window(c, L, 1190, 458, 1222, 494, True)
    # hanging pub sign
    c.paint(c.cov(sd_rrect(X, Y, 1238, 462, 1290, 466, 1) - 1.5), INK)
    ps = sd_rrect(X, Y, 1248, 468, 1284, 506, 3)
    building(c, ps, hexc("#7A2A2A"), 468, 506)
    c.paint(c.cov(sd_circle(X, Y, 1266, 487, 9)), hexc("#E8B923"))
    # --- pavement, kerb, road
    pav = np.maximum(-(Y - G), Y - 640) + 0 * X
    c.paint(c.cov(pav), grad(np.clip((Y - G) / 36, 0, 1), [(0, hexc("#4A4468")), (1, hexc("#5E5880"))]))
    slab = ((np.mod(X + (Y - G) * 0.6, 64.0) < 1.5) | (np.abs(Y - 620) < 0.8)) * c.cov(pav)
    c.paint(slab * 0.4, hexc("#2A2648"))
    kerb = np.maximum(-(Y - 638), Y - 648)
    c.paint(c.cov(kerb), grad(np.clip((Y - 638) / 10, 0, 1), [(0, hexc("#9A94BE")), (1, hexc("#4A4468"))]))
    c.paint(c.cov(np.abs(Y - 648) - 1.2), INK)
    road = -(Y - 648)
    asphalt = up(c, value_noise((TH, TW + 2 * XPAD), 3, 41, 2))
    rc = grad(np.clip((Y - 648) / 72, 0, 1), [(0, hexc("#24203A")), (1, hexc("#151226"))])
    rc[..., :3] *= (0.9 + 0.2 * asphalt)[..., None]
    c.paint(c.cov(road), rc)
    # --- glows of every lit window (blurred light, alpha-blended so it reads over the sky too)
    em = np.zeros(X.shape + (3,), np.float32)
    for sd, col in L:
        em += c.cov(sd)[..., None] * col[None, None, :3]
    glow = blur(em, 7 * c.ss) * 1.6 + blur(em, 22 * c.ss) * 1.2
    ga = np.clip(glow.max(axis=-1), 0, 1) * 0.55
    gc = glow / np.maximum(glow.max(axis=-1, keepdims=True), 1e-4)
    c.paint(ga, np.concatenate([gc, np.ones(ga.shape + (1,), np.float32)], -1))
    # wet-road reflections of the lit shopfronts and the garage door
    refl = np.zeros(X.shape + (3,), np.float32)
    for sd, col in L:
        refl += c.cov(sd)[..., None] * col[None, None, :3]
    mirror_y = (2 * 646 - Y).astype(np.int32)
    rows = np.clip(mirror_y * c.ss, 0, c.Y.shape[0] - 1)
    rr = refl[np.clip((2 * 646 - c.Y) * c.ss, 0, c.Y.shape[0] - 1).astype(np.int32)[:, 0], :, :]
    rr = blur(rr, 3 * c.ss)
    fadeo = np.clip(1 - (Y - 648) / 70, 0, 1) * (Y > 648)
    ripple = 0.6 + 0.4 * np.sin(Y * 1.7 + np.sin(X * 0.05) * 2)
    ra = np.clip(rr.max(axis=-1), 0, 1) * fadeo * ripple * 0.45
    rc = rr / np.maximum(rr.max(axis=-1, keepdims=True), 1e-4)
    c.paint(ra, np.concatenate([rc, np.ones(ra.shape + (1,), np.float32)], -1))
    # street lamps with a soft halo
    for lx in [120.0, 470.0, 1110.0]:
        lamp(c, lx, G + 6)
        hd = np.hypot(X - lx - 27, Y - (G + 6 - 200 + 10))
        c.paint(np.clip(1 - hd / 70, 0, 1) ** 2 * 0.55, hexc("#FFD9A0"))
        streak = np.clip(1 - np.abs(X - lx - 27) / (6 + (Y - 648) * 0.15), 0, 1) * np.clip(1 - (Y - 648) / 72, 0, 1) * (Y > 648)
        c.paint(streak * 0.35, hexc("#FFC47A"))
    # door light spilling on the pavement
    spill = np.clip(1 - np.hypot((X - 980) / 120, (Y - 620) / 20), 0, 1) * c.cov(pav + 1)
    c.paint(spill * 0.6, hexc("#FFB04A"))
    c.save(out("title_town.png"))


def lamp(c, x, base):
    X, Y = c.X, c.Y
    top = base - 200
    post = np.minimum(sd_rrect(X, Y, x - 3, top, x + 3, base, 2), sd_rrect(X, Y, x - 7, base - 18, x + 7, base, 3))
    arm = sd_segment(X, Y, x, top + 6, x + 26, top + 2, 2.4)
    head = sd_poly(X, Y, [(x + 14, top - 6), (x + 40, top - 6), (x + 46, top + 6), (x + 8, top + 6)])
    shape = np.minimum(np.minimum(post, arm), head)
    c.paint(c.cov(shape - 2.5), INK)
    c.paint(c.cov(shape), grad(np.clip((X - x + 7) / 14, 0, 1), [(0, hexc("#2A3A4A")), (0.4, hexc("#5A7088")), (1, hexc("#1A2230"))]))
    bulb = sd_rrect(X, Y, x + 12, top + 5, x + 42, top + 10, 2)
    c.paint(c.cov(bulb), hexc("#FFF2C0"))
    # pool of sodium light on the ground
    pool = np.clip(1 - np.hypot((X - x - 26) / 150, (Y - base - 18) / 26), 0, 1) ** 1.3
    c.paint(pool * 0.45 * (Y > base - 8), hexc("#FFB866"))


@bake
def title_car():
    # A classic two-door saloon, side view, facing right. Paint layer is greyscale (tinted live); detail
    # layer carries outline, chrome, glass, tyres and lamps. Origin: tyres touch y = 108 of the 300x120 image.
    W, H = 300, 120
    def body_sd(X, Y):
        lower = sd_rrect(X, Y, 14, 52, 286, 96, 14)
        nose = sd_rrect(X, Y, 230, 56, 292, 92, 16)
        tail = sd_rrect(X, Y, 8, 54, 60, 92, 12)
        cabin = sd_poly(X, Y, [(78, 56), (104, 18), (190, 18), (222, 56)])
        cabin = smin(cabin, sd_rrect(X, Y, 96, 16, 196, 30, 8), 6)
        s = smin(smin(lower, nose, 6), tail, 6)
        s = smin(s, cabin - 2, 10)
        arches = np.minimum(sd_circle(X, Y, 74, 98, 27), sd_circle(X, Y, 228, 98, 27))
        return np.maximum(s, -arches)
    paint = Canvas(W, H, ss=4)
    X, Y = paint.X, paint.Y
    b = body_sd(X, Y)
    # greyscale shading: light top, mid flank, dark sill; a crisp highlight line along the shoulder
    shadeg = grad(np.clip((Y - 16) / 82, 0, 1), [(0, hexc("#FFFFFF")), (0.35, hexc("#E6E6E6")), (0.45, hexc("#B0B0B0")), (0.75, hexc("#8A8A8A")), (1, hexc("#4A4A4A"))])
    paint.paint(paint.cov(b), shadeg)
    paint.save(out("title_car_paint.png"))
    d = Canvas(W, H, ss=4)
    # ground shadow
    d.shadow(sd_ellipse(X, Y, 150, 110, 140, 7), 4, 0.7)
    # outline ring around the body (transparent inside so the paint shows)
    d.paint(d.cov(b - 3.5) * (1 - d.cov(b)), INK)
    # shoulder highlight and swage line
    d.paint(d.cov(np.maximum(b + 1, np.abs(Y - 60) - 1.3)) * 0.85, WHITE)
    d.paint(d.cov(np.maximum(b + 1, np.abs(Y - 76) - 0.8)) * 0.35, hexc("#000000"))
    # glass
    glass = np.maximum(sd_poly(X, Y, [(88, 54), (110, 25), (186, 25), (210, 54)]), -(np.abs(X - 150) - 3))
    d.paint(d.cov(glass - 2.5), INK)
    d.paint(d.cov(glass), grad(np.clip((Y - 25) / 29, 0, 1), [(0, hexc("#BFE8FF")), (0.5, hexc("#4E7FB8")), (1, hexc("#22355E"))]))
    d.paint(d.cov(np.maximum(glass, np.abs((X - 120) + (Y - 40) * 0.8) - 5)) * 0.5, WHITE)
    # chrome bumpers and trim
    for (x0, x1) in [(272, 296), (4, 26)]:
        bump = sd_rrect(X, Y, x0, 76, x1, 86, 4)
        d.paint(d.cov(bump - 2), INK)
        d.paint(d.cov(bump), grad(np.clip((Y - 76) / 10, 0, 1), [(0, hexc("#FFFFFF")), (0.5, hexc("#9AA4B8")), (1, hexc("#4A5068"))]))
    trim = sd_rrect(X, Y, 40, 66, 270, 68.5, 1)
    d.paint(d.cov(trim), hexc("#E8ECF4"))
    # door shut line and handle
    d.paint(d.cov(np.maximum(np.abs(X - 196) - 0.8, np.maximum(-(Y - 58), Y - 92))) * 0.6 * d.cov(b + 1), INK)
    d.paint(d.cov(sd_rrect(X, Y, 180, 62, 192, 65, 1)), hexc("#E8ECF4"))
    # lamps
    head = sd_ellipse(X, Y, 286, 66, 6, 7)
    d.paint(d.cov(head - 2), INK)
    d.paint(d.cov(head), hexc("#FFF6D0"))
    tl = sd_rrect(X, Y, 8, 60, 16, 72, 2)
    d.paint(d.cov(tl - 2), INK)
    d.paint(d.cov(tl), hexc("#FF3A3A"))
    # wheels
    for wx in (74.0, 228.0):
        tyre = sd_circle(X, Y, wx, 96, 21)
        d.paint(d.cov(tyre - 2.5), INK)
        d.paint(d.cov(tyre), hexc("#1E1C26"))
        rim = sd_circle(X, Y, wx, 96, 12)
        d.paint(d.cov(rim - 1.5), INK)
        rt = np.clip(((X - wx) * -0.5 + (Y - 96) * -0.8) / 24 + 0.5, 0, 1)
        d.paint(d.cov(rim), grad(rt, [(0, hexc("#5A6074")), (0.6, hexc("#C8D0E0")), (1, hexc("#FFFFFF"))]))
        d.paint(d.cov(sd_circle(X, Y, wx, 96, 4.5)), hexc("#8A92A8"))
        d.paint(d.cov(np.abs(sd_circle(X, Y, wx, 96, 17)) - 0.8) * 0.35, hexc("#55525E"))
    d.save(out("title_car_detail.png"))
    # headlight beam (additive in Godot): a soft wedge 420 px long
    bw, bh = 440, 160
    bc = Canvas(bw, bh, ss=1)
    u = bc.X / bw
    half = 10 + u * 70
    a = np.clip(1 - np.abs(bc.Y - 60 - u * 20) / half, 0, 1) ** 1.4 * (1 - u) ** 1.2
    bc.paint(np.clip(a, 0, 1) * 0.9, hexc("#FFE9A8"))
    bc.save(out("title_beam.png"))


def main(names):
    os.makedirs(OUT, exist_ok=True)
    todo = names or list(BAKES)
    for n in todo:
        BAKES[n]()
        print("baked", n)


if __name__ == "__main__":
    main(sys.argv[1:])
