#!/usr/bin/env python3
"""
Build sw5e-nav-computer/data/hyperspace-routes.json from GeoJSON + planets + tier overrides
+ StarWarsMap authoritative hyperlane chains (see sw5e-nav-computer/data/starwarsmap/).
See repo docs/hyperspace-coordinate-transform.md for coordinate reconciliation.

Run from repo root: python scripts/build-hyperspace-graph.py
Suggest control points (stdout JSON): python scripts/build-hyperspace-graph.py --suggest-control-points
"""

from __future__ import annotations

import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
GEOJSON_PATH = REPO / "hyperspace_singlepart_new.json"
PLANETS_PATH = REPO / "sw5e-nav-computer" / "data" / "planets.json"
TIER_OVERRIDES_PATH = REPO / "sw5e-nav-computer" / "data" / "route-tier-overrides.json"
CONTROL_POINTS_PATH = REPO / "sw5e-nav-computer" / "data" / "hyperspace-control-points.json"
GRID_TO_GEO_PATH = REPO / "sw5e-nav-computer" / "data" / "grid-to-geo.json"
OUTPUT_PATH = REPO / "sw5e-nav-computer" / "data" / "hyperspace-routes.json"
HAND_ROUTES_PATH = REPO / "sw5e-nav-computer" / "data" / "hyperspace-routes.hand.json"
STARWARSMAP_HYPERLANES_PATH = REPO / "sw5e-nav-computer" / "data" / "starwarsmap" / "hyperlanes_db.json"
STARWARSMAP_ALIASES_PATH = REPO / "sw5e-nav-computer" / "data" / "starwarsmap" / "planet-name-aliases.json"
# Travel hours per unit of planet-plane distance (same space as coordinates.x/y and parse_grid); clamped to MIN/MAX.
STARWARSMAP_HOURS_PER_GRID_UNIT = 0.55

# Well-spread worlds for bootstrap control points (nearest GeoJSON vertex to bbox-mapped position).
CANDIDATE_CONTROL_NAMES = [
    "Coruscant",
    "Corellia",
    "Tatooine",
    "Ryloth",
    "Eriadu",
    "Kuat",
    "Naboo",
    "Dantooine",
    "Malastare",
    "Chandrila",
]

SNAP_THRESHOLD_DEG = 3.8
# Skip edges when consecutive snaps are closer than this along-line (reduces dense chains)
MIN_ARC_LEN_FOR_EDGE = 0.35
HOURS_PER_DEG = 2.8
MIN_TRAVEL_HOURS = 8.0
MAX_TRAVEL_HOURS = 96.0
CONNECTOR_NAME = "Regional connector"
SYNTHETIC_ROUTE_NAME = "Transit corridor (unmapped)"


def parse_grid(grid: str | None) -> tuple[float, float] | None:
    if not grid:
        return None
    t = str(grid).strip().upper().replace(" ", "")
    m = re.match(r"^([A-Z]+)-?(\d+)$", t)
    if not m:
        return None
    letters, num_s = m.group(1), m.group(2)
    col = 0.0
    for ch in letters:
        col = col * 26.0 + (ord(ch) - ord("A") + 1)
    row = float(num_s)
    return col * 8.0, row * 2.2


def normalize_grid_key(grid: str | None) -> str | None:
    if not grid:
        return None
    t = str(grid).strip().upper().replace(" ", "")
    m = re.match(r"^([A-Z]+)-?(\d+)$", t)
    if not m:
        return None
    return f"{m.group(1)}-{m.group(2)}"


def load_grid_to_geo() -> dict[str, tuple[float, float]]:
    if not GRID_TO_GEO_PATH.is_file():
        return {}
    data = json.loads(GRID_TO_GEO_PATH.read_text(encoding="utf-8"))
    out: dict[str, tuple[float, float]] = {}
    for k, v in (data.get("cells") or {}).items():
        if not isinstance(v, dict):
            continue
        lon, lat = v.get("lon"), v.get("lat")
        if lon is None or lat is None:
            continue
        nk = normalize_grid_key(k)
        key = nk if nk else str(k).strip().upper()
        out[key] = (float(lon), float(lat))
    return out


