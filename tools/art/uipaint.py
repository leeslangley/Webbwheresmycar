"""uipaint: a tiny numpy painter for the painted-cartoon UI chrome (no PIL needed).

Shapes are signed distance fields evaluated on a supersampled grid, so every edge is anti-aliased.
A Canvas holds premultiplied RGBA at S x the output size; save() box-filters down and writes a PNG.
Coordinates are always in OUTPUT pixels (0,0 = top-left corner of the image).
"""
import struct
import zlib

import numpy as np


def hexc(h, a=1.0):
    h = h.lstrip("#")
    return np.array([int(h[0:2], 16) / 255.0, int(h[2:4], 16) / 255.0, int(h[4:6], 16) / 255.0, a], dtype=np.float32)


def write_png(path, rgba):
    """rgba: HxWx4 float (straight alpha, 0..1)."""
    h, w, _ = rgba.shape
    data = (np.clip(rgba, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)
    raw = b"".join(b"\x00" + data[y].tobytes() for y in range(h))

    def chunk(tag, payload):
        c = struct.pack(">I", len(payload)) + tag + payload
        return c + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


# ---------------------------------------------------------------- distance fields (output px units)

def sd_rrect(X, Y, x0, y0, x1, y1, r):
    cx, cy = (x0 + x1) * 0.5, (y0 + y1) * 0.5
    hx, hy = (x1 - x0) * 0.5 - r, (y1 - y0) * 0.5 - r
    qx = np.abs(X - cx) - hx
    qy = np.abs(Y - cy) - hy
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r


def sd_circle(X, Y, cx, cy, r):
    return np.hypot(X - cx, Y - cy) - r


def sd_ellipse(X, Y, cx, cy, rx, ry):
    # Cheap approximation, good enough for soft shapes.
    k = np.hypot((X - cx) / rx, (Y - cy) / ry)
    return (k - 1.0) * min(rx, ry)


def sd_poly(X, Y, pts):
    """Exact signed distance to a closed polygon (list of (x, y))."""
    pts = np.asarray(pts, dtype=np.float32)
    n = len(pts)
    d = np.full(X.shape, 1e9, dtype=np.float32)
    s = np.ones(X.shape, dtype=np.float32)
    for i in range(n):
        ax, ay = pts[i - 1]
        bx, by = pts[i]
        ex, ey = bx - ax, by - ay
        wx, wy = X - ax, Y - ay
        t = np.clip((wx * ex + wy * ey) / max(ex * ex + ey * ey, 1e-9), 0, 1)
        dx, dy = wx - ex * t, wy - ey * t
        d = np.minimum(d, dx * dx + dy * dy)
        c1 = Y >= ay
        c2 = Y < by
        c3 = ex * wy > ey * wx
        flip = (c1 & c2 & c3) | (~c1 & ~c2 & ~c3)
        s = np.where(flip, -s, s)
    return s * np.sqrt(d)


def sd_segment(X, Y, ax, ay, bx, by, r):
    ex, ey = bx - ax, by - ay
    wx, wy = X - ax, Y - ay
    t = np.clip((wx * ex + wy * ey) / max(ex * ex + ey * ey, 1e-9), 0, 1)
    return np.hypot(wx - ex * t, wy - ey * t) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


# ---------------------------------------------------------------- noise

def value_noise(shape_hw, cell, seed, octaves=4, gain=0.5):
    """Smooth fractal value noise in 0..1 at OUTPUT resolution; cell is the first octave's cell size in px."""
    h, w = shape_hw
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), dtype=np.float32)
    amp, tot = 1.0, 0.0
    c = float(cell)
    for _ in range(octaves):
        gh, gw = int(h / c) + 3, int(w / c) + 3
        g = rng.random((gh, gw)).astype(np.float32)
        ys = np.arange(h, dtype=np.float32) / c
        xs = np.arange(w, dtype=np.float32) / c
        y0 = np.floor(ys).astype(int)
        x0 = np.floor(xs).astype(int)
        fy = ys - y0
        fx = xs - x0
        fy = fy * fy * (3 - 2 * fy)
        fx = fx * fx * (3 - 2 * fx)
        a = g[y0][:, x0]
        b = g[y0][:, x0 + 1]
        cc = g[y0 + 1][:, x0]
        d = g[y0 + 1][:, x0 + 1]
        top = a + (b - a) * fx[None, :]
        bot = cc + (d - cc) * fx[None, :]
        out += amp * (top + (bot - top) * fy[:, None])
        tot += amp
        amp *= gain
        c = max(c / 2.0, 1.0)
    return out / tot


