#!/usr/bin/env python3
"""
Phase 1: Audit StarWarsMap JSON vs local module data (read-only).
Does not modify hyperspace-routes.json, planets.json, or Foundry runtime.

Default StarWarsMap root: <repo>/StarWarsMap
Override: --starwarsmap-root PATH or env STARWARSMAP_ROOT

Outputs:
  scripts/output/starwarsmap_audit_report.json
  scripts/output/starwarsmap_audit_summary.md
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "scripts" / "output"
DEFAULT_SW_ROOT = REPO / "StarWarsMap"
LOCAL_PLANETS = REPO / "kakeman89s-datacron" / "data" / "planets.json"
LOCAL_ROUTES = REPO / "kakeman89s-datacron" / "data" / "hyperspace-routes.json"


def parse_grid(grid: str | None) -> tuple[float, float] | None:
    if not grid or not isinstance(grid, str):
        return None
    t = str(grid).strip().upper().replace(" ", "")
    m = re.match(r"^([A-Z]+)-?(\d+)$", t)
    if not m:
        return None
    col = 0.0
    for ch in m.group(1):
        col = col * 26.0 + (ord(ch) - ord("A") + 1)
    row = float(m.group(2))
    return col * 8.0, row * 2.2


def local_planet_has_usable_coords(planet: dict) -> bool:
    c = planet.get("coordinates")
    if isinstance(c, dict):
        x, y = c.get("x"), c.get("y")
        if x is not None and y is not None:
            try:
                float(x)
                float(y)
                return True
            except (TypeError, ValueError):
                pass
    return parse_grid(planet.get("grid")) is not None


def load_json_strict(path: Path, label: str) -> Any:
    if not path.is_file():
        raise FileNotFoundError(f"Missing required file ({label}): {path}")
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON ({label}): {path}: {e}") from e


def analyze_hyperlanes_db(data: Any) -> dict[str, Any]:
    out: dict[str, Any] = {
        "topLevelType": type(data).__name__,
        "interpretation": None,
        "routeCount": 0,
        "valueShapes": [],
        "notes": [],
    }
    if not isinstance(data, dict):
        out["interpretation"] = "unexpected: expected object at root"
        return out
    out["routeCount"] = len(data)
    sample_keys = list(data.keys())[:5]
    out["sampleKeys"] = sample_keys
    all_lists_of_strings = True
    max_chain = 0
    for k, v in data.items():
        if not isinstance(v, list):
            all_lists_of_strings = False
            out["valueShapes"].append(f"route {k!r}: {type(v).__name__}")
            continue
        max_chain = max(max_chain, len(v))
        for i, item in enumerate(v):
            if not isinstance(item, str):
                all_lists_of_strings = False
                out["valueShapes"].append(f"route {k!r} index {i}: {type(item).__name__}")
                break
    if all_lists_of_strings and data:
        out["interpretation"] = (
            "Object mapping route name (string) -> ordered list of planet name strings; "
            "each list is an implicit path along that lane (consecutive pairs would be hops). "
            "No per-hop metadata (tier, travel time, region) at this level. "
            "Directionality is implicit: lists are ordered; bidirectional travel is not stated in file."
        )
    else:
        out["interpretation"] = "Mixed or non-list values; see valueShapes"
    out["maxChainLength"] = max_chain
    return out


def analyze_grid_db(data: Any) -> dict[str, Any]:
    out: dict[str, Any] = {
        "topLevelType": type(data).__name__,
        "interpretation": None,
        "topLevelKeyCount": 0,
        "sampleKeys": [],
        "entryFieldKeys": set(),
        "notes": [],
    }
    if not isinstance(data, dict):
        out["interpretation"] = "unexpected: expected object at root"
        return out
    out["topLevelKeyCount"] = len(data)
    keys = list(data.keys())[:8]
    out["sampleKeys"] = keys
    for k in keys:
        v = data.get(k)
        if isinstance(v, list) and v:
            first = v[0]
            if isinstance(first, dict):
                out["entryFieldKeys"].update(first.keys())
            break
    out["entryFieldKeys"] = sorted(out["entryFieldKeys"])
    out["interpretation"] = (
        "Object mapping grid cell id (e.g. 'K-9') -> list of planet records. "
        "Each record typically has name, coords ([x,y] floats in map space), is_canon. "
        "This is not the same keying as hyperlanes_db (planet names vs grid cells)."
    )
    return out


def analyze_regions_db(data: Any) -> dict[str, Any]:
    out: dict[str, Any] = {
        "topLevelType": type(data).__name__,
        "interpretation": None,
        "regionCount": 0,
        "sampleRegions": [],
        "sectorEntryFields": set(),
        "notes": [],
    }
    if not isinstance(data, dict):
        out["interpretation"] = "unexpected: expected object at root"
        return out
    out["regionCount"] = len(data)
    reg_keys = list(data.keys())[:5]
    out["sampleRegions"] = reg_keys
    for reg in reg_keys:
        inner = data.get(reg)
        if isinstance(inner, dict) and inner:
            sk = next(iter(inner.keys()))
            lst = inner.get(sk)
            if isinstance(lst, list) and lst and isinstance(lst[0], dict):
                out["sectorEntryFields"].update(lst[0].keys())
            break
    out["sectorEntryFields"] = sorted(out["sectorEntryFields"])
    out["interpretation"] = (
        "Object mapping region name -> object mapping sector name -> list of planet records "
        "(name, coords, is_canon). Independent hierarchy from hyperlanes_db."
    )
    return out


def flatten_grid_db_planets(grid_db: dict) -> dict[str, list[dict[str, Any]]]:
    """planet name -> list of occurrences (grid cell + coords validity)."""
    by_name: dict[str, list[dict[str, Any]]] = {}
    for cell, lst in grid_db.items():
        if not isinstance(lst, list):
            continue
        for item in lst:
            if not isinstance(item, dict):
                continue
            name = item.get("name")
            if not isinstance(name, str) or not name.strip():
                continue
            coords = item.get("coords")
            valid_coords = (
                isinstance(coords, list)
                and len(coords) >= 2
                and all(isinstance(coords[i], (int, float)) for i in range(2))
            )
            by_name.setdefault(name, []).append(
                {
                    "gridCell": cell,
                    "coords": coords if valid_coords else None,
                    "hasValidCoords": bool(valid_coords),
                }
            )
    return by_name


def collect_hyperlane_planets(hyperlanes: dict) -> set[str]:
    names: set[str] = set()
    for chain in hyperlanes.values():
        if not isinstance(chain, list):
            continue
        for w in chain:
            if isinstance(w, str) and w.strip():
                names.add(w)
    return names


def main() -> int:
    ap = argparse.ArgumentParser(description="StarWarsMap topology source audit (read-only).")
    ap.add_argument(
        "--starwarsmap-root",
        type=Path,
        default=None,
        help="Directory containing map_api/data/ (default: STARWARSMAP_ROOT env or <repo>/StarWarsMap)",
    )
    args = ap.parse_args()
    sw_root = args.starwarsmap_root
    if sw_root is None:
        env = os.environ.get("STARWARSMAP_ROOT")
        sw_root = Path(env) if env else DEFAULT_SW_ROOT
    sw_root = sw_root.resolve()

    hyperlanes_path = sw_root / "map_api" / "data" / "hyperlanes_db.json"
    grid_path = sw_root / "map_api" / "data" / "grid_db.json"
    regions_path = sw_root / "map_api" / "data" / "regions_db.json"

    failure: str | None = None
    metadata: dict[str, Any] = {
        "generatedBy": "starwarsmap_audit.py",
        "starwarsmapRoot": str(sw_root),
        "sourceFilesInspected": [],
        "safeForImportPlanning": False,
    }
    schemas: dict[str, Any] = {}
    counts: dict[str, Any] = {
        "starwarsmapPlanetsReferenced": 0,
        "starwarsmapUniqueLaneNames": 0,
        "localPlanets": 0,
        "localRouteSegments": 0,
        "missingPlanetExactMatches": 0,
        "missingLaneNameExactMatches": 0,
        "localPlanetsWithoutCoords": 0,
        "sourcePlanetsWithoutCoords": 0,
    }
    examples: dict[str, Any] = {"sampleLaneNames": [], "sampleUnmatchedPlanetNames": [], "sampleUnmatchedLaneNames": []}
    notes: list[str] = []

    hyperlanes: dict[str, Any] = {}
    grid_db: dict[str, Any] = {}
    regions_db: dict[str, Any] = {}
    local_planets: list = []
    local_routes: list = []

    try:
        for p, label in (
            (hyperlanes_path, "hyperlanes_db.json"),
            (grid_path, "grid_db.json"),
            (regions_path, "regions_db.json"),
            (LOCAL_PLANETS, "planets.json"),
            (LOCAL_ROUTES, "hyperspace-routes.json"),
        ):
            load_json_strict(p, label)
            metadata["sourceFilesInspected"].append(str(p))

        hyperlanes = load_json_strict(hyperlanes_path, "hyperlanes_db.json")
        grid_db = load_json_strict(grid_path, "grid_db.json")
        regions_db = load_json_strict(regions_path, "regions_db.json")
        local_planets = load_json_strict(LOCAL_PLANETS, "planets.json")
        local_routes_data = load_json_strict(LOCAL_ROUTES, "hyperspace-routes.json")

        if not isinstance(local_planets, list):
            raise ValueError("planets.json root must be an array")
        local_routes = local_routes_data.get("routes") if isinstance(local_routes_data, dict) else None
        if not isinstance(local_routes, list):
            raise ValueError("hyperspace-routes.json must contain object.routes array")

        if not isinstance(hyperlanes, dict):
            raise ValueError("hyperlanes_db.json root must be an object")
        if not isinstance(grid_db, dict):
            raise ValueError("grid_db.json root must be an object")
        if not isinstance(regions_db, dict):
            raise ValueError("regions_db.json root must be an object")

        schemas["hyperlanes_db"] = analyze_hyperlanes_db(hyperlanes)
        schemas["grid_db"] = analyze_grid_db(grid_db)
        schemas["regions_db"] = analyze_regions_db(regions_db)

        sm_planets = collect_hyperlane_planets(hyperlanes)
        sm_lane_names = {str(k) for k in hyperlanes.keys()}
        local_names = {p["name"] for p in local_planets if isinstance(p, dict) and p.get("name")}
        local_route_names = {
            str(r["name"])
            for r in local_routes
            if isinstance(r, dict) and isinstance(r.get("name"), str) and r["name"].strip()
        }

        missing_planets = sorted(sm_planets - local_names)
        missing_lane_names = sorted(sm_lane_names - local_route_names)

        local_without_coords = sum(
            1 for p in local_planets if isinstance(p, dict) and p.get("name") and not local_planet_has_usable_coords(p)
        )

        grid_by_planet = flatten_grid_db_planets(grid_db)
        sm_source_without_coords = 0
        for name in sm_planets:
            occ = grid_by_planet.get(name)
            if not occ:
                sm_source_without_coords += 1
            elif not any(o.get("hasValidCoords") for o in occ):
                sm_source_without_coords += 1

        counts = {
            "starwarsmapPlanetsReferenced": len(sm_planets),
            "starwarsmapUniqueLaneNames": len(sm_lane_names),
            "localPlanets": len(local_names),
            "localRouteSegments": len(local_routes),
            "missingPlanetExactMatches": len(missing_planets),
            "missingLaneNameExactMatches": len(missing_lane_names),
            "localPlanetsWithoutCoords": local_without_coords,
            "sourcePlanetsWithoutCoords": sm_source_without_coords,
        }

        examples["sampleLaneNames"] = sorted(sm_lane_names)[:15]
        examples["sampleUnmatchedPlanetNames"] = missing_planets[:25]
        examples["sampleUnmatchedLaneNames"] = missing_lane_names[:25]

        metadata["safeForImportPlanning"] = True
        notes.append(
            "All five JSON files parsed; hyperlanes_db/grid_db/regions_db match expected top-level types."
        )
    except (FileNotFoundError, ValueError, OSError, json.JSONDecodeError) as e:
        failure = str(e)
        metadata["error"] = failure
        notes.append(f"Audit aborted: {failure}")

    report = {
        "metadata": metadata,
        "schemas": schemas,
        "counts": counts,
        "examples": examples,
        "notes": notes,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUT_DIR / "starwarsmap_audit_report.json"
    md_path = OUT_DIR / "starwarsmap_audit_summary.md"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # --- Markdown summary ---
    md_lines = [
        "# StarWarsMap audit summary (Phase 1)",
        "",
        f"**StarWarsMap root:** `{metadata.get('starwarsmapRoot', '')}`",
        "",
        "## Source files",
        "",
        "| File | Role |",
        "|------|------|",
        "| `map_api/data/hyperlanes_db.json` | Route name → ordered list of planet names along that lane (implicit path). |",
        "| `map_api/data/grid_db.json` | Grid cell id → list of planets with `name`, map `coords`, `is_canon`. |",
        "| `map_api/data/regions_db.json` | Region → sector → planet entries with `coords`. |",
        "",
        "## Schema (inspected)",
        "",
        "### hyperlanes_db",
        "",
        "```json",
        json.dumps(schemas.get("hyperlanes_db", {}), indent=2, ensure_ascii=False),
        "```",
        "",
        "### grid_db",
        "",
        "```json",
        json.dumps(schemas.get("grid_db", {}), indent=2, ensure_ascii=False),
        "```",
        "",
        "### regions_db",
        "",
        "```json",
        json.dumps(schemas.get("regions_db", {}), indent=2, ensure_ascii=False),
        "```",
        "",
        "## Counts (exact string matching for cross-file comparisons)",
        "",
        "| Metric | Value |",
        "|--------|-------|",
    ]
    for k, v in counts.items():
        md_lines.append(f"| {k} | {v} |")
    md_lines += [
        "",
        "## What appears safe to import (topology-only mindset)",
        "",
        "- **Ordered lane chains** from `hyperlanes_db.json`: route label + sequence of world names is explicit and stable input for consecutive-hop topology.",
        "- **No runtime coupling**: files are plain JSON suitable for build-time consumption only.",
        "",
        "## What appears unsafe or ambiguous",
        "",
        "- **Planet name drift**: hyperlanes reference names that may not match `planets.json` exactly (see `missingPlanetExactMatches`).",
        "- **Lane name drift**: StarWarsMap route keys may not match `hyperspace-routes.json` `name` field exactly (see `missingLaneNameExactMatches`).",
        "- **Coordinate systems**: `grid_db` / `regions_db` use map `coords`; local module uses `coordinates` / `grid` in `planets.json` — different spaces; not merged in this audit.",
        "- **Directionality**: hyperlanes are ordered lists; bidirectional edges are not stated in the file (module graph typically duplicates both directions at build time).",
        "",
        "## Likely Phase 2 reconciliation issues",
        "",
        "- Name normalization / alias tables (explicitly out of scope for Phase 1).",
        "- Merging or choosing authority when GeoJSON and StarWarsMap disagree on the same route label.",
        "- Mapping StarWarsMap `coords` to travel times or tiers (explicitly out of scope for Phase 1).",
        "",
        "## Suitability as topology authority for named lanes",
        "",
        "StarWarsMap `hyperlanes_db.json` is **well-suited as a topology authority for named lanes** in the sense that it encodes **which worlds lie on which named route in order**. ",
        "Operational use still requires reconciliation to local planet names and a build-time policy for lane metadata (times, tiers), which this phase does not perform.",
        "",
        "## Notes",
        "",
    ]
    for n in notes:
        md_lines.append(f"- {n}")
    if failure:
        md_lines.append(f"- **Failure:** {failure}")

    md_path.write_text("\n".join(md_lines), encoding="utf-8")

    # Console summary
    print("--- starwarsmap_audit.py ---")
    if failure:
        print(f"STATUS: FAILED — {failure}")
        print(f"JSON: {json_path}")
        print(f"MD:   {md_path}")
        return 1

    print("STATUS: OK")
    print(f"StarWarsMap unique lane names (source): {counts['starwarsmapUniqueLaneNames']}")
    print(f"StarWarsMap planets referenced (unique): {counts['starwarsmapPlanetsReferenced']}")
    print(f"Missing exact planet matches (SM -> local): {counts['missingPlanetExactMatches']}")
    print(f"Missing exact lane name matches (SM -> local routes): {counts['missingLaneNameExactMatches']}")
    print(f"JSON: {json_path}")
    print(f"MD:   {md_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
