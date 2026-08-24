# Kakeman89s Datacron — Galaxy Map GM-0 Inventory, CRS, Provenance

- **Document title:** GM-0 — Inventory, CRS, provenance, name identity
- **Date:** 2026-08-18
- **Status:** COMPLETE for the authorized census/evidence pack. GM-1 was not started. Foundry gates are NOT APPLICABLE.
- **Authoritative plan:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_PHASE_0_INVENTORY_CRS_PROVENANCE_PLAN.md` (not rewritten)
- **Program master:** `docs/KAKEMAN89S_DATACRON_GALAXY_MAP_ROADMAP.md`
- **Machine-readable census:** `scripts/output/galaxymap-gm0-census.json`
- **Branch:** `v.next`
- **HEAD at report time:** `c2271d3fb0ebf3f6d0783e8a972554fa413e9a7f` (unchanged; no commit)
- **Attribution:** Kakeman89

SESSION DOCUMENT PROTECTION: Files under `ai/sessions/**` were not modified. The GM-0 plan was not rewritten. This file is a new implementation record.

## 1. Authorization

Executed against the approved GM-0 plan and the execute-census plan. Offline source census, CRS lock, name/grid/hop compares, provenance register, Node assertions, and this report.

Authorized: repository preflight; read-only file census; Node census script outside `kakeman89s-datacron/scripts/**`; census JSON under `scripts/output/`; GM-0 tests wired into root `package.json`; this report.

Not authorized / not performed: GM-1 schemas; `data/galaxymap/*.v1.json`; JPEG affine; Foundry UI; Wookieepedia scrape; graph regeneration; NavComputer / AstroCom / Shipyard / Droid changes; pack edits; `module.json` edits; NavComputer matrix edits; `.cursor/` edits; GM-0 plan rewrite; Datacron Phases 0–15 body edits; commit; push; merge; rebase; PR; tag; package; release.

## 2. Preflight / implementation baseline

| Item | Value |
| --- | --- |
| Repository root | `C:\Users\ckauble\OneDrive - Riverside Bank of Dublin\Documents\GitHub\Kakeman89s_Datacron` |
| Branch | `v.next` tracking `origin/v.next` |
| HEAD | `c2271d3fb0ebf3f6d0783e8a972554fa413e9a7f` (`Update .gitignore`) |
| Ahead / behind | 2 / 0 |
| Staged | none |
| Node at GM-0 start | existing suite (Phase 11 close **242/242**) |
| Node at GM-0 close | **247/247** |
| GM-0 plan | not rewritten |
| `.cursor/` | not modified |
| `kakeman89s-datacron/scripts/**` | not modified |
| `module.json` | read only; JPEG not listed |
| SW5e `module.json` version | remains `#{VERSION}#` (not treated as a defect) |

HEAD was not reset, cleaned, stashed, restored, or discarded. Existing unstaged `docs/KAKEMAN89S_DATACRON_ROADMAP.md` from prior Galaxy Map planning was left untouched.

## 3. Slice table

| Slice | Purpose | Result |
| --- | --- | --- |
| 0.1 | File census | See §4. `planets.csv` absent (Decision GM-C). JPEG and xlsx present under `docs/`. |
| 0.2 | Name overlap | See §5. Alias `Kailor V` → `Kailor` only. Names were not rewritten. |
| 0.3 | Grid conflicts | 76 overlapping-name grid disagreements. Coruscant `K-9` (StarWarsMap) vs `L-9` (module/parzivail) recorded, not fixed. |
| 0.4 | CRS | Locked constants copied; live `grid_db.json` matches Coruscant `[0, 0]`, Tatooine `[644.386, -673.274]`, Naboo `[334.442, -707.231]`. Parsec scale unmeasured (GM-3). |
| 0.5 | Hyperlanes | 60 keys. Known typos present. Issue #32 sequence not in `hyperlanes_db.json`. Vendored copy equals map_api copy. |
| 0.6 | Hop-set compare | Shared **756**. StarWarsMap-only **0**. Datacron-only **1338**. Graph not regenerated. |
| 0.7 | GeoJSON | 1574 features; 1089 named `properties.hyperspace`; 485 unnamed. |
| 0.8 | Provenance / package exclusion | Phase 2 evidence restated. JPEG/font/Flask/Three absent from module tree and `module.json`. |
| 0.9 | This report | New file only. Foundry NOT APPLICABLE. GM-1 not started. |

## 4. Slice 0.1 — File census

| Source | Path | Present | Bytes | Records |
| --- | --- | --- | --- | --- |
| Module planets | `kakeman89s-datacron/data/planets.json` (`name`) | yes | 228435 | 2029 rows (2028 unique names) |
| Root/parzivail | `planets.json` (`Name`) | yes | 2568743 | 5444 rows (5442 unique names) |
| Spreadsheet | `docs/Star Wars Galaxy Map Grid Coordinates.xlsx` | yes | 61530 | sheet `planets`; 2022 data rows; headers Planet / Grid / Sector / Region |
| Grid | `StarWarsMap/map_api/data/grid_db.json` | yes | 370010 | 2048 planets in 240 cells |
| Regions | `StarWarsMap/map_api/data/regions_db.json` | yes | 444245 | 2048 planets; 10 regions; 405 sectors |
| Hyperlanes | `StarWarsMap/map_api/data/hyperlanes_db.json` | yes | 18552 | 60 named keys |
| Vendored hyperlanes | `kakeman89s-datacron/data/starwarsmap/hyperlanes_db.json` | yes | 18552 | identical to map_api copy (`JSON.stringify` equal) |
| GeoJSON | `hyperspace_singlepart_new.json` | yes | 1207475 | 1574 features |
| Aliases | `kakeman89s-datacron/data/starwarsmap/planet-name-aliases.json` | yes | 152 | `Kailor V` → `Kailor` |
| Graph | `kakeman89s-datacron/data/hyperspace-routes.json` | yes | 626854 | 2094 `from`/`to`/`name` edges |
| JPEG | `docs/Galactic Map.jpg` | yes | 37878510 | calibration asset; not parsed |
| CSV | `StarWarsMap/map_api/data/planets.csv` | **no** | — | expected absent (Decision GM-C); continue with `grid_db.json` |

xlsx was not parsed in Node (no new npm package). Sheet inventory used in-repo Python `openpyxl` (`scripts/merge-planet-data.py` already depends on it). Local `StarWarsMap/` contains only the three `map_api/data/*_db.json` files; `constants.py` is not present in this clone. CRS constants below are copied from the program master citation of that file and then checked against live `grid_db.json`.

## 5. Slice 0.2 — Name overlap

Matching rule: trim + casefold. StarWarsMap labels also apply the alias table. Names were counted, not corrected.

### In-source duplicates

| Source | Duplicate folded names |
| --- | --- |
| Module planets | `noe'ha'on` ×2 |
| Parzivail | `abregado-rae` ×2, `n'zoth` ×2 |
| `grid_db` / `regions_db` | none |
| xlsx | `noe'ha'on` ×2 |

### Pairwise overlap

| Pair | Exact | Alias-only | Left-only | Right-only |
| --- | --- | --- | --- | --- |
| Module vs `grid_db` | 2019 | 1 (`Kailor V` → `Kailor`) | 8 | 28 |
| Module vs parzivail | 1588 | 1 (`Kailor V` → `Kailor`) | 439 | 3853 |
| Parzivail vs `grid_db` | 1608 | 0 | 3834 | 440 |
| Module vs xlsx | 2021 | 0 | 7 | 0 |

Module-only vs `grid_db` (not fixed): Brentaal IV, Cyax, Froz, Mandalore & Concordia, Onderon, Parcelus Minor, Shwuy, Yavin 4.

`grid_db`-only sample: Ajan Kloss, Altyr V, Argul, Batuu, Bedlam, Parcellus Minor (spelling vs module Parcelus Minor), and 22 others in the census JSON.

Module-only vs xlsx: Brentaal IV, Exegol, Froz, Mandalore, Onderon, Shwuy, Yavin 4.

## 6. Slice 0.3 — Grid conflicts

Overlapping names whose normalized grid strings disagree: **76**. No grids were rewritten.

Recorded family conflict (not a bugfix):

| World | Module | StarWarsMap | Parzivail | xlsx |
| --- | --- | --- | --- | --- |
| Coruscant | **L-9** | **K-9** | **L-9** | (empty cell) |

Module vs StarWarsMap disagreements (placement-label clash set, including three-way rows):

| World | Module | StarWarsMap | Parzivail | xlsx |
| --- | --- | --- | --- | --- |
| Coruscant | L-9 | K-9 | L-9 | (empty) |
| Andelm IV | Q-19 | O-19 | H-7 | Q-19 |
| Exegol | V-18 | F-7 | — | — |
| Foerost | L-10 | K-10 | — | — |
| Iope | L-10 | U-12 | — | — |
| Mandalore | R-9 | O-7 | O-7 | (empty) |
| Troiken | S-4 | S-5 | S-5 | S-4 |

The remaining 69 rows are module/xlsx/StarWarsMap agreeing after hyphen normalization, with parzivail `Coord` disagreeing (examples: Abbaji H-16 vs J-4; Lothal U-7 vs I-14; Ahch-To E-13 vs Q-16). Full list: `scripts/output/galaxymap-gm0-census.json` → `gridConflicts.all`.

Authority reminder (program master §5.2): cartesian `coords` place the dot; parzivail/spreadsheet/JPEG own the **label**. Coruscant coords sit at `[0, 0]` on the shared K-9/L-9 corner.

## 7. Slice 0.4 — CRS (locked)

Copied from program master §6.1 / StarWarsMap `map_api/app/constants.py` (file not in this clone):

```text
GRID_ALPHABET_TRANSFORM: A–X → −11 … +12
GRID_NUMBER_TRANSFORM:   1–22 → +8 … −13   (row 1 is +Y / north)
GRID_SIDE = 100
```

| Lock | Value | Live `grid_db.json` |
| --- | --- | --- |
| Origin world | Coruscant, not the JPEG photometric core | Coruscant `[0, 0]` **match** |
| Tatooine | `[644.386, -673.274]` | **match** |
| Naboo | `[334.442, -707.231]` | **match** |
| Stored z | `0` | n/a (2D source) |
| Parsec scale | unmeasured | deferred to GM-3 (~20 pc/unit remains a hypothesis) |

Cell reminder: L-9 covers `[0,100] × [0,100]`; K-9 covers `[-100,0] × [0,100]`. Origin is the shared corner.

Cartesian `coords` and GeoJSON lon/lat remain two Bernberg-family frames. GM-0 did not affine-fit the JPEG.

## 8. Slice 0.5 — Hyperlanes

`hyperlanes_db.json` has **60** top-level keys. Vendored module copy matches. Graph was not regenerated.

Known typos present as keys (not renamed here):

| Key as stored | Normalized spelling used for hop identity |
| --- | --- |
| Corellinan Run | Corellian Run (37 stops) |
| Way Of Schesa | Way of Schesa (5 stops) |
| Path Of The Houses | Path of the Houses (11 stops) |

Upstream issue #32 (Triton–Xagobah–Kabal–Sharlissia): consecutive sequence **not** in any hyperlane list. Name presence: Triton yes (Rimma Trade Route), Kabal yes, Xagobah **no**, Sharlissia **no**.

### Stop counts (all 60)

| Route key | Stops |
| --- | --- |
| Ado Spine | 10 |
| Ansion Spur | 7 |
| Bothan Run | 5 |
| Byss Run | 8 |
| Celanon Spur | 18 |
| Cerean Reach | 12 |
| Commenor Run | 10 |
| Corellian Trade Spine | 56 |
| Corellinan Run | 37 |
| D'aelgoth Trade Route | 31 |
| Duros Space Run | 5 |
| Elgit-M'Hanna Corridor | 3 |
| Enarc Run | 7 |
| Entralla Route | 16 |
| Fedalle Run | 4 |
| Great Gran Run | 10 |
| Great Kashyyyk Branch | 8 |
| Guu Run | 4 |
| Hapan Spine | 4 |
| Harrin Trade Corridor | 15 |
| Hydian Way | 86 |
| Kegan Run | 6 |
| Kessel Run | 3 |
| Koda Spur | 10 |
| Lesser Lantillian Route | 23 |
| Lipsec Run | 11 |
| Listehol Run | 5 |
| Llanic Spice Run | 17 |
| Lorell Route | 8 |
| Namadii Corridor | 23 |
| Nanth'ri Route | 9 |
| Nothoiin Corridor | 2 |
| Ootmian Pabol | 8 |
| Overic Griplink | 10 |
| Pabol Hutta | 8 |
| Pabol Sleheyron | 16 |
| Path Of The Houses | 11 |
| Perlemian Trade Route | 56 |
| Quellor Run | 9 |
| Randon Run | 8 |
| Reena Trade Route | 7 |
| Rimma Trade Route | 31 |
| Rynmar Trail | 5 |
| Salin Corridor | 6 |
| Sanrafsix Corridor | 9 |
| Shag Pabol | 8 |
| Shaltin Tunnels | 14 |
| Shipwrights' Trace | 8 |
| Shiritoku Way | 5 |
| Shwuy Exchange | 6 |
| Spar Trade Route | 13 |
| Terr'Skiar Pass | 3 |
| Trax Tube | 7 |
| Trellen Trade Route | 8 |
| Trellent Trade Route | 3 |
| Triellus Trade Route | 42 |
| Triellus Trade Run | 11 |
| Varl Run | 11 |
| Veragi Trade Route | 17 |
| Way Of Schesa | 5 |

## 9. Slice 0.6 — Hop-set compare

Undirected identity: `{sorted(alias-normalized from, to), normalizeRouteName(route)}`. Consecutive StarWarsMap stops vs existing `hyperspace-routes.json` edges. The graph was **not** regenerated.

| Set | Count |
| --- | --- |
| StarWarsMap unique hops | 756 |
| Datacron unique hops | 2094 |
| Shared | **756** |
| StarWarsMap-only | **0** |
| Datacron-only | **1338** |

Every StarWarsMap consecutive hop is already present in Datacron after alias + route-name normalization.

Datacron-only hops by stored `name` (15 distinct labels):

| `hyperspace-routes.json` name | Count |
| --- | --- |
| Transit corridor (unmapped) | 1288 |
| Regional connector | 17 |
| Namadii Corridor | 9 |
| Perlimian Trade Route | 5 |
| Chasdemonus Route | 3 |
| Corellian Run | 3 |
| Perlemian Trade Route | 3 |
| Gamor Run | 2 |
| Rimma Trade Route | 2 |
| Corellian Trade Spine | 1 |
| Etti Route Major | 1 |
| Hydian Way | 1 |
| Lesser Lantiillian Route | 1 |
| Pando Spur | 1 |
| Pobol Kreeta | 1 |

`syntheticHop` / `essentialConnectivity` on the 2094 Datacron edges:

| Field | true | false | missing |
| --- | --- | --- | --- |
| `syntheticHop` | 1288 | 11 | 795 |
| `essentialConnectivity` | 1305 | 11 | 778 |

`syntheticHop: true` (1288) matches the unmapped transit-corridor extras. GM-0 did not treat those as defects and did not rewrite the graph.

## 10. Slice 0.7 — GeoJSON

File: `hyperspace_singlepart_new.json` (`FeatureCollection`, CRS84).

| Measure | Count |
| --- | --- |
| Features | 1574 |
| `properties.hyperspace` non-null / non-empty | 1089 |
| unnamed (`null` or blank) | 485 |
| Distinct named lane strings | 125 |

Named strings include the StarWarsMap 60-set plus additional GeoJSON-only labels (examples: Falko Run, Hollastin Run, Relgim Run, `connect`). Spelling variants exist (`Lesser Lantiillian Route` vs `Lesser Lantillian Route`; `Perlimian Trade Route` vs Perlemian). GM-0 recorded them; it did not merge them.

## 11. Slice 0.8 — Provenance and package exclusion

Restated from `docs/KAKEMAN89S_DATACRON_PHASE_2_LICENSING_PROVENANCE_AUDIT.md` and program master §4. This report is not legal advice and does not add a new rights conclusion.

| Item | Phase 2 / program-master evidence |
| --- | --- |
| Wason1797/StarWarsMap | GitHub `license: null`. No SPDX in-tree. |
| swgalaxymap.com full-resolution maps | Documented **personal use only**. |
| CARTO planets table | Henry Bernberg. CSV not vendored locally (Decision GM-C). |
| `Galactic Map.jpg` | No EXIF/rights metadata; not matched to a published map; **do not ship**. Now at `docs/Galactic Map.jpg` (37,878,510 bytes). |
| Module GPL-3 | Does not license datasets or raster art. |

Package-exclusion assertions (GM-0):

| Check | Result |
| --- | --- |
| `kakeman89s-datacron/module.json` lists `Galactic Map.jpg` | **no** |
| `Galactic Map.jpg` inside `kakeman89s-datacron/` | **absent** |
| geoTIFF (`.tif` / `.tiff` / `.geotiff`) inside module tree | **absent** |
| `STARWARS.TTF` inside module tree | **absent** |
| Flask / React / Three / `map_ui` trees inside module tree | **absent** |

Private-table merge remains blocked for public packaging until licenses are cleared. That does not block this census.

## 12. Foundry gates

**NOT APPLICABLE.** GM-0 is documentation plus an offline Node census. No Foundry launch, world open, UI, or runtime file change.

Do not claim Foundry success from Node.

## 13. Node results

Required assertions from GM-0 plan §9, all passing:

| Assertion | Result |
| --- | --- |
| `grid_db.json` Coruscant coords `[0, 0]` | PASS |
| Tatooine coords `[644.386, -673.274]` | PASS |
| `hyperlanes_db.json` has 60 top-level keys | PASS |
| `module.json` does not list `Galactic Map.jpg` | PASS |

`npm test`: **247/247** (prior suite plus 5 GM-0 tests). ECC 80% coverage was not applied as a gate.

Census writer: `scripts/galaxymap/census-gm0.js` (repo-root, `fs` reads only). Tests: `scripts/galaxymap/tests/galaxymap-gm0.test.js`.

## 14. Isolation

Not modified:

- `kakeman89s-datacron/scripts/**`
- packs
- `module.json` (read only)
- `data/navcomputer/region-travel-matrix.v1.json`
- `.cursor/`
- the GM-0 **plan** file
- Datacron Phases 0–15 body text
- `data/galaxymap/*.v1.json` (not created)

## 15. Files

**Created:**

- `scripts/galaxymap/census-gm0.js`
- `scripts/galaxymap/tests/galaxymap-gm0.test.js`
- `scripts/output/galaxymap-gm0-census.json`
- this report

**Modified:**

- `package.json` (`test` script appends the GM-0 test file only)

## 16. Verification summary

1. **Files changed:** repo-root Galaxy Map census script/test, census JSON, this report, `package.json` test entry.
2. **Behavior changed:** none at Foundry runtime. NavComputer, AstroCom, Shipyard, and Droid Shop are unchanged.
3. **Tested:** Node 247/247 including Coruscant/Tatooine coords, 60 hyperlane keys, JPEG exclusion, census JSON write.
4. **Could not be tested:** Foundry (not in scope). xlsx was not parsed in Node; Python/openpyxl sheet inventory only. `constants.py` is not in the local StarWarsMap tree.
5. **Manual Foundry steps:** none. GM-0 has no UI.
6. **Known risks:** name/grid disagreements are recorded, not resolved. JPEG and StarWarsMap data remain uncleared for public packaging. Parsec scale is unmeasured until GM-3.
7. **Recommended next step:** maintainer accepts the CRS spec, authority ranking, and census tables in this report, then separately authorizes GM-1 schemas.

## 17. Confirmations

- GM-1 was not started.
- No `data/galaxymap/*.v1.json` files were written.
- The JPEG was not copied into the module tree or `module.json`.
- `hyperspace-routes.json` was not regenerated.
- Foundry was not launched.
- No commit, push, or PR.
