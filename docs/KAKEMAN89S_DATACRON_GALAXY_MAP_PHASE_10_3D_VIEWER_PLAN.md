# Galaxy Map GM-10 Plan: 3D Viewer (Later)

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (later phase). Implementation is separately authorized after GM-8 and after an explicit renderer decision.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_10_3D_VIEWER.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-10 plan lives under `docs/` and is the controlling specification for later implementation. Do not rewrite it as an implementation report. Do not treat GM-8 closeout as authorization for this phase.

## 1. Planning-only status

GM-10 is **later**. The first shippable map is 2D. Do not vendor Three.js, React, or StarWarsMap `map_ui` under the current “no new npm packages” rule without a new maintainer decision that amends program master §4.6.

## 2. Purpose

Consume stored `{x,y,z:0}` in a look-down 3D (or 2.5D) viewer. StarWarsMap `map_ui` is the **behavior reference**: `camera.up = (0,0,1)`, camera above the plane, planets at `[x,y]`, hyperlanes with `z = 0`. Do not port that stack.

## 3. Prerequisites

- GM-8 accepted (2D map remains the supported viewer).
- Planet and hyperlane positions already in parsecs with `z = 0`.
- Explicit approval to either (a) keep 2D-only, (b) implement a Foundry canvas 2.5D tilt without new packages, or (c) vendor a named renderer file (not npm install) with license recorded.

## 4. Scope (only after renderer decision)

- Same catalogs as 2D
- Look-down default matching StarWarsMap
- Optional small tilt; `z` still 0 unless a later height source exists
- Do not copy `STARWARS.TTF`
- Do not require Flask

If the renderer decision is **deferred**, GM-10 remains documentation and the 2D app stays canonical.

## 5. Non-goals

- Replacing GM-8 2D as the only supported mode without an addendum
- Non-zero `z` invented from the JPEG
- npm `three` / `@react-three/fiber`
- Porting `map_ui/src/**`

## 6. Locked decisions until amended

- Data already 3D-ready (`z = 0`)
- 2D canvas remains supported
- No new npm packages unless program master §4.6 is amended by dated addendum

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 10.0 | Renderer decision recorded | a, b, or c above |
| 10.1 | Prototype look-down using existing positions | Coruscant origin |
| 10.2 | Planets + lanes | parity with 2D landmarks |
| 10.3 | Optional route highlight if GM-9 exists | |
| 10.4 | Perf budget | same ~2k points |
| 10.5 | Foundry gates | 2D still opens |
| 10.6 | Report | |

Slice 10.0 may conclude **no 3D in this program**. That is a valid close.

## 8. Files that may change when authorized

Only after 10.0: additional `scripts/galaxymap/` viewer, CSS, i18n, tests, report. `module.json` must still exclude JPEG and Star Wars fonts.

## 9. Node testing

- Positions used by 3D equal 2D catalogs (`z === 0`)
- No accidental mutation of planet JSON

## 10. Foundry gates

| Gate | Steps | Expected |
|---|---|---|
| A Decision | read 10.0 | recorded |
| B 2D still works | open Galaxy Map 2D | GM-8 behavior |
| C 3D open | if built | look-down; origin Coruscant |
| D No font theft | package search | no `STARWARS.TTF` |
| E Isolation | NavComputer | unchanged |

If 10.0 is “no 3D”, gates C is NOT APPLICABLE.

## 11. Blockers

- Starting Three/React work without amending the no-npm rule
- Using the JPEG as a 3D texture in the module package

## 12. Rollback

Remove 3D entry point; 2D remains.

## 13. Approval gate

Requires GM-8 plus a written renderer decision. This file does not authorize work.
