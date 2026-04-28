#!/usr/bin/env python3
"""
Verify hyperspace route data, graph connectivity, and route sanity diagnostics.
Run from repo root: python scripts/validate-hyperspace-routes.py

Writes: scripts/output/hyperspace_validation_report.json
Fails on: malformed data, invalid endpoints, missing required fields,
         disconnected graph when essentialConnectivity edges are included.

Optional: set HYPERSPACE_VALIDATION_FULL_LONG_SPAN=1 to embed every long-span
warning pair in the JSON (default: summary + capped sample only).
"""

from __future__ import annotations

import heapq
import json
import math
import os
import re
import sys
from collections import deque
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
PLANETS_PATH = REPO / "kakeman89s-datacron" / "data" / "planets.json"
ROUTES_PATH = REPO / "kakeman89s-datacron" / "data" / "hyperspace-routes.json"
OUT_REPORT = REPO / "scripts" / "output" / "hyperspace_validation_report.json"

# Must match kakeman89s-datacron/scripts/route-calculator.js REGION_ORDER
REGION_ORDER = [
    "Deep Core",
    "Core",
    "Colonies",
    "Inner Rim",
    "Expansion Region",
    "Mid Rim",
    "Outer Rim",
    "Wild Space",
    "Unknown Regions",
]

REQUIRED_EDGE_KEYS = ("from", "to", "name", "travelTimeBase")


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


def planet_has_parseable_xy(p: dict) -> bool:
    if p.get("coordinates") and isinstance(p["coordinates"], dict):
        cx = p["coordinates"].get("x")
        cy = p["coordinates"].get("y")
        if cx is not None and cy is not None:
            return True
    return parse_grid(p.get("grid")) is not None


def region_index(region: str | None) -> int:
    if not region:
        return -1
    try:
        return REGION_ORDER.index(region)
    except ValueError:
        return -1


def region_ring_distance(r0: str | None, r1: str | None) -> int | None:
    i0, i1 = region_index(r0), region_index(r1)
    if i0 < 0 or i1 < 0:
        return None
    return abs(i0 - i1)


def count_components(nodes: set[str], edges: list[tuple[str, str]]) -> int:
    if not nodes:
        return 0
    adj: dict[str, list[str]] = {n: [] for n in nodes}
    for a, b in edges:
        if a in adj and b in adj:
            adj[a].append(b)
            adj[b].append(a)
    seen: set[str] = set()
    comps = 0
    for n in nodes:
        if n in seen:
            continue
        comps += 1
        q = deque([n])
        seen.add(n)
        while q:
            u = q.popleft()
            for v in adj.get(u, []):
                if v not in seen:
                    seen.add(v)
                    q.append(v)
    return comps


def filter_pathfinding_routes(routes: list[dict]) -> list[dict]:
    """Match hyperspace-routes.js filterHyperspaceRoutesForSettings defaults."""
    safe_max = 3
    include_obscure = False
    out = []
    for r in routes:
        if r.get("essentialConnectivity"):
            out.append(r)
            continue
        t = int(r.get("tier") or 3)
        if t > safe_max:
            continue
        if r.get("obscure") and not include_obscure:
            continue
        out.append(r)
    return out


def build_dijkstra_graph(routes: list[dict]) -> dict[str, list[tuple[str, float, dict]]]:
    """Adjacency: u -> list of (v, weight, edge_meta)."""
    g: dict[str, list[tuple[str, float, dict]]] = {}
    for r in routes:
        a, b = r.get("from"), r.get("to")
        if not a or not b:
            continue
        w = float(r.get("travelTimeBase") or 0)
        meta = {
            "routeName": r.get("name"),
            "syntheticHop": bool(r.get("syntheticHop")),
        }
        g.setdefault(a, []).append((b, w, meta))
        g.setdefault(b, []).append((a, w, meta))
    return g


