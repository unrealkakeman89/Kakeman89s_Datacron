# Galaxy Map GM-4 Plan: Hyperlane Geometry Alignment

- **Date:** 2026-08-18
- **Status:** PLANNING DOCUMENT (controlling implementation specification). Implementation is separately authorized.
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Implementation report (later):** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_4_HYPERLANE_GEOMETRY.md`

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` are append-only historical records. This GM-4 plan lives under `docs/` and is the controlling specification for implementation. Do not rewrite it as an implementation report.

## 1. Planning-only status

Do not start GM-4 until authorized. GM-2 topology and GM-3 CRS/parsec positions must exist.

## 2. Purpose

Attach display polylines to named runs and keep unnamed JPEG traces as a second layer. Topology stays the 60 StarWarsMap ordered lists. Display prefers GeoJSON curves in the cartesian/parsec frame; fallback is StarWarsMap chords through consecutive stop positions.

## 3. Prerequisites

- `hyperlanes.v1.json` with resolved `stopIds`.
- GM-3 GeoJSON → cartesian/parsec transform.
- `hyperspace_singlepart_new.json` local.

## 4. Scope

- For each named `hyperlanes_db` key (after typo normalization), associate GeoJSON features whose `properties.hyperspace` matches.
- Transform those LineString coordinates into parsec `{x,y,z:0}` polylines.
- If no GeoJSON match: `displayKind: chord`, polyline = consecutive stop positions.
- Unnamed GeoJSON features (`hyperspace` null): `unnamed: true` records; do not invent names from Wookieepedia.
- Include issue #32 class coverage: Triton–Xagobah–Kabal–Sharlissia should appear as unnamed or become named only if the maintainer supplies a name — do not scrape.
- Visual overlay vs JPEG for Corellian Run, Hydian Way, Perlemian Trade Route, Rimma Trade Route.
- Output updated `hyperlanes.v1.json`.

## 5. Non-goals

- Pathfinding / GM-9
- Foundry drawing (GM-7)
- Enabling NavComputer Advanced
- Treating chords as inferior to hide them: they are the approved fallback
- Porting geojson-path-finder into Foundry

## 6. Locked decisions

- Topology authority: ordered stops.
- Display authority: GeoJSON curves when associated; else chords.
- Unnamed traces remain a layer (Decision GM-B affects later UI default, not whether GM-4 stores them).
- Do not drop unnamed features because they lack a StarWarsMap key.

## 7. Subphases

| Slice | Purpose | Verify |
|---|---|---|
| 4.1 | Name match GeoJSON `hyperspace` ↔ normalized StarWarsMap keys | unmatched both ways listed |
| 4.2 | Transform named curves to parsec polylines | z=0; finite coords |
| 4.3 | Chord fallback for named runs without GeoJSON | stop count ≥ 2 |
| 4.4 | Unnamed GeoJSON layer + issue #32 check | Triton/Xagobah/Kabal/Sharlissia present or explicitly missing |
| 4.5 | JPEG overlay of four major runs | pixel tolerance vs GM-3 default (20 px) |
| 4.6 | Schema validate + report | Node |

## 8. Files that may change when authorized

| Path | Change |
|---|---|
| `kakeman89s-datacron/data/galaxymap/hyperlanes.v1.json` | Display polylines |
| Offline pipeline scripts | Association + transform |
| `kakeman89s-datacron/data/route-tier-overrides.json` | Read-only optional tier hints; do not require edits |
| GM-4 implementation report | Create |

Do not modify NavComputer matrix or AstroCom packs.

## 9. Node / automated checks

- Every named lane has `displayPolyline.length >= 2` or a documented single-stop exception list (should be empty)
- `unnamed` records do not require `stopIds`
- Normalized names: no `Corellinan Run` as `name` (allowed as `sourceName`)
- Four major runs exist

JPEG overlay is offline evidence.

## 10. Foundry gates

None.

## 11. Blockers

- GeoJSON missing
- Major-run overlay FAIL without addendum
- Associating curves by skipping intermediate StarWarsMap stops (chord shortcuts) — forbidden for topology; display curve may be denser than stops

## 12. Rollback

Restore GM-2 topology-only hyperlanes. Preserve overlay FAIL evidence.

## 13. Approval gate

Maintainer accepts named vs unnamed layer split before GM-7 draws them.
