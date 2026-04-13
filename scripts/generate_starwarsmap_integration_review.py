#!/usr/bin/env python3
"""Generate StarWarsMap integration review artifacts (see module doc in repo)."""

from __future__ import annotations

import heapq
import json
import subprocess
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent

ROUTES_PATH = REPO / "sw5e-nav-computer" / "data" / "hyperspace-routes.json"
PLANETS_PATH = REPO / "sw5e-nav-computer" / "data" / "planets.json"
STARWARSMAP_HYPERLANES_PATH = (
    REPO / "sw5e-nav-computer" / "data" / "starwarsmap" / "hyperlanes_db.json"
)
STARWARSMAP_ALIASES_PATH = (
    REPO / "sw5e-nav-computer" / "data" / "starwarsmap" / "planet-name-aliases.json"
)
TIER_OVERRIDES_PATH = REPO / "sw5e-nav-computer" / "data" / "route-tier-overrides.json"
HAND_ROUTES_PATH = REPO / "sw5e-nav-computer" / "data" / "hyperspace-routes.hand.json"

OUTPUT_DIR = REPO / "scripts" / "output"
OUTPUT_JSON = OUTPUT_DIR / "starwarsmap_integration_review.json"
OUTPUT_MD = OUTPUT_DIR / "starwarsmap_integration_review.md"

GIT_SPEC = "5e1b967:sw5e-nav-computer/data/hyperspace-routes.json"
GIT_COMMIT = "5e1b967"

FIXES: dict[str, str] = {
    "Corellinan Run": "Corellian Run",
    "Way Of Schesa": "Way of Schesa",
    "Path Of The Houses": "Path of the Houses",
}

H1 = "1. Produce a concise report of all modifications already made to:"
H2 = "2. List every route-name normalization rule currently applied in the build pipeline."
H3 = "3. List every explicit planet alias currently applied and explain why."
H4 = (
    "4. Confirm whether authoritative=True only replaces edges with the exact same "
    "(from, to, name) key..."
)
H5 = (
    "5. Generate a report of all StarWarsMap route names imported that do NOT already "
    "exist by exact name in our prior hyperspace-routes.json (git 5e1b967)."
)
H6 = (
    "6. Generate a report of all local curated route names that still do not exist "
    "in StarWarsMap data."
)
H7 = (
    "7. Run a diagnostic for Coruscant -> Exegol and report: curated path exists, "
    "path worlds, named lane list, region arc, curated hop count, synthetic hop count, "
    "whether regionalAdvancedRouteFallback is still being triggered."
)

JSON_KEY_1 = H1
JSON_KEY_2 = H2
JSON_KEY_3 = H3
JSON_KEY_4 = H4
JSON_KEY_5 = H5
JSON_KEY_6 = H6
JSON_KEY_7 = H7


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def run_git(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=str(REPO),
        capture_output=True,
        text=True,
        check=False,
    )


def git_show_prior_routes_json() -> dict[str, Any]:
    r = run_git(["show", GIT_SPEC])
    if r.returncode != 0:
        raise RuntimeError(
            f"git show failed ({r.returncode}): {r.stderr.strip() or r.stdout.strip()}"
        )
    return json.loads(r.stdout)


def is_tracked_in_git(rel_posix: str) -> bool:
    return run_git(["ls-files", "--error-unmatch", rel_posix]).returncode == 0


def git_diff_stat_against(rel_posix: str, base: str = GIT_COMMIT) -> str | None:
    r = run_git(["diff", "--shortstat", base, "--", rel_posix])
    if r.returncode != 0:
        return None
    s = (r.stdout or "").strip()
    return s or None


def summarize_modifications_for_file(rel_posix: str) -> str:
    p = REPO.joinpath(*rel_posix.split("/"))
    exists = p.is_file()
    tracked = is_tracked_in_git(rel_posix)
    if not exists:
        return "File not present in the working tree at this path."
    if tracked:
        stat = git_diff_stat_against(rel_posix)
        if stat:
            return (
                f"Tracked; differs from `{GIT_COMMIT}` in the working tree: {stat}."
            )
        return (
            f"Tracked; no `git diff --shortstat {GIT_COMMIT}..HEAD` output for this path."
        )
    return (
        "Not tracked in git on this branch (untracked/ignored); present locally for "
        "StarWarsMap / hyperspace graph integration."
    )


def filter_routes_foundry_defaults(routes: list[dict]) -> list[dict]:
    max_tier = 3
    include_obscure = False
    out: list[dict] = []
    for r in routes:
        if not isinstance(r, dict):
            continue
        if r.get("essentialConnectivity"):
            out.append(r)
            continue
        t = r.get("tier", 3)
        try:
            tier = int(t)
        except (TypeError, ValueError):
            tier = 3
        if tier != tier:
            tier = 3
        tier = max(1, min(5, tier))
        if tier > max_tier:
            continue
        obscure = bool(r.get("obscure"))
        if obscure and not include_obscure:
            continue
        out.append(r)
    return out


