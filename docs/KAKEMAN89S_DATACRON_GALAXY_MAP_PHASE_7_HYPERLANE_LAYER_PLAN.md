# Galaxy Map GM-7 Plan: Static Hyperlane Layer

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_7_HYPERLANE_LAYER.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-7 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-7 until authorized. Requires GM-5/GM-6 and GM-4 polylines.

## 2. Purpose

Draw the galaxy’s hyperlane geography (not an A→B route). Named runs use GeoJSON curves when present, else chords. Unnamed traces are a toggleable second layer (Decision GM-B).

## 3. Prerequisites

- `hyperlanes.v1.json` with `displayPolyline` and `displayKind`
- Planet layer for visual context
- Decision GM-B default: unnamed on for GM, off for players

## 4. Scope

- Fetch hyperlanes JSON locally
- Stroke named polylines; major runs (Rimma, Perlemian, Hydian, Corellian Run, Corellian Trade Spine) may be thicker
- Optional `ROUTE_COLOR` as CSS-only styling hint, not a dependency on StarWarsMap JS
- Hover lane name
- Toggles: named lanes, unnamed traces
- LOD: at galaxy zoom, named major runs; at closer zoom, all named; unnamed only when toggle on
- Still not pathfinding

## 5. Non-goals

- Click-two-planets routing (GM-9)
- Changing graph weights or NavComputer Advanced
- JPEG backdrop
- Inventing names for unnamed traces

## 6. Locked decisions

- Unnamed layer stored in GM-4 is displayed per GM-B, not deleted
- Topology is not re-derived in the Foundry client

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 7.1 | Loader | bad JSON notice |
| 7.2 | Named strokes | four major runs visible |
| 7.3 | Chord vs curve both draw | fixture of each kind |
| 7.4 | Unnamed toggle + GM-B defaults | players default off |
| 7.5 | Hover name | label matches `name` |
| 7.6 | Node tests for filter/LOD | |
| 7.7 | Foundry gates | |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `kakeman89s-datacron/scripts/galaxymap/**` | Lane render |
| Template/CSS/i18n | Toggles |
| Settings | Optional unnamed default if not derived from GM/player role |
| GM-7 implementation report | Create |

## 9. Node testing

- Named filter excludes `unnamed: true`
- Major-run id list is explicit and tested
- Empty polyline skipped with warning, no throw

## 10. Foundry gates

| Gate | Steps | Expected |
|---|---|---|
| A Named on | default GM view | lanes visible with planets |
| B Major runs | find Hydian / Perlemian / Rimma / Corellian Run | continuous strokes, not random chords only (unless GM-4 fell back) |
| C Unnamed GM | toggle on | extra traces; issue #32 class if present |
| D Unnamed player | GM-B default | unnamed off until toggled if the control exists |
| E Hover | pointer on Rimma | name shown |
| F Isolation | NavComputer calculate Byss→Abregado-rae still 18 hours | Phase 11 unchanged |

## 11. Blockers

- Client-side NetworkX/Flask
- Drawing JPEG under lanes

## 12. Rollback

Disable lane layer; keep planets.

## 13. Approval gate

This is the last data-display slice before GM-8 closeout. Maintainer accepts geography before calling the map shippable.
