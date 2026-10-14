#!/usr/bin/env python3
"""Car body surface maths (card CA02). Standard library only.

Answers "where is the body surface?" for a car dossier (see
docs/CAR_DOSSIER_SPEC.md). The lofted body and every detail part use this,
so a lamp or a handle always sits on the body.

Units are car units (x from -50 rear to +50 front, y height above ground).
"""

import math

TUMBLEHOME_K = {"low": 0.08, "medium": 0.16, "high": 0.26}


class Surface:
    def __init__(self, dossier, belt_y=None):
        self.poly = [(float(p[0]), float(p[1])) for p in dossier["side_profile"]]
        xs = [p[0] for p in self.poly]
        ys = [p[1] for p in self.poly]
        self.xmin = min(xs)
        self.xmax = max(xs)
        plan = dossier.get("plan", {})
        self.w0 = float(plan["width_units"]) / 2.0
        self.tail = float(plan.get("tail_width_pct", 100))
        self.nose = float(plan.get("nose_width_pct", 100))
        self.k = TUMBLEHOME_K[plan.get("tumblehome", "medium")]
        if belt_y is not None:
            self.belt = float(belt_y)
        else:
            self.belt = 0.62 * max(ys)

    def _ys_at(self, xc):
        """Every y where the side profile meets the vertical line x = xc."""
        pts = self.poly
        n = len(pts)
        ys = []
        for i in range(n):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % n]
            if abs(x1 - xc) < 1e-6:
                ys.append(y1)
            if (x1 - xc) * (x2 - xc) < 0:
                t = (xc - x1) / (x2 - x1)
                ys.append(y1 + t * (y2 - y1))
        return ys

    def _clamp_x(self, x):
        return min(max(x, self.xmin), self.xmax)

    def _section_ys(self, x):
        xc = self._clamp_x(x)
        ys = self._ys_at(xc)
        if not ys:
            # Nothing crosses this x: fall back to the nearest end of the body.
            if abs(xc - self.xmin) <= abs(xc - self.xmax):
                ys = self._ys_at(self.xmin)
            else:
                ys = self._ys_at(self.xmax)
        return ys

    def top(self, x):
        return max(self._section_ys(x))

    def bottom(self, x):
        return min(self._section_ys(x))

    def taper(self, x):
        span = self.xmax - self.xmin
        tt = (x - self.xmin) / span if span > 0 else 0.5
        # Clamp so x outside the body gives the end value, not an extrapolation.
        tt = min(max(tt, 0.0), 1.0)
        f = 1.0
        if tt < 0.25:
            f *= 1 - (1 - self.tail / 100.0) * (0.25 - tt) / 0.25
        if tt > 0.75:
            f *= 1 - (1 - self.nose / 100.0) * (tt - 0.75) / 0.25
        e = min(tt, 1 - tt)
        if e < 0.04:
            f *= 0.55 + 0.45 * math.sqrt(1 - ((0.04 - e) / 0.04) ** 2)
        return f

    def half_width(self, x, y):
        zb, zt = self.bottom(x), self.top(x)
        if y < zb or y > zt:
            return 0.0
        w = self.w0 * self.taper(x)
        # Round-off under the sill.
        if y < zb + 2:
            w *= 1 - 0.25 * ((zb + 2 - y) / 2.0) ** 2
        # Tumblehome above the belt line.
        if zt > self.belt + 0.5 and y > self.belt:
            s = (y - self.belt) / (zt - self.belt)
            w *= 1 - self.k * s ** 1.5
        # Roof or deck cap.
        c = 1.2 if zt > self.belt + 0.5 else 2.2
        if y > zt - c:
            w *= math.sqrt(max(0.05, 1 - ((y - (zt - c)) / c) ** 2))
        return w

    def lat_at(self, x, y):
        return self.half_width(x, y)

    def ring(self, x, n=14):
        """Right half-section at x: (lateral, y) from bottom centre to top centre."""
        zb, zt = self.bottom(x), self.top(x)
        out = [(0.0, zb)]
        for j in range(n):
            y = zb + (zt - zb) * (j / float(n - 1)) ** 1.0
            if j == 0:
                y = zb + 0.01
            if j == n - 1:
                y = zt - 0.01
            out.append((self.half_width(x, y), y))
        out.append((0.0, zt))
        return out


def default_details(dossier):
    """A valid v2 details dict for a car that has no details file."""
    gh = dossier["greenhouse"]
    if gh and isinstance(gh[0][0], list):
        polys = [[[p[0], p[1]] for p in poly] for poly in gh]
    else:
        polys = [[[p[0], p[1]] for p in gh]]
    belt_y = min(p[1] for poly in polys for p in poly)
    wheels = dossier.get("wheels") or []
    style = wheels[0]["style"] if wheels else "steel"
    return {
        "version": 2,
        "id": dossier["id"],
        "belt_y": belt_y,
        "windows": polys,
        "wheel": {"style": style},
        "caricature": {"eyes": 1.0, "mouth": 1.0, "wheels": 1.0, "bumper": 1.0},
        "parts": [],
    }