def build_undirected_weighted_graph(
    routes: list[dict],
) -> dict[str, list[dict[str, Any]]]:
    g: dict[str, list[dict[str, Any]]] = {}
    for r in routes:
        a, b = r.get("from"), r.get("to")
        if not a or not b:
            continue
        w = float(r.get("travelTimeBase") or 0)
        edge = {
            "to": b,
            "weight": w,
            "routeName": r.get("name") or "Unnamed lane",
            "syntheticHop": bool(r.get("syntheticHop")),
            "tier": r.get("tier"),
            "essentialConnectivity": bool(r.get("essentialConnectivity")),
        }
        edge_rev = {
            "to": a,
            "weight": w,
            "routeName": r.get("name") or "Unnamed lane",
            "syntheticHop": bool(r.get("syntheticHop")),
            "tier": r.get("tier"),
            "essentialConnectivity": bool(r.get("essentialConnectivity")),
        }
        g.setdefault(str(a), []).append(edge)
        g.setdefault(str(b), []).append(edge_rev)
    return g


def dijkstra(
    graph: dict[str, list[dict[str, Any]]], start: str, end: str
) -> tuple[float | None, list[str], list[dict[str, Any]]]:
    if start not in graph or end not in graph:
        return None, [], []

    dist: dict[str, float] = {start: 0.0}
    parent: dict[str, tuple[str, dict[str, Any]] | None] = {start: None}
    heap: list[tuple[float, str]] = [(0.0, start)]
    visited: set[str] = set()

    while heap:
        d, u = heapq.heappop(heap)
        if u in visited:
            continue
        visited.add(u)
        if u == end:
            break
        if d > dist.get(u, float("inf")):
            continue
        for e in graph.get(u, []):
            v = e["to"]
            nd = d + float(e["weight"])
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                parent[v] = (u, e)
                heapq.heappush(heap, (nd, v))

    if end not in dist or end not in parent:
        return None, [], []

    path_nodes: list[str] = []
    hops: list[dict[str, Any]] = []
    cur: str | None = end
    while cur is not None:
        path_nodes.append(cur)
        p = parent.get(cur)
        if p is None:
            break
        prev, edge = p
        hops.append(
            {
                "from": prev,
                "to": cur,
                "routeName": edge["routeName"],
                "travelTimeBase": edge["weight"],
                "syntheticHop": edge["syntheticHop"],
            }
        )
        cur = prev
    path_nodes.reverse()
    hops.reverse()
    return dist[end], path_nodes, hops


def journey_arc(regions: list[str]) -> list[str]:
    collapsed: list[str] = []
    for r in regions:
        if not collapsed or collapsed[-1] != r:
            collapsed.append(r)
    seen: set[str] = set()
    arc: list[str] = []
    for r in collapsed:
        if r not in seen:
            seen.add(r)
            arc.append(r)
    return arc


def route_normalization_rules() -> list[str]:
    fixes_lines = [f"`{k}` -> `{v}`" for k, v in FIXES.items()]
    return [
        "StarWarsMap route labels (`hyperlanes_db.json` keys; also `properties.hyperspace` "
        "when checked against the authoritative set): `str(name).strip()` then apply "
        "`STARWARSMAP_ROUTE_NAME_FIXES` in `scripts/build-hyperspace-graph.py` "
        f"({', '.join(fixes_lines)}).",
        "StarWarsMap chain worlds: `str(w).strip()`; consecutive duplicates are removed.",
        "GeoJSON-derived edges store `properties.hyperspace` / vertex labels without "
        "running `normalize_starwarsmap_route_name` on the persisted edge name (that "
        "normalization is only used for membership checks against StarWarsMap keys).",
        "Planet grid keys use `normalize_grid_key` (uppercase, strip spaces, canonical "
        "`AA-12` form) for lon/lat anchoring; not a hyperspace lane label rule but part "
        "of the same build.",
        "`route-tier-overrides.json` keys and `hyperspace-routes.hand.json` names are used "
        "as authored (no automatic spelling pass).",
    ]


def authoritative_key_explanation() -> str:
    return (
        "`authoritative=True` does **not** use a literal `(from, to, name)` key. "
        "`add_edge` uses `key = tuple(sorted([a, b]) + [route_name])`, so the identity is "
        "the unordered planet pair plus the exact route name string; directional "
        "`from`/`to` order in the stored record is whatever `add_edge(a,b,...)` passed in. "
        "Authoritative writes always assign `edges_map[key]`. Non-authoritative writes "
        "keep an existing edge if its `travelTimeBase` is already <= the candidate."
    )


