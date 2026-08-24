# Galaxy Map GM-1 Plan: Canonical Schemas

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_1_CANONICAL_SCHEMAS.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-1 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-1 until the maintainer authorizes this phase. GM-0 census should be accepted first unless the maintainer explicitly allows schema work in parallel with an incomplete census.

## 2. Purpose

Define versioned JSON contracts for Galaxy Map runtime data so GM-2–GM-7 write and read one shape. Empty or fixture documents are allowed. Full merged catalogs are GM-2+.

## 3. Prerequisites

- Program master accepted.
- GM-0 CRS and authority ranking accepted (or maintainer waiver recorded).

## 4. Scope

Create under `kakeman89s-datacron/data/galaxymap/`:

- `planets.v1.schema.json` (or equivalent schema file)
- `hyperlanes.v1.schema.json`
- Fixture `planets.v1.json` / `hyperlanes.v1.json` with a small locked set (Coruscant, Tatooine, Naboo, and one named lane) **or** empty arrays that still validate
- Node validators

Do not replace `kakeman89s-datacron/data/planets.json`.

## 5. Non-goals

- Merge pipeline
- JPEG georeference
- Foundry ApplicationV2
- Filling all ~2k worlds
- NavComputer matrix changes
- Wiki prose in records

## 6. Locked schema requirements

### 6.1 Planet record

Required fields:

| Field | Rule |
|---|---|
| `stableId` | String; stable across rebuilds; not a Foundry UUID requirement in GM-1 |
| `name` | Display name |
| `aliases` | Array of strings; may be empty |
| `grid` | String or null |
| `sector` | String or null |
| `region` | String or null |
| `isCanon` | Boolean or null |
| `position` | `{x, y, z}` numbers; `z` default 0 |
| `placementConfidence` | Enum: `cartesian` \| `subgrid-fallback` \| `unplaced` |
| `sources` | Array of source ids only (e.g. `starwarsmap-grid-db`, `parzivail`, `module-planets`) |

No copyrighted descriptions. No Wookieepedia article text. No image filenames that imply wiki ingest.

### 6.2 Hyperlane record

| Field | Rule |
|---|---|
| `stableId` | String |
| `name` | Display name after Datacron typo normalization |
| `sourceName` | Original key if different (`Corellinan Run`) |
| `classification` | Optional string |
| `tier` | Optional number |
| `stopIds` | Ordered `stableId` list; empty only for unnamed traces |
| `displayPolyline` | Array of `{x,y,z}` |
| `displayKind` | `geojson-curve` \| `chord` \| `unnamed-geojson` |
| `geometryConfidence` | Enum |
| `unnamed` | Boolean (issue #32 class) |

### 6.3 Document envelope

Each file includes `profileId` (`galaxymap-planets.v1` / `galaxymap-hyperlanes.v1`), `generatedAt` optional, and `authority` `unverified` until a later rights decision.

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 1.1 | Schema files | required fields reject missing `position` / `stopIds` types |
| 1.2 | Fixtures: Coruscant `{0,0,0}`-frame example; Tatooine sample coords allowed as placeholders until GM-3 | Node parse |
| 1.3 | Validator module usable from Node without Foundry | `npm test` includes new file |
| 1.4 | Confirm `module.json` does not need to list JSON (Foundry fetch by path is enough, same as `planets.json`) | no manifest schema error |
| 1.5 | Implementation report | no other feature areas touched |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `kakeman89s-datacron/data/galaxymap/**` | Create schema + fixtures |
| `kakeman89s-datacron/scripts/galaxymap/schema.js` (or similar) | Validator |
| `kakeman89s-datacron/scripts/galaxymap/tests/galaxymap-phase1.test.js` | Node tests |
| `package.json` | Add test file to `test` script if required by repo convention |
| GM-1 implementation report under `docs/` | Create |

Do not modify AstroCom, Shipyard, Droid Shop, NavComputer matrix, or `.cursor/`.

## 9. Node testing

- Valid fixture passes
- Missing `position.x` fails
- `unnamed: true` may have empty `stopIds`
- Named lane with empty `stopIds` fails
- `z` omitted is invalid unless schema explicitly defaults it; prefer required `z` with 0
- Existing Node suite remains green

Do not apply ECC 80% coverage as a gate.

## 10. Foundry gates

None required. Optional: module still loads with new JSON unused. Record NOT RUN unless GM-1 authorization includes a load check.

## 11. Blockers

- Schema that would force replacing NavComputer `planets.json`
- Fields that embed wiki prose

## 12. Rollback

Delete `kakeman89s-datacron/data/galaxymap/` and the new test/validator files. Restore `package.json` test script if changed.

## 13. Approval gate

Maintainer accepts field lists before GM-2 writes real catalogs.
