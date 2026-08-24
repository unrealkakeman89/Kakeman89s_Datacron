# Galaxy Map GM-3 Plan: Georeference JPEG and Emit 3D Coordinates

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_3_GEOREFERENCE_COORDINATES.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-3 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-3 until authorized. GM-2 catalogs must exist. JPEG remains calibration-only.

## 2. Purpose

Fit StarWarsMap cartesian space to `docs/Galactic Map.jpg` pixels, measure parsecs per `GRID_SIDE`, store `{x,y,z:0}` in the chosen runtime unit, and separately fit GeoJSON lon/lat to the same frame for GM-4. Never copy the JPEG into the module package.

## 3. Prerequisites

- GM-2 planet cartesian positions present for landmarks.
- JPEG at `docs/Galactic Map.jpg`.
- Existing notes in `docs/hyperspace-coordinate-transform.md` may be used; do not ship QGIS outputs.

## 4. Scope

- Control points: Coruscant `[0,0]`, Tatooine `[644.386,-673.274]`, Naboo `[334.442,-707.231]`, plus Corellia, Hoth, Exegol if identifiable on the JPEG.
- Affine or low-order polynomial from cartesian → JPEG pixel. Record residuals.
- Affine GeoJSON lon/lat → cartesian (do not assume CSV WKB equals GeoJSON; Tatooine frames disagree).
- Measure JPEG scale bar (3000 pc / 6000 pc marks) in pixels → parsecs per grid square and per StarWarsMap unit. The ~20 pc/unit figure is a hypothesis until measured.
- Write scaled `{x,y,z:0}` into `planets.v1.json` **or** keep native units plus a `scale` document. **Lock: publish a `galaxymap-crs.v1.json` with `unit: "parsec"`, `origin: "coruscant"`, `metersPerUnit` unused, `parsecsPerNativeUnit` measured, and store planet `position` in parsecs after the measurement.** Native cartesian may remain in a non-runtime sidecar for debugging, not required in Foundry fetch.
- Offline overlay check: project landmark planets onto JPEG; record pixel error. This script/QGIS project is not a module file.

## 5. Non-goals

- Packaging JPEG, geoTIFF, or QGIS project in `kakeman89s-datacron/`
- Foundry UI
- Inventing non-zero `z` from the JPEG (2D source)
- Changing NavComputer hours

## 6. Locked decisions

- Origin remains Coruscant.
- `z = 0`.
- JPEG never listed in `module.json`.
- Two Bernberg frames (cartesian vs GeoJSON lon/lat) are fitted independently.

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 3.1 | Landmarks digitized on JPEG (pixel x,y) | table in report |
| 3.2 | Cartesian → pixel transform + residuals | max residual recorded |
| 3.3 | Scale-bar measurement | parsecsPerNativeUnit |
| 3.4 | GeoJSON → cartesian transform | Tatooine/Coruscant check; must not silently use CSV WKB |
| 3.5 | Write parsec positions + `galaxymap-crs.v1.json` | schema valid |
| 3.6 | Package exclusion: no raster in module tree | path search |
| 3.7 | Implementation report with residual table | FAIL remains visible if over tolerance |

**Pixel tolerance (planning default):** landmark overlay within 20 JPEG pixels on the 10800² map unless GM-0 measures a different resolution. If exceeded, record FAIL and do not silently loosen the gate; addendum required.

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `kakeman89s-datacron/data/galaxymap/planets.v1.json` | Parsec `position` |
| `kakeman89s-datacron/data/galaxymap/crs.v1.json` | Scale and origin |
| `kakeman89s-datacron/data/hyperspace-control-points.json` | Optional refine; do not treat as Foundry runtime |
| `docs/hyperspace-coordinate-transform.md` | Append-only note if needed; do not delete prior QGIS instructions |
| Offline reports under `scripts/output/` | Residuals |
| GM-3 implementation report | Create |

Do not copy JPEG into `kakeman89s-datacron/`.

## 9. Node / automated checks

- Every placed planet has finite `x,y,z` with `z === 0`
- CRS file has measured `parsecsPerNativeUnit`
- Coruscant parsec position is origin `(0,0,0)`
- `module.json` still omits JPEG

Overlay pixel residuals are manual/offline evidence, not Node.

## 10. Foundry gates

None. Optional load of JSON unused.

## 11. Blockers

- JPEG missing
- Residuals worse than tolerance without maintainer addendum
- Attempt to set non-zero `z` from the raster

## 12. Rollback

Restore GM-2 native positions. Keep residual FAIL evidence in the report.

## 13. Approval gate

Maintainer accepts residuals and parsec scale before GM-4 curve fitting.
