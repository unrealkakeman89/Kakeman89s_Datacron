# Galaxy Map GM-6 Plan: Planet Layer

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_6_PLANET_LAYER.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-6 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-6 until authorized. Requires GM-5 shell and GM-3 positions (unplaced worlds skipped).

## 2. Purpose

Render merged planets as dots with zoom LOD/clustering, search, hover name, and click details (name, grid, sector, region, `is_canon`). No AstroCom journal link required.

## 3. Prerequisites

- `planets.v1.json` with parsec `{x,y,z:0}`
- GM-5 camera
- Runtime fetch pattern like `planet-data.js` (`modules/kakeman89s-datacron/data/galaxymap/planets.v1.json`)

## 4. Scope

- Loader with cache/clone (immutable copies; do not mutate fetched JSON)
- Draw placed worlds only (`placementConfidence` not `unplaced`)
- LOD: at low zoom, prefer major worlds (named-lane stops and/or Core/Colonies/Inner Rim) plus clustering; at high zoom, all in-view points
- Search by name (typeahead or filtered list); center camera on match
- Hover label (StarWarsMap hover-in-spirit)
- Click panel: name, grid, sector, region, canon flag, grid coordinate
- Soft validation: homebrew-unlisted worlds are not a GM-6 problem
- Performance budget: pan/zoom remains interactive with ~2k–5k points on the locked Foundry 13 host; if not, clustering is required before shipping GM-8

## 5. Non-goals

- Hyperlanes (GM-7)
- Route pick (GM-9)
- AstroCom UUID journal open (later optional)
- Replacing NavComputer planet picker
- Wiki images

## 6. Locked decisions

- Details are factual fields only; no scraped prose
- Coruscant at origin
- Unplaced worlds omitted from canvas; countable in a debug log at `log`/`warn` level, not a hard crash

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 6.1 | Loader + schema sanity | bad JSON → notice |
| 6.2 | Draw all placed dots | Coruscant, Tatooine, Naboo visible relative to grid |
| 6.3 | LOD/clustering | zoom in reveals more |
| 6.4 | Search + camera center | Tatooine search finds one hit |
| 6.5 | Hover + click panel | fields match JSON |
| 6.6 | Node tests for filter/search/LOD selection | no Foundry |
| 6.7 | Foundry gates | table |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `kakeman89s-datacron/scripts/galaxymap/**` | Loader, render, search |
| `templates/galaxymap.hbs` | Search + detail panel |
| `lang/en.json` | Strings |
| `styles/galaxymap.css` | Dot/label styles |
| Node tests | Search/LOD |
| GM-6 implementation report | Create |

Isolation: do not edit AstroCom packs or NavComputer `planets.json`.

## 9. Node testing

- Search is case-insensitive; unique Tatooine
- Unplaced excluded from render list
- LOD function returns a subset at min zoom and all in-view at max zoom for a fixture
- Loader clones (mutating returned array does not change cache)

## 10. Foundry gates

| Gate | Steps | Expected |
|---|---|---|
| A Load | open Galaxy Map | dots appear; no JPEG |
| B Landmarks | locate Coruscant vs Tatooine | Tatooine is +x/−y relative to origin |
| C Search | type Tatooine | camera centers; detail matches grid R-16 (label authority, not CARTO K/L clash) |
| D Hover | pointer on a dot | name label |
| E Click | click Naboo | sector/region/`is_canon` shown |
| F Unplaced | if any | not drawn; app still opens |
| G Perf | pan at galaxy zoom | no multi-second freeze; if FAIL, clustering required before GM-8 |
| H Isolation | NavComputer planet list still ~2029 from `data/planets.json` | unchanged |

## 11. Blockers

- Fetching planets from the network
- Drawing unplaced worlds at (0,0)

## 12. Rollback

Hide planet layer behind a local flag or revert GM-6 files; keep GM-5 shell.

## 13. Approval gate

Maintainer accepts landmark placement vs grid before GM-7 overlays lanes.