def collect_geojson_vertices(features: list) -> list[tuple[float, float]]:
    verts: list[tuple[float, float]] = []
    for f in features:
        for c in f.get("geometry", {}).get("coordinates") or []:
            verts.append((float(c[0]), float(c[1])))
    return verts


def nearest_vertex(
    lon: float, lat: float, verts: list[tuple[float, float]]
) -> tuple[tuple[float, float], float]:
    best = verts[0]
    best_d = math.hypot(lon - best[0], lat - best[1])
    for vl, vb in verts[1:]:
        d = math.hypot(lon - vl, lat - vb)
        if d < best_d:
            best_d = d
            best = (vl, vb)
    return best, best_d


def suggest_control_points_main() -> None:
    """Print suggested controlPoints JSON (bbox-only mapping + nearest GeoJSON vertex)."""
    geo = json.loads(GEOJSON_PATH.read_text(encoding="utf-8"))
    planets = json.loads(PLANETS_PATH.read_text(encoding="utf-8"))
    features = geo.get("features") or []
    verts = collect_geojson_vertices(features)
    if len(verts) < 2:
        print("{}", file=sys.stderr)
        raise SystemExit("GeoJSON has no vertices.")

    all_lons = [v[0] for v in verts]
    all_lats = [v[1] for v in verts]
    lon_min, lon_max = min(all_lons), max(all_lons)
    lat_min, lat_max = min(all_lats), max(all_lats)

    planet_positions: dict[str, tuple[float, float]] = {}
    for p in planets:
        name = p.get("name")
        if not name:
            continue
        xy = None
        if p.get("coordinates") and isinstance(p["coordinates"], dict):
            cx = p["coordinates"].get("x")
            cy = p["coordinates"].get("y")
            if cx is not None and cy is not None:
                xy = (float(cx), float(cy))
        if xy is None:
            g = parse_grid(p.get("grid"))
            if g:
                xy = g
        if xy:
            planet_positions[name] = xy

    gx_list = [xy[0] for xy in planet_positions.values()]
    gy_list = [xy[1] for xy in planet_positions.values()]
    gx_min, gx_max = min(gx_list), max(gx_list)
    gy_min, gy_max = min(gy_list), max(gy_list)
    gdx = gx_max - gx_min or 1.0
    gdy = gy_max - gy_min or 1.0

    def xy_to_lonlat_bbox(xy: tuple[float, float]) -> tuple[float, float]:
        gx, gy = xy
        lon = lon_min + (gx - gx_min) / gdx * (lon_max - lon_min)
        lat = lat_max - (gy - gy_min) / gdy * (lat_max - lat_min)
        return lon, lat

    out_points: list[dict] = []
    for name in CANDIDATE_CONTROL_NAMES:
        if name not in planet_positions:
            continue
        lon, lat = xy_to_lonlat_bbox(planet_positions[name])
        (vl, vb), _d = nearest_vertex(lon, lat, verts)
        out_points.append({"name": name, "lon": round(vl, 6), "lat": round(vb, 6)})

    doc = {
        "comment": "Suggested targets: nearest GeoJSON line vertex to bbox-normalized position. "
        "Replace with hand-picked lon/lat from your source map when available.",
        "controlPoints": out_points,
    }
    print(json.dumps(doc, ensure_ascii=False, indent=2))


