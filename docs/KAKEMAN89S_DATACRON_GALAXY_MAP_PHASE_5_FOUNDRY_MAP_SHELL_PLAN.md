# Galaxy Map GM-5 Plan: Foundry 2D Map Shell

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_5_FOUNDRY_MAP_SHELL.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-5 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-5 until authorized. Data layers may still be empty. GM-1 must exist so the app can fail closed if JSON is missing.

## 2. Purpose

Ship an isolated ApplicationV2 window with a canvas 2D camera (pan, zoom, reset) and an optional vector grid from StarWarsMap `GRID_*` constants. No Leaflet, no Three.js, no StarWarsMap `map_ui`, no new npm packages.

## 3. Prerequisites

- Locked runtime: Foundry 13.351, dnd5e 5.2.5, SW5e 1.4.2, junctions unchanged.
- Decision GM-A default: `featureGalaxyMap` world boolean, default true, `requiresReload: true`.

## 4. Scope

- `kakeman89s-datacron/scripts/galaxymap/galaxymap-app.js` (or equivalent) — ApplicationV2 + HandlebarsApplicationMixin
- `templates/galaxymap.hbs`
- `styles/galaxymap.css` listed in `module.json` `styles`
- Canvas camera: pan (drag), zoom (wheel), reset control
- Optional grid overlay: A–X / 1–22 squares of native side 100, scaled by GM-3 `parsecsPerNativeUnit` if CRS file exists, else draw in native units with a warning
- Scene-control or Datacron hub button in `scripts/main.js` behind `featureGalaxyMap`
- Localization keys under `KAKEMAN89SDATACRON.GalaxyMap.*`
- Logging with module prefix on open/fail
- Empty planet/lane layers (stubs) so GM-6/GM-7 can attach

## 5. Non-goals

- Planet dots (GM-6)
- Hyperlane polylines (GM-7)
- Route highlight (GM-9)
- 3D (GM-10)
- Sockets
- Helper-text campaigns beyond window title and a short empty-state string
- Changing NavComputer scene tool

## 6. Locked UI rules

- CSS only; no animation requirement
- Full window rerender is acceptable for chrome; camera transform must not reload JSON on every pan
- Dark, readable, Star Wars-inspired chrome consistent with existing Datacron CSS variables if present — do not restyle NavComputer
- Do not embed the JPEG as a CSS background

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 5.1 | App class + template + CSS + `module.json` style | module loads |
| 5.2 | Setting `featureGalaxyMap` | false hides control after reload |
| 5.3 | Scene control / hub button | GM open (and players if GM-A default) |
| 5.4 | Canvas pan/zoom/reset | camera changes without fetch |
| 5.5 | Optional vector grid toggle | squares align to Coruscant origin |
| 5.6 | Missing JSON: notice + log, no crash | user-facing notice |
| 5.7 | Node tests for grid math / camera clamp | no Foundry required for math |
| 5.8 | Foundry gates in a disposable world | table in report |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `kakeman89s-datacron/scripts/galaxymap/**` | App + camera + grid math |
| `kakeman89s-datacron/templates/galaxymap.hbs` | Create |
| `kakeman89s-datacron/styles/galaxymap.css` | Create |
| `kakeman89s-datacron/module.json` | Add style; do not add JPEG |
| `kakeman89s-datacron/scripts/main.js` | Feature-gated control |
| `kakeman89s-datacron/scripts/settings.js` | `featureGalaxyMap` |
| `kakeman89s-datacron/lang/en.json` | Galaxy Map strings |
| Node tests | Camera/grid |
| GM-5 implementation report | Create |

Do not modify `scripts/shipyard/**`, `scripts/astrocom/**`, `droid-ally*.js`, or NavComputer matrix.

## 9. Node testing

- Grid cell `L-9` origin at (0,0) in native units
- Grid cell `K-9` origin at (-100, 0)
- Zoom clamp rejects non-finite values
- Existing suite remains green

## 10. Foundry gates

Create or reuse a disposable world dedicated to Galaxy Map when authorized. Do not open valuable worlds.

| Gate | Steps | Expected |
|---|---|---|
| A Environment | Foundry 13.351, dnd5e 5.2.5, SW5e 1.4.2 | versions match |
| B Flag on | `featureGalaxyMap` true | control visible |
| C Flag off | false + reload | control hidden; NavComputer unchanged |
| D GM open | click control | window titled Galaxy Map; canvas present |
| E Pan/zoom/reset | interact | map moves; reset returns start view |
| F Grid toggle | if implemented | squares visible; no JPEG |
| G Missing data | temporarily rename JSON | notice + log; no exception overlay crash |
| H Isolation | open NavComputer / Shipyard / AstroCom | still function |

Record PASS / FAIL / BLOCKED / NOT RUN.

## 11. Blockers

- New npm dependency
- JPEG used as backdrop
- Foundry v14-only Application APIs

## 12. Rollback

Disable `featureGalaxyMap`. Remove new app files. Restore `module.json` styles and `main.js`.

## 13. Approval gate

Maintainer accepts empty-shell Foundry behavior before GM-6 draws thousands of dots.