def dijkstra_sssp(
    graph: dict[str, list[tuple[str, float, dict]]], start: str
) -> tuple[dict[str, float], dict[str, tuple[str, dict]]]:
    """Single-source shortest paths; prev[v] = (u, edge_meta) for tree edge u->v."""
    if start not in graph:
        return {}, {}
    dist: dict[str, float] = {start: 0.0}
    prev: dict[str, tuple[str, dict]] = {}
    pq: list[tuple[float, str]] = [(0.0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, math.inf) + 1e-9:
            continue
        for v, w, meta in graph.get(u, []):
            nd = d + w
            if nd < dist.get(v, math.inf) - 1e-9:
                dist[v] = nd
                prev[v] = (u, meta)
                heapq.heappush(pq, (nd, v))
    return dist, prev


def reconstruct_path(
    start: str, end: str, prev: dict[str, tuple[str, dict]]
) -> tuple[list[str], list[dict]] | None:
    if end == start:
        return [start], []
    if end not in prev:
        return None
    path_nodes: list[str] = []
    edges_used: list[dict] = []
    cur = end
    while cur != start:
        p = prev.get(cur)
        if not p:
            return None
        u, meta = p
        path_nodes.append(cur)
        edges_used.append(meta)
        cur = u
    path_nodes.append(start)
    path_nodes.reverse()
    edges_used.reverse()
    return path_nodes, edges_used


def dijkstra(
    graph: dict[str, list[tuple[str, float, dict]]], start: str, end: str
) -> tuple[float | None, list[str], list[dict]]:
    if start not in graph or end not in graph:
        return None, [], []
    dist, prev = dijkstra_sssp(graph, start)
    if end not in dist:
        return None, [], []
    rec = reconstruct_path(start, end, prev)
    if not rec:
        return None, [], []
    path_nodes, edges_used = rec
    return dist[end], path_nodes, edges_used


def regions_along_path(region_by: dict[str, str | None], path: list[str]) -> list[str]:
    seq: list[str] = []
    for name in path:
        r = region_by.get(name)
        if r and (not seq or seq[-1] != r):
            seq.append(r)
    return seq


def journey_arc_unique_ordered(regions: list[str]) -> list[str]:
    collapsed: list[str] = []
    for r in regions:
        if r and (not collapsed or collapsed[-1] != r):
            collapsed.append(r)
    seen: set[str] = set()
    out: list[str] = []
    for r in collapsed:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def intermediate_region_categories(arc: list[str]) -> list[str]:
    if len(arc) <= 2:
        return []
    return arc[1:-1]


def any_hop_bridges_core_and_unknown_worlds(
    path: list[str], region_by: dict[str, str | None]
) -> bool:
    for u, v in zip(path, path[1:]):
        ru, rv = region_by.get(u), region_by.get(v)
        if ru == "Core" and rv == "Unknown Regions":
            return True
        if rv == "Core" and ru == "Unknown Regions":
            return True
    return False


def run_coruscant_exegol_diagnostics(
    routes: list[dict], region_by: dict[str, str | None]
) -> dict[str, Any]:
    filtered = filter_pathfinding_routes(routes)
    g = build_dijkstra_graph(filtered)
    dist, path, edges = dijkstra(g, "Coruscant", "Exegol")
    fallback = dist is None
    total_hops = len(edges)
    synth = sum(1 for e in edges if e.get("syntheticHop"))
    curated = total_hops - synth
    curated_lane_path_exists = not fallback and curated > 0
    only_synthetic_on_filtered = not fallback and curated == 0 and total_hops > 0
    regions_seq = regions_along_path(region_by, path) if path else []
    arc = journey_arc_unique_ordered(regions_seq)
    inter = intermediate_region_categories(arc)
    lanes = [e.get("routeName") for e in edges]
    hop_core_unknown = (
        any_hop_bridges_core_and_unknown_worlds(path, region_by) if path else False
    )

    warnings: list[str] = []
    if fallback:
        warnings.append(
            "only_fallback_or_no_path_on_filtered_graph: Advanced mode would use "
            "regionalAdvancedRouteFallback (or show no path) for this pair."
        )
    elif only_synthetic_on_filtered:
        warnings.append(
            "filtered_graph_path_uses_only_synthetic_hops: no named curated lane edges on shortest path."
        )

    if not fallback:
        if curated_lane_path_exists and hop_core_unknown:
            warnings.append(
                "curated_path_includes_single_hop_core_world_to_unknown_world: "
                "at least one hop connects a Core world to an Unknown Regions world."
            )
        if curated_lane_path_exists and len(arc) >= 2 and arc[0] == "Core" and arc[-1] == "Unknown Regions":
            if len(inter) < 1:
                warnings.append(
                    "curated_path_core_to_unknown_no_intermediate_region: ordered region arc lacks "
                    "intermediate categories between Core and Unknown Regions."
                )
        if total_hops == 1:
            warnings.append(
                "single_hop_graph_path_without_fallback: shortest path is one hop on filtered graph."
            )
        oreg, dreg = region_by.get("Coruscant"), region_by.get("Exegol")
        rd = region_ring_distance(oreg, dreg)
        if rd is not None and rd >= 3:
            if total_hops == 1:
                warnings.append(
                    f"long_region_span_single_hop: endpoints differ by {rd} region rings but path has 1 hop."
                )
            if len(inter) < 2:
                warnings.append(
                    f"long_region_span_few_intermediates: ring_distance={rd} but fewer than 2 "
                    "intermediate region categories in ordered arc."
                )

    return {
        "origin": "Coruscant",
        "destination": "Exegol",
        "fallbackWouldBeTriggered": fallback,
        "onlySyntheticHopsOnFilteredPath": only_synthetic_on_filtered,
        "curatedLanePathExists": curated_lane_path_exists,
        "totalHopCount": total_hops,
        "curatedHopCount": curated,
        "syntheticHopCount": synth,
        "orderedRegionArc": arc,
        "namedLaneListPerHop": lanes,
        "anyHopConnectsCoreWorldToUnknownWorld": hop_core_unknown,
        "warnings": warnings,
    }


def long_span_ring_sanity_flags(
    routes: list[dict],
    region_by: dict[str, str | None],
    graph_nodes: set[str],
) -> tuple[int, list[dict]]:
    """
    For every unordered pair of graph worlds whose regions both appear in REGION_ORDER
    and differ by >= 3 rings: if a filtered-graph path exists, warn on single-hop paths
    or arcs with fewer than two intermediate region categories.
    """
    filtered = filter_pathfinding_routes(routes)
    g = build_dijkstra_graph(filtered)
    nodes_sorted = sorted(n for n in graph_nodes if n in g)
    pairs_checked = 0
    flags: list[dict] = []
    for i, a in enumerate(nodes_sorted):
        ra = region_by.get(a)
        if region_index(ra) < 0:
            continue
        _dist, prev = dijkstra_sssp(g, a)
        for b in nodes_sorted[i + 1 :]:
            rb = region_by.get(b)
            rd = region_ring_distance(ra, rb)
            if rd is None or rd < 3:
                continue
            pairs_checked += 1
            if b not in _dist:
                continue
            rec = reconstruct_path(a, b, prev)
            if not rec:
                continue
            path, edges = rec
            issues: list[str] = []
            if len(edges) == 1:
                issues.append("single_hop_on_filtered_graph")
            arc = journey_arc_unique_ordered(regions_along_path(region_by, path))
            inter = intermediate_region_categories(arc)
            if len(inter) < 2:
                issues.append("fewer_than_two_intermediate_region_categories")
            if issues:
                flags.append(
                    {
                        "pair": [a, b],
                        "ringDistance": rd,
                        "hopCount": len(edges),
                        "orderedRegionArc": arc,
                        "intermediateRegionCategories": inter,
                        "issues": issues,
                    }
                )
    return pairs_checked, flags


LONG_SPAN_FULL_REPORT_ENV = "HYPERSPACE_VALIDATION_FULL_LONG_SPAN"
LONG_SPAN_SAMPLE_CAP = 150


def summarize_long_span_flags(flags: list[dict]) -> dict[str, Any]:
    single = sum(1 for f in flags if "single_hop_on_filtered_graph" in f.get("issues", []))
    few_int = sum(
        1 for f in flags if "fewer_than_two_intermediate_region_categories" in f.get("issues", [])
    )
    return {
        "flaggedPairCount": len(flags),
        "pairsWithSingleHopIssue": single,
        "pairsWithFewIntermediatesIssue": few_int,
    }


def main() -> int:
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)

    errors: list[str] = []
    try:
        planets = json.loads(PLANETS_PATH.read_text(encoding="utf-8"))
        data = json.loads(ROUTES_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"validate-hyperspace-routes: FAILED — {e}", file=sys.stderr)
        OUT_REPORT.write_text(
            json.dumps({"ok": False, "errors": [str(e)]}, indent=2) + "\n",
            encoding="utf-8",
        )
        return 1

    if not isinstance(planets, list):
        errors.append("planets.json root must be an array")
    if not isinstance(data, dict) or not isinstance(data.get("routes"), list):
        errors.append("hyperspace-routes.json must be an object with routes array")

    names: set[str] = set()
    region_by: dict[str, str | None] = {}
    if isinstance(planets, list):
        for p in planets:
            if isinstance(p, dict) and p.get("name"):
                names.add(p["name"])
                region_by[p["name"]] = p.get("region")

    routes: list[dict] = data.get("routes") if isinstance(data, dict) else []

    for i, r in enumerate(routes):
        if not isinstance(r, dict):
            errors.append(f"routes[{i}]: not an object")
            continue
        for key in REQUIRED_EDGE_KEYS:
            if key not in r:
                errors.append(f"routes[{i}]: missing required field {key!r}")
        for key in ("from", "to"):
            if key in r and r[key] not in names:
                errors.append(f"routes[{i}] {key}={r[key]!r} — not in planets.json")
        if "travelTimeBase" in r:
            try:
                float(r["travelTimeBase"])
            except (TypeError, ValueError):
                errors.append(f"routes[{i}]: travelTimeBase not numeric")

    total_planets = len(planets) if isinstance(planets, list) else 0
    planets_with_coords = (
        sum(1 for p in planets if isinstance(p, dict) and p.get("name") and planet_has_parseable_xy(p))
        if isinstance(planets, list)
        else 0
    )

    graph_nodes: set[str] = set()
    all_edges: list[tuple[str, str]] = []
    non_essential_edges: list[tuple[str, str]] = []
    named_curated = 0
    synthetic_count = 0
    essential_count = 0

    for r in routes:
        if not isinstance(r, dict):
            continue
        a, b = r.get("from"), r.get("to")
        if not a or not b:
            continue
        graph_nodes.add(a)
        graph_nodes.add(b)
        all_edges.append((a, b))
        if not r.get("essentialConnectivity"):
            non_essential_edges.append((a, b))
        if r.get("syntheticHop"):
            synthetic_count += 1
        if r.get("essentialConnectivity"):
            essential_count += 1
        if not r.get("syntheticHop"):
            named_curated += 1

    components_with_essential = count_components(graph_nodes, all_edges)
    components_without_essential = count_components(graph_nodes, non_essential_edges)

    connectivity_ok = components_with_essential == 1 and len(graph_nodes) > 0
    if len(routes) > 0 and len(graph_nodes) == 0:
        errors.append("Routes present but no valid from/to endpoints were collected for the graph.")
    if len(graph_nodes) > 0 and components_with_essential != 1:
        errors.append(
            f"Graph with all edges (including essentialConnectivity) has {components_with_essential} "
            f"components; expected exactly 1."
        )

    coruscant_report = run_coruscant_exegol_diagnostics(routes, region_by)
    long_span_checked, long_span_flags = long_span_ring_sanity_flags(routes, region_by, graph_nodes)

    report: dict[str, Any] = {
        "ok": len(errors) == 0,
        "counts": {
            "totalPlanetsInPlanetsJson": total_planets,
            "planetsWithUsableCoordinatesOrGrid": planets_with_coords,
            "planetsReferencedByGraphEdges": len(graph_nodes),
            "totalRouteSegments": len(routes),
            "namedCuratedEdges": named_curated,
            "syntheticHopEdges": synthetic_count,
            "essentialConnectivityEdges": essential_count,
            "connectedComponentsIncludingEssential": components_with_essential,
            "connectedComponentsExcludingEssentialConnectivity": components_without_essential,
        },
        "connectivity": {
            "singleComponentWithEssential": connectivity_ok,
        },
        "diagnostics": {
            "coruscantToExegol": coruscant_report,
            "longSpanRingDifferenceAtLeast3": {
                "pairsWithRingDistanceAtLeast3Checked": long_span_checked,
                "summary": summarize_long_span_flags(long_span_flags),
                "flaggedPairsSample": long_span_flags[:LONG_SPAN_SAMPLE_CAP],
                **(
                    {"flaggedPairsFull": long_span_flags}
                    if os.environ.get(LONG_SPAN_FULL_REPORT_ENV, "").strip() in ("1", "true", "yes")
                    else {}
                ),
            },
        },
        "errors": errors,
    }

    OUT_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if errors:
        print("validate-hyperspace-routes: FAILED", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        print(f"Report: {OUT_REPORT}")
        return 1

    print("validate-hyperspace-routes: OK")
    c = report["counts"]
    print(f"  Planets: {c['totalPlanetsInPlanetsJson']} total, {c['planetsWithUsableCoordinatesOrGrid']} with coords/grid")
    print(f"  Graph worlds: {c['planetsReferencedByGraphEdges']}, segments: {c['totalRouteSegments']}")
    print(
        f"  Edges: curated (non-synthetic) {c['namedCuratedEdges']}, "
        f"syntheticHop {c['syntheticHopEdges']}, essentialConnectivity {c['essentialConnectivityEdges']}"
    )
    print(
        f"  Components: with essential {c['connectedComponentsIncludingEssential']}, "
        f"without essential {c['connectedComponentsExcludingEssentialConnectivity']}"
    )
    ce = coruscant_report
    print(
        f"  Coruscant->Exegol: fallback={ce['fallbackWouldBeTriggered']}, "
        f"curatedPath={ce['curatedLanePathExists']}, hops={ce['totalHopCount']}, "
        f"curated={ce['curatedHopCount']}, synthetic={ce['syntheticHopCount']}"
    )
    if ce.get("warnings"):
        print(f"  Coruscant->Exegol warnings ({len(ce['warnings'])}):")
        for w in ce["warnings"]:
            print(f"    - {w}")
    ls = report["diagnostics"]["longSpanRingDifferenceAtLeast3"]
    summ = ls["summary"]
    print(
        f"  Long-span sanity (ring>=3): checked {ls['pairsWithRingDistanceAtLeast3Checked']} pairs, "
        f"{summ['flaggedPairCount']} flagged (sample {len(ls['flaggedPairsSample'])} in JSON; "
        f"set {LONG_SPAN_FULL_REPORT_ENV}=1 for full list)"
    )
    print(f"Report: {OUT_REPORT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