def planet_alias_entries() -> list[dict[str, str]]:
    doc = load_json(STARWARSMAP_ALIASES_PATH) if STARWARSMAP_ALIASES_PATH.is_file() else {}
    aliases = doc.get("aliases") if isinstance(doc, dict) else {}
    out: list[dict[str, str]] = []
    if not isinstance(aliases, dict):
        return out
    file_comment = str(doc.get("comment", "")).strip() if isinstance(doc, dict) else ""
    for k, v in sorted((str(kk), str(vv)) for kk, vv in aliases.items()):
        out.append(
            {
                "alias": k,
                "canonical": v,
                "why": (
                    f"StarWarsMap labels this world `{k}` while `planets.json` uses `{v}`."
                    + (f" JSON comment: {file_comment}" if file_comment else "")
                ),
            }
        )
    return out


def curated_route_name_union(tier_doc: dict, hand_doc: dict) -> set[str]:
    curated: set[str] = set()
    routes = tier_doc.get("routes") or {}
    if isinstance(routes, dict):
        for kk in routes.keys():
            s = str(kk)
            if s.strip():
                curated.add(s)
    for r in hand_doc.get("routes") or []:
        if isinstance(r, dict) and r.get("name"):
            s = str(r["name"])
            if s.strip():
                curated.add(s)
    return curated