def blur(a, r):
    """Approximate gaussian blur (three box passes) of a HxW or HxWxC array, radius r in array px."""
    r = int(max(1, round(r)))
    out = a.astype(np.float32)
    for _ in range(3):
        for axis in (0, 1):
            pad = [(0, 0)] * out.ndim
            pad[axis] = (r + 1, r)
            p = np.pad(out, pad, mode="edge")
            c = np.cumsum(p, axis=axis)
            sl_hi = [slice(None)] * out.ndim
            sl_lo = [slice(None)] * out.ndim
            sl_hi[axis] = slice(2 * r + 1, None)
            sl_lo[axis] = slice(0, -2 * r - 1)
            out = (c[tuple(sl_hi)] - c[tuple(sl_lo)]) / (2 * r + 1)
    return out


# ---------------------------------------------------------------- canvas

class Canvas:
    def __init__(self, w, h, ss=4, bg=None):
        self.w, self.h, self.ss = w, h, ss
        H, W = h * ss, w * ss
        ys = (np.arange(H, dtype=np.float32) + 0.5) / ss
        xs = (np.arange(W, dtype=np.float32) + 0.5) / ss
        self.X, self.Y = np.meshgrid(xs, ys)
        self.px = np.zeros((H, W, 4), dtype=np.float32)  # premultiplied
        if bg is not None:
            self.px[:] = np.array([bg[0] * bg[3], bg[1] * bg[3], bg[2] * bg[3], bg[3]], dtype=np.float32)

    # coverage of a distance field (1 inside, AA over one output pixel / ss)
    def cov(self, sd, soft=0.0):
        if soft > 0:
            return np.clip(0.5 - sd / soft, 0, 1).astype(np.float32)
        return np.clip(0.5 - sd * self.ss, 0, 1).astype(np.float32)

    def paint(self, alpha, color):
        """Composite colour (RGBA const, or HxWx3 / HxWx4 array) over the canvas with coverage alpha."""
        col = np.asarray(color, dtype=np.float32)
        if col.ndim == 1:
            rgb = col[:3]
            a = alpha * (col[3] if col.shape[0] > 3 else 1.0)
            src = np.empty(self.px.shape, dtype=np.float32)
            src[..., 0] = rgb[0] * a
            src[..., 1] = rgb[1] * a
            src[..., 2] = rgb[2] * a
            src[..., 3] = a
        else:
            a = alpha * (col[..., 3] if col.shape[-1] > 3 else 1.0)
            src = np.concatenate([col[..., :3] * a[..., None], a[..., None]], axis=-1)
        self.px = src + self.px * (1.0 - src[..., 3:4])

    def add(self, alpha, color):
        """Additive light (premultiplied add, alpha also grows)."""
        col = np.asarray(color, dtype=np.float32)
        if col.ndim == 1:
            self.px[..., :3] += alpha[..., None] * col[None, None, :3]
        else:
            self.px[..., :3] += alpha[..., None] * col[..., :3]
        self.px[..., 3] = np.clip(self.px[..., 3] + alpha * 0.0, 0, 1)

    def shadow(self, sd, blur_px, alpha, color=(0, 0, 0)):
        m = blur(self.cov(sd), blur_px * self.ss) * alpha
        self.paint(m, np.array([color[0], color[1], color[2], 1.0], dtype=np.float32))

    def save(self, path):
        s = self.ss
        H, W = self.h, self.w
        p = self.px.reshape(H, s, W, s, 4).mean(axis=(1, 3))
        a = p[..., 3:4]
        rgb = np.where(a > 1e-5, p[..., :3] / np.maximum(a, 1e-5), 0)
        write_png(path, np.concatenate([rgb, a], axis=-1))
        return p


# ---------------------------------------------------------------- colour helpers

def grad(t, stops):
    """stops: list of (pos, rgba array). t: array. Returns HxWx4."""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (4,), dtype=np.float32)
    out[...] = stops[0][1]
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        u = np.clip((t - p0) / max(p1 - p0, 1e-6), 0, 1)[..., None]
        m = ((t >= p0) & (t <= p1))[..., None] if False else None
        seg = c0 + (c1 - c0) * u
        out = np.where((t >= p0)[..., None], seg, out)
    return out


def shade(col, k):
    """Multiply rgb by k (k < 1 darker, > 1 lighter), keep alpha."""
    c = np.array(col, dtype=np.float32).copy()
    c[:3] = np.clip(c[:3] * k, 0, 1)
    return c


def mix(a, b, t):
    return np.asarray(a, dtype=np.float32) * (1 - t) + np.asarray(b, dtype=np.float32) * t
