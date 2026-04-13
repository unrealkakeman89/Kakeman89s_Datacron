#!/usr/bin/env python3
"""
Merge SW5e Nav Computer planets.json with Star Wars Galaxy Map Grid Coordinates.xlsx.

Rules:
- Every spreadsheet row (sheet "planets") becomes a planet record; name uses the sheet "Planet" cell.
- For grid, sector, region: use spreadsheet value when non-empty (after strip); otherwise use
  planets.json for that field on a case-insensitive name match.
- When both sheet and JSON have a non-empty value and they differ after normalization, sheet wins;
  those cases are listed in the merge report.
- Grid normalization: output uses hyphen form (e.g. M10 -> M-10) to match existing module data.
- JSON-only planets (no matching sheet row) are appended so nothing is dropped.
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

REPO_ROOT = Path(__file__).resolve().parent.parent
XLSX_PATH = REPO_ROOT / "Star Wars Galaxy Map Grid Coordinates.xlsx"
PLANETS_JSON = REPO_ROOT / "sw5e-nav-computer" / "data" / "planets.json"
REPORT_PATH = REPO_ROOT / "sw5e-nav-computer" / "data" / "planets-merge-report.txt"


def is_empty(val: object) -> bool:
    if val is None:
        return True
    if isinstance(val, str) and not val.strip():
        return True
    return False


def normalize_grid(raw: object) -> str | None:
    """Normalize grid to Letter-Number form (e.g. M10 -> M-10). Returns None if empty."""
    if is_empty(raw):
        return None
    t = str(raw).strip().upper()
    if re.fullmatch(r"[A-Z]+-\d+", t):
        return t
    m = re.fullmatch(r"([A-Z]+)(\d+)", t)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return t


def norm_name_key(name: object) -> str:
    return str(name).strip().casefold() if name is not None else ""


def coalesce_field(sheet_val: object, json_val: object) -> str | None:
    if not is_empty(sheet_val):
        return str(sheet_val).strip()
    if is_empty(json_val):
        return None
    return str(json_val).strip()


def main() -> None:
    if not XLSX_PATH.is_file():
        raise SystemExit(f"Missing spreadsheet: {XLSX_PATH}")
    if not PLANETS_JSON.is_file():
        raise SystemExit(f"Missing planets.json: {PLANETS_JSON}")

    with open(PLANETS_JSON, encoding="utf-8") as f:
        json_planets: list[dict] = json.load(f)

    json_by_key: dict[str, dict] = {}
    for p in json_planets:
        key = norm_name_key(p.get("name"))
        if key and key not in json_by_key:
            json_by_key[key] = p

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=1, values_only=True))
    wb.close()

    if not rows:
        raise SystemExit("Spreadsheet has no rows.")

    header = [str(c).strip() if c is not None else "" for c in rows[0]]
    expected = ["Planet", "Grid", "Sector", "Region"]
    if header[:4] != expected:
        raise SystemExit(f"Unexpected header {header[:4]}, expected {expected}")

    merged: list[dict] = []
    matched_keys: set[str] = set()
    xlsx_row_count = 0
    report_lines: list[str] = [
        "Planet merge report (sheet primary; blank sheet cells fall back to JSON).",
        "Rows where both sources had non-empty grid/sector/region and values differed (sheet value kept):",
        "",
    ]
    diff_count = 0

    for row in rows[1:]:
        if not row or is_empty(row[0]):
            continue
        xlsx_row_count += 1
        sheet_name = str(row[0]).strip()
        sheet_grid, sheet_sector, sheet_region = (
            row[1] if len(row) > 1 else None,
            row[2] if len(row) > 2 else None,
            row[3] if len(row) > 3 else None,
        )
        j = json_by_key.get(norm_name_key(sheet_name))

        if j:
            matched_keys.add(norm_name_key(sheet_name))

        jg = j.get("grid") if j else None
        js = j.get("sector") if j else None
        jr = j.get("region") if j else None

        eff_grid_raw = coalesce_field(sheet_grid, jg)
        eff_sector = coalesce_field(sheet_sector, js)
        eff_region = coalesce_field(sheet_region, jr)

        eff_grid = normalize_grid(eff_grid_raw) if eff_grid_raw else None

        if j:
            for label, s_val, j_val, eff in (
                ("grid", sheet_grid, jg, eff_grid or eff_grid_raw),
                ("sector", sheet_sector, js, eff_sector),
                ("region", sheet_region, jr, eff_region),
            ):
                if is_empty(s_val) or is_empty(j_val):
                    continue
                s_cmp = normalize_grid(s_val) if label == "grid" else str(s_val).strip()
                j_cmp = normalize_grid(j_val) if label == "grid" else str(j_val).strip()
                if label == "grid":
                    if not s_cmp:
                        s_cmp = str(s_val).strip().upper()
                    if not j_cmp:
                        j_cmp = str(j_val).strip().upper()
                if s_cmp != j_cmp:
                    diff_count += 1
                    report_lines.append(
                        f"  {sheet_name} [{label}] sheet={s_val!r} json={j_val!r} -> kept sheet (effective {eff!r})"
                    )

        rec: dict = {
            "name": sheet_name,
            "grid": eff_grid,
            "sector": eff_sector,
            "region": eff_region,
        }
        if j:
            if "coordinates" in j:
                rec["coordinates"] = j["coordinates"]
            if "type" in j:
                rec["type"] = j["type"]
            if "affiliation" in j:
                rec["affiliation"] = j["affiliation"]
            if "description" in j:
                rec["description"] = j["description"]
        merged.append(rec)

    orphans = [p for p in json_planets if norm_name_key(p.get("name")) not in matched_keys]
    for p in orphans:
        copy = dict(p)
        if copy.get("grid"):
            copy["grid"] = normalize_grid(copy["grid"])
        merged.append(copy)

    merged.sort(key=lambda x: str(x.get("name", "")).casefold())

    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup = PLANETS_JSON.with_suffix(f".json.backup-{ts}")
    shutil.copy2(PLANETS_JSON, backup)

    with open(PLANETS_JSON, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write("\n")

    if diff_count == 0:
        report_lines.append("  (none)")

    report_lines.extend(
        [
            "",
            f"Summary: xlsx data rows used={xlsx_row_count}, json input={len(json_planets)}, "
            f"output planets={len(merged)}, json-only orphans appended={len(orphans)}, "
            f"geographic disagreements logged={diff_count}.",
            f"Backup: {backup}",
        ]
    )
    REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")

    print(f"Wrote {len(merged)} planets to {PLANETS_JSON}")
    print(f"Backup: {backup}")
    print(f"Report: {REPORT_PATH}")
    print(f"JSON-only orphans appended: {len(orphans)}")
    if orphans:
        print("  " + ", ".join(str(p.get("name")) for p in orphans))


if __name__ == "__main__":
    main()