def build_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = ["# StarWarsMap integration review", ""]

    lines.append(f"## {H1}")
    lines.append("")
    for row in report[JSON_KEY_1]["bullets"]:
        lines.append(f"- **{row['path']}**: {row['note']}")
    lines.append("")

    lines.append(f"## {H2}")
    lines.append("")
    for rule in report[JSON_KEY_2]["rules"]:
        lines.append(f"- {rule}")
    lines.append("")

    lines.append(f"## {H3}")
    lines.append("")
    if not report[JSON_KEY_3]["aliases"]:
        lines.append("- _(No `aliases` entries in `planet-name-aliases.json`.)_")
    else:
        for a in report[JSON_KEY_3]["aliases"]:
            lines.append(f"- **`{a['alias']}` -> `{a['canonical']}`**: {a['why']}")
    lines.append("")

    lines.append(f"## {H4}")
    lines.append("")
    lines.append(report[JSON_KEY_4]["text"])
    lines.append("")

    lines.append(f"## {H5}")
    lines.append("")
    lines.append(f"Count: **{report[JSON_KEY_5]['count']}**")
    lines.append("")
    lines.append("```")
    for item in report[JSON_KEY_5]["names"]:
        lines.append(item)
    lines.append("```")
    lines.append("")

    lines.append(f"## {H6}")
    lines.append("")
    lines.append(f"Count: **{report[JSON_KEY_6]['count']}**")
    lines.append("")
    lines.append("```")
    for item in report[JSON_KEY_6]["names"]:
        lines.append(item)
    lines.append("```")
    lines.append("")

    lines.append(f"## {H7}")
    lines.append("")
    d = report[JSON_KEY_7]
    lines.append(
        f"- **Curated path exists (lane graph under Advanced defaults):** "
        f"{d['curated_path_exists']}"
    )
    worlds = " -> ".join(d["path_worlds"]) if d["path_worlds"] else "_(none)_"
    lines.append(f"- **Path worlds:** {worlds}")
    lanes = ", ".join(d["named_lane_list"]) if d["named_lane_list"] else "_(none)_"
    lines.append(f"- **Named lane list (per hop, direction of travel):** {lanes}")
    arc = " -> ".join(str(x) for x in d["region_arc"]) if d["region_arc"] else "_(none)_"
    lines.append(f"- **Region arc (dedupe consecutive, then first-seen order):** {arc}")
    lines.append(f"- **Curated hop count:** {d['curated_hop_count']}")
    lines.append(f"- **Synthetic hop count:** {d['synthetic_hop_count']}")
    lines.append(
        f"- **regionalAdvancedRouteFallback still triggered:** "
        f"{d['regional_advanced_route_fallback_triggered']}"
    )
    lines.append("")
    lines.append(d["fallback_notes"])
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    routes_doc = load_json(ROUTES_PATH)
    routes: list[dict] = list(routes_doc.get("routes") or [])
    planets = load_json(PLANETS_PATH)
    hyperlanes = load_json(STARWARSMAP_HYPERLANES_PATH)
    tier_doc = load_json(TIER_OVERRIDES_PATH)
    hand_doc = load_json(HAND_ROUTES_PATH)

    prior_doc = git_show_prior_routes_json()
    prior_routes: list[dict] = list(prior_doc.get("routes") or [])
    prior_names_exact: set[str] = set()
    for r in prior_routes:
        n = r.get("name")
        if isinstance(n, str) and n:
            prior_names_exact.add(n)

    sm_keys_exact = (
        [str(k) for k in hyperlanes.keys()] if isinstance(hyperlanes, dict) else []
    )
    sm_key_set_exact = set(sm_keys_exact)

    sm_not_in_prior_exact = sorted(k for k in sm_key_set_exact if k not in prior_names_exact)

    curated = curated_route_name_union(tier_doc, hand_doc)
    curated_not_in_sm_exact = sorted(n for n in curated if n not in sm_key_set_exact)

    planet_region: dict[str, str] = {}
    for p in planets:
        if not isinstance(p, dict):
            continue
        nm = p.get("name")
        if not nm:
            continue
        planet_region[str(nm)] = str(p.get("region") or "Unknown")

    filtered = filter_routes_foundry_defaults(routes)
    graph = build_undirected_weighted_graph(filtered)
    start, end = "Coruscant", "Exegol"
    total_w, path_nodes, hops = dijkstra(graph, start, end)
    path_exists = total_w is not None

    lanes_per_hop = [h["routeName"] for h in hops]
    curated_hop_count = sum(1 for h in hops if not h["syntheticHop"])
    synthetic_hop_count = sum(1 for h in hops if h["syntheticHop"])
    regions_along = [planet_region.get(p, "Unknown") for p in path_nodes]
    arc = journey_arc(regions_along) if path_nodes else []

    fallback_triggered = not path_exists
    fallback_notes = (
        "`regionalAdvancedRouteFallback` in `sw5e-nav-computer/scripts/route-calculator.js` "
        "runs when hyperspace JSON cannot be loaded for the graph build, or when "
        "`aStarShortestPath` returns no solution after `filterHyperspaceRoutesForSettings`. "
        "This script does not execute Foundry; it mirrors the tier/obscure filter and runs "
        "a nonnegative shortest-path search on the same undirected edge list. If a path "
        "exists here, Advanced mode would not hit the no-path fallback for this pair "
        "unless graph data or filtering diverges."
    )

    section1_targets = [
        ("scripts/build-hyperspace-graph.py", summarize_modifications_for_file("scripts/build-hyperspace-graph.py")),
        (
            "sw5e-nav-computer/data/starwarsmap/hyperlanes_db.json",
            summarize_modifications_for_file("sw5e-nav-computer/data/starwarsmap/hyperlanes_db.json"),
        ),
        (
            "sw5e-nav-computer/data/starwarsmap/planet-name-aliases.json",
            summarize_modifications_for_file(
                "sw5e-nav-computer/data/starwarsmap/planet-name-aliases.json"
            ),
        ),
        ("README.md", summarize_modifications_for_file("README.md")),
        (
            "docs/hyperspace-coordinate-transform.md",
            summarize_modifications_for_file("docs/hyperspace-coordinate-transform.md"),
        ),
    ]

    report: dict[str, Any] = {
        JSON_KEY_1: {"bullets": [{"path": p, "note": n} for p, n in section1_targets]},
        JSON_KEY_2: {"rules": route_normalization_rules()},
        JSON_KEY_3: {"aliases": planet_alias_entries()},
        JSON_KEY_4: {"text": authoritative_key_explanation()},
        JSON_KEY_5: {"count": len(sm_not_in_prior_exact), "names": sm_not_in_prior_exact},
        JSON_KEY_6: {"count": len(curated_not_in_sm_exact), "names": curated_not_in_sm_exact},
        JSON_KEY_7: {
            "curated_path_exists": str(path_exists),
            "path_worlds": path_nodes,
            "named_lane_list": lanes_per_hop,
            "region_arc": arc,
            "curated_hop_count": curated_hop_count,
            "synthetic_hop_count": synthetic_hop_count,
            "regional_advanced_route_fallback_triggered": str(fallback_triggered),
            "total_travel_time_base": total_w,
            "hops_detail": hops,
            "regions_along_path": regions_along,
            "filter": (
                "essentialConnectivity OR (tier<=3 AND NOT obscure); "
                "maxTier=3; includeObscure=false"
            ),
            "fallback_notes": fallback_notes,
        },
        "meta": {
            "git_prior_spec": GIT_SPEC,
            "loaded_files": [
                str(ROUTES_PATH.relative_to(REPO)),
                str(PLANETS_PATH.relative_to(REPO)),
                str(STARWARSMAP_HYPERLANES_PATH.relative_to(REPO)),
                str(STARWARSMAP_ALIASES_PATH.relative_to(REPO)),
                str(TIER_OVERRIDES_PATH.relative_to(REPO)),
                str(HAND_ROUTES_PATH.relative_to(REPO)),
            ],
        },
    }

    OUTPUT_JSON.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    OUTPUT_MD.write_text(build_markdown(report), encoding="utf-8")
    print(f"Wrote {OUTPUT_JSON}")
    print(f"Wrote {OUTPUT_MD}")


if __name__ == "__main__":
    main()

