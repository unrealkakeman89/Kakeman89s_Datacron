#!/usr/bin/env python3
"""
Phase 2: Deterministic StarWarsMap planet name -> planets.json mapping (read-only).
Does not modify planets.json.

Outputs:
  scripts/output/planets_name_map.json
  scripts/output/planets_name_report.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "scripts" / "output"
DEFAULT_SW_ROOT = REPO / "StarWarsMap"
LOCAL_PLANETS = REPO / "sw5e-nav-computer" / "data" / "planets.json"

# Unicode -> ASCII (apostrophes, quotes, dashes only)
_APOSTROPHE_LIKE = (
    "\u2018\u2019\u201a\u201b\u2032\u2035\u02bc\u02b9"  # ‘ ’ ‚ ‛ ′ ‵ ʼ ʹ
)
_QUOTE_DOUBLE = "\u201c\u201d\u201e\u2033"  # “ ” „ ″
_DASH_LIKE = "\u2013\u2014\u2212\u2010\u2011"  # – — − ‐ ‑


def normalize_planet_label(s: str) -> str:
    """
    Allowed transforms only:
    - trim leading/trailing whitespace
    - collapse internal runs of whitespace to a single space
    - unicode apostrophe-like and ASCII backtick to ASCII apostrophe '
    - unicode double-quotes to ASCII "
    - en-dash / em-dash / minus variants to ASCII hyphen-minus -
    - preserve case and all other punctuation.
    """
    if not isinstance(s, str):
        s = str(s)
    t = s.strip()
    for ch in _APOSTROPHE_LIKE:
        t = t.replace(ch, "'")
    for ch in _QUOTE_DOUBLE:
        t = t.replace(ch, '"')
    for ch in _DASH_LIKE:
        t = t.replace(ch, "-")
    t = re.sub(r"\s+", " ", t)
    return t


def strip_trailing_parenthetical_disambiguation(s: str) -> str:
    """
    Remove a single trailing ' ( ... )' segment from the end only.
    Does not strip nested or internal parentheses.
    """
    return re.sub(r" \([^()]*\)$", "", s)


def load_json(path: Path, label: str) -> Any:
    if not path.is_file():
        raise FileNotFoundError(f"Missing {label}: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def collect_starwarsmap_planet_names(
    hyperlanes: dict, grid_db: dict, regions_db: dict
) -> list[str]:
    names: set[str] = set()
    for chain in hyperlanes.values():
        if isinstance(chain, list):
            for w in chain:
                if isinstance(w, str) and w.strip():
                    names.add(w)
    for cell, lst in grid_db.items():
        if not isinstance(lst, list):
            continue
        for item in lst:
            if isinstance(item, dict):
                n = item.get("name")
                if isinstance(n, str) and n.strip():
                    names.add(n)
    for _reg, sectors in regions_db.items():
        if not isinstance(sectors, dict):
            continue
        for _sec, lst in sectors.items():
            if not isinstance(lst, list):
                continue
            for item in lst:
                if isinstance(item, dict):
                    n = item.get("name")
                    if isinstance(n, str) and n.strip():
                        names.add(n)
    return sorted(names, key=lambda x: (x.lower(), x))


def classify_source_name(
    s: str,
    local_names: list[str],
    local_set: set[str],
    norm_to_locals: dict[str, list[str]],
) -> tuple[str, str | None, str]:
    """
    Returns (status, mapped_to, notes).
    """
    trimmed = s.strip()
    if trimmed in local_set:
        return "exact_match", trimmed, ""

    nt = normalize_planet_label(trimmed)
    cands = list(dict.fromkeys(norm_to_locals.get(nt, [])))
    if len(cands) == 1:
        return "normalized_match", cands[0], "matched after unicode/whitespace/dash normalization"
    if len(cands) > 1:
        return "ambiguous_match", None, "candidates: " + "; ".join(cands)

    t2 = strip_trailing_parenthetical_disambiguation(trimmed)
    if t2 != trimmed:
        if t2 in local_set:
            return "normalized_match", t2, "matched after stripping trailing parenthetical from source"
        nt2 = normalize_planet_label(t2)
        c2 = list(dict.fromkeys(norm_to_locals.get(nt2, [])))
        if len(c2) == 1:
            return "normalized_match", c2[0], (
                "matched after stripping trailing parenthetical from source "
                "then unicode/whitespace/dash normalization"
            )
        if len(c2) > 1:
            return "ambiguous_match", None, (
                "after parenthetical strip, multiple locals: " + "; ".join(c2)
            )

    return "manual_required", None, "no exact or unique normalized match"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--starwarsmap-root", type=Path, default=None)
    args = ap.parse_args()
    sw_root = args.starwarsmap_root
    if sw_root is None:
        env = os.environ.get("STARWARSMAP_ROOT")
        sw_root = Path(env) if env else DEFAULT_SW_ROOT
    sw_root = sw_root.resolve()

    hyperlanes_path = sw_root / "map_api" / "data" / "hyperlanes_db.json"
    grid_path = sw_root / "map_api" / "data" / "grid_db.json"
    regions_path = sw_root / "map_api" / "data" / "regions_db.json"

    try:
        hyperlanes = load_json(hyperlanes_path, "hyperlanes_db.json")
        grid_db = load_json(grid_path, "grid_db.json")
        regions_db = load_json(regions_path, "regions_db.json")
        planets = load_json(LOCAL_PLANETS, "planets.json")
    except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
        print(f"FATAL: {e}", file=sys.stderr)
        return 1

    if not isinstance(hyperlanes, dict) or not isinstance(grid_db, dict) or not isinstance(regions_db, dict):
        print("FATAL: unexpected StarWarsMap JSON root types", file=sys.stderr)
        return 1
    if not isinstance(planets, list):
        print("FATAL: planets.json must be an array", file=sys.stderr)
        return 1

    local_names = [p["name"] for p in planets if isinstance(p, dict) and isinstance(p.get("name"), str)]
    local_set = set(local_names)
    norm_to_locals: dict[str, list[str]] = {}
    for L in local_names:
        key = normalize_planet_label(L)
        norm_to_locals.setdefault(key, []).append(L)

    sm_names = collect_starwarsmap_planet_names(hyperlanes, grid_db, regions_db)

    matches: dict[str, dict[str, Any]] = {}
    rows: list[tuple[str, str, str, str]] = []

    stats = {
        "exact_match": 0,
        "normalized_match": 0,
        "ambiguous_match": 0,
        "manual_required": 0,
    }

    for s in sm_names:
        status, mapped, notes = classify_source_name(s, local_names, local_set, norm_to_locals)
        stats[status] += 1
        matches[s] = {"status": status, "mappedTo": mapped}
        rows.append((s, status, mapped or "", notes))

    report = {
        "metadata": {
            "generatedBy": "normalize_planet_names.py",
            "doNotEditBlindly": True,
            "starwarsmapRoot": str(sw_root),
            "sourcePlanetCount": len(sm_names),
            "localPlanetCount": len(local_names),
        },
        "matches": matches,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUT_DIR / "planets_name_map.json"
    csv_path = OUT_DIR / "planets_name_report.csv"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["source_name", "status", "mapped_to", "notes"])
        for row in rows:
            w.writerow(row)

    print("--- normalize_planet_names.py ---")
    print(f"Source planet names (unique): {len(sm_names)}")
    print(f"exact_match:           {stats['exact_match']}")
    print(f"normalized_match:      {stats['normalized_match']}")
    print(f"ambiguous_match:       {stats['ambiguous_match']}")
    print(f"manual_required:       {stats['manual_required']}")
    print(f"Wrote {json_path}")
    print(f"Wrote {csv_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
