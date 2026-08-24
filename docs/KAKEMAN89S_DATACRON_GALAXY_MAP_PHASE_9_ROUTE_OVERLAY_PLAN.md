# Galaxy Map GM-9 Plan: Route Overlay (Later)

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (later phase). Implementation is separately authorized after GM-8.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_9_ROUTE_OVERLAY.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-9 plan lives under `docs/` and is the controlling specification for later implementation. Do not rewrite it as an implementation report. Do not treat GM-8 closeout as authorization for this phase.

## 1. Planning-only status

GM-9 is **later**. Do not implement during the first shippable map. Do not enable NavComputer Advanced UI as a shortcut.

## 2. Purpose

Let a user click origin then destination (StarWarsMap `eventHandler` behavior) and highlight the computed path on the 2D map.

## 3. Prerequisites

- GM-8 accepted.
- GM-0 hop-set compare vs `kakeman89s-datacron/data/hyperspace-routes.json`.
- StarWarsMap algorithm (program master §6.3): consecutive named hops; off-lane connectors within `GRID_SIDE` with `NO_HYPERLANE_DISTANCE_FACTOR = 1000`; last-resort and component connectors.

## 4. Scope

- Selection: two planets from search or map clicks; third click clears
- Path compute **offline-authored into local JSON** or in-module Dijkstra on the already-local edge list — not Flask, not NetworkX, not geojson-path-finder npm
- Prefer existing `hyperspace-routes.json` if GM-0 showed equivalent topology; else offline pipeline emits `galaxymap/routes.v1.json` using `edge_generator.py` logic reimplemented in the pipeline language already used
- Highlight path polyline on the canvas; list hop names
- Unmapped/synthetic hops must be labeled as such (Datacron already tags `essentialConnectivity` / `syntheticHop`)
- Soft-fail: no path → notice, map still usable

## 5. Non-goals

- Changing Phase 11 81-cell Basic hours
- Enabling Advanced NavComputer calculator UI
- RAW travel-time from path length
- Era filters, hazards
- Live calls to Sigon’s demo or CARTO
- Porting React Three click camera

## 6. Locked decisions

- Visualization only unless a later NavComputer phase is separately authorized to consume the same graph
- Penalized connectors remain visually distinct from named hyperlanes
- Sigon article is method reference (Dijkstra), not a runtime dependency

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 9.1 | Confirm edge list source (existing JSON vs rebuild) | GM-0 table cited |
| 9.2 | Path function on local edges | Coruscant→Tatooine exists; Coruscant→Exegol documented |
| 9.3 | Click/search selection UX | two worlds |
| 9.4 | Canvas highlight + hop list | synthetic hops named |
| 9.5 | No-path notice | isolated fixture |
| 9.6 | Node path tests | nonnegative weights |
| 9.7 | Foundry gates | after 9.6 |

## 8. Files that may change when authorized

Galaxy Map scripts/templates, optional `data/galaxymap/routes.v1.json`, tests, GM-9 report. Do not edit `region-travel-matrix.v1.json`. Do not turn on Advanced settings `config: true`.

## 9. Node testing

- Consecutive Corellian Run hops preferred over a 1000× off-lane chord when both exist
- No negative weights
- Missing world → empty path + reason
- Fixture: Coruscant–Jakku or Coruscant–Tatooine documented

## 10. Foundry gates

| Gate | Steps | Expected |
|---|---|---|
| A Select two | Coruscant then Tatooine | highlight appears |
| B Clear | third click or clear control | highlight gone |
| C Named vs synthetic | a path that needs a connector | connector styled/labeled differently |
| D No path | if a fixture exists | notice |
| E NavComputer | still Basic 18/24 Deep Core/Core | unchanged |
| F Advanced UI | | still not offered |

## 11. Blockers

- Implementing pathfinding by enabling NavComputer Advanced
- Adding npm `geojson-path-finder` / NetworkX in Foundry

## 12. Rollback

Hide route UI; keep GM-8 map.

## 13. Approval gate

Separate maintainer authorization after GM-8. This file does not authorize work.
