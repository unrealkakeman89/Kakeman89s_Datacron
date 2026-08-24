# Galaxy Map GM-0 Plan: Inventory, CRS, Provenance, Name Identity

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_0_INVENTORY_CRS_PROVENANCE.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-0 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not treat this file as proof that GM-0 is complete. Do not start GM-0 work until the maintainer separately authorizes this phase.

## 2. Purpose

Produce an evidence pack that later phases can implement against: exact source counts, overlap/conflict matrix, locked CRS, name-identity rules, hop-set compare vs existing `hyperspace-routes.json`, and legal/package gates. No Foundry runtime, no schema files, no merge writer.

## 3. Prerequisites

- Program master accepted.
- Datacron Phase 11 Basic remains in force and is not modified.
- JPEG present at `docs/Galactic Map.jpg` for later GM-3; GM-0 only records that it exists and must stay out of `module.json`.

## 4. Scope

- Census every source listed in program master §5.1.
- Write CRS spec from StarWarsMap constants (program master §6.1).
- Define name/alias matching rules and conflict policy (program master §5.2).
- Compare StarWarsMap consecutive hops to `kakeman89s-datacron/data/hyperspace-routes.json`.
- Record provenance/license evidence already in Phase 2; do not claim new legal conclusions.
- Note that upstream `planets.csv` is not vendored locally (Decision GM-C).

## 5. Non-goals

- Writing `planets.v1.json` / `hyperlanes.v1.json`
- Affine-fitting the JPEG
- Foundry UI
- Enabling NavComputer Advanced
- Vendoring StarWarsMap `map_ui` / Flask
- Scraping Wookieepedia
- Commits, packaging, public distribution
- Rewriting Datacron Phases 0–15

## 6. Locked decisions inherited

Program master §4 and §5.2. CRS origin is Coruscant `[0,0]`, not the JPEG photometric core. Placement authority is cartesian `coords`. Label authority is parzivail/spreadsheet/JPEG.

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 0.1 | File census: module planets, root/parzivail JSON, xlsx, grid_db, regions_db, hyperlanes_db, GeoJSON, aliases, hyperspace-routes, JPEG, CSV present/absent | count table in the GM-0 report |
| 0.2 | Name overlap: exact, alias, unmatched, duplicate-within-source | overlap matrix |
| 0.3 | Grid-label conflicts, especially Coruscant `K-9` vs `L-9` | listed worlds, not “fixed” |
| 0.4 | CRS write-up: `GRID_*`, `GRID_SIDE`, sample coords (Coruscant, Tatooine, Naboo) | matches local `grid_db.json` |
| 0.5 | Hyperlane census: 60 named keys, stop counts, known typos, issue #32 gap | key list |
| 0.6 | Hop-set compare vs `hyperspace-routes.json` | shared / StarWarsMap-only / Datacron-only |
| 0.7 | GeoJSON feature counts: named `properties.hyperspace` vs unnamed | counts |
| 0.8 | Provenance register + package-exclusion list | JPEG/font/Flask/Three excluded |
| 0.9 | GM-0 report under `docs/` | no runtime files changed |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_0_INVENTORY_CRS_PROVENANCE.md` | Create implementation report |
| Optional: `scripts/output/galaxymap-gm0-census.json` | Machine-readable census (not module runtime) |

Do not modify `kakeman89s-datacron/scripts/**`, packs, `module.json`, NavComputer matrix, AstroCom, Shipyard, or `.cursor/`.

## 9. Node / automated checks

If a census script is written, it must be offline `fs` reads. Required assertions if tests are added:

- Local `grid_db.json` Coruscant coords equal `[0, 0]`
- Tatooine coords equal `[644.386, -673.274]`
- `hyperlanes_db.json` has 60 top-level keys
- `module.json` does not list `Galactic Map.jpg`

Do not claim Foundry success from Node.

## 10. Foundry gates

None. GM-0 is documentation and optional Node census. Record NOT APPLICABLE.

## 11. Blockers

- Missing JPEG: GM-3 blocked later; GM-0 still records absence.
- Missing `planets.csv`: Decision GM-C; GM-0 records absence and continues with `grid_db.json`.
- License remains uncleared: does not block GM-0; blocks public package (program master §11).

## 12. Rollback

Delete the GM-0 report and optional census JSON. Do not delete Phase 2 audit evidence.

## 13. Approval gate

Maintainer accepts the CRS spec, authority ranking, and census tables before GM-1.