def dist_point_segment(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    abx, aby = bx - ax, by - ay
    apx, apy = px - ax, py - ay
    ab2 = abx * abx + aby * aby
    if ab2 < 1e-18:
        return math.hypot(apx, apy)
    t = max(0.0, min(1.0, (apx * abx + apy * aby) / ab2))
    qx, qy = ax + t * abx, ay + t * aby
    return math.hypot(px - qx, py - qy)


def polyline_cumulative_lengths(coords: list) -> tuple[list[float], float]:
    cum = [0.0]
    total = 0.0
    for i in range(1, len(coords)):
        x0, y0 = coords[i - 1][0], coords[i - 1][1]
        x1, y1 = coords[i][0], coords[i][1]
        d = math.hypot(x1 - x0, y1 - y0)
        total += d
        cum.append(total)
    return cum, total


def closest_point_on_polyline(
    px: float, py: float, coords: list
) -> tuple[float, float, float]:
    if len(coords) < 2:
        return 1e9, 0.0, 0.0
    cum, total_len = polyline_cumulative_lengths(coords)
    best_d = 1e9
    best_s = 0.0
    for i in range(len(coords) - 1):
        ax, ay = coords[i][0], coords[i][1]
        bx, by = coords[i + 1][0], coords[i + 1][1]
        d = dist_point_segment(px, py, ax, ay, bx, by)
        if d < best_d:
            best_d = d
            abx, aby = bx - ax, by - ay
            apx, apy = px - ax, py - ay
            ab2 = abx * abx + aby * aby
            if ab2 < 1e-18:
                t = 0.0
            else:
                t = max(0.0, min(1.0, (apx * abx + apy * aby) / ab2))
            seg_len = math.hypot(bx - ax, by - ay)
            best_s = cum[i] + t * seg_len
    return best_d, best_s, total_len


def zoom_to_tier(z: object) -> int:
    try:
        zi = int(z)
    except (TypeError, ValueError):
        return 3
    if zi <= 0 or zi >= 2000:
        return 3
    return max(1, min(5, zi))


def load_tier_overrides() -> dict:
    if not TIER_OVERRIDES_PATH.is_file():
        return {}
    data = json.loads(TIER_OVERRIDES_PATH.read_text(encoding="utf-8"))
    return data.get("routes") or {}


# StarWarsMap (Wason1797/StarWarsMap) route labels -> module / override spelling.
STARWARSMAP_ROUTE_NAME_FIXES: dict[str, str] = {
    "Corellinan Run": "Corellian Run",
    "Way Of Schesa": "Way of Schesa",
    "Path Of The Houses": "Path of the Houses",
}


def normalize_starwarsmap_route_name(name: str | None) -> str:
    if not name:
        return ""
    t = str(name).strip()
    return STARWARSMAP_ROUTE_NAME_FIXES.get(t, t)


def load_starwarsmap_planet_aliases(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    aliases = data.get("aliases")
    if isinstance(aliases, dict):
        return {str(k): str(v) for k, v in aliases.items()}
    return {}


def resolve_starwarsmap_world(
    raw: str, planet_names: set[str], aliases: dict[str, str]
) -> str | None:
    s = raw.strip() if isinstance(raw, str) else str(raw).strip()
    if not s:
        return None
    if s in planet_names:
        return s
    mapped = aliases.get(s)
    if mapped and mapped in planet_names:
        return mapped
    return None


def load_starwarsmap_hyperlanes(path: Path) -> dict[str, list] | None:
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return None
    return data


def add_starwarsmap_edges(
    edges_map: dict[tuple[str, str, str], dict],
    hyperlanes: dict[str, list],
    planet_positions: dict[str, tuple[float, float]],
    planet_names: set[str],
    aliases: dict[str, str],
    overrides: dict,
    add_edge_fn,
) -> tuple[int, int]:
    """Consecutive worlds on each StarWarsMap route become authoritative named edges.
    Returns (edges_added, hops_skipped_missing_world)."""
    added = 0
    skipped = 0
    for route_raw, chain in hyperlanes.items():
        route_name = normalize_starwarsmap_route_name(route_raw)
        seq: list[str] = []
        for w in chain:
            if not isinstance(w, str):
                continue
            w = w.strip()
            if not w:
                continue
            if seq and seq[-1] == w:
                continue
            seq.append(w)
        resolved = [resolve_starwarsmap_world(w, planet_names, aliases) for w in seq]
        for i in range(len(resolved) - 1):
            a, b = resolved[i], resolved[i + 1]
            if a is None or b is None:
                skipped += 1
                continue
            pa = planet_positions.get(a)
            pb = planet_positions.get(b)
            if pa is None or pb is None:
                dist = 1.0
            else:
                dist = math.hypot(pa[0] - pb[0], pa[1] - pb[1])
            hours = max(
                MIN_TRAVEL_HOURS,
                min(MAX_TRAVEL_HOURS, dist * STARWARSMAP_HOURS_PER_GRID_UNIT),
            )
            tier, obscure, dc_bonus = resolve_tier_props(route_name, None, overrides)
            add_edge_fn(
                a,
                b,
                hours,
                route_name,
                tier,
                obscure,
                dc_bonus,
                essential_connectivity=False,
                synthetic_hop=False,
                authoritative=True,
            )
            added += 1
    return added, skipped


def resolve_tier_props(route_name: str | None, zoom_level: object, overrides: dict) -> tuple[int, bool, int]:
    if route_name and route_name in overrides:
        o = overrides[route_name]
        return (
            int(o.get("tier", 3)),
            bool(o.get("obscure", False)),
            int(o.get("dcBonus", 0)),
        )
    t = zoom_to_tier(zoom_level)
    obscure = t >= 4
    dc_bonus = 2 if t >= 5 else (1 if t >= 4 else 0)
    return t, obscure, dc_bonus


def solve_3x3(a: list[list[float]], b: list[float]) -> list[float] | None:
    """Gaussian elimination; a is 3x3, b length 3."""
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for col in range(3):
        pivot = None
        for r in range(col, 3):
            if abs(m[r][col]) > 1e-12:
                pivot = r
                break
        if pivot is None:
            return None
        m[col], m[pivot] = m[pivot], m[col]
        div = m[col][col]
        for j in range(4):
            m[col][j] /= div
        for r in range(3):
            if r == col:
                continue
            f = m[r][col]
            if abs(f) < 1e-18:
                continue
            for j in range(4):
                m[r][j] -= f * m[col][j]
    if abs(m[2][2]) < 1e-12:
        return None
    return [m[0][3], m[1][3], m[2][3]]


def fit_affine_lonlat(
    points_xy: list[tuple[float, float]], points_lonlat: list[tuple[float, float]]
) -> tuple[float, float, float, float, float, float] | None:
    if len(points_xy) < 3 or len(points_xy) != len(points_lonlat):
        return None
    n = len(points_xy)
    sum_x = sum(p[0] for p in points_xy)
    sum_y = sum(p[1] for p in points_xy)
    sum_x2 = sum(p[0] ** 2 for p in points_xy)
    sum_y2 = sum(p[1] ** 2 for p in points_xy)
    sum_xy = sum(p[0] * p[1] for p in points_xy)
    sum_lon = sum(points_lonlat[i][0] for i in range(n))
    sum_x_lon = sum(points_xy[i][0] * points_lonlat[i][0] for i in range(n))
    sum_y_lon = sum(points_xy[i][1] * points_lonlat[i][0] for i in range(n))
    M = [
        [sum_x2, sum_xy, sum_x],
        [sum_xy, sum_y2, sum_y],
        [sum_x, sum_y, float(n)],
    ]
    bl = [sum_x_lon, sum_y_lon, sum_lon]
    sol = solve_3x3(M, bl)
    if not sol:
        return None
    a, b, c = sol
    sum_lat = sum(points_lonlat[i][1] for i in range(n))
    sum_x_lat = sum(points_xy[i][0] * points_lonlat[i][1] for i in range(n))
    sum_y_lat = sum(points_xy[i][1] * points_lonlat[i][1] for i in range(n))
    b2 = [sum_x_lat, sum_y_lat, sum_lat]
    sol2 = solve_3x3(M, b2)
    if not sol2:
        return None
    d, e, f = sol2
    return a, b, c, d, e, f


def main() -> None:
    overrides = load_tier_overrides()
    grid_lookup = load_grid_to_geo()
    geo = json.loads(GEOJSON_PATH.read_text(encoding="utf-8"))
    planets = json.loads(PLANETS_PATH.read_text(encoding="utf-8"))
    planet_by_name = {p["name"]: p for p in planets if p.get("name")}
    planet_names = set(planet_by_name.keys())
    swmap_hyperlanes = load_starwarsmap_hyperlanes(STARWARSMAP_HYPERLANES_PATH)
    swmap_aliases = load_starwarsmap_planet_aliases(STARWARSMAP_ALIASES_PATH)
    swmap_authoritative_routes: set[str] = set()
    if swmap_hyperlanes:
        swmap_authoritative_routes = {
            normalize_starwarsmap_route_name(k) for k in swmap_hyperlanes
        }
    features = geo.get("features") or []

    all_lons: list[float] = []
    all_lats: list[float] = []
    for f in features:
        for c in f.get("geometry", {}).get("coordinates") or []:
            all_lons.append(c[0])
            all_lats.append(c[1])
    lon_min, lon_max = min(all_lons), max(all_lons)
    lat_min, lat_max = min(all_lats), max(all_lats)

    planet_positions: dict[str, tuple[float, float]] = {}
    gx_list: list[float] = []
    gy_list: list[float] = []

    for p in planets:
        name = p.get("name")
        if not name:
            continue
        xy = None
        if p.get("coordinates") and isinstance(p["coordinates"], dict):
            cx = p["coordinates"].get("x")
            cy = p["coordinates"].get("y")
            if cx is not None and cy is not None:
                xy = (float(cx), float(cy))
        if xy is None:
            g = parse_grid(p.get("grid"))
            if g:
                xy = g
        if xy:
            planet_positions[name] = xy
            gx_list.append(xy[0])
            gy_list.append(xy[1])

    gx_min, gx_max = min(gx_list), max(gx_list)
    gy_min, gy_max = min(gy_list), max(gy_list)
    gdx = gx_max - gx_min or 1.0
    gdy = gy_max - gy_min or 1.0

    def xy_to_lonlat_bbox(xy: tuple[float, float]) -> tuple[float, float]:
        gx, gy = xy
        lon = lon_min + (gx - gx_min) / gdx * (lon_max - lon_min)
        lat = lat_max - (gy - gy_min) / gdy * (lat_max - lat_min)
        return lon, lat

    xy_to_lonlat = xy_to_lonlat_bbox

    cp_data = json.loads(CONTROL_POINTS_PATH.read_text(encoding="utf-8")) if CONTROL_POINTS_PATH.is_file() else {}
    cps = cp_data.get("controlPoints") or []
    if len(cps) >= 3:
        xs: list[tuple[float, float]] = []
        lls: list[tuple[float, float]] = []
        for entry in cps:
            nm = entry.get("name")
            if nm not in planet_positions:
                continue
            lon = entry.get("lon")
            lat = entry.get("lat")
            if lon is None or lat is None:
                continue
            xs.append(planet_positions[nm])
            lls.append((float(lon), float(lat)))
        aff = fit_affine_lonlat(xs, lls)
        if aff:
            aa, bb, cc, dd, ee, ff = aff

            def xy_to_lonlat(xy: tuple[float, float]) -> tuple[float, float]:  # noqa: F811
                x, y = xy
                return aa * x + bb * y + cc, dd * x + ee * y + ff

    planet_lonlat: dict[str, tuple[float, float]] = {}
    for nm, xy in planet_positions.items():
        gk = normalize_grid_key(planet_by_name.get(nm, {}).get("grid"))
        if gk and gk in grid_lookup:
            planet_lonlat[nm] = grid_lookup[gk]
        else:
            planet_lonlat[nm] = xy_to_lonlat(xy)

    def feature_bbox(coords: list, pad: float) -> tuple[float, float, float, float]:
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        return (
            min(lons) - pad,
            max(lons) + pad,
            min(lats) - pad,
            max(lats) + pad,
        )

    snaps: list[tuple[int, float, str, str | None, object]] = []
    pad = SNAP_THRESHOLD_DEG
    for fi, f in enumerate(features):
        coords = f.get("geometry", {}).get("coordinates") or []
        if len(coords) < 2:
            continue
        props = f.get("properties") or {}
        route_hyp = props.get("hyperspace")
        if (
            route_hyp
            and swmap_authoritative_routes
            and normalize_starwarsmap_route_name(route_hyp) in swmap_authoritative_routes
        ):
            continue
        route_label = props.get("hyperspace")
        zoom = props.get("zoom_level")
        minx, maxx, miny, maxy = feature_bbox(coords, pad)
        for pname, (plon, plat) in planet_lonlat.items():
            if plon < minx or plon > maxx or plat < miny or plat > maxy:
                continue
            dist, arc_s, _ = closest_point_on_polyline(plon, plat, coords)
            if dist <= SNAP_THRESHOLD_DEG:
                snaps.append((fi, arc_s, pname, route_label, zoom))

    by_fi: dict[int, list[tuple[float, str, str | None, object]]] = defaultdict(list)
    for fi, arc_s, pname, rlab, zoom in snaps:
        by_fi[fi].append((arc_s, pname, rlab, zoom))

    edges_map: dict[tuple[str, str, str], dict] = {}

    def add_edge(
        a: str,
        b: str,
        hours: float,
        route_name: str,
        tier: int,
        obscure: bool,
        dc_bonus: int,
        *,
        essential_connectivity: bool = False,
        synthetic_hop: bool = False,
        authoritative: bool = False,
    ) -> None:
        if a == b:
            return
        h = max(MIN_TRAVEL_HOURS, min(MAX_TRAVEL_HOURS, hours))
        key = tuple(sorted([a, b]) + [route_name])
        prev = edges_map.get(key)
        if not authoritative and prev is not None and prev["travelTimeBase"] <= h:
            return
        rec: dict = {
            "name": route_name,
            "from": a,
            "to": b,
            "distance": 1,
            "travelTimeBase": round(h, 2),
            "classification": f"Class {min(tier, 3)}",
            "tier": tier,
            "obscure": obscure,
            "dcBonus": dc_bonus,
        }
        if essential_connectivity:
            rec["essentialConnectivity"] = True
        if synthetic_hop:
            rec["syntheticHop"] = True
        edges_map[key] = rec

    for fi, hits in by_fi.items():
        hits.sort(key=lambda x: x[0])
        dedup: list[tuple[float, str, str | None, object]] = []
        for arc_s, pname, rlab, zoom in hits:
            if dedup and dedup[-1][1] == pname:
                continue
            dedup.append((arc_s, pname, rlab, zoom))
        f = features[fi]
        coords = f.get("geometry", {}).get("coordinates") or []
        _, total_len = polyline_cumulative_lengths(coords)
        props = f.get("properties") or {}
        zoom0 = props.get("zoom_level")
        default_name = props.get("hyperspace") or CONNECTOR_NAME
        for i in range(len(dedup) - 1):
            s0, p0, lab0, z0 = dedup[i]
            s1, p1, lab1, z1 = dedup[i + 1]
            if abs(s1 - s0) < MIN_ARC_LEN_FOR_EDGE:
                continue
            route_name = lab0 or lab1 or default_name
            if route_name == CONNECTOR_NAME or not (lab0 or lab1):
                route_name = CONNECTOR_NAME
            z_use = z0 if lab0 else (z1 if lab1 else zoom0)
            tier, obscure, dc_bonus = resolve_tier_props(
                route_name if route_name != CONNECTOR_NAME else None, z_use, overrides
            )
            essential = False
            if route_name == CONNECTOR_NAME:
                tier = max(tier, 4)
                obscure = True
                essential = True
            seg_len = abs(s1 - s0)
            hours = seg_len * HOURS_PER_DEG
            flen = float(props.get("length") or 0)
            if total_len > 1e-6 and flen > 0:
                feat_hours = flen * (seg_len / total_len) * 0.12
                hours = max(hours * 0.4 + feat_hours * 0.6, MIN_TRAVEL_HOURS)
            add_edge(
                p0,
                p1,
                hours,
                route_name,
                tier,
                obscure,
                dc_bonus,
                essential_connectivity=essential,
                synthetic_hop=False,
            )

    if swmap_hyperlanes:
        sm_added, sm_skipped = add_starwarsmap_edges(
            edges_map,
            swmap_hyperlanes,
            planet_positions,
            planet_names,
            swmap_aliases,
            overrides,
            add_edge,
        )
        print(
            f"StarWarsMap authoritative lanes: {sm_added} hops added, "
            f"{sm_skipped} skipped (unresolved world), "
            f"{len(swmap_authoritative_routes)} route names suppress GeoJSON snaps"
        )

    if HAND_ROUTES_PATH.is_file():
        hand = json.loads(HAND_ROUTES_PATH.read_text(encoding="utf-8"))
        for r in hand.get("routes") or []:
            a, b = r["from"], r["to"]
            nm = r.get("name", "")
            key = tuple(sorted([a, b]) + [nm])
            if key not in edges_map:
                rr = dict(r)
                rr.setdefault("tier", 2)
                rr.setdefault("obscure", False)
                rr.setdefault("dcBonus", 0)
                edges_map[key] = rr

    def median_xy_hours_ratio() -> float:
        ratios: list[float] = []
        for r in edges_map.values():
            if r.get("essentialConnectivity"):
                continue
            pa = planet_positions.get(r["from"])
            pb = planet_positions.get(r["to"])
            if pa is None or pb is None:
                continue
            d = math.hypot(pa[0] - pb[0], pa[1] - pb[1])
            if d < 1e-6:
                continue
            ratios.append(float(r["travelTimeBase"]) / d)
        if not ratios:
            return 0.6
        ratios.sort()
        return ratios[len(ratios) // 2]

    def synthetic_travel_hours(dist_xy: float, ref_ratio: float) -> float:
        raw = dist_xy * 0.35
        named = dist_xy * ref_ratio
        return max(raw, named * 1.25)

    def nearest_in_set(
        p: str, pos: dict[str, tuple[float, float]], vset: set[str]
    ) -> tuple[str | None, float]:
        if not vset:
            return None, 1e18
        px, py = pos[p]
        best_q: str | None = None
        best_d = 1e18
        for q in vset:
            qx, qy = pos[q]
            d = math.hypot(px - qx, py - qy)
            if d < best_d:
                best_d = d
                best_q = q
        return best_q, best_d

    def ensure_full_connectivity() -> None:
        if not planet_positions:
            return
        ref_ratio = median_xy_hours_ratio()
        V: set[str] = set()
        for r in edges_map.values():
            V.add(r["from"])
            V.add(r["to"])
        if not V:
            V.add(sorted(planet_positions.keys())[0])
        U = [p for p in planet_positions if p not in V]
        initial_order: list[tuple[float, str]] = []
        for P in U:
            _q, d0 = nearest_in_set(P, planet_positions, V)
            initial_order.append((d0, P))
        initial_order.sort(key=lambda x: x[0])
        for _d0, P in initial_order:
            q, d = nearest_in_set(P, planet_positions, V)
            if q is None or P == q:
                continue
            if d < 1e-9:
                hours = MIN_TRAVEL_HOURS
            else:
                hours = synthetic_travel_hours(d, ref_ratio)
            add_edge(
                P,
                q,
                hours,
                SYNTHETIC_ROUTE_NAME,
                5,
                True,
                3,
                essential_connectivity=True,
                synthetic_hop=True,
            )
            V.add(P)

        def rebuild_components() -> list[list[str]]:
            nodes_local: set[str] = set()
            for r in edges_map.values():
                nodes_local.add(r["from"])
                nodes_local.add(r["to"])
            par = {n: n for n in nodes_local}

            def find_local(x: str) -> str:
                if par[x] != x:
                    par[x] = find_local(par[x])
                return par[x]

            def ul(a: str, b: str) -> None:
                ra, rb = find_local(a), find_local(b)
                if ra != rb:
                    par[ra] = rb

            for r in edges_map.values():
                ul(r["from"], r["to"])
            buckets: dict[str, list[str]] = {}
            for n in nodes_local:
                r = find_local(n)
                buckets.setdefault(r, []).append(n)
            return list(buckets.values())

        comps = rebuild_components()
        max_bridges = max(1, len(planet_positions))
        for _ in range(max_bridges):
            if len(comps) <= 1:
                break
            best_pair: tuple[str, str] | None = None
            best_dist = 1e18
            for i in range(len(comps)):
                for j in range(i + 1, len(comps)):
                    for u in comps[i]:
                        for v in comps[j]:
                            pu, pv = planet_positions.get(u), planet_positions.get(v)
                            if pu is None or pv is None:
                                continue
                            d = math.hypot(pu[0] - pv[0], pu[1] - pv[1])
                            if d < best_dist:
                                best_dist = d
                                best_pair = (u, v)
            if not best_pair:
                break
            u, v = best_pair
            hours = synthetic_travel_hours(best_dist, ref_ratio)
            add_edge(
                u,
                v,
                hours,
                SYNTHETIC_ROUTE_NAME,
                5,
                True,
                3,
                essential_connectivity=True,
                synthetic_hop=True,
            )
            comps = rebuild_components()

    ensure_full_connectivity()

    routes = sorted(edges_map.values(), key=lambda r: (r["name"], r["from"], r["to"]))
    OUTPUT_PATH.write_text(json.dumps({"routes": routes}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(routes)} edges to {OUTPUT_PATH}")
    print(f"Planets with position: {len(planet_lonlat)}, snap threshold {SNAP_THRESHOLD_DEG} deg")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--suggest-control-points":
        suggest_control_points_main()
    else:
        main()
