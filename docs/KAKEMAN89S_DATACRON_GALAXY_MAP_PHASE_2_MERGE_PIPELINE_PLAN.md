# Galaxy Map GM-2 Plan: Offline Merge Pipeline

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_2_MERGE_PIPELINE.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-2 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-2 until authorized. GM-1 schemas must exist.

## 2. Purpose

Build an offline Python (or Node) merge that emits Galaxy Map catalogs from existing sources without calling the network at runtime. Foundry still does not consume a full catalog until GM-6.

## 3. Prerequisites

- GM-1 schemas accepted.
- GM-0 identity rules accepted.
- Decision GM-C recorded if `planets.csv` is still absent.

## 4. Scope

- Ingest: parzivail/root JSON, xlsx if needed, `grid_db.json`, `regions_db.json`, `hyperlanes_db.json`, module `planets.json`, `planet-name-aliases.json`, optional `planets.csv`.
- CSV decoder follows StarWarsMap `json_from_csv.py` columns (name=3, sector=1, grid=6, x/y=7:9, region=10, canon=11). Do not port Flask.
- Apply authority ranking (program master §5.2).
- Emit conflict/unmatched/skipped-duplicate reports.
- Write `kakeman89s-datacron/data/galaxymap/planets.v1.json` and a topology-only `hyperlanes.v1.json` (chords or empty `displayPolyline` until GM-4).
- Do not fetch CARTO, GitHub, or Wookieepedia.

## 5. Non-goals

- JPEG affine (GM-3)
- GeoJSON curve fitting (GM-4)
- Foundry UI
- Replacing NavComputer `planets.json`
- Synthetic hop generation (record compare only unless GM-0 already required a rebuild; hop rebuild is GM-9)

## 6. Locked merge rules

1. Placement `position.x/y` from StarWarsMap cartesian when present; `z = 0`. `placementConfidence: cartesian`.
2. If cartesian missing: optional parzivail `X+SubGridX` / `Y+SubGridY` mapped through `GRID_*` * `GRID_SIDE`; `placementConfidence: subgrid-fallback`.
3. Else `unplaced` and omit from default render later.
4. Labels: prefer parzivail/module grid/sector/region when they disagree with StarWarsMap grid strings; keep both in the conflict report.
5. `isCanon` from StarWarsMap/CSV.
6. Lane `stopIds` resolved through aliases (`Kailor V` → `Kailor` already documented). Unresolved stops go to a lane-gap report, not silent drop without a report line.
7. Normalize lane display names; keep `sourceName`.

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 2.1 | Readers for each source; fail with a named error if a required JSON is missing | error string |
| 2.2 | Name matcher + alias file | Kailor V / Corellinan Run cases |
| 2.3 | Planet merge + conflict JSON/MD report | Coruscant K-9 vs L-9 listed |
| 2.4 | Hyperlane stop resolution | 60 keys; unresolved stop list |
| 2.5 | Write versioned JSON validating against GM-1 schema | Node validator |
| 2.6 | Implementation report | no Foundry required |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `scripts/galaxymap/**` or `scripts/merge-galaxymap.py` | Offline pipeline |
| `kakeman89s-datacron/data/galaxymap/planets.v1.json` | Generated catalog |
| `kakeman89s-datacron/data/galaxymap/hyperlanes.v1.json` | Topology (display may be chords) |
| `scripts/output/galaxymap-gm2-conflicts.md` | Report |
| Optional: `StarWarsMap/map_api/data/planets.csv` | Only if Decision GM-C vendors it; still not in `module.json` |
| GM-2 implementation report | Create |

Do not modify AstroCom ingest, NavComputer matrix, Shipyard, or `.cursor/`.

## 9. Node / automated checks

- Output validates vs GM-1 schema
- Coruscant present with cartesian `[0,0]` (or scaled equivalent only if GM-3 already ran; GM-2 should keep native units and leave scaling to GM-3 unless the schema stores both — **lock: store native StarWarsMap units in GM-2, scale in GM-3**)
- Unmatched and conflict counts are exported
- Existing Node suite green

## 10. Foundry gates

None. Catalog may exist on disk unused.

## 11. Blockers

- Required source file missing with no Decision GM-C path
- Merge that overwrites `data/planets.json`

## 12. Rollback

Revert generated `data/galaxymap/*.json` to GM-1 fixtures. Keep conflict reports as evidence.

## 13. Approval gate

Maintainer accepts conflict volume and identity rules before GM-3 georeference.
