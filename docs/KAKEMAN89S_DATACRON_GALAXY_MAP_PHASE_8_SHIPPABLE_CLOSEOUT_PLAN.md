# Galaxy Map GM-8 Plan: First Shippable Map Closeout

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_8_SHIPPABLE_CLOSEOUT.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-8 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-8 until GM-5–GM-7 are authorized and their reports exist. GM-8 does not authorize GM-9 or GM-10.

## 2. Purpose

Close the first playable Galaxy Map: permissions, i18n, Node suite, Foundry gates, package exclusion (no JPEG), isolation regression. This is the program’s first shippable slice.

## 3. Prerequisites

- GM-5 shell, GM-6 planets, GM-7 lanes implemented or explicitly waived with addendum.
- Feature flag `featureGalaxyMap` present.

## 4. Scope

- Permissions: Decision GM-A; no sockets
- English localization complete for visible Galaxy Map chrome
- Package exclusion test: `Galactic Map.jpg`, geoTIFF, `STARWARS.TTF`, `map_ui`, Flask trees absent from module directory listed by `module.json`
- Isolation: NavComputer Basic 81-cell behavior, AstroCom packs, Shipyard, Droid Shop unchanged
- Implementation report with every Foundry gate result
- Optional one-line dated addendum on the Galaxy Map master (append-only) when GM-8 execution finishes — not part of this planning assignment

## 5. Non-goals

- Route overlay
- 3D viewer
- Public release / Foundry package publish
- Commit/push unless separately authorized
- Rewriting Datacron Phase 12–15

## 6. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 8.1 | i18n audit of Galaxy Map strings | no required hardcoded English leftovers in new files |
| 8.2 | Permission + flag matrix | GM/player vs flag |
| 8.3 | Package exclusion script or documented path search | JPEG not in module |
| 8.4 | Full Node suite | green vs pre-GM baseline + new tests |
| 8.5 | Foundry gates A–P below | recorded |
| 8.6 | Isolation checklist | other features |
| 8.7 | Implementation report | history preserved |

## 7. Files that may change when authorized

Narrow fixes in Galaxy Map files, `lang/en.json`, `module.json` (styles/esmodules only), tests, GM-8 report. No pack source rewrites. No NavComputer matrix edits.

## 8. Node testing

- CRS + schema + search + lane filter tests from prior phases still pass
- Exclusion: test or script fails if `kakeman89s-datacron/**` contains `Galactic Map.jpg`
- Existing Datacron Node suite remains green

## 9. Foundry gates

Disposable Galaxy Map world. Record PASS / FAIL / BLOCKED / NOT RUN. Do not delete failures.

| Gate | Steps | Expected |
|---|---|---|
| A Environment | versions | Foundry 13.351, dnd5e 5.2.5, SW5e 1.4.2 |
| B Open GM | scene control | Galaxy Map window |
| C Open player | if GM-A default | player can open; no sockets |
| D Flag off | reload | control hidden |
| E No JPEG | inspect canvas/network | no module JPEG request |
| F Planets | search Tatooine | detail panel |
| G Lanes | named runs visible | Hydian/Perlemian/Rimma/Corellian Run |
| H Unnamed | GM toggle | Decision GM-B behavior |
| I Grid | toggle | vector squares; Coruscant origin |
| J Pan/zoom/reset | | camera works |
| K Missing JSON | | notice, no crash |
| L NavComputer | Byss → Abregado-rae | **18** hours; Advanced still off |
| M AstroCom | open a journal pack | packs load |
| N Shipyard | open app | still functions |
| O Droid Shop | open if present | still functions |
| P Shutdown | return Foundry to setup; process stopped | recorded |

## 10. Blockers

- JPEG in module package
- NavComputer hours drift
- Unresolved GM-6 performance FAIL

## 11. Rollback

`featureGalaxyMap` false. Leave data files on disk. Do not delete FAIL evidence.

## 12. Approval gate

Maintainer accepts GM-8 report before any GM-9/GM-10 authorization. This phase does not authorize Git operations.
